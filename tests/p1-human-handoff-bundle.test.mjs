import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {buildP1ReviewPacket} from "../scripts/build-p1-human-handoff.mjs";
test("v6 human handoff has 80 frozen, sourced and unapproved records",()=>{
 const root=path.join(os.tmpdir(),"genui-p1-review-smoke-"+process.pid);
 try{
  const r=buildP1ReviewPacket(root);assert.equal(r.items,80);assert.equal(r.release,"NO_GO");
  const items=JSON.parse(fs.readFileSync(path.join(root,"review-items.json")));
  assert.equal(items.length,80);assert.deepEqual(items.reduce((m,x)=>(m[x.caseId]=(m[x.caseId]||0)+1,m),{}),{"distributed-system-audit":33,"agent-lead":28,"plan-ship":19});
  assert.ok(items.every(x=>x.verdict==="PENDING"&&x.cites.length>0&&x.cites.every(y=>y.ref&&y.text!==undefined)));
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");assert.ok(html.includes("<details>"));assert.equal((html.match(/<details>/g)||[]).length,80);assert.ok(!html.includes("<script"));
  const sums=fs.readFileSync(path.join(root,"SHA256SUMS.txt"),"utf8");assert.ok(sums.includes("index.html"));assert.ok(sums.includes("review-items.json"));
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
