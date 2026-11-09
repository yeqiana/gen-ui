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

test("侧边栏收起保留纵向图标栏，展开按钮始终位于侧栏内部", () => {
  const {get,app}=boot();
  const toggle=get("toggle-sidebar");
  dispatch(toggle,"click");
  assert.equal(app.dataset.sidebarCollapsed,"true");
  assert.equal(toggle.attributes["aria-expanded"],"false");
  assert.equal(toggle.attributes["aria-label"],"展开目录");
  assert.equal(toggle.title,"展开目录");
  assert.equal(get("sidebar-toggle-glyph").style.transform,"rotate(180deg)");
  assert.equal(get("sidebar-toggle-label").textContent,"展开目录");
  dispatch(toggle,"click");
  assert.equal(app.dataset.sidebarCollapsed,"false");
  assert.equal(toggle.attributes["aria-expanded"],"true");
  assert.equal(toggle.attributes["aria-label"],"收起目录");
  const html=read("demo/report.html");
  const css=read("demo/report.css");
  assert.match(html,/<aside id="report-sidebar"[\s\S]*?<button id="toggle-sidebar"/);
  assert.match(css,/grid-template-columns:68px minmax\(0,1fr\)/);
  assert.doesNotMatch(css,/\.app\[data-sidebar-collapsed="true"\]\s+\.sidebar\s*\{\s*display:\s*none/);
});

test("标题不带冗余小标题，统一 SVG 图标并嵌入可操作流程图", () => {
  const html=read("demo/report.html");
  const heading=html.match(/<div class="page-heading">([\s\S]*?)<\/div>/)?.[1] ?? "";
  assert.match(heading,/<h1 id="report-title">工程质量分析<\/h1>\s*$/);
  assert.match(html,/<div class="overview-story">[\s\S]*?<svg id="flow-svg"[\s\S]*?<div class="overview-copy">/);
  assert.equal((html.match(/class="section-icon"/g) ?? []).length,3);
  assert.doesNotMatch(html,/id="data"|open-data-secondary/);
  assert.match(html,/class="icon-only" aria-label="关闭新增弹窗" title="关闭"/);
});

test("演示记录为中文模拟数据，默认10条并支持10/20/50分页", () => {
  const report = ui.validateReport(ui.sample());
  assert.equal(report.rows.length, 67);
  assert.match(report.title, /模拟数据/);
  assert.ok(report.rows.every(row => /[\u4e00-\u9fff]/.test(row.module)));
  assert.equal(ui.paginateRows(report.rows, 1, 10).rows.length, 10);
  assert.equal(ui.paginateRows(report.rows, 7, 10).rows.length, 7);
  assert.equal(ui.paginateRows(report.rows, 80, 10).page, 7);
  assert.equal(ui.paginateRows(report.rows, 1, 20).rows.length, 20);
  assert.equal(ui.paginateRows(report.rows, 4, 20).rows.length, 7);
  assert.equal(ui.paginateRows(report.rows, 1, 50).rows.length, 50);
  assert.equal(ui.paginateRows(report.rows, 2, 50).rows.length, 17);
  assert.throws(() => ui.paginateRows(report.rows, 1, 100), /10/);
  assert.deepEqual(ui.paginateRows([], 1, 10).rows, []);
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
  removeAttribute(key) { delete this.attributes[key]; }
  querySelectorAll(selector) {
    assert.equal(selector,".clip");
    const results=[];
    const visit=node=>{
      if((node.className||"").split(/\s+/).includes("clip"))results.push(node);
      for(const child of node.children)visit(child);
    };
    visit(this);
    return results;
  }
  addEventListener(type,callback) { this.listeners[type]=callback; }
  showModal() { this.open=true; }
  close() { this.open=false; }
  focus() { this.focused=true; }
  querySelector(selector) {
    if (selector === "tr:last-child .clip")
      return this.children.at(-1)?.children[0]?.children[0] ?? null;
    return null;
  }
  getBoundingClientRect() { return {left:125,top:130,width:60,height:20}; }
}
function boot(viewport={width:900,height:700}) {
  const ids=new Map(), app=new FakeNode("app");
  const win=new FakeNode("window");
  app.dataset.navigation="left";
  const doc={
    querySelector(selector) { assert.equal(selector,"[data-report-app]"); return app; },
    getElementById(name) { if(!ids.has(name)) { const node=new FakeNode(name); node.id=name; ids.set(name,node); } return ids.get(name); },
    createElement(tag) { return new FakeNode(tag); },
    createElementNS(_namespace,tag) { return new FakeNode(tag); }
  };
  vm.runInNewContext(read("demo/report.js"), {document:doc,window:win,innerWidth:viewport.width,innerHeight:viewport.height}, {filename:"report.js"});
  return {app,win,get:id=>doc.getElementById(id)};
}
function dispatch(node,event,fields={}) {
  assert.equal(typeof node.listeners[event],"function",node.tagName+" lacks "+event);
  let prevented=false;
  node.listeners[event]({
    target:{...fields}, currentTarget:node, key:fields.key,
    preventDefault(){prevented=true;}
  });
  return prevented;
}

test("页面 DOM 初始化 10 条、中文数据状态与三个可访问的 SVG 图表", () => {
  const {get}=boot();
  assert.equal(get("report-rows").children.length,10);
  assert.match(get("page-info").textContent,/第 1–10 条/);
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
  assert.match(get("page-info").textContent,/第 11–20 条/);
  dispatch(get("module-filter"),"change",{value:"鉴权中心"});
  assert.equal(Number(get("count-total").textContent),ui.sample().rows.filter(row=>row.module==="鉴权中心").length);
  assert.match(get("page-info").textContent,/1\/2 页/);
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
  assert.equal(span.tabIndex,-1);
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
  assert.match(get("page-info").textContent, /第 61–68 条/);
  const last = get("report-rows").children.at(-1);
  assert.equal(last.dataset.recordId, "T-068");
  assert.equal(last.children[0].children[0].focused, true);
  assert.match(get("page-notice").textContent, /新增成功.*T-068/);
  assert.equal(get("page-notice").dataset.kind, "ok");
  dispatch(get("previous"), "click");
  assert.equal(get("page-notice").textContent, "", "切换页面后应清理过期的成功提示");
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
  assert.equal(get("report-rows").children.length,10);
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

test("中文 HTML 使用简洁导航、首列固定且不添加原文操作", () => {
  const html=read("demo/report.html"),css=read("demo/report.css");
  assert.match(html,/<html lang="zh-CN">/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,/data-navigation="left"/);
  assert.match(html,/<nav aria-label="页面目录">/);
  assert.match(html,/<h2\b/);
  assert.match(html,/<h3\b/);
  assert.match(html,/id="tab-records" role="tab"/);
  assert.doesNotMatch(html,/新标签页打开|下载原MD|打印当前页|target="_blank"/);
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

test("7 个品牌 SVG 图标完整，文件和页面中的图标引用都存在", () => {
  const dir=path.join(base,"assets/icons");
  const names=["gen-ui-mark","gen-ui-spark","gen-ui-table","gen-ui-chart","gen-ui-tab",
    "gen-ui-drawer","gen-ui-form"];
  for(const name of names) {
    const file=path.join(dir,name+".svg");
    assert.ok(fs.existsSync(file),name);
    const svg=fs.readFileSync(file,"utf8");
    assert.match(svg,/<svg\b/);
    assert.match(svg,/<\/svg>/);
    assert.match(svg,/viewBox=/);
    const primitives=svg.match(/<(?:path|rect|circle|ellipse|line|polyline|polygon)\b/g)??[];
    assert.ok(primitives.length<=2,`${name} 应使用不超过 2 个主体几何元素`);
    assert.doesNotMatch(svg,/linearGradient|radialGradient|filter\b/i);
  }
  const html=read("demo/report.html");
  for(const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    const dest=path.resolve(base,"demo",match[1]);
    assert.ok(fs.existsSync(dest),"Missing icon "+match[1]);
  }
  assert.match(html,/<link rel="icon" href="\.\.\/assets\/icons\/gen-ui-mark\.svg"/);
  assert.match(html,/<p class="eyebrow"><img class="heading-mark" src="\.\.\/assets\/icons\/gen-ui-mark\.svg"/);
  assert.match(html,/<footer class="page-footer"><img src="\.\.\/assets\/icons\/gen-ui-mark\.svg"/);
  assert.equal([...html.matchAll(/<img[^>]+src="\.\.\/assets\/icons\/gen-ui-mark\.svg"/g)].length,3);
  assert.match(read("demo/report.css"),/\.eyebrow \.heading-mark/);
  assert.match(read("SKILL.md"),/HTML report contract/);
  const mark=read("assets/icons/gen-ui-mark.svg");
  assert.equal((mark.match(/<path\b/g)??[]).length,1,"个人 IP 只保留一条主体路径");
  assert.doesNotMatch(mark,/<(?:circle|ellipse|rect|polygon)\b|linearGradient|radialGradient/i);
  assert.match(mark,/viewBox="0 0 32 32"/);
  const viewBoxWidth=Number(mark.match(/viewBox="0 0 (\d+) \d+"/)?.[1]);
  const strokeWidth=Number(mark.match(/stroke-width="([\d.]+)"/)?.[1]);
  for(const size of [16,20,24]) assert.ok(strokeWidth*size/viewBoxWidth>=2,`${size}px 下线条过细`);
  assert.match(read("assets/icons/README.md"),/不绘制完整头部、五官或附加装饰/);
});

test("手工验收文档与严格 HTML 规范链接存在", () => {
  const doc=read("references/html-report-contract.md");
  assert.match(doc,/10 rows per page/);
  assert.match(doc,/HTML/);
  assert.match(read("README.zh-CN.md"),/HTML 报告/);
  assert.match(read("scripts/test-skill.ps1"),/tests\/report.test.mjs/);
});

test("移动端真实宽高测量后，长文本浮层不越过四周边界", () => {
  const {get}=boot({width:375,height:812});
  const span=get("report-rows").children[0].children[1].children[0];
  const tip=get("cell-tooltip");
  span.scrollWidth=600;
  span.clientWidth=100;
  span.getBoundingClientRect=()=>({left:75,top:130,bottom:150,width:100,height:20});
  tip.getBoundingClientRect=()=>({left:0,top:0,width:351,height:60});
  dispatch(span,"focus");
  const x=Number.parseFloat(tip.style.left), y=Number.parseFloat(tip.style.top);
  assert.equal(tip.hidden,false);
  assert.ok(x>=12 && x+351<=363, "浮层右边界越界");
  assert.ok(y>=12 && y+60<=800, "浮层垂直方向越界");
  span.getBoundingClientRect=()=>({left:75,top:5,bottom:25,width:100,height:20});
  dispatch(span,"focus");
  assert.ok(Number.parseFloat(tip.style.top)>=12,"顶部空间不足时浮层应向下");
});

test("站内标签完整支持方向键、Home、End 与阻止默认滚动", () => {
  const {get}=boot();
  assert.equal(dispatch(get("tab-records"),"keydown",{key:"ArrowRight"}),true);
  assert.equal(get("tab-rules").attributes["aria-selected"],"true");
  assert.equal(get("tab-rules").focused,true);
  assert.equal(dispatch(get("tab-rules"),"keydown",{key:"Home"}),true);
  assert.equal(get("tab-records").attributes["aria-selected"],"true");
  assert.equal(dispatch(get("tab-records"),"keydown",{key:"End"}),true);
  assert.equal(get("tab-rules").attributes["aria-selected"],"true");
  assert.equal(dispatch(get("tab-rules"),"keydown",{key:"ArrowLeft"}),true);
  assert.equal(get("tab-records").attributes["aria-selected"],"true");
  assert.equal(dispatch(get("tab-records"),"keydown",{key:"UnrelatedKey"}),false);
});

test("1000 条合法数据能够格式化后往返导入，同时保留 JSON 输入上限", () => {
  const rows=Array.from({length:1000},(_,index)=>({
    id:String(index).padStart(40,"0"),
    module:"模".repeat(40),
    status:"failure",durationMs:1000000,batch:12
  }));
  const data={version:"gen-ui-html-report/v1",title:"标".repeat(100),rows};
  const json=JSON.stringify(ui.validateReport(data),null,2);
  assert.ok(json.length>200000, "此用例必须复现旧的 20 万字符限制缺陷");
  assert.ok(json.length<ui.MAX_JSON_CHARS);
  const {get}=boot();
  get("report-json").value=json;
  dispatch(get("apply-json"),"click");
  assert.equal(get("json-status").dataset.kind,"ok");
  assert.equal(Number(get("count-total").textContent.replaceAll(",","")),1000);
  dispatch(get("apply-json"),"click");
  assert.equal(get("json-status").dataset.kind,"ok");
  get("report-json").value="x".repeat(ui.MAX_JSON_CHARS+1);
  dispatch(get("apply-json"),"click");
  assert.equal(get("json-status").dataset.kind,"error");
  assert.equal(Number(get("count-total").textContent.replaceAll(",","")),1000);
});

test("HTML 规范适用于最终 HTML 交付物，不改变默认 Markdown 路由",()=>{
  const skill=read("SKILL.md"),contract=read("references/html-report-contract.md");
  assert.match(skill,/Whenever the final deliverable is HTML/);
  assert.match(contract,/whenever HTML is the chosen or required final deliverable/);
  assert.match(skill,/Do not change ordinary Markdown/);
  assert.match(contract,/Markdown remains the default/);
});

test("最大 1000 条、含大量转义字符的合法报告仍可导入", () => {
  const padded="模" + "\u0000".repeat(39);
  const rows=Array.from({length:1000}, (_,index)=>({
    id:String(index).padStart(4,"0") + "\u0000".repeat(36),
    module:padded, status:"failure", durationMs:1000000, batch:12
  }));
  const input=JSON.stringify(ui.validateReport({
    version:"gen-ui-html-report/v1",title:"标".repeat(100),rows
  }),null,2);
  assert.ok(input.length>300000, "用例应覆盖大量转义字符导致的 JSON 膨胀");
  assert.ok(input.length<ui.MAX_JSON_CHARS, "最大合法数据必须允许再导入");
  const {get}=boot();
  get("report-json").value=input;
  dispatch(get("apply-json"),"click");
  assert.equal(get("json-status").dataset.kind,"ok");
  assert.equal(Number(get("count-total").textContent.replaceAll(",","")),1000);
});


test("键盘只进入真正发生截断的单元格，窗口尺寸变化后重新计算", () => {
  const {get, win}=boot();
  const spans=get("report-rows").querySelectorAll(".clip");
  assert.equal(spans.length,40);
  assert.ok(spans.every(span=>span.tabIndex===-1));
  const long=spans[1];
  long.scrollWidth=240;
  long.clientWidth=80;
  dispatch(win,"resize");
  assert.equal(long.tabIndex,0);
  assert.equal(long.attributes["aria-label"],"网关服务");
  assert.equal(spans.filter(span=>span.tabIndex===0).length,1);
  long.clientWidth=300;
  dispatch(win,"resize");
  assert.equal(long.tabIndex,-1);
  assert.equal("aria-label" in long.attributes,false);
});

test("模块名称 all 是合法数据，不可与“全部模块”筛选占位值冲突", () => {
  const rows=[
    {id:"X-1",module:"all",status:"success",durationMs:1,batch:1},
    {id:"X-2",module:"网关服务",status:"failure",durationMs:2,batch:1}
  ];
  assert.deepEqual(ui.filterRows(rows,{module:"all"}).map(row=>row.id),["X-1"]);
  assert.deepEqual(ui.filterRows(rows,{module:""}).map(row=>row.id),["X-1","X-2"]);
  const {get}=boot();
  get("report-json").value=JSON.stringify({version:"gen-ui-html-report/v1",title:"模块筛选边界测试",rows});
  dispatch(get("apply-json"),"click");
  const options=get("module-filter").children;
  assert.equal(options[0].value,"");
  assert.equal(options.filter(option=>option.value==="all").length,1);
  dispatch(get("module-filter"),"change",{value:"all"});
  assert.equal(Number(get("count-total").textContent),1);
  assert.equal(get("report-rows").children[0].dataset.recordId,"X-1");
  dispatch(get("reset-filters"),"click");
  assert.equal(get("module-filter").value,"");
  assert.equal(Number(get("count-total").textContent),2);
});

test("每条重复操作按钮有与记录关联的不同无障碍名称", () => {
  const {get}=boot();
  const rows=get("report-rows").children;
  const names=rows.map(row=>row.children[5].children[0].attributes["aria-label"]);
  assert.equal(names.length,10);
  assert.equal(new Set(names).size,10);
  for(let i=0;i<rows.length;i++)assert.match(names[i],new RegExp(rows[i].dataset.recordId));
  assert.ok(names.every(name=>name.includes("站内抽屉")));
});


test("总览卡片、十条分页和多色图表的静态资源全部离线可用", () => {
  const html=read("demo/report.html");
  const css=read("demo/ui-refresh.css");
  const pager=read("demo/pager-refresh.js");
  const charts=read("demo/chart-refresh.js");
  assert.match(html,/option value="10" selected/);
  assert.match(html,/id="page-numbers"/);
  assert.match(html,/id="page-jump-input"/);
  assert.match(css,/\.metric,.metric:first-child,.metric:last-child/);
  assert.match(css,/#67c23a/i);
  assert.match(css,/#f56c6c/i);
  assert.match(css,/\.status\.success/);
  assert.match(pager,/aria-current/);
  assert.match(charts,/#3A83F7/i);
  assert.match(charts,/#67C23A/i);
  assert.match(charts,/#E6A23C/i);
  for(const src of ["./ui-refresh.css","./chart-refresh.js","./pager-refresh.js"]){
    assert.ok(html.includes(src),"缺少离线资产: "+src);
    assert.ok(fs.existsSync(path.join(base,"demo",src)));
  }
  assert.doesNotMatch(charts+pager,/fetch\(|XMLHttpRequest|import\(/i);
});

test("内嵌 SVG 流程图具备全屏、缩放、适应窗口、拖拽、Esc和离线保障", () => {
  const html=read("demo/report.html"),js=read("demo/flow-viewer.js");
  assert.match(html,/<svg id="flow-svg"/);
  assert.match(html,/id="flow-canvas"/);
  for(const id of ["flow-fullscreen","flow-zoom-in","flow-zoom-out","flow-fit"]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(js,/requestFullscreen/);
  assert.match(js,/exitFullscreen/);
  assert.match(js,/pointerdown/);
  assert.match(js,/pointermove/);
  assert.match(js,/Escape/);
  assert.match(js,/viewBox/);
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|https?:\/\//i);
});

test("HTML content emphasis, semantic callouts, numbered headings and task-state icons",()=>{
  const html=read("demo/report.html");
  const css=read("demo/report.css");
  assert.match(html,/一、执行概览/);
  assert.match(html,/二、趋势与分布/);
  assert.match(html,/三、执行明细/);
  assert.match(html,/2\.1 状态构成/);
  assert.match(html,/class="callout callout--important"/);
  assert.match(html,/<blockquote class="callout callout--confirm"/);
  assert.match(html,/关键结论：<\/strong>/);
  assert.match(html,/aria-label="待执行" title="待执行">⏳/);
  assert.match(html,/aria-label="已完成" title="已完成">✅/);
  assert.match(html,/aria-label="暂停" title="暂停">⏸️/);
  assert.match(css,/\.callout--important\{background:#EFF6FF;border-left-color:#3A83F7\}/);
  assert.match(css,/\.callout--confirm\{background:#FFF8E8;border-left-color:#E6A23C\}/);
  assert.match(css,/\.callout--attention\{background:#FFF1F0;border-left-color:#F56C6C\}/);
  assert.doesNotMatch(css,/\.callout[^}]*h[1-6][^}]*color/);
});
