import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import {fileURLToPath} from "node:url";
import {startPortalServer} from "../scripts/serve-html-portal.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),"genui-sec-"));fs.writeFileSync(path.join(dir,"index.html"),"<!doctype html><title>安全验收</title>");return dir;}
function rawRequest(url,headers={}){return new Promise((resolve,reject)=>{const parsed=new URL(url);const req=http.get({host:"127.0.0.1",port:Number(parsed.port),path:parsed.pathname,headers},res=>{res.resume();res.on("end",()=>resolve(res.statusCode))});req.on("error",reject)})}
test("监听 Host 在服务启动时固定，避免关闭阶段访问已失效的 server.address",()=>{
 const source=fs.readFileSync(path.join(root,"scripts/serve-html-portal.mjs"),"utf8");
 const handler=source.split("const server=http.createServer((req,res)=>{")[1]?.split("await new Promise((resolve,reject)=>{")[0]??"";
 assert.ok(handler,"应找到 HTTP 请求处理函数");
 assert.doesNotMatch(handler,/server\.address\(\)/);
 assert.match(source,/expectedHost="127\.0\.0\.1:"\+address\.port/);
});

test("本机预览校验 Host，防止浏览器 DNS 重绑定",async()=>{
 const dir=fixture();
 try{
  const {server,url}=await startPortalServer({dir,port:0});
  try{
   assert.equal((await fetch(url)).status,200);
   assert.equal(await rawRequest(url,{Host:"malicious.example:8765"}),403);
   assert.equal(await rawRequest(url,{Host:"localhost:"+new URL(url).port}),403);
   assert.equal(await rawRequest(url,{Host:"127.0.0.1:9999"}),403);
   assert.equal(await rawRequest(url,{Host:"127.0.0.1:"+new URL(url).port}),200);
  }finally{await new Promise(done=>server.close(done))}
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test("服务拒绝点文件、无效 URL、写入及带冒号路径",async()=>{
 const dir=fixture();
 try{
  fs.mkdirSync(path.join(dir,".hidden"));fs.writeFileSync(path.join(dir,".hidden","secret.json"),'{"secret":true}');
  const {server,url}=await startPortalServer({dir,port:0});
  try{
   const base=url.replace("/index.html","");
   assert.equal((await fetch(base+"/.hidden/secret.json")).status,403);
   assert.equal(await rawRequest(url.replace("index.html","file%3Adata.html")),403);
   assert.equal(await rawRequest(url.replace("index.html","%25NOTURL")),404);
   assert.equal((await fetch(url,{method:"POST"})).status,405);
   assert.equal((await fetch(url,{method:"PUT"})).status,405);
  }finally{await new Promise(done=>server.close(done))}
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test("不会把任意远端 HTTP/HTTPS 的 iframe 自动改成可执行脚本",()=>{
 const source=fs.readFileSync(path.join(root,"assets/portal-shell.js"),"utf8");
 assert.match(source,/location\.protocol==="http:"&&location\.hostname==="127\.0\.0\.1"/);
 assert.match(source,/interactive\?"allow-scripts allow-forms":"allow-same-origin"/);
 assert.doesNotMatch(source,/allow-scripts allow-same-origin/);
});
