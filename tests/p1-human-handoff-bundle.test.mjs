import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildP1ReviewPacket} from "../scripts/build-p1-human-handoff.mjs";
test("v6 human handoff has 80 frozen, sourced and unapproved records",()=>{
 const root=path.join(os.tmpdir(),"genui-p1-review-smoke-"+process.pid);
 try{
  const r=buildP1ReviewPacket(root);assert.equal(r.items,80);assert.equal(r.release,"NO_GO");
  const items=JSON.parse(fs.readFileSync(path.join(root,"review-items.json")));
  assert.equal(items.length,80);assert.deepEqual(items.reduce((m,x)=>(m[x.caseId]=(m[x.caseId]||0)+1,m),{}),{"distributed-system-audit":33,"agent-lead":28,"plan-ship":19});
  assert.ok(items.every(x=>x.verdict==="PENDING"&&x.cites.length>0&&x.cites.every(y=>y.ref&&y.text!==undefined)));
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");assert.ok(html.includes("<details>"));assert.equal((html.match(/<details>/g)||[]).length,80);assert.equal((html.match(/class="source-context"/g)||[]).length,9);assert.ok(html.includes("第 132–152 行"));assert.ok(html.includes("第 245–258 行"));assert.ok(html.includes('value="132"')&&html.includes('value="258"'));for(const id of ["distributed-system-audit","agent-lead","plan-ship"])assert.ok(html.includes('id="'+id+'"')&&html.includes('href="#'+id+'"'));assert.ok(!html.includes("<script"));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
  assert.equal(manifest.reviewTemplate,"review-decisions-template.csv");
  const csv=fs.readFileSync(path.join(root,"review-decisions-template.csv"),"utf8");assert.ok(csv.charCodeAt(0)===0xFEFF);assert.equal(csv.split(/\r?\n/).filter(Boolean).length,81);assert.equal((csv.match(/,"PENDING","","",""/g)||[]).length,80);
  const sums=fs.readFileSync(path.join(root,"SHA256SUMS.txt"),"utf8");assert.ok(sums.includes("index.html"));assert.ok(sums.includes("review-items.json"));assert.ok(sums.includes("review-decisions-template.csv"));
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test("independent reviewer can specify source repository root",()=>{
 const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
 const sourceRoot=path.resolve(project,"../..");
 const out=path.join(os.tmpdir(),"genui-p1-review-explicit-root-"+process.pid);
 const missing=path.join(os.tmpdir(),"genui-p1-source-root-missing-"+process.pid);
 try{
  const result=buildP1ReviewPacket(out,sourceRoot);
  assert.equal(result.items,80);assert.equal(result.release,"NO_GO");
  assert.equal(fs.existsSync(path.join(out,"index.html")),true);
  assert.throws(()=>buildP1ReviewPacket(path.join(out,"nested"),missing),/git|source|ENOENT|repository/i);
 }finally{fs.rmSync(out,{recursive:true,force:true})}
});
