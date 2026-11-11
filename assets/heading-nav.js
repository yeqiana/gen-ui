/* Progressive navigation: native headings are the single source of truth. */
"use strict";
(() => {
const digits=["","一","二","三","四","五","六","七","八","九"];
const han=n=>n<10?digits[n]:n<20?"十"+digits[n%10]:n<100?digits[Math.floor(n/10)]+"十"+digits[n%10]:n<1000?digits[Math.floor(n/100)]+"百"+(n%100?(n%100<10?"零":"")+han(n%100):""):"第"+n;

const tertiary=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const prefix=/^\s*(?:(?:[0-9]+(?:\.[0-9]+){0,3}\.?)|(?:[一二三四五六七八九十]+、)|(?:[（(][一二三四五六七八九十]+[）)])|(?:[甲乙丙丁戊己庚辛壬癸]、))\s*/;
function run(){
 const main=document.querySelector(".doc-main, main#main"),sidebar=document.querySelector(".doc-toc, #report-sidebar");
 if(!main||!sidebar||sidebar.dataset.headingNavReady==="true")return;
 const headings=[...main.querySelectorAll("h2,h3,h4")].filter(h=>!h.closest("dialog,[role=dialog],#panel-rules,.modal,.drawer")&&!h.hidden);
 if(!headings.length)return;
 const zh=document.documentElement.lang?.startsWith("zh");
 let top=0,second=0,third=0;const depths=new Map();
 for(const [index,h] of headings.entries()){
  const level=Number(h.tagName.slice(1))===3 && /^\d+\.\d+\.\d+/.test(h.textContent.trim())?4:Number(h.tagName.slice(1));depths.set(h,level);
  if(level===2){top++;second=0;third=0;}else if(level===3){second++;third=0;}else third++;
  if(!h.id)h.id="genui-heading-"+index;
  if(zh){
   const number=level===2?han(top)+"、":level===3?"（"+han(second)+"）":(tertiary[third-1]||"第"+han(third)+"项")+"、";
   const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);
   let textNode;while((textNode=walker.nextNode())){if(textNode.nodeValue.trim()){textNode.nodeValue=textNode.nodeValue.replace(prefix,"");textNode.nodeValue=textNode.nodeValue.replace(/^\s*/,number+" ");break;}}
  }
 }
 const targets=[...sidebar.querySelectorAll("nav .nav-list,nav .toc-list"),...document.querySelectorAll(".mobile-toc .toc-list")];
 if(!targets.length)return;
 function makeList(){
  const root=document.createElement("ul");root.className=targets[0].className+" genui-tree";let last1=null,last2=null;
  for(const h of headings){
   const level=Math.max(1,Math.min(3,depths.get(h)-1));
   const li=document.createElement("li");li.className="genui-nav-level-"+level+(level>1?" sub":"");
   const a=document.createElement("a");a.href="#"+encodeURIComponent(h.id);a.textContent=h.textContent.trim();a.title=a.textContent;a.setAttribute("aria-label","定位："+a.textContent);
   if(level===1){const icon=h.querySelector("img.section-icon");if(icon){const img=icon.cloneNode(true);img.alt="";a.prepend(img);}else{const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 20 20");svg.setAttribute("aria-hidden","true");const path=document.createElementNS("http://www.w3.org/2000/svg","path");path.setAttribute("d","M4 4h12v12H4z M7 8h6 M7 12h6");path.setAttribute("fill","none");path.setAttribute("stroke","currentColor");path.setAttribute("stroke-width","1.5");svg.append(path);a.prepend(svg);}}
   li.append(a);
   const parent=level===1?root:level===2?(last1?.querySelector(":scope > ul")||root):(last2?.querySelector(":scope > ul")||last1?.querySelector(":scope > ul")||root);
   parent.append(li);
   if(level===1){last1=li;last2=null;}else if(level===2)last2=li;
   if(level<3){const group=document.createElement("ul");group.className="genui-nav-children";li.append(group);
    const button=document.createElement("button");button.type="button";button.className="genui-nav-fold";button.textContent="⌄";button.title="折叠或展开子目录";button.setAttribute("aria-label","折叠或展开："+a.textContent);button.setAttribute("aria-expanded","true");
    button.addEventListener("click",()=>{group.hidden=!group.hidden;button.setAttribute("aria-expanded",String(!group.hidden));button.textContent=group.hidden?"›":"⌄";});li.insertBefore(button,group);
   }
  }
  root.querySelectorAll("li").forEach(li=>{const group=li.querySelector(":scope > ul"),fold=li.querySelector(":scope > button");if(group&&!group.children.length){group.remove();fold?.remove();}});
  return root;
 }
 targets.forEach(target=>{const tree=makeList();target.replaceWith(tree);});
 sidebar.dataset.headingNavReady="true";
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});else run();
})();