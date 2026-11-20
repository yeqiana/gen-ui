// Optional frozen DSA human-review consistency check; not an identity verifier.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
export function assessDsaReview(base,review){
 const issues=[];
 if(base?.schema!=="genui-p1-dsa-human-review-handoff/v1"||base.caseId!=="distributed-system-audit"||
    !Array.isArray(base.modules)||base.modules.length!==16||
    !Array.isArray(base.chapters)||base.chapters.length!==17)
  return {status:"BLOCKED_INVALID_BASELINE",issues:["Incorrect DSA public frozen handoff"]};
 for(const field of ["caseId","frozenCommit","modelCandidateSHA256","selectionSHA256","sourceChapters","directlyCitedChapters"]){
  if(base[field]!==review?.[field])issues.push("Source/identity mismatch "+field);
 }
 const validate=(name,expected,got)=>{
  if(!Array.isArray(got)||expected.length!==got.length){issues.push(name+" count changed");return}
  for(let i=0;i<expected.length;i++){
   const a=expected[i],b=got[i];
   if(!b){issues.push(name+" missing "+i);continue}
   for(const field of Object.keys(a).filter(k=>!["decision","reason"].includes(k)))
    if(JSON.stringify(a[field])!==JSON.stringify(b[field]))issues.push(name+" source/title/line mismatch "+i+"/"+field);
   if(!["PENDING","supported","unsupported","unclear"].includes(b.decision))
    issues.push(name+" bad decision "+i);
   if(b.decision!=="PENDING"&&(typeof b.reason!=="string"||b.reason.trim().length<12))
    issues.push(name+" missing reason "+i);
  }
 };
 validate("module",base.modules,review?.modules);
 validate("chapter",base.chapters,review?.chapters);
 if(issues.length)return {status:"BLOCKED_TAMPER_OR_INVALID",issues};
 const x=[...review.modules,...review.chapters],pending=x.filter(v=>v.decision==="PENDING").length,
 unsupported=x.filter(v=>v.decision==="unsupported").length,unclear=x.filter(v=>v.decision==="unclear").length;
 if(unsupported||unclear)return {status:"BLOCKED_SEMANTIC_DISAGREEMENT",pending,unsupported,unclear,issues:[]};
 if(pending)return {status:"BLOCKED_REVIEW_INCOMPLETE",pending,unsupported,unclear,issues:[]};
 return {status:"REVIEW_FILLED_IDENTITY_UNVERIFIED",pending:0,unsupported:0,unclear:0,
  warning:"33 completed judgments are not authenticated human signatures or independent verification."};
}
const main=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)try{
 const [frozenFile,reviewFile]=process.argv.slice(2);
 if(!frozenFile||!reviewFile)throw Error("Usage: node evals/dsa-review-gate.mjs <frozen.json> <review-outside-repository.json>");
 console.log(JSON.stringify(assessDsaReview(JSON.parse(fs.readFileSync(frozenFile)),JSON.parse(fs.readFileSync(reviewFile))),null,2));
 process.exitCode=1; // no offline review can authenticate a human or green-light P1
}catch(e){console.error("BLOCKED: "+e.message);process.exitCode=2}
