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

test("three versioned editorial handoffs remain pending without false invalid baseline",()=>{
 const load=name=>JSON.parse(fs.readFileSync(new URL("../evals/"+name,import.meta.url)));
 const updated={
  dsa:load("p1-dsa-editorial-v2-human-handoff-2026-11-19.json"),
  agentLead:load("p1-agent-lead-editorial-v3-human-handoff-2026-11-19.json"),
  planShip:load("p1-plan-ship-editorial-v2-human-handoff-2026-11-19.json"),
  previous:load("p1-four-slot-final-gate-2026-11-19.json")
 };
 assert.equal(updated.dsa.modules.length+updated.dsa.chapters.length,33);
 assert.equal(updated.agentLead.items.length,28);
 assert.equal(updated.planShip.edges.length+updated.planShip.globalReviewQuestions.length,19);
 const r=assessP1PublishReadiness(updated);
 assert.equal(r.status,"NO_GO");
 assert.equal(r.blockers.length,4);
 assert.ok(r.blockers.every(x=>!x.includes("missing/mismatched")));
});
