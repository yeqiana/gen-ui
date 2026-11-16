import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const load=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const cases=JSON.parse(load("evals/review-continuity-cases.json"));
test("核心 Skill 保持 5KiB、Markdown 默认和评审续接条件加载",()=>{
 const skill=load("SKILL.md");
 assert.ok(Buffer.byteLength(skill)<=5120,"SKILL.md must remain <=5 KiB");
 assert.match(skill,/Markdown by default/);
 assert.match(skill,/reading-layers\.md/);
 assert.match(skill,/risk\/closure decisions/);
 assert.match(skill,/issue IDs and prior evidence/);
 assert.match(skill,/changed, tested, or risk-accepted/);
});
test("多轮续接不会把代码变更、验收、根因与风险接受混为一谈",()=>{
 const doc=load("references/reading-layers.md");
 for(const word of ["上轮状态","本轮证据","本轮判断","根因未明","缺日志/用例仅代表缺验收证据，不等于未实现","接受范围","生产放行前置条件","已实现","已验证","待验证","已知失败","获授权接受风险","可收口","有条件收口","暂不收口"]){
  assert.ok(doc.includes(word),word);
 }
 assert.ok(Buffer.byteLength(doc)<5500,"Reference should remain compact");
 assert.match(doc,/不能.*临时绕过当作根因修复/);
 assert.match(doc,/相同 SHA-256 只证明被核对文件内容相同/);
});
test("真实模型评测案例覆盖续接、限定授权、冲突证据及简答密度",()=>{
 assert.equal(cases.version,"gen-ui-review-continuity-eval/v1");
 assert.equal(cases.cases.length,4);
 assert.equal(new Set(cases.cases.map(x=>x.id)).size,4);
 for(const c of cases.cases){
  assert.ok(c.prompt.length>(c.density==="single-explanation"?20:65),c.id);
  assert.ok(c.mustRetain.length>=2&&c.acceptance.length>=2,c.id);
  assert.ok(c.forbiddenClaims.length>=2,c.id);
  assert.equal(c.expectedDecision,c.density==="review-increment"?"暂不收口":"直接解释");
 }
 assert.equal(cases.cases.filter(x=>x.density==="review-increment").length,3);
 assert.equal(cases.cases.filter(x=>x.density==="single-explanation").length,1);
 assert.ok(cases.cases.find(x=>x.id==="contradictory-evidence").mustRetain.includes("11/12"));
});
