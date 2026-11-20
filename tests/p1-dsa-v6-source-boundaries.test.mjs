import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import {assessDsaReview} from "../evals/dsa-review-gate.mjs";
import {assessP1PublishReadiness} from "../evals/p1-publish-readiness.mjs";
const load=name=>JSON.parse(fs.readFileSync(new URL("../evals/"+name,import.meta.url),"utf8"));
const bytes=fs.readFileSync(new URL("../evals/p1-dsa-editorial-v6-candidate-2026-11-20.json",import.meta.url));
const candidate=JSON.parse(bytes).cases[0],handoff=load("p1-dsa-editorial-v6-human-handoff-2026-11-20.json"),prev=load("p1-dsa-editorial-v5-human-handoff-2026-11-19.json");
const modules=candidate.layers.flatMap(l=>l.modules),mod=n=>modules.find(x=>x.id==="module-"+String(n).padStart(2,"0")),ref=n=>handoff.modules.find(x=>x.moduleId==="module-"+String(n).padStart(2,"0"));
test("v6 source is content addressed and descends from v5 without a paid model run",()=>{
 assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),handoff.modelCandidateSHA256);
 assert.equal(handoff.editorialParentCandidateSHA256,prev.modelCandidateSHA256);assert.match(handoff.modelOrigin,/AUTHOR_EDITORIAL_V6/);
 assert.equal(modules.length,16);assert.equal(candidate.status,"documented");
});
test("transaction template keeps success baseline, projection, failure and crash cases",()=>{
 const text=mod(4).title+" "+candidate.notes;
 for(const term of ["Outbox 成功","缓存/投影","DB rollback","commit 前","commit 后","不可恢复半提交"])assert.ok(text.includes(term),term);
 for(const n of [93,94,95,96,97,98,99,100,101,102,103])assert.ok(ref(4).sources.some(x=>x.line===n),"source "+n);
});
test("lease preserves full claim/steal/complete sequence with observable stale write rejection",()=>{
 const text=mod(5).title+" "+candidate.notes;
 for(const term of ["A claim","B steal","B complete","A恢复","0行","不固定指标名"])assert.ok(text.includes(term),term);
 for(const n of [106,108,109,110,111,113])assert.ok(ref(5).sources.some(x=>x.line===n),"source "+n);
});
test("delivery preserves receiver 100/99/1 partial success and legitimate object deduplication",()=>{
 const text=mod(6).title+" "+candidate.notes;
 for(const term of ["100 receivers","99 success","1 fail","duplicate receiver event","durable","去重不得吞掉其他合法对象"])assert.ok(text.includes(term),term);
 for(const n of [122,123,124,127,128,129])assert.ok(ref(6).sources.some(x=>x.line===n),"source "+n);
});
test("v6 retains 80 human decisions PENDING and formal P1 release NO_GO",()=>{
 assert.ok([...handoff.modules,...handoff.chapters].every(x=>x.decision==="PENDING"&&x.reason===null));
 assert.match(candidate.notes,/模板|未实际执行|待测/);assert.equal(assessDsaReview(handoff,handoff).status,"BLOCKED_REVIEW_INCOMPLETE");
 const al=load("p1-agent-lead-editorial-v4-human-handoff-2026-11-19.json"),ps=load("p1-plan-ship-editorial-v3-human-handoff-2026-11-19.json");
 assert.equal(handoff.modules.length+handoff.chapters.length+al.items.length+ps.edges.length+ps.globalReviewQuestions.length,80);
 const gate=assessP1PublishReadiness({dsa:handoff,agentLead:al,planShip:ps,previous:load("p1-four-slot-final-gate-2026-11-19.json")});assert.equal(gate.status,"NO_GO");
});
