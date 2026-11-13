/* Two-level chapter navigation, double-click folding, desktop width resizing. */
"use strict";
(() => {
 const digits=["","一","二","三","四","五","六","七","八","九"];
 const han=n=>n<10?digits[n]:n<20?"十"+digits[n%10]:n<100?digits[Math.floor(n/10)]+"十"+digits[n%10]:n<1000?digits[Math.floor(n/100)]+"百"+(n%100?(n%100<10?"零":"")+han(n%100):""):"第"+n;
 const prefix=/^\s*(?:(?:\d+(?:\.\d+){0,3}\.?)|(?:[一二三四五六七八九十百千]+、)|(?:[（(][一二三四五六七八九十百千]+[）)])|(?:[甲乙丙丁戊己庚辛壬癸]、))\s*/;
 const isChapter=h=>{
  if(h.hidden||h.closest("dialog,[role=dialog],#panel-rules,.modal,.drawer,.chart-section,.diagram,.case-block,.metric"))return false;
  if(h.tagName==="H2")return true;
  if(h.tagName==="H3")return h.parentElement?.classList.contains("doc-section")||h.dataset.navChapter==="true";
  return false;
 };
 function numberHeadings(headings,main){
  const zh=document.documentElement.lang?.startsWith("zh");
  const scheme=document.documentElement.dataset.headingNumbering||"preserve";
  const chinese=zh&&(scheme==="chinese"||(scheme!=="decimal"&&/^\s*[一二三四五六七八九十百千]+、/.test(headings.find(h=>h.tagName==="H2")?.textContent||"")));
  if(!chinese)return;
  let top=0,sub=0;
  const apply=(h,value)=>{
   const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);let n;
   while((n=walker.nextNode()))if(n.nodeValue.trim()){
    n.nodeValue=n.nodeValue.replace(prefix,"").replace(/^\s*/,value?value+" ":"");break;
   }
  };
  for(const h of headings){
   if(h.tagName==="H2"){top++;sub=0;apply(h,han(top)+"、");}
   else if(h.tagName==="H3"){sub++;apply(h,"（"+han(sub)+"）");}
  }
  // H4 may remain in prose but must never introduce a third numbered chapter level.
  main.querySelectorAll(".doc-section h4").forEach(h=>apply(h,""));
 }
 // Only numeric table data is rounded. IDs, codes, dates, and prose remain unchanged.
 const numberFormat=(value,isMoney=false)=>{
  const n=Number(value);if(!Number.isFinite(n))return String(value);
  return isMoney?n.toFixed(4):new Intl.NumberFormat("zh-CN",{maximumFractionDigits:2,useGrouping:false}).format(n);
 };
 function formatTableNumbers(scope){
  scope.querySelectorAll("table").forEach(table=>{
   const headers=[...table.querySelectorAll("thead th")].map(th=>th.textContent.trim());
   for(const row of table.querySelectorAll("tbody tr")){
    for(const [index,cell] of [...row.cells].entries()){
     if(cell.colSpan>1)continue;
     const target=cell.children.length===0?cell:(cell.children.length===1&&cell.firstElementChild?.matches(".compare-value,[data-numeric]")?cell.firstElementChild:null);
     if(!target)continue;
     const source=target.textContent.trim();
     const match=/^([¥￥$]?)(-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?)(%?)$/.exec(source);
     if(!match||/^0\d+/.test(match[2]))continue;
     const money=cell.dataset.numberKind==="money"||/[金额价款费]|amount|price|money|cost/i.test(headers[index]||"")||!!match[1];
     target.textContent=match[1]+numberFormat(match[2].replaceAll(",",""),money)+match[3];
    }
   }
  });
 }
 window.GenUITableFormat={numberFormat,formatTableNumbers}; function installSidebar(sidebar){
  if(sidebar.dataset.genUiSidebarReady==="true")return;
  sidebar.dataset.genUiSidebarReady="true";
  const host=sidebar.closest(".app,.doc-layout");if(!host)return;
  const brand=sidebar.querySelector(".brand,.toc-brand");
  let toggleButton=sidebar.querySelector("#toggle-sidebar,.genui-sidebar-toggle");
  const syncToggle=collapsed=>{
   if(brand){
    brand.setAttribute("aria-expanded",String(!collapsed));
    brand.tabIndex=collapsed?0:-1;
    if(collapsed){
     brand.setAttribute("role","button");
     brand.setAttribute("aria-label","展开导航");
     brand.title="展开导航";
     const controls=toggleButton?.getAttribute("aria-controls");
     if(controls)brand.setAttribute("aria-controls",controls);
    }else{
     brand.removeAttribute("role");
     brand.removeAttribute("aria-label");
     brand.removeAttribute("aria-controls");
     brand.removeAttribute("title");
    }
   }
   if(toggleButton&&toggleButton.id!=="toggle-sidebar"){
    const label=collapsed?"展开导航":"折叠导航";
    toggleButton.setAttribute("aria-expanded",String(!collapsed));
    toggleButton.setAttribute("aria-label",label);toggleButton.title=label;
    const glyph=toggleButton.querySelector("svg");if(glyph)glyph.style.transform=collapsed?"rotate(180deg)":"none";
   }
  };
  if(!toggleButton){
   const nav=sidebar.querySelector("nav");if(nav&&!nav.id)nav.id=(sidebar.id||"genui-sidebar")+"-nav";
   toggleButton=document.createElement("button");toggleButton.type="button";toggleButton.className="genui-sidebar-toggle";
   toggleButton.setAttribute("aria-controls",nav?.id||sidebar.id||"");
   const glyph=document.createElementNS("http://www.w3.org/2000/svg","svg");glyph.setAttribute("viewBox","0 0 20 20");glyph.setAttribute("aria-hidden","true");
   const path=document.createElementNS("http://www.w3.org/2000/svg","path");path.setAttribute("d","M12 4 6 10l6 6");path.setAttribute("fill","none");path.setAttribute("stroke","currentColor");path.setAttribute("stroke-width","1.8");path.setAttribute("stroke-linecap","round");path.setAttribute("stroke-linejoin","round");glyph.appendChild(path);toggleButton.appendChild(glyph);
   toggleButton.addEventListener("click",()=>{const collapsed=host.dataset.sidebarCollapsed!=="true";host.dataset.sidebarCollapsed=String(collapsed);syncToggle(collapsed);});
   sidebar.insertBefore(toggleButton,brand?.nextSibling||sidebar.firstChild);
  }else toggleButton.addEventListener("click",()=>syncToggle(host.dataset.sidebarCollapsed==="true"));
  syncToggle(host.dataset.sidebarCollapsed==="true");
  const toggle=()=>toggleButton?.click();
  if(brand){
   // A single M/expand icon occupies the folded brand slot; no separate button.
   const ns="http://www.w3.org/2000/svg";
   const icon=document.createElementNS(ns,"svg");
   icon.classList.add("genui-brand-expand-icon");
   icon.setAttribute("viewBox","0 0 20 20");
   icon.setAttribute("aria-hidden","true");
   const path=document.createElementNS(ns,"path");
   path.setAttribute("d","M7 4 13 10 7 16");
   path.setAttribute("fill","none");
   path.setAttribute("stroke","currentColor");
   path.setAttribute("stroke-width","1.8");
   path.setAttribute("stroke-linecap","round");
   path.setAttribute("stroke-linejoin","round");
   icon.appendChild(path);brand.appendChild(icon);
   brand.addEventListener("click",e=>{
    if(host.dataset.sidebarCollapsed!=="true"||e.target.closest?.("button,a"))return;
    e.preventDefault();e.stopPropagation();toggle();
   });
   brand.addEventListener("keydown",e=>{
    if(host.dataset.sidebarCollapsed!=="true"||e.target!==brand)return;
    if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();toggle();}
   });
  }
  sidebar.addEventListener("dblclick",e=>{
   if(e.target.closest(".genui-nav-resize,.brand,.toc-brand"))return;
   if(e.target.closest("a,button,input,select,textarea"))return;
   e.preventDefault();toggle();
  });
  const handle=document.createElement("div");
  handle.className="genui-nav-resize";
  handle.setAttribute("role","separator");
  handle.setAttribute("aria-orientation","vertical");
  handle.setAttribute("aria-label","拖动调整左侧导航宽度");
  handle.setAttribute("title","拖动调整导航宽度，双击恢复默认宽度");
  handle.tabIndex=0;
  const defaultWidth=host.classList.contains("doc-layout")?248:222;
  const max=()=>Math.min(480,Math.round(window.innerWidth*.45));
  let current=defaultWidth,drag=null;
  const apply=width=>{
   current=Math.min(max(),Math.max(190,Math.round(width)));
   host.style.setProperty("--genui-sidebar-width",current+"px");
   handle.setAttribute("aria-valuemin","190");
   handle.setAttribute("aria-valuemax",String(max()));
   handle.setAttribute("aria-valuenow",String(current));
  };
  handle.addEventListener("pointerdown",e=>{
   if(e.button!==0||host.dataset.sidebarCollapsed==="true"||window.innerWidth<=800)return;
   e.preventDefault();drag={id:e.pointerId,x:e.clientX,width:current};
   handle.setPointerCapture?.(e.pointerId);
   handle.classList.add("is-dragging");
  });
  handle.addEventListener("pointermove",e=>{if(drag?.id===e.pointerId)apply(drag.width+e.clientX-drag.x);});
  const stop=e=>{if(drag&&(!e||e.pointerId===drag.id)){drag=null;handle.classList.remove("is-dragging");}};
  ["pointerup","pointercancel","lostpointercapture"].forEach(n=>handle.addEventListener(n,stop));
  handle.addEventListener("keydown",e=>{
   if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();apply(current+(e.key==="ArrowRight"?16:-16));}
   if(e.key==="Home"){e.preventDefault();apply(defaultWidth);}
  });
  handle.addEventListener("dblclick",e=>{e.stopPropagation();apply(defaultWidth);});
  sidebar.appendChild(handle);apply(current);
 }
 function run(){
  const main=document.querySelector(".doc-main,main#main"),sidebar=document.querySelector(".doc-toc,#report-sidebar");
  if(!main||!sidebar)return;
  installSidebar(sidebar);
  formatTableNumbers(main);
  if(sidebar.dataset.headingNavReady==="true")return;
  const headings=[...main.querySelectorAll("h2,h3")].filter(isChapter);
  if(!headings.length)return;
  headings.forEach((h,index)=>{if(!h.id)h.id="genui-heading-"+index;});
  numberHeadings(headings,main);
  const targets=[...sidebar.querySelectorAll(".nav-list,.toc-list"),...document.querySelectorAll(".mobile-toc .toc-list")];
  for(const target of targets){
   const root=document.createElement("ul");root.className=target.className+" genui-tree";let parent=null;
   for(const h of headings){
    const primary=h.tagName==="H2";
    const li=document.createElement("li");li.className="genui-nav-level-"+(primary?"1":"2")+(primary?"":" sub");
    const a=document.createElement("a");a.href="#"+encodeURIComponent(h.id);a.textContent=h.textContent.trim();a.title=a.textContent;a.setAttribute("aria-label","定位："+a.textContent);li.appendChild(a);
    if(primary){
     const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 20 20');icon.setAttribute('aria-hidden','true');
     const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d','M4 4h12v12H4z M7 8h6 M7 12h6');shape.setAttribute('fill','none');shape.setAttribute('stroke','currentColor');shape.setAttribute('stroke-width','1.5');icon.appendChild(shape);a.prepend(icon);
     root.appendChild(li);parent=li;
     const children=document.createElement("ul");children.className="genui-nav-children";li.appendChild(children);
     a.addEventListener("dblclick",e=>{e.preventDefault();const hidden=!children.hidden;children.hidden=hidden;a.setAttribute("aria-expanded",String(!hidden));});
     a.addEventListener("keydown",e=>{if(e.altKey&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){e.preventDefault();children.hidden=e.key==="ArrowLeft";a.setAttribute("aria-expanded",String(!children.hidden));}});
     a.setAttribute("aria-expanded","true");
    }else (parent?.querySelector(":scope > ul")||root).appendChild(li);
   }
   root.querySelectorAll(".genui-nav-children:empty").forEach(el=>{el.parentElement.querySelector("a")?.removeAttribute("aria-expanded");el.remove();});
   target.replaceWith(root);
  }
  sidebar.dataset.headingNavReady="true";
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});else run();
})();
