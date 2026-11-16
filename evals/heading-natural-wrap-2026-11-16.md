# GEN-UI · HTML 标题提前断行回归（2026-11-16）

## 结论

标题不应像之前的中文正文一样，为追求行长均衡而提前换行。**H1–H4 必须优先利用所在章节可用行宽**：不默认使用 `text-wrap: balance / pretty`、窄 `max-width` 或人工 `<br>`。

本轮将该原则写入公共 Typography 样式与生成契约，并增补 Chrome **实际标题行宽、父内容区宽度、首行利用率、断行类型**检查。原生 Codex 既有 StoryOS 报告本身标题已自然换行；此次缺陷是对**其他生成 HTML 的排版约束及门禁缺失**，不是重新生成了 StoryOS 模型内容。

## 真实浏览器数据（1440px，左侧导航展开）

使用同一份已发布的模型输出，**仅在隔离测试副本**把 H1 替换成较长的 StoryOS 标题；负例额外模拟模型加入 `text-wrap:balance;max-width:75%`。模型原始 HTML、资产及 SHA-256 清单未改。

| 条件 | 可用章节宽度 | H1 元素宽度 | 第一行文字宽度 | Chrome 结果 |
| --- | ---: | ---: | ---: | --- |
| 自然换行 | 1051px | 1051px | **1045px** | PASS |
| 过早换行负例 | 1051px | 788px | **680px** | FAIL（新增门禁） |

修复前，两份报告旧门禁均为 **46/46 PASS**，证明它没发现问题。

修复后，正例 **51/51 PASS**；负例在 375、768、1440px，以及 768/1440px 折叠态共 **5 次被正确拒绝**。Chrome Typography 独立生成模式对负例也按预期失败。公开的 `tests/chrome-heading-wrap-regression.mjs` 会从冻结的模型样本创建临时正反例并自动清理，不会改写原始产物。

## 回归范围

- 原生 Codex 生成的 StoryOS HTML：HTML 交付门禁 **55/55 PASS**（含 4 项任务内容检查）。
- Typography 主回归：**66/66 浏览器场景 PASS**；单个真实生成文件：**6/6 PASS**。
- 15 份技术文档：**45/45 视口场景 PASS**；报告页回归 PASS；Typography 合约单元测试 **4/4 PASS**。
- 测试范围涵盖 375、768、1440px 和导航展开/折叠。普通短标题不会因其本身没有占满一行而报错；只在存在提前断行、异常限宽、人工换行、溢出或非自然文本换行规则时拒绝。

## 验证与边界

```powershell
node tests/chrome-heading-wrap-regression.mjs
node tests/chrome-typography-smoke.mjs
node scripts/accept-html-delivery.mjs evals/artifacts/native-codex-storyos-2026-11-14/report.html --require-image
```

当前由已安装 GEN-UI Skill **新生成**并引用公共 Typography 样式的页面会受益；已导出的、将旧样式内联的单文件 HTML 不会被自动重写，需按需重新生成或修改对应 HTML。浏览器门禁检测的是可见的排版现象，并不等于所有未来模型产物都已通过验收。
