#!/usr/bin/env node
// Offline real-Chrome negative cases: a green baseline must turn red for narrow
// paragraphs, narrow lists, and artificial first-line indentation.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const frozen=path.join(root,"evals/artifacts/native-codex-storyos-2026-11-14");
const frozenHtml=fs.readFileSync(path.join(frozen,"report.html"),"utf8");
const listAnchor='<section id="decision" class="doc-section">';
assert.equal(frozenHtml.split(listAnchor).length,2,"Frozen first section anchor changed");
const baseline=frozenHtml.replace(listAnchor,listAnchor+'<ul class="genui-prose"><li>执行权与证据之间必须保持一致性，同时确保恢复的状态与真实事件结果可以逐项核对。</li><li>不得将工作流中的未验证状态标记成已完成，所有判断均应保留可追溯依据。</li></ul>');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"genui-prose-negative-"));
const scenarios=[
 ["positive","",true],
 ["narrow-centered","main.genui-typography .doc-section > p.genui-prose{max-width:55%!important;margin-inline:auto!important}",false],
 ["narrow-list","main.genui-typography .doc-section > ul{max-width:55%!important;margin-inline:auto!important}",false],
 ["first-line-indent","main.genui-typography .doc-section > p.genui-prose{text-indent:2em!important}",false]
];
function make(name,rules){
 const dir=path.join(temporary,name);
 fs.mkdirSync(dir,{recursive:true});
 assert.equal(baseline.split("</style></head>").length,2,"Frozen HTML style injection anchor changed");
 fs.writeFileSync(path.join(dir,"report.html"),baseline.replace("</style></head>","\n"+rules+"\n</style></head>"));
 fs.cpSync(path.join(frozen,"assets"),path.join(dir,"assets"),{recursive:true});
 for(const [src,dest] of [["assets/heading-nav.css","heading-nav.css"],["assets/typography.css","typography.css"],["demo/documents/assets/document.css","document.css"]])
  fs.copyFileSync(path.join(root,src),path.join(dir,"assets",dest));
 return path.join(dir,"report.html");
}
function verify([name,css,shouldPass]){
 const file=make(name,css),evidence=path.join(temporary,name+"-evidence");
 const proc=spawnSync(process.execPath,[path.join(root,"scripts/accept-html-delivery.mjs"),file,evidence,"--require-image"],{
  cwd:root,encoding:"utf8",timeout:180000,maxBuffer:3_000_000
 });
 assert.ifError(proc.error);
 const output=path.join(evidence,"acceptance.json");
 assert.ok(fs.existsSync(output),name+" missing evidence: "+proc.stderr?.slice(-500));
 const data=JSON.parse(fs.readFileSync(output,"utf8"));
 const failure=(data.checks||[]).filter(x=>!x.pass&&/narrative and quotation widths|Chinese prose wraps/.test(x.name));
 if(shouldPass){assert.equal(proc.status,0,name+" positive failed: "+JSON.stringify(failure));assert.equal(data.pass,true);}
 else{assert.equal(proc.status,1,name+" fault escaped: "+proc.stdout?.slice(-550));assert.equal(data.pass,false);
  assert.ok(failure.length>=1,name+" layout fault did not reach prose/indent gate");}
 return{name,status:shouldPass?"PASS":"REJECTED",matchingChecks:failure.map(x=>x.name)};
}
try{
 const results=scenarios.map(verify);
 console.log(JSON.stringify({result:"PASS",negativeCases:3,results}));
}finally{
 fs.rmSync(temporary,{recursive:true,force:true,maxRetries:4,retryDelay:120});
}
