import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessDsaReview} from "../evals/dsa-review-gate.mjs";
import {assessPlanShipReview} from "../evals/plan-ship-review-gate.mjs";
import {assessP1PublishReadiness} from "../evals/p1-publish-readiness.mjs";
const load=name=>JSON.parse(fs.readFileSync(new URL("../evals/"+name,import.meta.url),"utf8"));
const d4=load("p1-dsa-editorial-v4-human-handoff-2026-11-19.json");
const d5=load("p1-dsa-editorial-v5-human-handoff-2026-11-19.json");
const ps2=load("p1-plan-ship-review-v3-human-handoff-2026-11-19.json");
const ps3=load("p1-plan-ship-editorial-v3-human-handoff-2026-11-19.json");
const agent=load("p1-agent-lead-editorial-v4-human-handoff-2026-11-19.json");
const mod=n=>d5.modules.find(x=>x.moduleId==="module-"+String(n).padStart(2,"0"));
test("DSA v5 preserves exact v4 editorial lineage without reusing historical approvals",()=>{
 assert.equal(d5.editorialParentCandidateSHA256,d4.modelCandidateSHA256);
 assert.notEqual(d5.modelCandidateSHA256,d4.modelCandidateSHA256);
 assert.match(d5.modelOrigin,/AUTHOR_EDITORIAL_V5/);
 assert.deepEqual([2,3,5,6].filter(n=>mod(n).claim!==d4.modules[n-1].claim),[2,3,5,6]);
 assert.ok([...d5.modules,...d5.chapters].every(x=>x.decision==="PENDING"&&x.reason===null));
});
test("DSA v5 chain ownership questions explicitly include role, location and generation",()=>{
 const text=mod(2).claim;
 for(const word of ["谁写","谁读","状态存储","唯一键","generation","重试","补偿","完成","告警"])assert.ok(text.includes(word),word);
 const refs=new Set(mod(2).sources.map(x=>x.line));
 for(const line of [23,61,62,65])assert.ok(refs.has(line),"Frozen line "+line);
});
test("DSA v5 lease and state machine scope includes token, retry limit and terminal timing",()=>{
 const text=mod(3).claim;
 for(const word of ["token","generation","retry limit","cursor","部分成功","terminal提前","crash","无租约"])assert.ok(text.includes(word),word);
 for(const line of [82,85,87,89,90])assert.ok(mod(3).sources.some(x=>x.line===line));
});
test("DSA v5 stale worker describes expected conflict observation without pretending test was run",()=>{
 const text=mod(5).claim;
 for(const word of ["A过期","B完成","旧写被拒","0行","等效证据","不把指标名当固定接口"])assert.ok(text.includes(word),word);
 assert.ok(mod(5).sources.some(x=>x.line===113));
});
test("DSA v5 delivery scope protects legitimate objects against coarse deduplication",()=>{
 const text=mod(6).claim;
 for(const word of ["duplicate receiver event","durable intent","失败粒度","去重不得误吞其他合法对象"])assert.ok(text.includes(word),word);
 for(const line of [124,127,128,129])assert.ok(mod(6).sources.some(x=>x.line===line));
});
test("PlanShip latest formal-delivery gate retains source and does not infer index-only disposition",()=>{
 assert.equal(ps3.editorialParentCandidateSHA256,ps2.modelCandidateSha256);
 assert.notEqual(ps3.modelCandidateSha256,ps2.modelCandidateSha256);
 assert.equal(ps3.edges.length,13);
 assert.equal(ps3.globalReviewQuestions.length,6);
 assert.equal(ps3.globalReviewQuestions.at(-1).line,58);
 assert.match(ps3.modelOrigin,/AUTHOR_EDITORIAL_V3/);
 assert.equal(assessPlanShipReview(ps3,ps3).status,"BLOCKED_REVIEW_INCOMPLETE");
});
test("Current candidate 80 reviewer decisions still block P1 Release",()=>{
 assert.equal(d5.modules.length+d5.chapters.length+agent.items.length+ps3.edges.length+ps3.globalReviewQuestions.length,80);
 assert.equal(assessDsaReview(d5,d5).pending,33);
 const gate=assessP1PublishReadiness({dsa:d5,agentLead:agent,planShip:ps3,previous:load("p1-four-slot-final-gate-2026-11-19.json")});
 assert.equal(gate.status,"NO_GO");
 assert.ok(gate.blockers.length>=4);
});
