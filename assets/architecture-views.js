/* GEN-UI architecture containers and node-anchored relationship overlay. */
"use strict";
(() => {
const TYPES=["业务架构","产品架构","系统架构","数据架构","技术架构","应用架构","功能架构","信息架构"];
const LAYOUTS=["stack","groups","columns"];
const ICONS={
 plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
 minus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
 fit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/></svg>',
 expand:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m0-5 7 7m6-7h5v5m0-5-7 7M3 16v5h5m-5 0 7-7m6 7h5m0 5-7-7"/></svg>',
 collapse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8H3m5 0V3m8 5h5m-5 0v5M8 16H3m5 0v5"/></svg>'
};
function validate(m){
 if(!m||typeof m!=="object"||Array.isArray(m)||Object.keys(m).some(k=>!["type","title","layout","groups","flows"].includes(k)))throw Error("invalid architecture");
 if(!TYPES.includes(m.type)||!LAYOUTS.includes(m.layout)||typeof m.title!=="string"||!m.title.trim()||m.title.length>100)throw Error("invalid metadata");
 if(!Array.isArray(m.groups)||m.groups.length<1||m.groups.length>16)throw Error("invalid groups");
 const checkGroup=(g,depth=1)=>{
  if(!g||Array.isArray(g)||typeof g!=="object"||Object.keys(g).some(k=>!["id","name","items","children"].includes(k))||typeof g.name!=="string"||!g.name.trim()||g.name.length>64)throw Error("invalid group");
  if(g.id!==undefined&&(typeof g.id!=="string"||!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(g.id)))throw Error("invalid group id");
  if(depth>3)throw Error("architecture nesting exceeds 3 levels");
  const items=g.items??[],children=g.children??[];
  if(!Array.isArray(items)||items.length>24||items.some(x=>typeof x!=="string"||!x.trim()||x.length>100))throw Error("invalid items");
  if(!Array.isArray(children)||children.length>16||(!items.length&&!children.length))throw Error("invalid children");
  children.forEach(child=>checkGroup(child,depth+1));
 };
 m.groups.forEach(g=>checkGroup(g));
 const ids=m.groups.map(g=>g.id??g.name),names=m.groups.map(g=>g.name);
 if(new Set(ids).size!==ids.length||new Set(names).size!==names.length)throw Error("duplicate architecture group identity");
 if(m.flows!==undefined){
  const refs=new Set([...ids,...names]);
  if(!Array.isArray(m.flows)||m.flows.length>12||m.flows.some(f=>!f||Array.isArray(f)||typeof f!=="object"||Object.keys(f).some(k=>!["from","to","label","evidence","basis"].includes(k))
   ||typeof f.from!=="string"||typeof f.to!=="string"||!refs.has(f.from)||!refs.has(f.to)||f.from===f.to
   ||typeof f.label!=="string"||!f.label.trim()||f.label.length>100
   ||(f.evidence!==undefined&&(typeof f.evidence!=="string"||!f.evidence.trim()||f.evidence.length>220))
   ||(f.basis!==undefined&&!["implementation","design"].includes(f.basis))))throw Error("invalid architecture flows");
  // Ref IDs and display names must not cross-reference two different groups.
  const byRef=new Map();
  for(const group of m.groups)for(const key of [group.name,group.id].filter(Boolean)){
   if(byRef.has(key)&&byRef.get(key)!==group)throw Error("ambiguous group reference");
   byRef.set(key,group);
  }
  if(m.flows.some(f=>byRef.get(f.from)===byRef.get(f.to)))throw Error("self-referential architecture flow");
 }
 return m;
}
const el=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=content;return node;};
const svg=(tag)=>document.createElementNS("http://www.w3.org/2000/svg",tag);
let counter=0;
function init(host){
 if(host.dataset.genUiArchitectureReady==="true")return;
 const source=host.querySelector(':scope > script[type="application/json"]');if(!source)return;
 let model;try{model=validate(JSON.parse(source.textContent));}catch(error){host.dataset.architectureError=String(error.message);return;}
 host.dataset.genUiArchitectureReady="true";
 const frame=el("section","architecture-view"),head=el("header","architecture-head"),stage=el("div","architecture-stage");
 const scene=el("div","architecture-scene"+(model.flows?.length?" has-flows":""));
 const layers=el("div","architecture-layers architecture-"+model.layout);
 const groupElements=new Map();
 const renderGroup=(group)=>{
  const section=el("details","architecture-group");section.open=true;
  const summary=el("summary","architecture-group-title",group.name);section.append(summary);
  const items=el("div","architecture-items");
  (group.items||[]).forEach(item=>items.append(el("div","architecture-item",item)));
  (group.children||[]).forEach(child=>items.append(renderGroup(child)));
  section.append(items);return section;
 };
 model.groups.forEach(group=>{
  const node=renderGroup(group);layers.append(node);
  groupElements.set(group.name,node);if(group.id)groupElements.set(group.id,node);
 });
 scene.append(layers);stage.append(scene);
 head.append(el("strong","architecture-title",model.title),el("span","architecture-type",model.type));
 const actions=el("div","architecture-actions");
 const add=(icon,label,action)=>{
  const button=el("button","architecture-icon");button.type="button";button.title=label;button.setAttribute("aria-label",label);
  button.innerHTML=ICONS[icon];button.addEventListener("click",action);actions.append(button);return button;
 };
 const relationships=[];
 if(model.flows?.length){
  const overlay=svg("svg");overlay.setAttribute("class","architecture-wires");
  overlay.setAttribute("aria-hidden","true");
  const defs=svg("defs"),marker=svg("marker"),arrow=svg("path"),markerId="architecture-arrow-"+(++counter);
  marker.setAttribute("id",markerId);marker.setAttribute("viewBox","0 0 10 10");marker.setAttribute("markerWidth","7");marker.setAttribute("markerHeight","7");
  marker.setAttribute("refX","9");marker.setAttribute("refY","5");marker.setAttribute("orient","auto");
  arrow.setAttribute("d","M0 0 L9 5 L0 10 Z");arrow.setAttribute("fill","#4c719c");marker.append(arrow);defs.append(marker);overlay.append(defs);
  for(const [index,f] of model.flows.entries()){
   const g=svg("g"),path=svg("path"),callout=svg("path"),dot=svg("circle");
   g.classList.add("architecture-flow-row");g.dataset.from=f.from;g.dataset.to=f.to;
   path.classList.add("architecture-wire");path.setAttribute("marker-end","url(#"+markerId+")");
   callout.classList.add("architecture-wire-callout");dot.classList.add("architecture-wire-dot");dot.setAttribute("r","3");
   g.append(path,callout,dot);overlay.append(g);
   const label=el("div","architecture-wire-label");
   label.dataset.flowIndex=String(index);label.dataset.basis=f.basis??"design";
   label.append(el("span","architecture-wire-title",f.label));
   if(f.evidence){
    label.append(el("small","architecture-wire-evidence",(f.basis==="implementation"?"代码":"设计")+"依据："+f.evidence));
    label.title=f.evidence;
   }
   const displayName=ref=>model.groups.find(g=>g.id===ref||g.name===ref)?.name??ref;
   label.setAttribute("role","note");label.tabIndex=0;
   label.setAttribute("aria-label",displayName(f.from)+"，"+f.label+"，"+displayName(f.to)+(f.evidence?"；依据："+f.evidence:""));
   label.dataset.from=f.from;label.dataset.to=f.to;
   scene.append(label);relationships.push({f,path,callout,dot,label});
  }
  scene.append(overlay);
  const layout=()=>{
   const rect=scene.getBoundingClientRect(),scaleFactor=rect.width/Math.max(1,scene.offsetWidth),layerWidth=layers.offsetWidth;
   const groupRect=group=>{const r=groupElements.get(group).getBoundingClientRect();return{x:(r.right-rect.left)/scaleFactor,y:(r.top+r.height/2-rect.top)/scaleFactor};};
   let lower=0,maxBottom=layers.offsetHeight;
   for(const [index,r] of relationships.entries()){
    const a=groupRect(r.f.from),b=groupRect(r.f.to);
    const railX=Math.round(layerWidth+15+index*17);
    const labelY=Math.max((a.y+b.y)/2,lower+8);
    const labelX=Math.round(layerWidth+50),labelWidth=Math.max(205,scene.offsetWidth-labelX-12);
    r.label.style.left=labelX+"px";r.label.style.width=labelWidth+"px";
    r.label.style.top=Math.round(labelY)+"px";
    const height=r.label.offsetHeight;
    lower=labelY+height+8;maxBottom=Math.max(maxBottom,lower+12);
    // The arrow itself terminates on the actual target group. A callout attaches the text to the route.
    r.path.setAttribute("d","M"+(a.x+2)+" "+a.y+" H"+railX+" V"+b.y+" H"+(b.x+7));
    r.callout.setAttribute("d","M"+railX+" "+labelY+" H"+(labelX-4));
    r.dot.setAttribute("cx",String(railX));r.dot.setAttribute("cy",String(labelY));
    r.path.dataset.startX=String(a.x);r.path.dataset.startY=String(a.y);
    r.path.dataset.endX=String(b.x);r.path.dataset.endY=String(b.y);
   }
   scene.style.minHeight=Math.ceil(maxBottom)+"px";
   overlay.setAttribute("viewBox","0 0 "+scene.offsetWidth+" "+scene.offsetHeight);
  };
  let pending=false;
  const schedule=()=>{
   if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;layout();});
  };
  layers.addEventListener("toggle",schedule,true);
  if(typeof ResizeObserver!=="undefined"){
   const ro=new ResizeObserver(schedule);ro.observe(layers);
  }
  window.addEventListener("resize",schedule);

  scene.dataset.architectureConnected="true";
  scene._drawConnections=schedule;
  schedule();
 }
 let scale=1,fallback=false,busy=false;
 const percent=el("span","architecture-percent","100%");
 const update=()=>{
  scene.style.zoom=String(scale);
  percent.textContent=Math.round(scale*100)+"%";
  scene._drawConnections?.();
 };
 const zoom=delta=>{scale=Math.max(.6,Math.min(2,Math.round((scale+delta)*100)/100));update();};
 add("minus","缩小架构图",()=>zoom(-.2));actions.append(percent);
 add("plus","放大架构图",()=>zoom(.2));
 add("fit","适应窗口",()=>{scale=1;stage.scrollLeft=0;stage.scrollTop=0;update();});
 const full=add("expand","全屏查看架构图",async()=>{
  if(busy)return;busy=true;
  try{
   if(document.fullscreenElement===frame&&document.exitFullscreen)await document.exitFullscreen();
   else if(fallback)fallback=false;
   else if(!document.fullscreenElement){try{if(!frame.requestFullscreen)throw Error("unsupported");await frame.requestFullscreen();}catch{fallback=true;}}
  }finally{busy=false;sync();}
 });
 function sync(){
  const on=document.fullscreenElement===frame||fallback;
  frame.classList.toggle("architecture-fallback-fullscreen",fallback);
  full.innerHTML=ICONS[on?"collapse":"expand"];full.setAttribute("aria-pressed",String(on));
  full.title=on?"退出全屏":"全屏查看架构图";full.setAttribute("aria-label",full.title);
  scene._drawConnections?.();
 }
 document.addEventListener("fullscreenchange",sync);
 document.addEventListener("fullscreenerror",sync);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&fallback){fallback=false;sync();}});
 head.append(actions);frame.append(head,stage);host.append(frame);
 const resizeScene=()=>{
  if(scene.classList.contains("has-flows"))scene.style.width=Math.max(850,stage.clientWidth-30)+"px";
  scene._drawConnections?.();
 };
 resizeScene();window.addEventListener("resize",resizeScene);update();sync();
}
if(typeof module!=="undefined"&&module.exports)module.exports={validate};
if(typeof document!=="undefined"){
 const start=()=>document.querySelectorAll("[data-architecture-view]").forEach(init);
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
 window.GenUIArchitecture={init,validate};
}
})();
