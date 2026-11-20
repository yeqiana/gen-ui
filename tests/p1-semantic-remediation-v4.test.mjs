import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessDsaReview} from "../evals/dsa-review-gate.mjs";
import {assessAgentLeadReview} from "../evals/agent-lead-review-gate.mjs";
import {assessPlanShipReview} from "../evals/plan-ship-review-gate.mjs";
import {assessP1PublishReadiness} from "../evals/p1-publish-readiness.mjs";
const load=n=>JSON.parse(fs.readFileSync(new URL("../evals/"+n,import.meta.url),"utf8"));
const d3=load("p1-dsa-editorial-v3-human-handoff-2026-11-19.json");
const d4=load("p1-dsa-editorial-v4-human-handoff-2026-11-19.json");
const p0=load("p1-dsa-source-repair-p0-2026-11-19.json");
const p1=load("p1-dsa-source-repair-p1-2026-11-19.json");
const a3=load("p1-agent-lead-editorial-v3-human-handoff-2026-11-19.json");
const a4=load("p1-agent-lead-editorial-v4-human-handoff-2026-11-19.json");
const ps2=load("p1-plan-ship-editorial-v2-human-handoff-2026-11-19.json");
const ps3=load("p1-plan-ship-review-v3-human-handoff-2026-11-19.json");
const ch=n=>d4.chapters.find(x=>x.number===n);
const mod=id=>d4.modules.find(x=>x.moduleId===id);
test("v4 retains source lineage and all corrected audit scope stays pending",()=>{
 assert.equal(d4.editorialParentCandidateSHA256,d3.modelCandidateSHA256);
 assert.notEqual(d4.modelCandidateSHA256,d3.modelCandidateSHA256);
 assert.equal(p0.parentCandidateSHA256,d3.modelCandidateSHA256);
 assert.equal(p1.parentCandidateSHA256,d3.modelCandidateSHA256);
 assert.deepEqual(new Set([...p0.modules,...p1.modules].map(x=>x.id)).size,7);
 assert.equal(d4.modules.length,16);
 assert.equal(d4.chapters.length,17);
 assert.equal(assessDsaReview(d4,d4).status,"BLOCKED_REVIEW_INCOMPLETE");
 assert.ok([...d4.modules,...d4.chapters].every(x=>x.decision==="PENDING"&&x.reason===null));
});
test("DSA chapter 1 retains mandatory template boundary and symptom fields",()=>{
 const ids=new Set(mod("module-01").sources.map(x=>x.line));
 assert.ok(ids.has(3),"SOP source boundary must be directly cited");
 for(const line of [7,9,10,11,12,13,14,15,16,17,18,19])assert.ok(ch(1).sourceLines.includes(line),"Missing symptom field "+line);
 assert.ok(mod("module-01").claim.includes("错误码"));
 assert.ok(mod("module-01").claim.includes("未验证")||mod("module-01").claim.includes("待填"));
});
test("DSA chapter 16 and 17 cannot collapse stop criteria or final delivery to one label",()=>{
 for(const line of [261,262,263,264,266])assert.ok(ch(16).sourceLines.includes(line),"Stop criterion "+line);
 for(const line of [269,270,271,272,273,274,275,276,277,278,279,280,281])assert.ok(ch(17).sourceLines.includes(line),"Delivery field "+line);
 assert.ok(mod("module-16").claim.includes("剩余风险"));
 assert.ok(mod("module-16").claim.includes("未验证"));
});
test("DSA chapters 2-6 represent workflow and failure matrix, not only a citation stub",()=>{
 const expected={2:[23,61,62,65],3:[81,83,86,88,90,91],4:[95,99,100,101,102,103],5:[108,110,113],6:[116,117,118,119,120,122,123,127,128,129]};
 for(const [num,lines] of Object.entries(expected))for(const line of lines)assert.ok(ch(Number(num)).sourceLines.includes(line),"Chapter "+num+" line "+line);
 for(const id of ["module-02","module-03","module-04","module-05","module-06"])assert.ok(mod(id).sources.length>=5,id+" needs meaningful anchors");
});
test("Agent Lead withdraws unsupported relation without erasing historical human review item",()=>{
 assert.equal(a4.editorialParentCandidateSHA256,a3.editorialCandidateSHA256);
 assert.notEqual(a4.editorialCandidateSHA256,a3.editorialCandidateSHA256);
 assert.equal(a4.items.length,28);
 assert.equal(a4.items.at(-1).key,"relation:0");
 assert.equal(a4.items.at(-1).kind,"withdrawn_relation");
 assert.match(a4.items.at(-1).claim,/撤回/);
 assert.equal(assessAgentLeadReview(a4,a4).status,"BLOCKED_REVIEW_INCOMPLETE");
});
test("PlanShip review scope no longer claims unspecified plan-only exemption or lone-index gate",()=>{
 assert.equal(ps3.modelCandidateSha256,ps2.modelCandidateSha256);
 assert.equal(ps3.edges.length,13);
 assert.equal(ps3.globalReviewQuestions.length,6);
 const rule=ps3.globalReviewQuestions.at(-1).rule;
 assert.match(rule,/不能据此推断/);
 assert.match(rule,/索引/);
 assert.equal(assessPlanShipReview(ps3,ps3).status,"BLOCKED_REVIEW_INCOMPLETE");
});
test("latest 33+28+19 reviewer obligations remain blocked for official P1 release",()=>{
 const previous=load("p1-four-slot-final-gate-2026-11-19.json");
 assert.equal(d4.modules.length+d4.chapters.length+a4.items.length+ps3.edges.length+ps3.globalReviewQuestions.length,80);
 const gate=assessP1PublishReadiness({dsa:d4,agentLead:a4,planShip:ps3,previous});
 assert.equal(gate.status,"NO_GO");
 assert.ok(gate.blockers.length>=4);
});
