#!/usr/bin/env node
// Native Chrome verification for offline panorama HTML. No Playwright or network.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import {spawn} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
import {renderPanorama} from "../evals/render-unseen-panorama.mjs";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const chrome=[process.env.GEN_UI_CHROME,
 "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
 "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
 "/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(f=>fs.existsSync(f));
const args=process.argv.slice(2),files=[];let captureDir=null;
for(let i=0;i<args.length;i++){
 if(args[i]==="--capture"){captureDir=args[++i];if(!captureDir)throw Error("Missing capture directory");}
 else if(args[i]==="--files"){files.push(...args.slice(i+1));break}
 else throw Error("Usage: node tests/chrome-unseen-panorama-smoke.mjs [--capture <output-dir>] [--files <preview.html> ...]");
}
if(!chrome)throw Error("Chrome or Edge not installed");
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const errors=[];
function ensure(condition,message,details){if(!condition)errors.push({message,details})}
const inspector="(()=>{const outer=document.querySelector('.panorama-scroll'),board=document.querySelector('.panorama-board'),gate=document.querySelector('.panorama-gateway'),node=document.querySelector('.panorama-chip'),region=document.querySelector('[role=region]'),evidence=document.querySelector('.evidence');const style=x=>getComputedStyle(x);return{ready:document.readyState,viewport:innerWidth,htmlScroll:document.documentElement.scrollWidth,bodyScroll:document.body.scrollWidth,regionClient:outer?.clientWidth,regionScroll:outer?.scrollWidth,regionOverflow:outer?style(outer).overflowX:null,boardWidth:board?.getBoundingClientRect().width,boardBackground:board?style(board).backgroundColor:null,boardGrid:board?style(board).backgroundImage:null,gatewayStroke:gate?style(gate).borderLeftColor:null,moduleBackground:node?style(node).backgroundColor:null,regionFocusable:region?.tabIndex===0,modules:document.querySelectorAll('.panorama-chip').length,provenance:evidence?.querySelectorAll('li>strong').length||0,scripts:document.querySelectorAll('script,iframe,object').length,tierColors:[...document.querySelectorAll('.panorama-band .panorama-band-content')].map(x=>style(x).backgroundColor),stripeFree:[gate,...document.querySelectorAll('.panorama-band-label,.panorama-chip')].filter(Boolean).every(x=>{const t=style(x);return Math.abs(parseFloat(t.borderLeftWidth)-parseFloat(t.borderTopWidth))<.3&&t.borderLeftColor===t.borderTopColor})}})()";
async function run(){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-unseen-chrome-"));
 const portProbe=net.createServer();await new Promise(ok=>portProbe.listen(0,"127.0.0.1",ok));
 const port=portProbe.address().port;await new Promise(ok=>portProbe.close(ok));
 const proc=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions",
  "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
  "--remote-debugging-address=127.0.0.1","--remote-debugging-port="+port,
  "--user-data-dir="+profile,"about:blank"],{stdio:"ignore",windowsHide:true});
 let ws;
 try{
  let tabs;for(let i=0;i<100;i++){
   try{const response=await fetch("http://127.0.0.1:"+port+"/json");if(response.ok){tabs=await response.json();break}}catch{}
   await pause(100);
  }
  if(!tabs)throw Error("Chrome debugging connection unavailable");
  ws=new WebSocket(tabs.find(x=>x.type==="page").webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{ws.addEventListener("open",ok,{once:true});ws.addEventListener("error",fail,{once:true})});
  let seq=0;const pending=new Map();
  ws.addEventListener("message",event=>{
   const m=JSON.parse(event.data),entry=pending.get(m.id);
   if(!entry)return;pending.delete(m.id);
   if(m.error)entry.fail(Error(JSON.stringify(m.error)));
   else entry.ok(m.result);
  });
  const call=(method,params={})=>new Promise((ok,fail)=>{
   const id=++seq;pending.set(id,{ok,fail});
   ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
   const res=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
   if(res.exceptionDetails)throw Error(res.exceptionDetails.text);
   return res.result.value;
  };
  await call("Page.enable");await call("Runtime.enable");
  const tempOutput=path.join(profile,"fixture.html");
  if(!files.length){
   const sample={id:"static-fixture",status:"documented",notes:"Only Chrome renderer fixture",
    layers:[{title:"来源事实",modules:[{id:"a",title:"来源记录",evidence:[{file:"README.md",quote:"source record accepted"}]}]},
      {title:"证据验证",modules:[{id:"b",title:"审核证据",evidence:[{file:"README.md",quote:"evidence review required"}]}]}],
    relations:[]};
   const meta={id:"static-fixture",commit:"1".repeat(40),sources:[{file:"README.md"}]};
   fs.writeFileSync(tempOutput,renderPanorama(sample,meta,repo));
   files.push(tempOutput);
  }
  if(captureDir)fs.mkdirSync(captureDir,{recursive:true});
  const samples=[];
  for(const file of files){
   const abs=path.resolve(file);
   if(!fs.existsSync(abs))throw Error("Preview missing: "+abs);
   const baseName=path.basename(abs,path.extname(abs));
   const tag=(baseName==="demo.preview"?path.basename(path.dirname(abs)):baseName).replace(/[^a-z0-9-]/gi,"-");
   for(const width of [375,768,1440]){
    await call("Emulation.setDeviceMetricsOverride",{width,height:980,deviceScaleFactor:1,mobile:width===375});
    await call("Page.navigate",{url:pathToFileURL(abs).href});
    for(let i=0;i<70;i++){if(await evaluate("document.readyState==='complete'"))break;await pause(50)}
    const state=await evaluate(inspector);
    ensure(state.ready==="complete","document not loaded",{file,width});
    ensure(state.htmlScroll<=width+2&&state.bodyScroll<=width+2,"unexpected whole-page horizontal overflow",{file,width,state});
    ensure(state.modules>=2&&state.provenance>=2,"modules or source evidence missing",{file,width,state});
    ensure(state.regionFocusable&&["auto","scroll"].includes(state.regionOverflow),"diagram not keyboard-scrollable",{file,width,state});
    ensure(state.boardBackground==="rgb(255, 255, 255)"&&state.boardGrid?.includes("radial-gradient"),"SVG family board theme missing",{file,width,state});
    ensure(state.stripeFree&&new Set(state.tierColors).size===state.tierColors.length&&state.tierColors.length>=2,"distinct layer colors / no colored left stripe",{file,width,state});
    ensure(state.scripts===0,"offline HTML contains executable or embedded content",{file,width,state});
    if(width<=768)ensure(state.regionScroll>state.regionClient+50,"narrow diagram does not scroll internally",{file,width,state});
    if(captureDir){
     const shot=await call("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:false});
     fs.writeFileSync(path.join(captureDir,tag+"-"+width+".png"),Buffer.from(shot.data,"base64"));
    }
    samples.push({case:tag,width,viewport:state.viewport,bodyScroll:state.bodyScroll,diagramClient:state.regionClient,diagramScroll:state.regionScroll,nodes:state.modules});
   }
  }
  console.log(JSON.stringify({status:errors.length?"FAIL":"PASS",scenes:samples.length,issues:errors,samples},null,2));
  if(errors.length)process.exitCode=1;
 }finally{
  ws?.close();proc.kill();await pause(180);
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:120})}catch{}
 }
}
await run();
