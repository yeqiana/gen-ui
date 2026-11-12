import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(file)=>fs.readFileSync(new URL("../"+file,import.meta.url),"utf8");
const skill=read("SKILL.md");
const guide=read("references/information-design-decision.md");
const contract=read("references/html-report-contract.md");
const matrix=JSON.parse(read("evals/information-design-cases.json"));

test("信息设计决策指南按需加载且保持轻量",()=>{
  assert.match(skill,/information-design-decision\.md/);
  assert.match(skill,/only when needed/);
  assert.ok(Buffer.byteLength(skill)<=5120,"核心 SKILL.md 必须不超过 5 KiB");
  assert.ok(Buffer.byteLength(guide)<=3072,"按需决策指南必须不超过 3 KiB");
  assert.match(guide,/不是固定输出模板/);
  assert.match(guide,/不要求展示思考过程/);
  assert.match(guide,/默认 Markdown/);
});

test("正文语义图标只标记有依据的关键洞察、错误与风险",()=>{
  for(const marker of ["🎯","💡","❌","⚠️"])assert.ok(skill.includes(marker)&&guide.includes(marker)&&contract.includes(marker),marker);
  assert.match(guide,/无证据不得用/);
  assert.match(guide,/普通叙述不装饰/);
  assert.match(contract,/content-marker/);
  assert.match(contract,/Do not replace navigation\/action SVG icons with emoji/);
});

test("精简表达不丢失事实与技术载荷",()=>{
  assert.match(skill,/remove filler and repetition, not facts, evidence, constraints, or required steps/i);
  assert.match(skill,/code, commands, paths, numbers, errors, and technical terms exact/i);
  assert.match(guide,/用户要求深入/);
  assert.match(guide,/不删除事实、证据、限制、风险或必要步骤/);
});

test("信息设计评测集覆盖六种任务，且不把图表或 HTML 设为默认",()=>{
  assert.equal(matrix.version,"gen-ui-information-design-eval/v1");
  assert.equal(matrix.cases.length,6);
  const ids=new Set(matrix.cases.map(c=>c.id));
  assert.equal(ids.size,matrix.cases.length);
  for(const c of matrix.cases){
    assert.ok(c.readerGoal&&c.informationShape&&c.prompt.length>20,c.id);
    assert.ok(c.expectedForm&&c.avoid.length>=1&&c.acceptance.length>=2,c.id);
  }
  const get=id=>matrix.cases.find(c=>c.id===id);
  assert.equal(get("simple-explanation").expectedForm,"markdown-prose");
  assert.equal(get("option-comparison").expectedForm,"markdown-table");
  assert.equal(get("implementation-steps").expectedForm,"markdown-steps");
  assert.equal(get("architecture-without-evidence").expectedForm,"markdown-groups");
  assert.equal(get("explicit-html-report").expectedForm,"offline-html");
  assert.equal(get("evidence-bounded-review").expectedForm,"markdown-evidence");
  assert.match(get("architecture-without-evidence").avoid.join(" "),/无证据连线/);
});
