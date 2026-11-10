/* Local Markdown code copy enhancement; one-second icon feedback, no visible status text. */
"use strict";
(() => {
 const svg = {
  copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  error:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>'
 };
 function enhance(pre) {
  if (pre.dataset.genUiCopyReady === "true") return;
  const code = pre.querySelector(":scope > code"); if (!code) return;
  pre.dataset.genUiCopyReady = "true"; pre.classList.add("code-block");
  const lang=document.documentElement.lang?.startsWith("en")?"en":"zh";
  const labels=lang==="en" ? {copy:"Copy code",check:"Copy succeeded",error:"Copy failed"} : {copy:"复制代码",check:"复制成功",error:"复制失败"};
  const button=document.createElement("button");button.type="button";button.className="code-copy";
  button.innerHTML=svg.copy;button.setAttribute("aria-label",labels.copy);button.title=labels.copy;
  const status=document.createElement("span");status.className="code-copy-status";
  status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  let busy=false,resetTimer=null,sequence=0;
  function setState(name) {
   button.innerHTML=svg[name];button.setAttribute("aria-label",labels[name]);button.title=labels[name];
   button.dataset.state=name;
  }
  function fallbackCopy(text) {
   const field=document.createElement("textarea");field.value=text;field.setAttribute("readonly","");
   Object.assign(field.style,{position:"fixed",opacity:"0",pointerEvents:"none"});
   document.body.appendChild(field);field.select();field.setSelectionRange(0,field.value.length);
   let ok=false;try{ok=document.execCommand("copy");}finally{field.remove();}
   if(!ok)throw Error("clipboard_unavailable");
  }
  async function copy(text) {
   if(navigator.clipboard?.writeText)try{await navigator.clipboard.writeText(text);return;}catch{}
   fallbackCopy(text);
  }
  button.addEventListener("click",async()=>{
   if(busy)return;busy=true;
   if(resetTimer!==null){clearTimeout(resetTimer);resetTimer=null;}
   const thisRun=++sequence;
   try{await copy(code.textContent||"");if(thisRun===sequence)setState("check");}
   catch{if(thisRun===sequence)setState("error");}
   finally{
    busy=false;resetTimer=setTimeout(()=>{if(thisRun===sequence)setState("copy");resetTimer=null;},1000);
   }
  });
  pre.insertBefore(button,pre.firstChild);pre.append(status);
 }
 function start() {
  document.querySelectorAll("pre").forEach(enhance);
  if(typeof MutationObserver!=="function")return;
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){
   if(node.nodeType!==1)continue;if(node.matches("pre"))enhance(node);
   node.querySelectorAll("pre").forEach(enhance);
  }}).observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
