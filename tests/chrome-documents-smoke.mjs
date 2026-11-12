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
 {id:"chapters-fixture",file:"../../tests/fixtures/chapter-numbering.html",title:"双层章节导航验证样例",article:false,fixture:true},
 {id:"gallery",file:"index.html",title:"技术文档 HTML 示例集",article:false},
 {id:"project-analysis",file:"project-analysis.html",title:"AI 内容生产平台项目分析报告",article:true},
 {id:"architecture-design",file:"architecture-design.html",title:"异步任务编排与断点恢复架构设计方案",article:true},
 {id:"implementation-plan",file:"implementation-plan.html",title:"技术实施方案",article:true},
 {id:"test-acceptance",file:"test-acceptance.html",title:"测试与验收方案",article:true},
 {id:"en-gallery",file:"en/index.html",title:"English technical document examples",article:false,english:true},
 {id:"en-project-analysis",file:"en/project-analysis.html",title:"Project analysis report",article:true,english:true},
 {id:"en-architecture-design",file:"en/architecture-design.html",title:"System architecture design",article:true,english:true},
 {id:"en-implementation-plan",file:"en/implementation-plan.html",title:"Technical implementation plan",article:true,english:true},
 {id:"en-test-acceptance",file:"en/test-acceptance.html",title:"Test and acceptance plan",article:true,english:true},
 {id:"boundaries",file:"../model-boundaries.html",title:"GEN-UI · 独立业务图表边界案例",article:false,boundary:true},
 {id:"custom-model",file:"../custom-diagram-model.html",title:"GEN-UI · 自定义业务图表 JSON 案例",article:false,custom:true},
 {id:"en-report",file:"../report.en.html",title:"Information design case gallery",article:true,english:true},
 {id:"architecture-patterns",file:"../architecture-patterns.html",title:"GEN-UI · 八类真实工程架构案例",article:false,architecture:true}
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
    const anchor=capture&&width===1440?(spec.id.includes("test-acceptance")?"#cases":/project-analysis|architecture-design|implementation-plan/.test(spec.id)?"#extra-diagrams":""):"";
    await cmd("Page.navigate",{url:pathToFileURL(path.join(base,spec.file)).href+anchor});
    let state;
    for(let i=0;i<90;i++){try{state=await evalPage("(()=>({ready:document.readyState==='complete',title:document.title,h1:document.querySelector('h1')?.innerText||'',overflow:document.documentElement.scrollWidth>innerWidth+2,sections:document.querySelectorAll('main h2').length,headingCount:document.querySelectorAll('main h2, main h3, main h4').length,toc:document.querySelectorAll('.toc-list a').length,svg:document.querySelectorAll('svg[role=img]').length,tables:document.querySelectorAll('table').length,code:document.querySelectorAll('pre code').length,copies:document.querySelectorAll('.code-copy').length,remote:[...document.querySelectorAll('script[src],link[href],img[src]')].filter(x=>/^(https?:)?\\/\\//i.test(x.getAttribute('src')||x.getAttribute('href')||'')).length,metrics:document.querySelectorAll('.metrics,.metric,.app').length,semantic:document.querySelectorAll('[data-semantic-diagram] .semantic-svg').length}))()");if(state.ready&&state.h1)break;}catch{}await sleep(100);}
    check("page ready "+width+" "+spec.id,state,state?.ready&&state.h1&&state.title.includes(spec.title)&&!state.overflow&&state.remote===0);

    if(spec.fixture){
     const n=await evalPage("(()=>{const qs=s=>[...document.querySelectorAll(s)],headings=qs('main h2,main h3,main h4').map(e=>e.textContent.trim()),links=qs('.doc-toc .genui-tree a').map(a=>decodeURIComponent(a.hash.slice(1))),handle=document.querySelector('.doc-toc .genui-nav-resize'),layout=document.querySelector('.doc-layout'),before=parseFloat(getComputedStyle(layout).gridTemplateColumns.split(' ')[0]);handle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));const after=parseFloat(getComputedStyle(layout).gridTemplateColumns.split(' ')[0]);return{headings,links,levels:[1,2,3].map(i=>qs('.doc-toc .genui-nav-level-'+i).length),before,after,iconsHidden:qs('.doc-toc .genui-nav-level-1>a>svg').every(e=>getComputedStyle(e).display==='none'),hasHandle:!!handle}})()");
     check("中文两层编号与拖拽宽度键盘能力/"+width,n,n.headings[0].startsWith('一、')&&n.headings[1].startsWith('（一）')&&n.headings[2]==='非编号的技术细节'&&n.headings[3].startsWith('（二）')&&n.headings[4].startsWith('二、')&&n.headings[5].startsWith('（一）')&&n.levels[0]===2&&n.levels[1]===3&&n.levels[2]===0&&!n.links.includes('plain')&&n.iconsHidden&&n.hasHandle&&(width<=700||n.after>n.before));
    }
    if(spec.architecture){
     const a=await evalPage("(function archAudit(){\n const views=[...document.querySelectorAll('[data-architecture-view] .architecture-view')];\n const first=views[0],scene=first.querySelector('.architecture-scene'),layers=scene.querySelector('.architecture-layers');\n const cards=[...layers.querySelectorAll(':scope > .architecture-group')];\n const wire=scene.querySelector('.architecture-wire');\n const model=JSON.parse(first.closest('[data-architecture-view]').querySelector(':scope > script[type=\"application/json\"]').textContent);\n const getCard=ref=>cards.find((c,i)=>model.groups[i].id===ref||model.groups[i].name===ref);\n const a=getCard(wire.closest('.architecture-flow-row').dataset.from).getBoundingClientRect();\n const b=getCard(wire.closest('.architecture-flow-row').dataset.to).getBoundingClientRect();\n const pointAt=(path,t)=>path.getPointAtLength(path.getTotalLength()*t).matrixTransform(path.getScreenCTM());\n const start=pointAt(wire,0),end=pointAt(wire,1);\n const before={card:cards[0].getBoundingClientRect().width,wire:wire.getBoundingClientRect().width};\n const percent=first.querySelector('.architecture-percent'),beforePercent=percent.textContent;\n first.querySelector('[title=\"放大架构图\"]').click();\n const after={card:cards[0].getBoundingClientRect().width,wire:wire.getBoundingClientRect().width};\n const zoomed=percent.textContent;\n first.querySelector('[title=\"适应窗口\"]').click();\n const reset=percent.textContent;\n const initial=cards[0].open;cards[0].querySelector('summary').click();\n const folded=!cards[0].open;cards[0].querySelector('summary').click();\n const flows=[...document.querySelectorAll('.architecture-flow-row')];\n const labels=[...document.querySelectorAll('.architecture-wire-label')];\n return {\n  count:views.length,allGroups:views.every(v=>!!v.querySelector('.architecture-group')),\n  nested:document.querySelectorAll('.architecture-group .architecture-group').length,\n  nav:document.querySelectorAll('.doc-toc .genui-tree a').length,\n  flowCount:flows.length,labelCount:labels.length,\n  evidence:labels.every(l=>l.querySelector('.architecture-wire-evidence')?.textContent.includes('依据')),\n  arrowMarkers:flows.every(g=>g.querySelector('.architecture-wire')?.getAttribute('marker-end')?.includes('architecture-arrow')),\n  connected:Math.abs(start.x-a.right)<12&&Math.abs(end.x-b.right)<22&&Math.abs(start.y-(a.top+a.height/2))<10&&Math.abs(end.y-(b.top+b.height/2))<11,\n  cardZoomRatio:after.card/before.card,wireZoomRatio:after.wire/before.wire,\n  percent:[beforePercent,zoomed,reset],initial,folded,\n  pageOverflow:document.documentElement.scrollWidth>innerWidth+2,\n  labelsInScene:labels.every(l=>l.closest('.architecture-scene')!==null),\n  source:document.querySelector('.architecture-source')?.textContent||''\n };\n})()");
     check("八类架构节点锚定连线、整图同步缩放/"+width,a,a.count===8&&a.allGroups&&a.nested>=2&&a.nav===8&&a.flowCount===24&&a.labelCount===24&&a.evidence&&a.arrowMarkers&&a.connected&&a.cardZoomRatio>1.15&&a.wireZoomRatio>1.15&&JSON.stringify(a.percent)===JSON.stringify(["100%","120%","100%"])&&a.initial&&a.folded&&!a.pageOverflow&&a.labelsInScene&&a.source.includes("Yopu")&&a.source.includes("StoryOS"));
    }
    if(capture&&width===1440&&spec.architecture){
      await evalPage("document.getElementById('arch-2').scrollIntoView({block:'start'})");
      await sleep(260);
      const shot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
      const file=path.join(base,"assets","architecture-patterns-preview.png");
      fs.writeFileSync(file,Buffer.from(shot.data,"base64"));
      check("architecture screenshot source",fs.statSync(file).size,fs.statSync(file).size>16000);
     }
     if(spec.custom){const custom=await evalPage("(()=>({entities:document.querySelectorAll('[data-semantic-diagram=er] .semantic-entity').length,messages:document.querySelectorAll('[data-semantic-diagram=sequence] .semantic-edge[data-message-index]').length}))()");check("自定义 JSON 图/"+width,custom,state.semantic===2&&custom.entities===2&&custom.messages===3);}
     if(state.semantic){const iconAudit=await evalPage("[...document.querySelectorAll(\x27[data-semantic-diagram] .semantic-shell\x27)].every(s=>[\x27zoom-in\x27,\x27zoom-out\x27,\x27fit\x27,\x27fullscreen\x27].every(a=>!!s.querySelector(\x27[data-action=\x27+a+\x27] svg\x27)))");check("semantic toolbar contains SVG icons",iconAudit,iconAudit===true);await evalPage("[...document.querySelectorAll('.diagram-type-entry')].forEach(d=>d.open=true)");await sleep(140);const geometry=await evalPage("(()=>{\nconst hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;\nreturn [...document.querySelectorAll('[data-semantic-diagram]')].map(host=>{\nconst svg=host.querySelector('.semantic-svg');if(!svg)return{type:host.dataset.semanticDiagram,fail:['missing SVG']};\nconst chips=[...svg.querySelectorAll('.semantic-edge-chip')].filter(n=>n.getBoundingClientRect().width>0&&!n.classList.contains('is-hidden'));\nconst nodes=[...svg.querySelectorAll('.semantic-node-shape,.semantic-actor>rect')].filter(n=>n.getBoundingClientRect().width>0);\nconst fail=[];\nchips.forEach((chip,i)=>{const a=chip.querySelector('.semantic-edge-label-bg').getBoundingClientRect(),t=chip.querySelector('text').getBoundingClientRect();if(chip.dataset.layoutOk!=='true')fail.push({kind:'unplaced',i});if(t.left<a.left-2||t.right>a.right+2)fail.push({kind:'text',i});nodes.forEach((n,j)=>{if(hit(a,n.getBoundingClientRect()))fail.push({kind:'node',i,j});});chips.slice(i+1).forEach((b,j)=>{if(hit(a,b.querySelector('rect').getBoundingClientRect()))fail.push({kind:'label',i,j});});});\nconst stage=host.querySelector('.semantic-stage');return{type:host.dataset.semanticDiagram,count:chips.length,fail,overflow:stage.scrollWidth>stage.clientWidth+2};});\n})()");check("中英文图表像素碰撞/"+width+"/"+spec.id,geometry,geometry.length===state.semantic&&geometry.every(x=>x.fail.length===0&&(width!==375||!x.overflow)));}
     if(spec.boundary){const audit=await evalPage("(()=>{\n const fire=n=>n.dispatchEvent(new MouseEvent(\"click\",{bubbles:true,cancelable:true}));\n const s=document.querySelector('[data-semantic-diagram=sequence] .semantic-shell'),v=s.querySelector('.semantic-svg').viewBox.baseVal,lines=[...s.querySelectorAll('.semantic-edge[data-message-index]')],chips=[...s.querySelectorAll('.semantic-edge-chip[data-message-index]')];\n fire(chips[1]);const linked=lines[1].classList.contains('is-selected')&&chips[1].classList.contains('is-selected');\n s.querySelector('[data-action=next]').click();const stepped=lines[2].classList.contains('is-selected')&&chips[2].classList.contains('is-selected');\n const a=document.querySelector('[data-semantic-diagram=activity] .semantic-shell'),reject=a.querySelector('[data-id=rejectCase]'),success=a.querySelector('[data-id=successCase]');a.querySelector('[data-action=path-retry]').click();const retry=reject.classList.contains('is-path-muted')===false&&success.classList.contains('is-path-muted')===true;a.querySelector('[data-action=path-all]').click();\n const mind=document.querySelector('[data-semantic-diagram=mind] .semantic-shell'),toggle=mind.querySelector('[data-toggle-branch]'),correctIcon=toggle.getAttribute('aria-expanded')==='true'&&toggle.querySelector('path').getAttribute('d')==='M161 34h10';\n const er=document.querySelector('[data-semantic-diagram=er] .semantic-shell'),edges=[...er.querySelectorAll('.semantic-edge')],ids=edges.map(x=>x.dataset.id),long=[...er.querySelectorAll('.semantic-edge-chip')].find(x=>x.querySelector('title')?.textContent.length>100);\n const title=long.querySelector('title').textContent,hasText=long.querySelector('text').textContent.length<title.length&&long.dataset.truncated==='true';\n fire(edges[0]);const independent=!edges[1].classList.contains('is-related');\n const rect=long.querySelector('.semantic-edge-label-bg').getBoundingClientRect(),nodes=[...er.querySelectorAll('.semantic-node-shape')],hit=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;const collision=long.dataset.layoutOk==='true'&&nodes.some(n=>hit(rect,n.getBoundingClientRect()));\n const fallback=long.dataset.layoutOk==='fallback'&&er.closest('.semantic-shell').querySelector('.semantic-fallback-link')?.title===title;\n const host=er.closest('[data-semantic-diagram]');window.GenUISemantic.destroy(host);const removed=!host.querySelector('.semantic-svg')&&!!host.querySelector('script[data-diagram-model]');window.GenUISemantic.init(host);window.GenUISemantic.init(host);const restored=host.querySelectorAll('.semantic-svg').length===1;\n return {actors:s.querySelectorAll('.semantic-actor').length,width:v.width,linked,stepped,retry,correctIcon,relationIds:ids,independent,hasText,collision,fallback,layout:long.dataset.layoutOk,removed,restored};\n})()");check("Independent JSON boundary models "+width,audit,audit.actors===4&&audit.width>=875&&audit.linked&&audit.stepped&&audit.retry&&audit.correctIcon&&new Set(audit.relationIds).size===2&&audit.independent&&audit.hasText&&!audit.collision&&["true","fallback"].includes(audit.layout)&&audit.removed&&audit.restored);}
     if(spec.id==="en-test-acceptance"){const matrix=await evalPage("document.querySelector(\x27#cases table\x27)?.querySelectorAll(\x27tbody tr\x27).length||0");check("English test matrix belongs to its heading",matrix,matrix>=5);}
     if(spec.article){
     const navAudit=await evalPage("(()=>{const ids=[...document.querySelectorAll('main h2,main h3')].filter(h=>!h.hidden&&!h.closest('dialog,[role=dialog],#panel-rules,.modal,.drawer,.chart-section,.diagram,.case-block,.metric')&&(h.tagName==='H2'||h.parentElement?.classList.contains('doc-section')||h.dataset.navChapter==='true')).map(h=>h.id);const read=selector=>[...document.querySelectorAll(selector)].map(a=>decodeURIComponent(a.hash.slice(1)));const desktop=read('.doc-toc .genui-tree a'),mobile=read('.mobile-toc .genui-tree a');return{ids,desktop,mobile,fold:document.querySelectorAll('.doc-toc .genui-nav-fold').length}})()");
     check("desktop and mobile navigation target parity "+spec.id,navAudit,navAudit.ids.length>0&&JSON.stringify(navAudit.ids)===JSON.stringify(navAudit.desktop)&&JSON.stringify(navAudit.ids)===JSON.stringify(navAudit.mobile));
     if(spec.english){check("English document structure "+spec.id,state,state.sections>=5&&state.toc===navAudit.ids.length*2&&state.tables>=1&&state.copies===state.code&&state.metrics===0);}else{check("document structure "+spec.id,state,state.sections>=7&&state.toc===navAudit.ids.length*2&&state.svg>=1&&state.tables>=2&&state.code>=1&&state.copies===state.code&&state.metrics===0);}
      const copyPosition=await evalPage("(()=>{const b=document.querySelector('.code-copy');if(!b)return null;const s=getComputedStyle(b);return{position:s.position,top:s.top,right:s.right,icon:!!b.querySelector('svg')}})()");
      check("document code-copy icon top-right "+spec.id,copyPosition,state.code===0?copyPosition===null:copyPosition?.position==="absolute"&&copyPosition.top==="7px"&&copyPosition.right==="8px"&&copyPosition.icon);
      if(spec.id==="en-report")check("English report contains all seven live diagrams",state.semantic,state.semantic===7);
     if(!spec.english){const zoom=await evalPage("(()=>{const d=document.querySelector('[data-semantic-diagram] .semantic-shell'),label=d.querySelector('[data-zoom]');d.querySelector('[data-action=zoom-in]').click();const increased=label.textContent;d.querySelector('[data-action=fit]').click();return{increased,reset:label.textContent}})()");
     check("diagram controls "+spec.id,zoom,zoom.increased==="125%"&&zoom.reset==="100%");}
     if(capture&&width===1440&&!spec.fixture){
      await sleep(350);
      const y=anchor?await evalPage("(()=>{const e=document.querySelector(location.hash);return e?Math.max(0,Math.round(e.getBoundingClientRect().top+scrollY-20)):0})()"):0;
      const shot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:!!anchor,...(anchor?{clip:{x:0,y,width:1440,height:1000,scale:1}}:{})});
      const file=path.join(base,"assets",spec.id+"-preview.png");fs.writeFileSync(file,Buffer.from(shot.data,"base64"));
      check("preview image "+spec.id,{file,size:fs.statSync(file).size},fs.statSync(file).size>8000);
     }
    }
    results.push({width,id:spec.id,sections:state.sections,overflow:state.overflow});
   }
  }
  console.log(JSON.stringify({result:"PASS",documents:specs.length,viewportScenarios:results.length,results,captured:capture?10:0}));
 }finally{try{socket?.close();}catch{}proc.kill();await sleep(200);fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100});}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
