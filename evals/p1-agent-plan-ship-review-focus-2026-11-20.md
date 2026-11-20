# GEN-UI P1 · Agent Lead / PlanShip 独立审核范围说明

日期：2026-11-20；性质：来源与待审范围核对，不代表真实 Agent 调用或业务交付。

## Agent Lead v4（28 项）

- 候选呈现 **27 个模块、0 条关系**。先前无证据的 `composes` 关系已撤回，但审核表仍保留 `relation:0`，用于核实撤回决定是否准确。
- `README.md:17` 只是文件树，不足以证明组合关系；`README.md:47` 是文档入口，不能当作实际调用路径。
- 模块的来源只证明文档主张，不能证明模型路由、Provider 隔离、多 Agent 编排已在真实运行环境全部通过。

## PlanShip v3（19 项）

- 候选包含 **29 个模块、13 条流程关系**；现有 19 项真人审核义务由 13 条关系 + 6 条全局边界组成，**不是给 29 个模块分别做 29 次独立签审**。
- 请审核者同时核对关系端点的语义，不要因为箭头存在就认定真实运行完成；源于 `docs/architecture.md` 的流程属于文档约束。
- `docs/quality-gates.md:58` 定义正式交付的技术版 MD、读者版 MD、同名 HTML 和索引；缺失、篡改和旧版内容不能标为正式交付通过。
- `docs/quality-gates.md:64` 提及离线 `index.html` 和预览流程，不可把 plan-only 简写当成对正式交付门禁的无来源豁免。

## 审核建议

先评 Agent Lead `relation:0` 和 PlanShip `boundary:5`，再检查余下模块与流程关系。保留全部 `PENDING`，不要把 AI 支持率、GitHub 绿色 CI 或来源引用数当作独立真人语义结论。

冻结来源提交：Agent Lead `9857d08e7c726e72070876fc08c9403a84d16f9a`；PlanShip `a7a974c2fa6f2b49f0ca7f3fb3e28b3ae39c2520`。
