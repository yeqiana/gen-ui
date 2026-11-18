# GEN-UI P1 · PlanShip 关系身份与反事实负向门禁

日期：2026-11-18。**状态：确认旧结构评分的关系身份盲区，新增可选冻结图谱校验；真实 PlanShip 13 条流程关系通过。**

## 结构评分的真实边界

在本地仓库外对修复后的原始候选做 6 类非破坏性复制变异（不覆盖历史模型输出）。原通用来源评分器仅验证引用与部分 Mermaid 类型/条件，不承诺逐边 endpoint 保真。结果如下：

| 变异 | 原来源门禁 |
| --- | --- |
| swap_flow_endpoint | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` |
| remove_fail_exit | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` |
| wrong_condition_label | `BLOCKED` |
| flow_as_depends | `BLOCKED` |
| pretend_deployed | `BLOCKED` |
| wrong_rt_edge_endpoint | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` |

其中 `swap_flow_endpoint`、`remove_fail_exit` 与 `wrong_rt_edge_endpoint` 仍能得到 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`，不能误认为业务流程语义已经被自动证明。

## 本轮可选逐边门禁

- 增加 `evals/mermaid-edge-audit.mjs`，针对**经人工/AI 明确核过的冻结映射**做 sourceFrom/sourceTo、模块 from/to、type、condition、证据来源行和关系总数联动检查。它是**对一个冻结来源的回归证据**，不是所有 Mermaid 图通用的语义证明。
- 固定 PlanShip 来源 `c2368e5fcbc4a75b2bf0da1def2246e9be06e480` 与 13 条映射保存在 `evals/p1-plan-ship-golden-edges-2026-11-18.json`；原模型候选 **13/13** 条对应，`PASS`。
- 新建 `tests/mermaid-edge-audit.test.mjs`：原始图、错端点、删除失败出口、错误条件、额外关系、伪造来源/commit 等共 4 个测试集合，**4/4 PASS**；其中包括验证“来源结构评分可绿，而逐边身份门禁会拒绝”的反事实对比。

## 放行边界

- 不改变原通用 `scoreUnseen` 的定位和其 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` 结果，不把专用图谱检查误充自动语义证明。
- 冻结关系的 golden 映射来自已有候选与本轮 AI 逐边复核，**还缺独立人工签审**；未来如果来源图或候选版本更新须前向生成新映射，不得静默移动旧证据。
- 不触及核心 `SKILL.md`，不执行付费模型调用，不修改原始候选/冻结 Tag。

**结论：已补齐 PlanShip 这一冻结流程图的反事实关系身份门禁，P1 人工独立验收仍待完成。**
