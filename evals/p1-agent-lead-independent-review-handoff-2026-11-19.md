# GEN-UI P1 · Agent Lead 人工独立语义审核交接包

日期：2026-11-19。**29/29 项已经准备审查材料；29/29 项独立真人决定为 PENDING，暂不可放行。**

材料来源：冻结 Git `9857d08e7c726e72070876fc08c9403a84d16f9a`，Claude 原始候选 SHA256 `3d156541da9a04683beca8bde0e6efdb035af9b813b70fc93f542c56d17e98ad`，编辑版 v2 SHA256 `ac3b878fc1771ecdf584b1ac3cc0e4fb2c1b1e7c78873bc3b59c31da4888a87f`。原始 Claude 输出、编辑 v2 全量 JSON 与源码审查事件在本机仓库外。

编辑 v2 只变更以下 4 个标题，**没有改模块 ID、证据和关系**：
- `project-skill-install`：项目级 Skill 安装 → 项目级 Skill 目录放置与发现说明
- `auto-mode-invocation`：auto 模式任务调用 → auto 模式提示词示例
- `readonly-smoke-test`：测试仓库中的只读任务验证 → 建议：测试仓库中的只读任务验证
- `dev-regression-validation`：真实需求开发与回归测试验证 → 建议：真实需求开发与回归测试验证

## 第三方审核项（必须逐个填写）

| 键 | 候选陈述 | 来源位置 | 独立决定 | 核查重点 |
| --- | --- | --- | --- | --- |
| `module:0` | 单 Agent 优先原则 | README.md:40 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:1` | 不依赖 MCP 的轻量协作 Skill | README.md:3 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:2` | 非跨 Provider 模型路由器边界 | README.md:5 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:3` | 项目级 Skill 目录放置与发现说明 | README.md:9；README.md:14 | **PENDING** | 确认仅目录放置与发现说明，不应声称目标项目已安装/真实加载 |
| `module:4` | SKILL.md 与 references 目录结构 | README.md:15；README.md:16 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:5` | 模型与推理策略参考文档 | references/model-routing.md:1；README.md:17 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:6` | auto 模式提示词示例 | README.md:27 | **PENDING** | auto 模式只是 README 提示词示例，不应声称命令真实调用 |
| `module:7` | 按任务覆盖模式与并发、推理强度 | README.md:30；README.md:33 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:8` | 无原生子 Agent 时的单 Agent 或显式多会话 | README.md:36 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:9` | 动态参考已验证模型与推理档位 | README.md:41 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:10` | 原生子 Agent、Worktree 会话与 CLI 的分类区分 | README.md:43 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:11` | 只读分析可并行、修改与集成测试守序 | README.md:44 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:12` | 密钥与公司代码数据边界 | README.md:45 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:13` | 不绑定具体模型版本 | references/model-routing.md:3 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:14` | 能力盘点仅记录核实内容 | references/model-routing.md:5；references/model-routing.md:10 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:15` | 模型与推理强度的自动选择规则 | references/model-routing.md:17；references/model-routing.md:20 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:16` | 推理强度建议不代表模型一定支持 | references/model-routing.md:22 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:17` | 任务中途修改仅影响新任务或会话 | references/model-routing.md:24 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:18` | unsupported_effort：强度不支持时报告不静默降档 | references/model-routing.md:43 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:19` | provider_isolation：跨 Provider 不通时改用独立会话或单 Agent | references/model-routing.md:44 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:20` | unsupported_model：目标模型不在已核实候选 | references/model-routing.md:42 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:21` | subagent_unavailable：降级为单 Agent 并明确报告 | references/model-routing.md:45 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:22` | permission_denied：缺少权限时不尝试绕过 | references/model-routing.md:46 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:23` | 建议：测试仓库中的只读任务验证 | README.md:51；README.md:54 | **PENDING** | 先做只读测试的建议不等于已完成 |
| `module:24` | 建议：真实需求开发与回归测试验证 | README.md:57 | **PENDING** | 真实需求开发与回归是后续建议，不等于已实际跑通 |
| `module:25` | validate-skill.ps1 静态校验 | README.md:65 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `module:26` | 静态校验不等于真实调用或协作实测 | README.md:57；README.md:65 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `relation:0` | SKILL.md 与 references 目录结构 --composes--> 模型与推理策略参考文档 | README.md:17 | **PENDING** | 是否由对应冻结原文直接支持？是否把指南、模板或建议误写成已实现/已验证事实？ |
| `relation:1` | 建议：测试仓库中的只读任务验证 --flow--> 建议：真实需求开发与回归测试验证 | README.md:57 | **PENDING** | 建议步骤有顺序，不代表具体项目曾经发生执行 |

## 放行规则

1. 独立审查者须核实冻结 Git commit、Claude 原始候选及编辑 v2 的 SHA256，逐项检查文档事实与状态。
2. 每项明确 supported / unsupported / unclear，保留理由及证据归属，外部审核人签审及验证记录不能由当前 GPT-6 自我代填。
3. 任一 unsupported、unclear、pending 或无可信签审证据时，**P1 语义门禁保持 BLOCKED**。
4. 不把 AI 自评 29/29 supported 当作独立真人结论，不假称 Skill 安装、CLI/子 Agent 运行或付费模型对接成功。

对应可填写 JSON：`evals/p1-agent-lead-independent-review-handoff-2026-11-19.json`；所有审核状态明确是待办，不是历史事实。
