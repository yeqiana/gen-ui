/* Optional GEN-UI architecture container renderer. No invented connectors. */
"use strict";
(() => {
const TYPES=["业务架构","产品架构","系统架构","数据架构","技术架构","应用架构","功能架构","信息架构"];
const LAYOUTS=["stack","groups","columns"];
const ICONS={
 plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
 minus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
 fit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/></svg>',
 expand:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m0-5 7 7m6-7h5v5m0-5-7 7M3 16v5h5m-5 0 7-7m6 7h5v-5m0 5-7-7"/></svg>',
 collapse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8H3m5 0V3m8 5h5m-5 0V3m0 13h5m-5 0v5M8 16H3m5 0v5"/></svg>'
};
function validate(m){
 if(!m||typeof m!=="object"||Array.isArray(m)||Object.keys(m).some(k=>!["type","title","layout","groups"].includes(k)))throw Error("invalid architecture");
 if(!TYPES.includes(m.type)||!LAYOUTS.includes(m.layout)||typeof m.title!=="string"||!m.title.trim()||m.title.length>100)throw Error("invalid metadata");
 if(!Array.isArray(m.groups)||m.groups.length<1||m.groups.length>16)throw Error("invalid groups");
 const checkGroup=(g,depth=1)=>{
  if(!g||Array.isArray(g)||typeof g!=="object"||Object.keys(g).some(k=>!["name","items","children"].includes(k))||typeof g.name!=="string"||!g.name.trim()||g.name.length>64)throw Error("invalid group");
  if(depth>3)throw Error("architecture nesting exceeds 3 levels");
  const items=g.items??[];const children=g.children??[];
  if(!Array.isArray(items)||items.length>24||items.some(x=>typeof x!=="string"||!x.trim()||x.length>100))throw Error("invalid items");
  if(!Array.isArray(children)||children.length>16||(!items.length&&!children.length))throw Error("invalid children");
  children.forEach(child=>checkGroup(child,depth+1));
 };
 m.groups.forEach(g=>checkGroup(g));
 return m;
}
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
function init(host){
 if(host.dataset.genUiArchitectureReady==="true")return;
 const source=host.querySelector(':scope > script[type="application/json"]');if(!source)return;
 let model;try{model=validate(JSON.parse(source.textContent));}catch(error){host.dataset.architectureError=String(error.message);return;}
 host.dataset.genUiArchitectureReady="true";
 const frame=el("section","architecture-view"),head=el("header","architecture-head"),stage=el("div","architecture-stage"),layers=el("div","architecture-layers architecture-"+model.layout);
 head.append(el("strong","architecture-title",model.title),el("span","architecture-type",model.type));
 const actions=el("div","architecture-actions");
 function add(icon,label,action){const button=el("button","architecture-icon");button.type="button";button.title=label;button.setAttribute("aria-label",label);button.innerHTML=ICONS[icon];button.addEventListener("click",action);actions.append(button);return button;}
 let scale=1,fallback=false,busy=false;
 const percent=el("span","architecture-percent","100%");
 const update=()=>{layers.style.zoom=String(scale);percent.textContent=Math.round(scale*100)+"%";};
 const zoom=delta=>{scale=Math.max(.6,Math.min(2,Math.round((scale+delta)*100)/100));update();};
 add("minus","缩小架构图",()=>zoom(-.2));actions.append(percent);add("plus","放大架构图",()=>zoom(.2));add("fit","适应窗口",()=>{scale=1;update();});
 const full=add("expand","全屏查看架构图",async()=>{if(busy)return;busy=true;try{if(document.fullscreenElement===frame&&document.exitFullscreen)await document.exitFullscreen();else if(fallback)fallback=false;else if(!document.fullscreenElement){try{if(!frame.requestFullscreen)throw Error("unsupported");await frame.requestFullscreen();}catch{fallback=true;}}}finally{busy=false;sync();}});
 function sync(){const on=document.fullscreenElement===frame||fallback;frame.classList.toggle("architecture-fallback-fullscreen",fallback);full.innerHTML=ICONS[on?"collapse":"expand"];full.setAttribute("aria-pressed",String(on));full.title=on?"退出全屏":"全屏查看架构图";full.setAttribute("aria-label",full.title);}
 document.addEventListener("fullscreenchange",sync);document.addEventListener("fullscreenerror",sync);document.addEventListener("keydown",e=>{if(e.key==="Escape"&&fallback){fallback=false;sync();}});
 head.append(actions);
 const renderGroup=(group)=>{const section=el("details","architecture-group");section.open=true;section.append(el("summary","architecture-group-title",group.name));const items=el("div","architecture-items");(group.items||[]).forEach(item=>items.append(el("div","architecture-item",item)));(group.children||[]).forEach(child=>items.append(renderGroup(child)));section.append(items);return section;};
 model.groups.forEach(group=>layers.append(renderGroup(group)));
 stage.append(layers);frame.append(head,stage);host.append(frame);update();sync();
}
if(typeof module!=="undefined"&&module.exports)module.exports={validate};
if(typeof document!=="undefined"){const start=()=>document.querySelectorAll("[data-architecture-view]").forEach(init);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();window.GenUIArchitecture={init,validate};}
})();