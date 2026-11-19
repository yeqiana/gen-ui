# GEN-UI P1 · DSA 真人审核材料一致性检查

日期：2026-11-19。新增可选工具 `evals/dsa-review-gate.mjs`，冻结 16 项模型模块与 17 个原文章节审核问题，共 33 项。审核者在公开仓库之外填写副本，工具只核对**是不是在同一个真实模型结果和同一份冻结 Git 来源**上作出的决定。

```powershell
node evals/dsa-review-gate.mjs evals/p1-dsa-independent-review-handoff-2026-11-19.json "<仓库外真人审核件.json>"
```

变更源提交、模型 SHA、来源行、章节 ID、标题、条目数，或遗漏决定理由均失败。当前 33 项 PENDING；即使有人填成 33/33 supported，也只能得到 `REVIEW_FILLED_IDENTITY_UNVERIFIED`，**不能证明真人身份、独立性或发布通过**。所有审核结果默认以非零退出码防止被 CI 错误识别为 green。

这不是在重新生成模型候选，上一轮 Claude 17/17 直引的结果与原始 JSONL 均保留在仓库外。
