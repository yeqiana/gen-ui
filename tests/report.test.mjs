import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ui = require("../demo/report.js");
const read = file => fs.readFileSync(path.join(base, file), "utf8");

test("演示记录为中文模拟数据，20/50/100 分页不填充末页", () => {
  const report = ui.validateReport(ui.sample());
  assert.equal(report.rows.length, 67);
  assert.match(report.title, /模拟数据/);
  assert.ok(report.rows.every(row => /[\u4e00-\u9fff]/.test(row.module)));
  assert.equal(ui.paginateRows(report.rows, 1, 20).rows.length, 20);
  assert.equal(ui.paginateRows(report.rows, 4, 20).rows.length, 7);
  assert.equal(ui.paginateRows(report.rows, 80, 20).page, 4);
  assert.equal(ui.paginateRows(report.rows, 1, 50).rows.length, 50);
  assert.equal(ui.paginateRows(report.rows, 2, 50).rows.length, 17);
  assert.equal(ui.paginateRows(report.rows, 1, 100).rows.length, 67);
  assert.throws(() => ui.paginateRows(report.rows, 1, 10), /20/);
  assert.deepEqual(ui.paginateRows([], 1, 20).rows, []);
});

test("筛选条件与具体列关联：编号、模块、状态、批次、耗时", () => {
  const rows = ui.sample().rows;
  const first = rows[0];
  const precise = ui.filterRows(rows, {
    query: first.id, module: first.module, batch: String(first.batch),
    status: first.status, slowOnly: false, threshold: 600
  });
  assert.equal(precise.length, 1);
  const wrongModule = ui.filterRows(rows, { module: "不存在的模块" });
  assert.deepEqual(wrongModule, []);
  const wrongBatch = ui.filterRows(rows, { batch: "不存在的批次" });
  assert.deepEqual(wrongBatch, []);
  const slow = ui.filterRows(rows, { slowOnly: true, threshold: 600 });
  assert.ok(slow.length > 0 && slow.length < rows.length);
  assert.ok(slow.every(row => row.durationMs > 600));
  assert.equal(ui.filterRows(rows, {query:"t-001"}).length, 1);
});

test("成功失败等指标、分类柱图与批次折线图共享筛选数据源", () => {
  const rows = ui.sample().rows;
  const stats = ui.summarize(rows, 600);
  assert.equal(stats.total, 67);
  assert.equal(stats.success + stats.failure + stats.pending, 67);
  assert.equal(stats.slow, rows.filter(row => row.durationMs > 600).length);
  assert.equal(ui.groupModules(rows).reduce((sum, group) => sum + group[1], 0), 67);
  assert.equal(ui.batchSeries(rows).reduce((sum, batch) => sum + batch.count, 0), 67);
  assert.deepEqual(ui.batchSeries([]).map(item => item.batch), [1,2,3,4,5,6,7,8,9,10,11,12]);
  const modules = Array.from({length:12}, (_,i)=>({id:"D"+i,module:"模块"+i,status:"success",durationMs:1,batch:1}));
  const groups = ui.groupModules(modules);
  assert.equal(groups.length, 8);
  assert.equal(groups[7][0], "其他");
  assert.equal(groups.reduce((sum,g)=>sum+g[1],0),12);
});

test("拒绝未知字段、脚本、越界、重复编号、无效数值和超量记录", () => {
  const data = ui.sample();
  assert.throws(() => ui.validateReport({...data, script:"alert(1)"}), /字段/);
  assert.throws(() => ui.validateReport({...data, version:"gen-ui-demo/v1"}), /版本/);
  assert.throws(() => ui.validateReport({...data, rows:[data.rows[0], {...data.rows[0]}]}), /重复/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], status:"eval"}]}), /状态/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], durationMs:Infinity}]}), /耗时/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], batch:13}]}), /批次/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], onClick:"alert(1)"}]}), /字段/);
  assert.throws(() => ui.validateReport({...data, rows:Array.from({length:1001},(_,i)=>({...data.rows[0],id:"X"+i}))}), /1000/);
});

class FakeNode {
  constructor(tag) {
    this.tagName=tag; this.children=[]; this.listeners={}; this.attributes={}; this.dataset={};
    this.textContent=""; this.value=""; this.checked=false; this.disabled=false;
    this.hidden=false; this.style={}; this.open=false; this.scrollWidth=0; this.clientWidth=0;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children=[...nodes]; }
  setAttribute(key,value) { this.attributes[key]=String(value); }
  addEventListener(type,callback) { this.listeners[type]=callback; }
  showModal() { this.open=true; }
  close() { this.open=false; }
  focus() { this.focused=true; }
  getBoundingClientRect() { return {left:125,top:130,width:60,height:20}; }
}
function boot() {
  const ids=new Map(), app=new FakeNode("app");
  app.dataset.navigation="left";
  const doc={
    querySelector(selector) { assert.equal(selector,"[data-report-app]"); return app; },
    getElementById(name) { if(!ids.has(name))ids.set(name,new FakeNode(name));return ids.get(name); },
    createElement(tag) { return new FakeNode(tag); },
    createElementNS(_namespace,tag) { return new FakeNode(tag); }
  };
  vm.runInNewContext(read("demo/report.js"), {document:doc}, {filename:"report.js"});
  return {app,get:id=>doc.getElementById(id)};
}
function dispatch(node,event,fields={}) {
  assert.equal(typeof node.listeners[event],"function",node.tagName+" lacks "+event);
  let prevented=false;
  node.listeners[event]({
    target:{...fields}, key:fields.key,
    preventDefault(){prevented=true;}
  });
  return prevented;
}

test("页面 DOM 初始化 20 条、中文数据状态与三个可访问的 SVG 图表", () => {
  const {get}=boot();
  assert.equal(get("report-rows").children.length,20);
  assert.match(get("page-info").textContent,/第 1–20 条/);
  assert.equal(Number(get("count-total").textContent),67);
  assert.equal(Number(get("count-success").textContent)+
    Number(get("count-failure").textContent)+Number(get("count-pending").textContent),67);
  assert.ok(get("report-rows").children[0].children[2].children[0].textContent==="失败");
  for(const name of ["pie","bar","line"]) {
    const graphic=get(name).children[0];
    assert.equal(graphic.tagName,"svg");
    assert.equal(graphic.attributes.role,"img");
    assert.ok(graphic.attributes["aria-label"].length>8);
    assert.match(graphic.attributes["aria-label"],/[\u4e00-\u9fff]/);
  }
});

test("模块、批次和状态联动重置分页；滑块与分页大小实际生效", () => {
  const {get,app}=boot();
  dispatch(get("next"),"click");
  assert.match(get("page-info").textContent,/第 21–40 条/);
  dispatch(get("module-filter"),"change",{value:"鉴权中心"});
  assert.equal(Number(get("count-total").textContent),ui.sample().rows.filter(row=>row.module==="鉴权中心").length);
  assert.match(get("page-info").textContent,/第 1\//);
  dispatch(get("batch-filter"),"change",{value:"2"});
  assert.equal(Number(get("count-total").textContent),ui.sample().rows.filter(row=>row.module==="鉴权中心"&&row.batch===2).length);
  dispatch(get("status"),"change",{value:"failure"});
  assert.equal(Number(get("count-total").textContent),ui.sample().rows.filter(row=>row.module==="鉴权中心"&&row.batch===2&&row.status==="failure").length);
  dispatch(get("reset-filters"),"click");
  assert.equal(Number(get("count-total").textContent),67);
  dispatch(get("page-size"),"change",{value:"50"});
  assert.equal(get("report-rows").children.length,50);
  dispatch(get("threshold"),"input",{value:"200"});
  assert.equal(get("threshold-value").textContent,"200 毫秒");
  dispatch(get("slow-only"),"change",{checked:true});
  assert.equal(Number(get("count-total").textContent),ui.sample().rows.filter(row=>row.durationMs>200).length);
  dispatch(get("nav-mode"),"change",{value:"top"});
  assert.equal(app.dataset.navigation,"top");
  dispatch(get("nav-mode"),"change",{value:"left"});
  assert.equal(app.dataset.navigation,"left");
});

test("筛选为空时显示中文空状态，三个图表不伪造数据", () => {
  const {get}=boot();
  dispatch(get("keyword"),"input",{value:"绝不可能匹配"});
  assert.equal(Number(get("count-total").textContent),0);
  assert.match(get("report-rows").children[0].children[0].textContent,/暂无符合条件/);
  for(const name of ["pie","bar","line"]) {
    assert.ok(get(name).children[0].children.some(child=>child.textContent==="暂无数据"),name);
  }
});

test("过长内容仅在真正截断时显示浮层，移出与失焦隐藏", () => {
  const {get}=boot();
  const span=get("report-rows").children[0].children[1].children[0];
  const tip=get("cell-tooltip");
  assert.equal(span.tabIndex,0);
  span.scrollWidth=150;
  span.clientWidth=44;
  dispatch(span,"mouseenter");
  assert.equal(tip.hidden,false);
  assert.equal(tip.textContent,"网关服务");
  dispatch(span,"mouseleave");
  assert.equal(tip.hidden,true);
  dispatch(span,"focus");
  assert.equal(tip.hidden,false);
  dispatch(span,"blur");
  assert.equal(tip.hidden,true);
  span.scrollWidth=30;span.clientWidth=44;
  dispatch(span,"mouseenter");
  assert.equal(tip.hidden,true);
  dispatch(get("table-scroll"),"scroll");
  assert.equal(tip.hidden,true);
});

test("页内标签切换不跳转；详情使用右侧抽屉，新增记录使用表单弹窗", () => {
  const {get}=boot();
  dispatch(get("tab-rules"),"click");
  assert.equal(get("panel-records").hidden,true);
  assert.equal(get("panel-rules").hidden,false);
  assert.equal(get("tab-rules").attributes["aria-selected"],"true");
  dispatch(get("tab-records"),"click");
  assert.equal(get("panel-records").hidden,false);
  const firstAction=get("report-rows").children[0].children[5].children[0];
  dispatch(firstAction,"click");
  assert.equal(get("detail-drawer").open,true);
  assert.equal(get("detail-content").children[0].textContent,"任务编号");
  dispatch(get("close-detail"),"click");
  assert.equal(get("detail-drawer").open,false);
  dispatch(get("open-create"),"click");
  assert.equal(get("create-dialog").open,true);
  get("new-id").value="T-068";
  get("new-module").value="新增模块";
  get("new-status").value="success";
  get("new-duration").value="35";
  get("new-batch").value="5";
  assert.equal(dispatch(get("create-form"),"submit"),true);
  assert.equal(get("create-dialog").open,false);
  assert.equal(Number(get("count-total").textContent),68);
  assert.ok(get("module-filter").children.some(option=>option.value==="新增模块"));
});

test("JSON 抽屉允许受控数据但拒绝脚本，保留上次合法内容", () => {
  const {get}=boot();
  dispatch(get("open-data-drawer"),"click");
  assert.equal(get("data-drawer").open,true);
  const input=get("report-json");
  const original=ui.sample();
  input.value=JSON.stringify({...original,rows:[{...original.rows[0],onClick:"alert(1)"}]});
  dispatch(get("apply-json"),"click");
  assert.equal(get("json-status").dataset.kind,"error");
  assert.equal(get("report-rows").children.length,20);
  const injectedTitle="<img src=x onerror=alert(1)>";
  input.value=JSON.stringify({version:"gen-ui-html-report/v1",title:injectedTitle,
    rows:[{id:"X1",module:"测试模块",status:"success",durationMs:22,batch:1}]});
  dispatch(get("apply-json"),"click");
  assert.equal(get("json-status").dataset.kind,"ok");
  assert.equal(get("report-title").textContent,injectedTitle);
  assert.equal(get("report-title").children.length,0);
  assert.equal(get("report-rows").children.length,1);
  dispatch(get("close-data"),"click");
  assert.equal(get("data-drawer").open,false);
});

test("中文 HTML 声明站内/外部导航，首列固定，正文无多余卡片容器", () => {
  const html=read("demo/report.html"),css=read("demo/report.css");
  assert.match(html,/<html lang="zh-CN">/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,/data-navigation="left"/);
  assert.match(html,/<nav aria-label="页面目录">/);
  assert.match(html,/<h2\b/);
  assert.match(html,/<h3\b/);
  assert.match(html,/id="tab-records" role="tab"/);
  assert.match(html,/页内标签/);
  assert.match(html,/新标签页打开/);
  assert.match(html,/target="_blank" rel="noopener noreferrer"/);
  assert.match(html,/<dialog id="create-dialog"/);
  assert.match(html,/<dialog id="detail-drawer"/);
  assert.match(html,/<dialog id="data-drawer"/);
  assert.match(css,/th,\s*td\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(css,/thead th:first-child,\s*tbody td:first-child\s*\{[^}]*position:\s*sticky/s);
  assert.match(css,/\.clip\s*\{[^}]*text-overflow:\s*ellipsis/s);
  assert.match(css,/\.cell-tooltip\s*\{/);
  assert.match(css,/\.metric\.positive dd\s*\{\s*color:\s*var\(--green\)/);
  assert.match(css,/\.metric\.negative dd\s*\{\s*color:\s*var\(--red\)/);
  assert.doesNotMatch(html,/\bon(click|submit|change)\s*=/i);
  assert.doesNotMatch(html,/\bclass="(panel|card|chart-box)\b/);
});

test("8 个品牌 SVG 图标完整，文件和页面中的图标引用都存在", () => {
  const dir=path.join(base,"assets/icons");
  const names=["gen-ui-mark","gen-ui-spark","gen-ui-table","gen-ui-chart","gen-ui-tab",
    "gen-ui-external","gen-ui-drawer","gen-ui-form"];
  for(const name of names) {
    const file=path.join(dir,name+".svg");
    assert.ok(fs.existsSync(file),name);
    const svg=fs.readFileSync(file,"utf8");
    assert.match(svg,/<svg\b/);
    assert.match(svg,/<\/svg>/);
    assert.match(svg,/viewBox=/);
  }
  const html=read("demo/report.html");
  for(const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    const dest=path.resolve(base,"demo",match[1]);
    assert.ok(fs.existsSync(dest),"Missing icon "+match[1]);
  }
  assert.match(html,/<link rel="icon" href="\.\.\/assets\/icons\/gen-ui-mark\.svg"/);
  assert.match(read("SKILL.md"),/HTML report contract/);
});

test("手工验收文档与严格 HTML 规范链接存在", () => {
  const doc=read("references/html-report-contract.md");
  assert.match(doc,/20 rows per page/);
  assert.match(doc,/HTML/);
  assert.match(read("README.zh-CN.md"),/HTML 报告/);
  assert.match(read("scripts/test-skill.ps1"),/tests\/report.test.mjs/);
});
