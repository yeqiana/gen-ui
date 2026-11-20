import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {assessP1PublishReadiness} from "./p1-publish-readiness.mjs";
const home=path.dirname(fileURLToPath(import.meta.url));
const specs=[
 {id:"distributed-system-audit",candidate:"p1-dsa-editorial-v6-candidate-2026-11-20.json",handoff:"p1-dsa-editorial-v6-human-handoff-2026-11-20.json",field:"modelCandidateSHA256"},
 {id:"agent-lead",candidate:"p1-agent-lead-editorial-v4-candidate-2026-11-20.json",handoff:"p1-agent-lead-editorial-v4-human-handoff-2026-11-19.json",field:"editorialCandidateSHA256"},
 {id:"plan-ship",candidate:"p1-plan-ship-editorial-v3-candidate-2026-11-20.json",handoff:"p1-plan-ship-editorial-v3-human-handoff-2026-11-19.json",field:"modelCandidateSha256"}
];
const readJSON=f=>JSON.parse(fs.readFileSync(f,"utf8"));
const digest=b=>crypto.createHash("sha256").update(b).digest("hex");
export function assessCurrentP1Evidence(base=home){
 const findings=[],loaded={},shaByCase={};
 for(const s of specs){
  try{
   const b=fs.readFileSync(path.join(base,s.candidate)),obj=JSON.parse(b),h=readJSON(path.join(base,s.handoff)),hash=digest(b);
   if(obj?.cases?.length!==1||obj.cases[0].id!==s.id)throw Error("candidate case ID mismatch");
   if(hash!==h[s.field])throw Error("candidate SHA256 does not match latest handoff");
   if(s.id==="distributed-system-audit"){
    const mods=obj.cases[0].layers.flatMap(x=>x.modules);
    if(mods.length!==16||h.modules.length!==16||h.chapters.length!==17)throw Error("DSA scope mismatch");
    if(mods.some((m,i)=>h.modules[i].moduleId!==m.id||h.modules[i].claim!==m.title))throw Error("DSA module content differs from handoff");
    if([...h.modules,...h.chapters].some(x=>x.decision!=="PENDING"||x.reason!==null))throw Error("DSA human decisions not pending");
   }
   if(s.id==="agent-lead"){
    if(obj.cases[0].layers.flatMap(x=>x.modules).length!==27||obj.cases[0].relations.length!==0||h.items.length!==28||h.items.some(x=>x.reviewerDecision!=="PENDING"))throw Error("Agent Lead scope/decision mismatch");
   }
   if(s.id==="plan-ship"){
    if(obj.cases[0].relations.length!==13||h.edges.length!==13||h.globalReviewQuestions.length!==6||[...h.edges,...h.globalReviewQuestions].some(x=>x.humanDecision!=="PENDING"))throw Error("PlanShip scope/decision mismatch");
   }
   loaded[s.id]=h;shaByCase[s.id]=hash;
  }catch(e){findings.push(s.id+": "+e.message)}
 }
 try{
  const prev=readJSON(path.join(base,"p1-four-slot-final-gate-2026-11-19.json"));
  if(Object.keys(loaded).length===3){
   const verdict=assessP1PublishReadiness({dsa:loaded["distributed-system-audit"],agentLead:loaded["agent-lead"],planShip:loaded["plan-ship"],previous:prev});
   if(verdict.status!=="NO_GO")findings.push("offline release checker must remain NO_GO");
  }
 }catch(e){findings.push("baseline gate: "+e.message)}
 return {schema:"genui-p1-current-artifact-gate/v1",artifactIntegrity:findings.length===0?"PASS":"FAIL",release:"NO_GO",humanReview:"NOT_AUTHENTICATED",remoteCI:"NOT_VERIFIED",currentCandidateSHA256:shaByCase,findings};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=assessCurrentP1Evidence(process.argv[2]||home);console.log(JSON.stringify(result,null,2));
 if(result.artifactIntegrity!=="PASS")process.exitCode=1;
}
