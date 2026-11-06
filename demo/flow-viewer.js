/* 内嵌 SVG 流程视图：无网络依赖。 */
(function(){
 "use strict";
 const panel=document.getElementById("flow-panel"),canvas=document.getElementById("flow-canvas"),
  svg=document.getElementById("flow-svg");
 if(!panel||!canvas||!svg)return;
 const initial={x:0,y:0,w:620,h:150};
 let view={...initial},pointer=null;
 const btn=id=>document.getElementById(id);
 const setView=()=>svg.setAttribute("viewBox",[view.x,view.y,view.w,view.h].join(" "));
 function zoom(factor){
  const w=Math.max(150,Math.min(1520,view.w*factor)),h=w*initial.h/initial.w;
  view={x:view.x+(view.w-w)/2,y:view.y+(view.h-h)/2,w,h};setView();
  btn("flow-zoom-label").textContent=Math.round(initial.w/view.w*100)+"%";
 }
 function fit(){view={...initial};setView();btn("flow-zoom-label").textContent="100%";}
 btn("flow-zoom-in").addEventListener("click",()=>zoom(0.8));
 btn("flow-zoom-out").addEventListener("click",()=>zoom(1.25));
 btn("flow-fit").addEventListener("click",fit);
 canvas.addEventListener("wheel",event=>{
  if(!event.ctrlKey&&!panel.classList.contains("is-fullscreen"))return;
  event.preventDefault();zoom(event.deltaY<0?0.88:1.14);
 },{passive:false});
 canvas.addEventListener("pointerdown",event=>{
  if(event.button!==0)return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,originX:view.x,originY:view.y};
  if(canvas.setPointerCapture)canvas.setPointerCapture(event.pointerId);canvas.classList.add("is-dragging");
 });
 canvas.addEventListener("pointermove",event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const box=svg.getBoundingClientRect();
  if(!box.width||!box.height)return;
  const factor=Math.max(view.w/box.width,view.h/box.height);
  view.x=pointer.originX-(event.clientX-pointer.x)*factor;
  view.y=pointer.originY-(event.clientY-pointer.y)*factor;setView();
 });
 const release=()=>{pointer=null;canvas.classList.remove("is-dragging");};
 canvas.addEventListener("pointerup",release);canvas.addEventListener("pointercancel",release);
 canvas.addEventListener("lostpointercapture",release);
 canvas.addEventListener("keydown",event=>{
  if(event.key==="+"||event.key==="="){event.preventDefault();zoom(.8);}
  if(event.key==="-"){event.preventDefault();zoom(1.25);}
  if(event.key==="0"){event.preventDefault();fit();}
  const step=view.w/14;
  if(event.key==="ArrowLeft")view.x-=step;
  else if(event.key==="ArrowRight")view.x+=step;
  else if(event.key==="ArrowUp")view.y-=step;
  else if(event.key==="ArrowDown")view.y+=step*initial.h/initial.w;
  else return;
  event.preventDefault();setView();
 });
 const fullscreen=btn("flow-fullscreen");
 async function leave(){
  if(document.fullscreenElement===panel&&document.exitFullscreen)await document.exitFullscreen();
  panel.classList.remove("is-fullscreen");fullscreen.setAttribute("aria-pressed","false");
  fullscreen.setAttribute("aria-label","全屏查看流程图");fullscreen.textContent="全屏";
 }
 fullscreen.addEventListener("click",async()=>{
  if(document.fullscreenElement===panel||panel.classList.contains("is-fullscreen")){await leave();return;}
  try{
   if(panel.requestFullscreen)await panel.requestFullscreen();
   else panel.classList.add("is-fullscreen");
  }catch{panel.classList.add("is-fullscreen");}
  fullscreen.setAttribute("aria-pressed","true");fullscreen.setAttribute("aria-label","退出全屏流程图");fullscreen.textContent="退出全屏";
 });
 document.addEventListener("fullscreenchange",()=>{
  const active=document.fullscreenElement===panel;
  panel.classList.toggle("is-fullscreen",active);
  fullscreen.setAttribute("aria-pressed",String(active));
  fullscreen.textContent=active?"退出全屏":"全屏";
 });
 document.addEventListener("keydown",event=>{
  if(event.key!=="Escape"||(!panel.classList.contains("is-fullscreen")&&document.fullscreenElement!==panel))return;
  leave();
 });
 window.GenUIFlow={zoom,fit,getView:()=>({...view})};
 fit();
})();
