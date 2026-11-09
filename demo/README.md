# Demo 导航与文档示例说明

Demo 目录同时保留技术文档 HTML、交互报告、受控协议示例和门户测试夹具。**主展示内容是可阅读的工程文档，不是业务 UI 原型。**

## 技术文档 HTML（主示例）

入口：[技术文档目录](documents/index.html)

| HTML 成品 | 文档类型 | 内容 |
| --- | --- | --- |
| [项目分析报告](documents/project-analysis.html) | 项目分析 | 背景、模块、架构、链路、领域模型、风险和建议 |
| [架构设计方案](documents/architecture-design.html) | 系统设计 | 架构图、状态机、时序图、数据模型、并发与恢复 |
| [技术实施方案](documents/implementation-plan.html) | 实施计划 | 阶段任务、依赖、迁移、灰度、回滚和交付物 |
| [测试验收方案](documents/test-acceptance.html) | 测试验收 | 覆盖矩阵、测试用例、故障注入、性能与验收证据 |

这些页面采用统一的技术文档排版：左侧目录、正文层级、长表格、架构图与时序图、代码块、风险提示和打印样式。图表支持缩放、拖动、适应窗口与全屏；代码块提供复制操作。页面不依赖外网资源，可通过本地浏览器打开。

**内容边界：** 四份文档使用脱敏的 AI 内容生产平台作为统一示例。它们是工程分析和设计样稿，不是当前真实仓库扫描、代码审计、压测或上线验收结果。未执行的测试明确标记为待执行。

## 其他 Demo 与测试夹具

| 目录 / 文件 | 保留理由 | 使用方法 |
| --- | --- | --- |
| [report.html](report.html) | 交互式工程质量数据报告示例 | 本地浏览器打开，数据为虚构样本 |
| [portal-pages/index.html](portal-pages/index.html) | 四页固定夹具，供 iframe 门户回归测试 | 浏览器回归要求保持页面数 |
| [index.html](index.html) | `gen-ui-demo/v1` 声明式 UI 协议教学示例 | 离线滑块和 JSON 示例 |
| `renderer.js`、`report.js`、样式与流程脚本 | 对应演示和自动测试的固定依赖 | 不要随意删除 |
| [documents/assets](documents/assets) | 文档共享 CSS、交互脚本与 Chrome 页面预览 | 离线加载 |

## 验收命令

~~~powershell
node tests/documents.test.mjs
node tests/chrome-documents-smoke.mjs
node tests/chrome-report-smoke.mjs
node tests/chrome-portal-smoke.mjs
~~~
