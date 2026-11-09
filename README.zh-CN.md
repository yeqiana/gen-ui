# Gen UI

**简体中文** | [English](README.md)

> 让 Codex、Claude Code、DeepSeek 等 Coding Agent 输出结构清晰的 Markdown，以及专业的离线技术文档 HTML。

[![Validate Skill](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml/badge.svg)](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml)

**Gen UI 是一个 Markdown-first 的 AI Coding 输出 Skill**，不是官方 ChatGPT UI 运行时，也不会因为安装了 Skill 就使终端具备按钮、图表或表单交互能力。它按宿主能力选择可读 Markdown、可验证的结构化 UI 数据，或在明确要求 HTML 时生成离线网页。

## 技术文档 HTML 示例

下面展示的是 **AI Coding Agent 输出的专业技术文档**，不是业务系统界面、控制台或数据大屏。四份文档围绕一个脱敏的 AI 内容生产平台展开，内容从项目分析延伸到架构设计、实施和测试验收。

### 01 · 项目分析报告

[![项目分析报告 HTML 预览](demo/documents/assets/project-analysis-preview.png)](demo/documents/project-analysis.html)

从业务目标、模块边界、技术架构、核心链路、领域模型到风险与改造建议，展示完整的工程项目分析。

[打开项目分析 HTML](demo/documents/project-analysis.html)

### 02 · 系统架构设计方案

[![系统架构设计 HTML 预览](demo/documents/assets/architecture-design-preview.png)](demo/documents/architecture-design.html)

包含总体架构、组件职责、任务状态机、时序图、数据模型、并发控制、Transactional Outbox、Fencing Token 和断点恢复设计。

[打开架构设计 HTML](demo/documents/architecture-design.html)

### 03 · 技术实施方案

[![技术实施方案 HTML 预览](demo/documents/assets/implementation-plan-preview.png)](demo/documents/implementation-plan.html)

围绕改造范围、阶段任务、依赖关系、数据迁移、灰度发布、回滚策略和交付验收，呈现可执行的工程实施文档。

[打开技术实施 HTML](demo/documents/implementation-plan.html)

### 04 · 测试与验收方案

[![测试验收方案 HTML 预览](demo/documents/assets/test-acceptance-preview.png)](demo/documents/test-acceptance.html)

包含测试覆盖矩阵、核心用例、故障注入、性能测试阶梯、安全检查和验收证据要求。所有用例均明确标记为待执行。

[打开测试验收 HTML](demo/documents/test-acceptance.html)

[**浏览四份完整技术文档**](demo/documents/index.html) · [文档来源与边界](docs/html-document-examples.md) · [Demo 目录说明](demo/README.md)

## 立即使用

### 安装到 Codex（Windows PowerShell）

~~~powershell
git clone https://github.com/yeqiana/gen-ui.git "$HOME\.codex\skills\gen-ui"
~~~

然后在 Codex 中输入：

~~~text
使用 $gen-ui。
分析当前项目的代码、架构和风险，输出中文实施测试验收方案。
先给结论和证据，不能把待执行、已实施和已验收混为一谈。
~~~

Claude Code 可将仓库放入项目的 `.claude/skills/gen-ui/`；其他 Agent 按其 Skill 发现规则安装，或直接读取 `SKILL.md` 和 `references/`。安装不改变 Agent 的工具权限，也不会自动安装 Webview Renderer。

## 支持的输出方式

| 环境 | 默认输出 | 交互条件 |
| --- | --- | --- |
| Codex / Claude CLI / 终端 | Markdown、表格、流程和代码块 | 不假装能点击 |
| GitHub / IDE Markdown | GFM、可选 Mermaid、文本回退 | 宿主支持的 Markdown 预览 |
| 本地 HTML 报告 | 离线 CSS/JS、表格筛选、图表、目录 | 用户明确要求或任务明确选择 HTML |
| 自有 Webview | 受控声明式 JSON + Markdown 回退 | 宿主已经实现并授权安全 Renderer |

HTML 报告的页面行为是**仓库内可信的演示代码**，不是让模型生成任意 JS 并执行。页面默认离线运行；已有 HTML 目录可使用生成器递归集成为 iframe 门户。

## 本地 Demo 与工具

| 演示 / 工具 | 入口 | 用途 |
| --- | --- | --- |
| 技术文档示例集 | [demo/documents/index.html](demo/documents/index.html) | 四份项目分析、架构设计、实施与测试验收 HTML |
| 工程质量分析报告 | [demo/report.html](demo/report.html) | 离线筛选、表格、图表、分页、抽屉 |
| 多文件 HTML 门户 | [demo/portal-pages/index.html](demo/portal-pages/index.html) | 多级目录、真实 iframe 和移动导航 |
| 声明式 UI 协议 | [demo/index.html](demo/index.html) | 受控滑块和教育用途 `gen-ui-demo/v1` |
| 目录门户生成器 | [scripts/build-html-portal.mjs](scripts/build-html-portal.mjs) | 将现有 HTML 递归整合为门户 |

~~~powershell
# 现有目录内没有 index.html 时
node scripts/build-html-portal.mjs --dir "D:\reports" --title "工程报告"

# 已有手工维护的 index.html：生成独立 portal.html，避免覆盖
node scripts/build-html-portal.mjs --dir "D:\reports" --output "D:\reports\portal.html"

# 本地可信页面需要启用 JS / 表单时，使用沙盒化 HTTP 预览
node scripts/serve-html-portal.mjs --dir "D:\reports"
~~~

直接通过 `file://` 打开门户属于静态沙盒预览，子页面脚本不执行；本地 HTTP 模式启用脚本、表单但**不授予 iframe 同源权限**。更多见 [HTML 报告契约](references/html-report-contract.md)、[Renderer 协议](references/renderer-contract.md)、[集成指南](docs/integration.md)。

## Markdown 基础案例

除 HTML 外，也保留 [Java 代码评审](examples/code-review.md)、[实施验收计划](examples/acceptance-plan.md) 和 [线程池解释](examples/thread-pool.md) 三个可在 CLI/IDE 直接阅读的示例。它们是示范文本，不代表执行过当前业务测试。

## 验证与质量门禁

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
node tests/chrome-report-smoke.mjs
node tests/chrome-portal-smoke.mjs
node tests/chrome-documents-smoke.mjs
~~~

这些测试验证的是**仓库内的固定示例**，不是任意模型输出的安全性或真实业务部署。当前版本的 Model/Agent 独立盲测与正式 Release 需要分别核实；详见 [真实 Agent 证据](evals/webcodex-agent-matrix-2026-11-06.md)与[发布门禁](docs/release-readiness-v1.4.0.md)。

## 仓库结构

~~~text
SKILL.md                 Skill 入口与输出规则
references/              HTML 报告与受控 Renderer 契约
demo/documents/           四份专业技术文档 HTML + 统一样式与交互
demo/                    工程质量报告、目录门户、受控协议示例
examples/                代码评审、实施验收与线程池 Markdown 示例
docs/                    集成说明、HTML 文档示例说明、FAQ、GEO
tests/                   Node 测试与固定浏览器回归
evals/                   真实 Agent 与浏览器验收证据
scripts/                 校验、门户生成与本地预览
~~~

**边界：** Gen UI 管输出呈现，不替代项目的代码规范、运行权限、真实测试、脱敏审查或发布审批。未经验证的设计写成方案，不写成已上线。更多见 [FAQ](docs/faq.md) 和 [GEO 说明](docs/geo.zh-CN.md)。GEO / 搜索可发现性效果尚**未测量**，README 展示不意味着搜索排名或 AI 引用率已提高。

MIT License · [LICENSE](LICENSE).
