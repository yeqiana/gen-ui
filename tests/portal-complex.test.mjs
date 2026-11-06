import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {buildPortal,collectPages} from "../scripts/build-html-portal.mjs";
import {startPortalServer} from "../scripts/serve-html-portal.mjs";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),"genui-deep-folder-"));
const sha=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const manifest=file=>JSON.parse(fs.readFileSync(file,"utf8").match(/<script type="application\/json" id="page-manifest">([\s\S]*?)<\/script>/)[1]);
function page(title,css,js,asset){
 return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>'+title+'</title><link rel="stylesheet" href="'+css+'"></head><body><h1>'+title+'</h1><h2 id="section">分节</h2><img alt="模拟图片" src="'+asset+'"><p>说明</p><script src="'+js+'"></script></body></html>';
}
test("真实 GEN-UI 仓库级集成，递归发现所有类型来源并保持源文件",()=>{
 const target=path.join(repo,"evals","real-repo-directory-portal.html");
 if(fs.existsSync(target))throw Error("Temporary portal path already exists");
 try{
 const pages=collectPages(repo,target);
 assert.ok(pages.length>=6,"至少六个真实仓库 HTML 文件，实际 "+pages.length);
 assert.ok(pages.some(p=>p.href==="demo/report.html"));
 assert.ok(pages.some(p=>p.href.includes("portal-pages/")&&p.parts.length>=3));
 assert.ok(pages.some(p=>p.href.includes("artifacts/")));
 assert.ok(!pages.some(p=>p.href==="demo/portal-pages/index.html"));
 const before=pages.map(p=>({href:p.href,sha:sha(path.join(repo,...p.parts)),bytes:fs.statSync(path.join(repo,...p.parts)).size}));
 const output=buildPortal({dir:repo,output:target,title:"仓库真实 HTML 集成验收"});
 const m=manifest(output.output);
 assert.equal(m.pages.length,pages.length);
 assert.deepEqual(m.pages.map(p=>p.href),pages.map(p=>p.href));
 for(let i=0;i<pages.length;i++)assert.equal(sha(path.join(repo,...pages[i].parts)),before[i].sha);
 const rebuilt=buildPortal({dir:repo,output:target,title:"仓库真实 HTML 集成验收"});
 assert.equal(rebuilt.sourceCount,output.sourceCount);
 assert.equal(m.prefix,"..");
 console.log("REPO_DIRECTORY_EVIDENCE="+JSON.stringify({sourceCount:pages.length,nestedPages:pages.filter(p=>p.parts.length>2).length,groups:output.groupCount,files:before}));
 }finally{fs.rmSync(target,{force:true})}
});
test("多层目录 + 空格/#/&/% + CSS/JS/SVG 资源与手写索引完整保留",async()=>{
 const root=temp();
 try{
  fs.mkdirSync(path.join(root,"第一章","第二组","第三层","第四层"),{recursive:true});
  fs.mkdirSync(path.join(root,"archive","2026-11"),{recursive:true});
  const files=[],rootIndex=path.join(root,"index.html");
  fs.writeFileSync(rootIndex,'<!doctype html><html lang="zh-CN"><head><title>手工索引</title></head><body><h1>手工索引</h1></body></html>');
  const original=sha(rootIndex);
  for(let i=0;i<37;i++){
   const dir=i%3===0?path.join(root,"第一章","第二组","第三层","第四层"):i%3===1?path.join(root,"archive","2026-11"):root;
   const name=(i===4?"中文 # 空格&":i===5?"百分号%20测试":"模拟-"+String(i).padStart(2,"0"))+".html";
   const css="styles-"+i+".css",js="page-"+i+".js",svg="pic-"+i+".svg";
   const src=path.join(dir,name);
   fs.writeFileSync(src,page("深度验收 "+i,css,js,svg));
   fs.writeFileSync(path.join(dir,css),"body{font-size:15px;color:#292929}");
   fs.writeFileSync(path.join(dir,js),"document.body.dataset.loaded='ok'");
   fs.writeFileSync(path.join(dir,svg),'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="6"/></svg>');
   files.push(src);
  }
  const hashes=files.map(sha),out=path.join(root,"portal.html");
  const result=buildPortal({dir:root,output:out,title:"多层目录复杂验收"});
  assert.equal(result.sourceCount,38);
  assert.equal(sha(rootIndex),original);
  const m=manifest(out);
  assert.equal(m.pages.length,38);
  assert.ok(m.pages.some(x=>x.href.includes("%23")&&x.href.includes("%26")));
  assert.ok(m.pages.some(x=>x.href.includes("%25")));
  assert.ok(m.pages.some(x=>x.parts.length>=5));
  assert.deepEqual(files.map(sha),hashes);
  const server=await startPortalServer({dir:root,port:0});
  try{
   const base=server.url.replace("index.html",""),html=await fetch(base+"portal.html");
   assert.equal(html.status,200);assert.ok((await html.text()).includes("<iframe "));
   for(const item of m.pages){
    const response=await fetch(base+item.href);
    assert.equal(response.status,200,item.href);
    assert.match(response.headers.get("content-type"),/text\/html/);
   }
   for(const item of m.pages.filter(x=>x.title.startsWith("深度验收 ")).slice(0,3)){
    const folder=item.href.split("/").slice(0,-1).join("/");
    const index=item.title.split(" ").at(-1);
    for(const [name,ext] of [["styles-","css"],["page-","js"],["pic-","svg"]]){
     const response=await fetch(base+(folder?folder+"/":"")+name+index+"."+ext);
     assert.equal(response.status,200,ext+" resource");
    }
   }
  }finally{await new Promise(resolve=>server.server.close(resolve))}
 }finally{fs.rmSync(root,{recursive:true,force:true,maxRetries:3,retryDelay:150})}
});
