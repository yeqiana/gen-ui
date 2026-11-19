import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessP1PublishReadiness} from "../evals/p1-publish-readiness.mjs";
// Synthetic handoffs keep this isolated test independent of sibling worktrees.
// The integrated suite will also evaluate the actual public handoffs.
const frozen={dsa:{schema:"genui-p1-dsa-human-review-handoff/v1",
 modules:Array.from({length:16},()=>({decision:"PENDING"})),chapters:Array.from({length:17},()=>({decision:"PENDING"})),
 independentHumanReview:"NOT_STARTED"},
 agentLead:{schema:"genui-p1-independent-semantic-review-handoff/v1",
 items:Array.from({length:29},()=>({reviewerDecision:"PENDING"}))},
 planShip:{schema:"genui-p1-plan-ship-independent-review-handoff/v1",
 edges:Array.from({length:13},()=>({humanDecision:"PENDING"})),
 globalReviewQuestions:Array.from({length:5},()=>({humanDecision:"PENDING"}))},
 previous:{schema:"genui-p1-four-slot-final-gate/v1",officialP1ReleaseDecision:"NO_GO",remoteCI:"NOT_RUN_ON_FINAL_COMMIT"}};
const fresh=()=>structuredClone(frozen);
test("all 33+29+18 pending reviews produce NO_GO",()=>{
 const r=assessP1PublishReadiness(fresh());
 assert.equal(r.status,"NO_GO");assert.ok(r.blockers.length>=4);
});
test("self-filled supported cannot forge human accreditation or remote CI",()=>{
 const x=fresh();x.dsa.modules.forEach(m=>m.decision="supported");
 x.dsa.chapters.forEach(m=>m.decision="supported");
 x.agentLead.items.forEach(m=>m.reviewerDecision="supported");
 [...x.planShip.edges,...x.planShip.globalReviewQuestions].forEach(m=>m.humanDecision="supported");
 x.previous.remoteCI="SUCCESS";
 const r=assessP1PublishReadiness(x);
 assert.equal(r.status,"NO_GO");assert.ok(r.blockers.some(x=>x.includes("CI")));
});
test("missing or changed evidence fails close",()=>{
 const x=fresh();x.planShip.edges.pop();x.agentLead.items.pop();x.dsa.chapters.pop();x.previous.officialP1ReleaseDecision="GO";
 const r=assessP1PublishReadiness(x);
 assert.equal(r.status,"NO_GO");assert.ok(r.blockers.length>=4);
});
