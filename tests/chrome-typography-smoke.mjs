#!/usr/bin/env node
// Real Chrome typography regression for trusted local GEN-UI demos only.
// Runs independent of Playwright/Puppeteer and measures actual rendered text.
import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const defaultPages=[
  {id:"report",kind:"report",file:"demo/report.html"},
  {id:"doc-zh",kind:"doc",file:"demo/documents/project-analysis.html"},
  {id:"doc-en",kind:"doc",file:"demo/documents/en/project-analysis.html"},
  {id:"doc-zh-architecture",kind:"doc",file:"demo/documents/architecture-design.html"},
  {id:"doc-zh-plan",kind:"doc",file:"demo/documents/implementation-plan.html"},
  {id:"doc-zh-test",kind:"doc",file:"demo/documents/test-acceptance.html"},
  {id:"doc-en-architecture",kind:"doc",file:"demo/documents/en/architecture-design.html"},
  {id:"doc-en-plan",kind:"doc",file:"demo/documents/en/implementation-plan.html"},
  {id:"doc-en-test",kind:"doc",file:"demo/documents/en/test-acceptance.html"},
  {id:"generated-zh",kind:"generated",file:"tests/fixtures/generated-typography-zh.html"},
  {id:"generated-en",kind:"generated",file:"tests/fixtures/generated-typography-en.html"}
];
const cli=process.argv.slice(2);
if(cli.length&&(cli[0]!=="--generated"||cli.length<2))throw Error("Usage: node tests/chrome-typography-smoke.mjs [--generated <report.html> ...]");
const pages=cli.length?cli.slice(1).map((file,i)=>({id:"generated-"+(i+1),kind:"generated",file})):defaultPages;
const widths=[375,768,1440];
const chrome=[
  process.env.GEN_UI_CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
].filter(Boolean).find(fs.existsSync);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function check(label,observed,ok){if(!ok)throw Error(label+": "+JSON.stringify(observed));}
async function until(fn,label){for(let i=0;i<100;i++){try{const val=await fn();if(val)return val;}catch{}await sleep(100);}throw Error("Timed out: "+label);}

// Evaluated in Chrome. Range.getClientRects() measures rendered line boxes,
// rather than estimating wrapping from text length or CSS values.
function measure(kind){
  const selectors=kind==="report"
    ?["#main .overview-copy p","#main .showcase-lead","#main .case-block>p",
      "#main .case-block>ul","#main .case-block>ol","#main .before-after p",
      "#main #panel-rules>p"]
    :kind==="generated"
    ?["main.genui-typography .genui-prose","main.genui-typography .genui-prose-group>p",
      "main.genui-typography .genui-prose-group>ul","main.genui-typography .genui-prose-group>ol",
      "main.genui-typography .genui-prose-group>blockquote"]
    :[".doc-main .doc-lede",".doc-main .doc-summary>p",
      ".doc-main .doc-section>p",".doc-main .doc-section>ul",
      ".doc-main .doc-section>ol",".doc-main .doc-section .callout>p"];
  const targets=[...new Set(selectors.flatMap(s=>[...document.querySelectorAll(s)]))]
    .filter(el=>el.getBoundingClientRect().width>0
      &&getComputedStyle(el).visibility!=="hidden"
      &&!!el.getClientRects().length&&el.textContent.trim().length>=20
      &&!el.closest("[hidden]"));
  const metrics=targets.map((el,index)=>{
    const box=el.getBoundingClientRect(),style=getComputedStyle(el);
    const cap=document.createElement("span");
    cap.style.cssText="position:absolute;display:block;visibility:hidden;padding:0;border:0;max-width:none;box-sizing:content-box";
    cap.style.font=style.font;
    cap.style.width=getComputedStyle(el.closest("main")||el).getPropertyValue("--genui-prose-width").trim()||"72ch";
    document.body.appendChild(cap);
    const maxReading=cap.getBoundingClientRect().width;
    cap.remove();
    const range=document.createRange();
    range.selectNodeContents(el);
    const fragments=[...range.getClientRects()].filter(r=>r.width>.2&&r.height>.2);
    const lines=[];
    for(const r of fragments){
      let line=lines.find(x=>Math.abs(x.top-r.top)<3);
      if(!line){line={top:r.top,left:r.left,right:r.right};lines.push(line);}
      else{line.left=Math.min(line.left,r.left);line.right=Math.max(line.right,r.right);}
    }
    const lineWidths=lines.map(x=>x.right-x.left);
    const badLines=lines.filter(x=>x.left<box.left-3||x.right>box.right+3);
    const rawText=el.textContent.trim();
    return {
      id:el.tagName.toLowerCase()+"."+el.className+"-"+index,
      chars:rawText.length,
      width:Math.round(box.width),
      maxReading:Math.round(maxReading),
      maxWidth:style.maxWidth,
      lines:lines.length,
      maxLine:Math.round(Math.max(0,...lineWidths)),
      badLines:badLines.length,
      clipped:el.scrollWidth>el.clientWidth+2,
      leading:style.lineHeight,
      textWrap:style.textWrap,
      font:style.fontSize,
      bodyParagraph:kind==="report"?el.matches(".overview-copy p,.case-block>p,.before-after p,.showcase-lead"):kind==="generated"?el.matches("p"):el.matches(".doc-section>p")
    };
  });
  const layout=kind==="report"?document.querySelector("[data-report-app]"):document.querySelector(".doc-layout");
  const main=kind==="report"?document.getElementById("main"):document.querySelector(".doc-main");
  const nav=kind==="report"?document.getElementById("report-sidebar"):document.querySelector(".doc-toc");
  const table=document.querySelector(kind==="report"?"#records .table-wrap":".doc-main :is(.table-wrap,.table-scroll)");
  const code=document.querySelector(kind==="report"?"#case-review pre":".doc-main pre");
  const rootStyle=getComputedStyle(main);
  const heading=main?.querySelector(".genui-prose-group>h3");
  const headingStyle=heading?getComputedStyle(heading):null;
  const diagram=main?.querySelector(".diagram");
  return {
    viewport:innerWidth,
    language:document.documentElement.lang,
    collapsed:layout?.dataset.sidebarCollapsed==="true",
    mainWidth:Math.round(main.getBoundingClientRect().width),
    mainCenter:Math.round(main.getBoundingClientRect().left+main.getBoundingClientRect().width/2),
    navWidth:Math.round(nav.getBoundingClientRect().width),
    navVisible:getComputedStyle(nav).display!=="none",
    docOverflow:document.documentElement.scrollWidth>innerWidth+2,
    prose:metrics,
    typography:{enabled:main?.classList.contains("genui-typography")??false,
      widthToken:rootStyle.getPropertyValue("--genui-prose-width").trim(),
      leadingToken:rootStyle.getPropertyValue("--genui-prose-leading").trim(),
      headingMargin:headingStyle?parseFloat(headingStyle.marginTop):null,
      headingFont:headingStyle?parseFloat(headingStyle.fontSize):null},
    wide:{diagramWidth:diagram?Math.round(diagram.getBoundingClientRect().width):null,
      tableWidth:table?Math.round(table.getBoundingClientRect().width):null,
      tableMaxWidth:table?getComputedStyle(table).maxWidth:null,
      tableOverflowX:table?getComputedStyle(table).overflowX:null,
      codeMaxWidth:code?getComputedStyle(code).maxWidth:null
    }
  };
}
async function main(){
  if(!chrome)throw Error("Chrome or Edge not installed");
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-typography-"));
  const probe=net.createServer();
  await new Promise(ok=>probe.listen(0,"127.0.0.1",ok));
  const port=probe.address().port;
  await new Promise(ok=>probe.close(ok));
  const proc=spawn(chrome,[
    "--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking",
    "--no-first-run","--remote-debugging-address=127.0.0.1",
    "--remote-allow-origins=*","--remote-debugging-port="+port,
    "--user-data-dir="+profile,"about:blank"
  ],{stdio:"ignore",windowsHide:true});
  let socket;
  try{
    const tabs=await until(async()=>{
      const response=await fetch("http://127.0.0.1:"+port+"/json");
      return response.ok?response.json():null;
    },"Chrome CDP");
    socket=new WebSocket(tabs.find(t=>t.type==="page").webSocketDebuggerUrl);
    await new Promise((ok,bad)=>{
      socket.addEventListener("open",ok,{once:true});
      socket.addEventListener("error",bad,{once:true});
    });
    let seq=0;
    const pending=new Map();
    socket.addEventListener("message",e=>{
      const data=JSON.parse(e.data),task=pending.get(data.id);
      if(!task)return;
      pending.delete(data.id);
      data.error?task.reject(Error(JSON.stringify(data.error))):task.resolve(data.result);
    });
    const send=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++seq;
      pending.set(id,{resolve,reject});
      socket.send(JSON.stringify({id,method,params}));
    });
    const evaluate=async expr=>{
      const result=await send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const inspect=kind=>evaluate("("+measure.toString()+")("+JSON.stringify(kind)+")");
    await send("Page.enable");
    await send("Runtime.enable");
    const scenarios=[];
    for(const width of widths){
      await send("Emulation.setDeviceMetricsOverride",{
        width,height:1000,deviceScaleFactor:1,mobile:width===375
      });
      for(const page of pages){
        await send("Page.navigate",{url:pathToFileURL(path.resolve(root,page.file)).href});
        await until(()=>evaluate("document.readyState==='complete' && !!document.querySelector('main h1')"),page.id+" ready");
        if(page.kind==="generated"){
          const structure=await evaluate("({layout:!!document.querySelector('.doc-layout'),main:!!document.querySelector('.doc-layout>main.doc-main.genui-typography'),sidebar:!!document.querySelector('.doc-layout>.doc-toc'),mobile:!!document.querySelector('main .mobile-toc'),script:!!document.querySelector('script[src$=\"heading-nav.js\"]')})");
          check(page.id+" generated HTML must follow the doc-layout/sidebar/main/mobile-toc contract",structure,
            structure.layout&&structure.main&&structure.sidebar&&structure.mobile&&structure.script);
        }

        if(page.kind!=="report"&&width>700){
          await until(()=>evaluate("!!document.querySelector('.doc-toc>.genui-sidebar-toggle')"),page.id+" nav toggle");
        }
        const views=[{name:"expanded",data:await inspect(page.kind)}];
        if(page.kind==="report"){
          await evaluate("document.getElementById('toggle-sidebar').click()");
          views.push({name:"collapsed",data:await inspect(page.kind)});
        }else if(width>700){
          await evaluate("document.querySelector('.doc-toc>.genui-sidebar-toggle').click()");
          views.push({name:"collapsed",data:await inspect(page.kind)});
        }else{
          // On narrow documents, desktop sidebar is replaced by native details TOC.
          await evaluate("document.querySelector('.mobile-toc').open=true");
          views[0].name="mobile-toc-closed";
          views.push({name:"mobile-toc-open",data:await inspect(page.kind)});
        }
        for(const view of views){
          const data=view.data,reference=page.id+"/"+width+"/"+view.name;
          check(reference+" has narrative samples",data,data.prose.length>=(page.kind==="generated"?1:3));
          if(page.kind==="generated"){
            check(reference+" typography layer is loaded",data.typography,
              data.typography.enabled&&data.typography.widthToken===(/^zh(?:-|$)/i.test(data.language)?"46ic":"72ch")
              &&parseFloat(data.typography.leadingToken)>=1.6
              &&parseFloat(data.typography.leadingToken)<=1.85);
            if(/^zh(?:-|$)/i.test(data.language))
              check(reference+" Chinese paragraphs use natural balanced wrapping",data,
                data.prose.filter(x=>x.bodyParagraph).every(x=>x.textWrap==="balance"));
            if(data.wide.tableWidth!==null)check(reference+" table scroll stays inside its own container",data.wide,
              data.wide.tableOverflowX==="auto"||data.wide.tableOverflowX==="scroll");
            if(data.typography.headingMargin!==null)
              check(reference+" heading rhythm uses token",data.typography,
                Math.abs(data.typography.headingMargin/data.typography.headingFont-1.25)<.08);
          }
          check(reference+" page fits viewport",data,!data.docOverflow);
          check(reference+" all narrative blocks respect language-specific reading width",data,
            data.prose.every(x=>x.maxWidth!=="none"&&x.width<=x.maxReading+3));
          check(reference+" visible text remains within its own box",data,
            data.prose.every(x=>x.badLines===0&&!x.clipped&&x.maxLine<=x.width+3));
          check(reference+" long text wraps",data,
            data.prose.some(x=>x.lines>=2));
          check(reference+" true browser line-height matches typography tokens",data,
            data.prose.filter(x=>x.bodyParagraph).length>0
            &&data.prose.filter(x=>x.bodyParagraph).every(x=>Math.abs(
              parseFloat(x.leading)/parseFloat(x.font)-(page.kind==="doc"?1.85:page.kind==="generated"?parseFloat(data.typography.leadingToken):1.65))<0.035));
          if(width===1440){
            if(data.wide.tableWidth!==null)check(reference+" present wide table remains wider than prose",data,
              data.wide.tableWidth>Math.max(...data.prose.map(x=>x.width))+60
              &&!data.wide.tableMaxWidth.includes("72ch"));
            check(reference+" code region is not constrained as prose",data,
              !data.wide.codeMaxWidth||!data.wide.codeMaxWidth.includes("72ch"));
            if(page.kind==="generated")
              check(reference+" diagram keeps wide layout",data.wide,
                data.wide.diagramWidth===null||data.wide.diagramWidth>Math.max(...data.prose.map(x=>x.width))+60);
          }
          scenarios.push({
            page:page.id,width,mode:view.name,
            samples:data.prose.length,wrapped:data.prose.filter(x=>x.lines>=2).length,
            maxProsePx:Math.max(...data.prose.map(x=>x.width)),
            mainPx:data.mainWidth,tablePx:data.wide.tableWidth,overflow:data.docOverflow
          });
        }
        if(views.length>1&&width>700){
          check(page.id+"/"+width+" fold changes navigation state",views,
            !views[0].data.collapsed&&views[1].data.collapsed
            &&views[1].data.navWidth<views[0].data.navWidth);
          if(page.kind==="doc"||(page.kind==="report"&&width>800)){
            // A collapsed rail may enlarge the available column while the reading
            // canvas itself is capped and centered for comfortable line lengths.
            check(page.id+"/"+width+" collapsed content remains usable and centered",views,
              views[1].data.mainWidth>=Math.min(views[0].data.mainWidth,960)-2
              &&Math.abs(views[1].data.mainCenter-width/2)<=Math.max(80,width*.08));
          }else if(page.kind==="report"){
            // <=800px uses a stacked nav layout before switching to the icon rail.
            check(page.id+"/"+width+" report icon rail leaves usable reading canvas",views,
              views[1].data.mainWidth>=width-95);
          }else{
            check(page.id+"/"+width+" generated canvas expands after folding",views,
              views[1].data.mainWidth>=views[0].data.mainWidth-2);
          }
        }
      }
    }
    console.log(JSON.stringify({result:"PASS",scenarios:scenarios.length,measurements:scenarios}));
  }finally{
    try{socket?.close();}catch{}
    proc.kill();
    await sleep(250);
    fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
}
main().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
