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

## 安全与边界

- **只管输出，不替代工程规范：** 与项目现有代码审查、实施、测试验收规则兼容。
- **不假装交互：** 宿主能力不明时，只提供完整 Markdown。
- **不执行模型代码：** 不将模型返回的 JS、HTML、CSS、事件脚本当成可信代码。
- **不伪造结果：** 所有“通过、已发布、已推送”都必须有真实证据。
- **当前尚未集成 WebCodex 聊天窗口：** 演示页面可离线使用，宿主集成需单独实施。

MIT 开源，详见 [LICENSE](LICENSE)。