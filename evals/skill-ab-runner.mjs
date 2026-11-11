#!/usr/bin/env node
// Compare legacy and lightweight GEN-UI instructions using the real local Codex CLI.
// Never reads authentication files or prints credentials. Outputs remain in local artifacts.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {spawn} from "node:child_process";
import {spawnSync} from "node:child_process";

const root=path.resolve(import.meta.dirname,"..");
const historical="cc5c3c9";
const old=spawnSync("git",["show",historical+":SKILL.md"],{cwd:root,encoding:"utf8",maxBuffer:100000});
if(old.status!==0)throw Error("Historical SKILL.md unavailable; verify git history");
const currentCommit=spawnSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"});
if(currentCommit.status!==0)throw Error("Current committed HEAD unavailable");
const pinnedLight=currentCommit.stdout.trim();
const newer=spawnSync("git",["show",pinnedLight+":SKILL.md"],{cwd:root,encoding:"utf8",maxBuffer:100000});
if(newer.status!==0)throw Error("Pinned lightweight SKILL.md unavailable");
const skills={legacy:old.stdout,light:newer.stdout};
const htmlContract=fs.readFileSync(path.join(root,"references","html-report-contract.md"),"utf8");
const diagramContract=fs.readFileSync(path.join(root,"references","semantic-diagram-model.md"),"utf8");
const scenarios=[
 {id:"MD",format:"markdown",prompt:"用中文分析一个 Worker 租约过期后可能覆盖新 Worker 成功结果的风险。目前没有任何生产日志、测试结果或压测证据。只给结论、依据、风险、下一步，不超过 250 字；不要把推测当作测试事实。输出纯 Markdown。",references:""},
 {id:"HTML",format:"html",prompt:"生成一个离线可打开的中文 HTML 风险分析页面。只用这三条模拟记录：A=旧 Worker 越权写入(P1/待验证)、B=重复投递(P2/待验证)、C=浏览器展示不完整(P2/待验证)。包含明确结论、左侧导航、风险表格和下一步，状态标为模拟；用内联 CSS，不依赖外部 CDN，输出完整 HTML 文档内容而非 Markdown 代码围栏。",references:htmlContract},
 {id:"DIAGRAM",format:"diagram",prompt:"生成一个离线可打开的中文 HTML 技术文档，用 GEN-UI 语义时序图解释 Requester→API→Worker→DB 的任务提交流程；提供合法的独立 JSON 模型，包含 4 个参与者、3 条消息、中文标签，并通过 data-semantic-diagram=sequence 和 data-diagram-model 连接到仓库提供的离线 SVG 引擎。不要虚构执行结果，输出完整 HTML 内容而非 Markdown 代码围栏。",references:htmlContract+"\n\n"+diagramContract}
];
const hash=x=>crypto.createHash("sha256").update(x).digest("hex");
const outDir=path.join(root,"evals","artifacts","skill-ab-"+new Date().toISOString().slice(0,10)+"-"+pinnedLight.slice(0,8));
const flags=process.argv.slice(2);
const dryRun=flags.includes("--dry-run");
const caseId=(flags.find(x=>x.startsWith("--case="))||"").split("=")[1];
const variant=(flags.find(x=>x.startsWith("--variant="))||"").split("=")[1];
const selectedScenarios=scenarios.filter(x=>!caseId||x.id===caseId);
const selectedSkills=Object.entries(skills).filter(([name])=>!variant||name===variant);
if(!selectedScenarios.length||!selectedSkills.length)throw Error("Invalid --case or --variant");
const manifest={version:"gen-ui-ab/v1",ref:historical,current:pinnedLight,cases:selectedScenarios.map(x=>({id:x.id,format:x.format})),skills:Object.fromEntries(Object.entries(skills).map(([name,value])=>[name,{bytes:Buffer.byteLength(value),sha256:hash(value)}])),scenarios:[]};
if(dryRun){console.log(JSON.stringify({...manifest,plannedRuns:selectedScenarios.length*selectedSkills.length,dryRun:true},null,2));process.exit(0)}
fs.mkdirSync(outDir,{recursive:true});
const work=fs.mkdtempSync(path.join(os.tmpdir(),"genui-codex-ab-"));
const cli=process.platform==="win32"?"cmd.exe":"codex";
const prefix=process.platform==="win32"?["/d","/c","codex.cmd"]:[];
const args=["exec","--ephemeral","--sandbox","read-only","--skip-git-repo-check","--ignore-user-config","--json","-"];
const assess=(id,content)=>{
 const lower=content.toLowerCase();
 if(id==="MD")return {markdown:!/<html|<!doctype/i.test(content),risks:/风险/.test(content),uncertainty:/未|缺少|尚无/.test(content),next:/下一步|建议/.test(content)};
 if(id==="HTML")return {html:/<!doctype html/i.test(content),nav:/<nav[\s>]/i.test(content),table:/<table[\s>]/i.test(content),simulated:/模拟/.test(content),noRemoteScript:!/<script\b[^>]+src=["']https?:/i.test(content)};
 return {html:/<!doctype html/i.test(content),model:/data-diagram-model/.test(content),sequence:/data-semantic-diagram=["']sequence["']/.test(content),json:/application\/json/.test(content),fourActors:/requester|worker|api/i.test(content)};
};
function run(input){
 return new Promise((resolve)=>{
  const child=spawn(cli,[...prefix,...args],{cwd:work,windowsHide:true,stdio:["pipe","pipe","pipe"],env:{...process.env,NO_COLOR:"1"}});
  let stdout="",stderr="",timeout=false;
  const timer=setTimeout(()=>{timeout=true;child.kill()},120000);
  child.stdout.on("data",x=>{if(stdout.length<3_000_000)stdout+=x.toString()});
  child.stderr.on("data",x=>{if(stderr.length<8_000)stderr+=x.toString()});
  child.on("error",e=>{clearTimeout(timer);resolve({exitCode:null,error:e.code||"execution-error",stdout,stderr})});
  child.on("close",code=>{clearTimeout(timer);resolve({exitCode:code,error:timeout?"timeout":null,stdout,stderr})});
  child.stdin.on("error",()=>{});
  child.stdin.end(input);
 });
}
try{
 outer: for(const s of selectedScenarios){
  for(const [name,skill]of selectedSkills){
   const prompt="你是执行 GEN-UI 行为对照的 Coding Agent。只遵循下述 Skill，按照任务最终生成内容。不要访问仓库、网络、文件系统或工具，不要运行命令。此任务仅输出最终文本；任何声称已经运行的测试都是不实的。\n[SKILL]\n"+skill+"\n[/SKILL]\n"+(s.references?"[REFERENCES: 仅此任务按需提供]\n"+s.references+"\n[/REFERENCES]\n":"")+"[USER]\n"+s.prompt+"\n[/USER]\n";
   const runResult=await run(prompt);
   const events=runResult.stdout.split(/\r?\n/).filter(Boolean).flatMap(x=>{try{return [JSON.parse(x)]}catch{return []}});
   const output=events.filter(x=>x.type==="item.completed"&&x.item?.type==="agent_message").map(x=>x.item.text).join("\n");
   const usage=events.find(x=>x.type==="turn.completed")?.usage||null;
   const rawError=events.find(x=>x.type==="turn.failed")?.error?.message||events.find(x=>x.type==="error")?.message||runResult.error||"";
   const error=/usage limit/i.test(rawError)?"usage-limit":/quota|rate limit/i.test(rawError)?"quota-or-rate-limit":rawError?"model-execution-failed":null;
   const checks=output?assess(s.id,output):null;
   const evidenceFile=s.id+"-"+name+(s.format==="markdown"?".md":".html");
   const passed=runResult.exitCode===0&&!!output&&Object.values(checks).every(Boolean);
   const item={scenario:s.id,variant:name,cliExit:runResult.exitCode,status:passed?"static-pass":output?"static-fail":error||"empty-output",checks,usage,outputLength:output.length,artifact:evidenceFile};
   fs.writeFileSync(path.join(outDir,s.id+"-"+name+(s.format==="markdown"?".md":".html")),output);
   manifest.scenarios.push(item);
   fs.writeFileSync(path.join(outDir,"results.json"),JSON.stringify(manifest,null,2));
   console.log(JSON.stringify(item));
   if(error==="usage-limit"||error==="quota-or-rate-limit"){console.log("STOP: Codex account limit. No automatic retry.");process.exitCode=2;break outer;}
  }
 }
}finally{fs.rmSync(work,{recursive:true,force:true,maxRetries:3,retryDelay:150})}
