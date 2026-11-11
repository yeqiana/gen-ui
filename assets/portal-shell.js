"use strict";
(() => {
const manifest=JSON.parse(document.getElementById("page-manifest").textContent);
const app=document.getElementById("portal");
const rail=document.getElementById("rail");
const nav=document.getElementById("page-nav");
const frame=document.getElementById("page-frame");
// Local file preview: keep same-origin only for CSS, but disable page scripts.
// HTTP preview: allow page scripts in a sandboxed opaque origin; never pair
// allow-scripts with allow-same-origin, even for a user-provided HTML page.
// A copy deployed to an arbitrary web origin must not run untrusted page scripts.
const interactive=location.protocol==="http:"&&location.hostname==="127.0.0.1";
frame.setAttribute("sandbox",interactive?"allow-scripts allow-forms":"allow-same-origin");
document.getElementById("preview-mode").textContent=interactive?"隔离交互预览":"离线静态预览 · 脚本不可用";
const title=document.getElementById("active-title");
const crumb=document.getElementById("breadcrumb");

const status=document.getElementById("frame-status");
const collapse=document.getElementById("collapse");
const menu=document.getElementById("open-nav");
const backdrop=document.getElementById("backdrop");
const pages=manifest.pages;
const active=new Map();
const root={children:new Map(),pages:[]};
const base=manifest.prefix?manifest.prefix+"/":"";
for(const page of pages){
 let node=root;
 for(const segment of page.parts.slice(0,-1)){
   if(!node.children.has(segment))node.children.set(segment,{name:segment,children:new Map(),pages:[]});
   node=node.children.get(segment);
 }
 node.pages.push(page);
}
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function goto(page,section){
 const safeUrl=base+page.href+(section?"#"+encodeURIComponent(section.id):"");
 frame.src=safeUrl;frame.title=page.title+(section?" · "+section.title:"");
 title.textContent=section?section.title:page.title;
 crumb.textContent=[manifest.title,...page.parts.slice(0,-1),page.title].join(" / ");


 status.textContent="正在显示 · "+page.title;
 for(const [key,button] of active){
   const on=key===page.id+(section?"#"+section.id:"");
   if(on)button.setAttribute("aria-current",section?"location":"page");
   else button.removeAttribute("aria-current");
 }
 app.classList.remove("mobile-open");menu.setAttribute("aria-expanded","false");backdrop.hidden=true;
}
function iconKind(page){
 const name=[page.title,...page.parts].join(" / ");
 if(/总览|概览|首页|overview|summary/i.test(name))return "overview";
 if(/状态|质量|审核|验收|status|check/i.test(page.title))return "status";
 if(/明细|记录|列表|详情|table|detail/i.test(page.title))return "table";
 if(/交付|发布|清单|release|deliver/i.test(page.title))return "delivery";
 return ["overview","table","status","delivery"][(Number(page.id.slice(1))||1)%4];
}
function navIcon(kind){
 const d={
  overview:"M3 3h5v5H3z M10 3h5v5h-5z M3 10h5v5H3z M10 10h5v5h-5z",
  table:"M3 4h12v10H3z M3 8h12 M8 4v10",
  status:"M9 2a7 7 0 1 0 0 14a7 7 0 0 0 0-14z M5.5 9l2.1 2.1L12 7",
  delivery:"M5 2h6l3 3v11H5z M11 2v4h3 M7 10h5 M7 13h4"
 };
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 18 18");svg.setAttribute("aria-hidden","true");
 const path=document.createElementNS("http://www.w3.org/2000/svg","path");
 path.setAttribute("d",d[kind]||d.overview);svg.append(path);return svg;
}

function buttonFor(page,section){
 const btn=make("button",section?"section-link":"page-link");
 btn.type="button";
 btn.title=section?section.title:page.title;
 const key=page.id+(section?"#"+section.id:"");
 if(!section){const icon=make("span","nav-glyph");icon.dataset.kind=iconKind(page);icon.setAttribute("aria-hidden","true");icon.append(navIcon(icon.dataset.kind));btn.append(icon)}
 const label=make("span","label",section?section.title:page.title);btn.append(label);
 btn.setAttribute("aria-label",(section?"定位小节：":"打开页面：")+(section?section.title:page.title));
 btn.addEventListener("click",()=>goto(page,section));
 active.set(key,btn);
 return btn;
}
function render(node,parent){
 for(const page of node.pages){
   parent.append(buttonFor(page));
   for(const section of page.sections)parent.append(buttonFor(page,section));
 }
 for(const [name,child] of node.children){
   const details=make("details","group");details.open=true;
   const summary=make("summary","",name);details.append(summary);
   const content=make("div","group-children");details.append(content);
   render(child,content);parent.append(details);
 }
}
render(root,nav);document.getElementById("page-count").textContent=pages.length+" 个页面";
frame.addEventListener("load",()=>{status.textContent="";});
const small=()=>matchMedia("(max-width:700px)").matches;
collapse.addEventListener("click",()=>{
 if(small()){
   app.classList.remove("mobile-open");menu.setAttribute("aria-expanded","false");backdrop.hidden=true;menu.focus();return;
 }
 app.classList.toggle("is-collapsed");
 const expanded=!app.classList.contains("is-collapsed");
 collapse.setAttribute("aria-expanded",String(expanded));
 collapse.title=expanded?"折叠目录":"展开目录";
 collapse.setAttribute("aria-label",collapse.title);
});
const railHead=rail.querySelector(".rail-head");
if(railHead){
 railHead.tabIndex=0;railHead.setAttribute("role","button");railHead.setAttribute("aria-label","双击折叠或展开左侧导航");
 railHead.title="双击折叠或展开左侧导航（Enter 键也可操作）";
 railHead.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();collapse.click();}});
}
rail.addEventListener("dblclick",e=>{
 if(e.target.closest(".portal-rail-resize"))return;
 if(e.target.closest(".page-link,.section-link,.group summary,button")&&!e.target.closest(".rail-head"))return;
 e.preventDefault();collapse.click();
});
const resizer=make("div","portal-rail-resize");
resizer.tabIndex=0;resizer.setAttribute("role","separator");resizer.setAttribute("aria-orientation","vertical");
resizer.setAttribute("aria-label","拖动调整左侧导航宽度");resizer.title="拖动调整导航宽度，双击恢复";
let railWidth=244,drag=null;
const setWidth=w=>{
 railWidth=Math.max(190,Math.min(Math.min(480,Math.round(innerWidth*.45)),Math.round(w)));
 app.style.setProperty("--genui-portal-rail-width",railWidth+"px");
 resizer.setAttribute("aria-valuemin","190");resizer.setAttribute("aria-valuemax",String(Math.min(480,Math.round(innerWidth*.45))));
 resizer.setAttribute("aria-valuenow",String(railWidth));
};
resizer.addEventListener("pointerdown",e=>{
 if(e.button!==0||small()||app.classList.contains("is-collapsed"))return;
 e.preventDefault();drag={id:e.pointerId,x:e.clientX,width:railWidth};
 resizer.setPointerCapture?.(e.pointerId);resizer.classList.add("is-dragging");
});
resizer.addEventListener("pointermove",e=>{if(drag?.id===e.pointerId)setWidth(drag.width+e.clientX-drag.x);});
const release=e=>{if(drag&&(!e||e.pointerId===drag.id)){drag=null;resizer.classList.remove("is-dragging");}};
["pointerup","pointercancel","lostpointercapture"].forEach(k=>resizer.addEventListener(k,release));
resizer.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setWidth(railWidth+(e.key==="ArrowRight"?16:-16));}if(e.key==="Home"){e.preventDefault();setWidth(244);}});
resizer.addEventListener("dblclick",e=>{e.stopPropagation();setWidth(244);});
rail.appendChild(resizer);setWidth(244);menu.addEventListener("click",()=>{
 const show=!app.classList.contains("mobile-open");
 app.classList.toggle("mobile-open",show);menu.setAttribute("aria-expanded",String(show));backdrop.hidden=!show;
 if(show)rail.querySelector("summary,button")?.focus();
});
backdrop.addEventListener("click",()=>{app.classList.remove("mobile-open");menu.setAttribute("aria-expanded","false");backdrop.hidden=true;menu.focus()});
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&app.classList.contains("mobile-open")){app.classList.remove("mobile-open");menu.setAttribute("aria-expanded","false");backdrop.hidden=true;menu.focus()}});
if(pages.length)goto(pages[0]);
else{frame.src="about:blank";title.textContent="暂无内容";status.textContent="没有可展示的 HTML 页面"}
})();
