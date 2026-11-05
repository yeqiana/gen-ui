import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {catalog,evaluateOutput,auditFile} from "../scripts/evaluate-agent-output.mjs";

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const entry=path.join(repo,"scripts/evaluate-agent-output.mjs");

test("评测矩阵包含真实 HTML 与纯 Markdown 回退，且标明手工验收",()=>{
  assert.equal(catalog.version,"gen-ui-agent-eval/v1");
  assert.equal(catalog.cases.length,5);
  for(const c of catalog.cases){
    assert.ok(c.id&&c.prompt.length>45);
    assert.ok(["html","markdown"].includes(c.format));
    assert.ok(c.checks.length>=3);
    assert.ok(c.manual.length>=1);
  }
  assert.equal(catalog.cases.find(c=>c.id==="MD01").format,"markdown");
  assert.ok(catalog.cases.find(c=>c.id==="HTML02").prompt.includes("all"));
});

test("已有人工编写的中文 HTML 示例可作为离线评测器自测正例",()=>{
  const artifact=path.join(repo,"demo/report.html");
  for(const id of ["HTML01","HTML02","HTML03","HTML04"]){
    const report=auditFile(id,artifact);
    assert.equal(report.staticGate,"pass",id+": "+JSON.stringify(report.checks.filter(c=>!c.passed)));
    assert.ok(report.caveat.includes("不能"));
  }
});

test("现有 Markdown 示例可通过离线 Markdown 门禁",()=>{
  const r=auditFile("MD01",path.join(repo,"examples/thread-pool.md"));
  assert.equal(r.staticGate,"pass");
});

test("明显不符合要求的 HTML / 伪交互 Markdown 被拒绝",()=>{
  const invalidHtml='<html lang="en"><h1>English only</h1><button onclick="alert(1)">click</button></html>';
  const report=evaluateOutput("HTML01",invalidHtml,"");
  assert.equal(report.staticGate,"fail");
  assert.ok(report.checks.some(c=>c.id==="chinese"&&!c.passed));
  assert.ok(report.checks.some(c=>c.id==="no-inline-events"&&!c.passed));
  assert.equal(evaluateOutput("MD01","<html><body><button>Click</button></body></html>").staticGate,"fail");
  assert.throws(()=>evaluateOutput("UNKNOWN","anything"),/未知/);
});

test("CLI 报告明确不验证 Agent 产物来源，不宣称功能测试成功",()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gen-ui-agent-eval-"));
  try{
    const reportFile=path.join(dir,"result.json");
    const ok=spawnSync(process.execPath,[entry,"--case","HTML01","--input",path.join(repo,"demo/report.html"),
      "--producer","authored-example","--report",reportFile],{encoding:"utf8"});
    assert.equal(ok.status,0,ok.stderr);
    const report=JSON.parse(fs.readFileSync(reportFile,"utf8"));
    assert.equal(report.staticGate,"pass");
    assert.equal(report.producerVerified,false);
    assert.equal(report.claimedProducer,"authored-example");
    assert.match(report.caveat,/静态/);
    assert.ok(report.manualChecks.length);
    const fail=spawnSync(process.execPath,[entry,"--case","HTML01","--input",path.join(repo,"examples/thread-pool.md")],{encoding:"utf8"});
    assert.equal(fail.status,1,"错误格式应该触发静态门禁失败");
    const bad=spawnSync(process.execPath,[entry,"--case","UNKNOWN","--input",path.join(repo,"demo/report.html")],{encoding:"utf8"});
    assert.equal(bad.status,2,"未知用例需返回参数错误");
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});


test("CSS 静态门禁不被无关 nowrap/sticky 字样误导",()=>{
  const markup=fs.readFileSync(path.join(repo,"demo/report.html"),"utf8");
  const unrelated="body {white-space:nowrap;position:sticky;left:0} th {font-weight:bold} td {overflow:hidden}";
  const r=evaluateOutput("HTML01",markup,unrelated);
  assert.equal(r.staticGate,"fail");
  assert.equal(r.checks.find(x=>x.id==="nowrap").passed,false);
  assert.equal(r.checks.find(x=>x.id==="sticky").passed,false);
  const headerOnly="th{white-space:nowrap} .floating{position:sticky;left:0}";
  const r2=evaluateOutput("HTML01",markup,headerOnly);
  assert.equal(r2.checks.find(x=>x.id==="nowrap").passed,false);
  assert.equal(r2.checks.find(x=>x.id==="sticky").passed,false);
  const matching="th,td{white-space:nowrap} td:first-child{position:sticky;left:0;}";
  const r3=evaluateOutput("HTML01",markup,matching);
  assert.equal(r3.checks.find(x=>x.id==="nowrap").passed,true);
  assert.equal(r3.checks.find(x=>x.id==="sticky").passed,true);
});

test("SVG 事件属性也触发 HTML 静态脚本拒绝",()=>{
  const html=fs.readFileSync(path.join(repo,"demo/report.html"),"utf8");
  const mutated=html.replace("</body>",'<svg onfocus="alert(1)"></svg></body>');
  const r=evaluateOutput("HTML01",mutated,
    fs.readFileSync(path.join(repo,"demo/report.css"),"utf8"));
  assert.equal(r.checks.find(x=>x.id==="no-inline-events").passed,false);
});


test("真实 Chrome 示例验收证据保留且明确声明非 Agent 生成",()=>{
  const file=path.join(repo,"evals/chrome-demo-baseline-2026-11-05.json");
  const baseline=JSON.parse(fs.readFileSync(file,"utf8"));
  assert.equal(baseline.result,"pass");
  assert.equal(baseline.generatedByAgent,false);
  assert.equal(baseline.source,"demo/report.html");
  assert.deepEqual(Object.keys(baseline.viewports).sort(),["1440","375","768"]);
  for(const detail of Object.values(baseline.viewports)){
    assert.equal(detail.rows,20);
    assert.equal(detail.extraFocus,0);
    assert.equal(detail.missingFocus,0);
    assert.equal(detail.buttons,detail.uniqueLabels);
  }
});

test("真实 Codex 调用记录不得伪装为 Skill 合规通过",()=>{
  const file=path.join(repo,"evals/codex-user-session-attempt-2026-11-05.json");
  const record=JSON.parse(fs.readFileSync(file,"utf8"));
  assert.equal(record.schema,"gen-ui-agent-attempt/v1");
  assert.equal(record.caseId,"HTML04");
  assert.equal(record.runtime.cliAuthenticated,true);
  assert.equal(record.attempt.agentStarted,true);
  assert.equal(record.attempt.modelTurnCompleted,true);
  assert.equal(record.attempt.artifactsGenerated,0);
  assert.equal(record.attempt.staticGate,"not-run");
  assert.equal(record.attempt.browserAcceptance,"not-run");
  assert.equal(record.attempt.skillCompliance,"not-measured");
  assert.equal(record.verifiedPassRate,null);
  assert.equal(record.safeguards.copiedCredentials,false);
  assert.equal(record.safeguards.bypassedPolicy,false);
  assert.equal(record.safeguards.dedicatedScheduledTaskRemoved,true);
});
