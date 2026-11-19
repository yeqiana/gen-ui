// Conservative GEN-UI P1 release evidence gate. Reading records is not authentication.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
export function assessP1PublishReadiness({dsa,agentLead,planShip,previous}){
 const blockers=[];
 const fail=(reason)=>blockers.push(reason);
 if(dsa?.schema!=="genui-p1-dsa-human-review-handoff/v1"||
    !Array.isArray(dsa.modules)||dsa.modules.length!==16||
    !Array.isArray(dsa.chapters)||dsa.chapters.length!==17)
  fail("DSA frozen 16 modules/17 chapters handoff missing or mismatched");
 else{
  if(dsa.independentHumanReview!=="NOT_STARTED"&&dsa.independentHumanReview!=="PENDING")
   fail("DSA review claims completion without authenticated evidence");
  if([...dsa.modules,...dsa.chapters].some(x=>x.decision!=="PENDING"))
   fail("DSA independent human decision edited; provenance unauthenticated");
  fail("DSA 33 independent semantic decisions not authenticated");
 }
 if(agentLead?.schema!=="genui-p1-independent-semantic-review-handoff/v1"||
    !Array.isArray(agentLead.items)||agentLead.items.length!==29)fail("Agent Lead 29-item handoff missing/mismatched");
 else{
  if(agentLead.items.some(x=>x.reviewerDecision!=="PENDING"))
   fail("Agent Lead review decision edited; provenance unauthenticated");
  fail("Agent Lead independent human review not authenticated");
 }
 if(planShip?.schema!=="genui-p1-plan-ship-independent-review-handoff/v1"||
    !Array.isArray(planShip.edges)||planShip.edges.length!==13||
    !Array.isArray(planShip.globalReviewQuestions)||planShip.globalReviewQuestions.length!==5)
  fail("PlanShip 13 edges/5 boundaries handoff missing/mismatched");
 else{
  if([...planShip.edges,...planShip.globalReviewQuestions].some(x=>x.humanDecision!=="PENDING"))
   fail("PlanShip review decisions edited; provenance unauthenticated");
  fail("PlanShip independent human review not authenticated");
 }
 if(previous?.schema!=="genui-p1-four-slot-final-gate/v1"||
    previous.officialP1ReleaseDecision!=="NO_GO")fail("Previous P1 freeze baseline has unexpected release state");
 fail("Final GitHub CI on the current integration commit not observed by this offline checker");
 return {schema:"genui-p1-release-gate-check/v1",status:"NO_GO",blockers,
  warning:"This local read-only check cannot authenticate humans or claim remote CI success. A human-controlled release process must inspect primary evidence."};
}
const main=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
 try{
  const [dsa,al,ps,prev]=process.argv.slice(2);
  if(!dsa||!al||!ps||!prev)throw Error("Usage: node evals/p1-publish-readiness.mjs <DSA-handoff.json> <AgentLead-handoff.json> <PlanShip-handoff.json> <previous-gate.json>");
  const load=p=>JSON.parse(fs.readFileSync(p,"utf8"));
  console.log(JSON.stringify(assessP1PublishReadiness({dsa:load(dsa),agentLead:load(al),planShip:load(ps),previous:load(prev)}),null,2));
  process.exitCode=1; // All unauthenticated offline records must fail release closed.
 }catch(e){console.error("NO_GO: "+e.message);process.exitCode=2}
}
