#!/usr/bin/env node
// Real-source trial orchestration only. Never invokes or charges a model.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {gitSource,scoreUnseen} from "./score-unseen-panorama.mjs";
import {renderPanorama} from "./render-unseen-panorama.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const validId=x=>typeof x==="string"&&/^[a-z0-9][a-z0-9-]{1,63}$/.test(x);
const secret=/(?:github_pat_[A-Za-z0-9_]{10,}|ghp_[A-Za-z0-9]{10,}|sk-[A-Za-z0-9]{18,}|Bearer\s+[A-Za-z0-9_.-]{20,})/i;
function validate(m){
 if(m?.schema!=="genui-unseen-panorama/v1"||!Array.isArray(m.cases)||!m.cases.length)throw Error("Invalid frozen manifest");
 const ids=new Set();
 for(const c of m.cases){
  if(!validId(c.id)||!validId(c.repo)||ids.has(c.id)||!/^[a-f0-9]{40}$/.test(c.commit)||!Array.isArray(c.sources)||!c.sources.length||!Array.isArray(c.anchors))throw Error("Invalid or duplicate frozen case");
  ids.add(c.id);
  for(const f of c.sources)if(!f.file||f.file.startsWith("/")||f.file.includes("..")||f.file.includes("\\")||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error("Unsafe source");
 }
 return m;
}
export function frozenInputs(m,projectsRoot){
 validate(m);const results=[];
 for(const c of m.cases){
  const files=[];
  for(const f of c.sources){
   const blob=gitSource(projectsRoot,c.repo,c.commit,f.file);
   if(sha(blob)!==f.sha256||(f.bytes!==undefined&&blob.length!==f.bytes))throw Error(c.id+": frozen source fingerprint mismatch: "+f.file);
   const text=blob.toString("utf8");if(secret.test(text))throw Error("Potential credential in source: "+c.id);
   files.push({file:f.file,text,sha256:sha(blob)});
  }
  for(const a of c.anchors)if(!files.some(f=>f.file===a.file&&f.text.includes(a.quote)))throw Error(c.id+": frozen evidence boundary missing: "+a.quote);
  results.push({case:c,files});
 }
 return results;
}
export function promptForSource(c,files,variant){
 if(!["baseline","explicit"].includes(variant))throw Error("Unknown variant");
 const instructions=[
 "任务：根据下面冻结的真实项目资料，制作有来源依据的产品能力/工作流架构候选结构，不是部署拓扑。",
 "仅展示原文明确支持的事实。2-8 层由内容决定，不照抄通用商贸案例，也不强凑六层、数据中台、Redis、数据库、队列、服务器或模型跨厂商路由。",
 "模块和关系均须逐条列明文件与原文引文，引用不少于 8 字符。无关系依据时 relations 必须为空。必须区分说明文档、规划与真实验收。",
 "只输出严格 JSON，不要代码围栏、HTML 或其他说明。禁止外部搜索。目标 schema：",
 JSON.stringify({schema:"genui-panorama-candidate/v1",cases:[{id:c.id,status:"documented",notes:"注明事实与未验证边界",layers:[{title:"源文档证实的能力层",modules:[{id:"module-a",title:"有依据的模块",evidence:[{file:"SOURCE_PATH",quote:"SOURCE_EXACT_QUOTE"}]}]}],relations:[]}]}),
 "status 仅为 documented/planned/unknown；不要凭空自称 deployed/verified。关系 type 仅用 depends/data/controls/composes。",
 "必须保留的边界："+c.anchors.map(a=>a.file+" : "+a.quote).join("；"),
 ...files.flatMap(f=>["=== FROZEN SOURCE "+f.file+" / SHA-256 "+f.sha256+" ===",f.text,"=== END SOURCE ==="])
 ].join("\n\n");
 return (variant==="explicit"?"$gen-ui\n":"")+instructions;
}
function outsideRepoOutput(dest){
 const resolved=path.resolve(dest);let ancestor=resolved;const parts=[];
 while(!fs.existsSync(ancestor)){parts.unshift(path.basename(ancestor));ancestor=path.dirname(ancestor);}
 const physical=path.resolve(fs.realpathSync(ancestor),...parts);
 const relative=path.relative(fs.realpathSync(root),physical);
 if(!relative||(!path.isAbsolute(relative)&&relative!==".."&&!relative.startsWith(".."+path.sep)))
  throw Error("Refusing trial outputs inside public GEN-UI repository");
 return resolved;
}
export function prepare({manifest,projectsRoot,outDir}){
 const sources=frozenInputs(manifest,projectsRoot);
 const dir=outsideRepoOutput(outDir);
 if(fs.existsSync(dir)&&fs.readdirSync(dir).length)throw Error("Output is not empty; refusing overwrite");
 fs.mkdirSync(dir,{recursive:true});
 const cases=[];
 for(const entry of sources){
  const c=entry.case,sub=path.join(dir,c.id);fs.mkdirSync(sub,{recursive:true});
  for(const variant of ["baseline","explicit"])fs.writeFileSync(path.join(sub,variant+".prompt.md"),promptForSource(c,entry.files,variant),"utf8");
  cases.push({id:c.id,commit:c.commit,sources:entry.files.map(f=>({file:f.file,sha256:f.sha256})),
    trials:["baseline","explicit"].map(v=>({variant:v,status:"not_run",output:c.id+"/"+v+".candidate.json"}))});
 }
 const plan={schema:"genui-unseen-panorama-trials/v1",state:"prepared-not-executed",cases,
   modelRunsVerified:0,skillActivationsVerified:0,semanticReviews:0,readerTrials:0,
   warning:"Only prompts prepared. No model was invoked; this is not a Skill generalization result."};
 fs.writeFileSync(path.join(dir,"plan.json"),JSON.stringify(plan,null,2)+"\n");
 return plan;
}
export function status(manifest,outDir){
 validate(manifest);const rows=[];
 for(const c of manifest.cases)for(const variant of ["baseline","explicit"]){
  const f=path.join(path.resolve(outDir),c.id,variant+".candidate.json"),exists=fs.existsSync(f);
  rows.push({id:c.id,variant,state:exists?"candidate-present-unreviewed":"not_run",bytes:exists?fs.statSync(f).size:0});
 }
 return {schema:"genui-unseen-panorama-trial-status/v1",rows,
   modelRunsVerified:0,skillActivationsVerified:0,semanticReviews:0,
   warning:"Candidate file presence is not evidence of actual model execution or semantic correctness."};
}
export function loadCandidates(manifest,outDir,variant){
 validate(manifest);if(!["baseline","explicit","demo"].includes(variant))throw Error("Choose baseline, explicit or demo");
 const cases=[];
 for(const c of manifest.cases){
  const f=path.join(path.resolve(outDir),c.id,variant+".candidate.json");
  if(!fs.existsSync(f))throw Error("NOT_RUN: missing "+c.id+"/"+variant+".candidate.json");
  if(fs.statSync(f).size>2_000_000)throw Error("Candidate file too large");
  const data=JSON.parse(fs.readFileSync(f,"utf8"));
  if(data?.schema!=="genui-panorama-candidate/v1"||!Array.isArray(data.cases)||data.cases.length!==1||data.cases[0].id!==c.id)throw Error("Invalid single-case response: "+c.id);
  cases.push(data.cases[0]);
 }
 return {schema:"genui-panorama-candidate/v1",cases};
}
export function check({manifest,projectsRoot,outDir,variant}){
 const candidate=loadCandidates(manifest,outDir,variant);
 const result=scoreUnseen(manifest,candidate,(repo,commit,file)=>gitSource(projectsRoot,repo,commit,file));
 return {candidate,result};
}
export function renderChecked({manifest,projectsRoot,outDir,variant}){
 outsideRepoOutput(outDir);
 const {candidate,result}=check({manifest,projectsRoot,outDir,variant});
 if(result.status!=="STRUCTURAL_PASS_SEMANTIC_UNVERIFIED")return {result,outputs:[]};
 const output=[];
 for(const c of candidate.cases){
  const metadata=manifest.cases.find(m=>m.id===c.id);
  const html=renderPanorama(c,metadata,root);
  const f=path.join(path.resolve(outDir),c.id,variant+".preview.html");
  fs.writeFileSync(f,html,"utf8");output.push({id:c.id,file:f,bytes:Buffer.byteLength(html)});
 }
 return {result,outputs:output};
}
const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
 try{
  const [verb,manifestFile,projectsRoot,outputDir,variant]=process.argv.slice(2);
  if(!["prepare","status","check","render"].includes(verb)||!manifestFile||!projectsRoot||!outputDir)throw Error("Usage: node evals/unseen-panorama-workflow.mjs prepare|status|check|render <manifest.json> <local-repos-dir> <outside-repo-output-dir> [baseline|explicit|demo]");
  const manifest=JSON.parse(fs.readFileSync(path.resolve(manifestFile),"utf8"));
  if(verb==="prepare")console.log(JSON.stringify(prepare({manifest,projectsRoot,outDir:outputDir}),null,2));
  if(verb==="status")console.log(JSON.stringify(status(manifest,outputDir),null,2));
  if(verb==="check"){const r=check({manifest,projectsRoot,outDir:outputDir,variant});console.log(JSON.stringify(r.result,null,2));if(r.result.status!=="STRUCTURAL_PASS_SEMANTIC_UNVERIFIED")process.exitCode=1;}
  if(verb==="render"){const r=renderChecked({manifest,projectsRoot,outDir:outputDir,variant});console.log(JSON.stringify(r,null,2));if(r.result.status!=="STRUCTURAL_PASS_SEMANTIC_UNVERIFIED")process.exitCode=1;}
 }catch(e){console.error("BLOCKED: "+e.message);process.exitCode=2;}
}
