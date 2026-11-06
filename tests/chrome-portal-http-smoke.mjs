#!/usr/bin/env node
/** Trusted generated fixture. HTTP iframe must load CSS+JS while retaining opaque-origin isolation. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {buildPortal} from "../scripts/build-html-portal.mjs";
import {startPortalServer} from "../scripts/serve-html-portal.mjs";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(fs.existsSync);
function expect(name,actual,condition){if(!condition)throw Error(name+": "+JSON.stringify(actual));return actual}
if(!chrome)throw Error("未找到 Chrome/Edge");
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"genui-http-fixture-"));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-http-profile-"));
let local,child,ws;
try{
 fs.writeFileSync(path.join(dir,"style.css"),"body{background-color:rgb(234, 238, 242);font-size:21px}");
 fs.writeFileSync(path.join(dir,"one.html"),'<html lang="zh-CN"><head><title>交互测试</title><link rel="stylesheet" href="style.css"></head><body><h1>交互测试</h1><script>document.body.dataset.executed="yes"</script></body></html>');
 buildPortal({dir,title:"测试"});
 local=await startPortalServer({dir,port:0});
 const requestTrace=[];
 local.server.on("request",req=>{if(requestTrace.length<12)requestTrace.push({method:req.method,path:req.url,host:req.headers.host})});
 const portServer=net.createServer();
 await new Promise(res=>portServer.listen(0,"127.0.0.1",res));
 const port=portServer.address().port;await new Promise(res=>portServer.close(res));
 child=spawn(chrome,["--headless=new","--disable-extensions","--disable-gpu","--disable-background-networking","--no-proxy-server","--no-first-run","--remote-debugging-address=127.0.0.1","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,local.url],{stdio:"ignore",windowsHide:true});
 let pages;
 for(let n=0;n<100;n++){
  try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){pages=await r.json();break}}catch{}
  await sleep(100);
 }
 if(!pages)throw Error("Chrome CDP 未连接");
 const page=pages.find(x=>x.type==="page"&&x.url.startsWith(local.url.split("/").slice(0,3).join("/")))??pages.find(x=>x.type==="page");
 if(!page)throw Error("缺少浏览器页面目标");
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 let id=0;const pending=new Map();
 ws.addEventListener("message",e=>{const msg=JSON.parse(e.data);const item=pending.get(msg.id);if(!item)return;pending.delete(msg.id);msg.error?item.reject(Error(JSON.stringify(msg.error))):item.resolve(msg.result)});
 const cmd=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}))});
 async function ev(expression,sessionId){const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result?.value}
 await cmd("Page.enable");await cmd("Runtime.enable");
 const navigation=await cmd("Page.navigate",{url:local.url});
 // The CDP page target can appear before its first navigation finishes.
 let ready=false;
 for(let attempts=0;attempts<70;attempts++){
  try{ready=!!(await ev("document.getElementById(\'page-frame\')?.getAttribute(\'src\')"));}catch{}
  if(ready)break;
  await sleep(120);
 }
 if(!ready){
  let browserPage;
  try{browserPage=await ev("(()=>({url:location.href,title:document.title,readyState:document.readyState,text:document.body?.innerText?.slice(0,220)}))()")}catch(error){browserPage={error:String(error)}}
  let nodeHttpStatus;
  try{nodeHttpStatus=(await fetch(local.url)).status}catch(error){nodeHttpStatus=String(error)}
  throw Error("HTML portal did not finish loading in Chrome: "+JSON.stringify({navigation,browserPage,nodeHttpStatus,requests:requestTrace}));
 }
 const parent=await ev("(()=>{const f=document.getElementById('page-frame');return{sandbox:f.getAttribute('sandbox'),src:f.getAttribute('src'),mode:document.getElementById('preview-mode').textContent,childDOMReadable:!!f.contentDocument}})()");
 expect("HTTP frame sandbox",parent,parent.sandbox==="allow-scripts allow-forms"&&parent.mode.includes("交互")&&parent.src.endsWith(".html")&&!parent.childDOMReadable);
 let target,sameProcessFrame;
 for(let i=0;i<35;i++){
  const info=await cmd("Target.getTargets");
  target=info.targetInfos?.find(x=>x.type==="iframe"&&x.url.includes("one.html")&&x.parentId===page.id);
  if(target)break;
  const tree=await cmd("Page.getFrameTree");
  sameProcessFrame=tree.frameTree?.childFrames?.find(x=>x.frame?.url.includes("one.html"));
  if(sameProcessFrame)break;
  await sleep(150);
 }
 const expression="(()=>({executed:document.body.dataset.executed,background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontSize,href:location.href}))()";
 let childState;
 if(target){
  const attached=await cmd("Target.attachToTarget",{targetId:target.targetId,flatten:true});
  await cmd("Runtime.enable",{},attached.sessionId);
  childState=await ev(expression,attached.sessionId);
 }else if(sameProcessFrame){
  const world=await cmd("Page.createIsolatedWorld",{frameId:sameProcessFrame.frame.id,worldName:"genui-http-inspection"});
  const evaluated=await cmd("Runtime.evaluate",{expression,contextId:world.executionContextId,returnByValue:true});
  if(evaluated.exceptionDetails)throw Error("Child inspection: "+evaluated.exceptionDetails.text);
  childState=evaluated.result.value;
 }else throw Error("HTTP iframe renderer not found: "+JSON.stringify((await cmd("Page.getFrameTree")).frameTree));

 expect("isolated child CSS and JS",childState,childState.executed==="yes"&&childState.background==="rgb(234, 238, 242)"&&childState.font==="21px");
 const result={result:"pass",environment:"Chrome CDP + 127.0.0.1 loopback",parent,child:childState,at:new Date().toISOString()};
 if(process.argv.length===4&&process.argv[2]==="--report"){
   const output=path.resolve(process.argv[3]);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n","utf8");
 }else if(process.argv.length!==2)throw Error("用法：node tests/chrome-portal-http-smoke.mjs [--report 输出文件]");
 console.log("CHROME_PORTAL_HTTP_PASS="+JSON.stringify(result));
}finally{
 if(ws)ws.close();
 if(child)child.kill();
 if(local)await new Promise(res=>local.server.close(res));
 await sleep(160);
 for(const folder of [dir,profile])try{fs.rmSync(folder,{recursive:true,force:true,maxRetries:2,retryDelay:150})}catch{}
}
