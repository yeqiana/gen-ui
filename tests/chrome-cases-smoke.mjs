#!/usr/bin/env node
// Fixed repository showcase only. Never browse untrusted arbitrary HTML.
import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const caseRoot=path.join(root,"demo","cases");
const specs=[
  {id:"story-workbench",file:"story-workbench.html",title:"StoryOS"},
  {id:"im-message-flow",file:"im-message-flow.html",title:"即时通信"},
  {id:"cold-archive",file:"cold-archive.html",title:"消息归档"},
  {id:"tv-launcher",file:"tv-launcher.html",title:"Android"},
  {id:"qr-audit-report",file:"qr-audit-report.html",title:"二维码"},
  {id:"gallery",file:"index.html",title:"GEN-UI"}
];
const capture=process.argv.includes("--update-previews");
const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(fs.existsSync);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(ok,why,meta){if(!ok)throw Error(why+" "+JSON.stringify(meta));}
async function run(){
  if(!chrome)throw Error("Chrome/Edge not found");
  if(capture)fs.mkdirSync(path.join(caseRoot,"assets"),{recursive:true});
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),"gen-ui-case-"));
  const listener=net.createServer();
  await new Promise(resolve=>listener.listen(0,"127.0.0.1",resolve));
  const port=listener.address().port;
  await new Promise(resolve=>listener.close(resolve));
  const proc=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking",
   "--no-first-run","--remote-debugging-address=127.0.0.1","--remote-allow-origins=*",
   "--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"],{stdio:"ignore",windowsHide:true});
  let socket;
  try{
    let pages;
    for(let i=0;i<130;i++){
      try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){pages=await r.json();break;}}catch{}
      await sleep(100);
    }
    assert(Array.isArray(pages),"CDP startup failure",{port});
    const page=pages.find(x=>x.type==="page");
    assert(page?.webSocketDebuggerUrl,"No page",{pages:pages.length});
    socket=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
    const pending=new Map();let seq=0;
    socket.addEventListener("message",event=>{
      const message=JSON.parse(event.data);
      if(!pending.has(message.id))return;
      const q=pending.get(message.id);pending.delete(message.id);
      message.error?q.reject(Error(JSON.stringify(message.error))):q.resolve(message.result);
    });
    const cmd=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
    });
    const evaluate=async(expr)=>{
      const result=await cmd("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
      return result.result.value;
    };
    await cmd("Page.enable");await cmd("Runtime.enable");
    const results=[];
    for(const width of [1440,768,375]){
      await cmd("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width===375});
      for(const item of specs){
        const target=pathToFileURL(path.join(caseRoot,item.file)).href;
        await cmd("Page.navigate",{url:target});
        let state;
        for(let i=0;i<80;i++){
          try{
            state=await evaluate("(()=>({ready:document.readyState==='complete',title:document.title,h1:!!document.querySelector('h1'),body:document.body?.innerText?.length??0,overflow:document.documentElement.scrollWidth>innerWidth+2,remote:document.querySelectorAll('script[src^=\"http\"],link[href^=\"http\"],img[src^=\"http\"]').length,images:[...document.images].map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0}))}))()");
            if(state?.ready&&state?.body>100)break;
          }catch{}
          await sleep(100);
        }
        assert(state?.ready&&state?.body>100,"Page not ready",{width,item,state});
        assert(state.title.includes(item.title),"Unexpected page title",{item,width,title:state.title});
        assert(state.h1,"Missing heading",{item,width});
        assert(!state.overflow,"Viewport horizontal overflow",{item,width});
        assert(!state.remote,"Remote content referenced",{item,width});
        if(item.id==="gallery")assert(state.images.length===5&&state.images.every(x=>x.loaded),"Gallery previews missing",{width,images:state.images});
        if(capture&&width===1440&&item.id!=="gallery"){
          const screenshot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
          const file=path.join(caseRoot,"assets",item.id+"-preview.png");
          fs.writeFileSync(file,Buffer.from(screenshot.data,"base64"));
          assert(fs.statSync(file).size>4000,"Screenshot too small",{file});
        }
        results.push({width,id:item.id,ready:true,images:state.images.length});
      }
    }
    console.log(JSON.stringify({result:"PASS",cases:5,scenarios:results.length,captured:capture?5:0}));
  } finally {
    try{socket?.close();}catch{}
    proc.kill();
    await sleep(250);
    fs.rmSync(profile,{force:true,recursive:true,maxRetries:4,retryDelay:100});
  }
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
