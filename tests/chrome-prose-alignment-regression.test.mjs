import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const fixture="tests/fixtures/generated-typography-zh.html";
function run(file){
 const res=spawnSync(process.execPath,[path.join(root,"tests/chrome-typography-smoke.mjs"),"--generated",file],{cwd:root,encoding:"utf8",timeout:150000,maxBuffer:3_000_000});
 if(res.error)throw res.error;
 return{exit:res.status,out:res.stdout||"",err:res.stderr||""};
}
test("自然章节基线通过，正文窄栏、首行缩进和均衡标题必须失败",t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"genui-width-negative-"));
 t.after(()=>fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:120}));
 const local=path.join(tmp,"tests/fixtures"),assets=path.join(tmp,"assets");
 fs.mkdirSync(local,{recursive:true});fs.mkdirSync(path.join(assets,"icons"),{recursive:true});
 for(const f of ["typography.css","heading-nav.css","heading-nav.js"])
  fs.copyFileSync(path.join(root,"assets",f),path.join(assets,f));
 fs.copyFileSync(path.join(root,"assets/icons/gen-ui-mark.svg"),path.join(assets,"icons/gen-ui-mark.svg"));
 const original=fs.readFileSync(path.join(root,fixture),"utf8");
 const cases=[
  {id:"baseline",inject:"",pass:true},
  {id:"narrow",inject:"main.genui-typography p.genui-prose{max-width:60%!important;margin-inline:auto!important}",pass:false,issue:/chapter width and baseline|real chapter width/i},
  {id:"indent",inject:"main.genui-typography p.genui-prose{text-indent:2em!important}",pass:false,issue:/chapter width and baseline|real chapter width/i},
  {id:"balanced-heading",inject:"main.genui-typography h2{text-wrap:balance!important}",pass:false,issue:/headings occupy reading width|natural wrapping/i}
 ];
 for(const c of cases){
  const file=path.join(local,c.id+".html");
  const s=c.inject?original.replace("</head>","<style>"+c.inject+"</style></head>"):original;
  assert.notEqual(s.length,0);
  fs.writeFileSync(file,s,"utf8");
  const r=run(file);
  if(c.pass)assert.equal(r.exit,0,c.id+": "+r.err+"\n"+r.out.slice(-1200));
  else{
   assert.notEqual(r.exit,0,c.id+" unexpectedly passed");
   assert.match(r.err,c.issue,c.id+" wrong failure reason: "+r.err.slice(-1800));
  }
 }
});
