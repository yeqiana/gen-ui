# GEN-UI P1 · PlanShip 正式文档交付条件澄清

**这是编辑派生 v2，不是新模型输出，也未获得独立真人审核。**

- 旧候选 SHA-256：`96175fb72b200a95f43724d0b8d8945bb8e007a38849182a4cd514f312d6e051`；编辑 v2 SHA-256：`39c0d75f87fe164459c3f31b338861317748dc3cc039f2a6e70ee8f61055a221`。
- 冻结 `docs/architecture.md:11` 表达 plan-only 下发布技术与读者 MD；`docs/quality-gates.md:58` 明确正式文档验收还需要对应离线 HTML 与索引。
- 仅修改 `publish-docs` 模块标题与来源证明，并在页面 notes 写清正式交付适用范围；全部 13 条 Mermaid 关系、条件、目标 ID、其他模块保持不变。
- 技术验收：`STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`；冻结 13/13 关系金标检查 `PASS`。此处没有实际执行 PlanShip 交付，也未执行任何远端发布。
- 生成新版 **13 条流程关系 + 6 项全局边界 = 19 项真人 PENDING** 审核表：`evals/p1-plan-ship-editorial-v2-human-handoff-2026-11-19.json`。旧 18 项 handoff 仍留给旧候选，不能用于新 SHA 候选。
- 公开 Git 仅记录来源行与哈希，完整候选/HTML 保存在本机仓库外。正式 P1 发布仍 NO-GO。
