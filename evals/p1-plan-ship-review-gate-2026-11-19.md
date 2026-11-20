# GEN-UI P1 · PlanShip 人工审核离线门禁

日期：2026-11-19。针对冻结 13 条 Mermaid 图关系和 5 项安全/业务边界，新增可选审核一致性校验器 `evals/plan-ship-review-gate.mjs`。审核者应在公开仓库外复制清单、独立核查真实冻结来源后填写。

```powershell
node evals/plan-ship-review-gate.mjs evals/p1-plan-ship-independent-review-handoff-2026-11-19.json "<仓库外人工审核副本.json>"
```

冻结 identity（源 Git commit、原模型候选 SHA、golden 映射 SHA、13 条起终点/类型/条件及五项全局边界）不可漂移。任意缺条、错箭头、错条件、缺理由或 unsupported/unclear 都阻断；当前默认结果为 18 项待审。对 `V -- No --> X` 特别审核 FAIL/BLOCKED 并停止、不得误判自动重试/发布；`V -- Yes --> M` 指向人工验收指南而不是已经真人签署。

即使 18 项全部 self-reported supported，结果最多是 `REVIEW_FILLED_IDENTITY_UNVERIFIED`，**绝不等同已认证签署或 P1 Release PASS**。程序退出码保持非 0，避免误把本地已填写表当作 CI 放行信号。正式签署必须另有可核验的独立人工证据。
