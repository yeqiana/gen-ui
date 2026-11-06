import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {auditFile,catalog} from "../scripts/evaluate-agent-output.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const entries=[
 ["HTML01","HTML01-webcodex-gpt6-20261105","report.html",true],
 ["MD01","MD01-webcodex-gpt6-20261105","answer.md",false],
 ["HTML02","HTML02-webcodex-gpt6-20261106","report.html",true],
 ["HTML03","HTML03-webcodex-gpt6-20261106","report.html",true],
 ["HTML04","HTML04-webcodex-gpt6-20261106","report.html",true]
];
test("评测矩阵完整且没有丢失固定用例",()=>{
 assert.deepEqual(new Set(catalog.cases.map(c=>c.id)),new Set(entries.map(e=>e[0])));
});
for(const [id,dir,file,isHtml] of entries){
 test(id+" 原始产物与静态/浏览器证据保持一致（不推断独立模型合规率）",()=>{
  const folder=path.join(root,"evals","artifacts",dir);
  const input=path.join(folder,file);
  assert.ok(fs.statSync(input).size>250);
  const computed=auditFile(id,input);
  assert.equal(computed.staticGate,"pass");
  assert.ok(computed.checks.every(c=>c.passed));
  const gate=JSON.parse(fs.readFileSync(path.join(folder,"static-gate.json"),"utf8"));
  assert.equal(gate.caseId,id);
  assert.equal(gate.staticGate,"pass");
  assert.equal(gate.producerVerified,false);
  assert.ok(gate.claimedProducer.includes("WebCodex"));
  assert.ok(!(/^[A-Za-z]:[\\/]/.test(gate.artifact)),"不得公开机器上的绝对路径");
  if(isHtml){
   const browser=JSON.parse(fs.readFileSync(path.join(folder,"browser-evidence.json"),"utf8"));
   assert.equal(browser.result,"pass");
   assert.deepEqual(Object.keys(browser.viewports).sort(),["1440","375","768"].sort());
   assert.equal(browser.runtimeErrors?.length??browser.errors?.length??0,0);
   assert.equal(browser.localCodexCliUsed??false,false);
  }
 });
}
