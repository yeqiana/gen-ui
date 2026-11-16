import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {score,evidence} from "../evals/score-review-continuity.mjs";
const cases=JSON.parse(fs.readFileSync(new URL("../evals/review-continuity-cases.json",import.meta.url),"utf8")).cases;
const get=id=>cases.find(c=>c.id===id);
test("证据别名保留，但不能将未知根因写成已知",()=>{
 assert.equal(evidence("根因未明，待定位","根因尚未确认"),true);
 assert.equal(evidence("第3轮只修改展示","第 3 轮"),true);
 assert.equal(evidence("仅在7天内部试用","7 天"),true);
 assert.equal(evidence("签名验证尚未重跑","验签测试"),true);
 assert.equal(evidence("已经完成全部修复","根因尚未确认"),false);
});
test("对 R2 的缺验收证据，不能断言为未实现",()=>{
 const good="不能收口。R1 仅 a12 提交，8/8 单测通过，断点恢复集成测试未做。R2 缺对账日志及用例，实施状态未确认。R3 的 1/3 注入失败，旧 Worker 迟到写回，根因尚未确认。";
 assert.equal(score(get("review-not-closed"),good).pass,true);
 const bad=good.replace("R2 缺","R2 未实现。缺");
 assert.equal(score(get("review-not-closed"),bad).checks.R2UnknownImplementation,false);
});
test("内部试用接受范围不能推导出生产放行",()=>{
 const good="生产发布不能收口。N1 仅7天内部试用的风险获接受，正式生产仍需修复。C2 签名验证失败样例，验签测试尚未重跑。其他功能已演示，演示不等于验收。";
 assert.equal(score(get("scoped-risk-consent"),good).pass,true);
 assert.equal(score(get("scoped-risk-consent"),good+" N1 不构成生产阻断。").checks.noFalseN1NonBlock,false);
});
test("冲突证据与第三轮无测试，结论必须领先",()=>{
 const good="不能收口。QR01 第 1 轮口头摘要 12/12，第 2 轮原始日志 11/12，文件 SHA-256 一致。第 3 轮没有新的识别测试，失败原因未知。";
 assert.equal(score(get("contradictory-evidence"),good).pass,true);
 assert.equal(score(get("contradictory-evidence"),"先比较证据。".repeat(120)+good).checks.noClosure,false);
});
test("简单问题保留 MCP 和 Skill 核心职责，不升级 HTML 和冗长结构",()=>{
 const good="MCP 用于连接外部工具和数据源，Skill 则将可复用的指令与流程组织起来。两者可以协作。";
 assert.equal(score(get("simple-density"),good).pass,true);
 assert.equal(score(get("simple-density"),"## 目录\n"+good.repeat(9)).pass,false);
});