# GEN-UI Coding Agent 输出评测矩阵

本目录提供可复制的真实 Agent 提示词，以及离线静态质量门禁。它**不会**调用 Codex、Claude、DeepSeek，不会消耗模型额度，也不会执行 AI 生成的 JavaScript。

## 使用方法

1. 打开 agent-cases.json，从中选择一个用例，将 prompt 原样提交给实际 Coding Agent，并确保其加载本仓库的 SKILL.md。
2. 保存 Agent 生成的完整原始交付物（HTML 与其 CSS/JS，或 Markdown），不要把人工编写的 demo 页面当成模型输出。
3. 运行以下命令检查导出的文件：

    node scripts/evaluate-agent-output.mjs --case HTML01 --input "D:\path\to\agent\report.html" --producer "本地 Codex" --report "D:\path\to\result.json"

    node scripts/evaluate-agent-output.mjs --case MD01 --input "D:\path\to\agent\answer.md" --producer "本地 Codex"

4. 静态结果 staticGate=pass 仅说明文件具备部分可以自动识别的规范特征；按 manualChecks 的要求在真实浏览器或终端完成行为与内容验收。
5. 记录 Agent 名称、模型版本、Skill Git SHA、日期、原始 prompt、原始产物路径、人工验收截图、结论与消耗预算。未运行的标记为**未执行**，不要从静态通过率推断模型遵循率。

## 用例矩阵

| ID | 输出 | 核心目标 |
| --- | --- | --- |
| HTML01 | HTML | 中文工程报告、真实列筛选、默认 10 条分页与可调条数、指标、图表和导航 |
| HTML02 | HTML | 模块名 all 与全部筛选冲突、超长文本与有效 Tab 焦点 |
| HTML03 | HTML | 内部标签、表单弹窗、详情抽屉、无障碍名称及额外原文操作禁用 |
| HTML04 | HTML | 用户未说 HTML 一词，仍按已明确的网页交付形式应用 HTML 规范 |
| MD01 | Markdown | 纯终端 Markdown 回退，不产生伪交互与伪执行结论 |

## 验证层级

- **层 1 · 文件静态门禁：** 本项目提供离线脚本，验证部分 HTML 语义、中文标记、样式声明、交互结构以及 Markdown 回退等可观察特征。
- **层 2 · 真实浏览器：** 打开实际 Agent 输出，在 375px、768px、1440px 检查导航、筛选、分页、键盘焦点、弹窗/抽屉、图表联动与 XSS 防护。
- **层 3 · 真实 Agent：** 从原始提示词重新生成产物，保留模型名称、输出与证据，按统一基线重复评审，才能评估退化。
- **层 4 · 跨宿主：** 依据各 Agent 实际宿主渲染能力验证 Markdown/Webview 回退，不可从本地 HTML 示例推断其他宿主原生支持交互。

## 可信示例的真实浏览器自动回归

在本仓库根目录直接运行：

    node tests/chrome-report-smoke.mjs

本脚本通过本地真实 Chrome/Edge 检查自带演示页面的关键交互，不依赖外部服务、不执行模型生成的未知 HTML、不耗费 Codex/Claude 额度。结果也可使用 --report 参数输出 JSON。

**历史记录（2026-11-05，原生 Codex CLI）：** 当时通过桌面用户会话验证登录成功，但 HTML04 的 `exec_command` 执行被策略阻止，**0 个交付文件**。详见 [执行记录](codex-user-session-attempt-2026-11-05.md)。这次失败与随后完成的 WebCodex + ChatGPT GPT-6 评测属于不同执行通道。

## 当前实际状态

- demo/report.html 为手写的离线示例，允许作为**静态门禁自身的正例**；它不构成真实 Coding Agent 的运行证据。
- tests/agent-evaluation.test.mjs 对门禁自身做正例、错误样例与路径安全测试。
- **本地 Codex CLI 的 HTML04 尝试仍受命令执行策略阻断，未获得交付文件；不得将其视为模型合规通过。**
- **WebCodex + ChatGPT GPT-6 路线已覆盖全部五组固定提示词。** HTML01、MD01 属于 [11 月 5 日的旧基线](webcodex-agent-baseline-2026-11-05.md)，HTML02–04 属于 11 月 6 日基于更新后 Skill 的 [第二轮评测](webcodex-agent-matrix-2026-11-06.md)。历史静态项在当时版本全部通过，四组 HTML 有真实 Chrome 证据；新版规则复验历史 HTML03 时，因冗余浏览器标签操作被判为不符合当前规范，保留原有证据不改写；**跨版本覆盖不等于单版本的模型遵循率**，也不是本地 Codex CLI 的评测结果。
- 静态门禁仅采用启发式模式匹配，不解析或执行任意模型生成脚本，不调用网络。静态通过不代表图表数据、ARIA 交互或 WCAG 完全正确。

建议每次调整 Skill 规范后，在相同模型、相同宿主与同一提示词下再次生成、人工审查并留证；不要把本地静态门禁的通过数当成模型效果数据。

最新统一报告：[GEN-UI 五组 Agent 输出评测矩阵（2026-11-06）](webcodex-agent-matrix-2026-11-06.md)。
