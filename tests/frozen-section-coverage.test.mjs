import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {frozenSectionCoverage} from "../evals/frozen-section-coverage.mjs";
import {evidenceCatalogue} from "../evals/evidence-id-map.mjs";
const text="# SOP\n## 1. Alpha\nCheck alpha task.\n## 2. Beta\nCheck beta task.\n## 3. Gamma\nCheck gamma task.\n";
const id="sections";
const entry={case:{id,commit:"a".repeat(40),anchors:[]},files:[{file:"sop.md",text,sha256:crypto.createHash("sha256").update(text).digest("hex")}]};
const index=evidenceCatalogue(entry).entries;
const e=line=>index.find(x=>x.line===line).id;
const candidate=()=>({schema:"genui-panorama-candidate/v1",cases:[{id,layers:[
 {title:"a",modules:[{id:"a",title:"Alpha",evidence:[{id:e(3)}]}]},
 {title:"b",modules:[{id:"b",title:"Gamma",evidence:[{id:e(7)}]}]}],relations:[]}]});
test("numbered section citation coverage exposes absent middle section",()=>{
 const r=frozenSectionCoverage(entry,candidate(),{file:"sop.md"});
 assert.equal(r.sectionCount,3);
 assert.equal(r.sectionsWithDirectCitation,2);
 assert.deepEqual(r.uncitedSections,[2]);
 assert.deepEqual(r.sections[2].citedLines,[7]);
 assert.equal(r.sections[0].status,"CITED_NOT_SEMANTICALLY_VERIFIED");
});
test("foreign evidence and incorrect frozen file fail closed",()=>{
 const c=candidate();c.cases[0].layers[0].modules[0].evidence[0].id="E000000000000";
 assert.throws(()=>frozenSectionCoverage(entry,c,{file:"sop.md"}),/Unknown or foreign/);
 assert.throws(()=>frozenSectionCoverage(entry,candidate(),{file:"README.md"}),/Unknown frozen/);
});
