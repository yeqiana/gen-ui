# GEN-UI · 原生 Codex gpt-6-luna High 无强化提示盲测

日期：2026-11-13。状态：本地测试完成，尚未提交及推送。

## 1. 目标与方法

测试目标：验证 GEN-UI 的 HTML/Typography 规范在**不额外强化业务提示词**时能否由本地原生 Codex 正确应用，覆盖导航展开/折叠、移动目录、阅读行宽、宽表格、内容裁切与离线交付约束。

- 环境：Windows 本地 Runner，原生 `codex-cli 0.162.1`，调用参数 `-m gpt-6-luna -c model_reasoning_effort="high" --sandbox read-only --ephemeral`。CLI 命令成功返回；JSONL 事件不包含独立的服务端模型身份签名。
- 任务：StoryOS 异步编排架构报告、Java Task/Attempt 并发代码评审、qr-audit 识别策略回归验收，三个真实语义不同的中文 HTML 任务。
- 各次使用**相同的最小业务目标文字**，没有在任务提示里追加“必须有 doc-layout、mobile-toc、72ch、几列宽表”等专门的合格条件。
- **运行约束：** 原生 Codex 在本机尝试执行 `Get-Content`、`type`、`rg` 时遭本地执行策略拒绝，即便改用隔离目录与 `workspace-write` 也相同。没有绕过安全策略。改为由 Runner 只读提取真实 `SKILL.md`、`references/html-report-essentials.md`、`references/html-report-contract.md`、`references/typography.md`、`assets/typography.css`，作为 workspace snapshot 通过 stdin 提供给模型。**因此这是“原文规则输入下的无强化提示测试”，不等于模型自行读取文件的完全冷启动测试。**
- 原始任务提示、规则快照、模型事件、输出文件均在 `evals/artifacts/codex-typography-blind-2026-11-13/` 的 `storyos/`、`code-review/`、`test-acceptance/` 中保留。失败版本没有手工改写后冒充模型生成。

## 2. 首轮不强化提示的真实问题

| 任务 | 初始静态门禁 | 初始 Chrome 门禁 | 根因 |
| --- | --- | --- | --- |
| StoryOS | FAIL：缺 `main.doc-main` | FAIL | 侧栏无法关联到主内容，生成了自制布局 |
| Java 代码评审 | 原静态门禁 PASS，增强后 FAIL | FAIL | 缺少 `div.doc-layout`，本地 `heading-nav.js` 没有可折叠的宿主 |
| qr-audit | 原静态门禁 PASS，增强后 FAIL | FAIL | 同样缺少 `doc-layout` |

**初始 Chrome 完整通过：0/3。** 初版静态门禁为 2/3，但这是因为它还没有检测 `doc-layout` 运行前提；用修订后的同一套静态规则复核初版，三份均不合格。前后统计需区分门禁版本，不能直接当作严格同口径的成功率提升。

## 3. 收敛改造

1. `references/html-report-essentials.md` 明确静态技术文档使用 `div.doc-layout > aside.doc-toc + main.doc-main.genui-typography`，移动端还需 `details.mobile-toc`；提供本地文档布局 CSS、导航 CSS/JS 及 Typography CSS 的复用要求。
2. `references/typography.md` 明确排版 Token 不等于布局宿主，避免生成只有 Typography 样式而无真实折叠导航的页面。
3. `scripts/validate-html-report.mjs` 增加对文档侧栏宿主、主内容标记及移动目录的检查；`tests/html-report-delivery.test.mjs` 加入对应拒绝用例。
4. `tests/chrome-typography-smoke.mjs` 在生成文件模式下先检查真实布局结构，避免无意义的等待超时；支持已经存在的 `.table-scroll` 与 `.table-wrap`，并检查表格容器的独立横向滚动。
5. 调整过严的测试规则：无表格的文档不因“缺少宽表”误判失败；允许生成技术文档在合理范围内局部覆写行高，但必须与 Token 一致、正文行宽仍受约束。
6. 历史 `demo/architecture-patterns.html` 原本缺移动目录，补齐后保持旧页面功能。
7. StoryOS 第二次生成的布局与 Chrome 全部通过，但可见 `<time>` 含 `+08:00`，违反既有静态时间约束。合约添加仅在机器可读 `datetime` 保存时区的正确示例，**相同自然语言任务**第三次生成后通过。

## 4. 最终证据

| 任务 | 采用模型生成版本 | 交付静态门禁 | Chrome（375/768/1440 × 目录两态） |
| --- | --- | --- | --- |
| StoryOS | `storyos/report-v3.html` | PASS | 6/6 |
| Java 代码评审 | `code-review/report-v2.html` | PASS | 6/6 |
| qr-audit 测试验收 | `test-acceptance/report-v2.html` | PASS | 6/6 |

- **真实模型生成：3/3 静态通过，18/18 Chrome 场景通过。** 所有测过的视口均未观察到文档级横向溢出，正文保持行宽限制，目录展开/折叠实际生效，表格使用自己的可横向滚动容器。
- Demo 与中英文样例 Typography 回归：**66/66** 浏览器场景通过。
- 文档 Chrome：**15 份文档 × 3 个视口 = 45/45** 通过；复杂布局边界测试通过。
- `scripts/test-skill.ps1`：**144/144** Node.js 单元与仓库协议测试通过。
- 本轮没有新增第三方依赖，没有更改原生 Codex 配置或本机权限策略。

## 5. 复测命令

在 GEN-UI 仓库根目录执行：

```powershell
$base = "evals/artifacts/codex-typography-blind-2026-11-13"
$reports = @(
  "$base/storyos/report-v3.html",
  "$base/code-review/report-v2.html",
  "$base/test-acceptance/report-v2.html"
)
node scripts/validate-html-report.mjs @reports
node tests/chrome-typography-smoke.mjs --generated @reports
node tests/chrome-typography-smoke.mjs
node tests/chrome-documents-smoke.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
```

原始模型输入见各自的 `prompt.txt`、`prompt-v2.txt`、`prompt-v3.txt`（仅 StoryOS 有 v3）；生成事件见 `codex-events*.jsonl`。

## 6. 结论与剩余边界

**本轮的三项针对性任务，在提供原始 Skill 规则的前提下，经过简化 HTML 结构合约和浏览器门禁修正后，都能在不额外强化任务提示的情况下生成通过验收的 HTML。**

仍未覆盖：独立新会话未注入规则时的 Skill 自动发现、完全不受限的本地工具自读取、不同模型/多随机种子的统计成功率，以及业务源码事实准确性或生产环境验收。这些不应被本轮通过结果替代。

本地保留所有源代码原有并行修改，本轮**未提交、未推送**。
