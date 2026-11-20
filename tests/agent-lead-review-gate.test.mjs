import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessAgentLeadReview} from "../evals/agent-lead-review-gate.mjs";
const baseline=JSON.parse(fs.readFileSync(new URL("../evals/p1-agent-lead-independent-review-handoff-2026-11-19.json",import.meta.url)));
const make=()=>structuredClone(baseline);
test("all 29 untouched pending decisions block release",()=>{
 const r=assessAgentLeadReview(baseline,make());
 assert.equal(r.status,"BLOCKED_REVIEW_INCOMPLETE");assert.equal(r.pending,29);
});
test("all 29 self-filled supported still cannot attest independent human identity",()=>{
 const copy=make();copy.items.forEach(i=>{i.reviewerDecision="supported";i.reviewerReason="Source reviewed but human identity is not verifiable in this tool."});
 copy.reviewerIdentity="An invented reviewer";copy.signoffEvidence="self-provided";
 assert.equal(assessAgentLeadReview(baseline,copy).status,"REVIEW_FILLED_IDENTITY_UNVERIFIED");
});
test("source, commit, candidate, item and evidence edits all fail close",()=>{
 for(const mutate of [
 r=>{r.sourceCommit="f".repeat(40)},r=>{r.editorialCandidateSHA256="b".repeat(64)},
 r=>{r.items[0].key="module:1"},r=>{r.items[1].sources[0].line=999},
 r=>r.items.pop(),r=>{r.items[2].claim="Different"}
 ]){const r=make();mutate(r);assert.equal(assessAgentLeadReview(baseline,r).status,"BLOCKED_TAMPER_OR_INVALID")}
});
test("unsupported or unclear and unsupported decisions without rationales block",()=>{
 const r=make();r.items[0].reviewerDecision="unsupported";r.items[0].reviewerReason="The frozen source does not support this title";
 assert.equal(assessAgentLeadReview(baseline,r).status,"BLOCKED_SEMANTIC_DISAGREEMENT");
 const bad=make();bad.items[0].reviewerDecision="supported";
 assert.equal(assessAgentLeadReview(baseline,bad).status,"BLOCKED_TAMPER_OR_INVALID");
});

const v3=JSON.parse(fs.readFileSync(new URL("../evals/p1-agent-lead-editorial-v3-human-handoff-2026-11-19.json",import.meta.url)));
test("editorial v3 28-item source review remains pending and parent hash bound",()=>{
 assert.equal(v3.items.length,28);
 const r=assessAgentLeadReview(v3,structuredClone(v3));
 assert.equal(r.status,"BLOCKED_REVIEW_INCOMPLETE");assert.equal(r.pending,28);
 const changed=structuredClone(v3);changed.editorialParentCandidateSHA256="f".repeat(64);
 assert.equal(assessAgentLeadReview(v3,changed).status,"BLOCKED_TAMPER_OR_INVALID");
});
