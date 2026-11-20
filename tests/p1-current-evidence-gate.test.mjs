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
