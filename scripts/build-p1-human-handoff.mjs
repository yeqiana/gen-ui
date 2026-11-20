import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {frozenInputs} from "../evals/unseen-panorama-workflow.mjs";
import {assessCurrentP1Evidence} from "../evals/p1-current-evidence-gate.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
const read=f=>JSON.parse(fs.readFileSync(f,"utf8"));
const escape=x=>String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const clean=x=>String(x??"").replace(/[\r\n]+/g," ").trim();
const cases=[
 {id:"distributed-system-audit",candidate:"p1-dsa-editorial-v6-candidate-2026-11-20.json",handoff:"p1-dsa-editorial-v6-human-handoff-2026-11-20.json"},
 {id:"agent-lead",candidate:"p1-agent-lead-editorial-v4-candidate-2026-11-20.json",handoff:"p1-agent-lead-editorial-v4-human-handoff-2026-11-19.json"},
 {id:"plan-ship",candidate:"p1-plan-ship-editorial-v3-candidate-2026-11-20.json",handoff:"p1-plan-ship-editorial-v3-human-handoff-2026-11-19.json"}
];
export function buildP1ReviewPacket(dest=path.join(os.tmpdir(),"genui-p1-v6-human-review-20261120"),projectsRoot=path.resolve(root,"../..")){
 const identity=assessCurrentP1Evidence();
 if(identity.artifactIntegrity!=="PASS")throw Error("Current candidate identity is not verified: "+identity.findings.join(" | "));
 if(fs.existsSync(dest))throw Error("Destination exists; will not overwrite: "+dest);
 const manifest=read(path.join(root,"evals/unseen-panorama-2026-11-17.json"));
 const frozen=frozenInputs(manifest,projectsRoot);
 const byId=new Map(frozen.map(x=>[x.case.id,x]));
 const all=[],archive=[];
 for(const c of cases){
  const handoff=read(path.join(root,"evals",c.handoff));
  const frozenCase=byId.get(c.id);
  if(!frozenCase)throw Error("Missing frozen source case "+c.id);
  const sources=new Map(frozenCase.files.map(x=>[x.file,x.text.split(/\r?\n/)]));
  let entries=[];
  if(c.id==="distributed-system-audit"){
   entries=handoff.modules.map(x=>({key:x.key,claim:x.claim,refs:x.sources.map(z=>({file:z.file,line:z.line})),question:x.questions.join(" / ")})).concat(
    handoff.chapters.map(x=>({key:x.key,claim:x.title+"："+x.question,refs:x.sourceLines.map(line=>({file:"references/audit-sop.md",line})),question:"章节完整性核验，不能只核对有无引用"})));
  }else if(c.id==="agent-lead"){
   entries=handoff.items.map(x=>({key:x.key,claim:x.claim,refs:x.sources.map(z=>({file:z.file,line:z.line})),question:x.requiredQuestion}));
  }else{
   entries=handoff.edges.map((x,i)=>({key:"edge:"+i,claim:x.fromTitle+" → "+x.toTitle+(x.condition?"，条件："+x.condition:""),refs:[{file:x.sourceFile,line:x.sourceLine}],question:x.independentReviewerQuestion})).concat(
    handoff.globalReviewQuestions.map((x,i)=>({key:"boundary:"+i,claim:x.rule,refs:[{file:x.sourceFile,line:x.line}],question:"正式交付是否完整、是否存在无来源豁免？"})));
  }
  for(const e of entries){
   if(!e.refs.length)throw Error("Empty evidence "+c.id+"/"+e.key);
   const cites=e.refs.map(r=>{
    const text=sources.get(r.file)?.[r.line-1];
    if(text===undefined)throw Error("Invalid frozen line "+c.id+"/"+r.file+":"+r.line);
    return {ref:r.file+":"+r.line,text:clean(text)};
   });
   all.push({caseId:c.id,key:e.key,claim:e.claim,question:e.question,verdict:"PENDING",cites});
  }
  archive.push({caseId:c.id,commit:frozenCase.case.commit,candidate:c.candidate,handoff:c.handoff,sha256:identity.currentCandidateSHA256[c.id],sourceFiles:frozenCase.files.map(x=>({path:x.file,sha256:sha(Buffer.from(x.text))}))});
 }
 if(all.length!==80||new Set(all.map(x=>x.caseId+":"+x.key)).size!==80)throw Error("Expected precisely 80 unique review items");
 fs.mkdirSync(dest,{recursive:false});
 const put=(name,content)=>{const target=path.join(dest,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content,{flag:"wx"})};
 for(const x of archive){
  const f=byId.get(x.caseId);
  for(const src of f.files){
   if(src.file.split(/[\\/]/).includes(".."))throw Error("Unsafe source path");
   put(path.join("frozen",x.caseId,src.file),src.text);
  }
  const current=cases.find(y=>y.id===x.caseId);
  put(path.join("candidates",x.caseId+".json"),fs.readFileSync(path.join(root,"evals",current.candidate)));
  put(path.join("handoffs",x.caseId+".json"),fs.readFileSync(path.join(root,"evals",current.handoff)));
 }
 const summary={schema:"genui-p1-v6-human-review-bundle/v1",created:"2026-11-20",reviewerType:"HUMAN_REQUESTED_NOT_COMPLETED",decision:"PENDING_80_OF_80",p1Release:"NO_GO",remoteCI:"NOT_VERIFIED",sourceCases:archive,items:80,candidateIntegrity:"PASS",paidModelCalls:0};
 put("manifest.json",JSON.stringify(summary,null,2)+"\n");
 put("review-items.json",JSON.stringify(all,null,2)+"\n");
 const md=["# GEN-UI P1 · 独立真人复核（80 项）","","**尚未签审，全部 PENDING；候选是审计/工作流模板，不是实际完成代码审计。**","",
 "请依次核对候选主张与下方冻结原文，记录 supported/unsupported/unclear、具体理由和剩余风险。文件不会自动记录签审，也不会联网。",""];
 for(const c of cases){
  md.push("## "+c.id+"（"+all.filter(x=>x.caseId===c.id).length+" 项）","");
  for(const x of all.filter(x=>x.caseId===c.id)){
   md.push("### "+x.key,"",x.claim,"","**核对问题：** "+x.question,"","**冻结原文：**","");
   for(const y of x.cites)md.push("- "+y.ref+"："+y.text);
   md.push("","**审核：PENDING**","","---","");
  }
 }
 put("review.md",md.join("\n")+"\n");
 const cards=all.map((x,i)=>"<details><summary>"+escape(String(i+1)+". ["+x.caseId+"] "+x.key+" — "+x.claim)+"</summary><p>"+escape(x.question)+"</p><ul>"+x.cites.map(y=>"<li><code>"+escape(y.ref)+"</code> "+escape(y.text)+"</li>").join("")+"</ul><p><strong>人工结论：PENDING</strong></p></details>").join("");
 const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GEN-UI P1 独立真人复核包</title><style>body{font:16px/1.65 system-ui,-apple-system,sans-serif;max-width:860px;padding:24px;margin:auto;color:#222;background:#fafafa}h1{font-size:1.55rem}p{overflow-wrap:anywhere}details{background:white;border:1px solid #ddd;border-radius:8px;padding:14px;margin:10px 0}summary{cursor:pointer;font-weight:600;overflow-wrap:anywhere}li{margin:5px 0;overflow-wrap:anywhere}code{font-size:.87em;background:#eee;padding:2px 4px}strong{color:#9a2e19} .lead{border-left:3px solid #777;padding-left:14px}</style></head><body><h1>GEN-UI P1 独立真人复核 · 80 项</h1><p class="lead">三项目当前候选已绑定 SHA-256。80 项全部待审；没有真人签署，也没有执行真实 Java 项目审计。本文件无外网依赖、无脚本。</p><p>分布：DSA 33、Agent Lead 28、PlanShip 19。展开条目可核对冻结源码行；记录判定请使用独立受控文档。</p>'+cards+'</body></html>';
 put("index.html",html);
 const files=[];function visit(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,x.name);if(x.isDirectory())visit(f);else if(x.name!=="SHA256SUMS.txt")files.push(f)}}visit(dest);
 const banned=/(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_-]{12,}|sk-[A-Za-z0-9_-]{25,}|Bearer\s+[A-Za-z0-9._-]{25,})/;
 for(const f of files)if(banned.test(fs.readFileSync(f,"utf8")))throw Error("Possible credential in "+path.relative(dest,f));
 put("SHA256SUMS.txt",files.map(f=>sha(fs.readFileSync(f))+"  "+path.relative(dest,f).replaceAll("\\","/")).join("\n")+"\n");
 return {dir:dest,items:all.length,sourceFiles:archive.reduce((n,x)=>n+x.sourceFiles.length,0),files:files.length+1,htmlBytes:Buffer.byteLength(html),release:"NO_GO"};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(buildP1ReviewPacket(process.argv[2],process.argv[3]?path.resolve(process.argv[3]):undefined),null,2))}catch(e){console.error(e.message);process.exitCode=1}
}
