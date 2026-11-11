#!/usr/bin/env node
// Seeded independent-business-model stress test. No external resources.
import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");


const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(fs.existsSync);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(ok,label,detail)=>{if(!ok)throw Error(label+": "+JSON.stringify(detail))};
let seed=0xC0FFEE;
const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
const pick=n=>Math.floor(rand()*n);
const multi=i=>i%2===0?"超长中文处理关系".repeat(8):"VeryLongEnglishRelationship".repeat(7);
function makeSequence(i){
 const n=2+pick(16),participants=Array.from({length:n},(_,j)=>({id:"actor"+j,name:j%3===0?multi(j).slice(0,90):"Actor "+j,sub:"worker"}));
 const messages=Array.from({length:1+pick(24)},(_,j)=>({from:participants[pick(n)].id,to:participants[pick(n)].id,label:multi(j).slice(0,Math.min(300,30+pick(270))),kind:["sync","async","return"][pick(3)]}));
 return{title:"Sequence "+i,desc:"Seeded stress test",canvas:{width:300+pick(500),height:200+pick(400)},participants,messages};
}
function makeEr(i){
 const n=2+pick(9),width=350+pick(1050),height=320+pick(500),entities=Array.from({length:n},(_,j)=>({id:"entity"+j,title:j%3===0?multi(j).slice(0,90):"TABLE_"+j,x:20+(j%3)*110,y:35+Math.floor(j/3)*95,w:100+pick(95),h:70,fields:[["id","PK","id","id"]]}));
 const relations=Array.from({length:1+pick(40)},(_,j)=>{const a=entities[pick(n)],b=entities[pick(n)];return{from:a.id,to:b.id,id:"rel"+j,label:multi(j).slice(0,Math.min(300,25+pick(260))),d:"M"+(a.x+a.w)+" "+(a.y+30)+" L"+b.x+" "+(b.y+30),lx:30+pick(width-60),ly:35+pick(height-70)}});
 return{title:"ER "+i,desc:"Seeded stress test",canvas:{width,height},entities,relations};
}
function makeActivity(i){
 const nodes=[
 {id:"start"+i,title:"Start",x:30,y:155,w:40,h:40,kind:"start"},
 {id:"branch"+i,title:"Verify",x:170,y:135,w:120,h:70,kind:"decision"},
 {id:"ok"+i,title:multi(i).slice(0,120),x:420,y:55,w:160,h:70,kind:"action",path:"normal"},
 {id:"reject"+i,title:multi(i+1).slice(0,120),x:420,y:275,w:160,h:70,kind:"action",path:"reject"},
 {id:"retry"+i,title:"Retry",x:650,y:275,w:120,h:70,kind:"action",path:"retry"}
 ];
 const edges=[
 {id:"entry"+i,from:nodes[0].id,to:nodes[1].id,label:"Start",d:"M70 175 H170",lx:115,ly:120},
 {id:"happy"+i,from:nodes[1].id,to:nodes[2].id,label:multi(i).slice(0,100),path:"normal",d:"M290 155 L420 90",lx:350,ly:70},
 {id:"bad"+i,from:nodes[1].id,to:nodes[3].id,label:multi(i+1).slice(0,130),path:"reject",d:"M290 175 L420 310",lx:345,ly:230},
 {id:"again"+i,from:nodes[3].id,to:nodes[4].id,label:"Recovery",path:"retry",d:"M580 310 H650",lx:610,ly:275}
 ];
 return {title:"Activity "+i,desc:"Random business paths",canvas:{width:810,height:440},nodes,edges};
}
const cases=Array.from({length:120},(_,i)=>({seed:"0xC0FFEE",index:i,type:["sequence","er","activity"][i%3],model:i%3===0?makeSequence(i):i%3===1?makeEr(i):makeActivity(i)}));
check(cases.length===120,"case count",{count:cases.length});
if(!chrome)throw Error("Chrome missing");
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-fuzz-"));
const srv=net.createServer();await new Promise(r=>srv.listen(0,"127.0.0.1",r));const port=srv.address().port;await new Promise(r=>srv.close(r));
const proc=spawn(chrome,["--headless=new","--disable-gpu","--disable-extensions","--disable-background-networking","--no-first-run","--remote-debugging-address=127.0.0.1","--remote-allow-origins=*","--remote-debugging-port="+port,"--user-data-dir="+profile,"about:blank"],{stdio:"ignore",windowsHide:true});let socket;
try {
 let pages;for(let i=0;i<100;i++){try{const r=await fetch("http://127.0.0.1:"+port+"/json");if(r.ok){pages=await r.json();break;}}catch{}await sleep(90)}check(!!pages,"Chrome startup",{});
 const page=pages.find(x=>x.type==="page");socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true})});
 let seq=0;const pending=new Map();socket.addEventListener("message",e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 await cmd("Page.enable");await cmd("Runtime.enable");
 await cmd("Emulation.setDeviceMetricsOverride",{width:900,height:850,deviceScaleFactor:1,mobile:false});
 await cmd("Page.navigate",{url:pathToFileURL(path.join(root,"demo","model-boundaries.html")).href});await sleep(550);
 const errors=[];
 for(const c of cases){
  const result=await evaluate("(()=>{const c="+JSON.stringify(c)+";const host=document.createElement('section');host.className='genui-semantic-diagram';host.dataset.semanticDiagram=c.type;const json=document.createElement('script');json.type='application/json';json.dataset.diagramModel='';json.textContent=JSON.stringify(c.model);host.appendChild(json);document.querySelector('main').appendChild(host);const check=window.GenUISemantic.validateModel(c.type,c.model);if(!check.ok){host.remove();return{valid:false,error:check.error}};window.GenUISemantic.init(host);const s=host.querySelector('.semantic-svg');if(!s){const error=host.dataset.semanticError;host.remove();return{valid:true,render:false,error}};return new Promise(done=>setTimeout(()=>{const vr=s.viewBox.baseVal,actors=[...s.querySelectorAll('.semantic-actor')];const outOfBounds=actors.some(a=>{const box=a.getBBox();const transform=a.transform.baseVal.consolidate().matrix;const x=box.x+transform.e;return x<0||x+box.width>vr.width+1});const chips=[...s.querySelectorAll('.semantic-edge-chip')];const visible=chips.filter(ch=>ch.dataset.layoutOk==='true');const nodes=[...s.querySelectorAll('.semantic-node-shape,.semantic-actor>rect')].filter(n=>n.getBoundingClientRect().width>0);const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;const collisions=visible.filter(ch=>{const r=ch.querySelector('rect').getBoundingClientRect();return nodes.some(n=>hit(r,n.getBoundingClientRect()))});const badFallback=chips.filter(ch=>ch.dataset.layoutOk==='fallback').filter(ch=>!host.querySelector('.semantic-fallback-link[title]'));const ids=[...s.querySelectorAll('.semantic-edge')].map(x=>x.dataset.id);const uniqueIds=new Set(ids).size===ids.length;const nodeOverflow=[...s.querySelectorAll('.semantic-actor,.semantic-entity,.semantic-node-activity')].filter(n=>{const shape=n.querySelector('.semantic-node-shape');if(!shape)return false;const w=Number(shape.getAttribute('width'));if(!w)return false;return [...n.querySelectorAll(':scope > text')].some(t=>t.getComputedTextLength()>w-8)}).length;let semanticPaths=true;if(c.type==='activity'){const shell=host.querySelector('.semantic-shell'),reject=shell.querySelector('[data-id=reject'+c.index+']'),success=shell.querySelector('[data-id=ok'+c.index+']');shell.querySelector('[data-action=path-retry]').click();semanticPaths=!reject.classList.contains('is-path-muted')&&success.classList.contains('is-path-muted');shell.querySelector('[data-action=path-normal]').click();semanticPaths=semanticPaths&&reject.classList.contains('is-path-muted')&&!success.classList.contains('is-path-muted');shell.querySelector('[data-action=path-all]').click();}const truncation=chips.every(ch=>{const full=ch.querySelector('title')?.textContent||'';return ch.dataset.truncated!=='true'||ch.querySelector('text').textContent.length<full.length});const layoutState=chips.every(ch=>['true','fallback'].includes(ch.dataset.layoutOk));window.GenUISemantic.destroy(host);const destroyed=!host.querySelector('.semantic-svg');window.GenUISemantic.init(host);window.GenUISemantic.init(host);const reinit=host.querySelectorAll('.semantic-svg').length===1;window.GenUISemantic.destroy(host);host.remove();done({valid:true,render:true,viewBox:vr.width,actors:actors.length,outOfBounds,collisions:collisions.length,badFallback:badFallback.length,uniqueIds,nodeOverflow,semanticPaths,truncation,layoutState,destroyed,reinit});},75))})()");
  if(!(result.valid&&result.render&&!result.outOfBounds&&result.collisions===0&&result.badFallback===0&&result.uniqueIds&&result.nodeOverflow===0&&result.semanticPaths&&result.truncation&&result.layoutState&&result.destroyed&&result.reinit))errors.push({index:c.index,type:c.type,result,model:c.model});
 }
 const output={seed:"0xC0FFEE",cases:cases.length,pass:cases.length-errors.length,failed:errors.length,failures:errors.slice(0,4)};
 fs.mkdirSync(path.join(root,"evals","artifacts","stress-2026-11-11"),{recursive:true});fs.writeFileSync(path.join(root,"evals","artifacts","stress-2026-11-11","result.json"),JSON.stringify(output,null,2));
 console.log(JSON.stringify({seed:output.seed,cases:output.cases,pass:output.pass,failed:output.failed,failures:errors.slice(0,2).map(e=>({index:e.index,type:e.type,result:e.result}))}));
 if(errors.length)process.exitCode=1;
}finally{try{socket?.close()}catch{}proc.kill();await sleep(150);fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
