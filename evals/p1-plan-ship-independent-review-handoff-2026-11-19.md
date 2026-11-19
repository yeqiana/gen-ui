# GEN-UI P1 · PlanShip 独立人工审查交接包

日期：2026-11-19。**13 条冻结流程关系的技术来源门禁通过；13/13 项真人签审仍 PENDING，附加 5 条安全/语义边界也 PENDING。**

冻结原文 commit：`c2368e5fcbc4a75b2bf0da1def2246e9be06e480`；原模型候选 SHA-256：`96175fb72b200a95f43724d0b8d8945bb8e007a38849182a4cd514f312d6e051`；冻结映射 SHA-256：`9b1fafbcc4a445010c7c1028ded571052704bb9ca58a0174c39387f57bf87ceb`。原始模型候选留仓库外，不在公开仓库复制私人模型事件。

| 源行 | 冻结箭头 | 关系含义 | 真人状态 | 必须复核 |
| ---: | --- | --- | --- | --- |
| 7 | `A --> I` | Codex 或 Claude 调用 PlanShip → 检查真实项目与可选 test-dir（flow） | **PENDING** | 箭头是否符合原文工作流的必要转移，并且仅描述文档约束而非实际执行事件？ |
| 8 | `I --> P` | 检查真实项目与可选 test-dir → 起草 v0 方案（flow） | **PENDING** | 箭头是否符合原文工作流的必要转移，并且仅描述文档约束而非实际执行事件？ |
| 9 | `P --> R` | 起草 v0 方案 → 至少两轮评审与修订（flow） | **PENDING** | 箭头是否符合原文工作流的必要转移，并且仅描述文档约束而非实际执行事件？ |
| 10 | `R --> G` | 至少两轮评审与修订 → Plan-only 请求判定（不修改业务代码）（flow） | **PENDING** | 箭头是否符合原文工作流的必要转移，并且仅描述文档约束而非实际执行事件？ |
| 11 | `G --> D` `Yes` | Plan-only 请求判定（不修改业务代码） → 发布技术版 + 大白话版 MD（controls） | **PENDING** | Plan-only Yes 必须仅发布双版 MD，不修改业务代码 |
| 12 | `G --> T` `No` | Plan-only 请求判定（不修改业务代码） → 缺失测试用例判定（controls） | **PENDING** | Plan-only No 进入缺失测试用例决策，不能直接声明测试通过 |
| 13 | `T --> T2` `Yes` | 缺失测试用例判定 → 补齐用例、两轮评审并更新方案（controls） | **PENDING** | 缺测试 Yes 要先补测试、两轮评审和更新方案 |
| 14 | `T --> B` `No` | 缺失测试用例判定 → 最小实现 + 本地集成（controls） | **PENDING** | 缺测试 No 进入最小实现，不能跳过真实测试 |
| 15 | `T2 --> B` | 补齐用例、两轮评审并更新方案 → 最小实现 + 本地集成（flow） | **PENDING** | 箭头是否符合原文工作流的必要转移，并且仅描述文档约束而非实际执行事件？ |
| 16 | `B --> RT` | 最小实现 + 本地集成 → RT：在最终集成源码上运行真实测试（flow） | **PENDING** | 箭头是否符合原文工作流的必要转移，并且仅描述文档约束而非实际执行事件？ |
| 17 | `RT --> V` | RT：在最终集成源码上运行真实测试 → 证据与验收是否通过的判定（flow） | **PENDING** | 箭头是否符合原文工作流的必要转移，并且仅描述文档约束而非实际执行事件？ |
| 18 | `V --> X` `No` | 证据与验收是否通过的判定 → FAIL or BLOCKED：记录证据，绝不宣称通过（controls） | **PENDING** | 验收 No 必须记录 FAIL/BLOCKED 并停止；不得自动重试、继续发布或称已通过 |
| 19 | `V --> M` `Yes` | 证据与验收是否通过的判定 → 人工验收指南 + 大白话版 MD（controls） | **PENDING** | 验收 Yes 输出人工验收指南，不能声称已有人真实签署或代码已经上线 |

## 全局安全和业务语义要求

- `docs/architecture.md:3`：No server, DB, scheduler or model API bundled; Python helpers optional。**PENDING**。
- `docs/architecture.md:22`：Every arrow is required transition not evidence of actual execution。**PENDING**。
- `docs/architecture.md:22`：V -- No --> X stops acceptance; no automatic retry or guide publish。**PENDING**。
- `docs/architecture.md:22`：Plan-only path never changes business code。**PENDING**。
- `docs/architecture.md:37`：Actual project evidence stays private; Skill cannot fully sandbox subprocess。**PENDING**。

## 独立签审门禁

1. 必须由与模型生成/候选编辑无关的真实审核者阅读冻结来源、原模型候选及金标映射后逐项给出理由。
2. `V -- No --> X` 是 STOP/FAIL/BLOCKED，不是自动 retry；`V -- Yes --> M` 是产出人工验收指南，不证明真人已经签署。
3. 任意 PENDING、unclear、unsupported 或无法核验的证据均不允许自动放行；现有 GPT-6 源行核查只算辅助证据。
4. 公开仓库中仅存中性清单、SHA 与行号；评审身份、签署证据应按授权在独立记录中保存，不可在模板里虚构。

机器可读清单：`evals/p1-plan-ship-independent-review-handoff-2026-11-19.json`。
