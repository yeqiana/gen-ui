# Gen UI

**简体中文** | [English](README.md)

> 让本地 Coding Agent 默认输出清晰、可读、有证据的 Markdown；只有客户端具备安全渲染能力时才使用真实交互界面。

[![Validate Skill](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml/badge.svg)](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml)

**Gen UI** 是给 Codex、Claude Code、DeepSeek 和其他 Coding Agent 使用的通用输出 Skill，可用于实施方案、代码评审、测试验收及技术分析。

它借鉴智能交互式回答的理念，但**不是 ChatGPT 内部 DIL 运行时，也不能靠 Prompt 让纯 CLI 显示可操作控件**。

## 为什么需要它

AI 输出经常出现文字墙、表格过宽、未验证却声称通过、在不支持交互的终端生成无法点击的组件。本 Skill 根据宿主能力选择输出形态，默认用 Markdown 保证可读性，支持受控 Renderer 时再渐进增强。

## 能力范围

| 宿主 | 合理的输出 | 必要条件 |
| --- | --- | --- |
| Codex / Claude CLI / 终端 | Markdown、清单、短表格、代码块 | Skill 指令 |
| GitHub / IDE 预览 | GFM、可选图表 + 文字回退 | Markdown 渲染器 |
| 自有网页 / Webview | 受控 JSON + 真正的表单/滑块 | 宿主集成安全 Renderer |

**Skill 定义模型怎么组织回答；Renderer 才负责把结构化数据变成真实交互组件。**

## 快速安装

### Codex（Windows PowerShell）

~~~powershell
git clone https://github.com/yeqiana/gen-ui.git "$HOME\.codex\skills\gen-ui"
~~~

调用示例：

~~~text
使用 $gen-ui。
给我一份 Java 线程池的实施、测试、验收方案。
当前宿主是 Markdown 阅读器，不支持交互组件。
请先给结论、依据，再列风险和验收步骤。
~~~

### Claude Code / DeepSeek / 其他 AI

将 `SKILL.md`、`references/` 和 `examples/` 放进对应的 Skills 目录，如项目级 `.claude/skills/gen-ui/`。没有 Skill 自动加载的模型，可将 `SKILL.md` 注入系统提示词并按需补充参考文件。

安装此 Skill 并不会修改本地 Runner 或替换模型客户端。

## Agent 输出回归评测

新增 [真实 Agent 提示词矩阵与离线静态门禁](evals/agent-evaluation.md)：覆盖中文报告、模块名冲突、键盘无障碍、表单抽屉和 Markdown 回退。它不会自行调用模型、不会消耗 Agent 额度；只有真实执行 Agent、保留生成文件并通过人工浏览器验收后，才能宣称 Agent 输出符合规范。

## HTML 报告增强能力

当最终交付物确定为 HTML 页面时（无论用户是否明确说出“HTML”），**默认使用简体中文展示**（标题、按钮、表头、状态、表单、提示等）；仅保留必要的品牌、技术名词、字段标识和原始数据。执行下列细则：

- 表头与单元格一律不换行；表格可以横向滚动，并按需固定首列。过长内容省略展示，鼠标悬停或键盘聚焦时浮动显示完整文本，移出或失焦即隐藏；只有实际截断的单元格进入 Tab 顺序。
- 根据真实列的关键字段生成筛选项（编号、模块、状态、批次、耗时等），与数字、图表和分页保持联动。长表格默认每页 20 条，可选 50/100 条。
- **“页内标签”与“新标签页打开”必须有明显中文文案区分**；外部链接采用安全的新标签页属性，站内切换不跳转。
- 弱化不必要的卡片，按需采用表单、弹窗、左右抽屉、内部标签及联动图表，而不是把所有界面做成列表卡片。
- GEN-UI 的原创 SVG 图标主要用于侧边栏、页眉、工具栏、页脚等非正文位置。详见 [品牌图标](assets/icons/README.md)。



当最终交付物是 **HTML 报告**时，Gen UI 会采用真正的网页交互能力：默认左侧目录导航（可切换顶部），按大标题、小标题建立锚点；表格按实际字段提供筛选，长表格默认 **每页 20 条**，可选 50/100（最后一页允许少于 20 条）；开头重点的成功数字用绿色、失败数字用红色突出，普通数值保持中性。可按数据需要使用饼图、柱状图、折线图，以及本地受控 JSON、表单和滑块。

查看 [HTML 报告示例](demo/report.html)（需与 [report.js](demo/report.js) 放在一起）及 [英文 HTML 规范](references/html-report-contract.md)。示例使用 67 条**虚构数据**，仅用于验证分页、筛选与交互；不代表真实测试报告。未确定交付 HTML 时继续遵循 Markdown 优先策略。

## 离线交互 Demo

浏览器打开 [demo/index.html](demo/index.html)，调节核心线程数滑块即可实时更新演示指标。也可以把 [示例 JSON](examples/thread-pool.ui.json) 粘贴到编辑框，测试正常和非法协议的处理。

无需后端、网络、API Key。`gen-ui-demo/v1` 是**本仓库演示协议**，不是 ChatGPT DIL / OpenUI / A2UI 官方接口。详见 [协议说明](references/renderer-contract.md) 和 [集成指南](docs/integration.md)。

## 发布前检查

~~~powershell
# Windows PowerShell 5.1+
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1

# PowerShell 7，支持 Windows / macOS / Linux
pwsh -NoProfile -File scripts/test-skill.ps1
~~~

脚本验证 Skill 元数据、目录结构、JSON 示例、JS 语法与单元测试；GitHub Actions 自动执行。模型遵循程度、真实浏览器交互仍需要人工验收，见 [人工评测](evals/manual-evaluation.md)。

## 文件结构

~~~text
gen-ui/
├── SKILL.md                    # 输出规范
├── agents/openai.yaml          # Agent 元数据
├── README.md / README.zh-CN.md # 中英文文档
├── references/                 # 受控 UI 协议
├── examples/                   # Markdown 和 JSON 案例
├── demo/                       # 离线浏览器示例
├── docs/                       # 集成边界
├── evals/                      # 人工行为评测
├── tests/                      # 自动单元测试
├── scripts/test-skill.ps1      # 一键校验入口
└── .github/workflows/          # CI
~~~

## 实际工程场景

以下案例用于展示真实 Coding 工作中常见的提问与输出格式，**属于可复用的示范，不代表已经检查了真实项目或完成了压测**。

| 场景 | 示例文档 | 能解决的问题 |
| --- | --- | --- |
| [Java 代码审查](examples/code-review.md) | 严重程度、证据和复核步骤 | 不伪造测试通过 |
| [功能实施验收](examples/acceptance-plan.md) | 目标、变更范围、验收清单 | 计划与已验证分离 |
| [Java 线程池解释](examples/thread-pool.md) | 静态表格与公式 | 终端不支持 Renderer 也可用 |

常见问题（CLI 能否交互、DeepSeek 兼容、与 OpenUI/A2UI 的区别）详见 [英文 FAQ](docs/faq.md)。

## GEO / 搜索可发现性

项目标准定位为 **Markdown-first Generative UI Skill for AI Coding Agents**，而非通用 UI 框架。[英文 GEO 文档](docs/geo.md) 和 [中文说明](docs/geo.zh-CN.md) 给出了 GitHub 仓库简介、Topics、链接结构与真实用例建议。[基线评测](evals/discovery-baseline.md) 初始状态为**未测量**，不能伪造 GEO 权重或 AI 引用率。

README 不会自动设置 GitHub About，也不意味着 GitHub Pages 已经上线。仓库元数据需要通过 GitHub 设置或可授权接口更新后单独验收。
## 安全与边界

- **只管输出，不替代工程规范：** 与项目现有代码审查、实施、测试验收规则兼容。
- **不假装交互：** 宿主能力不明时，只提供完整 Markdown。
- **不执行模型代码：** 不将模型返回的 JS、HTML、CSS、事件脚本当成可信代码。
- **不伪造结果：** 所有“通过、已发布、已推送”都必须有真实证据。
- **当前尚未集成 WebCodex 聊天窗口：** 演示页面可离线使用，宿主集成需单独实施。

MIT 开源，详见 [LICENSE](LICENSE)。