#!/usr/bin/env node
// Chrome real glyph-line audit for headings: orphan tails, forced breaks, clipping, sidebar fold.
import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const ids=["project-analysis","architecture-design","implementation-plan","test-acceptance"];
const pages=[
  {id:"report",file:"demo/report.html",zh:true,report:true},
  {id:"report-en",file:"demo/report.en.html",zh:false,report:true},
  ...ids.map(id=>({id,file:"demo/documents/"+id+".html",zh:true})),
  ...ids.map(id=>({id:"en-"+id,file:"demo/documents/en/"+id+".html",zh:false})),
  {id:"generated-zh",file:"tests/fixtures/generated-typography-zh.html",zh:true},
  {id:"generated-en",file:"tests/fixtures/generated-typography-en.html",zh:false}
];
const widths=[375,768,1024,1440];
const chrome=[
  process.env.GEN_UI_CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome","/usr/bin/chromium"
].filter(Boolean).find(fs.existsSync);
if(!chrome)throw Error("Chrome / Edge is required");
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const inspector="(()=>{const main=document.querySelector('.doc-main,#main'),els=[...main.querySelectorAll('h1,h2,h3,h4')].filter(e=>!e.closest('[hidden]')&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>35);\nreturn els.map(e=>{const cs=getComputedStyle(e),walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),lines=[];\nwhile(walker.nextNode()){const node=walker.currentNode,s=node.textContent;for(let i=0;i<s.length;i++){const ch=s[i];if(!ch.trim())continue;const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();if(r.width<=0.2||r.height<=0.2)continue;let line=lines.find(x=>Math.abs(x.top-r.top)<3);\nif(!line){line={top:r.top,text:'',qty:0};lines.push(line)}line.text+=ch;line.qty++}}\nlines.sort((a,b)=>a.top-b.top);\nreturn {tag:e.tagName,text:e.textContent.trim().replace(/\\s+/g,\" \").slice(0,140),lines:lines.map(l=>({text:l.text,qty:l.qty})),wrap:cs.textWrap,hardBreak:!!e.querySelector('br'),clipped:e.scrollWidth>e.clientWidth+3,width:Math.round(e.getBoundingClientRect().width),available:(()=>{const p=e.parentElement,cs=getComputedStyle(p);return p.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0)})()};\n})})()";
function check(cond,msg){if(!cond)throw Error(msg);}
const srv=net.createServer();await new Promise(done=>srv.listen(0,"127.0.0.1",done));
const port=srv.address().port;await new Promise(done=>srv.close(done));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-heading-wrap-"));
const proc=spawn(chrome,[
  "--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking",
  "--no-first-run","--remote-debugging-address=127.0.0.1",
  "--remote-allow-origins=*","--remote-debugging-port="+port,
  "--user-data-dir="+profile,"about:blank"
],{stdio:"ignore",windowsHide:true});
let ws;
try{
  let tabs;
  for(let i=0;i<100;i++){
    try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){tabs=await r.json();break}}catch{}
    await sleep(100);
  }
  check(!!tabs,"Chrome CDP unavailable");
  ws=new WebSocket(tabs.find(t=>t.type==="page").webSocketDebuggerUrl);
  await new Promise((ok,bad)=>{ws.addEventListener("open",ok,{once:true});ws.addEventListener("error",bad,{once:true})});
  let seq=0;const pending=new Map();
  ws.addEventListener("message",e=>{
    const data=JSON.parse(e.data),job=pending.get(data.id);
    if(job){pending.delete(data.id);data.error?job.reject(Error(JSON.stringify(data.error))):job.resolve(data.result);}
  });
  const cmd=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const result=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await cmd("Page.enable");await cmd("Runtime.enable");
  let total=0,wrapped=0,folds=0;
  const faults=[];
  for(const width of widths){
    await cmd("Emulation.setDeviceMetricsOverride",{width,height:950,deviceScaleFactor:1,mobile:width===375});
    for(const page of pages){
      await cmd("Page.navigate",{url:pathToFileURL(path.join(root,page.file)).href});
      for(let i=0;i<75;i++){if(await evaluate("document.readyState==='complete'"))break;await sleep(80)}
      const modes=width>700?["expanded","collapsed"]:["mobile"];
      for(const mode of modes){
        if(mode==="collapsed"){
          const clicked=await evaluate("(()=>{const x=document.querySelector('.doc-toc .genui-sidebar-toggle,#toggle-sidebar');if(x){x.click();return true}return false})()");
          check(clicked,"Missing sidebar fold toggle "+page.id);
          await sleep(100);
          folds++;
        }
        const headings=await evaluate(inspector);
        check(headings.length>0,"Missing heading samples "+page.id);
        for(const h of headings){
          total++;
          if(h.lines.length>1)wrapped++;
          const line=h.lines.at(-1);
          const chars=h.text.replace(/\s/g,"").length;
          const orphan=page.zh&&chars>=12&&h.lines.length>=2&&line.qty<=4;
          const clipped=h.clipped;
          const premature=h.lines.length>=2&&h.width<h.available*.87&&h.available-h.width>28;
          if(orphan||clipped||h.hardBreak||premature)faults.push({page:page.id,width,mode,tag:h.tag,text:h.text,lines:h.lines.map(x=>x.text),orphan,clipped,premature,hardBreak:h.hardBreak,wrap:h.wrap});
          if(page.zh&&h.lines.length>=2&&h.tag==="H1"&&h.wrap!=="balance")
            faults.push({page:page.id,width,mode,text:h.text,issue:"main headings not balanced",wrap:h.wrap});
        }
      }
    }
  }
  console.log(JSON.stringify({checkedHeadings:total,wrappedHeadings:wrapped,foldedViews:folds,viewports:widths,pages:pages.length,faults:faults.slice(0,35),faultCount:faults.length},null,2));
  check(total>=450,"Missing expected heading coverage");
  check(faults.length===0,"Heading orphan / clipping / hard break regression: "+faults.length);
}finally{
  ws?.close();proc.kill();await sleep(100);
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200})}catch{}
}
