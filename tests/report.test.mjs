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
const read = p => fs.readFileSync(path.join(base, p), "utf8");

test("sample data is explicitly fictional and contains more than three 20-row pages", () => {
  const report = ui.validateReport(ui.sample());
  assert.equal(report.rows.length, 67);
  assert.match(report.title, /Sample Data/);
  assert.deepEqual(ui.paginateRows(report.rows, 1, 20).rows.length, 20);
  assert.equal(ui.paginateRows(report.rows, 4, 20).rows.length, 7);
  assert.equal(ui.paginateRows(report.rows, 80, 20).page, 4);
  assert.equal(ui.paginateRows(report.rows, 1, 50).rows.length, 50);
  assert.equal(ui.paginateRows(report.rows, 2, 50).rows.length, 17);
  assert.equal(ui.paginateRows(report.rows, 1, 100).rows.length, 67);
});

test("page size is never below 20, and empty / filtered pages are valid", () => {
  assert.throws(() => ui.paginateRows([1, 2, 3], 1, 10), /at least|20/);
  assert.throws(() => ui.paginateRows([1, 2, 3], 1, 0), /20/);
  assert.deepEqual(ui.paginateRows([], 1, 20).rows, []);
  assert.equal(ui.paginateRows([], 100, 20).page, 1);
  assert.equal(ui.paginateRows(ui.sample().rows, -3, 20).page, 1);
});

test("keyword, status and threshold filters operate on actual rows", () => {
  const rows = ui.sample().rows;
  const subset = ui.filterRows(rows, {query:"Gateway", status:"failure", slowOnly:false, threshold:600});
  assert.ok(subset.every(row => row.module === "Gateway" && row.status === "failure"));
  const slow = ui.filterRows(rows, {query:"", status:"all", slowOnly:true, threshold:600});
  assert.ok(slow.length > 0 && slow.length < rows.length);
  assert.ok(slow.every(row => row.durationMs > 600));
  const combined = ui.filterRows(rows, {query:"t-001", status:"all", slowOnly:false, threshold:600});
  assert.equal(combined.length, 1);
  assert.deepEqual(ui.filterRows(rows, {query:"not-present", status:"all", slowOnly:false, threshold:600}), []);
});

test("counts, bar groups and ordered line data use the filtered source", () => {
  const rows = ui.sample().rows;
  const s = ui.summarize(rows, 600);
  assert.equal(s.total, 67);
  assert.equal(s.success+s.failure+s.pending, 67);
  assert.equal(s.slow, rows.filter(r => r.durationMs > 600).length);
  assert.equal(ui.groupModules(rows).reduce((sum,g)=>sum+g[1],0),67);
  assert.equal(ui.batchSeries(rows).reduce((sum,b)=>sum+b.count,0),67);
  assert.deepEqual(ui.batchSeries([]).map(x => x.batch),[1,2,3,4,5,6,7,8,9,10,11,12]);
  const diverse = Array.from({length:12}, (_,i) => ({id:"D"+i,module:"M"+i,status:"success",durationMs:1,batch:1}));
  const groups = ui.groupModules(diverse);
  assert.equal(groups.length, 8);
  assert.equal(groups[7][0], "Other");
  assert.equal(groups.reduce((sum,g)=>sum+g[1],0),12);
});

test("strict JSON schema rejects unknown keys, duplicates, unsafe types and oversized data", () => {
  const data = ui.sample();
  assert.throws(() => ui.validateReport({...data, script:"alert(1)"}), /Unknown field/);
  assert.throws(() => ui.validateReport({...data, version:"gen-ui-demo/v1"}), /version/);
  assert.throws(() => ui.validateReport({...data, rows:[data.rows[0],{...data.rows[0]}]}), /Duplicate/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], status:"eval"}]}), /status/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], durationMs:Infinity}]}), /duration/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], batch:13}]}), /batch/);
  assert.throws(() => ui.validateReport({...data, rows:[{...data.rows[0], onClick:"alert(1)"}]}), /Unknown field/);
  assert.throws(() => ui.validateReport({...data, rows:Array.from({length:1001}, (_,i)=>({...data.rows[0],id:"x"+i}))}), /Maximum 1000/);
});

class FakeNode {
  constructor(tag) {
    this.tagName=tag;this.children=[];this.listeners={};this.attributes={};this.dataset={};
    this.textContent="";this.value="";this.checked=false;this.disabled=false;
  }
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(type,callback){this.listeners[type]=callback;}
}
function boot() {
  const ids=new Map(),app=new FakeNode("app");
  app.dataset.navigation="left";
  const doc={
    querySelector(selector){assert.equal(selector,"[data-report-app]");return app;},
    getElementById(id){if(!ids.has(id))ids.set(id,new FakeNode(id));return ids.get(id);},
    createElement(tag){return new FakeNode(tag);},
    createElementNS(_ns,tag){return new FakeNode(tag);}
  };
  vm.runInNewContext(read("demo/report.js"), {document:doc}, {filename:"report.js"});
  return {app, get:id=>doc.getElementById(id)};
}
function click(node, type, fields={}) {
  assert.equal(typeof node.listeners[type],"function");
  node.listeners[type]({target:{...fields}});
}

test("HTML DOM starts with 20 rows, colored KPI data and three accessible SVG charts", () => {
  const {get} = boot();
  assert.equal(get("report-rows").children.length, 20);
  assert.match(get("page-info").textContent, /1–20 of 67/);
  assert.equal(Number(get("count-total").textContent), 67);
  assert.equal(Number(get("count-success").textContent)+Number(get("count-failure").textContent)+Number(get("count-pending").textContent),67);
  for (const name of ["pie","bar","line"]) {
    assert.equal(get(name).children[0].tagName,"svg");
    assert.equal(get(name).children[0].attributes.role,"img");
    assert.ok(get(name).children[0].attributes["aria-label"].length > 8);
  }
});

test("DOM filters, pages, slider and navigation genuinely update", () => {
  const {app,get} = boot();
  click(get("next"),"click");
  assert.match(get("page-info").textContent,/21–40 of 67/);
  click(get("status"),"change",{value:"failure"});
  const failures=ui.sample().rows.filter(x=>x.status==="failure").length;
  assert.equal(Number(get("count-total").textContent),failures);
  assert.match(get("page-info").textContent,/page 1\/1/);
  click(get("keyword"),"input",{value:"zz-not-present"});
  assert.equal(get("report-rows").children.length,1);
  assert.match(get("report-rows").children[0].children[0].textContent,/No matching/);
  click(get("keyword"),"input",{value:""});
  click(get("status"),"change",{value:"all"});
  click(get("page-size"),"change",{value:"50"});
  assert.equal(get("report-rows").children.length,50);
  click(get("threshold"),"input",{value:"200"});
  assert.equal(get("threshold-value").textContent,"200 ms");
  click(get("slow-only"),"change",{checked:true});
  assert.equal(Number(get("count-total").textContent),ui.sample().rows.filter(x=>x.durationMs>200).length);
  click(get("nav-mode"),"change",{value:"top"});
  assert.equal(app.dataset.navigation,"top");
  click(get("nav-mode"),"change",{value:"left"});
  assert.equal(app.dataset.navigation,"left");
});

test("malformed/unsafe JSON does not replace valid report and text never becomes HTML", () => {
  const {get}=boot();
  const input=get("report-json"), apply=get("apply-json");
  input.value=JSON.stringify({...ui.sample(),rows:[{...ui.sample().rows[0],onClick:"alert(1)"}]});
  click(apply,"click");
  assert.equal(get("json-status").dataset.kind,"error");
  assert.equal(get("report-rows").children.length,20);
  const clean={version:"gen-ui-html-report/v1",title:"<img src=x onerror=alert(1)>",rows:[{id:"X1",module:"demo",status:"success",durationMs:22,batch:1}]};
  input.value=JSON.stringify(clean);
  click(apply,"click");
  assert.equal(get("json-status").dataset.kind,"ok");
  assert.equal(get("report-title").textContent,clean.title);
  assert.equal(get("report-title").children.length,0);
  assert.equal(get("report-rows").children.length,1);
});

test("HTML example is semantic, offline, with meaningful navigation and controls", () => {
  const html=read("demo/report.html");
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html, /data-navigation="left"/);
  assert.match(html, /<nav aria-label="Report sections">/);
  assert.match(html, /<h2/);
  assert.match(html, /<h3/);
  assert.match(html, /<select id="page-size">/);
  assert.match(html, /value="20" selected/);
  assert.match(html, /value="50"/);
  assert.match(html, /value="100"/);
  assert.match(html, /class="kpi success"/);
  assert.match(html, /class="kpi failure"/);
  assert.match(html, /<script src="\.\/report\.js" defer><\/script>/);
  assert.doesNotMatch(html, /https?:\/\/[^" ]+\.js/);
  assert.doesNotMatch(html, /\bonclick\s*=/i);
  assert.match(read("SKILL.md"), /HTML report contract/);
  assert.match(read("references/html-report-contract.md"), /20 rows per page/);
});

test("charts show a textual no-data state after filters remove all records", () => {
  const {get}=boot();
  click(get("keyword"),"input",{value:"NO-MATCHING-RECORDS"});
  assert.equal(Number(get("count-total").textContent),0);
  for(const id of ["pie","bar","line"]){
    const graphic=get(id).children[0];
    assert.equal(graphic.tagName,"svg");
    assert.ok(graphic.children.some(child=>child.textContent==="No data"), id + " must show No data");
  }
});
