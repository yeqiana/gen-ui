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
const external=document.getElementById("open-external");
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
 external.href=safeUrl;
 external.setAttribute("aria-label","在新标签页打开"+(section?section.title:page.title));
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
function buttonFor(page,section){
 const btn=make("button",section?"section-link":"page-link");
 btn.type="button";
 btn.title=section?section.title:page.title;
 const key=page.id+(section?"#"+section.id:"");
 if(!section){const icon=make("span","nav-glyph");icon.dataset.kind=iconKind(page);icon.setAttribute("aria-hidden","true");btn.append(icon)}
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
menu.addEventListener("click",()=>{
 const show=!app.classList.contains("mobile-open");
 app.classList.toggle("mobile-open",show);menu.setAttribute("aria-expanded",String(show));backdrop.hidden=!show;
 if(show)rail.querySelector("summary,button")?.focus();
});
backdrop.addEventListener("click",()=>{app.classList.remove("mobile-open");menu.setAttribute("aria-expanded","false");backdrop.hidden=true;menu.focus()});
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&app.classList.contains("mobile-open")){app.classList.remove("mobile-open");menu.setAttribute("aria-expanded","false");backdrop.hidden=true;menu.focus()}});
if(pages.length)goto(pages[0]);
else{frame.src="about:blank";title.textContent="暂无内容";status.textContent="没有可展示的 HTML 页面"}
})();