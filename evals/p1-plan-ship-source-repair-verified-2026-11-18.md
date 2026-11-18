# GEN-UI P1 · PlanShip 源流程图真实修复后复测

日期：2026-11-18。状态：**PlanShip 源项目已修复并推送，GEN-UI 新冻结来源结构与真实模型生成/Chrome 已通过；独立语义验收未完成。**

## 1. 本轮真正修复的源问题

PlanShip 原 Git 提交 `a7a974c2fa6f2b49f0ca7f3fb3e28b3ae39c2520` 的 `docs/architecture.md` 重复使用 Mermaid 节点 `A` 表示“Agent 调用 Skill”和“在最终集成源码上执行真实测试”；验收失败出口 `V -- No --> X` 没有解释 X。旧 GEN-UI 模型候选因此存在 5 项未澄清来源语义和遗漏的失败分支，参见 [原始流程图问题报告](p1-plain-flow-pilot-2026-11-18.md)。

2026-11-18 在 [PlanShip 仓库](https://github.com/yeqiana/plan-ship) **真正改动** `docs/architecture.md` 与新增 `tests/test_architecture_mermaid.py`，独立提交 `c2368e5fcbc4a75b2bf0da1def2246e9be06e480` 已推送到 `main`：

- **节点不再复用**：`B --> RT[Real tests on final integrated source]`，`RT --> V{Evidence and acceptance pass?}`，初始调用仍为 `A`。
- **失败出口明确**：`V -- No --> X[FAIL or BLOCKED: record evidence; never claim pass]`；与原仓库 README 和 `docs/quality-gates.md` 中的失败阻断要求一致。**No 分支终止当前验收，不虚构自动重试或手动验收完成**；Yes 才通往手动指南。
- 源文件解释段同步注明失败要留证；节点定义唯一、目标有明确定义、失败不能走成功路径的两项专项测试通过。

### PlanShip 工程验证边界

| 验证 | 实际结果 |
| --- | --- |
| 源图 2 项新增单元测试 | **2/2 通过** |
| 发行结构检查 `scripts/validate_package.py` | **PASS** |
| Windows 原生完整 unittest | **217 项执行：3 项权限环境错误、6 项跳过**，不能称全部通过；错误包括 Windows 符号链接创建权限和系统账户目录访问权限，不是本次 Mermaid 改动断言失败 |
| PlanShip GitHub Actions | **Success**，与修复 SHA 匹配： https://github.com/yeqiana/plan-ship/actions/runs/44253055872 |

## 2. GEN-UI 新来源冻结（旧的 2026-11-17 清单不覆盖）

本轮另存 `evals/p1-plan-ship-source-repair-2026-11-18.json`，只包含 **PlanShip 单项目**，新源 SHA 为 `c2368e5fcbc4a75b2bf0da1def2246e9be06e480`，旧三项目历史清单 `evals/unseen-panorama-2026-11-17.json`、旧真实候选及原基线 Tag 保持不变。

| 新冻结文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `docs/architecture.md` | 2925 | `516c8dac5d9b6c30690ebee01d9548d0cc6470b4758ada4ede808576152eab0f` |
| `docs/quality-gates.md` | 6112 | `02b526c91fc39e535a8ae9cbbf4f954f786d3eafd67b8cdb9365645aca632e5b` |

本轮必需证据边界 **6/6**：原有无服务器数据库、plan-only 不改业务代码、分支测试不能代替集成测试、结构验证不是业务验收四项；新增真实测试 `RT` 节点、失败 `No --> X` 分支两项。冻结指纹及每个边界都使用 `frozenInputs` 和 `evidenceCatalogue` 通过验证，证据目录共 72 行可引用 ID。原文仍保留在源仓库，不复制整份私有材料到 GEN-UI。

## 3. 一次真实模型验证（不择优重试、不改造输出）

Windows Claude CLI 针对该新快照只执行**一次**，设置最大 CLI 预算 US$0.23，输出完整原始事件。原始事件核对 `Skill(gen-ui)` 工具调用与成功的 `Launching skill: gen-ui`，实际模型 `claude-sonnet-5`，`subtype=success`。未使用 Codex 额度，未启动 OpenCodex 代理。

| 指标 | 真实试验 |
| --- | --- |
| 模型给出 | 29 模块、13 关系 |
| 关系分类 | **7 `flow`、6 `controls`** |
| 新来源证据边界 | **6/6** |
| 原文来源结构问题 | **0** |
| 门禁 | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` |
| 关键失败分支 | `V --controls [No]--> X[FAIL/BLOCKED]` **明确存在** |
| 关键成功分支 | `V --controls [Yes]--> M[Manual acceptance guide]` **明确存在** |
| 真实测试转移 | `B --flow--> RT --flow--> V` **明确存在** |
| 真实模型生成的离线 HTML | Chrome **375/768/1440px，3/3 通过**，无浏览器 QA 问题 |
| CLI 报告费用 | **US$0.1350506**（非实际账单），单次 |
| 原始 JSONL SHA-256 | `24eb9b3d4da108863e6593dbe0d36653af1da9d8f94018d851c3fda93812f836` |
| 模型候选 SHA-256 | `96175fb72b200a95f43724d0b8d8945bb8e007a38849182a4cd514f312d6e051` |

完整生成 JSON、原始 JSONL、离线 HTML 预览、审查包留在**本机 GEN-UI 仓库外的临时目录**，不进入 Git 公共仓库，不修改旧模型候选。结构通过意味着引用的 Git 行存在且必要边界可追溯，不能直接推断业务已真正运行。

## 4. 42 项 AI 辅助源文档初核

对上述原始模型候选建立新的、独立于历史文件的审查包，逐条检查 **29 模块 + 13 关系 = 42 项**。在“**它们描述文档中定义的工作流及工具职责，而非已部署能力或已执行事实**”这一严格前提下，42 项均得到明确来源行支持；风险提示数为 0。特别核验了 No/Yes 条件标签和 RT 的端点身份，避免复用 A 的旧歧义。

- 新审查决定记为 **42 supported / 0 unclear / 0 unsupported**，审查者标签明确为“AI 辅助原文逐项初核（非独立人工）”。
- 审查工具实际状态为 **`ATTESTED_NOT_INDEPENDENTLY_VERIFIED`**，不是人工独立验收或真实业务验收。任何后续独立评审都需复核具体来源与设计语义。
- 与旧 33 项初核（28 supported/5 unclear）**不可直接算成同一候选的效果提升**：源图已经改变，模型输出的模块和关系也不同；结论只适用于本次新冻结快照及哈希。

**GEN-UI 本轮回归：** 完整 Skill/Node 协议测试 **183/183 通过**；本轮真实候选生成的离线 HTML 已完成 3 视口 Chrome 专项。仓库 CI 仍需以本轮最新提交重新验收。

## 5. 收口与下一步

**本轮已完成：** PlanShip 源头 A/X 修复、源码 Git 提交推送及 CI、新 GEN-UI 来源冻结、单次真实模型调用、6 项来源边界、13 关系保真核验、3 视口 Chrome QA、42 项 AI 来源初核。GEN-UI 主 Skill、HTML 样式、旧评分器和冻结 Tag 均未调整。

**仍未完成：** 由与模型生成过程独立的审查者针对这 42 项开展语义真实性审查；Agent Lead 与 Distributed Systems Audit 上轮 14 项风险的后续真实候选整改；GitHub Release（Tag 已存在但之前发布授权不足）。因此 P1 **不能宣告所有项目都通过**。

建议下一步优先让独立审查人抽审 PlanShip 两条验收分支及两个其他项目的 14 项风险，再考虑是否有必要启动额外真实模型候选试验；不要用无限重试刷通过率，也不要把纯文档定义解释为生产成功。
