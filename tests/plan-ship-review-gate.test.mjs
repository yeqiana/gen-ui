import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessPlanShipReview} from "../evals/plan-ship-review-gate.mjs";
const frozen=JSON.parse(fs.readFileSync(new URL("../evals/p1-plan-ship-independent-review-handoff-2026-11-19.json",import.meta.url)));
const fresh=()=>structuredClone(frozen);
test("13 edges plus five boundary questions remain pending",()=>{
 const r=assessPlanShipReview(frozen,fresh());assert.equal(r.status,"BLOCKED_REVIEW_INCOMPLETE");assert.equal(r.pending,18);
});
test("all supported decisions with reasons still require independent identity verification",()=>{
 const r=fresh();for(const e of [...r.edges,...r.globalReviewQuestions]){e.humanDecision="supported";e.reason="Compared against the frozen source, without independent identity proof";}
 r.reviewerIdentity="Unverified self declared person";
 assert.equal(assessPlanShipReview(frozen,r).status,"REVIEW_FILLED_IDENTITY_UNVERIFIED");
});
test("mutated arrows, source or gold hashes always fail closed",()=>{
 for(const mutate of [
 r=>r.edges[0].sourceLine++,
 r=>r.edges[4].condition="No",
 r=>r.edges[11].toId="manual-acceptance",
 r=>r.edges[11].humanDecision="supported",
 r=>r.globalReviewQuestions.pop(),
 r=>r.modelCandidateSha256="f".repeat(64),
 r=>r.goldenSha256="a".repeat(64)
 ]){const r=fresh();mutate(r);assert.equal(assessPlanShipReview(frozen,r).status,"BLOCKED_TAMPER_OR_INVALID")}
});
test("explicit semantic disagreement remains blocked",()=>{
 const r=fresh();r.edges[11].humanDecision="unsupported";r.edges[11].reason="The error edge does not match the candidate business behavior";
 assert.equal(assessPlanShipReview(frozen,r).status,"BLOCKED_SEMANTIC_DISAGREEMENT");
});

const editorialV2=JSON.parse(fs.readFileSync(new URL("../evals/p1-plan-ship-editorial-v2-human-handoff-2026-11-19.json",import.meta.url)));
test("versioned HTML+index reviewer requirement is sixth pending decision",()=>{
 const r=assessPlanShipReview(editorialV2,structuredClone(editorialV2));
 assert.equal(r.status,"BLOCKED_REVIEW_INCOMPLETE");assert.equal(r.pending,19);
 const changed=structuredClone(editorialV2);changed.globalReviewQuestions[5].line=11;
 assert.equal(assessPlanShipReview(editorialV2,changed).status,"BLOCKED_TAMPER_OR_INVALID");
});
