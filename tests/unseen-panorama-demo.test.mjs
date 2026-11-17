import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const demo=path.join(root,"demo","unseen-panorama");
const cases=["agent-lead","plan-ship","distributed-system-audit"];
const manifest=JSON.parse(fs.readFileSync(path.join(root,"evals","unseen-panorama-2026-11-17.json"),"utf8"));

test("三个真实项目的独立离线 HTML 在 demo 正式可见且与冻结来源一致",()=>{
 const index=fs.readFileSync(path.join(demo,"index.html"),"utf8");
 for(const id of cases){
  const source=manifest.cases.find(x=>x.id===id);
  const html=fs.readFileSync(path.join(demo,id+".html"),"utf8");
  assert.match(index,new RegExp(id+"\\.html"));
  assert.match(index,new RegExp(id+"-preview\\.png"));
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/<style>/);
  assert.match(html,new RegExp(source.commit.slice(0,12)));
  for(const f of source.sources)assert.ok(html.includes(f.file),id+": source file missing "+f.file);
  assert.match(html,/<details class="evidence">/);
  assert.match(html,/未经过|未在此证明|语义审查|不能证明|独立语义/);
  assert.doesNotMatch(html,/<script\b|<iframe\b|https?:\/\/|(?:[A-Za-z]:\\(?:Users|Windows|workspace)\\)|(?:ghp_|github_pat_|Bearer\s+)/i);
  assert.match(html,/panorama-scroll/);
  assert.match(html,/--tier-fill:#eaf3ff/);
  assert.match(html,/--tier-fill:#f2ecff/);
  assert.match(html,/--tier-fill:#e7f7f5/);
  const buf=fs.readFileSync(path.join(demo,id+"-preview.png"));
  assert.equal(buf.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(buf.readUInt32BE(16),1440);
  assert.equal(buf.readUInt32BE(20),980);
  assert.ok(buf.byteLength>20000);
 }
});
test("新版产品架构 SVG 主题通过颜色分层，不再采用左侧粗色条",()=>{
 const t=fs.readFileSync(path.join(root,"assets/product-panorama-svg-theme.css"),"utf8");
 for(const c of ["#eaf3ff","#f2ecff","#e7f7f5","#fff2e4","#eaf7ec","#edf3f9"])assert.ok(t.includes(c),"missing palette "+c);
 assert.doesNotMatch(t,/border-left\s*:\s*[34]px|border-left-width\s*:\s*[34]px/i);
 assert.match(t,/panorama-band:nth-child\(6 of \.panorama-band\)/);
});
