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
      const nav=await evaluate("(()=>{const toggle=document.getElementById('toggle-sidebar'),aside=document.getElementById('report-sidebar'),app=document.querySelector('[data-report-app]');const bg=getComputedStyle(aside).backgroundColor,inside=aside.contains(toggle);toggle.click();const primary=[...aside.querySelectorAll('.nav-list > li:not(.sub) > a')],labels=[...aside.querySelectorAll('.nav-label')];const collapsed={state:app.dataset.sidebarCollapsed,width:aside.getBoundingClientRect().width,visible:getComputedStyle(aside).display!=='none',labelsHidden:labels.every(x=>getComputedStyle(x).display==='none'),subnavHidden:[...aside.querySelectorAll('.nav-list .sub')].every(x=>getComputedStyle(x).display==='none'),iconsVisible:primary.length===[...document.querySelectorAll('#main h2')].filter(h=>!h.closest('dialog')).length&&primary.every(a=>{const icon=a.querySelector('img,svg');return icon&&getComputedStyle(icon).display!=='none'}),toggleVisible:getComputedStyle(toggle).display!=='none'&&toggle.getBoundingClientRect().width>0,expanded:toggle.getAttribute('aria-expanded')};toggle.click();const restored=app.dataset.sidebarCollapsed!=='true'&&toggle.getAttribute('aria-expanded')==='true';return{bg,inside,collapsed,restored}})()");
      check("图标栏折叠/"+width,nav,nav.bg==="rgb(255, 255, 255)"&&nav.inside&&nav.collapsed.visible&&nav.collapsed.width>40&&nav.collapsed.width<=80&&nav.collapsed.labelsHidden&&nav.collapsed.subnavHidden&&nav.collapsed.iconsVisible&&nav.collapsed.toggleVisible&&nav.collapsed.expanded==="false"&&nav.restored);
      evidence.viewports[width].sidebar=nav;
      const composition=await evaluate("(()=>{const h=document.querySelector('.page-heading h1'),svg=document.querySelector('.overview-story #flow-svg');return{noSubtitle:!h.nextElementSibling,flowInline:!!svg,flowAccessible:!!svg?.querySelector('title')&&!!svg?.querySelector('desc'),hasExplanation:!!document.querySelector('.overview-copy p'),icons:document.querySelectorAll('#main .section-icon').length,emoji:document.querySelectorAll('.section-emoji').length}})()");
      check("图文布局与标题层级/"+width,composition,composition.noSubtitle&&composition.flowInline&&composition.flowAccessible&&composition.hasExplanation&&composition.icons===3&&composition.emoji===0);
      evidence.viewports[width].composition=composition;
      const brand=await evaluate("(()=>{const imgs=[document.querySelector('#report-sidebar .brand img'),document.querySelector('.eyebrow .heading-mark'),document.querySelector('.page-footer img')];return{items:imgs.map(el=>({src:el?.getAttribute('src'),loaded:!!(el?.complete&&el?.naturalWidth>0),width:el?.getBoundingClientRect().width})),favicon:document.querySelector('link[rel=icon]')?.getAttribute('href')}})()");
      check("品牌标识一致性/"+width,brand,brand.items.length===3&&brand.items.every(item=>item.src==="../assets/icons/gen-ui-mark.svg"&&item.loaded&&item.width>=16)&&brand.favicon==="../assets/icons/gen-ui-mark.svg");
      evidence.viewports[width].brand=brand;

      const cases=await evaluate("(()=>{const list=[...document.querySelectorAll('#showcase .case-block')],links=[...document.querySelectorAll('.case-directory a')];return {caseCount:list.length,linkCount:links.length,anchors:links.every(a=>document.getElementById(a.hash.slice(1))),hasBeforeAfter:!!document.querySelector('#case-answer .before-after'),hasCode:!!document.querySelector('#case-review pre code.language-sql'),hasEvidence:!!document.querySelector('#case-test table'),hasCoverage:document.querySelectorAll('#case-features tbody tr').length,hasDocs:document.querySelectorAll('#case-guide .doc-link-grid a').length}})()");
      check("信息重构全能力案例/"+width,cases,cases.caseCount===10&&cases.linkCount===10&&cases.anchors&&cases.hasBeforeAfter&&cases.hasCode&&cases.hasEvidence&&cases.hasCoverage>=10&&cases.hasDocs===4);
      evidence.viewports[width].showcase=cases;
      await evaluate("[...document.querySelectorAll('#diagram-type-gallery details')].forEach(d=>d.open=true)");
      await sleep(220);
      const geometry=await evaluate("(()=>{\n const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;\n return [...document.querySelectorAll('#diagram-type-gallery [data-semantic-diagram]')].map(host=>{\n  const svg=host.querySelector('svg.semantic-svg');\n  const labels=[...svg.querySelectorAll('.semantic-edge-chip')].filter(x=>x.getBoundingClientRect().width>0&&!x.classList.contains('is-hidden'));\n  const nodes=[...svg.querySelectorAll('.semantic-node-shape,.semantic-actor>rect')].filter(x=>x.getBoundingClientRect().width>0);\n  const overlaps=[];\n  labels.forEach((chip,i)=>{\n   const bg=chip.querySelector('.semantic-edge-label-bg').getBoundingClientRect(),t=chip.querySelector('text').getBoundingClientRect();\n   if(chip.dataset.layoutOk!=='true')overlaps.push({kind:'unplaced',id:chip.dataset.id});\n   if(t.left<bg.left-2||t.right>bg.right+2)overlaps.push({kind:'text-overflow',id:chip.dataset.id});\n   nodes.forEach((n,j)=>{if(hit(bg,n.getBoundingClientRect()))overlaps.push({kind:'label-node',id:chip.dataset.id,node:j});});\n   labels.slice(i+1).forEach(other=>{if(hit(bg,other.querySelector('.semantic-edge-label-bg').getBoundingClientRect()))overlaps.push({kind:'label-label',id:chip.dataset.id,other:other.dataset.id});});\n  });\n  const stage=host.querySelector('.semantic-stage');\n  return{type:host.dataset.semanticDiagram,labels:labels.length,overlaps,overflow:stage.scrollWidth>stage.clientWidth+2};\n });\n})()");
      check("可视坐标标签避让/"+width,geometry,geometry.length===7&&geometry.every(x=>x.overlaps.length===0));
      evidence.viewports[width].diagramGeometry=geometry;
      if(width===375){const mobileRead=await evaluate("(()=>{\nconst host=document.querySelector('[data-semantic-diagram=deploy]'),s=host.querySelector('.semantic-shell'),stage=s.querySelector('.semantic-stage'),btn=s.querySelector('[data-action=read]'),fit=s.querySelector('[data-action=fit]'),zoom=s.querySelector('[data-zoom]');\nconst before=zoom.textContent,scrollBefore=stage.scrollWidth-stage.clientWidth;btn.click();const during=zoom.textContent,pressed=btn.getAttribute('aria-pressed');fit.click();return{before,during,pressed,after:zoom.textContent,scrollBefore,scrollAfter:stage.scrollWidth-stage.clientWidth};\n})()");check("移动端无水平滚动且支持聚焦阅读",mobileRead,geometry.every(x=>!x.overflow)&&mobileRead.scrollBefore<=2&&mobileRead.pressed==="true"&&parseInt(mobileRead.during,10)>100&&mobileRead.after==="100%");evidence.viewports[width].reading=mobileRead;}
      if(screenshotDir&&width===1440){
        await evaluate("(()=>{document.documentElement.style.scrollBehavior='auto'; const y=document.getElementById('showcase').getBoundingClientRect().top+scrollY-8;window.scrollTo({top:y,behavior:'instant'});})()");
        await sleep(160);
        const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
        fs.writeFileSync(path.join(screenshotDir,"report-information-design-preview.png"),Buffer.from(shot.data,"base64"));
      }

      if(screenshotDir){fs.mkdirSync(screenshotDir,{recursive:true});const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(screenshotDir,"report-"+width+".png"),Buffer.from(shot.data,"base64"));}

    }


    // Verify the exact theme and a real browser copy gesture, not only static markup.
    await reset(1440);

    const round4=await evaluate("(()=>{const nav=document.querySelector('#report-sidebar .genui-tree'),count=level=>nav.querySelectorAll('.genui-nav-level-'+level).length;const levels=[count(1),count(2),count(3)];const fold=nav.querySelector('.genui-nav-level-1>.genui-nav-fold');const group=fold?.parentNode.querySelector(':scope > .genui-nav-children');const initial=group&&!group.hidden;fold?.click();const closed=group?.hidden===true;fold?.click();const reopened=group?.hidden===false;const pic=document.querySelector('img[data-zoomable]');pic?.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));const overlay=document.querySelector('.genui-image-overlay'),stage=overlay?.querySelector('.genui-image-stage'),value=overlay?.querySelector('[data-image-percent]');const open=!!overlay&&!overlay.hidden&&getComputedStyle(overlay).position==='fixed';const baseline=value?.textContent;stage?.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true}));const wheel=value?.textContent;overlay?.querySelector('[data-image-plus]')?.click();const plus=value?.textContent;overlay?.querySelector('[data-image-close]')?.click();const exit=overlay?.hidden;const state=document.querySelector('#report-rows .status'),r=document.querySelector('#report-rows td[data-compare-status]');const icons=['reset-filters','page-go','open-create','open-data-drawer'].every(id=>{const b=document.getElementById(id);return !!b?.querySelector('svg')&&!!b.getAttribute('aria-label')});return{levels,initial,closed,reopened,image:{open,baseline,wheel,plus,exit},status:getComputedStyle(state,'::before').content,compare:r?.dataset.compareStatus,buttons:icons,time:document.getElementById('generated-at').textContent}})()");
    check("第四轮三级导航、图标、时间、状态和图片真实浏览器交互",round4,round4.levels.every(n=>n>0)&&round4.initial&&round4.closed&&round4.reopened&&round4.image.open&&round4.image.baseline==="100%"&&round4.image.wheel!=="100%"&&round4.image.plus!==round4.image.wheel&&round4.image.exit&&["normal","none"].includes(round4.status)&&round4.compare&&round4.buttons&&!round4.time.includes("+08:00"));
    evidence.fourthRound=round4;
    const refined=await evaluate("(()=>{\n const time=document.getElementById('generated-at');\n const links=[...document.querySelectorAll('a[href]')];\n const ext=links.filter(a=>a.protocol==='https:'||a.protocol==='http:');\n const css=getComputedStyle(document.getElementById('keyword'));\n const firstMeta={time:time?.dateTime,text:time?.textContent,filterHeight:css.height,externalCount:ext.length,\n   externalSafe:ext.every(a=>a.target==='_blank'&&a.rel.includes('noopener')&&a.rel.includes('noreferrer')&&getComputedStyle(a).textDecorationLine.includes('underline')),\n   localSafe:links.filter(a=>a.protocol!=='https:'&&a.protocol!=='http:').every(a=>a.target!=='_blank')};\n const choices=[...document.querySelectorAll('#status-options input')];\n document.getElementById('status-success').click();\n document.getElementById('status-pending').click();\n const fails={count:document.getElementById('count-total').textContent,rows:[...document.querySelectorAll('#report-rows tr')].every(tr=>tr.cells[2]?.textContent==='失败'),selection:document.getElementById('status-count').textContent};\n document.getElementById('status-failure').click();\n const none={count:document.getElementById('count-total').textContent,empty:document.querySelector('#report-rows tr')?.textContent.includes('暂无符合条件')};\n document.getElementById('reset-filters').click();\n const m=document.getElementById('module-filter');m.value='网关服务';m.dispatchEvent(new Event('change',{bubbles:true}));\n const cascade=[...document.getElementById('batch-filter').options].map(x=>x.value);\n const beforeWidth=document.getElementById('report-table').getBoundingClientRect().width;\n document.getElementById('column-duration').click();\n document.getElementById('column-batch').click();\n const cols={th:getComputedStyle(document.getElementById('th-duration')).display,\n   body:[...document.querySelectorAll('#report-rows [data-column=duration]')].every(x=>getComputedStyle(x).display==='none'),\n   count:document.getElementById('column-visibility-live').textContent,\n   afterWidth:document.getElementById('report-table').getBoundingClientRect().width,\n   beforeWidth,identityVisible:getComputedStyle(document.getElementById('th-id')).display!=='none'};\n document.getElementById('open-create').click();\n const form=document.querySelector('.form-fields');\n const label=document.querySelector('#label-new-module');\n const input=document.getElementById('new-module');\n input.value='一段超过十五个字符的模块名称用于演示完整提示';\n input.dispatchEvent(new Event('input',{bubbles:true}));\n const formProps={columns:getComputedStyle(form).gridTemplateColumns,\n   labelWrap:getComputedStyle(label).whiteSpace,\n   inputWrap:getComputedStyle(input).whiteSpace,tooltip:input.title,\n   labelTooltip:label.title,overflow:label.scrollWidth>label.clientWidth};\n document.getElementById('close-create').click();\n return {firstMeta,fails,none,cascade,cols,formProps};\n})()");
    check("精确时间/外部引用/紧凑筛选",refined,refined.firstMeta.time&&/\d{2}:\d{2}:\d{2}[+]08:00/.test(refined.firstMeta.time)&&refined.firstMeta.externalCount===3&&refined.firstMeta.externalSafe&&refined.firstMeta.localSafe&&parseFloat(refined.firstMeta.filterHeight)<=34);
    check("状态多选和无匹配空状态",refined,refined.fails.count!=="0"&&refined.fails.rows&&refined.fails.selection==="1/3"&&refined.none.count==="0"&&refined.none.empty);
    check("模块批次依赖与列隐藏",refined,refined.cascade.length>=2&&refined.cascade.length<=5&&refined.cols.th==="none"&&refined.cols.body&&refined.cols.identityVisible&&refined.cols.count.includes("4 列")&&refined.cols.afterWidth<=refined.cols.beforeWidth);
    check("双列表单与长内容提示",refined,refined.formProps.labelWrap==="nowrap"&&refined.formProps.inputWrap==="nowrap"&&refined.formProps.tooltip.length>15&&refined.formProps.labelTooltip.length>15&&refined.formProps.columns.split(" ").length===2);
    evidence.refinements=refined;
    await reset(1440);

    const codeStyle=await evaluate("(()=>{document.getElementById('tab-rules').click();const pre=document.querySelector('.code-example pre'),code=pre?.querySelector('code'),button=pre?.querySelector('.code-copy'),style=code&&getComputedStyle(code),root=getComputedStyle(document.documentElement);return{pre:!!pre,button:!!button,body:getComputedStyle(document.body).fontSize,code:style?.fontSize,bg:root.getPropertyValue('--background').trim(),fg:root.getPropertyValue('--foreground').trim(),accent:root.getPropertyValue('--accent').trim(),badExternal:[...document.querySelectorAll('a[href]')].filter(a=>['http:','https:'].includes(a.protocol)&&(a.target!=='_blank'||!a.rel.includes('noopener')||!a.rel.includes('noreferrer')||!a.classList.contains('external-link'))).length,badInternal:[...document.querySelectorAll('a[href]')].filter(a=>!['http:','https:'].includes(a.protocol)&&(a.target==='_blank'||a.classList.contains('external-link'))).length}})()");
    check("统一主题与 Markdown 代码块",codeStyle,codeStyle.pre&&codeStyle.button&&codeStyle.body==="14px"&&codeStyle.code==="12px"&&codeStyle.bg==="#FFFFFF"&&codeStyle.fg==="#1A1C1F"&&codeStyle.accent==="#3A83F7"&&codeStyle.badExternal===0&&codeStyle.badInternal===0);
    evidence.codeStyle=codeStyle;
    const emphasis=await evaluate("(()=>{const q=document.querySelector('.callout--confirm'),h=document.querySelector('h1'),states=[...document.querySelectorAll('.task-state')];return{calloutBg:q&&getComputedStyle(q).backgroundColor,calloutBorder:q&&getComputedStyle(q).borderLeftColor,h1Color:getComputedStyle(h).color,taskStates:states.map(x=>({icon:x.textContent,label:x.getAttribute('aria-label'),title:x.title}))}})()");
    check("语义引用块、标题颜色与任务状态图标",emphasis,emphasis.calloutBg==="rgb(255, 248, 232)"&&emphasis.calloutBorder==="rgb(230, 162, 60)"&&emphasis.h1Color==="rgb(26, 28, 31)"&&emphasis.taskStates.length===10&&emphasis.taskStates.every(x=>x.label&&x.title)&&emphasis.taskStates.some(x=>x.icon==="⏳"));
    evidence.emphasis=emphasis;
    const copyPoint=await evaluate("(()=>{const btn=document.querySelector('.code-example .code-copy');btn.scrollIntoView({block:'center',behavior:'instant'});const r=btn.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,visible:r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight}})()");
    check("代码复制按钮可见",copyPoint,copyPoint.visible);
    await send("Input.dispatchMouseEvent",{type:"mousePressed",x:copyPoint.x,y:copyPoint.y,button:"left",clickCount:1});
    await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:copyPoint.x,y:copyPoint.y,button:"left",clickCount:1});
    await sleep(250);
    const copyStatus=await evaluate("(()=>{const b=document.querySelector('.code-example .code-copy');return{state:b?.dataset.state,icon:!!b?.querySelector('svg'),visibleText:b?.textContent,feedback:document.querySelector('.code-example [role=status]')?.textContent}})()");
    check("离线一键复制真实交互",copyStatus,copyStatus.state==="check"&&copyStatus.icon&&!copyStatus.visibleText&&!copyStatus.feedback);
    await sleep(1100);
    const restored=await evaluate("document.querySelector('.code-example .code-copy')?.dataset.state");
    check("复制图标一秒恢复",restored,restored==="copy");
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

    const cycles=[];
    for(let i=0;i<3;i++){
      const start=await evaluate("(()=>{const b=document.getElementById('flow-fullscreen').getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}})()");
      await send("Input.dispatchMouseEvent",{type:"mousePressed",x:start.x,y:start.y,button:"left",clickCount:1});
      await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:start.x,y:start.y,button:"left",clickCount:1});
      await sleep(100);
      const inFull=await evaluate("(()=>{document.getElementById('flow-zoom-in').click();const p=document.getElementById('flow-panel');return{active:document.fullscreenElement===p,pressed:document.getElementById('flow-fullscreen').getAttribute('aria-pressed'),view:document.getElementById('flow-svg').getAttribute('viewBox'),icon:!!document.querySelector('#flow-fullscreen svg')}})()");
      const end=await evaluate("(()=>{const b=document.getElementById('flow-fullscreen').getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}})()");
      await send("Input.dispatchMouseEvent",{type:"mousePressed",x:end.x,y:end.y,button:"left",clickCount:1});
      await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:end.x,y:end.y,button:"left",clickCount:1});
      await sleep(100);
      const after=await evaluate("(()=>{const p=document.getElementById('flow-panel');return{active:document.fullscreenElement===p,pressed:document.getElementById('flow-fullscreen').getAttribute('aria-pressed'),view:document.getElementById('flow-svg').getAttribute('viewBox'),icon:!!document.querySelector('#flow-fullscreen svg')}})()");
      cycles.push({inFull,after});
    }
    check("全屏反复切换与缩放状态保存",cycles,cycles.length===3&&cycles.every(c=>c.inFull.active&&c.inFull.pressed==="true"&&c.inFull.icon&&!c.after.active&&c.after.pressed==="false"&&c.after.icon&&c.after.view===c.inFull.view));
    evidence.fullscreenCycles=cycles;

    const fallback=await evaluate("(async()=>{const panel=document.getElementById('flow-panel'),b=document.getElementById('flow-fullscreen');Object.defineProperty(panel,'requestFullscreen',{configurable:true,value:async()=>{throw Error('blocked')}});await b.click();return {active:panel.classList.contains('is-fullscreen'),pressed:b.getAttribute('aria-pressed')}})()");
    check("全屏受限时可回退",fallback,fallback.active&&fallback.pressed==="true");
    await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    const fallbackExited=await evaluate("(()=>{const panel=document.getElementById('flow-panel'),b=document.getElementById('flow-fullscreen');return{active:panel.classList.contains('is-fullscreen'),pressed:b.getAttribute('aria-pressed')}})()");
    check("回退全屏 Esc 恢复",fallbackExited,!fallbackExited.active&&fallbackExited.pressed==="false");

    const diagramTypes=await evaluate("(()=>{const types=[...document.querySelectorAll('#diagram-type-gallery [data-semantic-diagram]')];return types.map(h=>{const s=h.querySelector('.semantic-shell'),svg=s?.querySelector('svg.semantic-svg'),type=h.dataset.semanticDiagram;return{type,svg:!!svg,nodes:s?.querySelectorAll('.semantic-node').length||0,edges:s?.querySelectorAll('.semantic-edge').length||0,inspector:!!s?.querySelector('.semantic-inspector'),tools:s?.querySelectorAll('.semantic-tool').length||0,grammar:type==='sequence'?{actors:s.querySelectorAll('.semantic-actor').length,messages:s.querySelectorAll('.semantic-edge[data-message-index]').length}:type==='mind'?{branches:s.querySelectorAll('.semantic-node-branch').length,children:s.querySelectorAll('.semantic-branch-child').length}:type==='deploy'?{zones:s.querySelectorAll('.semantic-zone').length}:type==='er'?{entities:s.querySelectorAll('.semantic-entity').length,fields:s.querySelectorAll('.semantic-field').length}:type==='activity'?{decisions:s.querySelectorAll('.semantic-decision').length}:type==='swim'?{lanes:s.querySelectorAll('.semantic-lane').length}:type==='component'?{zones:s.querySelectorAll('.semantic-zone').length,ports:s.querySelectorAll('[data-port]').length}:{}}})})()");
    check("七类图均按真实图形语法渲染",diagramTypes,diagramTypes.length===7&&new Set(diagramTypes.map(x=>x.type)).size===7&&diagramTypes.every(x=>x.svg&&x.nodes>=4&&x.edges>=3&&x.inspector&&x.tools>=4));
    check("时序图具备参与者生命线和消息",diagramTypes.find(x=>x.type==="sequence")?.grammar,JSON.stringify(diagramTypes.find(x=>x.type==="sequence")?.grammar)===JSON.stringify({actors:4,messages:6}));
    check("思维导图具备分支与子主题",diagramTypes.find(x=>x.type==="mind")?.grammar,JSON.stringify(diagramTypes.find(x=>x.type==="mind")?.grammar)===JSON.stringify({branches:4,children:8}));
    check("部署图具备部署区域",diagramTypes.find(x=>x.type==="deploy")?.grammar,JSON.stringify(diagramTypes.find(x=>x.type==="deploy")?.grammar)===JSON.stringify({zones:3}));
    check("ER 图具备实体字段",diagramTypes.find(x=>x.type==="er")?.grammar,JSON.stringify(diagramTypes.find(x=>x.type==="er")?.grammar)===JSON.stringify({entities:4,fields:15}));
    check("活动图具备决策节点",diagramTypes.find(x=>x.type==="activity")?.grammar,JSON.stringify(diagramTypes.find(x=>x.type==="activity")?.grammar)===JSON.stringify({decisions:2}));
    check("泳道图具备责任泳道",diagramTypes.find(x=>x.type==="swim")?.grammar,JSON.stringify(diagramTypes.find(x=>x.type==="swim")?.grammar)===JSON.stringify({lanes:4}));
    check("组件图具备边界和接口端口",diagramTypes.find(x=>x.type==="component")?.grammar,JSON.stringify(diagramTypes.find(x=>x.type==="component")?.grammar)===JSON.stringify({zones:3,ports:10}));
    evidence.diagramTypes=diagramTypes;

    const labels=await evaluate("(()=>[...document.querySelectorAll('#diagram-type-gallery .semantic-edge-label-bg')].map(r=>{const a=r.getBBox(),svg=r.ownerSVGElement,nodes=[...svg.querySelectorAll('.semantic-node-shape')].map(n=>n.getBBox());return{label:r.parentElement.dataset.id,overlap:nodes.some(b=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y)}}))()");
    check("关系图连线标签有白底且不压节点",labels,labels.every(x=>!x.overlap));
    const flowLabels=await evaluate("(()=>{const labels=[...document.querySelectorAll('#flow-svg .flow-edge-label-bg')],nodes=[...document.querySelectorAll('#flow-svg .flow-nodes rect')];return{count:labels.length,opaque:labels.every(x=>getComputedStyle(x).fill==='rgb(255, 255, 255)'),overlap:labels.some(a=>{const x=a.getBBox();return nodes.some(b=>{const y=b.getBBox();return x.x<y.x+y.width&&x.x+x.width>y.x&&x.y<y.y+y.height&&x.y+x.height>y.y})})}})()");
    check("主流程图连接标签独立避让",flowLabels,flowLabels.count===3&&flowLabels.opaque&&!flowLabels.overlap);
    evidence.edgeLabels={labels,flowLabels};

    const sequence=await evaluate("(()=>{const fire=n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const h=document.querySelector('[data-semantic-diagram=sequence]'),s=h&&h.querySelector('.semantic-shell'),msgs=s?[...s.querySelectorAll('.semantic-edge[data-message-index]')]:[],msg=msgs[1],nextButton=s&&s.querySelector('[data-action=next]');if(!s||!msg||!nextButton)return{host:!!h,shell:!!s,count:msgs.length,button:!!nextButton};fire(msg);const selected=msg.classList.contains('is-selected'),title=s.querySelector('.semantic-inspector-title')?.textContent||'';nextButton.click();const next=msgs[2]?.classList.contains('is-selected')||false;return{selected,title,next,count:msgs.length}})()");
    check("时序图可选择消息并逐步演示",sequence,sequence.selected&&sequence.title.includes("事务写入")&&sequence.next);
    const mind=await evaluate("(()=>{const fire=n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const s=document.querySelector('[data-semantic-diagram=mind] .semantic-shell'),toggle=s.querySelector('[data-toggle-branch=plan]'),children=[...s.querySelectorAll('[data-parent=plan]')],before=children.every(x=>!x.classList.contains('is-hidden'));fire(toggle);const collapsed=children.every(x=>x.classList.contains('is-hidden'));toggle.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));return{before,collapsed,expanded:children.every(x=>!x.classList.contains('is-hidden'))}})()");
    check("思维导图分支可鼠标和键盘展开",mind,mind.before&&mind.collapsed&&mind.expanded);
    const deploy=await evaluate("(()=>{const fire=n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const s=document.querySelector('[data-semantic-diagram=deploy] .semantic-shell'),z=s.querySelector('[data-zone-toggle=app]'),node=s.querySelector('[data-id=orchestrator]'),edge=s.querySelector('[data-source=api][data-target=orchestrator]');fire(z);const hidden=node.closest('[data-zone-content]').classList.contains('is-hidden')&&edge.classList.contains('is-hidden');fire(z);return{hidden,restored:!node.closest('[data-zone-content]').classList.contains('is-hidden')&&!edge.classList.contains('is-hidden')}})()");
    check("部署拓扑可折叠区域并同步隐藏依赖边",deploy,deploy.hidden&&deploy.restored);
    const er=await evaluate("(()=>{const fire=n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const s=document.querySelector('[data-semantic-diagram=er] .semantic-shell'),b=s.querySelector('[data-action=fields]');b.click();const hidden=s.querySelectorAll('.semantic-field.is-hidden').length,keys=[...s.querySelectorAll('.semantic-field')].filter(x=>['PK','FK'].includes(x.dataset.fieldType)).every(x=>!x.classList.contains('is-hidden'));const relation=s.querySelector('.semantic-edge');fire(relation);return{hidden,keys,inspector:s.querySelector('.semantic-inspector-title').textContent,selected:relation.classList.contains('is-selected')}})()");
    check("ER 图支持字段筛选和关系选择",er,er.hidden>0&&er.keys&&er.selected&&er.inspector.includes("1 : N"));
    const activity=await evaluate("(()=>{const s=document.querySelector('[data-semantic-diagram=activity] .semantic-shell');s.querySelector('[data-action=path-retry]').click();const retry=s.querySelectorAll('[data-path=retry]:not(.is-path-muted)').length,normal=s.querySelectorAll('[data-path=normal].is-path-muted').length;s.querySelector('[data-action=path-all]').click();return{retry,normal,restored:s.querySelectorAll('.is-path-muted').length===0}})()");
    check("活动图可筛选正常和异常分支路径",activity,activity.retry>0&&activity.normal>0&&activity.restored);
    const swim=await evaluate("(()=>{const fire=n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const s=document.querySelector('[data-semantic-diagram=swim] .semantic-shell'),lane=s.querySelector('[data-lane-toggle=worker]'),content=s.querySelectorAll('[data-lane-content=worker]');fire(lane);const collapsed=[...content].every(x=>x.classList.contains('is-hidden'));fire(lane);return{collapsed,expanded:[...content].every(x=>!x.classList.contains('is-hidden'))}})()");
    check("泳道图支持按角色折叠和展开",swim,swim.collapsed&&swim.expanded);
    const component=await evaluate("(()=>{const fire=n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const s=document.querySelector('[data-semantic-diagram=component] .semantic-shell'),b=s.querySelector('[data-action=ports]');b.click();const hidden=[...s.querySelectorAll('[data-port]')].every(x=>x.classList.contains('is-hidden'));const node=s.querySelector('[data-id=orchestrator]');fire(node);const title=s.querySelector('.semantic-inspector-title').textContent;b.click();return{hidden,title,shown:[...s.querySelectorAll('[data-port]')].every(x=>!x.classList.contains('is-hidden'))}})()");
    check("组件图支持端口显隐和依赖组件检查",component,component.hidden&&component.shown&&component.title.includes("Run Orchestrator"));
    evidence.typeInteractions={sequence,mind,deploy,er,activity,swim,component};
    const folded=await evaluate("(()=>{\nconst s=document.querySelector('[data-semantic-diagram=mind] .semantic-shell');s.closest('details').open=true;const toggle=s.querySelector('[data-toggle-branch=plan]'),child=[...s.querySelectorAll('[data-parent=plan].semantic-branch-child')],edges=[...s.querySelectorAll('[data-parent=plan].semantic-branch-edge')];\nchild[0]?.focus();toggle.dispatchEvent(new MouseEvent('click',{bubbles:true}));\nconst hidden=child.every(x=>x.classList.contains('is-hidden')&&x.getClientRects().length===0)&&edges.every(x=>x.classList.contains('is-hidden')&&x.getClientRects().length===0);\nconst focus=document.activeElement===toggle;\ntoggle.dispatchEvent(new MouseEvent('click',{bubbles:true}));\nreturn{child:child.length,edges:edges.length,hidden,focus,restored:child.every(x=>!x.classList.contains('is-hidden'))&&edges.every(x=>!x.classList.contains('is-hidden'))};\n})()");
    check("思维导图折叠节点、连接线及焦点恢复",folded,folded.child===2&&folded.edges===2&&folded.hidden&&folded.focus&&folded.restored);
    const compactER=await evaluate("(()=>{\nconst s=document.querySelector('[data-semantic-diagram=er] .semantic-shell'),entity=s.querySelector('.semantic-entity'),button=s.querySelector('[data-action=fields]');\nif(s.querySelector('.semantic-field.is-hidden'))button.click();const before=entity.querySelector('.semantic-node-shape').getBoundingClientRect().height,fields=s.querySelectorAll('.semantic-field:not(.is-hidden)').length;\nbutton.click();const after=entity.querySelector('.semantic-node-shape').getBoundingClientRect().height,compact=s.querySelectorAll('.semantic-field:not(.is-hidden)').length;\nbutton.click();const restored=entity.querySelector('.semantic-node-shape').getBoundingClientRect().height;\nreturn{before,after,restored,fields,compact};\n})()");
    check("ER 字段过滤后外框随内容压缩并复原",compactER,compactER.fields>compactER.compact&&compactER.after<compactER.before&&Math.abs(compactER.restored-compactER.before)<1);
    const invalidModels=await evaluate("(()=>{\nconst models=[{title:'Test',desc:'Demo',entities:[{id:'one',title:'One',x:0,y:0,w:150,h:140,fields:[['id','PK','主键','Key']]},{id:'one',title:'Duplicate',x:150,y:0,w:150,h:140,fields:[['id','PK','主键','Key']]}],relations:[{from:'one',to:'two',label:'1:N',d:'M1 2H4',lx:15,ly:20}]},{title:'Bad',desc:'Reference',entities:[{id:'one',title:'One',x:0,y:0,w:150,h:140,fields:[['id','PK','主键','Key']]}],relations:[{from:'one',to:'missing',label:'1:N',d:'M1 2H4',lx:15,ly:20}]}];\nreturn models.map(model=>{const host=document.createElement('div');host.dataset.semanticDiagram='er';const script=document.createElement('script');script.type='application/json';script.dataset.diagramModel='';script.textContent=JSON.stringify(model);host.append(script);document.body.append(host);window.GenUISemantic.init(host);const outcome={error:host.dataset.semanticError,svgs:host.querySelectorAll('svg').length,htmlImage:!!host.querySelector('img')};host.remove();return outcome;});\n})()");
    check("非法 JSON 模型被拒绝且无 SVG 渲染",invalidModels,invalidModels.length===2&&invalidModels.every(x=>!!x.error&&x.svgs===0&&!x.htmlImage));
    evidence.regression={folded,compactER,invalidModels};
    const fullscreenError=await evaluate("(async()=>{\nconst s=document.querySelector('[data-semantic-diagram=sequence] .semantic-shell'),b=s.querySelector('[data-action=fullscreen]'),delay=()=>new Promise(r=>setTimeout(r,45));\nconst had=Object.getOwnPropertyDescriptor(s,'requestFullscreen'),ownDoc=Object.getOwnPropertyDescriptor(document,'fullscreenElement'),exit=Object.getOwnPropertyDescriptor(document,'exitFullscreen');\nObject.defineProperty(s,'requestFullscreen',{configurable:true,value:async()=>{throw Error('denied')}});\nb.click();await delay();const fallback=s.classList.contains('is-fallback-fullscreen')&&b.getAttribute('aria-pressed')==='true';\ndocument.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await delay();const escaped=!s.classList.contains('is-fallback-fullscreen')&&b.getAttribute('aria-pressed')==='false';\nif(had)Object.defineProperty(s,'requestFullscreen',had);else delete s.requestFullscreen;\nObject.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>s});\nObject.defineProperty(document,'exitFullscreen',{configurable:true,value:async()=>{throw Error('exit denied')}});\nb.click();await delay();const failed=s.dataset.fullscreenError==='exit-failed'&&b.getAttribute('aria-pressed')==='true';\nif(ownDoc)Object.defineProperty(document,'fullscreenElement',ownDoc);else delete document.fullscreenElement;\nif(exit)Object.defineProperty(document,'exitFullscreen',exit);else delete document.exitFullscreen;\ndocument.dispatchEvent(new Event('fullscreenchange'));await delay();return{fallback,escaped,failed,recovered:b.getAttribute('aria-pressed')==='false'};\n})()");check("语义图全屏 API 拒绝、Esc 和退出异常恢复",fullscreenError,fullscreenError.fallback&&fullscreenError.escaped&&fullscreenError.failed&&fullscreenError.recovered);evidence.regression.fullscreenError=fullscreenError;


    const duplicate=await evaluate("(()=>{document.getElementById('flow-fit').click();GenUIMedia.initDiagram(document.getElementById('flow-panel'));GenUIMedia.initDiagram(document.getElementById('flow-panel'));document.getElementById('flow-zoom-in').click();const scale=document.getElementById('flow-zoom-label').textContent;document.getElementById('flow-fit').click();return{scale,ready:document.getElementById('flow-panel').dataset.genUiDiagramReady}})()");
    check("重复初始化不会叠加 SVG 事件处理",duplicate,duplicate.scale==="125%"&&duplicate.ready==="true");

    const image=await evaluate("(()=>{const trigger=document.querySelector('.genui-image-open'),frame=trigger.parentElement,fr=frame.getBoundingClientRect(),br=trigger.getBoundingClientRect(),style=getComputedStyle(trigger),el=document.querySelector('.genui-image-overlay');trigger.click();const before=el.querySelector('[data-image-percent]').textContent;el.querySelector('[data-image-plus]').click();const after=el.querySelector('[data-image-percent]').textContent;el.querySelector('[data-image-minus]').click();const restored=el.querySelector('[data-image-percent]').textContent;return{opened:!el.hidden,before,after,restored,buttons:el.querySelectorAll('button svg').length,frame:frame.className,position:style.position,top:Math.round(br.top-fr.top),right:Math.round(fr.right-br.right)}})()");
    check("图片右上角全屏入口与比例缩放",image,image.opened&&image.before==="100%"&&image.after==="125%"&&image.restored==="100%"&&image.buttons===4&&image.frame==="genui-image-frame"&&image.position==="absolute"&&image.top>=0&&image.right>=0);
    await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    const closed=await evaluate("(()=>({hidden:document.querySelector('.genui-image-overlay').hidden,focus:document.activeElement===document.querySelector('.genui-image-open')}))()");
    check("图片 Esc 关闭并恢复焦点",closed,closed.hidden&&closed.focus);
    evidence.imageViewer={image,closed};

    const copyPosition=await evaluate("(()=>{const b=document.querySelector('.code-example .code-copy'),p=b.parentElement,r=b.getBoundingClientRect(),pr=p.getBoundingClientRect(),s=getComputedStyle(b);return{position:s.position,cssTop:s.top,cssRight:s.right,top:Math.round(r.top-pr.top),right:Math.round(pr.right-r.right),icon:!!b.querySelector('svg'),text:b.textContent}})()");
    check("代码复制图标固定在代码块右上角",copyPosition,copyPosition.position==="absolute"&&copyPosition.cssTop==="7px"&&copyPosition.cssRight==="8px"&&copyPosition.icon&&!copyPosition.text);
    evidence.copyPosition=copyPosition;

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
