# GEN-UI P1 · 封闭 Evidence ID 试验与二次语义审查

日期：2026-11-18。**结果：一次真实模型试验失败且正确阻断；Agent Lead 仍有两处语义歧义；PlanShip 完成 AI 二次审查但没有独立人工签审。P1 不放行。**

## 1. Distributed Systems Audit 封闭 ID 实验

沿用 `evals/unseen-panorama-2026-11-17.json` 中冻结来源 SHA `0a224f8f517ff7f380741b0880075a0f53eae64f` 和四项必要边界，从原始 Git blob 得到 **167 个合法 Evidence ID**。白名单 Schema SHA-256：`1eddf9b87fbf2ea23aa4eff7b1b6977d840db4cdd9eea026123f88ccad8fd9e7`；本次提示 SHA-256：`3e546ad82cd55c93584c6d039dfaa34575bf8133ab4e29f103778bb5cbce8301`。

Windows 原生 Claude CLI 仅执行一次 `claude-sonnet-5` 调用；传入 `--json-schema`、`--max-budget-usd 0.27` 并只开放 Skill 工具。原始事件记录了 `Skill(gen-ui)` 与成功的 `Launching skill: gen-ui`。不走 OpenCodex 代理，不使用 Codex 额度。JSONL SHA-256：`a1fe91bbe7a39d90b582b3c4ca427b9f95ccbe528929ed28d89cb9d78e794106`，原始日志及候选仅保存在本机公开仓库外。

| 项目 | 实测结果 |
| --- | --- |
| 第一次 StructuredOutput | **8 层、56 模块、0 关系、166 个 ID 引用**，其中虚构 ID `EE790962AEA8` 不在白名单 |
| Schema 校验 | 正确拒绝 `/cases/0/layers/6/modules/3/evidence/0/id` |
| 第二次 StructuredOutput | 参数不是合法 JSON，校验失败 |
| CLI 终态 | `error_max_budget_usd`，没有有效最终 `structured_output`；报告成本 **US$0.3174022**（非已核对账单），高于设置的 US$0.27 上限；该参数不能当硬费用保证 |
| 离线复核 | 第一次失败输出原样另存仓库外；`resolveEvidenceIds` 和正式 `check` 均以 `Unknown or foreign evidence ID: distributed-system-audit/module/6/3` 拒绝，未修补与渲染 |
| HTML / Chrome / 独立语义 | 没有合格候选，**未进入** |

解释：Schema 与最终解析器做到了**发现错误就阻断**，并未保证模型生成时绝不虚构 ID。此次输出规模达到 56 个模块，随后再次尝试 StructuredOutput 仍失败；不能仅凭这些事实断定唯一成本根因。本轮只记录实际结果，不再追加付费模型调用。

## 2. GPT-6 对已有 Claude 候选的异模型二次复核

使用 `evals/semantic-review.mjs` 将候选逐项与其冻结 Git 原文行号复核，并新建独立于历史文件的本地审查包。审查身份写明“GPT-6（AI，非独立人工）”；这属于模型间二次复核，**不是认证人工独立验收，不证明真实测试或部署成功**。

| 项目 | 条目 | AI 支持 | 不确定 | 审查状态 |
| --- | ---: | ---: | ---: | --- |
| Agent Lead | 29 | 27 | 2 | `BLOCKED_SEMANTIC_DISAGREEMENT` |
| PlanShip（已修复来源） | 42 | 42 | 0 | `ATTESTED_NOT_INDEPENDENTLY_VERIFIED` |

Agent Lead 不确定条目 `module:23` 与 `module:24` 引用 `README.md:51–57` 的“将 Skill 安装到测试仓库”“然后再选一个真实需求验证”，原文描述的是**建议未来进行的测试步骤**，不能据此声明实际测试完成。旧候选不修改；新候选应明确标记为“建议的验证步骤”。两条关系仅在**文档结构或建议流程**层面得到 AI 支持。

PlanShip 的 `No → FAIL/BLOCKED` 与 `Yes → Manual acceptance guide` 分别得到 `docs/architecture.md:18`、`:19` 的直接支持；42 项均仅限**文档规范/工作流说明**获得 AI 支持。审查工具最高状态仍是 `ATTESTED_NOT_INDEPENDENTLY_VERIFIED`，不能冒充真人签审。

## 3. 下一步

1. 可选评测提示只增加信息压缩建议：优先 2–4 层、约 8–12 模块，每模块 1–2 条直接证据；对应单元测试覆盖。**该提示是前向改进，尚未通过真实模型试验验证效果**。
2. 若继续 DSA 测试，应先评估成本风险，然后仅再安排一次受控试验；证据非法、JSON 无法解析及语义不符仍必须严格阻断，不自动纠错、不无限重试刷最优结果。
3. Agent Lead 需要新候选修复两项“建议测试”与“已验证”歧义，PlanShip 的 42 项需要真正独立审核者核实；之后再进行结构、语义、Chrome、CI 联合验收。
4. 本轮不修改 `SKILL.md`、历史模型候选、冻结 Tag，不增加依赖或运行时服务，也不声称远端主分支或 Release 已发布。

**最终结论：P1 未放行，工程 Tag `gen-ui-baseline-2026-11-18` 保持不变。**
