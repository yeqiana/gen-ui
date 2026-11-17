#!/usr/bin/env node
// On-demand Chrome regression: full-width headings pass; artificially narrowed headings fail.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=path.join(root,"evals/artifacts/native-codex-storyos-2026-11-14");
const base=fs.mkdtempSync(path.join(os.tmpdir(),"genui-title-wrap-"));
const shortTitle="<h1>StoryOS 异步编排架构评审</h1>";
const longTitle="<h1>StoryOS 异步编排架构评审：多 Worker 执行权、过期接管、围栏令牌与断点恢复设计验收</h1>";
const original=fs.readFileSync(path.join(source,"report.html"),"utf8");
assert.equal(original.split(shortTitle).length,2,"frozen source heading must match");
const natural=original.replace(shortTitle,longTitle);
const broken=natural.replace("</style></head>",
  "\n/* isolated negative fixture: deliberately premature heading lines */\n"+
  "main.genui-typography h1{text-wrap:balance;max-width:75%}\n</style></head>");
assert.notEqual(natural,broken);

function fixture(name,html){
 const dir=path.join(base,name);
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,"report.html"),html);
 fs.cpSync(path.join(source,"assets"),path.join(dir,"assets"),{recursive:true});
 // The frozen model HTML stays byte-identical; regressions run against current public CSS.
 for(const [src,dest] of [["assets/heading-nav.css","heading-nav.css"],["assets/typography.css","typography.css"],["demo/documents/assets/document.css","document.css"]])
  fs.copyFileSync(path.join(root,src),path.join(dir,"assets",dest));
 return dir;
}
function run(name,dir){
 const evidence=path.join(base,name+"-evidence");
 const call=spawnSync(process.execPath,[
  path.join(root,"scripts/accept-html-delivery.mjs"),
  path.join(dir,"report.html"),evidence,"--require-image"
 ],{cwd:root,encoding:"utf8",timeout:180000});
 if(call.error)throw call.error;
 const file=path.join(evidence,"acceptance.json");
 assert.ok(fs.existsSync(file),name+" did not create evidence: "+call.stderr);
 return {exit:call.status,data:JSON.parse(fs.readFileSync(file,"utf8"))};
}
try{
 const positive=run("positive",fixture("positive",natural));
 const negative=run("negative",fixture("negative",broken));
 assert.equal(positive.exit,0,"natural headings must pass");
 assert.equal(positive.data.pass,true);
 assert.equal(negative.exit,1,"artificial heading narrowing and balancing must be rejected");
 assert.equal(negative.data.pass,false);
 const negativeHeading=negative.data.checks.filter(x=>!x.pass&&/headings/.test(x.name));
 assert.ok(negativeHeading.some(x=>x.stage==="viewport-375"));
 assert.ok(negativeHeading.some(x=>x.stage==="viewport-768"));
 assert.ok(negativeHeading.some(x=>x.stage==="viewport-1440"));
 const correct=positive.data.checks.find(x=>x.stage==="viewport-1440"&&x.name==="headings use natural wrapping at the full section width");
 const incorrect=negative.data.checks.find(x=>x.stage==="viewport-1440"&&x.name===correct.name);
 assert.ok(correct?.pass&&!incorrect?.pass);
 const right=correct.details.sample[0],wrong=incorrect.details.sample[0];
 assert.ok(right.width>=right.parentContent*.9,"positive heading must occupy its full parent content width");
 assert.ok(wrong.width<right.width*.85,"negative fixture must demonstrate an artificially narrowed heading");
 console.log(JSON.stringify({result:"PASS",positive:positive.data.checks.length,
   negativeDetected:negativeHeading.length,viewportChecks:[375,768,1440],
   at1440:{available:right.parentContent,positiveFirstLine:right.firstLine,negativeFirstLine:wrong.firstLine}}));
}finally{
 fs.rmSync(base,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
