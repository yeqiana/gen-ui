#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import {spawn} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const chrome=[process.env.GEN_UI_CHROME,"C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].filter(Boolean).find(fs.existsSync);
if(!chrome)throw Error("No Chrome/Edge browser found");
const check=(name,details,pass)=>{if(!pass)throw Error(name+" failed: "+JSON.stringify(details));};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const server=net.createServer();
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
await new Promise(resolve=>server.close(resolve));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-layout-review-"));
const browser=spawn(chrome,["--headless=new","--disable-gpu","--no-first-run","--disable-extensions","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"],{stdio:"ignore",windowsHide:true});
let socket;
try{
 let pages;
 for(let i=0;i<90;i++){try{const response=await fetch("http://127.0.0.1:"+port+"/json");if(response.ok){pages=await response.json();break}}catch{}await sleep(90)}
 check("Chrome startup",pages,!!pages);
 socket=new WebSocket(pages.find(page=>page.type==="page").webSocketDebuggerUrl);
 await new Promise(resolve=>socket.addEventListener("open",resolve,{once:true}));
 let id=0;const pending=new Map();
 socket.addEventListener("message",event=>{const message=JSON.parse(event.data),promise=pending.get(message.id);if(!promise)return;pending.delete(message.id);message.error?promise.reject(message.error):promise.resolve(message.result)});
 const command=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}))});
 const evaluate=async(fn,...args)=>{
  const expression="("+fn.toString()+")("+args.map(x=>JSON.stringify(x)).join(",")+")";
  const result=await command("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
 };
 async function navigate(file,width){
  await command("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:false});
  await command("Page.navigate",{url:pathToFileURL(path.join(root,file)).href});
  for(let i=0;i<90;i++){if(await evaluate(()=>document.readyState==="complete"))break;await sleep(80)}
  await sleep(150);
 }
 function testReportFlow(){
  const svg=document.getElementById("flow-svg"),stage=document.getElementById("flow-canvas");
  const caption=svg.querySelector(".flow-edge-labels>g text");
  const original=caption.textContent,baseline=svg.viewBox.baseVal.width;
  caption.textContent="跨节点请求参数校验与事务状态恢复信息".repeat(16);
  const grew=window.GenUIFlowLabelLayout.layout();
  const large=svg.viewBox.baseVal.width,readable=caption.getBoundingClientRect().height,scrollable=stage.scrollWidth>stage.clientWidth+400;
  const pixelsPerUnit=svg.getBoundingClientRect().width/large;
  const viewBefore=window.GenUIFlow.getView().w;
  document.getElementById("flow-zoom-in").click();
  const viewZoom=window.GenUIFlow.getView().w;
  document.getElementById("flow-fit").click();
  const viewFit=window.GenUIFlow.getView().w;
  caption.textContent=original;
  const restored=window.GenUIFlowLabelLayout.layout();
  const restoredWidth=svg.viewBox.baseVal.width;
  document.getElementById("flow-fit").click();
  return {grew,restored,baseline,large,readable,pixelsPerUnit,scrollable,stageWidth:stage.clientWidth,svgWidth:svg.getBoundingClientRect().width,viewBefore,viewZoom,viewFit,restoredWidth,overflow:getComputedStyle(stage).overflowX};
 }
 function testSequence(model){
  const host=document.createElement("section");host.className="genui-semantic-diagram";host.dataset.semanticDiagram="sequence";
  const source=document.createElement("script");source.type="application/json";source.dataset.diagramModel="";source.textContent=JSON.stringify(model);
  host.append(source);document.querySelector("main").append(host);
  const valid=window.GenUISemantic.validateModel("sequence",model);
  window.GenUISemantic.init(host);
  const diagram=host.querySelector(".semantic-svg");
  if(!diagram)return {valid,error:host.dataset.semanticError};
  return new Promise(resolve=>setTimeout(()=>{
   const ids=model.participants.map(x=>x.id);
   const cross=[...diagram.querySelectorAll(".semantic-edge")].filter(n=>
    (n.dataset.source===ids[0]&&n.dataset.target===ids[2])||(n.dataset.source===ids[2]&&n.dataset.target===ids[0]));
   const spans=cross.map(edge=>{
    const d=edge.querySelector("path"),start=d.getPointAtLength(0),end=d.getPointAtLength(d.getTotalLength());
    return {distance:Math.abs(end.x-start.x),reverse:end.x<start.x,arrow:d.hasAttribute("marker-end")};
   });
   const chips=[...diagram.querySelectorAll(".semantic-edge-chip")].filter(chip=>
    (chip.dataset.source===ids[0]&&chip.dataset.target===ids[2])||(chip.dataset.source===ids[2]&&chip.dataset.target===ids[0]));
   const result={valid:valid.ok,width:diagram.viewBox.baseVal.width,spans,labels:chips.map(ch=>({truncated:ch.dataset.truncated,full:ch.querySelector("title")?.textContent?.length,shown:ch.querySelector("text")?.textContent?.length,layout:ch.dataset.layoutOk})),pageOverflow:document.documentElement.scrollWidth>innerWidth+2};
   window.GenUISemantic.destroy(host);host.remove();resolve(result);
  },300));
 }
 async function testArchitecture(){
  const views=[...document.querySelectorAll(".architecture-view")],first=views[0],scene=first.querySelector(".architecture-scene");
  const card=first.querySelector(".architecture-layers>.architecture-group"),wire=first.querySelector(".architecture-wire"),stage=first.querySelector(".architecture-stage");
  const group=wire.closest(".architecture-flow-row"),from=group.dataset.from,to=group.dataset.to;
  const sourceData=JSON.parse(first.closest("[data-architecture-view]").querySelector('script[type="application/json"]').textContent);
  const cards=[...first.querySelectorAll(".architecture-layers>.architecture-group")];
  const cardFor=ref=>cards.find((c,i)=>sourceData.groups[i].id===ref||sourceData.groups[i].name===ref);
  const point=(path,frac)=>path.getPointAtLength(path.getTotalLength()*frac).matrixTransform(path.getScreenCTM());
  const anchored=()=>{
   const a=cardFor(from).getBoundingClientRect(),b=cardFor(to).getBoundingClientRect(),start=point(wire,0),end=point(wire,1);
   return Math.abs(start.x-a.right)<12&&Math.abs(end.x-b.right)<24&&Math.abs(start.y-a.top-a.height/2)<12&&Math.abs(end.y-b.top-b.height/2)<12;
  };
  const before={card:card.getBoundingClientRect().width,wire:wire.getBoundingClientRect().width};
  const connected=anchored();
  first.querySelector('[title="放大架构图"]').click();
  const after={card:card.getBoundingClientRect().width,wire:wire.getBoundingClientRect().width};
  const reAnchored=anchored();
  first.querySelector('[title="适应窗口"]').click();
  const fit=first.querySelector(".architecture-percent").textContent;
  const flowCount=document.querySelectorAll(".architecture-flow-row").length;
  const evidenceCount=document.querySelectorAll(".architecture-wire-evidence").length;
  const overflow=document.documentElement.scrollWidth>innerWidth+2;
  const scroll=stage.scrollWidth>stage.clientWidth+5;
  const fullButton=first.querySelector('[title="全屏查看架构图"]');
  fullButton.click();
  await new Promise(resolve=>setTimeout(resolve,180));
  const fullscreen=document.fullscreenElement===first||first.classList.contains("architecture-fallback-fullscreen");
  const fullConnected=anchored();
  fullButton.click();
  await new Promise(resolve=>setTimeout(resolve,180));
  const exited=document.fullscreenElement!==first&&!first.classList.contains("architecture-fallback-fullscreen");
  return {views:views.length,flowCount,evidenceCount,connected,reAnchored,fullConnected,fullscreen,exited,fit,cardRatio:after.card/before.card,wireRatio:after.wire/before.wire,overflow,scroll};
 }
 const evidence=[];
 await navigate("demo/report.html",1440);
 const report=await evaluate(testReportFlow);
 check("Readable long connector and dynamic refit",report,report.grew&&report.restored&&report.large>report.baseline*2&&report.readable>=9&&report.pixelsPerUnit>=.83&&report.scrollable&&report.viewZoom<report.viewBefore&&Math.abs(report.viewFit-report.large)<1&&Math.abs(report.restoredWidth-report.baseline)<1&&report.overflow==="auto");
 evidence.push({name:"long-flow",...report});
 const originalHtml=fs.readFileSync(path.join(root,"demo/custom-diagram-model.html"),"utf8");
 const sourceModel=originalHtml.match(/data-semantic-diagram="sequence"><script type="application\/json" data-diagram-model>([\s\S]*?)<\/script>/);
 check("Sequence fixture",!!sourceModel,!!sourceModel);
 const model=JSON.parse(sourceModel[1]),ids=model.participants.map(x=>x.id),label="跨服务消息携带的上下文校验及失败恢复信息".repeat(3);
 model.messages.push({from:ids[0],to:ids[2],kind:"async",label:{zh:label,en:"Cross-component consistency and recovery state message".repeat(3)}});
 model.messages.push({from:ids[2],to:ids[0],kind:"return",label:{zh:label,en:"Reverse acknowledgement and recovery state validation".repeat(3)}});
 await navigate("demo/custom-diagram-model.html",1440);
 const seq=await evaluate(testSequence,model);
 check("Cross-node and reverse sequence spans",seq,seq.valid&&seq.width>960&&seq.spans.length===2&&seq.spans.every(x=>x.distance>550&&x.arrow)&&seq.spans.some(x=>x.reverse)&&seq.labels.length===2&&seq.labels.every(x=>x.layout==="true"||x.layout==="fallback")&&!seq.pageOverflow);
 evidence.push({name:"sequence",...seq});
 for(const width of [1440,375]){
  await navigate("demo/architecture-patterns.html",width);
  const arch=await evaluate(testArchitecture);
  check("Unified architecture zoom, anchoring, fullscreen "+width,arch,arch.views===8&&arch.flowCount===24&&arch.evidenceCount===24&&arch.connected&&arch.reAnchored&&arch.fullConnected&&arch.fullscreen&&arch.exited&&arch.fit==="100%"&&arch.cardRatio>1.14&&arch.wireRatio>1.14&&!arch.overflow&&(width!==375||arch.scroll));
  evidence.push({name:"architecture",width,...arch});
 }
 console.log(JSON.stringify({result:"PASS",evidence}));
}finally{try{socket?.close()}catch{}browser.kill();await sleep(100);fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:120})}
