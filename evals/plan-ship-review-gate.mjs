// Verify that a submitted external PlanShip review matches frozen edges and source.
// This does not authenticate a reviewer or approve release.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
export function assessPlanShipReview(frozen,review){
 const issues=[];
 if(frozen?.schema!=="genui-p1-plan-ship-independent-review-handoff/v1"||frozen.caseId!=="plan-ship"||
   !Array.isArray(frozen.edges)||frozen.edges.length!==13||!Array.isArray(frozen.globalReviewQuestions)||![5,6].includes(frozen.globalReviewQuestions.length)||
   (frozen.globalReviewQuestions.length===6&&
    (frozen.globalReviewQuestions[5]?.sourceFile!=="docs/quality-gates.md"||frozen.globalReviewQuestions[5]?.line!==58||
     frozen.editorialOrigin!=="MANUAL_EDITORIAL_V2_FROM_REAL_MODEL_NOT_NEW_MODEL"||!frozen.originalModelCandidateSha256)))
  return {status:"BLOCKED_INVALID_BASELINE",issues:["Frozen plan-ship review specification invalid"]};
 for(const field of ["caseId","sourceCommit","modelCandidateSha256","goldenSha256","technicalSourceGate","technicalEdgeCount",
  ...(frozen.globalReviewQuestions.length===6?["originalModelCandidateSha256","editorialOrigin"]:[])]){
  if(frozen[field]!==review?.[field])issues.push("Frozen identity mismatch: "+field);
 }
 const inspect=(label,expected,received,mutable)=>{
  if(!Array.isArray(received)||received.length!==expected.length){issues.push(label+" count mismatch");return}
  for(let i=0;i<expected.length;i++){
   const a=expected[i],b=received[i];
   if(!b){issues.push("Missing "+label+" item "+i);continue}
   for(const field of Object.keys(a).filter(k=>!mutable.includes(k)))
    if(JSON.stringify(a[field])!==JSON.stringify(b[field]))issues.push(label+" source/edge mutation at "+i+"/"+field);
   if(!["PENDING","supported","unsupported","unclear"].includes(b.humanDecision))
    issues.push(label+" invalid decision at "+i);
   if(b.humanDecision!=="PENDING"&&(typeof b.reason!=="string"||b.reason.trim().length<12))
    issues.push(label+" missing substantive reason at "+i);
  }
 };
 inspect("edge",frozen.edges,review?.edges,["humanDecision","reason"]);
 inspect("global",frozen.globalReviewQuestions,review?.globalReviewQuestions,["humanDecision","reason"]);
 if(issues.length)return {status:"BLOCKED_TAMPER_OR_INVALID",issues};
 const all=[...review.edges,...review.globalReviewQuestions],pending=all.filter(x=>x.humanDecision==="PENDING").length,
 unsupported=all.filter(x=>x.humanDecision==="unsupported").length,unclear=all.filter(x=>x.humanDecision==="unclear").length;
 if(unsupported||unclear)return {status:"BLOCKED_SEMANTIC_DISAGREEMENT",pending,unsupported,unclear,issues:[]};
 if(pending)return {status:"BLOCKED_REVIEW_INCOMPLETE",pending,unsupported,unclear,issues:[]};
 return {status:"REVIEW_FILLED_IDENTITY_UNVERIFIED",pending:0,unsupported:0,unclear:0,
  warning:"Offline text cannot establish external reviewer identity or signoff provenance. Never release P1 based on this alone."};
}
const main=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)try{
 const [baselineFile,reviewFile]=process.argv.slice(2);
 if(!baselineFile||!reviewFile)throw Error("Usage: node evals/plan-ship-review-gate.mjs <frozen-handoff.json> <review-outside-repo.json>");
 console.log(JSON.stringify(assessPlanShipReview(JSON.parse(fs.readFileSync(baselineFile)),JSON.parse(fs.readFileSync(reviewFile))),null,2));
 // Strictly never report release success from unauthenticated local evidence.
 process.exitCode=1;
}catch(e){console.error("BLOCKED: "+e.message);process.exitCode=2}
