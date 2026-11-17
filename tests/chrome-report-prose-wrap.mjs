#!/usr/bin/env node
// Real Chrome line-box regression for three problem paragraphs in demo/report.html.
import fs from "node:fs";import os from "node:os";import path from "node:path";import net from "node:net";
import {spawn} from "node:child_process";import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(fs.existsSync);
if(!chrome)throw Error("Chrome/Edge required");
const inspector="(()=>{const targets=[{id:'svg',needle:'内嵌 SVG 工程流程图'},{id:'fencing',needle:'证据推演：'},{id:'documents',needle:'中文完整技术文档'}];return targets.map(t=>{const p=[...document.querySelectorAll('#main .case-block>p')].find(n=>n.textContent.includes(t.needle));if(!p)return {...t,missing:true};const par=p.parentElement,r=p.getBoundingClientRect(),pc=getComputedStyle(par),cs=getComputedStyle(p),inner=par.clientWidth-(parseFloat(pc.paddingLeft)||0)-(parseFloat(pc.paddingRight)||0);const lines=[],tw=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);while(tw.nextNode()){const n=tw.currentNode,s=n.textContent;for(let i=0;i<s.length;i++){const ch=s[i];if(!ch.trim())continue;const rr=document.createRange();rr.setStart(n,i);rr.setEnd(n,i+1);const b=rr.getBoundingClientRect();if(b.width<.1)continue;let line=lines.find(y=>Math.abs(y.top-b.top)<3);if(!line){line={top:b.top,left:b.left,right:b.right,text:''};lines.push(line)}line.left=Math.min(line.left,b.left);line.right=Math.max(line.right,b.right);line.text+=ch}}lines.sort((a,b)=>a.top-b.top);return{id:t.id,rectWidth:Math.round(r.width),parentInner:Math.round(inner),maxWidth:cs.maxWidth,textWrap:cs.textWrap,whiteSpace:cs.whiteSpace,lines:lines.map(l=>({text:l.text.slice(0,90),width:Math.round(l.right-l.left),rightBlank:Math.round(r.right-l.right)})),heading:[...par.querySelectorAll('h3')].slice(0,1).map(h=>({width:h.getBoundingClientRect().width,maxWidth:getComputedStyle(h).maxWidth,wrap:getComputedStyle(h).textWrap}))}})})()";
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));const dir=fs.mkdtempSync(path.join(os.tmpdir(),"genui-report-wrap-"));
const srv=net.createServer();await new Promise(ok=>srv.listen(0,"127.0.0.1",ok));const port=srv.address().port;await new Promise(ok=>srv.close(ok));
const proc=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking","--no-first-run","--remote-allow-origins=*","--remote-debugging-address=127.0.0.1","--remote-debugging-port="+port,"--user-data-dir="+dir,"about:blank"],{windowsHide:true,stdio:"ignore"});
let ws;try{
 let tabs;for(let i=0;i<100;i++){try{let res=await fetch("http://127.0.0.1:"+port+"/json");if(res.ok){tabs=await res.json();break}}catch{}await sleep(110)}if(!tabs)throw Error("Chrome CDP unavailable");
 ws=new WebSocket(tabs.find(x=>x.type==="page").webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.addEventListener("open",ok,{once:true});ws.addEventListener("error",bad,{once:true})});
 let n=0;const pending=new Map();ws.addEventListener("message",ev=>{let d=JSON.parse(ev.data),cb=pending.get(d.id);if(!cb)return;pending.delete(d.id);d.error?cb.bad(Error(JSON.stringify(d.error))):cb.ok(d.result)});
 const call=(method,params={})=>new Promise((ok,bad)=>{const id=++n;pending.set(id,{ok,bad});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
 await call("Page.enable");await call("Runtime.enable");const report=path.join(root,"demo/report.html"),results=[],diagnose=process.argv.includes("--diagnose");
 for(const width of [375,768,1440])for(const collapsed of (width===1440?[false,true]:[false])){
  await call("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:width===375});
  await call("Page.navigate",{url:pathToFileURL(report).href});
  for(let i=0;i<80;i++){if(await evaluate("document.readyState==='complete'"))break;await sleep(50)}
  if(collapsed){await evaluate("document.querySelector('#toggle-sidebar')?.click()");await sleep(150)}
  const data=await evaluate(inspector);results.push({width,collapsed,data});
  for(const a of data){if(a.missing)throw Error("Missing paragraph "+a.id);
   if(!diagnose&&width>=768&&a.parentInner>490&&a.rectWidth<a.parentInner*.92&&a.parentInner-a.rectWidth>30)throw Error("Premature paragraph width "+a.id+" "+width+" "+JSON.stringify(a));
   if(!diagnose&&a.lines.some(l=>l.rightBlank<-5))throw Error("Text clipped "+a.id+" "+width);
   if(!diagnose&&a.heading.some(h=>h.width<a.parentInner*.93))throw Error("Heading does not occupy available section width "+a.id+" "+width)}
 }
 console.log(JSON.stringify({status:"PASS",scenes:results.length,results:diagnose?results:results.map(v=>({width:v.width,collapsed:v.collapsed,data:v.data.map(a=>({id:a.id,rectWidth:a.rectWidth,parentInner:a.parentInner,maxWidth:a.maxWidth,lines:a.lines.length,firstLine:a.lines[0]}))}))},null,2));
}finally{ws?.close();proc.kill();await sleep(170);try{fs.rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100})}catch{}}
