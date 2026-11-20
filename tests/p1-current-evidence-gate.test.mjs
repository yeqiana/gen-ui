import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {assessCurrentP1Evidence} from "../evals/p1-current-evidence-gate.mjs";
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../evals");
const sourceFiles=["p1-dsa-editorial-v6-candidate-2026-11-20.json","p1-dsa-editorial-v6-human-handoff-2026-11-20.json","p1-agent-lead-editorial-v4-candidate-2026-11-20.json","p1-agent-lead-editorial-v4-human-handoff-2026-11-19.json","p1-plan-ship-editorial-v3-candidate-2026-11-20.json","p1-plan-ship-editorial-v3-human-handoff-2026-11-19.json","p1-four-slot-final-gate-2026-11-19.json"];
function sandbox(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),"genui-current-gate-"));for(const n of sourceFiles)fs.copyFileSync(path.join(base,n),path.join(dir,n));try{fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}}
test("current candidate hashes are exact but release remains NO_GO",()=>{const r=assessCurrentP1Evidence();assert.equal(r.artifactIntegrity,"PASS");assert.equal(r.release,"NO_GO");assert.equal(Object.keys(r.currentCandidateSHA256).length,3)});
test("edited DSA content cannot retain original review SHA",()=>sandbox(dir=>{const f=path.join(dir,sourceFiles[0]),j=JSON.parse(fs.readFileSync(f));j.cases[0].layers[0].modules[0].title+=" falsified";fs.writeFileSync(f,JSON.stringify(j));const r=assessCurrentP1Evidence(dir);assert.equal(r.artifactIntegrity,"FAIL");assert.ok(r.findings.some(x=>x.includes("SHA256")))}));
test("missing Agent Lead candidate blocks even with handoff available",()=>sandbox(dir=>{fs.unlinkSync(path.join(dir,sourceFiles[2]));const r=assessCurrentP1Evidence(dir);assert.equal(r.artifactIntegrity,"FAIL");assert.ok(r.findings.some(x=>x.includes("agent-lead")))}));
test("edited PlanShip human result cannot be treated as verified",()=>sandbox(dir=>{const f=path.join(dir,sourceFiles[5]),j=JSON.parse(fs.readFileSync(f));j.edges[0].humanDecision="supported";fs.writeFileSync(f,JSON.stringify(j));const r=assessCurrentP1Evidence(dir);assert.equal(r.artifactIntegrity,"FAIL");assert.equal(r.release,"NO_GO")}));

test("withdrawn Agent Lead relation and PlanShip delivery boundary require explicit human verification",()=>{
 const agent=JSON.parse(fs.readFileSync(path.join(base,"p1-agent-lead-editorial-v4-human-handoff-2026-11-19.json"),"utf8"));
 const ship=JSON.parse(fs.readFileSync(path.join(base,"p1-plan-ship-editorial-v3-human-handoff-2026-11-19.json"),"utf8"));
 const a=agent.items.find(x=>x.key==="relation:0"),s=ship.globalReviewQuestions[5];
 assert.equal(a.kind,"withdrawn_relation");
 assert.equal(a.reviewerDecision,"PENDING");
 assert.deepEqual(a.sources.map(x=>x.line),[17,47]);
 assert.match(a.requiredQuestion,/composes/);
 assert.match(a.requiredQuestion,/撤回/);
 assert.equal(s.humanDecision,"PENDING");
 assert.equal(s.line,58);
 assert.match(s.requiredQuestion,/HTML/);
 assert.match(s.requiredQuestion,/索引/);
 assert.match(s.requiredQuestion,/豁免/);
});
