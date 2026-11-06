#!/usr/bin/env node
// Fixed trusted fixture only. Does not browse unknown or untrusted generated pages.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import {spawn} from "node:child_process";
import {pathToFileURL,fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const report=path.join(root,"demo/portal-pages/index.html");
const chrome=[
 process.env.GEN_UI_CHROME,
 "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
 "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
 "/usr/bin/google-chrome","/usr/bin/chromium"
].filter(Boolean).find(x=>fs.existsSync(x));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function check(name,value,ok){if(!ok)throw Error(name+": "+JSON.stringify(value));}
async function run(){
 if(!chrome)throw Error("未安装 Chrome/Edge");
 const server=net.createServer();await new Promise(r=>server.listen(0,"127.0.0.1",r));
 const port=server.address().port;await new Promise(r=>server.close(r));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-portal-chrome-"));
 const child=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking",
 "--remote-debugging-address=127.0.0.1","--remote-allow-origins=*","--remote-debugging-port="+port,
 "--user-data-dir="+profile,pathToFileURL(report).href],{stdio:"ignore",windowsHide:true});
 let socket;
 try{
  let pages;
  for(let i=0;i<95;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){pages=await r.json();break;}}catch{}await sleep(100);}
  if(!pages)throw Error("Chrome CDP 连接失败");
  const page=pages.find(x=>x.type==="page");if(!page)throw Error("缺少页面");
  socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
  let seq=0;const pending=new Map(),exceptions=[];
  socket.addEventListener("message",e=>{
    const msg=JSON.parse(e.data);
    if(msg.method==="Runtime.exceptionThrown")exceptions.push(msg.params?.exceptionDetails?.text);
    if(!pending.has(msg.id))return;
    const promise=pending.get(msg.id);pending.delete(msg.id);
    msg.error?promise.reject(Error(JSON.stringify(msg.error))):promise.resolve(msg.result);
  });
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
  const evaluate=async(expression)=>{
    const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
    return r.result.value;
  };
  await send("Page.enable");await send("Runtime.enable");
  const results={page:"demo/portal-pages/index.html",source:"trusted-repository-fixture",browser:"Chrome CDP",at:new Date().toISOString(),viewports:{}};
  for(const width of [375,768,1440]){
    await send("Emulation.setDeviceMetricsOverride",{width,height:820,deviceScaleFactor:1,mobile:width===375});
    await send("Page.navigate",{url:pathToFileURL(report).href});
    await sleep(350);
    const state=await evaluate("(()=>({width:innerWidth,pages:document.querySelectorAll('.page-link').length,subheadings:document.querySelectorAll('.section-link').length,iframe:!!document.querySelector('iframe#page-frame'),src:document.querySelector('iframe#page-frame')?.getAttribute('src'),sandbox:document.querySelector('iframe#page-frame')?.getAttribute('sandbox'),hasOverflow:document.documentElement.scrollWidth>innerWidth,railColor:getComputedStyle(document.getElementById('rail')).backgroundColor}))()");
    check("视口 "+width,state,state.pages===4&&state.subheadings>=6&&state.iframe&&state.src&&!state.src.startsWith("about:")&&state.sandbox==="allow-same-origin"&&!state.hasOverflow&&state.railColor==="rgb(250, 250, 250)");
    results.viewports[width]=state;
    // file:// pages are isolated across file origins, even with allow-same-origin.
    // Query the actual iframe renderer through CDP instead of the parent's contentDocument.
    const frameTree=await send("Page.getFrameTree");
    const childFrame=frameTree.frameTree?.childFrames?.[0]?.frame;
    check("离线子页面帧/"+width,childFrame,!!childFrame);
    const world=await send("Page.createIsolatedWorld",{frameId:childFrame.id,worldName:"genui-style-inspection"});
    const styleResult=await send("Runtime.evaluate",{expression:"(()=>({cssLink:!!document.querySelector('link[rel=stylesheet]'),fontSize:getComputedStyle(document.body).fontSize}))()",contextId:world.executionContextId,returnByValue:true});
    const offlineStyle={mode:await evaluate("document.getElementById('preview-mode').textContent"),...styleResult.result.value};
    check("离线 CSS 及沙盒/"+width,offlineStyle,offlineStyle.mode.includes("静态")&&offlineStyle.cssLink&&offlineStyle.fontSize==="14px");
    results.viewports[width].offlineStyle=offlineStyle;
  }
  await send("Emulation.setDeviceMetricsOverride",{width:1440,height:820,deviceScaleFactor:1,mobile:false});
  await send("Page.navigate",{url:pathToFileURL(report).href});await sleep(300);
  const swap=await evaluate("(()=>{const frame=document.querySelector('#page-frame');const start=frame.getAttribute('src');const page=document.querySelectorAll('.page-link')[2];page.click();const next=frame.getAttribute('src');const title=document.getElementById('active-title').textContent;const selected=document.querySelectorAll('[aria-current=\"page\"]').length;const newTab=document.getElementById('open-external');const sameLink=newTab.getAttribute('href')===next;return {start,next,title,selected,sameLink,target:newTab.target,rel:newTab.rel}})()");
  check("iframe 页面切换",swap,swap.start!==swap.next&&swap.selected===1&&swap.sameLink&&swap.target==="_blank"&&swap.rel.includes("noopener"));
  results.pageSwap=swap;
  const anchor=await evaluate("(()=>{const frame=document.getElementById('page-frame');const section=document.querySelectorAll('.section-link')[1];section.click();return {src:frame.getAttribute('src'),selected:document.querySelectorAll('[aria-current=\"location\"]').length,title:document.getElementById('active-title').textContent}})()");
  check("小标题锚点",anchor,anchor.src.includes("#")&&anchor.selected===1);
  results.anchor=anchor;
  const collapsed=await evaluate("(()=>{const p=document.getElementById('portal'),rail=document.getElementById('rail'),button=document.getElementById('collapse');const inside=rail.contains(button);button.click();const labels=[...rail.querySelectorAll('.page-link .label')],links=[...rail.querySelectorAll('.page-link')];const first={collapsed:p.classList.contains('is-collapsed'),columns:getComputedStyle(p).gridTemplateColumns,railWidth:rail.getBoundingClientRect().width,railVisible:getComputedStyle(rail).display!=='none',inside,buttonVisible:getComputedStyle(button).display!=='none'&&button.getBoundingClientRect().width>0,labelsHidden:labels.every(x=>getComputedStyle(x).display==='none'),iconsVisible:links.length===4&&new Set(links.map(x=>x.querySelector('.nav-glyph')?.dataset.kind)).size>=3&&links.every(x=>getComputedStyle(x.querySelector('.nav-glyph')).display!=='none'),expanded:button.getAttribute('aria-expanded')};button.click();return{first,recovered:!p.classList.contains('is-collapsed')}})()");
  check("桌面图标栏折叠",collapsed,collapsed.first.collapsed&&collapsed.first.expanded==="false"&&collapsed.first.railVisible&&collapsed.first.railWidth>40&&collapsed.first.railWidth<=80&&collapsed.first.inside&&collapsed.first.buttonVisible&&collapsed.first.labelsHidden&&collapsed.first.iconsVisible&&collapsed.recovered);
  results.desktopCollapse=collapsed;
  await send("Emulation.setDeviceMetricsOverride",{width:375,height:820,deviceScaleFactor:1,mobile:true});
  await send("Page.navigate",{url:pathToFileURL(report).href});await sleep(300);
  const mobile=await evaluate("(()=>{const b=document.getElementById('open-nav'),p=document.getElementById('portal');b.click();const opened=p.classList.contains('mobile-open');document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return{opened,closed:!p.classList.contains('mobile-open'),expanded:b.getAttribute('aria-expanded')}})()");
  check("移动目录",mobile,mobile.opened&&mobile.closed&&mobile.expanded==="false");
  results.mobile=mobile;
  const tree=await send("Page.getFrameTree");
  const targets=await send("Target.getTargets");
  const childUrl=tree.frameTree?.childFrames?.[0]?.frame?.url??targets.targetInfos?.find(x=>x.type==="iframe"&&x.parentId===tree.frameTree?.frame?.id)?.url??"";

  check("真实 iframe 加载",childUrl,childUrl.startsWith("file:")&&childUrl.endsWith(".html"));
  results.loadedFrame=childUrl.split("/").slice(-2).join("/");
  check("JavaScript 异常",exceptions,exceptions.length===0);
  results.exceptions=exceptions;results.result="pass";
  return results;
 }finally{
  if(socket)socket.close();child.kill();await sleep(130);
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:2,retryDelay:200});}catch{}
 }
}
try{
 const args=process.argv.slice(2);
 if(args.length&&(args.length!==2||args[0]!=="--report"))throw Error("用法：node tests/chrome-portal-smoke.mjs [--report 路径]");
 const result=await run();
 if(args.length){const file=path.resolve(args[1]);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+"\n","utf8");}
 console.log("CHROME_PORTAL_SMOKE_PASS="+JSON.stringify(result));
}catch(error){console.error("CHROME_PORTAL_SMOKE_FAIL="+(error.stack||error.message));process.exitCode=1;}
