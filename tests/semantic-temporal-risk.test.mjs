import test from "node:test";
import assert from "node:assert/strict";
import {semanticRiskFlags} from "../evals/semantic-review.mjs";
const ev=quote=>[{valid:true,quote}];
test("建议的验证步骤不能自动包装成已完成测试",()=>{
 const a=semanticRiskFlags("module",ev("将 Skill 安装到一个允许读写的测试仓库，先发出只读任务："),null,null,"测试仓库中的只读任务验证");
 const b=semanticRiskFlags("module",ev("然后再选一个有明确接口边界的真实需求验证开发与回归测试。"),null,null,"真实需求开发与回归测试验证");
 assert.ok(a.includes("PROPOSED_VALIDATION_AS_COMPLETED"));
 assert.ok(b.includes("PROPOSED_VALIDATION_AS_COMPLETED"));
});
test("明确是建议或有真实通过证据时不触发，既有标志保留",()=>{
 assert.ok(!semanticRiskFlags("module",ev("然后再选一个真实需求验证开发"),null,null,"建议：开发与回归测试验证").includes("PROPOSED_VALIDATION_AS_COMPLETED"));
 assert.ok(!semanticRiskFlags("module",ev("测试已完成；实测通过"),null,null,"真实测试验证").includes("PROPOSED_VALIDATION_AS_COMPLETED"));
 assert.ok(!semanticRiskFlags("relation",ev("然后再选一个真实需求验证开发"),"flow",null,"测试验证").includes("PROPOSED_VALIDATION_AS_COMPLETED"));
 assert.deepEqual(semanticRiskFlags("module",ev("## 标题模板"),null,null,"标题"),["HEADING_ONLY_MODULE_EVIDENCE"]);
});
