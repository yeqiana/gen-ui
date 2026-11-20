# GEN-UI P1 · Agent Lead 离线人工审核防伪门禁

日期：2026-11-19。新增可选的 `evals/agent-lead-review-gate.mjs`，用仓库中的冻结 29 项公开清单作为只读基准，审核者的填写件应保存在仓库外。

命令示例（前提：真实审核者已经填写，并自行保留审计轨迹）：

```powershell
node evals/agent-lead-review-gate.mjs evals/p1-agent-lead-independent-review-handoff-2026-11-19.json "<仓库外已填写审核清单.json>"
```

当前冻结清单 29/29 均为 PENDING，运行门禁应显示 `BLOCKED_REVIEW_INCOMPLETE`。非空理由、29 项 identity、source Git commit、原 Claude 和审订候选 SHA 必须对应，篡改或重复/缺失项立即阻断；`unsupported/unclear` 也阻断。

**重要：** 即使恶意或误操作把 29 项都填写 `supported`，得到的也只能是 `REVIEW_FILLED_IDENTITY_UNVERIFIED`，**不是人工签名认证或 Release PASS**。本地脚本无法确认审核人真实身份、审核独立性、签名或证据可用性；正式 P1 发布必须另有真实外部签审记录及远端 CI 佐证。原始候选文件与真人记录不可公开写进此仓库。
