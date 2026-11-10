# Gen UI · 让 AI 回答更容易理解

**简体中文** | [English](README.md)

> 把冗长、密集、难以快速理解的 AI 回答，整理成有结论、有层次、有证据、有下一步的内容。**不是单纯美化 UI。**

[![Validate Skill](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml/badge.svg)](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml)

**Gen UI 是面向 AI Coding Agent 的信息组织与阅读体验 Skill。** 它通过选择恰当的信息结构，改善代码评审、架构说明、实施计划、测试验收、技术分析和日常解释的阅读体验。优先使用宿主可直接阅读的 Markdown；只有在明确需要且宿主支持时，才使用离线 HTML 或经过验证的声明式交互。

## 为什么需要 Gen UI？

同一份技术信息，长段叙述并不一定有利于理解。Gen UI 关注读者的实际问题：

| 常见阅读问题 | Gen UI 的处理方式 |
| --- | --- |
| 一大段文字，看不到结论 | 先说结论，再给证据、限制和下一步 |
| 多个方案混在一起，难以取舍 | 使用对比表，明确优点、代价与推荐条件 |
| 流程、模块依赖关系难理解 | 编号步骤、架构图、SVG 流程图与文字说明 |
| 已完成、待执行和失败混在一起 | 状态标识、验收清单与可核查的证据 |
| 大量记录，找不到关键数据 | 图表、相关字段筛选、分页、列隐藏与长文本浮层 |
| 回答无法在终端和网页间复用 | 根据宿主选择 Markdown、静态图示或受控 HTML |

**原则：不减少必要事实，不编造执行结果，不为了美观增加无意义组件。**

## 先看一个回答重构示例

**普通回答：** “线程池需要考虑 CPU、IO、线程数、队列、拒绝策略、性能指标、运行环境，还需要根据情况做压测和调整……”

**使用 Gen UI 后：** **结论：** 先采用有界队列与明确的拒绝策略；线程数量根据任务类型和实际负载测试确定。**依据：** CPU 密集与阻塞型任务的瓶颈不同。**下一步：** 采集队列等待、P95/P99 与资源利用率，再进行调优。

这是信息组织方式的示例，不是生产环境的线程池配置建议。

## HTML 完整展示 · 十类阅读场景

[![中文信息重构案例与交互报告](demo/assets/report-information-design-preview.png)](demo/report.html)

[**查看交互式完整报告**](demo/report.html) · 包含结论提炼、方案对比、执行步骤、代码评审、实施任务、测试验收、排障分析、宿主适配、技术文档导航、功能覆盖矩阵共 **10 类案例**。

在同一份 HTML 中，还可以体验与阅读直接相关的功能：状态多选与模块批次级联、滑块、图表、表格列隐藏和分页、截断提示、代码块一键复制、离线 SVG 缩放/拖动/全屏、弹窗与抽屉、导航、秒级生成时间及底部公开引用。

## 四份中文工程技术文档

四份 HTML 围绕**脱敏的异步 AI 内容生产平台**，展示从理解项目到验收交付的完整链路；这些是**设计与分析示例**，不是对某个私有仓库的实时扫描结论。

### 01 · 项目分析报告

[![项目分析报告中文预览](demo/documents/assets/project-analysis-preview.png)](demo/documents/project-analysis.html)

业务背景、模块职责、系统边界、领域模型、核心链路与风险。 [阅读项目分析](demo/documents/project-analysis.html)

### 02 · 系统架构设计方案

[![架构设计方案中文预览](demo/documents/assets/architecture-design-preview.png)](demo/documents/architecture-design.html)

任务状态机、模块边界、Outbox、执行权围栏和断点恢复。 [阅读架构设计](demo/documents/architecture-design.html)

### 03 · 技术实施方案

[![技术实施方案中文预览](demo/documents/assets/implementation-plan-preview.png)](demo/documents/implementation-plan.html)

阶段计划、依赖关系、迁移、灰度、回滚与验收门禁。 [阅读实施方案](demo/documents/implementation-plan.html)

### 04 · 测试与验收方案

[![测试与验收方案中文预览](demo/documents/assets/test-acceptance-preview.png)](demo/documents/test-acceptance.html)

覆盖矩阵、故障注入、待执行用例、性能测试计划和证据要求。 [阅读测试验收](demo/documents/test-acceptance.html)

[浏览全部中文技术文档](demo/documents/index.html) · [Demo 目录说明](demo/README.md)

## 安装与使用

Windows PowerShell 中安装到 Codex：

~~~powershell
git clone https://github.com/yeqiana/gen-ui.git "$HOME\.codex\skills\gen-ui"
~~~

在 Coding Agent 中输入：

~~~text
使用 $gen-ui，先识别读者真正要解决的问题。
分析当前项目的异步任务链路，先给结论、关键依据、风险，再列出下一步。
避免长段文字墙；必要时使用表格、步骤或流程图。
明确区分已验证事实、待确认假设和待执行任务。
当前宿主只有 Markdown，不要生成不可操作的按钮。
~~~

Claude Code 可放入项目的 `.claude/skills/gen-ui/`，其他 Agent 可按照其 Skill 机制读取 `SKILL.md` 和 `references/`。安装 Skill 不会自动获得系统权限或让终端支持交互控件。

## 输出模式与更多示例

| 宿主 | 推荐输出 | 说明 |
| --- | --- | --- |
| 终端 / Codex / Claude CLI | 结构化 Markdown | 结论、列表、表格、代码与证据 |
| GitHub / IDE | Markdown、可支持的图示 | 保留文本说明与无图回退 |
| 明确要求的离线 HTML | 自带 CSS/JS 的可信本地文件 | 交互只用于提升阅读和探索效率 |
| 已配置的 Webview Renderer | 校验过的声明式 UI + Markdown | 必须由宿主声明能力 |

中文 Markdown 例子：[Java 代码评审](examples/code-review.zh-CN.md) · [实施验收计划](examples/acceptance-plan.zh-CN.md) · [线程池解释](examples/thread-pool.zh-CN.md)。

其他演示：[离线多页门户](demo/portal-pages/index.html) · [声明式协议教学示例](demo/index.html) · [HTML 规范](references/html-report-contract.md)。

## 验证

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
node tests/chrome-report-smoke.mjs
node tests/chrome-documents-smoke.mjs
~~~

测试仅验证**仓库内的固定示例**；不等于真实目标项目已通过审计、执行或发布。关于安全边界、宿主适配与操作许可，参见 [SKILL.md](SKILL.md)、[集成说明](docs/integration.md) 和 [FAQ](docs/faq.md)。

MIT License · [LICENSE](LICENSE)。
