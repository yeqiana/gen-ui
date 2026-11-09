import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const ids=["story-workbench","im-message-flow","cold-archive","tv-launcher","qr-audit-report"];
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
test("Five self-contained case HTML files and previews exist",()=>{
 for(const id of ids){
  const dir="demo/cases/"+id+".html";
  const text=read(dir);
  assert.match(text,/<!doctype html>/i);
  assert.match(text,/<html lang="zh-CN">/i);
  assert.match(text,/<h1[ >]/);
  assert.doesNotMatch(text,/<script\s+[^>]*src\s*=\s*["']?https?:/i);
  assert.doesNotMatch(text,/https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
  const image=fs.readFileSync(path.join(root,"demo/cases/assets",id+"-preview.png"));
  assert.ok(image.byteLength>4000,id+" screenshot too small");
  assert.equal(image.toString("hex",0,8),"89504e470d0a1a0a");
 }
});
test("Both READMEs link exactly the five case pages and screenshots",()=>{
 for(const f of ["README.md","README.zh-CN.md"]){
  const text=read(f);
  for(const id of ids){
   assert.match(text,new RegExp("demo/cases/"+id+"\\.html"));
   assert.match(text,new RegExp("demo/cases/assets/"+id+"-preview\\.png"));
  }
 }
});
test("Public case HTML does not expose original project names or sensitive details",()=>{
 for(const id of ids){
  const t=read("demo/cases/"+id+".html");
  assert.doesNotMatch(t,/\byopu\b|youpu|yopu-cloud-platform|yopu-im-core|yopu-crm-account/i);
  assert.doesNotMatch(t,/D:\\\\workspace|C:\\\\Users\\\\|\/home\/[^/]+\/|Bearer\s+[A-Za-z0-9._-]+/i);
  assert.doesNotMatch(t,/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  assert.doesNotMatch(t,/1[3-9]\d{9}/);
 }
});
test("Demo gallery and documentation refer to available files",()=>{
 for(const f of ["demo/README.md","docs/cases.md"]){
  const text=read(f);
  for(const link of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
    const uri=link[1].split("#")[0];
    if(/^(?:https?:|mailto:)/i.test(uri))continue;
    assert.ok(fs.existsSync(path.resolve(root,path.dirname(f),decodeURIComponent(uri))),f+" "+uri);
  }
 }
 const gallery=read("demo/cases/index.html");
 for(const id of ids){
   assert.match(gallery,new RegExp('href="'+id+'\\.html"'));
   assert.match(gallery,new RegExp('src="assets/'+id+'-preview\\.png"'));
 }
});
