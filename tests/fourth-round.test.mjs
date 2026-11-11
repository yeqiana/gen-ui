import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const require=createRequire(import.meta.url);
const {validate}=require("../assets/architecture-views.js");
test("轻量化不退化原则独立可读，七类图与八类架构图按需路由",()=>{
 const s=read("SKILL.md"),p=read("docs/skill-principles.md");
 for(const term of ["按需加载","渐进增强","防退化","单一表达"])assert.ok(p.includes(term),term);
 assert.match(s,/docs\/skill-principles\.md/);
 assert.match(s,/references\/architecture-patterns\.md/);
 assert.match(s,/Markdown/);
});
test("八类架构图支持纯容器分层，未知字段与非法数据被拒绝",()=>{
 const html=read("demo/architecture-patterns.html"),js=read("assets/architecture-views.js");
 const types=["业务架构","产品架构","系统架构","数据架构","技术架构","应用架构","功能架构","信息架构"];
 for(const type of types)assert.ok(html.includes('"type":"'+type+'"'),type);
 assert.equal((html.match(/data-architecture-view/g)||[]).length,8);
 assert.doesNotMatch(html,/<path[^>]+d=/);
 assert.match(html,/"children":\[/);
 assert.match(js,/textContent=text/);
 const m={type:"业务架构",title:"演示",layout:"stack",groups:[{name:"业务域",items:["账户","订单"]}]};
 assert.equal(validate(m),m);
 for(const invalid of [{...m,script:"alert(1)"},{...m,groups:[{name:"x",items:[""]}]},{...m,layout:"madeup"},{...m,groups:[]}])assert.throws(()=>validate(invalid));
});
test("HTML 默认双层章节导航，双击收展，图标默认隐藏且无可见时区偏移",()=>{
 const nav=read("assets/heading-nav.js");
 assert.match(nav,/genui-nav-level-/);
 assert.doesNotMatch(nav,/className="genui-nav-fold"/);
 assert.match(nav,/aria-expanded/);
 assert.match(nav,/main\.querySelectorAll\("h2,h3"\)/);
 assert.doesNotMatch(nav,/\^\\d\+\\\.\\d\+\\\.\\d\+/);
 for(const file of ["demo/report.html","demo/documents/architecture-design.html","demo/documents/project-analysis.html","demo/documents/implementation-plan.html","demo/documents/test-acceptance.html"]){
  const html=read(file);
  assert.match(html,/<aside\b/);
  assert.match(html,/heading-nav\.js/);
  assert.doesNotMatch(html,/<h[234][^>]*>\s*(?:\d+\.\d+|\d+\.)\s/);
  assert.doesNotMatch(html,/\+08:00<\/time>/);
 }
 const report=read("demo/report.html");
 assert.match(report,/data-navigation="left"/);
 assert.match(report,/（一） 状态构成/);
 assert.match(report,/<h4>七类专业关系图/);
});
test("复制与图片按钮首行对齐，全屏双击与滚轮可用，七类图图标尺寸一致",()=>{
 const css=read("demo/ui-refresh.css")+read("demo/documents/assets/document.css");
 assert.match(css,/pre\.code-block\{padding:14px 52px/);
 assert.match(css,/\.doc-section pre\{padding-top:14px;padding-right:50px/);
 const viewer=read("assets/media-viewer.js");
 assert.match(viewer,/pic\.addEventListener\("dblclick"/);
 assert.match(viewer,/stage\.addEventListener\("wheel"/);
 assert.match(viewer,/data-image-plus/);
 const semantic=read("assets/semantic-diagrams.css");
 for(const kind of ["zoom-in","zoom-out","fit","fullscreen"])assert.ok(semantic.includes('data-action="'+kind+'"'));
});
test("翻页、重置、打开与表格操作均为图标，状态单值且关键对比有语义颜色",()=>{
 const html=read("demo/report.html"),js=read("demo/report.js"),css=read("demo/report-refinements.css");
 for(const id of ["reset-filters","page-go","open-create","open-data-drawer","cancel-create","apply-json"])
  assert.match(html,new RegExp('id="'+id+'"[^>]*aria-label='));
 assert.match(js,/genui-action-icon/);
 assert.match(js,/dataset\.compareStatus = severity/);
 assert.doesNotMatch(css,/\.status::before/);
 assert.doesNotMatch(read("demo/ui-refresh.css"),/\.status::before/);
 for(const kind of ["success","failure","warning"])assert.ok(css.includes('td[data-compare-status="'+kind+'"]'));
});

test("第六轮：中文标题仅H2和H3编号，不再建立三级章节",()=>{const nav=read("assets/heading-nav.js");assert.match(nav,/const isChapter=/);assert.match(nav,/scheme==="chinese"/);assert.match(nav,/dataset.headingNumbering\|\|"preserve"/);assert.match(nav,/main.querySelectorAll\(".doc-section h4"\)/);});
test("第五轮：架构图支持三层嵌套并拒绝超限或未知字段",()=>{const base={type:"系统架构",title:"系统",layout:"groups",groups:[{name:"A",children:[{name:"B",children:[{name:"C",items:["D"]}]}]}]};assert.equal(validate(base),base);assert.throws(()=>validate({...base,groups:[{name:"A",children:[{name:"B",children:[{name:"C",children:[{name:"D",items:["E"]}]}]}]}]}));assert.throws(()=>validate({...base,groups:[{name:"A",children:[{name:"B",items:["ok"],script:"x"}]}]}));});
