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
function makeMind(i){
 const root={id:'root'+i,x:25,y:235,w:190,h:78,title:multi(i).slice(0,110)};
 const branches=Array.from({length:3+pick(2)},(_,j)=>({id:'branch'+i+'_'+j,x:340,y:18+j*155,title:multi(j).slice(0,100),sub:'Responsibility '+j,children:Array.from({length:1+pick(2)},(_,k)=>({id:'child'+i+'_'+j+'_'+k,x:700,y:18+j*155+k*52,title:multi(k+j).slice(0,100)}))}));
 return {title:'Mind '+i,desc:'Random branching workflow',canvas:{width:1130,height:750},root,branches};
}
function makeZones(i,type){
 const zones=Array.from({length:3},(_,j)=>({id:'zone'+i+'_'+j,x:20+j*360,y:20,w:340,h:480,title:'Boundary '+j}));
 const nodes=zones.flatMap((z,j)=>Array.from({length:2},(_,k)=>({id:'node'+i+'_'+j+'_'+k,zone:z.id,x:z.x+35,y:95+k*185,w:225,h:80,title:multi(k+j).slice(0,120),sub:'Service '+k,kind:type==='component'?'component':'service',...(type==='component'?{ports:['https','events']}:{} )})));
 const edges=Array.from({length:5+pick(4)},(_,j)=>{const a=nodes[j%nodes.length],b=nodes[(j+2)%nodes.length];return{id:'conn'+i+'_'+j,from:a.id,to:b.id,label:multi(j).slice(0,220),d:'M'+(a.x+a.w)+' '+(a.y+40)+' L'+b.x+' '+(b.y+40),lx:120+pick(900),ly:65+pick(390)};});
 return {title:type+' '+i,desc:'Multi-zone system',canvas:{width:1100,height:560},zones,nodes,edges};
}
function makeSwim(i){
 const lanes=Array.from({length:4},(_,j)=>({id:'lane'+i+'_'+j,title:'Role '+j,detail:'Ownership '+j,y:25+j*135}));
 const nodes=lanes.flatMap((l,j)=>Array.from({length:2},(_,k)=>({id:'task'+i+'_'+j+'_'+k,lane:l.id,x:205+k*480,y:l.y+20,w:210,h:70,title:multi(j+k).slice(0,100),sub:'Action '+k})));
 const edges=Array.from({length:6},(_,j)=>{const a=nodes[j],b=nodes[j+1];return{id:'flow'+i+'_'+j,from:a.id,to:b.id,label:multi(j).slice(0,130),d:'M'+(a.x+a.w)+' '+(a.y+35)+' L'+b.x+' '+(b.y+35),lx:260+pick(500),ly:70+pick(435)};});
 return {title:'Swim '+i,desc:'Responsible teams',canvas:{width:1060,height:600},lanes,nodes,edges};
}
const types=["sequence","er","activity","mind","deploy","swim","component"];
const generators={sequence:makeSequence,er:makeEr,activity:makeActivity,mind:makeMind,deploy:i=>makeZones(i,"deploy"),swim:makeSwim,component:i=>makeZones(i,"component")};
const cases=Array.from({length:280},(_,i)=>({seed:"0xC0FFEE",index:i,type:types[i%7],model:generators[types[i%7]](i)}));
check(cases.length===280,"case count",{count:cases.length});
if(!chrome)throw Error("Chrome missing");
const mobile=process.argv.includes("--mobile");
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
 await cmd("Emulation.setDeviceMetricsOverride",{width:mobile?375:900,height:850,deviceScaleFactor:1,mobile:false});
 await cmd("Page.navigate",{url:pathToFileURL(path.join(root,"demo","model-boundaries.html")).href});await sleep(550);
 const errors=[];
 for(const c of cases){
  const result=await evaluate("(()=>{const c="+JSON.stringify(c)+";const host=document.createElement('section');host.className='genui-semantic-diagram';host.dataset.semanticDiagram=c.type;const json=document.createElement('script');json.type='application/json';json.dataset.diagramModel='';json.textContent=JSON.stringify(c.model);host.appendChild(json);document.querySelector('main').appendChild(host);const check=window.GenUISemantic.validateModel(c.type,c.model);if(!check.ok){host.remove();return{valid:false,error:check.error}};window.GenUISemantic.init(host);const s=host.querySelector('.semantic-svg');if(!s){const error=host.dataset.semanticError;host.remove();return{valid:true,render:false,error}};return new Promise(done=>setTimeout(()=>{const vr=s.viewBox.baseVal,actors=[...s.querySelectorAll('.semantic-actor')];const outOfBounds=actors.some(a=>{const box=a.getBBox();const transform=a.transform.baseVal.consolidate().matrix;const x=box.x+transform.e;return x<0||x+box.width>vr.width+1});const chips=[...s.querySelectorAll('.semantic-edge-chip')];const visible=chips.filter(ch=>ch.dataset.layoutOk==='true');const nodes=[...s.querySelectorAll('.semantic-node-shape,.semantic-actor>rect')].filter(n=>n.getBoundingClientRect().width>0);const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;const collisions=visible.filter(ch=>{const r=ch.querySelector('rect').getBoundingClientRect();return nodes.some(n=>hit(r,n.getBoundingClientRect()))});const arrowSafe=[...s.querySelectorAll('.semantic-edge path[marker-end]')].every(path=>{try{const tip=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());return visible.every(ch=>{const box=ch.querySelector('rect').getBoundingClientRect();return !(box.left<tip.x+8&&box.right>tip.x-8&&box.top<tip.y+8&&box.bottom>tip.y-8);});}catch{return false;}});const badFallback=chips.filter(ch=>ch.dataset.layoutOk==='fallback').filter(ch=>!host.querySelector('.semantic-fallback-link[title]'));const ids=[...s.querySelectorAll('.semantic-edge')].map(x=>x.dataset.id);const uniqueIds=new Set(ids).size===ids.length;const nodeOverflow=[...s.querySelectorAll('.semantic-actor,.semantic-entity,.semantic-node')].filter(n=>{const shape=n.querySelector('.semantic-node-shape');if(!shape)return false;const w=Number(shape.getAttribute('width'));if(!w)return false;return [...n.querySelectorAll(':scope > text')].some(t=>t.getComputedTextLength()>w-8)}).length;let semanticPaths=true;if(c.type==='activity'){const shell=host.querySelector('.semantic-shell'),reject=shell.querySelector('[data-id=reject'+c.index+']'),success=shell.querySelector('[data-id=ok'+c.index+']');shell.querySelector('[data-action=path-retry]').click();semanticPaths=!reject.classList.contains('is-path-muted')&&success.classList.contains('is-path-muted');shell.querySelector('[data-action=path-normal]').click();semanticPaths=semanticPaths&&reject.classList.contains('is-path-muted')&&!success.classList.contains('is-path-muted');shell.querySelector('[data-action=path-all]').click();}let toggleOk=true;const view=host.querySelector('.semantic-shell');const fire=n=>n&&n.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(c.type==='mind'){const t=view.querySelector('[data-toggle-branch]'),parts=[...view.querySelectorAll('[data-parent='+t.dataset.toggleBranch+']')];fire(t);toggleOk=parts.length>0&&t.dataset.expanded==='false'&&parts.every(n=>n.classList.contains('is-hidden'));fire(t);toggleOk=toggleOk&&t.dataset.expanded==='true'&&parts.every(n=>!n.classList.contains('is-hidden'));}if(c.type==='deploy'||c.type==='swim'){const zone=c.type==='deploy',t=view.querySelector(zone?'[data-zone-toggle]':'[data-lane-toggle]'),key=zone?'zone':'lane',target=t.getAttribute('data-'+key+'-toggle'),parts=[...view.querySelectorAll('[data-'+key+'-content='+target+']')];fire(t);toggleOk=parts.length>0&&parts.every(n=>n.classList.contains('is-hidden'));fire(t);toggleOk=toggleOk&&parts.every(n=>!n.classList.contains('is-hidden'));}if(c.type==='component'){const b=view.querySelector('[data-action=ports]'),parts=[...view.querySelectorAll('[data-port]')];fire(b);toggleOk=parts.length>0&&parts.every(n=>n.classList.contains('is-hidden'));fire(b);toggleOk=toggleOk&&parts.every(n=>!n.classList.contains('is-hidden'));}const truncation=chips.every(ch=>{const full=ch.querySelector('title')?.textContent||'';return ch.dataset.truncated!=='true'||ch.querySelector('text').textContent.length<full.length});const pageOverflow=document.documentElement.scrollWidth>document.documentElement.clientWidth+2;const layoutState=chips.every(ch=>['true','fallback'].includes(ch.dataset.layoutOk));window.GenUISemantic.destroy(host);const destroyed=!host.querySelector('.semantic-svg');window.GenUISemantic.init(host);window.GenUISemantic.init(host);const reinit=host.querySelectorAll('.semantic-svg').length===1;window.GenUISemantic.destroy(host);host.remove();done({valid:true,render:true,viewBox:vr.width,actors:actors.length,outOfBounds,arrowSafe,collisions:collisions.length,badFallback:badFallback.length,uniqueIds,nodeOverflow,semanticPaths,truncation,layoutState,toggleOk,pageOverflow,destroyed,reinit});},75))})()");
  if(!(result.valid&&result.render&&!result.outOfBounds&&result.arrowSafe&&result.collisions===0&&result.badFallback===0&&result.uniqueIds&&result.nodeOverflow===0&&result.semanticPaths&&result.truncation&&result.layoutState&&result.toggleOk&&!result.pageOverflow&&result.destroyed&&result.reinit))errors.push({index:c.index,type:c.type,result,model:c.model});
 }
 const output={seed:"0xC0FFEE",viewport:mobile?375:900,cases:cases.length,pass:cases.length-errors.length,failed:errors.length,failures:errors.slice(0,4)};
 fs.mkdirSync(path.join(root,"evals","artifacts","stress-2026-11-11"),{recursive:true});fs.writeFileSync(path.join(root,"evals","artifacts","stress-2026-11-11",mobile?"result-mobile.json":"result.json"),JSON.stringify(output,null,2));
 console.log(JSON.stringify({seed:output.seed,viewport:output.viewport,cases:output.cases,pass:output.pass,failed:output.failed,failures:errors.slice(0,2).map(e=>({index:e.index,type:e.type,result:e.result}))}));
 if(errors.length)process.exitCode=1;
}finally{try{socket?.close()}catch{}proc.kill();await sleep(150);fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
