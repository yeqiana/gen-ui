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
  const viewFit=window.GenUIFlow.getView().w;stage.scrollLeft=stage.scrollWidth;const scrollBeforeFit=stage.scrollLeft;document.getElementById("flow-fit").click();const scrollAfterFit=stage.scrollLeft;
  caption.textContent=original;
  const restored=window.GenUIFlowLabelLayout.layout();
  const restoredWidth=svg.viewBox.baseVal.width;
  document.getElementById("flow-fit").click();
  return {grew,restored,baseline,large,readable,pixelsPerUnit,scrollable,stageWidth:stage.clientWidth,svgWidth:svg.getBoundingClientRect().width,viewBefore,viewZoom,viewFit,restoredWidth,scrollBeforeFit,scrollAfterFit,overflow:getComputedStyle(stage).overflowX};
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
   const selfCalls=[...diagram.querySelectorAll(".semantic-edge")].filter(edge=>edge.dataset.source===edge.dataset.target).map(edge=>{const path=edge.querySelector("path");return{kind:edge.dataset.kind,length:path.getTotalLength(),d:path.getAttribute("d"),dashed:path.getAttribute("stroke-dasharray"),stroke:path.getAttribute("stroke")};});
    const selfCallLabels=[...diagram.querySelectorAll(".semantic-edge-chip")].filter(ch=>ch.dataset.source===ch.dataset.target).map(ch=>{const box=ch.getBBox(),full=ch.querySelector("title")?.textContent??"",shown=ch.querySelector("text")?.textContent??"",rect=ch.querySelector("rect").getBoundingClientRect(),owner=ch.closest(".semantic-edge"),actors=[...diagram.querySelectorAll(".semantic-actor>rect")],hit=(a,b,pad=1)=>a.left<b.right+pad&&a.right>b.left-pad&&a.top<b.bottom+pad&&a.bottom>b.top-pad;return{full,shown,truncated:ch.dataset.truncated,layout:ch.dataset.layoutOk,inside:box.x>=0&&box.y>=0&&box.x+box.width<=diagram.viewBox.baseVal.width&&box.y+box.height<=diagram.viewBox.baseVal.height,actorCollisions:actors.filter(n=>hit(rect,n.getBoundingClientRect())).length,lifelineCollisions:[...diagram.querySelectorAll(".semantic-lifeline")].filter(n=>hit(rect,n.getBoundingClientRect(),3)).length,activationCollisions:[...diagram.querySelectorAll(".semantic-activation")].filter(n=>hit(rect,n.getBoundingClientRect(),2)).length,messageLineCollisions:[...diagram.querySelectorAll(".semantic-edge path")].filter(n=>n.closest(".semantic-edge")!==owner&&hit(rect,n.getBoundingClientRect(),2)).length,rightOfParticipants:diagram.querySelectorAll(".semantic-lifeline").length>0&&rect.left>=diagram.querySelectorAll(".semantic-lifeline")[diagram.querySelectorAll(".semantic-lifeline").length-1].getBoundingClientRect().right+4};});
    const result={valid:valid.ok,width:diagram.viewBox.baseVal.width,spans,labels:chips.map(ch=>({truncated:ch.dataset.truncated,full:ch.querySelector("title")?.textContent?.length,shown:ch.querySelector("text")?.textContent?.length,layout:ch.dataset.layoutOk})),selfCalls,selfCallLabels,pageOverflow:document.documentElement.scrollWidth>innerWidth+2};
   window.GenUISemantic.destroy(host);host.remove();resolve(result);
  },300));
 }
 async function testArchitecture(){
 const views=[...document.querySelectorAll('.architecture-view')],first=views[0],stage=first.querySelector('.architecture-stage'),cards=[...first.querySelectorAll('.architecture-layers>.architecture-group')];
 const sourceData=JSON.parse(first.closest('[data-architecture-view]').querySelector('script[type="application/json"]').textContent),cardFor=ref=>cards.find((c,i)=>sourceData.groups[i].id===ref||sourceData.groups[i].name===ref),rows=[...first.querySelectorAll('.architecture-flow-row')];
 const point=(path,frac)=>path.getPointAtLength(path.getTotalLength()*frac).matrixTransform(path.getScreenCTM()),allRows=[...document.querySelectorAll('.architecture-flow-row')];
 const anchored=()=>allRows.every(row=>{const view=row.closest('.architecture-view'),host=view.closest('[data-architecture-view]'),data=JSON.parse(host.querySelector('script[type="application/json"]').textContent),nodes=[...view.querySelectorAll('.architecture-layers>.architecture-group')],findCard=ref=>nodes.find((node,i)=>data.groups[i].id===ref||data.groups[i].name===ref),path=row.querySelector('.architecture-wire'),side=path.dataset.routeSide,a=findCard(row.dataset.from).getBoundingClientRect(),b=findCard(row.dataset.to).getBoundingClientRect(),start=point(path,0),end=point(path,1),sx=side==='left'?a.left:a.right,ex=side==='left'?b.left:b.right;return Math.abs(start.x-sx)<12&&start.y>a.top+4&&start.y<a.bottom-4&&Math.abs(end.x-ex)<24&&end.y>b.top+4&&end.y<b.bottom-4;});
 const firstCard=cards[0],before={card:firstCard.getBoundingClientRect().width,wire:first.querySelector('.architecture-wire').getBoundingClientRect().width},connected=anchored();
 first.querySelector("button[title='放大架构图']").click();const after={card:firstCard.getBoundingClientRect().width,wire:first.querySelector('.architecture-wire').getBoundingClientRect().width},reAnchored=anchored();
 first.querySelector("button[title='适应窗口']").click();const fit=first.querySelector('.architecture-percent').textContent,flowCount=[...document.querySelectorAll('[data-architecture-view]')].reduce((sum,host)=>sum+(JSON.parse(host.querySelector('script[type="application/json"]').textContent).flows?.length??0),0),evidenceCount=document.querySelectorAll('.architecture-wire-evidence').length,overflow=document.documentElement.scrollWidth>innerWidth+2,scroll=stage.scrollWidth>stage.clientWidth+5;
 const fullButton=first.querySelector("button[title='全屏查看架构图']");fullButton.click();await new Promise(resolve=>setTimeout(resolve,180));const fullscreen=document.fullscreenElement===first||first.classList.contains('architecture-fallback-fullscreen'),fullConnected=anchored();
 fullButton.click();await new Promise(resolve=>setTimeout(resolve,180));const exited=document.fullscreenElement!==first&&!first.classList.contains('architecture-fallback-fullscreen');
 return{views:views.length,flowCount,evidenceCount,connected,reAnchored,fullConnected,fullscreen,exited,fit,cardRatio:after.card/before.card,wireRatio:after.wire/before.wire,overflow,scroll,routeSides:{left:allRows.filter(row=>row.querySelector('.architecture-wire').dataset.routeSide==='left').length,right:allRows.filter(row=>row.querySelector('.architecture-wire').dataset.routeSide==='right').length}};
}
async function testArchitectureFlowCapacity(){
 const results=[];
 const makeFlow=(from,to,i)=>({from,to,label:"关系 "+(i+1)+"：跨模块调用与数据协作",basis:"design",evidence:"docs/architecture/source.md"});
 const capacities=[1,3,4,8,12].map(count=>{const groups=Array.from({length:count+1},(_,i)=>({id:"n"+i,name:"节点"+i,items:["模块 "+i]}));return{name:"chain-"+count,groups,flows:Array.from({length:count},(_,i)=>makeFlow("n"+i,"n"+(i+1),i))};});
 const names="ABCDEFG".split("");
 const scenarios=[
  {name:"crossing-endpoints",names:"ABCDEF".split(""),pairs:[["A","F"],["B","E"],["C","D"],["A","E"],["D","B"],["F","C"]]},
  {name:"fanin-fanout",names,pairs:[["A","C"],["B","C"],["C","D"],["C","E"],["C","A"],["F","C"],["G","C"]]},
  {name:"reverse-cycle",names:"ABCDE".split(""),pairs:[["A","B"],["B","A"],["B","C"],["C","B"],["C","D"],["D","C"],["D","E"],["E","D"]]},
  {name:"twelve-way-converge",names:"ABCDEFGHIJKLM".split(""),pairs:"ABCDEFGHIJKL".split("").map(n=>[n,"M"])},
  {name:"twelve-way-fanout",names:"ABCDEFGHIJKLM".split(""),pairs:"BCDEFGHIJKLM".split("").map(n=>["A",n])}
 ];
 for(const item of scenarios){const groups=item.names.map(n=>({id:n.toLowerCase(),name:n,items:["模块 "+n]}));capacities.push({name:item.name,groups,flows:item.pairs.map((p,i)=>makeFlow(p[0].toLowerCase(),p[1].toLowerCase(),i))});}
 const parse=path=>{const t=path.getAttribute("d").match(/[MHV]|-?\d+(?:\.\d+)?/g)||[];let x=0,y=0,out=[];for(let i=0;i<t.length;){const c=t[i++];if(c==="M"){x=+t[i++];y=+t[i++];}else if(c==="H"){const nx=+t[i++];out.push({x1:x,y1:y,x2:nx,y2:y});x=nx;}else if(c==="V"){const ny=+t[i++];out.push({x1:x,y1:y,x2:x,y2:ny});y=ny;}}return out;};
 const conflict=(a,b)=>{const endpoint=(seg,x,y)=>(Math.abs(seg.x1-x)<.1&&Math.abs(seg.y1-y)<.1)||(Math.abs(seg.x2-x)<.1&&Math.abs(seg.y2-y)<.1);const ah=Math.abs(a.y1-a.y2)<.1,bh=Math.abs(b.y1-b.y2)<.1,av=Math.abs(a.x1-a.x2)<.1,bv=Math.abs(b.x1-b.x2)<.1;if(ah&&bv){const x=b.x1,y=a.y1,hit=x>=Math.min(a.x1,a.x2)-.1&&x<=Math.max(a.x1,a.x2)+.1&&y>=Math.min(b.y1,b.y2)-.1&&y<=Math.max(b.y1,b.y2)+.1;return hit&&!(endpoint(a,x,y)&&endpoint(b,x,y));}if(av&&bh){const x=a.x1,y=b.y1,hit=x>=Math.min(b.x1,b.x2)-.1&&x<=Math.max(b.x1,b.x2)+.1&&y>=Math.min(a.y1,a.y2)-.1&&y<=Math.max(a.y1,a.y2)+.1;return hit&&!(endpoint(a,x,y)&&endpoint(b,x,y));}if(ah&&bh){const overlap=Math.min(Math.max(a.x1,a.x2),Math.max(b.x1,b.x2))-Math.max(Math.min(a.x1,a.x2),Math.min(b.x1,b.x2));return Math.abs(a.y1-b.y1)<4.4&&overlap>4;}if(av&&bv){const overlap=Math.min(Math.max(a.y1,a.y2),Math.max(b.y1,b.y2))-Math.max(Math.min(a.y1,a.y2),Math.min(b.y1,b.y2));return Math.abs(a.x1-b.x1)<4.4&&overlap>4;}return false;};
 const anchorCheck=(rows,cardFor)=>rows.every(row=>{const path=row.querySelector(".architecture-wire");if(getComputedStyle(path).display==="none")return true;const side=path.dataset.routeSide,a=cardFor(row.dataset.from).getBoundingClientRect(),b=cardFor(row.dataset.to).getBoundingClientRect(),p=path.getPointAtLength(0).matrixTransform(path.getScreenCTM()),q=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM()),sx=side==="left"?a.left:a.right,ex=side==="left"?b.left:b.right;return path.hasAttribute("marker-end")&&Math.abs(p.x-sx)<2&&Math.abs(q.x-ex)<2&&p.y>a.top+3&&p.y<a.bottom-3&&q.y>b.top+3&&q.y<b.bottom-3;});
 const cardCrossings=(records,cards,scene)=>{const rect=scene.getBoundingClientRect(),scale=rect.width/Math.max(1,scene.offsetWidth);return records.some(record=>record.segments.some(seg=>cards.some(card=>{const r=card.getBoundingClientRect(),b={left:(r.left-rect.left)/scale,right:(r.right-rect.left)/scale,top:(r.top-rect.top)/scale,bottom:(r.bottom-rect.top)/scale};if(Math.abs(seg.y1-seg.y2)<.1)return seg.y1>b.top+2&&seg.y1<b.bottom-2&&Math.max(Math.min(seg.x1,seg.x2),b.left+2)<Math.min(Math.max(seg.x1,seg.x2),b.right-2);return seg.x1>b.left+2&&seg.x1<b.right-2&&Math.max(Math.min(seg.y1,seg.y2),b.top+2)<Math.min(Math.max(seg.y1,seg.y2),b.bottom-2);})));};
 for(const scenario of capacities){
  const wrapper=document.createElement("div");wrapper.style.width="100%";wrapper.style.maxWidth="none";
  const host=document.createElement("div");host.dataset.architectureView="";
  const model={type:"系统架构",title:scenario.name,layout:"stack",groups:scenario.groups,flows:scenario.flows},source=document.createElement("script");source.type="application/json";source.textContent=JSON.stringify(model);host.append(source);wrapper.append(host);document.querySelector("main").append(wrapper);
  const first=window.GenUIArchitecture.init(host),second=window.GenUIArchitecture.init(host);await new Promise(resolve=>setTimeout(resolve,220));
  const scene=host.querySelector(".architecture-scene"),layers=host.querySelector(".architecture-layers"),stage=host.querySelector(".architecture-stage"),rows=[...host.querySelectorAll(".architecture-flow-row")],labels=[...host.querySelectorAll(".architecture-wire-label")],cards=[...layers.querySelectorAll(":scope > .architecture-group")],cardFor=ref=>cards.find((card,i)=>scenario.groups[i].id===ref||scenario.groups[i].name===ref),mode=scene.dataset.relationshipMode;
  const records=rows.filter(row=>getComputedStyle(row.querySelector(".architecture-wire")).display!=="none").map(row=>({row,side:row.querySelector(".architecture-wire").dataset.routeSide,segments:parse(row.querySelector(".architecture-wire"))}));
  let crossingCount=0;for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){if(records[i].side!==records[j].side)continue;if(records[i].segments.some(a=>records[j].segments.some(b=>conflict(a,b))))crossingCount++;}
  const labelsSeparated=["left","right"].every(side=>{const sideLabels=labels.filter(label=>label.dataset.routeSide===side).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);return sideLabels.every((label,i)=>i===0||sideLabels[i-1].getBoundingClientRect().bottom<=label.getBoundingClientRect().top+1);});
  const endpointsComplete=rows.every(row=>{const label=labels.find(x=>x.dataset.from===row.dataset.from&&x.dataset.to===row.dataset.to),from=scenario.groups.find(g=>g.id===row.dataset.from)?.name,to=scenario.groups.find(g=>g.id===row.dataset.to)?.name;return label?.querySelector(".architecture-wire-endpoints")?.textContent===from+" → "+to;});
  const evidenceCount=labels.reduce((n,label)=>n+label.querySelectorAll(".architecture-wire-evidence").length,0),flowTotal=rows.reduce((n,row)=>n+Number(row.dataset.flowCount),0);
  const portMap=new Map();for(const row of rows){const path=row.querySelector(".architecture-wire");for(const [id,value] of [[row.dataset.from,Number(path.dataset.startY)],[row.dataset.to,Number(path.dataset.endY)]]){if(!portMap.has(id))portMap.set(id,[]);portMap.get(id).push(value);}}
  const gaps=[...portMap.values()].flatMap(values=>values.sort((a,b)=>a-b).slice(1).map((v,i)=>v-values[i])),minPortGap=gaps.length?Math.min(...gaps):Infinity,portSpacing=minPortGap>=8.5;
  const note=host.querySelector(".architecture-relationship-note"),noteVisible=!!note&&!note.hidden,allPathsHidden=rows.every(row=>row.querySelector(".architecture-wire").style.display==="none"),visiblePaths=records.length;
  const anchored=mode==="list"||anchorCheck(rows,cardFor),noCardCrossings=!cardCrossings(records,cards,scene),noPageOverflow=document.documentElement.scrollWidth<=innerWidth+2;
  const beforeStage=stage.clientWidth,beforeScene=scene.style.width;wrapper.style.width="80%";await new Promise(resolve=>setTimeout(resolve,300));const resizeObserved=stage.clientWidth<beforeStage,anchoredAfterResize=mode==="list"||anchorCheck(rows,cardFor);
  const result={name:scenario.name,expectedRows:scenario.flows.length,rows:rows.length,flowTotal,evidenceCount,mode,detectedCrossings:Number(scene.dataset.relationshipCrossings||0),crossingCount,visiblePaths,allPathsHidden,noteVisible,labelsSeparated,endpointsComplete,portSpacing,minPortGap:Number.isFinite(minPortGap)?+minPortGap.toFixed(2):null,anchored,anchoredAfterResize,noCardCrossings,noPageOverflow,idempotent:first===second&&host.querySelectorAll(".architecture-view").length===1,resizeObserved,sceneWidthBefore:beforeScene,sceneWidthAfter:scene.style.width,stageWidthBefore:beforeStage,stageWidthAfter:stage.clientWidth};
  window.GenUIArchitecture.destroy(host);result.destroyed=!host.querySelector(".architecture-view")&&host.dataset.genUiArchitectureReady!=="true";results.push(result);wrapper.remove();
 }
 const host=document.createElement("div");host.dataset.architectureView="";const source=document.createElement("script");source.type="application/json";source.textContent=JSON.stringify({type:"系统架构",title:"自动销毁",layout:"stack",groups:[{name:"A",items:["a"]}]});host.append(source);document.querySelector("main").append(host);window.GenUIArchitecture.init(host);host.remove();await new Promise(resolve=>setTimeout(resolve,100));const autoDestroyed=!host.querySelector(".architecture-view")&&host.dataset.genUiArchitectureReady!=="true";
 return{results,autoDestroyed};
}
function testMediaLifecycle(){
   const panel=document.getElementById("flow-panel"),one=window.GenUIMedia.initDiagram(panel),two=window.GenUIMedia.initDiagram(panel),same=one===two;
   window.GenUIMedia.destroyDiagram(panel);const diagramDestroyed=panel.dataset.genUiDiagramReady!=="true";
   const again=window.GenUIMedia.initDiagram(panel),reinitialized=!!again&&panel.dataset.genUiDiagramReady==="true";
   const images=[...document.querySelectorAll("img[data-zoomable]")].length;
   window.GenUIMedia.initImages();window.GenUIMedia.initImages();
   const overlaysAfterRepeat=document.querySelectorAll(".genui-image-overlay").length;
   window.GenUIMedia.destroyImages();const overlaysAfterDestroy=document.querySelectorAll(".genui-image-overlay").length;
   window.GenUIMedia.initImages();const overlaysAfterReinit=document.querySelectorAll(".genui-image-overlay").length;
   window.GenUIMedia.destroyImages();
   return {same,diagramDestroyed,reinitialized,images,overlaysAfterRepeat,overlaysAfterDestroy,overlaysAfterReinit};
  }
const evidence=[];
 await navigate("demo/report.html",1440);
 const report=await evaluate(testReportFlow);
 check("Readable long connector and dynamic refit",report,report.grew&&report.restored&&report.large>report.baseline*2&&report.readable>=9&&report.pixelsPerUnit>=.83&&report.scrollable&&report.viewZoom<report.viewBefore&&Math.abs(report.viewFit-report.large)<1&&Math.abs(report.restoredWidth-report.baseline)<1&&report.overflow==="auto"&&report.scrollBeforeFit>0&&report.scrollAfterFit===0);
 evidence.push({name:"long-flow",...report});
  const media=await evaluate(testMediaLifecycle);check("Media viewer singleton and lifecycle",media,media.same&&media.diagramDestroyed&&media.reinitialized&&media.images>0&&media.overlaysAfterRepeat===1&&media.overlaysAfterDestroy===0&&media.overlaysAfterReinit===1);evidence.push({name:"media-lifecycle",...media});
 const originalHtml=fs.readFileSync(path.join(root,"demo/custom-diagram-model.html"),"utf8");
 const sourceModel=originalHtml.match(/data-semantic-diagram="sequence"><script type="application\/json" data-diagram-model>([\s\S]*?)<\/script>/);
 check("Sequence fixture",!!sourceModel,!!sourceModel);
 const model=JSON.parse(sourceModel[1]),ids=model.participants.map(x=>x.id),label="跨服务消息携带的上下文校验及失败恢复信息".repeat(3);
 model.messages.push({from:ids[0],to:ids[2],kind:"async",label:{zh:label,en:"Cross-component consistency and recovery state message".repeat(3)}});
 model.messages.push({from:ids[2],to:ids[0],kind:"return",label:{zh:label,en:"Reverse acknowledgement and recovery state validation".repeat(3)}});
  model.messages.push({from:ids[1],to:ids[1],kind:"sync",y:605,label:{zh:"API 内部自调用及重入校验",en:"Internal API self-call and reentrancy check"}});
  model.messages.push({from:ids[1],to:ids[1],kind:"async",y:680,label:{zh:"异步自调用回调",en:"Asynchronous self-call callback"}});
  model.messages.push({from:ids[1],to:ids[1],kind:"return",y:755,label:{zh:"自调用返回结果",en:"Self-call return result"}});
  model.messages.push({from:ids[1],to:ids[1],kind:"sync",y:830,label:{zh:"长消息自调用参数校验及完整上下文传递与异常恢复".repeat(5),en:"Long self-call parameter validation and complete context propagation with recovery ".repeat(3)}});
  model.messages.push({from:ids[0],to:ids[0],kind:"sync",y:905,label:{zh:"首参与者长消息自调用边界测试".repeat(8),en:"First participant long self-call boundary test ".repeat(5)}});
  model.messages.push({from:ids[ids.length-1],to:ids[ids.length-1],kind:"async",y:980,label:{zh:"末参与者长消息自调用边界测试".repeat(8),en:"Last participant long self-call boundary test ".repeat(5)}});
 for(const width of [1440,375]){
  await navigate("demo/custom-diagram-model.html",width);
  const seq=await evaluate(testSequence,model);
  check("Cross-node and reverse sequence spans "+width,seq,seq.valid&&seq.width>960&&seq.spans.length===2&&seq.spans.every(x=>x.distance>550&&x.arrow)&&seq.spans.some(x=>x.reverse)&&seq.labels.length===2&&seq.labels.every(x=>x.layout==="true"||x.layout==="fallback")&&seq.selfCalls.length===6&&seq.selfCalls.every(x=>x.length>40&&x.d.includes("H")&&x.d.includes("V"))&&seq.selfCalls.some(x=>x.stroke==="#3a83f7")&&seq.selfCalls.some(x=>x.dashed)&&seq.selfCallLabels.length===6&&seq.selfCallLabels.every(x=>x.full===x.shown&&x.truncated==="false"&&x.layout==="true"&&x.inside&&x.actorCollisions===0&&x.lifelineCollisions===0&&x.activationCollisions===0&&x.messageLineCollisions===0&&x.rightOfParticipants)&&!seq.pageOverflow);
  evidence.push({name:"sequence",width,...seq});
 }
 for(const width of [1440,375]){
  await navigate("demo/architecture-patterns.html",width);
  const arch=await evaluate(testArchitecture);
  check("Unified architecture zoom, anchoring, fullscreen "+width,arch,arch.views===8&&arch.flowCount===24&&arch.evidenceCount===24&&arch.routeSides.left>0&&arch.routeSides.right>0&&arch.connected&&arch.reAnchored&&arch.fullConnected&&arch.fullscreen&&arch.exited&&arch.fit==="100%"&&arch.cardRatio>1.14&&arch.wireRatio>1.14&&!arch.overflow&&(width!==375||arch.scroll));
  evidence.push({name:"architecture",width,...arch});
 }
 for(const width of [1440,375]){await navigate("demo/architecture-patterns.html",width);const architectureEdges=await evaluate(testArchitectureFlowCapacity);check("Architecture adversarial topologies "+width,architectureEdges,architectureEdges.results.length===10&&architectureEdges.results.every(x=>x.rows===x.expectedRows&&x.flowTotal===x.expectedRows&&x.evidenceCount===x.expectedRows&&x.labelsSeparated&&x.endpointsComplete&&x.portSpacing&&x.noPageOverflow&&x.idempotent&&x.destroyed&&x.resizeObserved&&(x.mode==="list"?x.detectedCrossings>0&&x.allPathsHidden&&x.noteVisible&&x.crossingCount===0:x.mode==="graph"&&x.detectedCrossings===0&&x.visiblePaths===x.expectedRows&&x.crossingCount===0&&x.anchored&&x.anchoredAfterResize&&x.noCardCrossings))&&architectureEdges.autoDestroyed);evidence.push({name:"architecture-adversarial-topologies",width,...architectureEdges});}
  console.log(JSON.stringify({result:"PASS",evidence}));
}finally{try{socket?.close()}catch{}browser.kill();await sleep(100);fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:120})}
