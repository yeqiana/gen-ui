# GEN-UI P1 · Agent Lead 28 项独立人工审核工作页

**全部 PENDING。** 给未来真实独立审核者使用，不是 AI 签审意见，也不是发布通过证据。

冻结来源：`9857d08e7c726e72070876fc08c9403a84d16f9a`；作者审订候选 SHA-256：`779d886072410a8ccddf3e72aaf952bdbee94df7e5089e10251ef795d34e9906`。应先核对审核包里的候选、冻结原文及 SHA 再逐项阅读。

审核方式：在获授权的私密副本中逐条填写 supported / unsupported / unclear 及具体理由；任何未审或不确定项均不能放行。请勿将真人信息或敏感签审材料提交公开 Git。

## 模块与关系（28 项）

| 项目 | 主张 | 冻结源行 | 审核决定 / 理由 |
| --- | --- | --- | --- |
| module:0 | 单 Agent 优先原则 | `README.md:40` - 单 Agent 优先；只有具备独立工作边界和实际收益才启动多个 Agent。 | **PENDING**（理由待填） |
| module:1 | 不依赖 MCP 的轻量协作 Skill | `README.md:3` > 轻量级、可移植的多 Agent 协作 Skill。**不新增平台、不依赖 MCP、不接管现有 API/Provider 配置。** | **PENDING**（理由待填） |
| module:2 | 非跨 Provider 模型路由器边界 | `README.md:5` Agent Lead 面向 Codex Desktop 等编码代理环境，让复杂研发任务可以按依赖进行分工、并行分析/开发、统一验证；简单任务保持单 Agent。它**不是**一个自动跨 DeepSeek、GLM、Qwen、Codex、Claude Provider 的模型路由器。 | **PENDING**（理由待填） |
| module:3 | 项目级 Skill 目录放置与发现说明 | `README.md:9` 本仓库已包含 `.agents/skills/agent-lead/`，在 Codex Desktop 打开本仓库时可按项目级 Skill 发现；其他项目不会自动获得该 Skill。若需要在公司项目中复用，请将该目录复制或链接到目标项目。；`README.md:14` <项目>/.agents/skills/agent-lead/ | **PENDING**（理由待填） |
| module:4 | SKILL.md 与 references 目录结构 | `README.md:15` ├── SKILL.md；`README.md:16` └── references/ | **PENDING**（理由待填） |
| module:5 | 模型与推理策略参考文档 | `references/model-routing.md:1` # 模型选择与推理强度（运行时策略）；`README.md:17` └── model-routing.md | **PENDING**（理由待填） |
| module:6 | auto 模式提示词示例 | `README.md:27` $agent-lead 根据当前项目需求判断是否需要多 Agent 协作，完成分析、实施、评审和最终验收。模式=auto，模型=auto，推理强度=auto，并发=auto。 | **PENDING**（理由待填） |
| module:7 | 按任务覆盖模式与并发、推理强度 | `README.md:30` 也可以按任务覆盖：；`README.md:33` $agent-lead 设计并实现登录模块。模式=multi，并发=2，评审推理强度=high。 | **PENDING**（理由待填） |
| module:8 | 无原生子 Agent 时的单 Agent 或显式多会话 | `README.md:36` 如没有真实的原生子 Agent 能力，就使用单 Agent 或明确的多会话协作，不要把连续执行叫做并行。 | **PENDING**（理由待填） |
| module:9 | 动态参考已验证模型与推理档位 | `README.md:41` - 动态参考当前**已验证可用**模型和推理档位，不写死模型名，不擅自扫描有计费的 API。 | **PENDING**（理由待填） |
| module:10 | 原生子 Agent、Worktree 会话与 CLI 的分类区分 | `README.md:43` - 原生子 Agent、独立 Worktree 会话、Claude CLI 是不同执行方式，不能混为一谈。 | **PENDING**（理由待填） |
| module:11 | 只读分析可并行、修改与集成测试守序 | `README.md:44` - 只读分析可并行，涉及接口依赖的代码修改和最终集成测试要遵守先后顺序。 | **PENDING**（理由待填） |
| module:12 | 密钥与公司代码数据边界 | `README.md:45` - 不保存密钥、不读取私人配置凭证、不未经授权向外部服务传递公司代码。 | **PENDING**（理由待填） |
| module:13 | 不绑定具体模型版本 | `references/model-routing.md:3` Agent Lead 不绑定 DeepSeek、GLM、Qwen、Codex 或 Claude 的具体版本号。模型目录以当前执行环境提供的能力为准，每次任务可刷新；**不能仅凭模型选择菜单或品牌名称判断它支持原生子 Agent、工具调用或某档推理强度**。 | **PENDING**（理由待填） |
| module:14 | 能力盘点仅记录核实内容 | `references/model-routing.md:5` ## 能力盘点（只记录核实内容）；`references/model-routing.md:10` \| 是否可用于原生子 Agent \| yes/no/unknown \| 实际工具能力与小规模验证 \| | **PENDING**（理由待填） |
| module:15 | 模型与推理强度的自动选择规则 | `references/model-routing.md:17` ## 自动选择规则；`references/model-routing.md:20` 2. 从当前**已核实可用**的候选中筛选满足工具能力、权限和上下文需求的模型；没有可靠比较证据时沿用父会话默认模型。 | **PENDING**（理由待填） |
| module:16 | 推理强度建议不代表模型一定支持 | `references/model-routing.md:22` 4. 选择候选推理强度：简单任务 low，常规任务 medium，复杂/高风险任务 high；明确仅为建议，不代表模型一定支持。 | **PENDING**（理由待填） |
| module:17 | 任务中途修改仅影响新任务或会话 | `references/model-routing.md:24` 6. 如果模型/推理强度在任务中途被修改，只影响确实可重新配置的新任务/会话；不可宣称修改已在运行的调用。 | **PENDING**（理由待填） |
| module:18 | unsupported_effort：强度不支持时报告不静默降档 | `references/model-routing.md:43` - `unsupported_effort`：模型/客户端不支持指定强度，不能静默降档；如用户选 auto，可使用默认强度并说明。 | **PENDING**（理由待填） |
| module:19 | provider_isolation：跨 Provider 不通时改用独立会话或单 Agent | `references/model-routing.md:44` - `provider_isolation`：不同 Provider 不能由当前原生子 Agent 统一路由，改为独立会话或单 Agent。 | **PENDING**（理由待填） |
| module:20 | unsupported_model：目标模型不在已核实候选 | `references/model-routing.md:42` - `unsupported_model`：目标 ID 不在当前已核实候选中，保留原模型；要求用户另选或使用 auto。 | **PENDING**（理由待填） |
| module:21 | subagent_unavailable：降级为单 Agent 并明确报告 | `references/model-routing.md:45` - `subagent_unavailable`：原生子 Agent 不可用，降级为单 Agent 并明确报告。 | **PENDING**（理由待填） |
| module:22 | permission_denied：缺少权限时不尝试绕过 | `references/model-routing.md:46` - `permission_denied`：缺少目录/网络/外部工具权限，不尝试绕过。 | **PENDING**（理由待填） |
| module:23 | 建议：测试仓库中的只读任务验证 | `README.md:51` 将 Skill 安装到一个**允许读写的测试仓库**，先发出只读任务：；`README.md:54` $agent-lead 检查当前仓库的模块结构和测试风险。禁止修改文件。报告是否真实启用子 Agent、模型及推理强度是否经过确认。 | **PENDING**（理由待填） |
| module:24 | 建议：真实需求开发与回归测试验证 | `README.md:57` 然后再选一个有明确接口边界的真实需求验证开发与回归测试。Skill 文件静态校验通过 **不等于** 多模型 API、子 Agent 或外部 CLI 已经实测可用。 | **PENDING**（理由待填） |
| module:25 | validate-skill.ps1 静态校验 | `README.md:65` 使用 PowerShell 7 或 Windows PowerShell 运行 `scripts/validate-skill.ps1`，检查 Skill 元数据、安装目录与源码一致性、参考文件及许可证。GitHub Actions 执行同一静态校验；这不代表已完成真实多模型调用或子 Agent 协作测试。 | **PENDING**（理由待填） |
| module:26 | 静态校验不等于真实调用或协作实测 | `README.md:57` 然后再选一个有明确接口边界的真实需求验证开发与回归测试。Skill 文件静态校验通过 **不等于** 多模型 API、子 Agent 或外部 CLI 已经实测可用。；`README.md:65` 使用 PowerShell 7 或 Windows PowerShell 运行 `scripts/validate-skill.ps1`，检查 Skill 元数据、安装目录与源码一致性、参考文件及许可证。GitHub Actions 执行同一静态校验；这不代表已完成真实多模型调用或子 Agent 协作测试。 | **PENDING**（理由待填） |
| relation:0 | SKILL.md 与 references 目录结构 --composes--> 模型与推理策略参考文档 | `README.md:17` └── model-routing.md | **PENDING**（理由待填） |

### 审查焦点

建议先只读测试、后真实开发验证不等于已实际运行；最新版仅保留一条文档组成关系。跨 Provider / 子 Agent 的能力与推理强度不能由规范描述推断为实测通过。

## 外部审核者签审（待真实填写）

- 审核者身份及独立性证明：**PENDING**
- 不支持与不确定项的复核结果：**PENDING**
- 冻结来源及候选 SHA 对照：**PENDING**
- 独立签审证据位置（私密）：**PENDING**
- 本文件不构成自动发布授权。
