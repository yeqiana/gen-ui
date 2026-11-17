# GEN-UI vNext · 标题换行与正文行宽根因复核

日期：2026-11-17。范围：离线报告页、中文/英文四类技术文档、生成式 HTML 排版样例；1440/768/375px 与导航展开、折叠及平板目录切换。

## 现场证据与根因

1. 768px 的静态技术文档仍使用 205px 固定侧栏及 26px 布局间距，实际正文仅约 431px。架构设计、实施计划、测试验收三个 H1 均被挤成两行，第二行文字仅约 88px。此前“无水平溢出”检查没有发现这个可读性缺陷。
2. 1440px 下的生成式 HTML 由于正文仅定义 `72ch / 62ic` token，却在渲染时 `max-width:100%`，折叠侧栏后中文最长可达约 1306px，英文约 1291px；长段落过宽、阅读节奏差。传统中文技术文档正文也出现正文与宽图表争用整个容器的问题。
3. 报告页二级标题包含紧邻文字的图标；`Range.getClientRects()` 测量中图标与文本的 y 偏差约 3px，旧工具错误地把同一视觉行算成两行。
4. 已有 `tests/chrome-heading-wrap-regression.mjs` 明确要求 H1–H4 利用整段章节宽度，反对 `max-width:75%` 与 `text-wrap:balance`。实测证明直接限宽 H1 会让原有正例失败，故**撤销了 H1 的硬性限宽**。标题应充分利用章节宽度，正文才独立限宽。

## 实施与保护

- 701～900px 的静态文档与标准生成式 HTML 使用展开式目录替代固定左侧栏，避免平板宽度的标题末行孤字。桌面大宽度仍保留可折叠的 M 导航，375px 保留移动目录。
- 中文正文上限调整至约 `48ic`，英文约 `72ch`，真实 CSS 计算和元素宽度验证；折叠后的正文列居中，图表、表格、代码不随叙述文本压窄。
- 原有 HTML 验收从“所有段落必须和父容器一样宽”的旧假设调整为按**实际 CSS 阅读上限与居中几何**判定；仍保留提前断行、异常缩进与隐藏 M 的故障注入检查。
- 标题仍用 `text-wrap:wrap`，没有人为 `<br>` 或 `balance/pretty`；标题测试行盒聚合适配图标与文字的轻微垂直偏差。
- 对应按需规则同步到 `references/typography.md`，不修改核心 `SKILL.md`。

## 独立验收入口

```powershell
node tests/chrome-typography-smoke.mjs
node tests/chrome-documents-smoke.mjs
node tests/chrome-heading-wrap-regression.mjs
node tests/chrome-fold-reading-regression.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
```

这份结论只涉及本地浏览器中的可见布局和回归约束；不表示所有外部用户先前生成的单文件 HTML 会自动更新。已经内联旧 CSS 的产物必须重新生成或单独修复。
