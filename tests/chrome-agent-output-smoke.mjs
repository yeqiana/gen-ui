#!/usr/bin/env node
// Browser checks only the explicitly generated, locally controlled GEN-UI evaluation files.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import {spawn} from "node:child_process";
import {pathToFileURL} from "node:url";
const flags=Object.fromEntries(process.argv.slice(2).reduce((out,x,i,a)=>{if(i%2===0)out.push([x,a[i+1]]);return out},[]));
const id=flags["--case"],file=path.resolve(flags["--input"]||""),out=path.resolve(flags["--report"]||"");
if(!["HTML02","HTML03","HTML04"].includes(id)||!fs.existsSync(file)||!flags["--report"])throw Error("Required --case HTML02|HTML03|HTML04 --input HTML --report JSON");
const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"].filter(Boolean).find(fs.existsSync);
if(!chrome)throw Error("Chrome/Edge not found");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const listener=net.createServer();await new Promise(r=>listener.listen(0,"127.0.0.1",r));const port=listener.address().port;await new Promise(r=>listener.close(r));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-agent-browser-"));
const child=spawn(chrome,["--headless=new","--disable-extensions","--disable-gpu","--disable-background-networking","--remote-debugging-address=127.0.0.1","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,pathToFileURL(file).href],{stdio:"ignore",windowsHide:true});
const evidence={case:id,producer:"ChatGPT GPT-6 via WebCodex Runner",localCodexCliUsed:false,at:new Date().toISOString(),viewports:{},checks:{},runtimeErrors:[]};
let socket;
const check=(name,value,condition)=>{if(!condition)throw Error(name+": "+JSON.stringify(value));evidence.checks[name]=value};
try{
 let targets;
 for(let i=0;i<90;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){targets=await r.json();break}}catch{}await sleep(100)}
 if(!targets)throw Error("Chrome CDP did not start");
 const tab=targets.find(x=>x.type==="page");if(!tab)throw Error("No page");
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true})});
 let seq=0;const pending=new Map();
 socket.addEventListener("message",event=>{const m=JSON.parse(event.data);
  if(m.method==="Runtime.exceptionThrown")evidence.runtimeErrors.push(m.params?.exceptionDetails?.text||"JS exception");
  const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 const evalJS=async expression=>{const x=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(x.exceptionDetails)throw Error("JS eval: "+x.exceptionDetails.text);return x.result.value};
 await send("Page.enable");await send("Runtime.enable");
 for(const width of [375,768,1440]){
  await send("Emulation.setDeviceMetricsOverride",{width,height:820,deviceScaleFactor:1,mobile:width===375});
  await send("Page.navigate",{url:pathToFileURL(file).href});await sleep(280);
  const m=await evalJS("(()=>({width:innerWidth,rows:document.querySelectorAll('tbody tr').length,outerOverflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,nowrap:getComputedStyle(document.querySelector('th')).whiteSpace,sticky:getComputedStyle(document.querySelector('td:first-child')).position,innerScroll:[...document.querySelectorAll('.table-scroll,.scroll')].some(e=>e.scrollWidth>e.clientWidth)}))()");
  if(m.rows!==20||m.outerOverflow||m.h1!==1||m.nowrap!=="nowrap"||m.sticky!=="sticky")throw Error("Viewport "+width+" invalid: "+JSON.stringify(m));
  evidence.viewports[width]=m;
 }
 if(id==="HTML02"){
  await send("Emulation.setDeviceMetricsOverride",{width:375,height:820,deviceScaleFactor:1,mobile:true});
  await send("Page.navigate",{url:pathToFileURL(file).href});await sleep(280);
  const small=await evalJS("(()=>{const e=[...document.querySelectorAll('#tbody .clip')].find(x=>x.scrollWidth>x.clientWidth+1);if(!e)return{found:false};e.dispatchEvent(new MouseEvent('mouseenter'));const t=document.querySelector('#tooltip'),b=t.getBoundingClientRect();const visible=getComputedStyle(t).display!=='none';window.dispatchEvent(new Event('scroll'));return{found:true,visible,withinViewport:b.left>=0&&b.right<=innerWidth+1&&b.top>=0&&b.bottom<=innerHeight+1,hiddenOnScroll:getComputedStyle(t).display==='none'}})()");
  check("mobile-tooltip-no-overflow",small,small.found&&small.visible&&small.withinViewport&&small.hiddenOnScroll);
 }
 await send("Emulation.setDeviceMetricsOverride",{width:1440,height:820,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:pathToFileURL(file).href});await sleep(270);
 if(id==="HTML02"){
  const paging=await evalJS("(()=>{const first=document.querySelectorAll('#tbody tr').length;document.querySelector('#next').click();return{first,second:document.querySelectorAll('#tbody tr').length,info:document.querySelector('#page-info').textContent}})()");
  check("pagination",paging,paging.first===20&&paging.second===16);
  const all=await evalJS("(()=>{const s=document.querySelector('#module');s.value='all';s.dispatchEvent(new Event('change',{bubbles:true}));return{count:document.querySelector('#filtered-count').textContent,rows:document.querySelectorAll('#tbody tr').length,onlyAll:[...document.querySelectorAll('#tbody tr')].every(x=>x.children[1].textContent==='all')}})()");
  check("real-all-module",all,all.count==="12"&&all.rows===12&&all.onlyAll);
  const focus=await evalJS("(()=>{document.querySelector('#reset').click();const list=[...document.querySelectorAll('#tbody .clip')];return{truncated:list.filter(e=>e.scrollWidth>e.clientWidth+1).length,invalidTab:list.filter(e=>e.scrollWidth<=e.clientWidth+1&&e.tabIndex===0).length,missingTab:list.filter(e=>e.scrollWidth>e.clientWidth+1&&e.tabIndex!==0).length}})()");
  check("keyboard-clipped-only",focus,focus.truncated>0&&focus.invalidTab===0&&focus.missingTab===0);
  const tooltip=await evalJS("(()=>{const e=[...document.querySelectorAll('#tbody .clip')].find(x=>x.scrollWidth>x.clientWidth+1);e.dispatchEvent(new MouseEvent('mouseenter'));const t=document.querySelector('#tooltip'),b=t.getBoundingClientRect();const visible=getComputedStyle(t).display!=='none';document.querySelector('#scroll').dispatchEvent(new Event('scroll'));return{visible,insideViewport:b.left>=0&&b.right<=innerWidth+1,hiddenOnScroll:getComputedStyle(t).display==='none'}})()");
  check("tooltip",tooltip,tooltip.visible&&tooltip.insideViewport&&tooltip.hiddenOnScroll);
 }else if(id==="HTML03"){
  const initial=await evalJS("(()=>({count:document.querySelector('#rows').children.length,total:document.querySelector('#total').textContent,uniqueDetailLabels:new Set([...document.querySelectorAll('#rows button')].map(b=>b.getAttribute('aria-label'))).size,external:[...document.querySelectorAll('a[target=_blank]')].map(a=>({text:a.textContent,rel:a.rel}))}))()");
  check("initial-and-accessible-detail",initial,initial.count===20&&initial.total==="24"&&initial.uniqueDetailLabels===20);
  const tabs=await evalJS("(()=>{const t=document.querySelector('#tab-records');t.click();const clicked=t.getAttribute('aria-selected')==='true'&&!document.querySelector('#panel-records').hidden;t.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));return{clicked,keyboard:document.querySelector('#tab-overview').getAttribute('aria-selected')==='true',focused:document.activeElement.id}})()");
  check("tabs-and-keyboard",tabs,tabs.clicked&&tabs.keyboard&&tabs.focused==="tab-overview");
  const invalid=await evalJS("(()=>{document.querySelector('#new').click();document.querySelector('#new-id').value='NEW-025';document.querySelector('#new-name').value='';document.querySelector('#new-group').value='测试';document.querySelector('#create-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return{open:document.querySelector('#create-dialog').open,id:document.querySelector('#new-id').value,group:document.querySelector('#new-group').value,error:document.querySelector('#error-name').textContent,focus:document.activeElement.id}})()");
  check("invalid-preserve-valid-fields",invalid,invalid.open&&invalid.id==="NEW-025"&&invalid.group==="测试"&&invalid.error.length>0&&invalid.focus==="new-name");
  const created=await evalJS("(()=>{document.querySelector('#new-name').value='补充记录';document.querySelector('#create-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return{open:document.querySelector('#create-dialog').open,total:document.querySelector('#total').textContent,feedback:document.querySelector('#feedback').textContent,ids:[...document.querySelectorAll('#rows tr')].map(x=>x.children[0].textContent),page:document.querySelector('#page-info').textContent}})()");
  check("added-record-visible",created,!created.open&&created.total==="25"&&created.feedback.includes("NEW-025")&&created.ids.includes("NEW-025")&&created.page.includes("第 2 / 2 页"));
  const drawer=await evalJS("(async()=>{const b=document.querySelector('#rows button');b.click();const d=document.querySelector('#detail-dialog'),opened=d.open,details=document.querySelector('#detail-fields').textContent;document.querySelector('#close-detail').click();await new Promise(r=>setTimeout(r,40));return{opened,details,closed:!d.open,focusReturned:document.activeElement===b}})()");
  check("drawer-and-focus",drawer,drawer.opened&&drawer.details.includes("编号")&&drawer.closed&&drawer.focusReturned);
 }else if(id==="HTML04"){
  const initial=await evalJS("(()=>({total:document.querySelector('#total').textContent,passed:document.querySelector('#passed').textContent,failed:document.querySelector('#failed').textContent,pending:document.querySelector('#pending').textContent,rows:document.querySelectorAll('#rows tr').length}))()");
  check("initial-counts",initial,initial.total==="39"&&initial.passed==="13"&&initial.failed==="13"&&initial.pending==="13"&&initial.rows===20);
  const module=await evalJS("(()=>{const s=document.querySelector('#module');s.value='网关';s.dispatchEvent(new Event('change',{bubbles:true}));return{total:document.querySelector('#total').textContent,passed:document.querySelector('#passed').textContent,failed:document.querySelector('#failed').textContent,bar:document.querySelector('#bar-passed').style.width,rows:document.querySelectorAll('#rows tr').length}})()");
  check("module-filter-chart",module,module.total==="13"&&module.passed==="13"&&module.failed==="0"&&module.bar==="100%"&&module.rows===13);
  const empty=await evalJS("(()=>{const s=document.querySelector('#status');s.value='失败';s.dispatchEvent(new Event('change',{bubbles:true}));return{count:document.querySelector('#total').textContent,emptyVisible:!document.querySelector('#empty').hidden,rows:document.querySelectorAll('#rows tr').length}})()");
  check("empty-filter",empty,empty.count==="0"&&empty.emptyVisible&&empty.rows===0);
  const paging=await evalJS("(()=>{document.querySelector('#clear').click();const first=document.querySelectorAll('#rows tr').length;document.querySelector('#next').click();const second=document.querySelectorAll('#rows tr').length;const p=document.querySelector('#page-size');p.value='50';p.dispatchEvent(new Event('change',{bubbles:true}));return{first,second,all:document.querySelectorAll('#rows tr').length}})()");
  check("pagination",paging,paging.first===20&&paging.second===19&&paging.all===39);
  const search=await evalJS("(()=>{document.querySelector('#search').value='QA-039';document.querySelector('#search').dispatchEvent(new Event('input',{bubbles:true}));return{count:document.querySelector('#total').textContent,id:document.querySelector('#rows tr td')?.textContent}})()");
  check("search",search,search.count==="1"&&search.id==="QA-039");
 }
 check("no-runtime-exceptions",{count:evidence.runtimeErrors.length},evidence.runtimeErrors.length===0);
 evidence.result="pass";
 console.log("AGENT_CHROME_PASS="+JSON.stringify({case:id,viewports:Object.keys(evidence.viewports),checks:Object.keys(evidence.checks)}));
}catch(error){evidence.result="fail";evidence.error=String(error.stack||error);console.error("AGENT_CHROME_FAIL="+evidence.error);process.exitCode=1;
}finally{
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(evidence,null,2)+"\n","utf8");
 if(socket)socket.close();child.kill();await sleep(160);try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:2,retryDelay:200})}catch{}
}
