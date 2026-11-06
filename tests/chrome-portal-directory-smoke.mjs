#!/usr/bin/env node
// Tests a temporary portal built from the actual checked-out GEN-UI repository.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {buildPortal} from "../scripts/build-html-portal.mjs";
import {startPortalServer} from "../scripts/serve-html-portal.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const portal=path.join(root,"evals","__genui-real-dir-smoke.html");
const out=process.argv[2]==="--report"&&process.argv[3]?path.resolve(process.argv[3]):null;
const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].filter(Boolean).find(fs.existsSync);
if(!chrome)throw Error("Chrome not found");
if(fs.existsSync(portal))throw Error("Temporary portal path already exists");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const holder=net.createServer();await new Promise(r=>holder.listen(0,"127.0.0.1",r));const port=holder.address().port;await new Promise(r=>holder.close(r));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-directory-chrome-"));
let server,child,socket;
const evidence={source:"actual GEN-UI repository file tree",at:new Date().toISOString(),viewports:{},checks:{},errors:[]};
try{
 const built=buildPortal({dir:root,output:portal,title:"真实仓库目录集成"});
 evidence.sourceCount=built.sourceCount;
 server=await startPortalServer({dir:root,port:0});
 const url=server.url.replace("/index.html","/evals/__genui-real-dir-smoke.html");
 child=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking","--remote-debugging-address=127.0.0.1","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,url],{windowsHide:true,stdio:"ignore"});
 let pages;
 for(let i=0;i<90;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){pages=await r.json();break}}catch{}await sleep(100)}
 if(!pages)throw Error("Chrome unavailable");
 const page=pages.find(x=>x.type==="page");if(!page)throw Error("No page target");
 socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((res,rej)=>{socket.addEventListener("open",res,{once:true});socket.addEventListener("error",rej,{once:true})});
 let seq=0;const queue=new Map();
 socket.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.method==="Runtime.exceptionThrown")evidence.errors.push(m.params?.exceptionDetails?.text||"JS error");const p=queue.get(m.id);if(!p)return;queue.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;queue.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const evalJS=async expression=>{const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
 await cmd("Page.enable");await cmd("Runtime.enable");
 for(const width of [375,768,1440]){
   await cmd("Emulation.setDeviceMetricsOverride",{width,height:850,deviceScaleFactor:1,mobile:width===375});
   await cmd("Page.navigate",{url});await sleep(370);
   const m=await evalJS("(()=>({pages:document.querySelectorAll('.page-link').length,iframe:!!document.querySelector('#page-frame'),sandbox:document.querySelector('#page-frame')?.getAttribute('sandbox'),hasOverflow:document.documentElement.scrollWidth>innerWidth,frameSrc:document.querySelector('#page-frame')?.getAttribute('src'),readable:!!document.querySelector('#page-frame')?.contentDocument,menu:!!document.querySelector('#open-nav')}))()");
   if(m.pages!==built.sourceCount||!m.iframe||m.sandbox!=="allow-scripts allow-forms"||m.hasOverflow||!m.frameSrc||m.readable||!m.menu)throw Error("viewport "+width+": "+JSON.stringify(m));
   evidence.viewports[width]=m;
 }
 await cmd("Emulation.setDeviceMetricsOverride",{width:1440,height:850,deviceScaleFactor:1,mobile:false});
 await cmd("Page.navigate",{url});await sleep(360);
 const pageSwitch=await evalJS("(()=>{const all=[...document.querySelectorAll('.page-link')];const choice=all.find(x=>x.textContent.includes('质量状态'))??all.find(x=>x.textContent.includes('深度验收'))??all[all.length-1];const f=document.querySelector('#page-frame'),before=f.getAttribute('src');choice.click();const after=f.getAttribute('src');return{before,after,different:before!==after,selected:document.querySelectorAll('[aria-current=\"page\"]').length,externalSame:document.querySelector('#open-external').getAttribute('href')===after}})()");
 if(!pageSwitch.different||pageSwitch.selected!==1||!pageSwitch.externalSame)throw Error("page switch "+JSON.stringify(pageSwitch));
 evidence.checks.iframeSwitch=pageSwitch;
 await sleep(280);
 const targets=await cmd("Target.getTargets");const childTarget=targets.targetInfos?.find(x=>x.type==="iframe"&&x.url.includes(pageSwitch.after.split("#")[0].split("/").at(-1)));
 if(!childTarget)throw Error("iframe renderer not found for selected nested page");
 evidence.checks.nestedFrameLoaded=true;
 const collapsed=await evalJS("(()=>{const c=document.querySelector('#collapse'),app=document.querySelector('#portal'),rail=document.querySelector('#rail');const inside=rail.contains(c);c.click();const links=[...rail.querySelectorAll('.page-link')],labels=[...rail.querySelectorAll('.page-link .label')];const iconRail={collapsed:app.classList.contains('is-collapsed'),visible:getComputedStyle(rail).display!=='none',width:rail.getBoundingClientRect().width,inside,buttonVisible:c.getBoundingClientRect().width>0,labelsHidden:labels.every(x=>getComputedStyle(x).display==='none'),iconsVisible:links.length===10&&links.every(x=>getComputedStyle(x.querySelector('.nav-glyph')).display!=='none')};c.click();return{iconRail,reopened:!app.classList.contains('is-collapsed')}})()");
 if(!collapsed.iconRail.collapsed||!collapsed.iconRail.visible||collapsed.iconRail.width<=40||collapsed.iconRail.width>80||!collapsed.iconRail.inside||!collapsed.iconRail.buttonVisible||!collapsed.iconRail.labelsHidden||!collapsed.iconRail.iconsVisible||!collapsed.reopened)throw Error("icon rail interaction "+JSON.stringify(collapsed));
 evidence.checks.desktopCollapse=collapsed;
 if(evidence.errors.length)throw Error("browser runtime errors: "+evidence.errors.join(","));
 evidence.result="pass";
 console.log("COMPLEX_DIRECTORY_CHROME_PASS="+JSON.stringify({sourceCount:evidence.sourceCount,viewportWidths:Object.keys(evidence.viewports),checks:Object.keys(evidence.checks)}));
}catch(err){evidence.result="fail";evidence.error=String(err.stack||err);console.error("COMPLEX_DIRECTORY_CHROME_FAIL="+evidence.error);process.exitCode=1;
}finally{
 if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(evidence,null,2)+"\n","utf8")}
 if(socket)socket.close();if(child)child.kill();if(server)await new Promise(r=>server.server.close(r));await sleep(150);
 if(fs.existsSync(portal)&&fs.readFileSync(portal,"utf8").startsWith("<!-- GEN-UI:AUTOGENERATED"))fs.unlinkSync(portal);
 try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:2,retryDelay:150})}catch{}
}
