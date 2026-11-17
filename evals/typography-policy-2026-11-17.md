# GEN-UI · 正文行宽、缩进与标题规范收口

日期：2026-11-17。范围：宽幅报告、独立技术文档、标注 Typography 的生成式离线 HTML。

## 原问题

- 原版 1440px Chrome 下，技术文档章节宽约 **1051px**，正文被 `48ic` 限制到 **672px**，左右各偏移约 **190px**；折叠侧栏后章节 1100px，正文仍 672px，左右各偏移约 **214px**。仅检查 `text-indent:0` 无法发现整段偏移。
- 三份规范互相冲突：`48ic/62ic/72ch` 究竟是建议还是强制上限，中文标题应当 `wrap` 还是 `balance`，以及列表、摘要能否独立居中。

## 收口原则

- 普通报告与技术文档：标题、正文、列表外框和图表容器默认使用真实章节宽度与共同左侧起点，`text-wrap:wrap`，不强制提前断行；列表符号与 callout 内边距是明确例外。
- 只在显式 `.genui-article-reading` 纯文章容器中，对**包含标题的整篇文章**采用阅读栏，中文建议 `62ic`、英文建议 `72ch`；宽图、表格、代码放在阅读栏外。
- 移除默认全局 `balance/pretty`、正文单独 `margin-inline:auto`、硬编码的 `48rem/56ch` 报告文字上限。自然形成的小屏短末行仅列为观察项，不用缩窄标题掩盖。
- 只修改按需规范、样式和测试；核心 `SKILL.md` 不增加排版正文或新依赖。

## 复现命令

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
node tests/chrome-typography-smoke.mjs
node tests/chrome-heading-break-smoke.mjs
node tests/chrome-heading-wrap-regression.mjs
node --test tests/chrome-prose-alignment-regression.test.mjs
node tests/chrome-report-smoke.mjs
node tests/chrome-documents-smoke.mjs
```

Chrome 检查 375/768/1024/1440px 及侧栏展开/折叠下的真实字符行框、正文占宽、水平偏移与裁切。故障注入为正文 `max-width:60%`、`text-indent:2em`、标题 `text-wrap:balance`，必须被新测试拦截。测试结果以实际运行日志和 GitHub CI 为准。
