import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cases=[
  ["project-analysis","业务能力全景",["Workflow Run","故事策划","Artifact 引用"]],
  ["architecture-design","目标产品能力蓝图",["Reconciler","Outbox Publisher","Fencing Token"]],
  ["implementation-plan","分阶段建设全景",["阶段一 · 盘点","阶段二 · 核心改造","阶段三 · 故障恢复","阶段四 · 验收"]],
  ["test-acceptance","产品能力覆盖全景",["P0 · 一致性断言","旧 fencing 拒写","Outbox 补发"]]
];
const css=fs.readFileSync(path.join(root,"demo/documents/assets/product-panorama-case.css"),"utf8");
const pages=cases.map(([id,title,terms])=>({id,title,terms,html:fs.readFileSync(path.join(root,"demo/documents",id+".html"),"utf8")}));

test("四个中文技术案例均包含独立且业务相关的产品架构全景",()=>{
 for(const p of pages){
  assert.match(p.html,new RegExp('data-product-panorama-case="'+p.id+'"'));
  assert.equal((p.html.match(/data-product-panorama-case="/g)||[]).length,1);
  assert.equal((p.html.match(/data-panorama-layer="/g)||[]).length,6);
  assert.equal((p.html.match(/class="panorama-center-block"/g)||[]).length,2);
  assert.equal((p.html.match(/class="panorama-chip"/g)||[]).length,33);
  assert.equal((p.html.match(/class="panorama-channel"/g)||[]).length,5);
  assert.equal((p.html.match(/class="panorama-rail panorama-rail--/g)||[]).length,2);
  assert.ok(p.html.includes(p.title),p.id+" title");
  for(const term of p.terms)assert.ok(p.html.includes(term),p.id+": "+term);
 }
 assert.equal(new Set(pages.map(p=>p.html.match(/<div class="panorama-gateway">([^<]+)/)[1])).size,4);
});
test("分层海报复用纯 CSS、只在图内滚动、包含文字替代且不宣称上线",()=>{
 assert.match(css,/\.panorama-scroll\{[^}]*overflow-x:auto/);
 assert.match(css,/\.panorama-board\{[^}]*min-width:1000px/);
 assert.match(css,/@media print/);
 assert.doesNotMatch(css,/@import|url\(/);
 for(const p of pages){
  assert.match(p.html,/href="assets\/product-panorama-case\.css"/);
  assert.match(p.html,/href="\.\.\/\.\.\/assets\/product-panorama-svg-theme\.css"/);
  assert.match(p.html,/class="panorama-scroll" role="region" tabindex="0"/);
  assert.match(p.html,/class="panorama-text"><summary>展开六层产品架构文字版/);
  assert.match(p.html,/不表示生产系统已验证/);
  assert.doesNotMatch(p.html,/生产已验证|正式上线成功|全部验收通过/);
 }
});
test("四页不能误用通用商贸产品样例，也不能覆盖已有内容",()=>{
 for(const p of pages){
  assert.match(p.html,/class="doc-layout"/);
  assert.match(p.html,/class="doc-section"/);
  assert.match(p.html,/class="doc-summary"/);
  assert.match(p.html,/data-semantic-diagram/);
  const frag=p.html.slice(p.html.indexOf('data-product-panorama-case="'),p.html.indexOf('class="panorama-text"'));
  assert.doesNotMatch(frag,/采购管理|仓储管理|销售看板|ERP|WMS|ODS|DWD|DWS/);
 }
});

test("四张架构全景预览源于 Chrome 截图，可从中文 README 打开",()=>{
 const readme=fs.readFileSync(path.join(root,"README.zh-CN.md"),"utf8");
 for(const [id] of cases){
  const file="demo/documents/assets/product-panorama-"+id+"-preview.png";
  const b=fs.readFileSync(path.join(root,file));
  assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a",id);
  assert.equal(b.readUInt32BE(16),1050,id+" width");
  assert.ok(b.readUInt32BE(20)>=1000,id+" height");
  assert.ok(b.length>18000,id+" size");
  assert.ok(readme.includes(file),id+" readme link");
 }
});


test("四个案例共用 SVG 系列主题但保留独立业务模块",()=>{
 const theme=fs.readFileSync(path.join(root,"assets/product-panorama-svg-theme.css"),"utf8");
 assert.match(theme,/\.genui-product-panorama \.panorama-band-content/);
 assert.match(theme,/#eff6ff/i);
 assert.match(theme,/#dce4ee/i);
 assert.doesNotMatch(theme,/@import\b|url\s*\(/i);
 for(const p of pages)assert.equal((p.html.match(/product-panorama-svg-theme\.css/g)||[]).length,1,p.id);
});
