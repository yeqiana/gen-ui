// Optional audit of an *external* completed review against the frozen Agent Lead handoff.
// Cryptographic identity of a human is NOT established here. This cannot release P1.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export function assessAgentLeadReview(frozen,review){
 const issues=[];
 if(frozen?.schema!=="genui-p1-independent-semantic-review-handoff/v1"||frozen.caseId!=="agent-lead"||!Array.isArray(frozen.items)||![28,29].includes(frozen.items.length)||
    (frozen.items.length===28&&(!frozen.editorialParentCandidateSHA256||frozen.items.some(x=>x.key==="relation:1")||frozen.items[27]?.key!=="relation:0")))
  return {status:"BLOCKED_INVALID_BASELINE",issues:["Unexpected frozen Agent Lead review handoff"]};
 const fixed=["caseId","sourceCommit","originalClaudeCandidateSHA256","editorialCandidateSHA256"];
 if(frozen.items.length===28)fixed.push("editorialParentCandidateSHA256");
 for(const name of fixed)if(typeof frozen[name]!=="string"||!frozen[name]||review?.[name]!==frozen[name])issues.push("Frozen identity mismatch: "+name);
 if(!Array.isArray(review?.items)||review.items.length!==frozen.items.length)
  issues.push("Review item count mismatch");
 else{
  const seen=new Set();
  for(let i=0;i<frozen.items.length;i++){
   const expect=frozen.items[i],given=review.items[i];
   if(!given||given.key!==expect.key||given.claim!==expect.claim||given.kind!==expect.kind||
      given.requiredQuestion!==expect.requiredQuestion||
      JSON.stringify(given.sources)!==JSON.stringify(expect.sources)||seen.has(given.key)){
    issues.push("Review item order/identity/source mismatch at "+i);continue;
   }
   seen.add(given.key);
   if(!["PENDING","supported","unsupported","unclear"].includes(given.reviewerDecision))
    issues.push("Invalid review decision "+given.key);
   else if(given.reviewerDecision!=="PENDING"&&
      (typeof given.reviewerReason!=="string"||given.reviewerReason.trim().length<12))
    issues.push("Missing substantive rationale "+given.key);
  }
 }
 if(issues.length)return {status:"BLOCKED_TAMPER_OR_INVALID",issues};
 const pending=review.items.filter(i=>i.reviewerDecision==="PENDING").length;
 const unsupported=review.items.filter(i=>i.reviewerDecision==="unsupported").length;
 const unclear=review.items.filter(i=>i.reviewerDecision==="unclear").length;
 if(unsupported||unclear)return {status:"BLOCKED_SEMANTIC_DISAGREEMENT",pending,unsupported,unclear,issues:[]};
 if(pending)return {status:"BLOCKED_REVIEW_INCOMPLETE",pending,unsupported,unclear,issues:[]};
 return {status:"REVIEW_FILLED_IDENTITY_UNVERIFIED",pending:0,unsupported:0,unclear:0,
  issues:[],warning:"All frozen decisions have rationales, but this offline tool cannot authenticate reviewer independence, identities or signatures. Never infer release approval."};
}
const main=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
 const [frozenFile,reviewFile]=process.argv.slice(2);
 try{
  if(!frozenFile||!reviewFile)throw Error("Usage: node evals/agent-lead-review-gate.mjs <frozen-public-handoff.json> <completed-review-outside-repo.json>");
  const base=JSON.parse(fs.readFileSync(frozenFile)),review=JSON.parse(fs.readFileSync(reviewFile));
  const result=assessAgentLeadReview(base,review);
  console.log(JSON.stringify(result,null,2));
  // No locally filled review is an independently authenticated signoff.
  process.exitCode=1;
 }catch(e){console.error("BLOCKED: "+e.message);process.exitCode=2}
}
