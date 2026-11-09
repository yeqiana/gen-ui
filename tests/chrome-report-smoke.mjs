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
const screenshotDir=process.env.GEN_UI_VISUAL_CAPTURE_DIR;
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
      await until(()=>evaluate("document.readyState==='complete'&&document.querySelectorAll('#report-rows tr').length===10"),"页面初始化");
    }
    await send("Page.enable");await send("Runtime.enable");
    const evidence={source:"demo/report.html",generatedByAgent:false,
      environment:"trusted local Chrome",observedAt:new Date().toISOString(),viewports:{}};
    for(const width of [375,768,1440]){
      await reset(width);
      const view=await evaluate("(()=>{const spans=[...document.querySelectorAll('#report-rows .clip')],buttons=[...document.querySelectorAll('#report-rows button')];return {width:innerWidth,rows:document.querySelectorAll('#report-rows tr').length,extraFocus:spans.filter(s=>s.tabIndex===0&&s.scrollWidth<=s.clientWidth).length,missingFocus:spans.filter(s=>s.tabIndex!==0&&s.scrollWidth>s.clientWidth).length,buttons:buttons.length,uniqueLabels:new Set(buttons.map(b=>b.getAttribute('aria-label'))).size,documentOverflow:document.documentElement.scrollWidth>innerWidth}})()");
      check("表格/"+width,view,view.rows===10&&!view.extraFocus&&!view.missingFocus&&view.buttons===view.uniqueLabels&&!view.documentOverflow);
      evidence.viewports[width]=view;
      const nav=await evaluate("(()=>{const toggle=document.getElementById('toggle-sidebar'),aside=document.getElementById('report-sidebar'),app=document.querySelector('[data-report-app]');const bg=getComputedStyle(aside).backgroundColor,inside=aside.contains(toggle);toggle.click();const primary=[...aside.querySelectorAll('.nav-list > li:not(.sub) > a')],labels=[...aside.querySelectorAll('.nav-label')];const collapsed={state:app.dataset.sidebarCollapsed,width:aside.getBoundingClientRect().width,visible:getComputedStyle(aside).display!=='none',labelsHidden:labels.every(x=>getComputedStyle(x).display==='none'),subnavHidden:[...aside.querySelectorAll('.nav-list .sub')].every(x=>getComputedStyle(x).display==='none'),iconsVisible:primary.length===3&&primary.every(a=>getComputedStyle(a.querySelector('img')).display!=='none'),toggleVisible:getComputedStyle(toggle).display!=='none'&&toggle.getBoundingClientRect().width>0,expanded:toggle.getAttribute('aria-expanded')};toggle.click();const restored=app.dataset.sidebarCollapsed!=='true'&&toggle.getAttribute('aria-expanded')==='true';return{bg,inside,collapsed,restored}})()");
      check("图标栏折叠/"+width,nav,nav.bg==="rgb(255, 255, 255)"&&nav.inside&&nav.collapsed.visible&&nav.collapsed.width>40&&nav.collapsed.width<=80&&nav.collapsed.labelsHidden&&nav.collapsed.subnavHidden&&nav.collapsed.iconsVisible&&nav.collapsed.toggleVisible&&nav.collapsed.expanded==="false"&&nav.restored);
      evidence.viewports[width].sidebar=nav;
      const composition=await evaluate("(()=>{const h=document.querySelector('.page-heading h1'),svg=document.querySelector('.overview-story #flow-svg');return{noSubtitle:!h.nextElementSibling,flowInline:!!svg,flowAccessible:!!svg?.querySelector('title')&&!!svg?.querySelector('desc'),hasExplanation:!!document.querySelector('.overview-copy p'),icons:document.querySelectorAll('.section-icon').length,emoji:document.querySelectorAll('.section-emoji').length}})()");
      check("图文布局与标题层级/"+width,composition,composition.noSubtitle&&composition.flowInline&&composition.flowAccessible&&composition.hasExplanation&&composition.icons===3&&composition.emoji===0);
      evidence.viewports[width].composition=composition;
      const brand=await evaluate("(()=>{const imgs=[document.querySelector('#report-sidebar .brand img'),document.querySelector('.eyebrow .heading-mark'),document.querySelector('.page-footer img')];return{items:imgs.map(el=>({src:el?.getAttribute('src'),loaded:!!(el?.complete&&el?.naturalWidth>0),width:el?.getBoundingClientRect().width})),favicon:document.querySelector('link[rel=icon]')?.getAttribute('href')}})()");
      check("品牌标识一致性/"+width,brand,brand.items.length===3&&brand.items.every(item=>item.src==="../assets/icons/gen-ui-mark.svg"&&item.loaded&&item.width>=16)&&brand.favicon==="../assets/icons/gen-ui-mark.svg");
      evidence.viewports[width].brand=brand;
      if(screenshotDir){fs.mkdirSync(screenshotDir,{recursive:true});const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(screenshotDir,"report-"+width+".png"),Buffer.from(shot.data,"base64"));}

    }


    // Verify the exact theme and a real browser copy gesture, not only static markup.
    await reset(1440);
    const codeStyle=await evaluate("(()=>{document.getElementById('tab-rules').click();const pre=document.querySelector('.code-example pre'),code=pre?.querySelector('code'),button=pre?.querySelector('.code-copy'),style=code&&getComputedStyle(code),root=getComputedStyle(document.documentElement);return{pre:!!pre,button:!!button,body:getComputedStyle(document.body).fontSize,code:style?.fontSize,bg:root.getPropertyValue('--background').trim(),fg:root.getPropertyValue('--foreground').trim(),accent:root.getPropertyValue('--accent').trim(),noExtra:!document.querySelector('.external-action,[target=_blank]')}})()");
    check("统一主题与 Markdown 代码块",codeStyle,codeStyle.pre&&codeStyle.button&&codeStyle.body==="14px"&&codeStyle.code==="12px"&&codeStyle.bg==="#FFFFFF"&&codeStyle.fg==="#1A1C1F"&&codeStyle.accent==="#3A83F7"&&codeStyle.noExtra);
    evidence.codeStyle=codeStyle;
    const copyPoint=await evaluate("(()=>{const btn=document.querySelector('.code-example .code-copy');btn.scrollIntoView({block:'center',behavior:'instant'});const r=btn.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,visible:r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight}})()");
    check("代码复制按钮可见",copyPoint,copyPoint.visible);
    await send("Input.dispatchMouseEvent",{type:"mousePressed",x:copyPoint.x,y:copyPoint.y,button:"left",clickCount:1});
    await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:copyPoint.x,y:copyPoint.y,button:"left",clickCount:1});
    await sleep(250);
    const copyStatus=await evaluate("(()=>({label:document.querySelector('.code-example .code-copy')?.textContent,feedback:document.querySelector('.code-example [role=status]')?.textContent}))()");
    check("离线一键复制真实交互",copyStatus,copyStatus.label==="已复制"&&copyStatus.feedback.includes("已复制"));
    evidence.codeCopy=copyStatus;

    await reset(1440);
    const updatedUI=await evaluate("(()=>{const flow=document.getElementById('flow-svg'),canvas=document.getElementById('flow-canvas');const original=flow.getAttribute('viewBox');document.getElementById('flow-zoom-in').click();const zoomed=flow.getAttribute('viewBox');document.getElementById('flow-fit').click();const fitted=flow.getAttribute('viewBox');canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));const panned=flow.getAttribute('viewBox');document.getElementById('flow-fit').click();const pages=document.querySelectorAll('#page-numbers .page-number');const before={total:pages.length,active:document.querySelector('#page-numbers [aria-current=page]')?.textContent,rows:document.querySelectorAll('#report-rows tr').length};pages[1].click();const second=document.querySelector('#report-rows tr')?.dataset.recordId;document.getElementById('page-jump-input').value='7';document.getElementById('page-go').click();const last={rows:document.querySelectorAll('#report-rows tr').length,first:document.querySelector('#report-rows tr')?.dataset.recordId,active:document.querySelector('#page-numbers [aria-current=page]')?.textContent};const bars=new Set([...document.querySelectorAll('#bar svg rect[fill]')].map(x=>x.getAttribute('fill')));const pie=[...document.querySelectorAll('#pie svg circle[stroke]')].map(x=>x.getAttribute('stroke'));const metric=getComputedStyle(document.querySelector('.metric'));const tag=getComputedStyle(document.querySelector('#report-rows .status'));return{flow:{original,zoomed,fitted,panned},pager:{before,second,last},charts:{barColors:bars.size,pieColors:pie},theme:{cardBorder:metric.borderTopStyle,cardRadius:metric.borderRadius,tagBackground:tag.backgroundColor}}})()");
    check("十条分页/卡片/彩色SVG/流程缩放",updatedUI,updatedUI.flow.zoomed!==updatedUI.flow.original&&updatedUI.flow.fitted===updatedUI.flow.original&&updatedUI.flow.panned!==updatedUI.flow.original&&updatedUI.pager.before.rows===10&&updatedUI.pager.before.total>=5&&updatedUI.pager.before.active==="1"&&updatedUI.pager.second==="T-011"&&updatedUI.pager.last.rows===7&&updatedUI.pager.last.first==="T-061"&&updatedUI.pager.last.active==="7"&&updatedUI.charts.barColors>=4&&updatedUI.charts.pieColors.includes("#67c23a")&&updatedUI.charts.pieColors.includes("#f56c6c")&&updatedUI.theme.cardBorder==="solid");
    evidence.refresh=updatedUI;
    const dragBox=await evaluate("(()=>{const r=document.getElementById('flow-canvas').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()");
    const dragBefore=await evaluate("document.getElementById('flow-svg').getAttribute('viewBox')");
    await send("Input.dispatchMouseEvent",{type:"mousePressed",x:dragBox.x,y:dragBox.y,button:"left",clickCount:1});
    await send("Input.dispatchMouseEvent",{type:"mouseMoved",x:dragBox.x+48,y:dragBox.y+12,button:"left",buttons:1});
    await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:dragBox.x+48,y:dragBox.y+12,button:"left",clickCount:1});
    const dragAfter=await evaluate("document.getElementById('flow-svg').getAttribute('viewBox')");
    check("SVG指针拖动平移",{dragBefore,dragAfter},dragBefore!==dragAfter);
    evidence.flowDrag={dragBefore,dragAfter};
    await evaluate("document.getElementById(\'flow-fit\').click()");
    const fullBox=await evaluate("(()=>{const r=document.getElementById('flow-fullscreen').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()");
    await send("Input.dispatchMouseEvent",{type:"mousePressed",x:fullBox.x,y:fullBox.y,button:"left",clickCount:1});
    await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:fullBox.x,y:fullBox.y,button:"left",clickCount:1});
    await sleep(180);
    const full=await evaluate("(()=>({native:document.fullscreenElement?.id==='flow-panel',fallback:document.getElementById('flow-panel').classList.contains('is-fullscreen'),expanded:document.getElementById('flow-fullscreen').getAttribute('aria-pressed')}))()");
    check("离线流程图全屏",full,(full.native||full.fallback)&&full.expanded==="true");
    if(screenshotDir){const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(screenshotDir,"flow-fullscreen-1440.png"),Buffer.from(shot.data,"base64"));}
    await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    await sleep(180);
    const exited=await evaluate("(()=>({native:document.fullscreenElement?.id==='flow-panel',fallback:document.getElementById('flow-panel').classList.contains('is-fullscreen'),expanded:document.getElementById('flow-fullscreen').getAttribute('aria-pressed')}))()");
    check("Esc退出流程全屏",exited,!exited.native&&!exited.fallback&&exited.expanded==="false");
    evidence.flowFullscreen={entered:full,exited};

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
