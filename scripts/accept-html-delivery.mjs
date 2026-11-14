#!/usr/bin/env node
// GEN-UI lightweight browser delivery gate. Built-in Node.js + installed Chrome only.
// node scripts/accept-html-delivery.mjs <report.html> [output-dir] [--require-image]
import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const file=path.resolve(process.argv[2]||"");
if(!file.endsWith(".html")||!fs.existsSync(file)){
 console.error("Usage: node scripts/accept-html-delivery.mjs <report.html> [output-dir] [--require-image]");
 process.exit(2);
}
const destination=process.argv[3]&&!process.argv[3].startsWith("--")?process.argv[3]:"evals/artifacts/html-acceptance-latest";
const outDir=path.resolve(destination);
fs.mkdirSync(outDir,{recursive:true});
const requireImage=process.argv.includes("--require-image");
const results={schema:"gen-ui-html-gate/v1",source:path.relative(root,file).replaceAll("\\","/"),runTime:new Date().toISOString(),checks:[],screenshots:[],browserErrors:[],externalRequests:[],pass:false};
let stage="static";
function check(name,pass,details=null){results.checks.push({stage,name,pass:Boolean(pass),details});return Boolean(pass)}
function delay(ms){return new Promise(r=>setTimeout(r,ms))}
const base=spawnSync(process.execPath,[path.join(root,"scripts/validate-html-report.mjs"),file],{encoding:"utf8",timeout:25000,cwd:root});
check("offline static report and resources",base.status===0,{stdout:(base.stdout||"").trim().slice(0,650),stderr:(base.stderr||"").trim().slice(0,650)});
const executable=[process.env.GEN_UI_CHROME,
 "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
 "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
 "/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(fs.existsSync);
check("Chrome or Edge present",Boolean(executable));
let ws,child,profile,command,evaluate;
const capture=async name=>{
 const shot=await command("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:false});
 fs.writeFileSync(path.join(outDir,name),Buffer.from(shot.data,"base64"));
 results.screenshots.push(name);
};
function pageState(){
 const host=document.querySelector(".doc-layout,[data-report-app]");
 const aside=host?.querySelector(".doc-toc,#report-sidebar");
 const main=host?.querySelector("main");
 const brand=aside?.querySelector(".toc-brand,.brand");
 const nav=aside?.querySelector(":scope > nav");
 const list=nav?.querySelector(".genui-tree,.toc-list,.nav-list");
 const toggle=aside?.querySelector(".genui-sidebar-toggle,#toggle-sidebar");
 const box=main?.getBoundingClientRect();
 const mobile=main?.querySelector("details.mobile-toc");
 return {
  width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+2,
  headings:main?.querySelectorAll("h1").length||0,
  tocLinks:nav?.querySelectorAll("a[href^='#']").length||0,
  anchorsValid:[...(nav?.querySelectorAll("a[href^='#']")||[])].every(a=>{try{return !!document.getElementById(decodeURIComponent(a.hash.slice(1)))}catch{return false}}),
  asideVisible:!!aside&&getComputedStyle(aside).display!=="none",
  mobileVisible:!!mobile&&getComputedStyle(mobile).display!=="none",
  sidebarOverflow:aside?getComputedStyle(aside).overflowY:null,
  navOverflow:nav?getComputedStyle(nav).overflowY:null,
  listOverflow:list?getComputedStyle(list).overflowY:null,
  collapsed:host?.dataset.sidebarCollapsed==="true",
  mainWidth:box?Math.round(box.width):0,
  center:box?Math.round(box.left+box.width/2):0,
  imageCount:main?.querySelectorAll("img:not([data-no-preview])").length||0,
  imagesLoaded:[...(main?.querySelectorAll("img")||[])].every(img=>img.complete&&img.naturalWidth>0),
  hasBrand:!!brand,hasToggle:!!toggle
 };
}
function auditLongNav(){
 const aside=document.querySelector(".doc-toc,#report-sidebar"),nav=aside?.querySelector(":scope > nav"),tree=nav?.querySelector(".genui-tree,.toc-list,.nav-list");
 if(!nav||!tree)return{scrolled:false};
 const added=[];
 for(let i=0;i<70;i++){const li=document.createElement("li");li.textContent="目录滚动检测 "+i;tree.append(li);added.push(li)}
 nav.scrollTop=170;
 const value={scrolled:nav.scrollTop>0,navTop:nav.scrollTop,sidebarTop:aside.scrollTop,treeTop:tree.scrollTop};
 added.forEach(n=>n.remove());nav.scrollTop=0;return value;
}
function foldState(){
 const host=document.querySelector(".doc-layout,[data-report-app]"),aside=host?.querySelector(".doc-toc,#report-sidebar"),toggle=aside?.querySelector(".genui-sidebar-toggle,#toggle-sidebar");
 toggle?.click();
 const brand=aside?.querySelector(".toc-brand,.brand"),mark=brand?.querySelector(".genui-brand-expand-icon"),rect=brand?.getBoundingClientRect(),main=host?.querySelector("main"),b=main.getBoundingClientRect();
 const rail=aside.getBoundingClientRect(),destination=aside.querySelector("nav .genui-nav-level-1>a>svg"),destRect=destination?.getBoundingClientRect();
 return {collapsed:host.dataset.sidebarCollapsed==="true",toggleHidden:getComputedStyle(toggle).display==="none",brandLabel:brand.getAttribute("aria-label"),
  brandTabIndex:brand.tabIndex,markCount:brand.querySelectorAll(".genui-brand-expand-icon").length,
  markHidden:getComputedStyle(mark).display==="none",center:Math.round(b.left+b.width/2),mainWidth:Math.round(b.width),
  reading:(()=>{const element=main.querySelector(":scope > header,:scope > section,.doc-section");if(!element)return null;const r=element.getBoundingClientRect();return {center:Math.round(r.left+r.width/2),width:Math.round(r.width),left:Math.round(r.left)};})(),
  railWidth:Math.round(rail.width),railCenter:rail.left+rail.width/2,brandWidth:Math.round(rect.width),brandCenter:rect.left+rect.width/2,
  destinationCenter:destRect?destRect.left+destRect.width/2:null,destinationSize:destRect?Math.round(destRect.width):null,
  x:rect.left+rect.width/2,y:rect.top+rect.height/2};
}
function hoveredState(){
 const brand=document.querySelector(".doc-toc>.toc-brand,#report-sidebar .brand"),icon=brand.querySelector(".genui-brand-expand-icon");
 const logo=brand.matches(".toc-brand")?getComputedStyle(brand,"::before"):getComputedStyle(brand.querySelector("img"));
 const r=icon.getBoundingClientRect(),b=brand.getBoundingClientRect(),bg=getComputedStyle(brand).backgroundColor;
 const alpha=/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(bg);
 return{arrowVisible:getComputedStyle(icon).display!=="none",logoOpacity:logo.opacity,
  arrowCenter:r.left+r.width/2,brandCenter:b.left+b.width/2,arrowSize:Math.round(r.width),hoverBg:bg,hoverAlpha:alpha?Number(alpha[1]):null};
}
function expandedState(){
 const host=document.querySelector(".doc-layout,[data-report-app]"),toggle=host.querySelector(".doc-toc>.genui-sidebar-toggle,#toggle-sidebar");
 return{expanded:host.dataset.sidebarCollapsed!=="true",buttonVisible:getComputedStyle(toggle).display!=="none"};
}
function openImage(){
 const img=document.querySelector("main img:not([data-no-preview])");
 if(!img)return{noImage:true};
 img.click();const overlay=document.querySelector(".genui-image-overlay");
 return{noImage:false,opened:!!overlay&&!overlay.hidden,percent:overlay?.querySelector("[data-image-percent]")?.textContent,
  fullscreen:!!overlay?.querySelector("[data-image-fullscreen]"),url:location.href,src:overlay?.querySelector(".genui-image-stage img")?.getAttribute("src")};
}
function wheelImage(){
 const overlay=document.querySelector(".genui-image-overlay"),stage=overlay.querySelector(".genui-image-stage"),percent=overlay.querySelector("[data-image-percent]");
 const before=percent.textContent;stage.dispatchEvent(new WheelEvent("wheel",{deltaY:-120,bubbles:true,cancelable:true}));
 return{before,after:percent.textContent,url:location.href};
}
function clickImageLink(){
 const links=[...document.querySelectorAll("main a[href]")];
 const a=links.find(x=>/\.(png|jpe?g|gif|webp|svg|avif)(?:[?#].*)?$/i.test(x.getAttribute("href")||""));
 if(!a)return{skipped:true};
 a.click();
 return{skipped:false,overlayOpen:!document.querySelector(".genui-image-overlay").hidden,url:location.href};
}
function auditEveryImage(){
 const images=[...document.querySelectorAll("main img:not([data-no-preview])")].filter(img=>!img.closest("nav,.brand,.doc-toc,.eyebrow,.page-footer"));
 const original=location.href,details=[];
 for(const img of images){
  img.click();
  const dialog=document.querySelector(".genui-image-overlay");
  details.push({name:img.getAttribute("src"),opened:!!dialog&&!dialog.hidden,samePage:location.href===original});
  if(dialog&&!dialog.hidden)dialog.querySelector("[data-image-close]")?.click();
 }
 return{count:images.length,allPass:details.every(v=>v.opened&&v.samePage),details};
}
function auditEveryImageLink(){
 const links=[...document.querySelectorAll("main a[href]")].filter(a=>!a.hasAttribute("download")&&/\.(png|jpe?g|gif|webp|svg|avif)(?:[?#].*)?$/i.test(a.getAttribute("href")||""));
 const original=location.href,details=[];
 for(const anchor of links){
  anchor.click();
  const dialog=document.querySelector(".genui-image-overlay");
  details.push({href:anchor.getAttribute("href"),opened:!!dialog&&!dialog.hidden,samePage:location.href===original});
  if(dialog&&!dialog.hidden)dialog.querySelector("[data-image-close]")?.click();
 }
 return{count:links.length,allPass:details.every(v=>v.opened&&v.samePage),details};
}
function auditProseWrap(){
 const main=document.querySelector("main.genui-typography");
 if(!main||!/^zh(?:-|$)/i.test(document.documentElement.lang))return {skipped:true};
 const token=getComputedStyle(main).getPropertyValue("--genui-prose-width").trim();
 const paragraphs=[...main.querySelectorAll("p.genui-prose,.genui-prose-group>p")].filter(x=>x.getBoundingClientRect().width>0);
 const checks=paragraphs.map(el=>{
  const css=getComputedStyle(el),box=el.getBoundingClientRect(),parentStyle=getComputedStyle(el.parentElement);
  const parentContentWidth=el.parentElement.clientWidth-parseFloat(parentStyle.paddingLeft)-parseFloat(parentStyle.paddingRight);
  const tester=document.createElement("span");
  tester.style.cssText="position:absolute;visibility:hidden;display:block;max-width:none;box-sizing:content-box";
  tester.style.font=css.font;tester.style.width=token||"62ic";document.body.appendChild(tester);
  const cap=tester.getBoundingClientRect().width;tester.remove();
  const range=document.createRange();range.selectNodeContents(el);
  const fragments=[...range.getClientRects()].filter(r=>r.width>.2&&r.height>.2);
  const lines=[];
  for(const r of fragments){let line=lines.find(l=>Math.abs(l.top-r.top)<3);if(!line){line={top:r.top,left:r.left,right:r.right};lines.push(line)}else{line.left=Math.min(line.left,r.left);line.right=Math.max(line.right,r.right)}}
  const firstLine=lines.length?lines[0].right-lines[0].left:0;
  const expected=Math.min(parentContentWidth,cap);
  const isLong=el.textContent.trim().length>=80&&lines.length>=2&&!el.querySelector("br");
  return {chars:el.textContent.trim().length,width:Math.round(box.width),parent:Math.round(parentContentWidth),cap:Math.round(cap),
   firstLine:Math.round(firstLine),lineCount:lines.length,textWrap:css.textWrap,
   ok:css.textWrap!=="balance"&&box.width+6>=expected*.94&&(!isLong||firstLine>=box.width*.82)};
 });
 return {skipped:false,count:checks.length,failures:checks.filter(x=>!x.ok).slice(0,5),pass:checks.every(x=>x.ok),sample:checks.slice(0,3)};
}
function mobileToggle(){
 const toc=document.querySelector("main details.mobile-toc");if(!toc)return{present:false};
 toc.querySelector("summary")?.click();const opened=toc.open;toc.querySelector("summary")?.click();
 return{present:true,opened,closed:!toc.open};
}
try{
 if(!executable)throw Error("Chrome/Edge not installed");
 const listener=net.createServer();await new Promise(resolve=>listener.listen(0,"127.0.0.1",resolve));
 const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-html-gate-"));
 child=spawn(executable,["--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking","--no-first-run",
  "--remote-debugging-port="+port,"--remote-allow-origins=*","--user-data-dir="+profile,
  "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost","about:blank"],{stdio:"ignore",windowsHide:true});
 let tabs;
 for(let i=0;i<110;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){tabs=await r.json();break}}catch{}await delay(100)}
 if(!tabs)throw Error("Chrome debugger unavailable");
 ws=new WebSocket(tabs.find(x=>x.type==="page").webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 let seq=0;const jobs=new Map();
 ws.addEventListener("message",e=>{
  const x=JSON.parse(e.data);
  if(x.method==="Runtime.exceptionThrown")results.browserErrors.push(String(x.params?.exceptionDetails?.text||"exception").slice(0,280));
  if(x.method==="Network.requestWillBeSent"&&/^https?:\/\//i.test(x.params?.request?.url||""))results.externalRequests.push(String(x.params.request.url).slice(0,250));
  const job=jobs.get(x.id);if(!job)return;jobs.delete(x.id);x.error?job.reject(Error(JSON.stringify(x.error))):job.resolve(x.result);
 });
 command=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;jobs.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 evaluate=async expr=>{const r=await command("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error("Runtime evaluation failed: "+r.exceptionDetails.text);return r.result.value};
 const run=fn=>evaluate("("+fn.toString()+")()");
 await command("Page.enable");await command("Runtime.enable");await command("Network.enable");
 await command("Network.setBlockedURLs",{urls:["http://*","https://*"]});
 for(const width of [375,768,1440]){
  stage="viewport-"+width;
  await command("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width===375});
  await command("Page.navigate",{url:pathToFileURL(file).href});
  for(let i=0;i<100;i++){try{if(await evaluate("document.readyState==='complete'&&!!document.querySelector('main')"))break}catch{}await delay(90)}
  await delay(180);
  const state=await run(pageState);
  check("headings, valid real navigation anchors",state.headings===1&&state.tocLinks>=2&&state.anchorsValid,state);
  check("no page horizontal overflow",!state.overflow,{width,state});
  check("content images load offline",state.imagesLoaded,{count:state.imageCount,loaded:state.imagesLoaded});
  const prose=await run(auditProseWrap);
  if(!prose.skipped)check("Chinese prose wraps near reading column edge without balanced premature lines",prose.pass,prose);
  if(width===375)check("mobile contents visible",state.mobileVisible,state);
  await capture(width+"-expanded.png");
  if(!state.asideVisible){
   const mobile=await run(mobileToggle);
   check("mobile TOC toggles",mobile.present&&mobile.opened&&mobile.closed,mobile);
   continue;
  }
  check("left rail has single scrolling nav",state.sidebarOverflow!=="auto"&&state.navOverflow==="auto"&&state.listOverflow!=="auto",state);
  const long=await run(auditLongNav);
  check("long TOC scroll stays inside nav",long.scrolled&&long.sidebarTop===0&&long.treeTop===0,long);
  const folded=await run(foldState);
  check("folded rail displays compact M without extra button",folded.collapsed&&folded.toggleHidden&&folded.markHidden&&folded.brandLabel==="展开导航"&&folded.brandTabIndex===0&&folded.markCount===1,folded);
  check("folded rail compact; M and destination icons share one centerline",folded.railWidth<=60&&folded.brandWidth<=38
    &&folded.destinationCenter!==null&&Math.abs(folded.brandCenter-folded.railCenter)<=2
    &&Math.abs(folded.destinationCenter-folded.brandCenter)<=2&&folded.destinationSize<=18,folded);
  check("folded main stays centered",Math.abs(folded.center-width/2)<=Math.max(80,width*.08)&&folded.mainWidth>=300,folded);
  if(folded.reading&&width>=768){
   check("actual narrative block stays centered after folding",Math.abs(folded.reading.center-width/2)<=Math.max(72,width*.055),{reading:folded.reading,viewport:width,mainCenter:folded.center});
  }
  if(width===1440)await capture("1440-folded.png");
  await command("Input.dispatchMouseEvent",{type:"mouseMoved",x:folded.x,y:folded.y,button:"none"});
  await delay(70);
  const hovered=await run(hoveredState);
  check("M changes to aligned expand icon on hover",hovered.arrowVisible&&hovered.logoOpacity==="0"
    &&Math.abs(hovered.arrowCenter-hovered.brandCenter)<=1&&hovered.arrowSize<=18,hovered);
  check("hover surface uses very pale blue",hovered.hoverAlpha!==null&&hovered.hoverAlpha>0&&hovered.hoverAlpha<=.06,hovered);
  if(width===1440)await capture("1440-M-hover.png");
  await command("Input.dispatchMouseEvent",{type:"mousePressed",x:folded.x,y:folded.y,button:"left",buttons:1,clickCount:1});
  await command("Input.dispatchMouseEvent",{type:"mouseReleased",x:folded.x,y:folded.y,button:"left",buttons:0,clickCount:1});
  const restored=await run(expandedState);
  check("M single click expands rail",restored.expanded&&restored.buttonVisible,restored);
  await evaluate("(()=>{const h=document.querySelector('.doc-layout,[data-report-app]');h.querySelector('.doc-toc>.genui-sidebar-toggle,#toggle-sidebar').click();h.querySelector('.doc-toc>.toc-brand,#report-sidebar .brand').focus()})()");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  await command("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  const key=await run(expandedState);
  check("M keyboard Enter expands rail",key.expanded,key);
  if(width!==1440)continue;
  stage="image-1440";
  const url=await evaluate("location.href"),opened=await run(openImage);
  check("image available for UI audit",!opened.noImage||!requireImage,{imageCount:state.imageCount,required:requireImage});
  if(opened.noImage)continue;
  check("content image opens same-page modal with fullscreen",opened.opened&&opened.percent==="100%"&&opened.fullscreen&&opened.url===url,opened);
  if(!opened.opened)continue;
  await capture("1440-image-overlay.png");
  const zoom=await run(wheelImage);
  check("mouse wheel zoom works and does not navigate",zoom.before!==zoom.after&&zoom.url===url,zoom);
  await capture("1440-image-wheel-zoom.png");
  await evaluate("document.querySelector('.genui-image-overlay [data-image-fullscreen]').click()");
  await delay(140);
  const full=await evaluate("(()=>{const d=document.querySelector('.genui-image-overlay');return{active:document.fullscreenElement===d||d.classList.contains('is-fullscreen'),pressed:d.querySelector('[data-image-fullscreen]').getAttribute('aria-pressed')}})()");
  check("image fullscreen is distinct from modal",full.active&&full.pressed==="true",full);
  await evaluate("document.querySelector('.genui-image-overlay [data-image-close]').click()");
  check("modal closes",await evaluate("document.querySelector('.genui-image-overlay').hidden"));
  const link=await run(clickImageLink),urlAfter=await evaluate("location.href");
  check("image-file hyperlink cannot navigate to bare image URL",link.skipped||(link.overlayOpen&&urlAfter===url),{link,urlAfter});
  if(!link.skipped)await evaluate("document.querySelector('.genui-image-overlay [data-image-close]').click()");
  const allImgs=await run(auditEveryImage);
  check("every content image opens overlay without navigating",allImgs.count>0&&allImgs.allPass,allImgs);
  const allLinks=await run(auditEveryImageLink);
  check("every display image hyperlink opens overlay without navigating",allLinks.allPass,allLinks);
 }
 stage="runtime";
 check("no runtime JS exceptions",results.browserErrors.length===0,results.browserErrors);
 check("offline: no HTTP(S) requests",results.externalRequests.length===0,results.externalRequests);
}catch(e){
 results.fatal=String(e?.stack||e).slice(0,1500);
 check("browser gate completed",false,results.fatal);
 if(command){try{await capture("failure.png")}catch{}}
}finally{
 try{ws?.close()}catch{}try{child?.kill()}catch{}
 if(profile){try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:150})}catch{}}
 results.pass=results.checks.length>0&&results.checks.every(x=>x.pass);
 fs.writeFileSync(path.join(outDir,"acceptance.json"),JSON.stringify(results,null,2)+"\n");
 console.log(JSON.stringify({result:results.pass?"PASS":"FAIL",total:results.checks.length,failures:results.checks.filter(x=>!x.pass).map(x=>({stage:x.stage,name:x.name,details:x.details})),screenshots:results.screenshots,output:outDir}));
}
if(!results.pass)process.exitCode=1;
