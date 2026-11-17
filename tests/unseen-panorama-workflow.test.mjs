import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {frozenInputs,promptForSource,prepare,status,check,renderChecked} from "../evals/unseen-panorama-workflow.mjs";

const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const git=(dir,...args)=>{
 const r=spawnSync("git",["-C",dir,...args],{encoding:"utf8",timeout:12000});
 assert.equal(r.status,0,r.stderr);return r.stdout.trim();
};
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"genui-p1-fixture-"));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const repo="demo-source",dir=path.join(root,repo);fs.mkdirSync(dir);
 git(dir,"init","-q");
 const body="# 测试项目\n输入来源必须记录\n审批后生成可复查证据\n没有常驻数据库或后台服务\n";
 fs.writeFileSync(path.join(dir,"README.md"),body);
 git(dir,"add","README.md");git(dir,"-c","user.name=Local Test","-c","user.email=test@example.invalid","commit","-qm","init: 初始化冻结测试来源\n\n泛化评测\n\nGEN-UI");
 const commit=git(dir,"rev-parse","HEAD");
 const blob=spawnSync("git",["-C",dir,"show",commit+":README.md"]).stdout;
 const entry={id:repo,repo,commit,
   sources:[{file:"README.md",sha256:sha(blob),bytes:blob.length}],
   anchors:[{file:"README.md",quote:"输入来源必须记录"},{file:"README.md",quote:"审批后生成可复查证据"}],
   forbiddenAssumptions:["已上线生产服务"]};
 const manifest={schema:"genui-unseen-panorama/v1",cases:[entry]};
 const out=path.join(root,"output");
 const ev=x=>[{file:"README.md",quote:x}];
 const response={schema:"genui-panorama-candidate/v1",cases:[{
  id:repo,status:"documented",notes:"仅文档流程，不声称实际部署",
  layers:[{title:"来源记录",modules:[{id:"source",title:"<img src=x onerror=alert(1)>",evidence:ev("输入来源必须记录")}]},
          {title:"审查与留痕",modules:[{id:"review",title:"审批证据记录",evidence:ev("审批后生成可复查证据")}]}],
  relations:[{from:"source",to:"review",type:"depends",evidence:ev("审批后生成可复查证据")}]
 }]};
 return {root,dir,manifest,entry,out,response};
}
test("冻结 Git 来源校验后只准备配对提示，绝不调用模型",t=>{
 const x=fixture(t);
 assert.equal(frozenInputs(x.manifest,x.root).length,1);
 const plan=prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 assert.equal(plan.modelRunsVerified,0);assert.equal(plan.skillActivationsVerified,0);
 const normal=fs.readFileSync(path.join(x.out,x.entry.id,"baseline.prompt.md"),"utf8");
 const explicit=fs.readFileSync(path.join(x.out,x.entry.id,"explicit.prompt.md"),"utf8");
 assert.equal(explicit,"$gen-ui\n"+normal);
 assert.match(normal,/输入来源必须记录/);
 assert.equal(status(x.manifest,x.out).rows.filter(a=>a.state==="not_run").length,2);
 assert.throws(()=>prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out}),/refusing overwrite/);
});
test("冻结 SHA/必需来源片段错误一律阻断，不把仓库工作区改动作为真源",t=>{
 const x=fixture(t),mut=structuredClone(x.manifest);
 mut.cases[0].sources[0].sha256="0".repeat(64);
 assert.throws(()=>frozenInputs(mut,x.root),/fingerprint mismatch/);
 const miss=structuredClone(x.manifest);
 miss.cases[0].anchors[0].quote="并不存在的事实依据";
 assert.throws(()=>frozenInputs(miss,x.root),/boundary missing/);
});
test("候选文件不存在、身份错误时仍是未运行/阻断，不能假绿",t=>{
 const x=fixture(t);prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 assert.throws(()=>check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"explicit"}),/NOT_RUN/);
 const file=path.join(x.out,x.entry.id,"explicit.candidate.json");
 const wrong=structuredClone(x.response);wrong.cases[0].id="someone-else";fs.writeFileSync(file,JSON.stringify(wrong));
 assert.throws(()=>check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"explicit"}),/Invalid single-case/);
});
test("离线结构核验后才渲染，用户文本 HTML 转义，图只在容器内滚动",t=>{
 const x=fixture(t);prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 fs.writeFileSync(path.join(x.out,x.entry.id,"explicit.candidate.json"),JSON.stringify(x.response));
 const scored=check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"explicit"});
 assert.equal(scored.result.status,"STRUCTURAL_PASS_SEMANTIC_UNVERIFIED");
 assert.equal(scored.result.modelRunsVerified,0);
 const result=renderChecked({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"explicit"});
 assert.equal(result.outputs.length,1);
 const html=fs.readFileSync(result.outputs[0].file,"utf8");
 assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.doesNotMatch(html,/<img src=x onerror|<script\b|https?:\/\//i);
 assert.match(html,/#3a83f7/i);
 assert.match(html,/class="panorama-scroll"/);
 assert.match(html,/逐字|引用证据|引用来源|引用|证据/);
 assert.match(html,/结构校验不代表真实模型执行/);
});
test("造假关系和上线状态被现有门禁挡住，禁止渲染错误数据",t=>{
 const x=fixture(t);prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 const wrong=structuredClone(x.response);
 wrong.cases[0].relations[0].evidence[0].quote="不存在的引文";
 const f=path.join(x.out,x.entry.id,"explicit.candidate.json");fs.writeFileSync(f,JSON.stringify(wrong));
 const rejected=renderChecked({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"explicit"});
 assert.equal(rejected.result.status,"BLOCKED");assert.equal(rejected.outputs.length,0);
 wrong.cases[0].relations[0].evidence[0].quote="审批后生成可复查证据";
 wrong.cases[0].status="deployed";fs.writeFileSync(f,JSON.stringify(wrong));
 assert.equal(check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"explicit"}).result.status,"BLOCKED");
});
