#!/usr/bin/env node
// Browser smoke test for fixed, trusted technical-document examples only.
import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const base=path.join(root,"demo","documents");
const specs=[
 {id:"gallery",file:"index.html",title:"技术文档 HTML 示例集",article:false},
 {id:"project-analysis",file:"project-analysis.html",title:"AI 内容生产平台项目分析报告",article:true},
 {id:"architecture-design",file:"architecture-design.html",title:"异步任务编排与断点恢复架构设计方案",article:true},
 {id:"implementation-plan",file:"implementation-plan.html",title:"技术实施方案",article:true},
 {id:"test-acceptance",file:"test-acceptance.html",title:"测试与验收方案",article:true}
];
const capture=process.argv.includes("--update-previews");
const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(fs.existsSync);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function check(label,value,valid){if(!valid)throw Error(label+": "+JSON.stringify(value));}
async function main(){
 if(!chrome)throw Error("Chrome/Edge not found");
 if(capture)fs.mkdirSync(path.join(base,"assets"),{recursive:true});
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"gen-ui-docs-"));
 const listener=net.createServer();await new Promise(r=>listener.listen(0,"127.0.0.1",r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const proc=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking","--no-first-run","--remote-debugging-address=127.0.0.1","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"],{stdio:"ignore",windowsHide:true});
 let socket;
 try{
  let pages;for(let i=0;i<120;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){pages=await r.json();break;}}catch{}await sleep(100);}
  check("Chrome CDP startup",pages,Array.isArray(pages));
  const page=pages.find(x=>x.type==="page");socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
  const pending=new Map();let seq=0;
  socket.addEventListener("message",e=>{const m=JSON.parse(e.data);if(!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);});
  const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evalPage=async(expression)=>{const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
  await cmd("Page.enable");await cmd("Runtime.enable");
  const results=[];
  for(const width of [1440,768,375]){
   await cmd("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:width===375});
   for(const spec of specs){
    await cmd("Page.navigate",{url:pathToFileURL(path.join(base,spec.file)).href});
    let state;
    for(let i=0;i<90;i++){try{state=await evalPage("(()=>({ready:document.readyState==='complete',title:document.title,h1:document.querySelector('h1')?.innerText||'',overflow:document.documentElement.scrollWidth>innerWidth+2,sections:document.querySelectorAll('main h2').length,toc:document.querySelectorAll('.toc-list a').length,svg:document.querySelectorAll('svg[role=img]').length,tables:document.querySelectorAll('table').length,code:document.querySelectorAll('pre code').length,copies:document.querySelectorAll('.copy-code').length,remote:[...document.querySelectorAll('script[src],link[href],img[src]')].filter(x=>/^(https?:)?\\/\\//i.test(x.getAttribute('src')||x.getAttribute('href')||'')).length,metrics:document.querySelectorAll('.metrics,.metric,.app').length}))()");if(state.ready&&state.h1)break;}catch{}await sleep(100);}
    check("page ready "+width+" "+spec.id,state,state?.ready&&state.h1&&state.title.includes(spec.title)&&!state.overflow&&state.remote===0);
    if(spec.article){
     check("document structure "+spec.id,state,state.sections>=7&&state.toc===state.sections*2&&state.svg>=1&&state.tables>=2&&state.code>=1&&state.copies===state.code&&state.metrics===0);
     const zoom=await evalPage("(()=>{const d=document.querySelector('[data-diagram]'),label=d.querySelector('[data-zoom-label]');d.querySelector('[data-zoom-in]').click();const increased=label.textContent;d.querySelector('[data-fit]').click();return{increased,reset:label.textContent}})()");
     check("diagram controls "+spec.id,zoom,zoom.increased==="115%"&&zoom.reset==="100%");
     if(capture&&width===1440){
      await sleep(250);
      const shot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
      const file=path.join(base,"assets",spec.id+"-preview.png");fs.writeFileSync(file,Buffer.from(shot.data,"base64"));
      check("preview image "+spec.id,{file,size:fs.statSync(file).size},fs.statSync(file).size>8000);
     }
    }
    results.push({width,id:spec.id,sections:state.sections,overflow:state.overflow});
   }
  }
  console.log(JSON.stringify({result:"PASS",documents:4,viewportScenarios:results.length,results,captured:capture?4:0}));
 }finally{try{socket?.close();}catch{}proc.kill();await sleep(200);fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100});}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
