#!/usr/bin/env node
// Chrome regression of trusted repo demo only; never run arbitrary agent HTML here.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import {spawn} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const url=pathToFileURL(path.join(root,"demo/report.html")).href;
const binaries=[
  process.env.GEN_UI_CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium"
].filter(Boolean);
const chrome=binaries.find(s=>fs.existsSync(s));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function check(label,actual,valid){if(!valid)throw Error(label+"："+JSON.stringify(actual));}
async function until(fn,label){for(let i=0;i<100;i++){try{const v=await fn();if(v)return v}catch{}await sleep(100)}throw Error("超时："+label)}
async function run(){
  if(!chrome)throw Error("当前系统未安装 Chrome 或 Edge");
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-browser-test-"));
  const server=net.createServer();
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  const port=server.address().port;
  await new Promise(r=>server.close(r));
  const child=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions",
    "--disable-background-networking","--remote-debugging-address=127.0.0.1",
    "--remote-allow-origins=*","--remote-debugging-port="+port,
    "--user-data-dir="+profile,url],{stdio:"ignore",windowsHide:true});
  let socket;
  try{
    const pages=await until(async()=>{
      const response=await fetch("http://127.0.0.1:"+port+"/json");
      return response.ok?response.json():null;
    },"Chrome CDP 连接");
    const page=pages.find(x=>x.type==="page");
    socket=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      socket.addEventListener("open",resolve,{once:true});
      socket.addEventListener("error",reject,{once:true});
    });
    let seq=0;
    const pending=new Map();
    socket.addEventListener("message",e=>{
      const response=JSON.parse(e.data);
      if(!pending.has(response.id))return;
      const p=pending.get(response.id);
      pending.delete(response.id);
      response.error?p.reject(Error(JSON.stringify(response.error))):p.resolve(response.result);
    });
    const send=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++seq;
      pending.set(id,{resolve,reject});
      socket.send(JSON.stringify({id,method,params}));
    });
    async function evaluate(expression){
      const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
      if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
      return r.result.value;
    }
    async function reset(width){
      await send("Emulation.setDeviceMetricsOverride",{width,height:812,deviceScaleFactor:1,mobile:width===375});
      await send("Page.navigate",{url});
      await until(()=>evaluate("document.readyState==='complete'&&document.querySelectorAll('#report-rows tr').length===20"),"页面初始化");
    }
    await send("Page.enable");await send("Runtime.enable");
    const evidence={source:"demo/report.html",generatedByAgent:false,
      environment:"trusted local Chrome",observedAt:new Date().toISOString(),viewports:{}};
    for(const width of [375,768,1440]){
      await reset(width);
      const view=await evaluate("(()=>{const spans=[...document.querySelectorAll('#report-rows .clip')],buttons=[...document.querySelectorAll('#report-rows button')];return {width:innerWidth,rows:document.querySelectorAll('#report-rows tr').length,extraFocus:spans.filter(s=>s.tabIndex===0&&s.scrollWidth<=s.clientWidth).length,missingFocus:spans.filter(s=>s.tabIndex!==0&&s.scrollWidth>s.clientWidth).length,buttons:buttons.length,uniqueLabels:new Set(buttons.map(b=>b.getAttribute('aria-label'))).size,documentOverflow:document.documentElement.scrollWidth>innerWidth}})()");
      check("表格/"+width,view,view.rows===20&&!view.extraFocus&&!view.missingFocus&&view.buttons===view.uniqueLabels&&!view.documentOverflow);
      evidence.viewports[width]=view;
      const nav=await evaluate("(()=>{const toggle=document.getElementById('toggle-sidebar'),aside=document.getElementById('report-sidebar');const bg=getComputedStyle(aside).backgroundColor;toggle.click();const hidden=getComputedStyle(aside).display==='none'&&toggle.getAttribute('aria-expanded')==='false';toggle.click();const restored=getComputedStyle(aside).display!=='none'&&toggle.getAttribute('aria-expanded')==='true';return {bg,hidden,restored}})()");
      check("极简导航折叠/"+width,nav,nav.bg==="rgb(250, 250, 250)"&&nav.hidden&&nav.restored);
      evidence.viewports[width].sidebar=nav;
    }
    await reset(375);
    const sentinel=await evaluate("(()=>{const d={version:'gen-ui-html-report/v1',title:'筛选测试',rows:[{id:'X-1',module:'all',status:'success',durationMs:1,batch:1},{id:'X-2',module:'网关',status:'failure',durationMs:2,batch:2}]};document.getElementById('report-json').value=JSON.stringify(d);document.getElementById('apply-json').click();const s=document.getElementById('module-filter');const values=[...s.options].map(o=>o.value);s.value='all';s.dispatchEvent(new Event('change',{bubbles:true}));const only=document.getElementById('count-total').textContent;const id=document.querySelector('#report-rows tr').dataset.recordId;document.getElementById('reset-filters').click();return {values,only,id,allCount:document.getElementById('count-total').textContent,reset:s.value}})()");
    check("模块 all",sentinel,sentinel.only==="1"&&sentinel.id==="X-1"&&sentinel.allCount==="2"&&sentinel.reset==="");
    evidence.sentinel=sentinel;
    const tooltip=await evaluate("(()=>{const full='超长模块名称'.repeat(6);const d={version:'gen-ui-html-report/v1',title:'长文本',rows:[{id:'T-1',module:full,status:'success',durationMs:3,batch:1}]};document.getElementById('report-json').value=JSON.stringify(d);document.getElementById('apply-json').click();const cell=document.querySelectorAll('#report-rows .clip')[1];const before={truncated:cell.scrollWidth>cell.clientWidth,focus:cell.tabIndex};cell.focus();const b=document.getElementById('cell-tooltip').getBoundingClientRect();cell.textContent='短';window.dispatchEvent(new Event('resize'));const short=cell.tabIndex;cell.textContent=full;window.dispatchEvent(new Event('resize'));return {before,short,restored:cell.tabIndex,within:b.left>=11&&b.right<=innerWidth-11}})()");
    check("长文本焦点",tooltip,tooltip.before.truncated&&tooltip.before.focus===0&&tooltip.short===-1&&tooltip.restored===0&&tooltip.within);
    evidence.tooltip=tooltip;
    await reset(1440);
    const create=await evaluate("(()=>{document.getElementById('open-create').click();for(const [id,v] of Object.entries({'new-id':'T-068','new-module':'新增模块','new-status':'success','new-duration':'35','new-batch':'5'}))document.getElementById(id).value=v;document.getElementById('create-form').requestSubmit();const last=document.querySelector('#report-rows tr:last-child');return {count:document.getElementById('count-total').textContent,last:last.dataset.recordId,focus:document.activeElement===last.querySelector('.clip'),notice:document.getElementById('page-notice').textContent}})()");
    check("新增记录",create,create.count==="68"&&create.last==="T-068"&&create.focus&&create.notice.includes("新增成功"));
    evidence.create=create;
    evidence.result="pass";
    return evidence;
  }finally{
    if(socket)socket.close();
    child.kill();
    await sleep(100);
    try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:2,retryDelay:200})}catch{}
  }
}
try{
  const args=process.argv.slice(2);
  if(args.length && (args.length!==2||args[0]!=="--report"))throw Error("用法：node tests/chrome-report-smoke.mjs [--report 路径]");
  const result=await run();
  if(args.length){const p=path.resolve(args[1]);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(result,null,2)+"\n","utf8")}
  console.log("CHROME_REPORT_SMOKE_PASS="+JSON.stringify(result));
}catch(e){console.error("CHROME_REPORT_SMOKE_FAIL="+(e.stack||e.message));process.exitCode=1}
