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
 local.server.on("request",(req,res)=>{
  if(requestTrace.length>=15)return;
  const item={method:req.method,path:req.url,host:req.headers.host};requestTrace.push(item);
  res.once("finish",()=>{item.status=res.statusCode;item.contentType=res.getHeader("content-type")});
  res.once("close",()=>{item.closed=true;item.writableFinished=res.writableFinished});
 });
 const portServer=net.createServer();
 await new Promise(res=>portServer.listen(0,"127.0.0.1",res));
 const port=portServer.address().port;await new Promise(res=>portServer.close(res));
 child=spawn(chrome,["--headless=new","--disable-extensions","--disable-gpu","--disable-background-networking","--no-proxy-server","--no-first-run","--remote-debugging-address=127.0.0.1","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"],{stdio:"ignore",windowsHide:true});
 let pages;
 for(let n=0;n<100;n++){
  try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){pages=await r.json();break}}catch{}
  await sleep(100);
 }
 if(!pages)throw Error("Chrome CDP 未连接");
 // Launch a blank tab first; navigations racing with the startup URL can abort on CI.
 const page=pages.find(x=>x.type==="page"&&x.url==="about:blank")??pages.find(x=>x.type==="page");
 if(!page)throw Error("缺少浏览器页面目标");
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 let id=0;const pending=new Map(),networkEvents=[];
 ws.addEventListener("message",e=>{const msg=JSON.parse(e.data);
  if(msg.method?.startsWith("Network.")&&networkEvents.length<50){
   const p=msg.params??{};
   if(msg.method==="Network.responseReceived")networkEvents.push({kind:"response",url:p.response?.url,status:p.response?.status,mime:p.response?.mimeType});
   if(msg.method==="Network.loadingFailed")networkEvents.push({kind:"failed",error:p.errorText,canceled:p.canceled,blocked:p.blockedReason});
   if(msg.method==="Network.requestWillBeSent"&&p.request?.url?.startsWith("http://127.0.0.1"))networkEvents.push({kind:"request",url:p.request.url});
  }
  const item=pending.get(msg.id);if(!item)return;pending.delete(msg.id);msg.error?item.reject(Error(JSON.stringify(msg.error))):item.resolve(msg.result)});
 const cmd=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}))});
 async function ev(expression,sessionId){const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result?.value}
 await cmd("Page.enable");await cmd("Runtime.enable");await cmd("Network.enable");
 // First-time Chrome startup may reset an early navigation to about:blank on CI.
 // Re-navigate at most three times, always re-checking the actual rendered portal.
 await sleep(250);
 const navigations=[];
 let ready=false;
 for(let round=0;round<3&&!ready;round++){
  const navigation=await cmd("Page.navigate",{url:local.url});
  navigations.push(navigation);
  for(let attempts=0;attempts<60;attempts++){
   try{ready=!!(await ev("document.getElementById(\'page-frame\')?.getAttribute(\'src\')"));}catch{}
   if(ready)break;
   await sleep(120);
  }
  if(!ready)await sleep(450);
 }
 if(!ready){
  let browserPage;
  try{browserPage=await ev("(()=>({url:location.href,title:document.title,readyState:document.readyState,text:document.body?.innerText?.slice(0,220)}))()")}catch(error){browserPage={error:String(error)}}
  let nodeHttpStatus;
  try{nodeHttpStatus=(await fetch(local.url)).status}catch(error){nodeHttpStatus=String(error)}
  throw Error("HTML portal did not finish loading in Chrome: "+JSON.stringify({navigations,browserPage,nodeHttpStatus,requests:requestTrace,networkEvents}));
 }
 const readParent=()=>ev("(()=>{const f=document.getElementById('page-frame');return{sandbox:f.getAttribute('sandbox'),src:f.getAttribute('src'),mode:document.getElementById('preview-mode').textContent,childDOMReadable:!!f.contentDocument}})()");
 const parentIsolated=value=>value?.sandbox==="allow-scripts allow-forms"&&value?.mode?.includes("交互")&&value?.src?.endsWith(".html")&&!value.childDOMReadable;
 // The iframe src attribute can update before its first document commits.
 // Until navigation commits, Chrome can still expose the initial about:blank document.
 let parent;
 for(let attempt=0;attempt<60;attempt++){
  parent=await readParent();
  if(parentIsolated(parent))break;
  await sleep(120);
 }
 expect("HTTP frame sandbox",{parent,requests:requestTrace,networkEvents},parentIsolated(parent));
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
 const expression="(()=>({executed:document.body?.dataset.executed,background:document.body&&getComputedStyle(document.body).backgroundColor,font:document.body&&getComputedStyle(document.body).fontSize,href:location.href,readyState:document.readyState}))()";
 const isChildReady=value=>value?.executed==="yes"&&value?.background==="rgb(234, 238, 242)"&&value?.font==="21px";
 let childState,readChild;
 if(target){
  const attached=await cmd("Target.attachToTarget",{targetId:target.targetId,flatten:true});
  await cmd("Runtime.enable",{},attached.sessionId);
  readChild=()=>ev(expression,attached.sessionId);
 }else if(sameProcessFrame){
  const world=await cmd("Page.createIsolatedWorld",{frameId:sameProcessFrame.frame.id,worldName:"genui-http-inspection"});
  readChild=async()=>{
   const evaluated=await cmd("Runtime.evaluate",{expression,contextId:world.executionContextId,returnByValue:true});
   if(evaluated.exceptionDetails)throw Error("Child inspection: "+evaluated.exceptionDetails.text);
   return evaluated.result.value;
  };
 }else throw Error("HTTP iframe renderer not found: "+JSON.stringify((await cmd("Page.getFrameTree")).frameTree));
 // The iframe target can exist before its CSS fetch and inline script finish.
 // Poll the actual child DOM; do not bypass the CSS/JS assertion or hide a timeout.
 let childLastError;
 for(let attempt=0;attempt<60;attempt++){
  try{childState=await readChild();childLastError=undefined}catch(error){childLastError=String(error)}
  if(isChildReady(childState))break;
  await sleep(120);
 }
 expect("isolated child CSS and JS",{childState,lastError:childLastError,requests:requestTrace,networkEvents},isChildReady(childState));
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