import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const load=name=>JSON.parse(fs.readFileSync(new URL("../evals/"+name,import.meta.url),"utf8"));
const v2=load("p1-dsa-editorial-v2-human-handoff-2026-11-19.json");
const v3=load("p1-dsa-editorial-v3-human-handoff-2026-11-19.json");
const row=id=>v3.modules.find(x=>x.moduleId===id);
const lineSet=x=>new Set(x.sources.map(y=>y.line));
test("DSA v3 lineage differs from parent v2 and never claims a new model run",()=>{
 assert.equal(v3.editorialParentCandidateSHA256,v2.modelCandidateSHA256);
 assert.notEqual(v3.modelCandidateSHA256,v2.modelCandidateSHA256);
 assert.match(v3.modelOrigin,/AUTHOR_EDITORIAL_V3/);
 assert.equal(v3.modules.length,16);assert.equal(v3.chapters.length,17);
});
test("Recovery title cannot omit Detection or Repair Owner",()=>{
 const m=row("module-11");
 for(const word of ["Failure","Detection","Repair Owner","RTO"])assert.ok(m.claim.includes(word),word);
 for(const line of [189,190,191,192])assert.ok(lineSet(m).has(line),"line "+line);
});
test("Stop-scanning summary must state combined conditions and retained unknowns",()=>{
 const m=row("module-16");
 for(const word of ["已审范围","新高优先级","治理稳定","收益","未验证范围"])assert.ok(m.claim.includes(word),word);
 for(const line of [261,263,264,266,267,278])assert.ok(lineSet(m).has(line),"line "+line);
});
test("All corrected handoff decisions are pending real independent review",()=>{
 assert.ok([...v3.modules,...v3.chapters].every(x=>x.decision==="PENDING"&&x.reason===null));
 assert.notEqual(row("module-11").claim,v2.modules[10].claim);
 assert.notEqual(row("module-16").claim,v2.modules[15].claim);
});