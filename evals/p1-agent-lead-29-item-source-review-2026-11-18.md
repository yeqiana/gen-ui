# GEN-UI P1 · Agent Lead 29 项冻结语义二次反向核对

日期：2026-11-18。状态：**27 supported / 2 unclear；自动工具 BLOCKED_SEMANTIC_DISAGREEMENT。检查者为 GPT-6 AI，非真人独立审查，也非签名认证。**

- 来源冻结 Git：`9857d08e7c726e72070876fc08c9403a84d16f9a`；本次只审订后的作者派生候选，原 Claude 原件未修改。
- 候选 SHA-256：`95b4dd1542355d4d45602c968eefbbc6072476c93e7e533e103a1b9dbe0be352`，审查包按来源与候选绑定；完整包保存在本机 GEN-UI 公共仓库外。
- 旧的两处“计划验证误当已做”在审订标题中已标出“建议”；本次检出了另外两处可能导致读者误读的标题歧义，**不假装整体语义验收成功**。

| 条目 | 候选陈述 | 判定 | 冻结来源行 | 核查理由 |
| --- | --- | --- | --- | --- |
| `module:0` | 单 Agent 优先原则 | supported | README.md:40 | README.md:40 明确规定独立工作边界和收益才用多 Agent，这是规范原则，非执行证明。 |
| `module:1` | 不依赖 MCP 的轻量协作 Skill | supported | README.md:3 | README.md:3 直接声明轻量、可移植且不依赖 MCP/平台。 |
| `module:2` | 非跨 Provider 模型路由器边界 | supported | README.md:5 | README.md:5 明确排除自动跨 Provider 路由能力。 |
| `module:3` | 项目级 Skill 安装 | unclear | README.md:9、README.md:14 | README.md:9 描述仓库内放置与可被项目发现，标题“安装”可能暗示其他项目已安装或实际成功加载，需要更窄表述。 |
| `module:4` | SKILL.md 与 references 目录结构 | supported | README.md:15、README.md:16 | README.md:15-16 明确目录树中 SKILL.md 与 references。 |
| `module:5` | 模型与推理策略参考文档 | supported | references/model-routing.md:1、README.md:17 | model-routing.md 与 README 目录树都支持该参考文档存在。 |
| `module:6` | auto 模式任务调用 | unclear | README.md:27 | README.md:27 给出 auto 调用示例，但标题“任务调用”可能误读为实际已调用或能力已实测。 |
| `module:7` | 按任务覆盖模式与并发、推理强度 | supported | README.md:30、README.md:33 | README.md:30-33 给出覆盖模式/并发/强度的提示用法，仅作为文档示例成立。 |
| `module:8` | 无原生子 Agent 时的单 Agent 或显式多会话 | supported | README.md:36 | README.md:36 明确禁止把顺序执行伪装并行，并给出降级建议。 |
| `module:9` | 动态参考已验证模型与推理档位 | supported | README.md:41 | README.md:41 明确要求已验证候选、不得带计费调用盲扫。 |
| `module:10` | 原生子 Agent、Worktree 会话与 CLI 的分类区分 | supported | README.md:43 | README.md:43 显式区分三种执行方式。 |
| `module:11` | 只读分析可并行、修改与集成测试守序 | supported | README.md:44 | README.md:44 明确只读可并行、修改和集成守序。 |
| `module:12` | 密钥与公司代码数据边界 | supported | README.md:45 | README.md:45 明确密钥和公司代码的操作边界。 |
| `module:13` | 不绑定具体模型版本 | supported | references/model-routing.md:3 | model-routing.md:3 明确策略与能力动态绑定，不意味着实际模型能力已核验。 |
| `module:14` | 能力盘点仅记录核实内容 | supported | references/model-routing.md:5、references/model-routing.md:10 | model-routing.md:5-10 列出能力盘点字段，是模板而非已执行检查。 |
| `module:15` | 模型与推理强度的自动选择规则 | supported | references/model-routing.md:17、references/model-routing.md:20 | model-routing.md:17-20 给出模型自动选择规则，未声称执行完成。 |
| `module:16` | 推理强度建议不代表模型一定支持 | supported | references/model-routing.md:22 | model-routing.md:22 明确 low/medium/high 只是建议而非支持保证。 |
| `module:17` | 任务中途修改仅影响新任务或会话 | supported | references/model-routing.md:24 | model-routing.md:24 明确任务中途更改的生效边界。 |
| `module:18` | unsupported_effort：强度不支持时报告不静默降档 | supported | references/model-routing.md:43 | model-routing.md:43 规定强度不可用时不能暗中降档。 |
| `module:19` | provider_isolation：跨 Provider 不通时改用独立会话或单 Agent | supported | references/model-routing.md:44 | model-routing.md:44 明确跨 Provider 不通时的独立会话/单 Agent 降级。 |
| `module:20` | unsupported_model：目标模型不在已核实候选 | supported | references/model-routing.md:42 | model-routing.md:42 定义 unsupported_model 时保留原模型。 |
| `module:21` | subagent_unavailable：降级为单 Agent 并明确报告 | supported | references/model-routing.md:45 | model-routing.md:45 明确子 Agent 不可用时报告并降级。 |
| `module:22` | permission_denied：缺少权限时不尝试绕过 | supported | references/model-routing.md:46 | model-routing.md:46 明确权限拒绝不绕过。 |
| `module:23` | 建议：测试仓库中的只读任务验证 | supported | README.md:51、README.md:54 | README.md:51、54 是建议的只读验证步骤；标题已标注建议，未声称该测试已运行。 |
| `module:24` | 建议：真实需求开发与回归测试验证 | supported | README.md:57 | README.md:57 是下一步真实需求与回归测试的建议，标题已标注建议。 |
| `module:25` | validate-skill.ps1 静态校验 | supported | README.md:65 | README.md:65 描述静态校验命令及目标，但不能据此证明本轮真的执行。 |
| `module:26` | 静态校验不等于真实调用或协作实测 | supported | README.md:57、README.md:65 | README.md:57、65 均明确静态校验不等于真实多模型或子 Agent 实测。 |
| `relation:0` | SKILL.md 与 references 目录结构 --composes--> 模型与推理策略参考文档 | supported | README.md:17 | README.md:17 目录树支持子目录包含 model-routing.md，composes 仅代表文档组成关系。 |
| `relation:1` | 建议：测试仓库中的只读任务验证 --flow--> 建议：真实需求开发与回归测试验证 | supported | README.md:57 | README.md:51、57 的‘先/然后’支持建议步骤先后，flow 不能被理解为实际流程已执行。 |

## 未完成的两项

- `module:3`：**项目级 Skill 安装** → 建议表述 **“项目级目录放置及发现说明”**。目录存在不代表已在所有项目安装、也不等于验证真实加载。
- `module:6`：**auto 模式任务调用** → 建议表述 **“auto 模式提示词示例”**。README 中是指导命令，不是实际运行的证明。

本轮**不覆盖模型原文、不伪造运行结果、不以 AI 二次审查冒充独立人工**。即使修正两个标题并再次通过离线审查，也需要其他审查者核查是否有遗漏。
