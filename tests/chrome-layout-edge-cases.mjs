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
    const selfCallLabels=[...diagram.querySelectorAll(".semantic-edge-chip")].filter(ch=>ch.dataset.source===ch.dataset.target).map(ch=>{const box=ch.getBBox(),full=ch.querySelector("title")?.textContent??"",shown=ch.querySelector("text")?.textContent??"";return{full,shown,truncated:ch.dataset.truncated,layout:ch.dataset.layoutOk,inside:box.x>=0&&box.y>=0&&box.x+box.width<=diagram.viewBox.baseVal.width&&box.y+box.height<=diagram.viewBox.baseVal.height};});
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
 for(const count of [1,3,4,8,12]){
  const wrapper=document.createElement('div');wrapper.style.width='1000px';wrapper.style.maxWidth='none';
  const host=document.createElement('div');host.dataset.architectureView='';
  const groups=[{id:'a',name:'入口层',items:['API']},{id:'b',name:'业务层',items:['Service']},{id:'c',name:'数据层',items:['DB']},{id:'d',name:'基础层',items:['MQ']}];
  const flows=Array.from({length:count},(_,i)=>({from:['a','b','c','d'][i%4],to:['b','c','d','a'][i%4],label:'关系 '+(i+1)+'：跨模块调用与数据协作',basis:'design',evidence:'docs/architecture/source.md'}));
  const model={type:'系统架构',title:'关系轨道 '+count,layout:'stack',groups,flows},source=document.createElement('script');source.type='application/json';source.textContent=JSON.stringify(model);host.append(source);wrapper.append(host);document.querySelector('main').append(wrapper);
  const first=window.GenUIArchitecture.init(host),second=window.GenUIArchitecture.init(host);await new Promise(resolve=>setTimeout(resolve,240));
  const scene=host.querySelector('.architecture-scene'),layers=host.querySelector('.architecture-layers'),stage=host.querySelector('.architecture-stage'),rows=[...host.querySelectorAll('.architecture-flow-row')],labels=[...host.querySelectorAll('.architecture-wire-label')],cards=[...layers.querySelectorAll(':scope > .architecture-group')],cardFor=ref=>cards.find((card,i)=>groups[i].id===ref||groups[i].name===ref);
  const point=(path,frac)=>path.getPointAtLength(path.getTotalLength()*frac).matrixTransform(path.getScreenCTM());
  const anchored=()=>rows.every(row=>{const path=row.querySelector('.architecture-wire'),side=path.dataset.routeSide,a=cardFor(row.dataset.from).getBoundingClientRect(),b=cardFor(row.dataset.to).getBoundingClientRect(),p=point(path,0),q=point(path,1),sx=side==='left'?a.left:a.right,ex=side==='left'?b.left:b.right;return Math.abs(p.x-sx)<12&&p.y>a.top+4&&p.y<a.bottom-4&&Math.abs(q.x-ex)<24&&q.y>b.top+4&&q.y<b.bottom-4;});
  const railClear=rows.every(row=>{const path=row.querySelector('.architecture-wire'),label=labels.find(x=>x.dataset.from===row.dataset.from&&x.dataset.to===row.dataset.to),rect=scene.getBoundingClientRect(),scale=rect.width/scene.offsetWidth,railX=rect.left+Number(path.dataset.railX)*scale,box=label.getBoundingClientRect();return path.dataset.routeSide==='left'?railX>box.right+5:railX<box.left-5;});
  const labelsSeparated=['left','right'].every(side=>{const sideLabels=labels.filter(label=>label.dataset.routeSide===side).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);return sideLabels.every((label,i)=>i===0||sideLabels[i-1].getBoundingClientRect().bottom<=label.getBoundingClientRect().top+1);});
  const labelsConnected=rows.every(row=>{const path=row.querySelector('.architecture-wire'),dot=row.querySelector('.architecture-wire-dot'),label=labels.find(x=>x.dataset.from===row.dataset.from&&x.dataset.to===row.dataset.to),endpoints=label?.querySelector('.architecture-wire-endpoints'),mid=(Number(path.dataset.startY)+Number(path.dataset.endY))/2,from=groups.find(g=>g.id===row.dataset.from)?.name,to=groups.find(g=>g.id===row.dataset.to)?.name;return !!label&&label.dataset.routeSide===path.dataset.routeSide&&Number(label.dataset.flowCount)===Number(row.dataset.flowCount)&&endpoints?.textContent===from+' → '+to&&path.hasAttribute('marker-end')&&Math.abs(Number(dot.getAttribute('cx'))-Number(path.dataset.railX))<.1&&Math.abs(Number(dot.getAttribute('cy'))-mid)<.1;});
  const flowTotal=rows.reduce((sum,row)=>sum+Number(row.dataset.flowCount),0),expectedBundles=Math.min(count,4),idempotent=first===second&&host.querySelectorAll('.architecture-view').length===1;
  const segments=path=>{const tokens=path.getAttribute('d').match(/[MHV]|-?\d+(?:\.\d+)?/g)||[];let x=0,y=0,out=[];for(let i=0;i<tokens.length;){const cmd=tokens[i++];if(cmd==='M'){x=Number(tokens[i++]);y=Number(tokens[i++]);}else if(cmd==='H'){const nx=Number(tokens[i++]);out.push({x1:x,y1:y,x2:nx,y2:y});x=nx;}else if(cmd==='V'){const ny=Number(tokens[i++]);out.push({x1:x,y1:y,x2:x,y2:ny});y=ny;}}return out;};
  const endpoint=(seg,x,y)=>Math.abs(seg.x1-x)<.1&&Math.abs(seg.y1-y)<.1||Math.abs(seg.x2-x)<.1&&Math.abs(seg.y2-y)<.1;
  let crossingCount=0;for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const pi=rows[i].querySelector(".architecture-wire"),pj=rows[j].querySelector(".architecture-wire");if(pi.dataset.routeSide!==pj.dataset.routeSide)continue;for(const x of segments(pi))for(const y of segments(pj)){let ix,iy,intersects=false;if(Math.abs(x.y1-x.y2)<.1&&Math.abs(y.x1-y.x2)<.1){ix=y.x1;iy=x.y1;intersects=ix>=Math.min(x.x1,x.x2)-.1&&ix<=Math.max(x.x1,x.x2)+.1&&iy>=Math.min(y.y1,y.y2)-.1&&iy<=Math.max(y.y1,y.y2)+.1;}else if(Math.abs(y.y1-y.y2)<.1&&Math.abs(x.x1-x.x2)<.1){ix=x.x1;iy=y.y1;intersects=ix>=Math.min(y.x1,y.x2)-.1&&ix<=Math.max(y.x1,y.x2)+.1&&iy>=Math.min(x.y1,x.y2)-.1&&iy<=Math.max(x.y1,x.y2)+.1;}if(intersects&&!(endpoint(x,ix,iy)&&endpoint(y,ix,iy)))crossingCount++;}}
  const beforeWidth=scene.style.width,beforeStage=stage.clientWidth;wrapper.style.width='650px';await new Promise(resolve=>setTimeout(resolve,280));const afterWidth=scene.style.width,resizeObserved=beforeWidth!==afterWidth&&stage.clientWidth<beforeStage,anchoredAfterResize=anchored();
  const result={count,rows:rows.length,expectedBundles,flowTotal,anchored:anchored(),anchoredAfterResize,railClear,labelsSeparated,labelsConnected,crossingCount,idempotent,resizeObserved,sceneWidthBefore:beforeWidth,sceneWidthAfter:afterWidth,stageWidthBefore:beforeStage,stageWidthAfter:stage.clientWidth};
  window.GenUIArchitecture.destroy(host);result.destroyed=!host.querySelector('.architecture-view')&&host.dataset.genUiArchitectureReady!=='true';results.push(result);wrapper.remove();
 }
 const host=document.createElement('div');host.dataset.architectureView='';const source=document.createElement('script');source.type='application/json';source.textContent=JSON.stringify({type:'系统架构',title:'自动销毁',layout:'stack',groups:[{name:'A',items:['a']}]});host.append(source);document.querySelector('main').append(host);window.GenUIArchitecture.init(host);host.remove();await new Promise(resolve=>setTimeout(resolve,100));const autoDestroyed=!host.querySelector('.architecture-view')&&host.dataset.genUiArchitectureReady!=='true';
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
 await navigate("demo/custom-diagram-model.html",1440);
 const seq=await evaluate(testSequence,model);
 check("Cross-node and reverse sequence spans",seq,seq.valid&&seq.width>960&&seq.spans.length===2&&seq.spans.every(x=>x.distance>550&&x.arrow)&&seq.spans.some(x=>x.reverse)&&seq.labels.length===2&&seq.labels.every(x=>x.layout==="true"||x.layout==="fallback")&&seq.selfCalls.length===6&&seq.selfCalls.every(x=>x.length>40&&x.d.includes("H")&&x.d.includes("V"))&&seq.selfCalls.some(x=>x.stroke==="#3a83f7")&&seq.selfCalls.some(x=>x.dashed)&&seq.selfCallLabels.length===6&&seq.selfCallLabels.every(x=>x.full===x.shown&&x.truncated==="false"&&x.layout==="true"&&x.inside)&&!seq.pageOverflow);
 evidence.push({name:"sequence",...seq});
 for(const width of [1440,375]){
  await navigate("demo/architecture-patterns.html",width);
  const arch=await evaluate(testArchitecture);
  check("Unified architecture zoom, anchoring, fullscreen "+width,arch,arch.views===8&&arch.flowCount===24&&arch.evidenceCount===24&&arch.routeSides.left>0&&arch.routeSides.right>0&&arch.connected&&arch.reAnchored&&arch.fullConnected&&arch.fullscreen&&arch.exited&&arch.fit==="100%"&&arch.cardRatio>1.14&&arch.wireRatio>1.14&&!arch.overflow&&(width!==375||arch.scroll));
  evidence.push({name:"architecture",width,...arch});
 }
 const architectureEdges=await evaluate(testArchitectureFlowCapacity);check("Architecture relationship capacities and lifecycle",architectureEdges,architectureEdges.results.length===5&&architectureEdges.results.every(x=>x.rows===x.expectedBundles&&x.flowTotal===x.count&&x.anchored&&x.anchoredAfterResize&&x.railClear&&x.labelsSeparated&&x.labelsConnected&&x.crossingCount===0&&x.idempotent&&x.destroyed&&x.resizeObserved)&&architectureEdges.autoDestroyed);evidence.push({name:"architecture-flow-capacity",...architectureEdges});
  console.log(JSON.stringify({result:"PASS",evidence}));
}finally{try{socket?.close()}catch{}browser.kill();await sleep(100);fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:120})}
