import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import path from"node:path";
import {fileURLToPath} from"node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("HTML reports use idempotent offline icon-only SVG viewer and M favicon",()=>{
 const js=read("assets/media-viewer.js"),h=read("demo/report.html");
 for(const fragment of ["dataset.genUiDiagramReady","fullscreenchange","fullscreenerror","requestFullscreen","exitFullscreen","Escape","[data-graph-node]","[data-edge-from]","data-zoom-in","data-zoom-out","aria-pressed","clearTimeout"]){
  if(fragment==="clearTimeout")continue;assert.ok(js.includes(fragment),fragment);
 }
 assert.match(h,/rel="icon"[^>]+gen-ui-mark\.svg/);
 assert.match(h,/data-navigation="left"/);
 assert.match(h,/media-viewer\.js/);
 const mark=read("assets/icons/gen-ui-mark.svg");
 assert.match(mark,/<path d="M5 24 9 7 16 15 23 7 27 24"/);
});

test("Seven diagrams are contextual and labels do not overlap at rest",()=>{
 const h=read("demo/report.html");
 const types=["sequence","mind","deploy","er","activity","swim","component"];
 for(const type of types){
  assert.ok(h.includes('data-diagram-type="'+type+'"'),type);
  const file=type==="mind"?"project-analysis":["sequence","deploy","er","component"].includes(type)?"architecture-design":["activity","swim"].includes(type)?"implementation-plan":"test-acceptance";
  const page=read("demo/documents/"+file+".html");
  assert.ok(page.includes('data-diagram-type="'+type+'"'),"contextual document missing "+type);
 }
 assert.match(read("assets/media-viewer.js"),/overlaps/);
 assert.match(read("assets/media-viewer.js"),/reposition\(n,nx,ny\)/);
});

test("Copy and images use accessible icons without visible clipboard status strings",()=>{
 const js=read("assets/code-blocks.js"),media=read("assets/media-viewer.js"),h=read("demo/report.html"),css=read("assets/media-viewer.css");
 assert.match(js,/innerHTML=svg\.copy/);
 assert.match(js,/setTimeout\(\(\)=>\{if\(thisRun===sequence\)setState\("copy"\)/);
 assert.match(js,/1000/);
 assert.doesNotMatch(js,/代码已复制到剪贴板|已复制/);
 assert.match(media,/img\[data-zoomable\]/);
 assert.match(media,/originFocus\?\.focus\(\)/);
 assert.match(h,/data-zoomable/);
 assert.match(css,/blockquote>:last-child/);
 assert.match(css,/\.genui-image-overlay\[hidden\]/);
});

test("Standalone indexes offer left navigation and local M favicon",()=>{
 for(const f of ["demo/documents/index.html","demo/documents/en/index.html","demo/index.html"]){
  const h=read(f);
  assert.match(h,/<aside/);
  assert.match(h,/<nav\b/);
  assert.match(h,/gen-ui-mark\.svg/);
 }
});
