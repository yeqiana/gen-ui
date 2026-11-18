# GEN-UI P1 · Agent Lead 与 Distributed Systems Audit 受控语义纠偏复测

日期：2026-11-18。**状态：Agent Lead 新候选来源结构、语义风险提示与 Chrome 通过；Distributed Systems Audit 新候选存在 1 个未授权 Evidence ID，严格阻断。两个项目的独立人工语义验收均未完成。**

## 1. 试验设计与历史证据边界

本轮只使用 [2026-11-17 冻结原文清单](unseen-panorama-2026-11-17.json)，Agent Lead 的 Git 提交 `9857d08e7c726e72070876fc08c9403a84d16f9a` 与 Distributed Systems Audit 的 `0a224f8f517ff7f380741b0880075a0f53eae64f` 及对应 Git blob 指纹均重新验证。**不修改原冻结来源、旧候选、旧审查包与工程 Tag。**

在仓库外各生成一份受控提示词，且各只执行**一次**真实 Windows Claude CLI 调用：使用 `claude-sonnet-5`，要求真实调用 `Skill(gen-ui)`，冻结 Evidence ID 目录保留原样。两次事件记录都检出实际 Skill tool use 和成功 `Launching skill: gen-ui`，而非信任模型自述。

两份提示词只追加此次已知的语义问题修复要求：

- **Agent Lead**：`unsupported_effort` 是不支持时的处理策略，`provider_isolation` 是回退策略，**不能被假设为静态 `depends` 或顺序 `flow`**。必须保留真实来源证据，但没有关系依据时可以不画边。
- **Distributed Systems Audit**：把源文档说成**可按需选用的模板/矩阵**，而不是运行中的服务；引用标题时必须同时引用该章节的正文证据；Reader invalid 是条件断言；“同时运行”不能变成顺序 `flow`；不需要的关系可以删除。

| 锁定输入与成本 | Agent Lead | Distributed Systems Audit |
| --- | --- | --- |
| 来源证据 ID | 59 | 167 |
| 必需来源边界 | 4 项 | 4 项 |
| 受控提示 SHA-256 | `b29475201f4ddecdfae48bfda04e0ef66e3577f10b9a816ce634c80b953fcae6` | `2638b2db9d9ccfbfbec7d57e6f66655069782341ec411a17729ce2c8707ebac8` |
| CLI 调用预算上限 | US$0.23 | US$0.27 |
| CLI 报告费用（**非账单**） | US$0.1256068 | US$0.1525326 |
| 实际模型与 Skill 加载 | 均已验证 | 均已验证 |
| 模型事件 JSONL SHA-256 | `65345b5d0c49602fce49fb0f902494668a752c0a4cd2cc200bc64bb4ec4171d8` | `3f9aba7ef2b9ba8a7961825d9e9be3926a15cd22f207bc1f65f9d0b6f3845494` |
| 新候选 JSON SHA-256 | `3d156541da9a04683beca8bde0e6efdb035af9b813b70fc93f542c56d17e98ad` | `0f8d54713d60c29dcc991e56b606da9ad4ae74f09c0b6eda605a85adc88ff95c` |

**费用合计为 CLI 报告的 US$0.2781394，不是已核对的账单费用**。没有使用 Codex 额度，也没有通过 OpenCodex 代理。没有择优重跑，历史原始模型 JSONL 与新试验 JSONL 仍留在 Git 公共仓库外，报告仅提交数据、结论和哈希。

## 2. 实测结论

| 检查项 | Agent Lead 新候选 | Distributed Systems Audit 新候选 |
| --- | --- | --- |
| 实际输出模块 / 关系 | **27 / 2** | **17 / 0** |
| 来源引用 | 37/37 有效 | **51/52 有效，1 个虚构 ID** |
| 四项必需来源边界（引用覆盖诊断） | 4/4 | 4/4（仅诊断，不覆盖非法 ID 的阻断） |
| 旧两条错误关系 | 已不再出现 | 已不再出现 |
| 模块“仅引用标题” | 0 | 0 |
| “把模板当已部署服务” | 未宣称部署 | **17 个模块均标注为文档/模板/检查项** |
| 来源结构正式状态 | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` | **`BLOCKED`：未知 Evidence ID** |
| HTML 渲染 / Chrome | **375、768、1440px，3/3 通过** | **不渲染：校验失败阻断** |
| 语义审查状态 | 29 项审查包已生成、**待独立核验** | 尚不能进入通过门禁 |

**Agent Lead**：保留 `unsupported_effort`、`provider_isolation` 的原文证据，模型生成的两条关系仅为 `composes` 和 `flow`，没有再输出被质疑的两条 `depends`。29 项审查包已依据冻结 Git 原文创建，没有填写伪造的独立审核决定；现有启发式风险提示为零**不等于**证明所有关系语义正确。真实模型离线 HTML 已通过 Chrome 三个视口，未发现横向页面溢出。

**Distributed Systems Audit**：新模型本身实际消除了原先的 10 个仅有章节标题的模块引用、两条关系误述；它把条件规则保留在有原文证据的“文档模板/条件断言”模块中，且输出 `relations:[]`。**但 MQ / Delivery 模板模块的某个引用 ID 为 `E187758FBA04`，不属于本次冻结证据目录。** 严格的 `resolveEvidenceIds` 因而拒绝整个候选，没有擅自将引用替换成猜测的真实 ID，没有生成声称合格的 HTML。**不能把“其它 51 条引用有效”说成模型已经通过来源门禁。**

本轮与 2026-11-18 前一次真实模型候选不是同一份输出，模块数/关系数变化不单独证明泛化质量提升；以上只能说明**这一次新候选**在特定约束下的结果。

## 3. 针对虚构 ID 的最小工程改进

在可选离线评测代码 `evals/evidence-id-map.mjs` 新增纯函数 `evidenceIdOutputSchema(entry)`，并在 `prepare-ids` 阶段额外输出 `evidence-ids.output-schema.json`，从**冻结 Git 来源重新生成**结构化输出 Schema：

- 对模块与关系的 `evidence[].id` 使用源目录中的 **完整 Evidence ID enum 白名单**；限制响应的 `schema`、案例 `id`、状态、层/关系结构与类型，支持合法的条件关系字段。
- 只约束模型的输出结构，**不在模型输出后自动修复非法 ID**，不改变原有 `resolveEvidenceIds` 的 fail-closed 最终门禁；冻结源变更时 Schema 也必须重新生成。
- 生成出的 JSON Schema 已离线解析并完成新增单元测试；对上述两个冻结样本，Schema ID 数分别为 59 和 167，SHA-256 分别为 `b2825db95317b7a3d4fa1228fd803a73627926728e77ce4a9d17c7b5eb6e80fa`、`1eddf9b87fbf2ea23aa4eff7b1b6977d840db4cdd9eea026123f88ccad8fd9e7`。
- **这项 Schema 尚未用于实际的模型调用**，不能据此宣称下次模型一定不再产生无效 ID；需要后续做一次封闭 ID 模式的真实试验及结构/语义复核。没有额外依赖、服务、常驻进程，核心 `SKILL.md` 与已冻结 Tag 不变。

**本轮工程回归：** 完整 Skill/Node 协议与仓库测试 **184/184 通过**，新增白名单的正反例测试通过；完整本地 Chrome 套件的报告/文档/导航/排版/移动端、HTML02/HTML03/HTML04 均通过；Agent Lead 新候选 Chrome 三视口 **3/3 通过**。本轮未修改核心 Skill、已有导航/排版或 HTML 渲染器，远端 CI 仍需按新提交重新验证。

## 4. 验收状态与后续

本次真实 Agent Lead 候选结构通过、Chrome 3/3 通过；Distributed Systems Audit 虽改善了候选语义表达，但 **由于 1 个非法 Evidence ID 仍为 `BLOCKED`**。整个 GEN-UI P1 **仍未获得独立人工语义验收通过**。不要自动补证、不要将候选标记为正式上线，也不要仅凭启发式风险提示为零宣告通过。

后续优先：① 对 Agent Lead 29 项进行独立语义审核，重点验证仅剩的 2 条关系；② 对 Distributed Systems Audit 使用冻结 ID 白名单进行**一次**新受控模型生成，并严格核验所有 ID、模板标记与条件/并行语义；③ 若结构/Chrome/独立语义均通过，再讨论 P1 正式收口。已有 `gen-ui-baseline-2026-11-18` Tag 不移动，GitHub Release 先前发布权限不足，不能把 Tag 当成已正式发布的 Release。
