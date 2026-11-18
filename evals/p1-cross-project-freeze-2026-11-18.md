# GEN-UI P1 · 工程基线冻结与跨项目泛化复核

日期：2026-11-18。状态：**工程 Tag 已冻结并推送；新两项目真实模型来源结构与 Chrome 通过；独立语义验收未通过；GitHub Release 对象因发布权限不足尚未创建。**

## 1. 冻结基线（不可与 P1 语义合格混同）

| 项目 | 经核实事实 |
| --- | --- |
| Git Tag | `gen-ui-baseline-2026-11-18`，**已推送** `origin`，指向已验证 Git 提交 `6c55b48f9c69bcb13825dbc5a345c6d7bca84d1b` |
| 测试基线 | 181/181 Node/Skill 测试通过，侧栏展开、折叠、手动调宽回归通过；Windows Chrome GitHub Actions 两项 Job 成功 |
| CI | https://github.com/yeqiana/gen-ui/actions/runs/44226994322 |
| 本地源码包 | 从 Tag 提交经 `git archive` 生成 `gen-ui-baseline-2026-11-18.zip`，4,556,554 字节，320 个 Git 跟踪文件；ZIP 列表含目录条目共 364 |
| 自定义 ZIP SHA-256 | `bf9010956a9d033c5c19ba554c2492e17de43777abb0824e4e40684c108c5a7d`，另有 `SHA256SUMS.txt` |
| GitHub 自动源码包 | https://github.com/yeqiana/gen-ui/archive/refs/tags/gen-ui-baseline-2026-11-18.zip |
| Release 发布状态 | Tag 存在、源码可下载；**GitHub Release 记录尚未创建**。当前用于发布的 API 授权返回 HTTP 403；没有绕过授权，也未擅自更新冻结 Tag |

**注意：** 上述 SHA-256 只对应本机 `git archive` 生成的自定义 ZIP，不用于校验 GitHub 重新打包的自动源码 ZIP，二者字节可能不同。自定义 ZIP 和校验文件留在本机仓库外临时目录，不作为仓库提交；发布前须在 GitHub 网页上以该 Tag 创建 *Pre-release*，再上传两个本地文件。完整 Release 未发布之前，不将 Tag 的 ZIP 称作“已发布的 GitHub Release 附件”。

## 2. 历史六组候选重新评估（只读）

冻结清单：`evals/unseen-panorama-2026-11-17.json`；Agent Lead、PlanShip、Distributed Systems Audit 的 **5/5 个 Git 原文 SHA-256 验真通过**。对之前的 baseline / explicit 六份真实模型候选，在当前评分器上只读复查，结果仍为 **0/6 `BLOCKED`**：

| 项目 | baseline：模块 / 关系 / 当前问题 | explicit：模块 / 关系 / 当前问题 |
| --- | --- | --- |
| Agent Lead | 26 / 4 / **1** | 20 / 4 / **3** |
| PlanShip | 23 / 14 / **17** | 33 / 9 / **2** |
| Distributed Systems Audit | 18 / 0 / **2** | 19 / 2 / **5** |

PlanShip baseline 在 2026-11-17 原规则下的问题计数为 **12**，当前 **17** 是后续增加 Mermaid 条件分支与普通 `flow` 保真门禁后的重新评分；**不是同一套评分标准下的 12→17 质量恶化**，也不把旧模型输出擅自纠正。

失败根因包括：模型引文改写或不完整、证据短于 8 字符、必需边界未进入实际证据引用。Agent Lead explicit 漏掉 `provider_isolation`、`unsupported_effort` 两项边界；Distributed Systems Audit 两组漏掉“按需选用模板”“缺失证据标未验证”边界。只在 notes 中说明不能代替逐项来源证据。

## 3. 两个新项目的一次性真实证据 ID 试验

只在原本未做过证据 ID 真实试验的 **Agent Lead** 与 **Distributed Systems Audit** 各运行一次 Windows Claude CLI，固定输入为 Git 快照与 Evidence ID 目录；每次分别设置 US$0.26 / US$0.28 的 CLI 调用预算上限，未重试择优。完整原始事件均有 `Skill(gen-ui)` 工具调用和对应成功的 `Launching skill: gen-ui`，实际模型标识为 `claude-sonnet-5`，未使用 Codex 额度。

| 试验指标 | Agent Lead | Distributed Systems Audit |
| --- | ---: | ---: |
| 冻结证据行 ID | 59 | 167 |
| 真实模型模块 / 关系 | 26 / 4 | 27 / 4 |
| 必需来源边界 | 4/4 | 4/4 |
| 来源结构问题数 | 0 | 0 |
| 离线结构门禁 | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` |
| 新生成 HTML 浏览器验收 | 375/768/1440px，3/3 | 375/768/1440px，3/3 |
| CLI 报告成本（非账单） | US$0.1143796 | US$0.1376558 |
| 模型候选 SHA-256 | `1a4007728ef80b4ca4a4c51ab4ddf727b1e3ad946566b83d2d5e1c8ea4422176` | `8d2c8e0e809bdc7c9dbce40b17bd8210d71c78cde2d253d2f0749052a5fb07c2` |
| 原始 CLI JSONL SHA-256 | `128dd258e5ee1ce44ab245c19e02fd01753153d887f6be2b680eb9e4e61b5f55` | `a135e4cb8083dba48718c3c7bf8bd93a5206f4ce41e2d3629712bfa9a7ecfa9f` |

总 CLI 报告用量约 **US$0.2520354**。模型原始 JSONL、候选 JSON、还原原文、Chrome 输出和逐条审查包保留在仓库外本地；公开仓库仅保留聚合结果及哈希，不上传个人路径、凭据或原始模型响应。

**这里的 2/2 指来源结构通过率，不是语义泛化合格率。** Chrome 6/6 证明浏览器布局与离线渲染行为，不证明内容关系语义。

## 4. 61 项 AI 辅助语义初核（不是独立人工验收）

审查程序重新依据冻结 Git blob 构造证据包，并对候选、来源指纹及审查决策执行绑定。逐条 AI 初核记录如下：

| 项目 | 审查条目 | 有文档支持 | 不确定 | 不支持 | 门禁 |
| --- | ---: | ---: | ---: | ---: | --- |
| Agent Lead | 30 | 28 | 1 | 1 | `BLOCKED_SEMANTIC_DISAGREEMENT` |
| Distributed Systems Audit | 31 | 19 | 11 | 1 | `BLOCKED_SEMANTIC_DISAGREEMENT` |
| 合计 | **61** | **47** | **12** | **2** | **未通过独立语义验收** |

- Agent Lead：`unsupported_effort → 自动选择规则` 被概括为 `depends`，原文描述更接近条件异常分支，标记 `unclear`；`provider_isolation → 执行方式分类` 的 `depends` 缺少原文直接支持，标记 `unsupported`。
- Distributed Systems Audit：**10 个模块只引用章节标题**，可证明章节存在但不能单独证明它是实际部署能力；`Reader invalid ⇒ Reconcile 不得 healthy` 的条件在普通 `controls` 关系中不够明确；`Snapshot/Cache 矩阵 --flow--> production Reader` 与原文“同时运行多项断言”可能冲突，标记 `unsupported`。
- 其余 47 项的 `supported` **仅表示 AI 初核认为原文支持“文档说明或模板内容”**，不代表真实部署、执行或独立业务正确性验证。所有人工身份字段均为“AI 辅助初核”，没有冒充真人审核。原结构门禁依旧不等于语义门禁。
- PlanShip 较早的新候选还有冻结源 `docs/architecture.md:7,16` 重复使用节点 `A` 的不同含义，以及 `V -- No --> X` 失败分支的 `X` 未解释、候选漏掉该分支；历史冻结源不做静默修改，仍须源仓库澄清并另建新的冻结快照。

## 5. 收口决策与下一轮

**工程基线：已冻结 Tag，可下载。** **GitHub Release 对象：发布权限阻断，需授权后在网页创建。** **P1 结构及浏览器跨域试验：两份新的真实模型候选合格。** **P1 语义泛化：不通过，仍需独立审核和来源修正。**

建议下一步按优先级：先解决 PlanShip 的 `A/X` 来源歧义，Agent Lead 的错误依赖类型，以及 Distributed Systems Audit 的标题作为能力证据问题；之后用一份独立于生成者的审查结论复核具体模块与边，并保留原候选不动。暂不增加核心 `SKILL.md` 规则，不引入服务、数据库、额外长期运行组件，也不靠无限重试模型获得假绿。
