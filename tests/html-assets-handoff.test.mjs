import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cli=path.join(root,"scripts/prepare-html-assets.mjs");
test("resource handoff copies only bundled HTML assets, is idempotent and refuses overwrite",()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"genui-assets-"));
 const run=()=>spawnSync(process.execPath,[cli,tmp],{encoding:"utf8"});
 try{
  let r=run();
  assert.equal(r.status,0,r.stderr);
  let summary=JSON.parse(r.stdout);
  assert.equal(summary.created.length,7);
  assert.ok(fs.existsSync(path.join(tmp,"assets/document.css")));
  assert.ok(fs.existsSync(path.join(tmp,"assets/icons/gen-ui-mark.svg")));
  assert.equal(fs.existsSync(path.join(tmp,"report.html")),false,"No old HTML/template is shipped");
  r=run();assert.equal(r.status,0,r.stderr);
  summary=JSON.parse(r.stdout);
  assert.equal(summary.existing.length,7);
  const overwritten=path.join(tmp,"assets/document.css");
  fs.writeFileSync(overwritten,"/* own edits */");
  r=run();assert.equal(r.status,1,"Existing modified user content must not be overwritten");
  assert.ok(JSON.parse(r.stderr).conflicts.includes("document.css"));
 }finally{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
});
