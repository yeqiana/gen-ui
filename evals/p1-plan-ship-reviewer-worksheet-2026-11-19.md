# GEN-UI P1 · PlanShip 19 项独立人工审核工作页

**全部 PENDING。** 给未来真实独立审核者使用，不是 AI 签审意见，也不是发布通过证据。

冻结来源：`c2368e5fcbc4a75b2bf0da1def2246e9be06e480`；作者审订候选 SHA-256：`39c0d75f87fe164459c3f31b338861317748dc3cc039f2a6e70ee8f61055a221`。应先核对审核包里的候选、冻结原文及 SHA 再逐项阅读。

审核方式：在获授权的私密副本中逐条填写 supported / unsupported / unclear 及具体理由；任何未审或不确定项均不能放行。请勿将真人信息或敏感签审材料提交公开 Git。

## Mermaid 流程箭头（13 项）

| 来源行 | 转移及条件 | 冻结原文 | 审核决定 / 理由 |
| --- | --- | --- | --- |
| 7 | Codex 或 Claude 调用 PlanShip → 检查真实项目与可选 test-dir | `docs/architecture.md:7` A[Codex or Claude invokes PlanShip] --> I[Inspect real project and optional test-dir] | **PENDING**（理由待填） |
| 8 | 检查真实项目与可选 test-dir → 起草 v0 方案 | `docs/architecture.md:8` I --> P[Draft v0 plan] | **PENDING**（理由待填） |
| 9 | 起草 v0 方案 → 至少两轮评审与修订 | `docs/architecture.md:9` P --> R[Review and revise at least twice] | **PENDING**（理由待填） |
| 10 | 至少两轮评审与修订 → Plan-only 请求判定（不修改业务代码） | `docs/architecture.md:10` R --> G{Plan-only request?} | **PENDING**（理由待填） |
| 11 | Plan-only 请求判定（不修改业务代码） → 发布技术版 + 大白话版 MD [Yes] | `docs/architecture.md:11` G -- Yes --> D[Publish technical + reader MD] | **PENDING**（理由待填） |
| 12 | Plan-only 请求判定（不修改业务代码） → 缺失测试用例判定 [No] | `docs/architecture.md:12` G -- No --> T{Missing test cases?} | **PENDING**（理由待填） |
| 13 | 缺失测试用例判定 → 补齐用例、两轮评审并更新方案 [Yes] | `docs/architecture.md:13` T -- Yes --> T2[Supplement, review twice, update plan] | **PENDING**（理由待填） |
| 14 | 缺失测试用例判定 → 最小实现 + 本地集成 [No] | `docs/architecture.md:14` T -- No --> B[Minimal implementation + local integration] | **PENDING**（理由待填） |
| 15 | 补齐用例、两轮评审并更新方案 → 最小实现 + 本地集成 | `docs/architecture.md:15` T2 --> B | **PENDING**（理由待填） |
| 16 | 最小实现 + 本地集成 → RT：在最终集成源码上运行真实测试 | `docs/architecture.md:16` B --> RT[Real tests on final integrated source] | **PENDING**（理由待填） |
| 17 | RT：在最终集成源码上运行真实测试 → 证据与验收是否通过的判定 | `docs/architecture.md:17` RT --> V{Evidence and acceptance pass?} | **PENDING**（理由待填） |
| 18 | 证据与验收是否通过的判定 → FAIL or BLOCKED：记录证据，绝不宣称通过 [No] | `docs/architecture.md:18` V -- No --> X[FAIL or BLOCKED: record evidence; never claim pass] | **PENDING**（理由待填） |
| 19 | 证据与验收是否通过的判定 → 人工验收指南 + 大白话版 MD [Yes] | `docs/architecture.md:19` V -- Yes --> M[Manual acceptance guide + reader MD] | **PENDING**（理由待填） |

## 全局业务边界（6 项）

| 来源 | 必需约束 | 原文 | 审核决定 / 理由 |
| --- | --- | --- | --- |
| `docs/architecture.md:3` | No server, DB, scheduler or model API bundled; Python helpers optional | PlanShip is a portable, standalone Markdown Skill. Python verification utilities are optional extras, not runtime dependencies. There is **no server, database, scheduler or model A | **PENDING**（理由待填） |
| `docs/architecture.md:22` | Every arrow is required transition not evidence of actual execution | **How to read the diagram:** each arrow is a required transition, not a claim that it happened in any particular session. The failure path `V -- No --> X` means **record the actual | **PENDING**（理由待填） |
| `docs/architecture.md:22` | V -- No --> X stops acceptance; no automatic retry or guide publish | **How to read the diagram:** each arrow is a required transition, not a claim that it happened in any particular session. The failure path `V -- No --> X` means **record the actual | **PENDING**（理由待填） |
| `docs/architecture.md:22` | Plan-only path never changes business code | **How to read the diagram:** each arrow is a required transition, not a claim that it happened in any particular session. The failure path `V -- No --> X` means **record the actual | **PENDING**（理由待填） |
| `docs/architecture.md:37` | Actual project evidence stays private; Skill cannot fully sandbox subprocess | The user task and project files remain local to the Agent's authorized runtime. Test artifacts are stored in `<project>/.idea/docs/<plan-name>/evidence/`. The Skill cannot prevent  | **PENDING**（理由待填） |
| `docs/quality-gates.md:58` | Formal registered document delivery must validate technical MD, reader MD, matching offline HTML and index; plan-only diagram MD summary does not exempt formal delivery. Missing HT | 正式文档验证应同时核验技术 MD、大白话 MD、同名离线 HTML 和索引，技术版目录不生成 HTML。HTML 缺失、篡改或旧版本未补齐均阻断正式交付；参见 [HTML 说明](plain-html.md)。反事实验收新增生产源码变异快照、原始与变异源码 SHA、精确补丁及未改动的测试源码指纹；只有失败报告而没有生产源码修改证据时不能通过。该静态证明不能替 | **PENDING**（理由待填） |

### 审查焦点

Plan-only 双版 MD 步骤不能替代正式发布的 HTML/索引；FAIL/BLOCKED 必须停止，产生人工验收指南不意味着有人实际完成验收。

## 外部审核者签审（待真实填写）

- 审核者身份及独立性证明：**PENDING**
- 不支持与不确定项的复核结果：**PENDING**
- 冻结来源及候选 SHA 对照：**PENDING**
- 独立签审证据位置（私密）：**PENDING**
- 本文件不构成自动发布授权。
