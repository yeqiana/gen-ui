import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {frozenInputs} from "../evals/unseen-panorama-workflow.mjs";
import {evidenceCatalogue} from "../evals/evidence-id-map.mjs";
import {frozenSectionCoverage} from "../evals/frozen-section-coverage.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"evals/unseen-panorama-2026-11-17.json")));
manifest.cases=manifest.cases.filter(x=>x.id==="distributed-system-audit");
const frozen=frozenInputs(manifest,path.resolve(root,"../.."))[0];
const candidate=JSON.parse(fs.readFileSync(path.join(root,"evals/p1-dsa-editorial-v6-candidate-2026-11-20.json"))).cases[0];
const review=JSON.parse(fs.readFileSync(path.join(root,"evals/p1-dsa-editorial-v6-human-handoff-2026-11-20.json")));
const source=frozen.files.find(x=>x.file==="references/audit-sop.md").text.split(/\r?\n/);
const evidence=evidenceCatalogue(frozen);
const index=new Map(evidence.entries.map(x=>[x.id,x]));
test("frozen DSA commit and 17 directly cited chapters remain unchanged",()=>{
 assert.equal(frozen.case.commit,"0a224f8f517ff7f380741b0880075a0f53eae64f");
 assert.equal(frozenSectionCoverage(frozen,{cases:[candidate]},{file:"references/audit-sop.md"}).sectionsWithDirectCitation,17);
});
test("all sixteen module evidence IDs resolve to actual frozen lines",()=>{
 const mods=candidate.layers.flatMap(x=>x.modules);
 assert.equal(mods.length,16);
 for(const m of mods){
  const h=review.modules.find(x=>x.moduleId===m.id);
  assert.equal(m.title,h.claim,m.id);
  const ids=new Set(h.sources.map(x=>x.id));
  for(const ref of m.evidence){
   const e=index.get(ref.id);
   assert.ok(e,"unknown evidence "+ref.id);
   assert.equal(e.file,"references/audit-sop.md");
   assert.ok(ids.has(ref.id),"handoff missing "+ref.id);
   assert.ok(source[e.line-1].trim().length>0);
  }
 }
});
test("the source has exact non-indexable short Lease transition lines",()=>{
 for(const [n,expected] of [[106,"A claim"],[107,"A 卡住"],[109,"B steal"],[110,"B complete"],[111,"A 恢复后 complete"]])assert.equal(source[n-1],expected);
 for(const n of [106,107,109]){
  assert.ok(review.chapters.find(x=>x.number===5).sourceLines.includes(n));
  assert.equal(evidence.entries.some(x=>x.file==="references/audit-sop.md"&&x.line===n),false,"must not invent Evidence ID for short source line "+n);
 }
});
test("current transaction and receiver claims map to frozen scenario rows",()=>{
 for(const [n,part] of [[94,"DB 成功 + Outbox 成功"],[96,"缓存/投影失败"],[122,"100 receivers: 99 success + 1 fail"],[124,"duplicate receiver event"],[129,"去重粒度不得吞掉其他合法对象"]]){
  assert.ok(source[n-1].includes(part),"frozen source line "+n+" differs");
  const chapter=n<=103?4:6;
  assert.ok(review.chapters.find(x=>x.number===chapter).sourceLines.includes(n),"chapter misses "+n);
 }
});
test("latest source says templates are not a completed business audit",()=>{
 assert.match(candidate.notes,/缺失的证据标为未验证/);
 assert.match(candidate.notes,/按需选用的检查模板/);
 assert.match(candidate.notes,/没有实际执行|尚未真实执行|没有实际执行生产测试/);
 assert.ok(review.modules.every(x=>x.decision==="PENDING"));
 assert.ok(review.chapters.every(x=>x.decision==="PENDING"));
});
