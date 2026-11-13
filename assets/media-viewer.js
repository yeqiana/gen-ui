/* GEN-UI trusted offline diagram and image viewers. Initialized at most once per element. */
"use strict";
(() => {
 const diagramInstances=new WeakMap(),activeDiagrams=new Map();let diagramObserver=null,imageViewer=null,imageObserver=null;
function observeDiagrams(){if(diagramObserver||typeof MutationObserver==="undefined"||!document.documentElement)return;diagramObserver=new MutationObserver(()=>{for(const [panel,instance] of activeDiagrams)if(!panel.isConnected)instance.destroy();});diagramObserver.observe(document.documentElement,{childList:true,subtree:true});}
 const ICON={
  plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6M11 8v6"/></svg>',
  minus:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/></svg>',
  fit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/></svg>',
  expand:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M3 3l7 7M16 3h5v5m0-5-7 7M21 16v5h-5m5 0-7-7M8 21H3v-5m0 5 7-7"/></svg>',
  collapse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8H3m5 0V3m8 5h5m-5 0V3m0 13h5m-5 0v5M8 16H3m5 0v5"/></svg>',
  close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
 };
 function setIcon(button,name,label){
  if(!button)return;button.innerHTML=ICON[name];button.title=label;button.setAttribute("aria-label",label);
 }
 function initDiagram(panel){
  const existing=diagramInstances.get(panel);if(existing)return existing;if(!panel||typeof panel.querySelector!=="function")return null;
  const stage=panel.querySelector(".flow-canvas,.diagram-viewport");
  const svg=stage?.querySelector("svg[viewBox]");
  if(!stage||!svg)return;

  const labelLang=document.documentElement.lang?.startsWith("en")?"en":"zh";
  const word=labelLang==="en"?{plus:"Zoom in",minus:"Zoom out",fit:"Fit diagram",expand:"Enter fullscreen",collapse:"Exit fullscreen"}:{plus:"放大图表",minus:"缩小图表",fit:"适应窗口",expand:"全屏查看图表",collapse:"退出全屏"};
  const button=(name)=>panel.querySelector(name==="plus"?"#flow-zoom-in,[data-zoom-in]":name==="minus"?"#flow-zoom-out,[data-zoom-out]":name==="fit"?"#flow-fit,[data-fit]":"#flow-fullscreen,[data-fullscreen]");
  const percent=panel.querySelector("#flow-zoom-label,[data-zoom-label]");
  const original=svg.getAttribute("viewBox").trim().split(/[,\s]+/).map(Number);
  if(original.length!==4||!original.every(Number.isFinite))return;
  const base={x:original[0],y:original[1],w:original[2],h:original[3]};
  const cleanups=[];const listen=(target,type,handler,options)=>{if(!target)return;target.addEventListener(type,handler,options);cleanups.push(()=>target.removeEventListener(type,handler,options));};
  let destroyed=false;panel.dataset.genUiDiagramReady="true";
  let view={...base},fallback=false,transition=false,drag=null;
  const isFullscreen=()=>document.fullscreenElement===panel||fallback;
  const apply=()=>{svg.setAttribute("viewBox",[view.x,view.y,view.w,view.h].join(" "));if(percent)percent.textContent=Math.round(base.w/view.w*100)+"%";};
  function zoom(factor){
   const old=view.w,w=Math.max(base.w/3,Math.min(base.w*2,old*factor)),h=w*base.h/base.w;
   if(Math.abs(w-old)<1e-6)return;
   view={x:view.x+(view.w-w)/2,y:view.y+(view.h-h)/2,w,h};apply();
  }
  function fit(){view={...base};stage.scrollLeft=0;stage.scrollTop=0;apply();}
 function refreshBase(){
  const next=svg.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  if(!next||next.length!==4||!next.every(Number.isFinite)||next[2]<=0||next[3]<=0)return false;
  const oldWidth=base.w,ratio=view.w/Math.max(1,base.w);
  base.x=next[0];base.y=next[1];base.w=next[2];base.h=next[3];
  const width=base.w*ratio,height=width*base.h/base.w;
  view={x:base.x+(base.w-width)/2,y:base.y+(base.h-height)/2,w:width,h:height};
  apply();return Math.abs(oldWidth-base.w)>0.01;
 }
  function sync(){
   if(document.fullscreenElement===panel)fallback=false;
   else if(document.fullscreenElement)fallback=false;
   const active=isFullscreen();
   panel.classList.toggle("is-fullscreen",fallback);
   const b=button("expand");if(b){setIcon(b,active?"collapse":"expand",word[active?"collapse":"expand"]);b.setAttribute("aria-pressed",String(active));}
  }
  async function fullscreen(){
   if(transition)return false;
   transition=true;
   const active=isFullscreen();
   try{
    if(active){
     if(document.fullscreenElement===panel&&typeof document.exitFullscreen==="function")await document.exitFullscreen();
     fallback=false;
    }else if(!document.fullscreenElement&&typeof panel.requestFullscreen==="function"){
     try{await panel.requestFullscreen();}catch{fallback=true;}
    }else if(!document.fullscreenElement)fallback=true;
   }finally{transition=false;sync();}
   return isFullscreen();
  }
  for(const [kind,factor]of [["plus",0.8],["minus",1.25]]){const b=button(kind);setIcon(b,kind,word[kind]);listen(b,"click",()=>zoom(factor));}
  const fitButton=button("fit");setIcon(fitButton,"fit",word.fit);listen(fitButton,"click",fit);
  const fullButton=button("expand");listen(fullButton,"click",fullscreen);
  listen(document,"fullscreenchange",sync);
  listen(document,"fullscreenerror",sync);
  listen(document,"keydown",e=>{if(e.key==="Escape"&&fallback){e.preventDefault();fallback=false;sync();}});
  function coord(event){
   const rect=svg.getBoundingClientRect();
   return {x:(event.clientX-rect.left)*view.w/Math.max(1,rect.width)+view.x,y:(event.clientY-rect.top)*view.h/Math.max(1,rect.height)+view.y};
  }
  const nodes=[...svg.querySelectorAll("[data-graph-node]")];
  const edges=[...svg.querySelectorAll("[data-edge-from][data-edge-to]")];
  const getNode=id=>nodes.find(n=>n.dataset.nodeId===id);
  const nodeRect=n=>({x:Number(n.dataset.x)||0,y:Number(n.dataset.y)||0,w:Number(n.dataset.width)||130,h:Number(n.dataset.height)||54});
  function reposition(n,x,y){
   n.dataset.x=x;n.dataset.y=y;n.setAttribute("transform","translate("+x+" "+y+")");
   edges.forEach(edge=>{
    const from=getNode(edge.dataset.edgeFrom),to=getNode(edge.dataset.edgeTo);
    if(!from||!to)return;
    const a=nodeRect(from),b=nodeRect(to);
    edge.setAttribute("x1",a.x+a.w/2);edge.setAttribute("y1",a.y+a.h/2);
    edge.setAttribute("x2",b.x+b.w/2);edge.setAttribute("y2",b.y+b.h/2);
   });
  }
  nodes.forEach(n=>{
   if(n.dataset.armed===undefined)n.dataset.armed="false";
   n.setAttribute("tabindex","0");n.setAttribute("role","button");
   n.setAttribute("aria-label",((n.querySelector("text")?.textContent)||"Node")+" — "+(labelLang==="en"?"double-click to move":"双击后拖动"));
   const toggle=()=>{const on=n.dataset.armed!=="true";nodes.forEach(other=>other.dataset.armed="false");n.dataset.armed=String(on);};
   listen(n,"dblclick",e=>{e.stopPropagation();toggle();});
   listen(n,"keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();toggle();return;}
    if(n.dataset.armed!=="true")return;
    const directions={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]};
    const move=directions[e.key];if(!move)return;e.preventDefault();e.stopPropagation();
    const r=nodeRect(n),nx=Math.min(base.x+base.w-r.w,Math.max(base.x,r.x+move[0])),ny=Math.min(base.y+base.h-r.h,Math.max(base.y,r.y+move[1]));
    if(nodes.some(other=>{if(other===n)return false;const o=nodeRect(other),m=6;return nx<o.x+o.w+m&&nx+r.w+m>o.x&&ny<o.y+o.h+m&&ny+r.h+m>o.y;}))return;
    reposition(n,nx,ny);
   });
  });
  listen(stage,"pointerdown",e=>{
   if(e.button!==0||drag)return;
   const n=e.target.closest?.("[data-graph-node]");
   if(n&&n.dataset.armed==="true"){
    const r=nodeRect(n);drag={type:"node",id:e.pointerId,clientX:e.clientX,clientY:e.clientY,n,originX:r.x,originY:r.y,viewW:view.w,viewH:view.h};
   }else drag={type:"pan",id:e.pointerId,clientX:e.clientX,clientY:e.clientY,originX:view.x,originY:view.y};
   stage.setPointerCapture?.(e.pointerId);stage.classList.add("is-dragging");
  });
  listen(stage,"pointermove",e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const rect=svg.getBoundingClientRect();
   const deltaX=(e.clientX-drag.clientX)*view.w/Math.max(1,rect.width),
         deltaY=(e.clientY-drag.clientY)*view.h/Math.max(1,rect.height);
   if(drag.type==="node"){
    const n=drag.n,r=nodeRect(n);
    const nextX=Math.min(base.x+base.w-r.w,Math.max(base.x,drag.originX+deltaX));
    const nextY=Math.min(base.y+base.h-r.h,Math.max(base.y,drag.originY+deltaY));
    const overlaps=nodes.some(other=>{if(other===n)return false;const o=nodeRect(other),m=6;return nextX<o.x+o.w+m&&nextX+r.w+m>o.x&&nextY<o.y+o.h+m&&nextY+r.h+m>o.y;});
    if(!overlaps)reposition(n,nextX,nextY);
   }else{view.x=drag.originX-deltaX;view.y=drag.originY-deltaY;apply();}
  });
  const release=e=>{if(!drag||e?.pointerId!==undefined&&e.pointerId!==drag.id)return;drag=null;stage.classList.remove("is-dragging");};
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>listen(stage,t,release));
  listen(stage,"keydown",e=>{
   if(e.target.closest?.("[data-graph-node]"))return;
   if(e.key==="+"||e.key==="=")zoom(.8);
   else if(e.key==="-")zoom(1.25);
   else if(e.key==="0")fit();
   else if(e.key==="ArrowLeft")view.x-=view.w/14;
   else if(e.key==="ArrowRight")view.x+=view.w/14;
   else if(e.key==="ArrowUp")view.y-=view.h/14;
   else if(e.key==="ArrowDown")view.y+=view.h/14;
   else return;e.preventDefault();apply();
  });
  listen(stage,"wheel",e=>{if(!e.ctrlKey&&!isFullscreen())return;e.preventDefault();zoom(e.deltaY<0?.88:1.14);},{passive:false});
  sync();apply();
  const controller={zoom,fit,fullscreen,refreshBase,getView:()=>({...view}),isFullscreen,destroy(){if(destroyed)return;destroyed=true;cleanups.splice(0).forEach(fn=>fn());if(document.fullscreenElement===panel&&typeof document.exitFullscreen==="function")document.exitFullscreen().catch(()=>{});panel.classList.remove("is-fullscreen");stage.classList.remove("is-dragging");svg.setAttribute("viewBox",[base.x,base.y,base.w,base.h].join(" "));delete panel.dataset.genUiDiagramReady;diagramInstances.delete(panel);activeDiagrams.delete(panel);if(window.GenUIFlow===controller)delete window.GenUIFlow;if(!activeDiagrams.size&&diagramObserver){diagramObserver.disconnect();diagramObserver=null;}}};
  diagramInstances.set(panel,controller);if(panel.isConnected){activeDiagrams.set(panel,controller);observeDiagrams();}
  if(panel.id==="flow-panel")window.GenUIFlow=controller;
  return controller;
 }
   function destroyDiagram(panel){diagramInstances.get(panel)?.destroy();}
function destroyAllDiagrams(){for(const [panel,instance] of [...activeDiagrams])instance.destroy();}
function detachImageAttachment(attachment){
   const {pic,frame,trigger,onClick,onDoubleClick,onImageClick,createdFrame}=attachment;
   trigger.removeEventListener("click",onClick);pic.removeEventListener("dblclick",onDoubleClick);pic.removeEventListener("click",onImageClick);trigger.remove();
   delete pic.dataset.genUiImageReady;
   if(createdFrame&&frame.parentNode){if(pic.parentNode===frame)frame.parentNode.insertBefore(pic,frame);frame.remove();}
  }
  function observeImageAttachments(){
   if(imageObserver||typeof MutationObserver==="undefined"||!document.documentElement)return;
   imageObserver=new MutationObserver(records=>{
    if(!imageViewer)return;
    for(const attachment of [...imageViewer.attachments])if(!attachment.pic.isConnected){detachImageAttachment(attachment);imageViewer.attachments.splice(imageViewer.attachments.indexOf(attachment),1);}
    // Dynamically inserted content images use the same in-page modal.
    for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&!node.closest?.(".genui-image-overlay"))initImages(node);
   });
   imageObserver.observe(document.documentElement,{childList:true,subtree:true});
  }
  function initImages(root=document){
   const selector='img[data-zoomable],main img:not([data-no-preview])';
   const eligible=pic=>pic.matches(selector)&&!pic.closest('nav,button,.brand,.section-title,.page-footer,.eyebrow,[role="toolbar"]')&&!/\/icons\//.test(pic.getAttribute('src')||'');
   const pics=[];
   if(root?.matches?.(selector)&&eligible(root))pics.push(root);
   if(root?.querySelectorAll)pics.push(...[...root.querySelectorAll(selector)].filter(eligible));
   const hasImageLinks=!!root?.querySelectorAll&&[...root.querySelectorAll("a[href]")].some(a=>!a.hasAttribute("download")&&/\.(?:png|jpe?g|gif|webp|svg|avif)(?:[?#].*)?$/i.test(a.getAttribute("href")||""));
   if(!pics.length&&!hasImageLinks)return imageViewer;
   if(!imageViewer){
    if(!document.body)return null;
    const dialog=document.createElement("div");dialog.className="genui-image-overlay";dialog.hidden=true;
    dialog.innerHTML='<div class="genui-image-toolbar" role="toolbar" aria-label="图片查看工具"><button data-image-minus type="button"></button><span data-image-percent>100%</span><button data-image-plus type="button"></button><button data-image-fit type="button"></button><button data-image-fullscreen type="button"></button><button data-image-close type="button"></button></div><div class="genui-image-stage" tabindex="0"><img alt=""></div>';
    dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");dialog.setAttribute("aria-label","图片查看");document.body.appendChild(dialog);
    const stage=dialog.querySelector(".genui-image-stage"),image=stage.querySelector("img"),out=dialog.querySelector("[data-image-percent]");
    const lang=document.documentElement.lang?.startsWith("en")?"en":"zh";
    const labels=lang==="en"?{plus:"Zoom in",minus:"Zoom out",fit:"Fit image",fullscreen:"Enter fullscreen",exit:"Exit fullscreen",close:"Close viewer"}:{plus:"放大图片",minus:"缩小图片",fit:"适应窗口",fullscreen:"进入全屏",exit:"退出全屏",close:"关闭图片"};
    for(const k of ["plus","minus","fit","close"])setIcon(dialog.querySelector("[data-image-"+k+"]"),k==="close"?"close":k,labels[k]);
    const fullscreenButton=dialog.querySelector("[data-image-fullscreen]");
    const syncFullscreen=()=>{const active=document.fullscreenElement===dialog||dialog.classList.contains("is-fullscreen");setIcon(fullscreenButton,active?"collapse":"expand",labels[active?"exit":"fullscreen"]);fullscreenButton.setAttribute("aria-pressed",String(active));};
    const switchFullscreen=async()=>{if(document.fullscreenElement===dialog){try{await document.exitFullscreen();}catch{dialog.classList.remove("is-fullscreen");}}
      else if(dialog.classList.contains("is-fullscreen"))dialog.classList.remove("is-fullscreen");
      else if(!document.fullscreenElement&&typeof dialog.requestFullscreen==="function"){try{await dialog.requestFullscreen();}catch{dialog.classList.add("is-fullscreen");}}
      else dialog.classList.add("is-fullscreen");
      syncFullscreen();};
    fullscreenButton.addEventListener("click",switchFullscreen);
    document.addEventListener("fullscreenchange",syncFullscreen);
    syncFullscreen();
    let scale=1,x=0,y=0,drag=null,originFocus=null;
    const paint=()=>{image.style.transform="translate("+x+"px,"+y+"px) scale("+scale+")";out.textContent=Math.round(scale*100)+"%";};
    const fit=()=>{scale=1;x=0;y=0;paint();};
    function close(){if(dialog.hidden)return;if(document.fullscreenElement===dialog)document.exitFullscreen?.().catch(()=>{});dialog.classList.remove("is-fullscreen");dialog.hidden=true;dialog.classList.remove("is-open");document.body.classList.remove("genui-image-viewer-open");image.removeAttribute("src");syncFullscreen();originFocus?.focus();originFocus=null;drag=null;}
    function open(src,alt,focus){if(!dialog.hidden)return;originFocus=focus;image.src=src;image.alt=alt;image.loading="eager";dialog.hidden=false;dialog.classList.add("is-open");document.body.classList.add("genui-image-viewer-open");fit();stage.focus();}
    const change=delta=>{scale=Math.max(.25,Math.min(4,Math.round((scale+delta)*100)/100));paint();};
    dialog.querySelector("[data-image-plus]").addEventListener("click",()=>change(.25));
    dialog.querySelector("[data-image-minus]").addEventListener("click",()=>change(-.25));
    dialog.querySelector("[data-image-fit]").addEventListener("click",fit);
    dialog.querySelector("[data-image-close]").addEventListener("click",close);
    dialog.addEventListener("pointerdown",e=>{if(e.target===dialog)close();});
    stage.addEventListener("pointerdown",e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:x,oy:y};stage.setPointerCapture?.(e.pointerId);});
    stage.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;x=drag.ox+e.clientX-drag.x;y=drag.oy+e.clientY-drag.y;paint();});
    ["pointerup","pointercancel","lostpointercapture"].forEach(k=>stage.addEventListener(k,()=>{drag=null;}));
    stage.addEventListener("wheel",e=>{e.preventDefault();change(e.deltaY<0?.2:-.2);},{passive:false});
    stage.addEventListener("dblclick",e=>{e.preventDefault();if(scale>1)fit();else change(.5);});
    const keydown=e=>{if(dialog.hidden)return;if(e.key==="Escape"){e.preventDefault();if(dialog.classList.contains("is-fullscreen")){dialog.classList.remove("is-fullscreen");syncFullscreen();}else if(document.fullscreenElement!==dialog)close();}else if(e.key==="+"||e.key==="="){e.preventDefault();change(.25);}else if(e.key==="-"){e.preventDefault();change(-.25);}else if(e.key==="0"){e.preventDefault();fit();}else if(e.key==="Tab"){const buttons=[...dialog.querySelectorAll("button")],idx=buttons.indexOf(document.activeElement),next=e.shiftKey?(idx<=0?buttons.length-1:idx-1):(idx>=buttons.length-1?0:idx+1);e.preventDefault();buttons[next].focus();}};
    document.addEventListener("keydown",keydown);
    // Image URLs remain in the same page: opening an image never navigates to its bare address.
    const onImageLinkClick=e=>{const a=e.target.closest?.("a[href]");if(!a||a.hasAttribute("download")||a.closest("nav,.sidebar,.doc-toc")||!/(?:(?:png|jpe?g|gif|webp|svg|avif))(?:[?#].*)?$/i.test(a.getAttribute("href")||""))return;
      e.preventDefault();e.stopPropagation();open(a.href,a.querySelector("img")?.alt||a.textContent.trim()||"图片",a);};
    document.addEventListener("click",onImageLinkClick);
    imageViewer={dialog,attachments:[],close,keydown,open,onImageLinkClick,syncFullscreen};
   }
   for(const pic of pics){
    if(pic.dataset.genUiImageReady==="true")continue;
    const trigger=document.createElement("button");trigger.className="genui-image-open";trigger.type="button";
    const existingFrame=pic.closest(".genui-image-frame"),createdFrame=!existingFrame;
    const frame=existingFrame||(()=>{const n=document.createElement("span");n.className="genui-image-frame";pic.parentNode.insertBefore(n,pic);n.appendChild(pic);return n;})();
    setIcon(trigger,"expand",document.documentElement.lang?.startsWith("en")?"View image on this page":"在当前页面查看大图");
    trigger.setAttribute("aria-haspopup","dialog");trigger.dataset.imageOpen="true";frame.appendChild(trigger);
    const onClick=e=>{e?.preventDefault?.();e?.stopPropagation?.();imageViewer?.open(pic.currentSrc||pic.src,pic.alt,trigger);};
    const onDoubleClick=e=>{e.preventDefault();e.stopPropagation();onClick(e);};
    const onImageClick=e=>{onClick(e);};
    trigger.addEventListener("click",onClick);pic.addEventListener("click",onImageClick);pic.addEventListener("dblclick",onDoubleClick);pic.dataset.genUiImageReady="true";
    imageViewer.attachments.push({pic,frame,trigger,onClick,onDoubleClick,onImageClick,createdFrame});
   }
   observeImageAttachments();return imageViewer;
  }
  function destroyImages(){
   if(!imageViewer)return;
   const viewer=imageViewer;viewer.close();viewer.attachments.slice().forEach(detachImageAttachment);
   viewer.attachments.length=0;viewer.dialog.remove();document.removeEventListener("keydown",viewer.keydown);
   document.body?.classList.remove("genui-image-viewer-open");document.removeEventListener("click",viewer.onImageLinkClick);imageViewer=null;
   if(imageObserver){imageObserver.disconnect();imageObserver=null;}
  }
function destroyAll(){destroyAllDiagrams();destroyImages();}
window.GenUIMedia={initDiagram,initImages,destroyDiagram,destroyAll,destroyAllDiagrams,destroyImages,icons:ICON};
 function start(){document.querySelectorAll("[data-diagram],#flow-panel").forEach(initDiagram);initImages();}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
