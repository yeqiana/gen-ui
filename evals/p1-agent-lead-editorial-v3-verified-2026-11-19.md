# GEN-UI P1 · Agent Lead 建议验证顺序去执行连线

**明确为编辑派生 v3，非真实模型新生成、非独立真人签审。**

- 原 Claude SHA256 `3d156541da9a04683beca8bde0e6efdb035af9b813b70fc93f542c56d17e98ad`；v2 SHA256 `ac3b878fc1771ecdf584b1ac3cc0e4fb2c1b1e7c78873bc3b59c31da4888a87f`；v3 SHA256 `779d886072410a8ccddf3e72aaf952bdbee94df7e5089e10251ef795d34e9906`。
- 旧候选将 README 建议的“先只读测试、再选真实需求”画为 `flow` 连线，容易误读为已执行。v3 仅移除此 1 条 `flow`，保留文档组成关系 `composes` 和 **全部27模块、原证据、ID、标题**。
- 页面 notes 明确“两步只是建议的验证顺序，不等于已实际执行”。结构来源检查 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`，语义风险标记 0。
- 现在需检查 **27模块+1条文档组成关系共28项**，因此重新生成 `evals/p1-agent-lead-editorial-v3-human-handoff-2026-11-19.json`；旧的29项审核表仍只绑定旧 v2 候选，不能转用于 v3。
- 正式真人签审全部 PENDING；不要把编辑后的语义消歧记作模型原生能力改善或独立已验收。
