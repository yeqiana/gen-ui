# Gen UI GEO / 搜索可发现性说明

本文件对应英文主文档 [docs/geo.md](geo.md)，用于中文维护者理解 GEO v1.1 的目标与边界。

**项目定位：** Gen UI 是 Markdown-first 的 AI Coding Agent 输出 Skill，附带一个独立的受限交互式 UI Demo。它不是 ChatGPT 官方 DIL，也没有直接集成 OpenUI 或 A2UI。

**核心用户问题：** 如何让 Codex / Claude Code 等 Coding Agent 在终端、Markdown 阅读器或自有 Webview 中，按实际宿主能力输出易读、可靠、可验收的结果？

## 建议的 GitHub About 信息

Description：

> Markdown-first Gen UI Skill for AI coding agents, with evidence-based reports and safe interactive UI fallbacks.

Topics：`generative-ui`、`agent-skills`、`coding-agents`、`ai-coding`、`markdown`、`developer-tools`、`codex`、`claude-code`、`interactive-ui`。

注意：**这只是待人工/授权接口应用的建议**，提交文档不等于成功修改仓库 Topics。

## 实施与验收

1. 保持英文 README 为首页，中文文档清晰可达。
2. 保持英文核心 `SKILL.md` 为权威执行规范，回答语言仍按用户请求选择。
3. 提供真实的问题说明和可核验的示例，而不是自动生成大量关键词页。
4. 补充 FAQ、代码评审、实施验收、线程池三个示例。
5. 测试本地链接、协议一致性、旧版功能及错误降级。
6. 基线采用 [人工采样表](../evals/discovery-baseline.md)，首次状态写**未测量**，不编造 GEO 分数。

对于 Google AI 搜索，官方强调原始优质内容和基本 SEO；额外的 `llms.txt` 并非进入搜索的必要条件。若后续建立独立文档站，再单独处理索引、robots.txt 与可访问性。

详情和外部官方资料链接见 [英文 GEO 规范](geo.md)。