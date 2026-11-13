# GEN-UI · 本地原生 Codex Typography E2E 评测

日期：2026-11-13
执行方式：Windows 本地 Runner 调用原生 `codex-cli 0.162.1`。命令传参 `-m gpt-6-luna -c model_reasoning_effort="high"`，模型生成阶段 `--sandbox read-only --ephemeral`。CLI 返回正常；事件日志未单独回显服务端最终模型身份。

## 一、测试范围

验证 GEN-UI Skill 的 HTML Typography 生成能力，而非真实业务系统的安全性、性能或源码质量。三个相互独立的主题：StoryOS 异步任务编排、Java 并发任务代码评审、qr-audit 识别策略测试验收。按需提供 `SKILL.md`、HTML 合约、`references/typography.md` 与 `assets/typography.css` 的**真实本地文本**，测试模型是否能按规则输出完整离线 HTML。

受 Codex 本地只读执行策略限制，模型自行读取工作区文件的首次尝试失败；后续使用 Runner 只读提取并通过 stdin 注入规范文本。此方式不等于 Codex 的工具读取权限已恢复。测试过程没有使用 OpenCodex 代理，也没有要求 Codex 修改仓库源文件。

## 二、失败、定位和修复证据

| 轮次/主题 | 观察结果 | 处置 |
| --- | --- | --- |
| 首次三项生成 | 本地命令读取被策略阻断；StoryOS 输出解释页面，另外两份为未完成说明 | 保留 `report.html` 原始失败记录，改用只读输入上下文 |
| StoryOS v2 | 静态合约通过；375px 缺少 `details.mobile-toc`，浏览器验收失败 | 将移动目录与静态锚点作为明确的生成门槛；模型 v3 通过 |
| Java 代码评审 v2 | 静态合约通过；768px 导航展开时，未包裹在 `.doc-section` 内的长 `pre` 引起页面级横向溢出 | `assets/typography.css` 增加轻量 `main.genui-typography pre` 的 `max-width:100%;overflow-x:auto;font-size:12px` 兜底，原模型报告重新验收通过 |
| qr-audit v2 | 静态及浏览器排版通过；所有表格最多 4 列，没有满足本次最少 6 列的内容验收条件 | 要求同一模型修订表格，v3 包含 8 列测试矩阵，内容结构门禁通过 |

失败报告未手工伪装为模型成功输出，各版本独立保留以便回归和对比。

## 三、最终通过证据

| 报告 | 当前模型生成版本 | 静态 HTML 门禁 | Chrome 排版门禁 | 内容结构检查 |
| --- | --- | --- | --- | --- |
| StoryOS | `storyos/report-v3.html` | PASS | 6/6 | PASS：6×H2、2×H3、长正文、宽表、代码及 SVG |
| 代码评审 | `code-review/report-v2.html` | PASS | 6/6 | PASS：6×H2、2×H3、6 列表格、代码及 SVG |
| 测试验收 | `test-acceptance/report-v3.html` | PASS | 6/6 | PASS：6×H2、3×H3、8 列表格、代码及 SVG |

- Chrome 覆盖 375、768、1440px；移动端目录关闭/展开，平板与桌面左侧导航展开/折叠；正文实际行框宽度、行高、文本裁切、整页水平溢出和宽内容使用区域。
- **最终三份真实模型生成报告：18/18 浏览器场景通过，0 次页面级横向溢出。**
- 本轮原 Demo 与中英文样例：66/66 浏览器场景通过。
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1`：143/143 Node.js 单测通过。
- `git diff --check`：PASS。

## 四、复测命令

在 GEN-UI 根目录执行：

```powershell
$reports = @(
  "evals/artifacts/codex-typography-2026-11-13/storyos/report-v3.html",
  "evals/artifacts/codex-typography-2026-11-13/code-review/report-v2.html",
  "evals/artifacts/codex-typography-2026-11-13/test-acceptance/report-v3.html"
)
node scripts/validate-html-report.mjs @reports
node tests/chrome-typography-smoke.mjs --generated @reports
node tests/chrome-typography-smoke.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
```

## 五、剩余边界

这次生成任务已明确要求 HTML、移动目录、正文宽度和必要内容，属于**带规则输入的针对性端到端测试**，不是不提供规范的盲测，也不能据此证明默认任意模型输出的全量符合率。真实业务项目的运行证据与合规结论未纳入此次排版测试。后续若需测技能自动触发率，应在不强化提示的情况下建立独立盲测集。

所有结果存于 `evals/artifacts/codex-typography-2026-11-13/`。本轮仅本地实施与验证，未 Git 提交、未推送；保留了原工作区并行修改。
