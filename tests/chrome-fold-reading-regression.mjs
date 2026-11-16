#!/usr/bin/env node
// Browser regression for real reading widths around figure/table/blockquote and collapsed M.
// Generates isolated examples from a frozen model report; never modifies that report.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const model=path.join(repo,"evals/artifacts/native-codex-storyos-2026-11-14");
const orig=fs.readFileSync(path.join(model,"report.html"),"utf8");
const marker='</section>\n<section id="protocol" class="doc-section">';
assert.equal(orig.split(marker).length,2);
const text="这段中文技术说明专门验证图表和引用块附近的正文排版。MySQL 存储任务状态，Redis 记录活性信号，Outbox 提供可靠消息，Worker 通过 Fencing Token 拒绝旧执行者写回。折叠导航后正文应自然利用完整章节宽度，不应在左侧增加无意义的首行缩进或因旧宽度限制提前断行。";
const injections=[
 '<blockquote data-prose-case="quote"><p>'+text+'</p></blockquote>',
 '<p data-prose-case="after-quote">'+text+'</p>',
 '<div class="callout" data-prose-case="callout"><p>'+text+'</p></div>',
 '<p data-prose-case="after-callout">'+text+'</p>',
 '<p data-prose-case="after-table">'+text+'</p>'
].join("\n");
const html=orig.replace(marker,injections+marker).replace(
 '<p class="genui-prose">STORY → STORYBOARD',
 '<p class="genui-prose" data-prose-case="after-figure">STORY → STORYBOARD'
);
assert.notEqual(html,orig);
const base=fs.mkdtempSync(path.join(os.tmpdir(),"genui-fold-regression-"));
function create(name,breakage,initiallyFolded=false){
 const root=path.join(base,name);
 fs.mkdirSync(root,{recursive:true});
 fs.cpSync(path.join(model,"assets"),path.join(root,"assets"),{recursive:true});
 for(const [src,dest] of [["assets/heading-nav.css","heading-nav.css"],["assets/typography.css","typography.css"],["demo/documents/assets/document.css","document.css"]])
  fs.copyFileSync(path.join(repo,src),path.join(root,"assets",dest));
 if(breakage==="width"){
  fs.appendFileSync(path.join(root,"assets","typography.css"),"\n/* Deliberately bad model rule */\nmain.genui-typography .doc-section>p{max-width:62ic!important;text-indent:28px!important}\nmain.genui-typography .doc-section>blockquote{max-width:62ic!important}\n");
 }
 if(breakage==="mark"){
  fs.appendFileSync(path.join(root,"assets","heading-nav.css"),'\n/* Deliberately bad brand rule */\n.doc-layout[data-sidebar-collapsed="true"] .doc-toc>.toc-brand::before{opacity:0!important}\n');
 }
 const report=initiallyFolded?html.replace('<div class="doc-layout">','<div class="doc-layout" data-sidebar-collapsed="true">'):html;
 if(initiallyFolded)assert.notEqual(report,html,"test fixture must start folded");
 fs.writeFileSync(path.join(root,"report.html"),report);
 return root;
}
function run(name,folder){
 const evidence=path.join(base,name+"-audit");
 const r=spawnSync(process.execPath,[path.join(repo,"scripts/accept-html-delivery.mjs"),path.join(folder,"report.html"),evidence,"--require-image"],{
  cwd:repo,encoding:"utf8",timeout:210000
 });
 if(r.error)throw r.error;
 const result=path.join(evidence,"acceptance.json");
 assert.ok(fs.existsSync(result),r.stdout+"\n"+r.stderr);
 return {exit:r.status,audit:JSON.parse(fs.readFileSync(result,"utf8"))};
}
try{
 const positive=run("correct",create("correct",null));
 assert.equal(positive.exit,0,"correct layout must pass");
 assert.equal(positive.audit.pass,true);
 for(const name of ["after-figure","quote","after-quote","callout","after-callout","after-table"]){
  const audit=positive.audit.checks.find(x=>x.stage==="viewport-1440"&&x.name==="narrative and quotation widths/indents near media use reading column");
  assert.ok(audit?.pass&&audit.details.cases.includes(name),name+" was not validated");
 }
 const startsFolded=run("starts-folded",create("starts-folded",null,true));
 assert.equal(startsFolded.exit,0,"initially folded document must still pass both-state acceptance");
 assert.equal(startsFolded.audit.pass,true);
 const initialChecks=startsFolded.audit.checks.filter(x=>x.name==="initially folded rail renders a visible single M");
 assert.deepEqual(initialChecks.map(x=>x.stage),["viewport-768","viewport-1440"]);
 assert.ok(initialChecks.every(x=>x.pass));
 const badWidth=run("bad-width",create("bad-width","width"));
 assert.equal(badWidth.exit,1,"narrow paragraphs and indentation must fail");
 const widthFailures=badWidth.audit.checks.filter(x=>!x.pass&&/narrative|quotation/.test(x.name));
 assert.ok(widthFailures.some(x=>x.stage==="viewport-1440"));
 assert.ok(widthFailures.some(x=>x.stage==="viewport-768"));
 const badMark=run("bad-mark",create("bad-mark","mark"));
 assert.equal(badMark.exit,1,"hidden folded M must fail");
 const markFailures=badMark.audit.checks.filter(x=>!x.pass&&x.name==="folded M is visibly rendered before hover without duplicate logo");
 assert.deepEqual(markFailures.map(x=>x.stage),["viewport-768","viewport-1440"]);
 console.log(JSON.stringify({result:"PASS",positiveChecks:positive.audit.checks.length,
  initialFoldedChecks:initialChecks.length,detectedWidthFailures:widthFailures.length,detectedInvisibleMark:markFailures.length,
  cases:["after-figure","quote","after-quote","callout","after-callout","after-table"]}));
}finally{fs.rmSync(base,{recursive:true,force:true,maxRetries:3,retryDelay:130})}
