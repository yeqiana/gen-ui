import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {frozenInputs,promptForSource,prepare,status,check,renderChecked} from "../evals/unseen-panorama-workflow.mjs";
import {prepareEvidenceIds} from "../evals/unseen-panorama-workflow.mjs";
import {evidenceCatalogue,resolveEvidenceIds} from "../evals/evidence-id-map.mjs";

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
 assert.match(normal,/逐字复制连续原文/);
 assert.match(normal,/只写在 notes 里无效/);
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
test("引用本身合法但未覆盖全部必需边界也必须阻断",t=>{
 const x=fixture(t);prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 const wrong=structuredClone(x.response),replacement={file:"README.md",quote:"没有常驻数据库或后台服务"};
 wrong.cases[0].layers[1].modules[0].evidence=[replacement];
 wrong.cases[0].relations[0].evidence=[replacement];
 fs.writeFileSync(path.join(x.out,x.entry.id,"explicit.candidate.json"),JSON.stringify(wrong));
 const result=check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"explicit"}).result;
 assert.equal(result.status,"BLOCKED");
 assert.match(result.issues.join("; "),/mandatory source boundary absent: 审批后生成可复查证据/);
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

function idCandidate(x){
 const catalogue=evidenceCatalogue({case:x.entry,files:frozenInputs(x.manifest,x.root)[0].files});
 const result=structuredClone(x.response);
 const convert=list=>list.map(e=>{
  const match=catalogue.entries.find(row=>row.file===e.file&&row.quote.includes(e.quote));
  assert.ok(match,"Source quote must be represented by one catalogue entry: "+e.quote);
  return {id:match.id};
 });
 for(const layer of result.cases[0].layers)for(const mod of layer.modules)mod.evidence=convert(mod.evidence);
 for(const rel of result.cases[0].relations)rel.evidence=convert(rel.evidence);
 return {catalogue,result};
}

test("证据 ID 只从冻结原文产生，保留旧对照提示，不覆盖旧实验",t=>{
 const x=fixture(t);
 prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 const file=path.join(x.out,x.entry.id,"explicit.prompt.md");
 const original=fs.readFileSync(file,"utf8");
 const p=prepareEvidenceIds({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 assert.equal(p.state,"prepared-not-executed");
 assert.equal(p.modelRunsVerified,0);
 assert.equal(p.skillActivationsVerified,0);
 assert.deepEqual(status(x.manifest,x.out).evidenceIdTrials.map(r=>[r.id,r.prepared,r.state]),[[x.entry.id,true,"not_run"]]);
 assert.equal(fs.readFileSync(file,"utf8"),original);
 const f=path.join(x.out,x.entry.id,"evidence-ids.prompt.md");
 const prompt=fs.readFileSync(f,"utf8"),catalogue=JSON.parse(fs.readFileSync(path.join(x.out,x.entry.id,"evidence-ids.catalogue.json"),"utf8"));
 assert.match(prompt,/\$gen-ui/);
 assert.match(prompt,/禁止返回 file、quote/);
 assert.match(prompt,/type 必须是 depends、data、controls、composes/);
 assert.match(prompt,/不允许省略/);
 assert.ok(catalogue.entries.every(e=>new RegExp("^E[A-F0-9]{12}$").test(e.id)));
 for(const a of x.entry.anchors)assert.ok(catalogue.entries.some(e=>e.file===a.file&&e.quote.includes(a.quote)));
 assert.deepEqual(catalogue,evidenceCatalogue(frozenInputs(x.manifest,x.root)[0]));
 assert.throws(()=>prepareEvidenceIds({manifest:x.manifest,projectsRoot:x.root,outDir:x.out}),/Refusing evidence-ID overwrite/);
});

test("ID 还原只信任冻结 Git，保留语义未验证声明，并可渲染独立 HTML",t=>{
 const x=fixture(t);
 prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 prepareEvidenceIds({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 const {result,catalogue}=idCandidate(x);
 const candidateFile=path.join(x.out,x.entry.id,"evidence-ids.candidate.json");
 fs.writeFileSync(candidateFile,JSON.stringify(result));
 assert.equal(status(x.manifest,x.out).evidenceIdTrials[0].state,"candidate-present-unreviewed");
 const scored=check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"evidence-ids"});
 assert.equal(scored.result.status,"STRUCTURAL_PASS_SEMANTIC_UNVERIFIED");
 assert.equal(scored.result.modelRunsVerified,0);
 assert.equal(scored.result.humanSemanticReviews,0);
 assert.ok(scored.candidate.cases[0].layers[0].modules[0].evidence[0].quote.includes("输入来源必须记录"));
 assert.deepEqual(result.cases[0].layers[0].modules[0].evidence[0],
  {id:catalogue.entries.find(e=>e.quote.includes("输入来源必须记录")).id});
 // Local catalogue is a convenience for the prompt, NEVER trusted by check().
 fs.writeFileSync(path.join(x.out,x.entry.id,"evidence-ids.catalogue.json"),JSON.stringify({entries:[{id:"EFAKE",quote:"已上线生产服务"}]}));
 assert.equal(check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"evidence-ids"}).result.status,"STRUCTURAL_PASS_SEMANTIC_UNVERIFIED");
 const rendered=renderChecked({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"evidence-ids"});
 assert.equal(rendered.outputs.length,1);
 const html=fs.readFileSync(rendered.outputs[0].file,"utf8");
 assert.match(html,/输入来源必须记录/);
 assert.doesNotMatch(html,/<script\b|已上线生产服务/);
 assert.match(html,/结构校验不代表真实模型执行/);
});

test("证据 ID 拒绝伪造、错项目、混入手写引文及源指纹变化",t=>{
 const x=fixture(t);
 prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 const {result}=idCandidate(x),sources=frozenInputs(x.manifest,x.root);
 const target=result.cases[0].layers[0].modules[0];
 target.evidence=[{id:"E000000000000"}];
 fs.writeFileSync(path.join(x.out,x.entry.id,"evidence-ids.candidate.json"),JSON.stringify(result));
 assert.throws(()=>renderChecked({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"evidence-ids"}),/Unknown or foreign evidence ID/);
 assert.equal(fs.existsSync(path.join(x.out,x.entry.id,"evidence-ids.preview.html")),false);
 assert.throws(()=>resolveEvidenceIds(result,sources),/Unknown or foreign evidence ID/);
 const foreign=evidenceCatalogue({case:{...x.entry,id:"other-project"},files:sources[0].files}).entries[0].id;
 target.evidence=[{id:foreign}];
 assert.throws(()=>resolveEvidenceIds(result,sources),/Unknown or foreign evidence ID/);
 target.evidence=[{id:idCandidate(x).result.cases[0].layers[0].modules[0].evidence[0].id,quote:"自编假证据"}];
 assert.throws(()=>resolveEvidenceIds(result,sources),/Raw or mixed evidence is prohibited/);
 target.evidence=[{file:"README.md",quote:"输入来源必须记录"}];
 assert.throws(()=>resolveEvidenceIds(result,sources),/Raw or mixed evidence is prohibited/);
 target.evidence=idCandidate(x).result.cases[0].layers[0].modules[0].evidence;
 fs.writeFileSync(path.join(x.out,x.entry.id,"evidence-ids.candidate.json"),JSON.stringify(result));
 const altered=structuredClone(x.manifest);
 altered.cases[0].sources[0].sha256="0".repeat(64);
 assert.throws(()=>check({manifest:altered,projectsRoot:x.root,outDir:x.out,variant:"evidence-ids"}),/fingerprint mismatch/);
});

test("引用 ID 真实仍须覆盖全部边界，非法上线声明不能被 ID 白名单洗白",t=>{
 const x=fixture(t);
 prepare({manifest:x.manifest,projectsRoot:x.root,outDir:x.out});
 const {result}=idCandidate(x);
 const missing=structuredClone(result);
 missing.cases[0].layers[1].modules[0].evidence=missing.cases[0].layers[0].modules[0].evidence;
 missing.cases[0].relations[0].evidence=missing.cases[0].layers[0].modules[0].evidence;
 const f=path.join(x.out,x.entry.id,"evidence-ids.candidate.json");
 fs.writeFileSync(f,JSON.stringify(missing));
 const blocked=renderChecked({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"evidence-ids"});
 assert.equal(blocked.result.status,"BLOCKED");
 assert.equal(blocked.outputs.length,0);
 assert.match(blocked.result.issues.join("; "),/mandatory source boundary absent/);
 result.cases[0].status="deployed";
 fs.writeFileSync(f,JSON.stringify(result));
 assert.equal(check({manifest:x.manifest,projectsRoot:x.root,outDir:x.out,variant:"evidence-ids"}).result.status,"BLOCKED");
 assert.equal(fs.existsSync(path.join(x.out,x.entry.id,"evidence-ids.preview.html")),false);
});

test("输出路径即使以 .. 开头也必须拒绝写入公开仓库",t=>{
 const x=fixture(t);
 const repoPath=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
 const forbidden=path.join(repoPath,"..genui-unseen-test-target");
 assert.throws(()=>prepare({manifest:x.manifest,projectsRoot:x.root,outDir:forbidden}),/Refusing trial outputs/);
 assert.equal(fs.existsSync(forbidden),false);
});

test("已发布三份陌生项目独立 HTML 与九张 Chrome 截图且不携带本机凭据",()=>{
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),dir=path.join(root,"demo/unseen-panorama"),idx=fs.readFileSync(path.join(dir,"index.html"),"utf8");
 for(const name of ["agent-lead","plan-ship","distributed-system-audit"]){
  assert.ok(idx.includes(name+".html"));
  const page=fs.readFileSync(path.join(dir,name+".html"),"utf8");
  assert.match(page,/radial-gradient/);
  assert.match(page,/--pan-layer-fill/);
  assert.match(page,/结构校验不代表真实模型执行|来源引文结构检查不等于独立语义审查/);
  assert.doesNotMatch(page,/<script\b|<iframe\b|github_pat_|Bearer\s+/i);
  assert.ok(!page.includes("C:\\Users\\")&&!page.includes("D:\\workspace\\"));
  for(const width of [375,768,1440]){
   const png=fs.readFileSync(path.join(dir,"assets",name+"-"+width+".png"));
   assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
   assert.ok(png.length>20000);
  }
 }
});
