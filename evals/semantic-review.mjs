#!/usr/bin/env node
// Manual semantic-review handoff for frozen evidence-ID candidates. No LLM calls.
// Review attestation is NOT an authenticated independent semantic verification.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {frozenInputs} from "./unseen-panorama-workflow.mjs";
import {evidenceCatalogue,resolveEvidenceIds} from "./evidence-id-map.mjs";
import {scoreUnseen,gitSource} from "./score-unseen-panorama.mjs";

const hash=x=>crypto.createHash("sha256").update(x).digest("hex");
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sourceMark=entry=>hash(JSON.stringify({id:entry.case.id,commit:entry.case.commit,files:entry.files.map(f=>[f.file,f.sha256])}));
const digest=packet=>hash(JSON.stringify(packet));
const safeOut=dest=>{
 const out=path.resolve(dest);let a=out;const rest=[];
 while(!fs.existsSync(a)){rest.unshift(path.basename(a));a=path.dirname(a);}
 const physical=path.resolve(fs.realpathSync(a),...rest);
 const base=fs.realpathSync(repoRoot),rel=path.relative(base,physical);
 if(!rel||(!path.isAbsolute(rel)&&rel!==".."&&!rel.startsWith(".."+path.sep)))
  throw Error("Review outputs must stay outside public GEN-UI repository");
 return out;
};
// Advisory only: flags prioritize human review, never auto-approve or auto-reject.
export function semanticRiskFlags(kind,evidence,type,condition=null,claim=""){
 const quotes=(evidence||[]).filter(e=>e.valid).map(e=>e.quote||"");
 const flags=[];
 if(kind==="module"&&quotes.length>0&&quotes.every(x=>/^\s*#{1,6}\s+/.test(x)))
  flags.push("HEADING_ONLY_MODULE_EVIDENCE");
 // Advisory: source instructions to test later are not evidence tests ran.
 if(kind==="module"&&/(?:测试|验证|验收)/.test(claim)&&
    !/(?:建议|计划|待验证|待测试|示例|指南)/.test(claim)&&
    quotes.some(x=>/(?:先发出|然后再选|后再验证|建议.*(?:测试|验证)|计划.*(?:测试|验证))/.test(x))&&
    !quotes.some(x=>/(?:已实际通过|实测通过|已完成测试|验收已通过)/.test(x)))
  flags.push("PROPOSED_VALIDATION_AS_COMPLETED");
 if(kind==="relation"&&type==="depends"&&
    quotes.some(x=>/--\s*(?:Yes|No|True|False|是|否)\s*-->/i.test(x)))
  flags.push("CONDITIONAL_FLOW_LABELED_DEPENDS");
 if(kind==="relation"&&type==="depends"&&
    quotes.some(x=>/-->/.test(x)&&!/--\s*(?:Yes|No|True|False|是|否)\s*-->/i.test(x)))
  flags.push("MERMAID_FLOW_LABELED_DEPENDS");
 // Advisory, not a verdict: fallback policies do not automatically prove dependency.
 if(kind==="relation"&&type==="depends"&&quotes.some(x=>
   /(?:unsupported_[a-z_]+|provider_isolation|不支持|不可用|未通过|失败|权限不足)/i.test(x)&&
   /(?:改为|改用|降级|保留|报告|回退|fallback|禁止|不得|不能)/i.test(x)))
  flags.push("FALLBACK_POLICY_LABELED_DEPENDS");
 // Parallel checks are not evidence of a sequential transition.
 if(kind==="relation"&&type==="flow"&&quotes.some(x=>
   /(?:同时运行|并行执行|同时检查|concurrently|in parallel)/i.test(x)))
  flags.push("PARALLEL_OPERATION_LABELED_FLOW");
 // A conditional prose rule needs human interpretation; this is not a Mermaid
 // branch label and the source gate must not silently fabricate condition.
 if(kind==="relation"&&type==="controls"&&(condition===null||condition===undefined||condition==="")&&
    quotes.some(x=>/(?:\binvalid\b|\bfailed\b|若|如果|当|未通过|无效).{0,120}(?:⇒|=>|则|不得|禁止|must not)/i.test(x)))
  flags.push("CONDITIONAL_PROSE_NEEDS_REVIEW");
 return flags;
}
export function buildSemanticPacket({entry,candidateRaw}){
 const candidate=JSON.parse(Buffer.isBuffer(candidateRaw)?candidateRaw.toString("utf8"):candidateRaw);
 if(candidate?.schema!=="genui-panorama-candidate/v1"||candidate.cases?.length!==1||
    candidate.cases[0].id!==entry.case.id)throw Error("Invalid single-case semantic candidate");
 if(!Array.isArray(candidate.cases[0].layers)||!Array.isArray(candidate.cases[0].relations))
  throw Error("Invalid semantic candidate layers/relations");
 const c=candidate.cases[0],cat=evidenceCatalogue(entry),byId=new Map(cat.entries.map(e=>[e.id,e]));
 const invalid=[],items=[],modules=(c.layers||[]).flatMap(l=>l.modules||[]);
 if(modules.length+c.relations.length>200)throw Error("Semantic review candidate too large");
 const titles=new Map(modules.map(m=>[m.id,m.title]));
 const evidence=(refs,key)=>{
  if(!Array.isArray(refs)||!refs.length){invalid.push(key+": missing evidence");return [];}
  return refs.map(e=>{
   if(!e||typeof e!=="object"||Array.isArray(e)||Object.keys(e).length!==1||
      typeof e.id!=="string"||!byId.has(e.id)){
    invalid.push(key+": unknown/mixed evidence ID");
    return {id:typeof e?.id==="string"?e.id:null,valid:false};
   }
   const v=byId.get(e.id);
   return {id:v.id,file:v.file,line:v.line,quote:v.quote,valid:true};
  });
 };
 for(const [i,m] of modules.entries()){
  const key="module:"+i,claim=typeof m.title==="string"?m.title:"";
  const refs=evidence(m.evidence,key);
  items.push({key,kind:"module",claim,moduleId:m.id,evidence:refs,riskFlags:semanticRiskFlags("module",refs,null,null,claim)});
 }
 for(const [i,r] of (c.relations||[]).entries()){
  const key="relation:"+i;
  const refs=evidence(r.evidence,key);
  const condition=r.condition===undefined?"":" ["+String(r.condition)+"]";
  items.push({key,kind:"relation",claim:String(titles.get(r.from)||r.from)+" --"+String(r.type)+condition+"--> "+String(titles.get(r.to)||r.to),
   from:r.from,to:r.to,type:r.type,condition:r.condition??null,evidence:refs,riskFlags:semanticRiskFlags("relation",refs,r.type,r.condition)});
 }
 let sourceGate="BLOCKED";
 if(!invalid.length){
  const expanded=resolveEvidenceIds(candidate,[entry]);
  const score=scoreUnseen({schema:"genui-unseen-panorama/v1",cases:[entry.case]},expanded,
   (repo,commit,file)=>{
    if(repo!==entry.case.repo||commit!==entry.case.commit)throw Error("Frozen source mismatch");
    const f=entry.files.find(x=>x.file===file);
    if(!f)throw Error("Missing frozen file");
    return Buffer.from(f.text,"utf8");
   });
  sourceGate=score.status;
  invalid.push(...score.issues);
 }
 return {schema:"genui-semantic-packet/v1",caseId:entry.case.id,
  candidateSha256:hash(candidateRaw),sourceFingerprint:sourceMark(entry),sourceGate,
  issues:invalid,items,
  warning:"Source line identity cannot prove semantic support; reviewer identity is self-attested, not authenticated."};
}
export function reviewDraft(packet){
 return {schema:"genui-semantic-review/v1",packetSha256:digest(packet),reviewer:"",
  decisions:packet.items.map(x=>({key:x.key,decision:"pending",reason:"",
   ...(x.riskFlags?.length?{acknowledgedRisks:[]}: {})}))};
}
export function evaluateReview(packet,review){
 if(review?.schema!=="genui-semantic-review/v1"||review.packetSha256!==digest(packet))
  throw Error("Stale or tampered semantic review packet");
 if(!Array.isArray(review.decisions)||review.decisions.length!==packet.items.length||
    new Set(review.decisions.map(x=>x.key)).size!==packet.items.length||
    packet.items.some(i=>!review.decisions.some(x=>x.key===i.key)))
  throw Error("Incomplete, duplicated or unknown semantic review entries");
 const valid=new Set(["pending","supported","unsupported","unclear"]);
 if(review.decisions.some(x=>!valid.has(x.decision)||
    (x.decision!=="pending"&&(typeof x.reason!=="string"||x.reason.trim().length<8))))
  throw Error("Invalid review verdict or missing rationale");
 const counts=Object.fromEntries([...valid].map(v=>[v,review.decisions.filter(x=>x.decision===v).length]));
 // Advisory risks are not independent semantic verdicts. A supported decision
 // must explicitly acknowledge each risk; this is still self-attestation.
 const unacknowledged=[];
 for(const item of packet.items){
  const d=review.decisions.find(x=>x.key===item.key),allowed=item.riskFlags||[];
  if(d.acknowledgedRisks!==undefined&&(!Array.isArray(d.acknowledgedRisks)||
     new Set(d.acknowledgedRisks).size!==d.acknowledgedRisks.length||
     d.acknowledgedRisks.some(r=>!allowed.includes(r))))
   throw Error("Invalid risk acknowledgments: "+item.key);
  if(d.decision==="supported")for(const risk of allowed)
   if(!d.acknowledgedRisks?.includes(risk))unacknowledged.push(item.key+": "+risk);
 }
 if(packet.sourceGate!=="STRUCTURAL_PASS_SEMANTIC_UNVERIFIED"||packet.issues.length)
  return {status:"BLOCKED_SOURCE",counts,issues:packet.issues};
 if(counts.unsupported||counts.unclear)return {status:"BLOCKED_SEMANTIC_DISAGREEMENT",counts,issues:[]};
 if(counts.pending)return {status:"PENDING_SEMANTIC_REVIEW",counts,issues:[]};
 if(unacknowledged.length)return {status:"BLOCKED_RISK_UNACKNOWLEDGED",counts,issues:unacknowledged};
 if(typeof review.reviewer!=="string"||review.reviewer.trim().length<3)
  throw Error("Self-attested reviewer label is required");
 return {status:"ATTESTED_NOT_INDEPENDENTLY_VERIFIED",counts,issues:[],
  warning:"A self-attestation is not independent human verification; does not upgrade model/Skill acceptance."};
}
export function semanticReviewFiles({manifest,projectsRoot,caseId,candidateFile,outDir,command}){
 const entry=frozenInputs(manifest,projectsRoot).find(x=>x.case.id===caseId);
 if(!entry)throw Error("Unknown frozen review case");
 if(fs.statSync(candidateFile).size>2_000_000)throw Error("Semantic review candidate file too large");
 const packet=buildSemanticPacket({entry,candidateRaw:fs.readFileSync(candidateFile)});
 const dir=safeOut(outDir),packetFile=path.join(dir,"semantic-packet.json"),reviewFile=path.join(dir,"semantic-review.json");
 if(command==="prepare"){
  if(fs.existsSync(packetFile)||fs.existsSync(reviewFile))throw Error("Refusing overwrite of semantic review evidence");
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(packetFile,JSON.stringify(packet,null,2)+"\n");
  fs.writeFileSync(reviewFile,JSON.stringify(reviewDraft(packet),null,2)+"\n");
  return {status:"REVIEW_PREPARED_NOT_VERIFIED",sourceGate:packet.sourceGate,
   issues:packet.issues,items:packet.items.length,files:["semantic-packet.json","semantic-review.json"]};
 }
 if(command!=="check")throw Error("Choose prepare or check");
 const recorded=JSON.parse(fs.readFileSync(packetFile,"utf8"));
 if(digest(recorded)!==digest(packet))throw Error("Review packet stale: candidate or frozen source changed");
 return evaluateReview(packet,JSON.parse(fs.readFileSync(reviewFile,"utf8")));
}
const main=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
 try{
  const [command,manifestFile,projectsRoot,caseId,candidateFile,outDir]=process.argv.slice(2);
  if(!["prepare","check"].includes(command)||!manifestFile||!projectsRoot||!caseId||!candidateFile||!outDir)
   throw Error("Usage: node evals/semantic-review.mjs prepare|check <manifest.json> <repos-parent> <case-id> <candidate.json> <outside-repo-review-dir>");
  const manifest=JSON.parse(fs.readFileSync(manifestFile,"utf8"));
  const result=semanticReviewFiles({manifest,projectsRoot,caseId,candidateFile,outDir,command});
  console.log(JSON.stringify(result,null,2));
  if(command==="check"&&result.status!=="ATTESTED_NOT_INDEPENDENTLY_VERIFIED")process.exitCode=1;
 }catch(e){console.error("BLOCKED: "+e.message);process.exitCode=2;}
}
