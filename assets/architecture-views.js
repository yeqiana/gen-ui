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
 let groupCount=0,itemCount=0;
 const checkGroup=(g,depth=1)=>{
  if(depth>3)throw Error('architecture nesting exceeds 3 levels');
  if(++groupCount>128)throw Error('architecture model exceeds 128 groups');
  if(!g||Array.isArray(g)||typeof g!=='object'||Object.keys(g).some(k=>!['id','name','items','children'].includes(k))||typeof g.name!=='string'||!g.name.trim()||g.name.length>64)throw Error('invalid group');
  if(g.id!==undefined&&(typeof g.id!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(g.id)))throw Error('invalid group id');
  const items=g.items??[],children=g.children??[];
  if(!Array.isArray(items)||items.length>24||items.some(x=>typeof x!=='string'||!x.trim()||x.length>100))throw Error('invalid items');
  itemCount+=items.length;if(itemCount>512)throw Error('architecture model exceeds 512 items');
  if(!Array.isArray(children)||children.length>16||(!items.length&&!children.length))throw Error('invalid children');
  children.forEach(child=>checkGroup(child,depth+1));
 };
 m.groups.forEach(g=>checkGroup(g));
 const ids=m.groups.map(g=>g.id??g.name),names=m.groups.map(g=>g.name);
 if(new Set(ids).size!==ids.length||new Set(names).size!==names.length)throw Error("duplicate architecture group identity");
 // Identity ambiguity is a model error even when no relationships are supplied.
const byRef=new Map();
for(const group of m.groups)for(const key of [group.name,group.id].filter(Boolean)){
 if(byRef.has(key)&&byRef.get(key)!==group)throw Error("ambiguous group reference");
 byRef.set(key,group);
}
if(m.flows!==undefined){
 const refs=new Set(byRef.keys());
 if(!Array.isArray(m.flows)||m.flows.length>12||m.flows.some(f=>!f||Array.isArray(f)||typeof f!=="object"||Object.keys(f).some(k=>!["from","to","label","evidence","basis"].includes(k))
  ||typeof f.from!=="string"||typeof f.to!=="string"||!refs.has(f.from)||!refs.has(f.to)||f.from===f.to
  ||typeof f.label!=="string"||!f.label.trim()||f.label.length>100
  ||(f.evidence!==undefined&&(typeof f.evidence!=="string"||!f.evidence.trim()||f.evidence.length>220))
  ||(f.basis!==undefined&&!["implementation","design"].includes(f.basis))
   ||(f.basis==="implementation"&&(typeof f.evidence!=="string"||!f.evidence.trim()))))throw Error("invalid architecture flows");
 if(m.flows.some(f=>byRef.get(f.from)===byRef.get(f.to)))throw Error("self-referential architecture flow");
}
let serialized;try{serialized=JSON.stringify(m);}catch{throw Error("invalid architecture payload");}
 const jsonBytes=typeof TextEncoder==="function"?new TextEncoder().encode(serialized).length:encodeURIComponent(serialized).replace(/%[0-9A-F]{2}/gi,"x").length;
 if(jsonBytes>65536)throw Error("architecture model exceeds 64 KiB");
 return m;
}
const el=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=content;return node;};
const svg=(tag)=>document.createElementNS("http://www.w3.org/2000/svg",tag);
let counter=0;
const instances=new WeakMap(),activeInstances=new Map();let cleanupObserver=null;
function observeInstances(){if(cleanupObserver||typeof MutationObserver==="undefined"||!document.documentElement)return;cleanupObserver=new MutationObserver(()=>{for(const [host,instance] of activeInstances)if(!host.isConnected)instance.destroy();});cleanupObserver.observe(document.documentElement,{childList:true,subtree:true});}
function init(host){
 const existing=instances.get(host);if(existing)return existing;
 if(!host||typeof host.querySelector!=="function")return null;
 const source=host.querySelector(':scope > script[type="application/json"]');if(!source)return;
 let model;try{model=validate(JSON.parse(source.textContent));}catch(error){host.dataset.architectureError=String(error.message);return;}
 const cleanups=[];const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);cleanups.push(()=>target.removeEventListener(type,handler,options));};
 let ro=null,destroyed=false,resizeScene=()=>{};
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
  button.innerHTML=ICONS[icon];listen(button,"click",action);actions.append(button);return button;
 };
 const relationships=[];
if(model.flows?.length){
 const overlay=svg("svg");overlay.setAttribute("class","architecture-wires");overlay.setAttribute("aria-hidden","true");
 const defs=svg("defs"),marker=svg("marker"),arrow=svg("path"),markerId="architecture-arrow-"+(++counter);
 marker.setAttribute("id",markerId);marker.setAttribute("viewBox","0 0 10 10");marker.setAttribute("markerWidth","7");marker.setAttribute("markerHeight","7");marker.setAttribute("refX","9");marker.setAttribute("refY","5");marker.setAttribute("orient","auto");
 arrow.setAttribute("d","M0 0 L9 5 L0 10 Z");arrow.setAttribute("fill","#4c719c");marker.append(arrow);defs.append(marker);overlay.append(defs);
 const displayName=ref=>model.groups.find(g=>g.id===ref||g.name===ref)?.name??ref,bundles=new Map();
 for(const flow of model.flows){const key=flow.from+"|"+flow.to;if(!bundles.has(key))bundles.set(key,{from:flow.from,to:flow.to,flows:[]});bundles.get(key).flows.push(flow);}
 for(const [index,bundle] of [...bundles.values()].entries()){
  const g=svg("g"),path=svg("path"),dot=svg("circle");g.classList.add("architecture-flow-row");g.dataset.from=bundle.from;g.dataset.to=bundle.to;g.dataset.flowCount=String(bundle.flows.length);
  path.classList.add("architecture-wire");path.setAttribute("marker-end","url(#"+markerId+")");dot.classList.add("architecture-wire-dot");dot.setAttribute("r","3");g.append(path,dot);overlay.append(g);
  const label=el("div","architecture-wire-label");label.dataset.flowIndex=String(index);label.dataset.flowCount=String(bundle.flows.length);label.dataset.from=bundle.from;label.dataset.to=bundle.to;
  const bases=new Set(bundle.flows.map(flow=>flow.basis??"design"));label.dataset.basis=bases.size===1?[...bases][0]:"mixed";
  label.append(el("span","architecture-wire-endpoints",displayName(bundle.from)+" → "+displayName(bundle.to)));
  for(const flow of bundle.flows){label.append(el("span","architecture-wire-title",flow.label));if(flow.evidence)label.append(el("small","architecture-wire-evidence",(flow.basis==="implementation"?"代码":"设计")+"依据："+flow.evidence));}
  label.setAttribute("role","note");label.tabIndex=0;label.setAttribute("aria-label",displayName(bundle.from)+" → "+displayName(bundle.to)+"："+bundle.flows.map(flow=>flow.label+(flow.evidence?"；依据："+flow.evidence:"")).join("；"));
  scene.append(label);relationships.push({from:bundle.from,to:bundle.to,flows:bundle.flows,path,dot,label});
 }
 scene.append(overlay);
 const groupCenter=ref=>{const r=groupElements.get(ref).getBoundingClientRect();return r.top+r.height/2;};
 const relationshipNote=el("p","architecture-relationship-note","关系较密集，已切换为关系清单，避免连线交叉；所有起点、终点和依据均保留。");relationshipNote.hidden=true;scene.append(relationshipNote);
 const layout=()=>{
  const sceneRect=scene.getBoundingClientRect(),scaleFactor=sceneRect.width/Math.max(1,scene.offsetWidth),layerWidth=layers.offsetWidth,leftGutter=Number(scene.dataset.leftGutter||0);
  const nodes=[...new Set(groupElements.values())],incident=new Map(nodes.map(node=>[node,[]]));
  relationships.forEach((relation,index)=>{
   const from=groupElements.get(relation.from),to=groupElements.get(relation.to);
   incident.get(from).push({relation,other:to,role:"from",index});
   incident.get(to).push({relation,other:from,role:"to",index});
  });
  for(const [node,links] of incident)node.style.minHeight=links.length?(18+(links.length+1)*10)+"px":"";
  const ports=new Map();
  for(const [node,links] of incident){
   const rect=node.getBoundingClientRect(),height=rect.height/scaleFactor,margin=Math.min(10,height*.15);
   links.sort((a,b)=>{const ar=a.other.getBoundingClientRect(),br=b.other.getBoundingClientRect();return ar.top+ar.height/2-(br.top+br.height/2)||a.index-b.index;});
   links.forEach((link,index)=>{
    const y=(rect.top-sceneRect.top)/scaleFactor+margin+(index+1)*(height-2*margin)/(links.length+1),entry=ports.get(link.relation)||{};
    entry[link.role==="from"?"startY":"endY"]=y;ports.set(link.relation,entry);
   });
  }
  const resolved=relationships.map(relation=>{
   const a=groupElements.get(relation.from).getBoundingClientRect(),b=groupElements.get(relation.to).getBoundingClientRect(),port=ports.get(relation);
   const side=groupCenter(relation.to)<groupCenter(relation.from)?"left":"right";
   return{relation,side,startY:port.startY,endY:port.endY,a:{left:(a.left-sceneRect.left)/scaleFactor,right:(a.right-sceneRect.left)/scaleFactor},b:{left:(b.left-sceneRect.left)/scaleFactor,right:(b.right-sceneRect.left)/scaleFactor}};
  });
  const left=resolved.filter(route=>route.side==="left").sort((a,b)=>a.startY-b.startY||a.endY-b.endY),right=resolved.filter(route=>route.side==="right").sort((a,b)=>a.startY-b.startY||a.endY-b.endY);
  const segmentsFor=route=>[{x1:route.startX,y1:route.startY,x2:route.railX,y2:route.startY},{x1:route.railX,y1:route.startY,x2:route.railX,y2:route.endY},{x1:route.railX,y1:route.endY,x2:route.endX,y2:route.endY}];
  const segmentConflict=(a,b)=>{const endpoint=(seg,x,y)=>(Math.abs(seg.x1-x)<.1&&Math.abs(seg.y1-y)<.1)||(Math.abs(seg.x2-x)<.1&&Math.abs(seg.y2-y)<.1);
   const ah=Math.abs(a.y1-a.y2)<.1,bh=Math.abs(b.y1-b.y2)<.1,av=Math.abs(a.x1-a.x2)<.1,bv=Math.abs(b.x1-b.x2)<.1;
   if(ah&&bv){const x=b.x1,y=a.y1,hit=x>=Math.min(a.x1,a.x2)-.1&&x<=Math.max(a.x1,a.x2)+.1&&y>=Math.min(b.y1,b.y2)-.1&&y<=Math.max(b.y1,b.y2)+.1;return hit&&!(endpoint(a,x,y)&&endpoint(b,x,y));}
   if(av&&bh){const x=a.x1,y=b.y1,hit=x>=Math.min(b.x1,b.x2)-.1&&x<=Math.max(b.x1,b.x2)+.1&&y>=Math.min(a.y1,a.y2)-.1&&y<=Math.max(a.y1,a.y2)+.1;return hit&&!(endpoint(a,x,y)&&endpoint(b,x,y));}
   if(ah&&bh){const overlap=Math.min(Math.max(a.x1,a.x2),Math.max(b.x1,b.x2))-Math.max(Math.min(a.x1,a.x2),Math.min(b.x1,b.x2));return Math.abs(a.y1-b.y1)<4.4&&overlap>4;}
   if(av&&bv){const overlap=Math.min(Math.max(a.y1,a.y2),Math.max(b.y1,b.y2))-Math.max(Math.min(a.y1,a.y2),Math.min(b.y1,b.y2));return Math.abs(a.x1-b.x1)<4.4&&overlap>4;}
   return false;
  };
  const assign=(routes,side)=>{
   const count=routes.length,labelWidth=205;
   for(const [index,route] of routes.entries()){
    const {relation:r,a,b,startY,endY}=route,railX=side==="left"?8+labelWidth+12+index*16:leftGutter+layerWidth+12+index*16;
    const startX=side==="left"?a.left:a.right,endX=side==="left"?b.left:b.right;
    Object.assign(route,{railX,startX,endX});
    r.path.setAttribute("d","M"+startX+" "+startY+" H"+railX+" V"+endY+" H"+endX);
    const midY=(startY+endY)/2;r.dot.setAttribute("cx",String(railX));r.dot.setAttribute("cy",String(midY));
    r.path.dataset.railX=String(railX);r.path.dataset.startX=String(startX);r.path.dataset.startY=String(startY);r.path.dataset.endX=String(endX);r.path.dataset.endY=String(endY);r.path.dataset.routeSide=side;
    r.label.dataset.routeSide=side;r.label.dataset.labelY=String(midY);
   }
  };
  assign(left,"left");assign(right,"right");
  let crossings=0;
  for(let i=0;i<resolved.length;i++)for(let j=i+1;j<resolved.length;j++){
   const a=resolved[i],b=resolved[j];if(a.side!==b.side)continue;
   if(segmentsFor(a).some(x=>segmentsFor(b).some(y=>segmentConflict(x,y))))crossings++;
  }
  const listMode=crossings>0;
  scene.dataset.relationshipMode=listMode?"list":"graph";scene.dataset.relationshipCrossings=String(crossings);relationshipNote.hidden=!listMode;relationshipNote.style.left=left.length?"8px":(leftGutter+layerWidth+24+right.length*16)+"px";
  for(const route of resolved){route.relation.path.style.display=listMode?"none":"";route.relation.dot.style.display=listMode?"none":"";}
  let maxBottom=layers.offsetHeight;
  const placeLabels=(routes,side)=>{
   let lower=listMode?46:12;const count=routes.length,labelX=side==="left"?8:leftGutter+layerWidth+24+count*16,labelWidth=205;
   for(const route of routes){
    const label=route.relation.label,height=Math.max(36,label.offsetHeight),top=Math.max((route.startY+route.endY)/2-height/2,lower);
    label.style.left=labelX+"px";label.style.width=labelWidth+"px";label.style.top=Math.round(top)+"px";lower=top+height+8;
    maxBottom=Math.max(maxBottom,lower+12,route.startY+12,route.endY+12);
   }
  };
  placeLabels(left,"left");placeLabels(right,"right");
  scene.style.minHeight=Math.ceil(maxBottom)+"px";overlay.setAttribute("viewBox","0 0 "+scene.offsetWidth+" "+scene.offsetHeight);
 };
 let pending=false;const schedule=()=>{if(pending||destroyed)return;pending=true;requestAnimationFrame(()=>{pending=false;if(!destroyed)layout();});};
 listen(layers,"toggle",()=>{resizeScene();schedule();},true);if(typeof ResizeObserver!=="undefined"){ro=new ResizeObserver(()=>{resizeScene();schedule();});ro.observe(stage);}
 scene.dataset.architectureConnected="true";scene._drawConnections=schedule;schedule();
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
 listen(document,"fullscreenchange",sync);
 listen(document,"fullscreenerror",sync);
 listen(document,"keydown",e=>{if(e.key==="Escape"&&fallback){fallback=false;sync();}});
 head.append(actions);frame.append(head,stage);host.append(frame);
 resizeScene=()=>{
  if(relationships.length){const counts=(()=>{let left=0,right=0;for(const relation of relationships){const a=groupElements.get(relation.from).getBoundingClientRect(),b=groupElements.get(relation.to).getBoundingClientRect();if(b.top+b.height/2<a.top+a.height/2)left++;else right++;}return{left,right};})();
   const leftGutter=counts.left?237+counts.left*16:0,rightGutter=counts.right?237+counts.right*16:0,required=leftGutter+rightGutter+320,width=Math.max(850,stage.clientWidth-30,required),layerWidth=Math.max(320,Math.min(560,width-leftGutter-rightGutter));
   scene.style.width=width+"px";scene.dataset.leftGutter=String(leftGutter);scene.dataset.rightGutter=String(rightGutter);layers.style.marginLeft=leftGutter+"px";layers.style.width=layerWidth+"px";layers.style.boxSizing="border-box";
  }else{scene.style.width="100%";layers.style.marginLeft="0px";}
  scene._drawConnections?.();
 };
 resizeScene();listen(window,"resize",resizeScene);update();sync();
 const instance={destroy(){if(destroyed)return;destroyed=true;ro?.disconnect();cleanups.splice(0).forEach(fn=>fn());if(document.fullscreenElement===frame&&typeof document.exitFullscreen==="function")document.exitFullscreen().catch(()=>{});frame.remove();delete host.dataset.genUiArchitectureReady;delete host.dataset.architectureError;instances.delete(host);activeInstances.delete(host);if(!activeInstances.size&&cleanupObserver){cleanupObserver.disconnect();cleanupObserver=null;}}};
 instances.set(host,instance);if(host.isConnected){activeInstances.set(host,instance);observeInstances();}host.dataset.genUiArchitectureReady="true";delete host.dataset.architectureError;return instance;
}
function destroy(host){instances.get(host)?.destroy();}
function destroyAll(){for(const [host,instance] of [...activeInstances])instance.destroy();}
if(typeof module!=="undefined"&&module.exports)module.exports={validate};
if(typeof document!=="undefined"){
 const start=()=>document.querySelectorAll("[data-architecture-view]").forEach(init);
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
 window.GenUIArchitecture={init,validate,destroy,destroyAll};
}
})();
