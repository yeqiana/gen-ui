#!/usr/bin/env node
// Archived actual agent-generated technical reports. Both concern StoryOS;
// this guards layout regressions, not cross-domain Skill activation.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const files=[
  "evals/artifacts/storyos-real-html-acceptance-2026-11-14/report.html",
  "evals/artifacts/codex-typography-blind-2026-11-13/storyos/report-v3.html"
];
for(const file of files){
  const html=fs.readFileSync(path.join(root,file),"utf8");
  assert.match(html,/class="doc-main genui-typography"/,file+" missing typography layout");
  assert.match(html,/<(?:ul|ol) class="genui-prose"/,file+" missing real list content");
  assert.match(html,/<table\b/,file+" missing real table content");
}
const result=spawnSync(process.execPath,[
  path.join(root,"tests/chrome-typography-smoke.mjs"),"--generated",...files
],{cwd:root,encoding:"utf8",timeout:180000,maxBuffer:4_000_000});
assert.ifError(result.error);
assert.equal(result.status,0,result.stderr||result.stdout.slice(-1800));
const data=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
assert.equal(data.result,"PASS");
assert.equal(data.scenarios,16,"two reports × four viewports × two navigation modes");
for(const [index,report] of files.entries()){
  const samples=data.measurements.filter(row=>row.page==="generated-"+(index+1));
  assert.equal(samples.length,8,report+" must cover every viewport and nav state");
  for(const width of [375,768,1024,1440]){
    const expected=width<=768?["mobile-toc-closed","mobile-toc-open"]:["expanded","collapsed"];
    assert.deepEqual(samples.filter(row=>row.width===width).map(row=>row.mode),expected);
  }
  assert.ok(samples.every(row=>row.samples>=24),
    report+" must measure lists as well as paragraphs");
  assert.ok(samples.every(row=>!row.overflow&&row.tablePx>0&&row.maxProsePx<=row.mainPx),
    report+" must keep page, table and prose inside the reading canvas");
}
console.log(JSON.stringify({result:"PASS",sourceKind:"archived-agent-html",
  independentDomains:1,reports:files.length,viewports:[375,768,1024,1440],
  scenarios:data.scenarios,minMeasuredBlocks:Math.min(...data.measurements.map(row=>row.samples))}));
