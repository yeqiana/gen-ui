import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const docs=["project-analysis","architecture-design","implementation-plan","test-acceptance"];
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
test("Four standalone technical document HTML deliverables exist",()=>{
 for(const id of docs){
  const f="demo/documents/"+id+".html",t=read(f);
  assert.match(t,/<!doctype html>/i);
  assert.match(t,/<html lang="zh-CN">/i);
  assert.match(t,/<main class="doc-main">/);
  assert.match(t,/<h1[ >]/);
  assert.ok((t.match(/<section class="doc-section"/g)||[]).length>=7,id+" has too few sections");
  assert.match(t,/<table[ >]/);
  assert.match(t,/<svg viewBox=/);
  assert.match(t,/data-diagram/);
  assert.doesNotMatch(t,/<script\s+[^>]*src\s*=\s*["']?https?:/i);
  assert.doesNotMatch(t,/<link[^>]+href=["']https?:/i);
  assert.doesNotMatch(t,/https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
  const preview=fs.readFileSync(path.join(root,"demo/documents/assets",id+"-preview.png"));
  assert.ok(preview.byteLength>8000,id+" preview image too small");
  assert.equal(preview.toString("hex",0,8),"89504e470d0a1a0a");
  assert.match(t,/非真实项目|示例|未执行|待评审/);
 }
});
test("Document gallery links all articles and shared offline assets",()=>{
 const gallery=read("demo/documents/index.html");
 for(const id of docs)assert.match(gallery,new RegExp('href="'+id+'\\.html"'));
 for(const f of ["demo/documents/assets/document.css","demo/documents/assets/document.js"])assert.ok(fs.existsSync(path.join(root,f)));
});
test("Article navigation, diagrams and code examples are structurally complete",()=>{
 for(const id of docs){
  const t=read("demo/documents/"+id+".html");
  const ids=[...t.matchAll(/<section class="doc-section" id="([^"]+)"/g)].map(m=>m[1]);
  for(const id of ids)assert.match(t,new RegExp('href="#'+id+'"'));
  assert.match(t,/data-zoom-in/);assert.match(t,/data-zoom-out/);assert.match(t,/data-fit/);assert.match(t,/data-fullscreen/);
  assert.match(t,/<pre><code class="language-/);
 }
});
test("No previous product-UI mockup showcase remains in the public entrypoints",()=>{
 const zh=read("README.zh-CN.md"),en=read("README.md");
 assert.match(zh,/项目分析报告/);assert.match(zh,/系统架构设计方案/);assert.match(zh,/技术实施方案/);assert.match(zh,/测试与验收方案/);
 assert.match(en,/Project analysis/);assert.match(en,/Architecture design/);assert.doesNotMatch(zh,/TV 启动器|StoryOS 工作台演示截图|五个独立案例/);
 assert.doesNotMatch(en,/TV launcher HTML concept|Five offline HTML showcases/);
});
