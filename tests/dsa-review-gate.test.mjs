import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessDsaReview} from "../evals/dsa-review-gate.mjs";
const frozen=JSON.parse(fs.readFileSync(new URL("../evals/p1-dsa-independent-review-handoff-2026-11-19.json",import.meta.url)));
const fresh=()=>structuredClone(frozen);
test("frozen 16 modules + 17 chapters await independent review",()=>{
 const r=assessDsaReview(frozen,fresh());assert.equal(r.status,"BLOCKED_REVIEW_INCOMPLETE");assert.equal(r.pending,33);
});
test("all supported without authenticated signature cannot authorize release",()=>{
 const x=fresh();for(const entry of [...x.modules,...x.chapters]){entry.decision="supported";entry.reason="Direct source line independently assessed but identity not verified."}
 assert.equal(assessDsaReview(frozen,x).status,"REVIEW_FILLED_IDENTITY_UNVERIFIED");
});
test("source line, model hash, chapter and title drift block",()=>{
 for(const change of [
 x=>x.modelCandidateSHA256="a".repeat(64),
 x=>x.modules[0].sources[0].line=100,
 x=>x.chapters[0].sourceLines.push(999),
 x=>x.modules[2].claim="New claim",
 x=>x.chapters.pop(),
 x=>{x.modules[0].decision="supported"}
 ]){const x=fresh();change(x);assert.equal(assessDsaReview(frozen,x).status,"BLOCKED_TAMPER_OR_INVALID")}
});
test("one unsupported item blocks even when others pending",()=>{
 const x=fresh();x.modules[0].decision="unsupported";x.modules[0].reason="The SOP has no such deployed feature in this source";
 assert.equal(assessDsaReview(frozen,x).status,"BLOCKED_SEMANTIC_DISAGREEMENT");
});
