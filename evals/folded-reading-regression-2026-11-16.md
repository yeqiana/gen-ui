# GEN-UI · 折叠导航阅读区与 M 标识回归验收

日期：2026-11-16。状态：本地修复与浏览器验证完成，未提交推送。

## 复现的两个根因

1. 中文正文仍提前换行。部分生成文件将旧 `62ic` / `72ch` Token 当作段落硬限宽；在主阅读区宽 **1100px** 时，图后正文、普通段落、引用块与图表相邻正文仍被裁至 **868px**。其问题不是文本长到需断行，而是选择器优先级较高的旧 CSS 规则覆盖了先前新增的修复。另一些引用块叠加 UA 的默认 40px 外边距与组件内边距，造成段首明显偏右。
2. 导航折叠后的 M 标识消失或重叠。原生 Codex 生成的品牌标题同时包含 `<img>`，公共 CSS 又额外生成一个 M 伪元素，两个图标被放进仅 **36px** 的品牌格子；其中一个实际落在格子之外，可能被侧栏裁切。旧验收只检查伪元素 CSS 存在，未检查是否重复及实际渲染状态。

## 修复

- 移除正文、引用块、callout 与图表相邻段落的硬限宽，改用所属章节真实内容列宽；引用内容保留合理的 14px 内边距，不额外继承默认的 40px 引用块缩进；去掉异常首行缩进，保留代码与宽表格自己的布局。
- 折叠的 `.doc-toc > .toc-brand` 默认只显示一个独立的 M 伪元素，品牌内部已有 `img` 在折叠态不再参与布局；M 形使用内嵌小型 SVG，避免文件相对路径变化导致标识丢失。hover / 键盘聚焦仍在同一热区显示展开箭头，独立展开按钮不占位。
- `scripts/accept-html-delivery.mjs` 增加叙述性段落、引用、callout 和图表附近段落的父宽度、左偏移、首行缩进、自然换行检查；增加折叠后 **M 可见 / 未重复**检查，而非仅查询 CSS 属性。仍复用 Node.js 与系统 Chrome，无新增第三方依赖。
- `tests/chrome-fold-reading-regression.mjs` 用冻结的原生 StoryOS HTML 构造**隔离测试副本**，覆盖图后、表后、引用块、callout，以及引用/提示块后的正文；另构造窄限宽、28px 首行缩进、隐藏 M 两组负例。该测试不修改原始模型文件。

## 关键实际测量（1440px，侧栏折叠）

| 场景 | 修复前 | 修复后 |
| --- | ---: | ---: |
| 阅读区宽度 | 1100px | 1100px |
| 图后首段宽度 | **868px** | **1100px** |
| 引用块外宽度 | **868px** | **1100px** |
| 引用块内部首段 | 受限列宽、叠加缩进 | 随内容宽度自然换行，保留 14px 提示性内边距 |
| M 默认状态 | 两个 M 互相挤占（其中一个落到点击区域外） | 一个 M，位置固定 |
| M hover | 展开箭头 | 同位置展开箭头，淡蓝底色 |

## 浏览器验收

- 真实 StoryOS 生成内容的**隔离交付预览**：在 375/768/1440px 的 Chrome 验收 **58/58 PASS**，含默认 M 和实际段落行宽。原生 Codex 生成的仓库历史文件未修改。
- 旧样式的同样案例：**预期 FAIL**；768px 和 1440px 会识别 M 重复，1440px 识别图表/引用附近正文宽度不足。
- 自动负例回归：**PASS**；故意加入 62ic 限宽和 28px 首行缩进后，阅读区门禁触发 **5 项失败**；故意隐藏 M 后，768/1440px 默认 M 检查触发 **2 项失败**。
- 15 份已有技术文档：**45/45** 视口场景通过；Typography 浏览器主回归：**66/66**；Typography 合约单元测试：**4/4**；报告页浏览器回归通过。

## 对照截图与查看

- [折叠 M：修复前](artifacts/layout-fold-regression-2026-11-16/before-folded-M.png) / [修复后](https://github.com/yeqiana/gen-ui/releases/download/gen-ui-lite-2026-11-25/historical-screenshots.zip)（ZIP 内：evals/artifacts/layout-fold-regression-2026-11-16/after-folded-M.png） / [鼠标悬停](https://github.com/yeqiana/gen-ui/releases/download/gen-ui-lite-2026-11-25/historical-screenshots.zip)（ZIP 内：evals/artifacts/layout-fold-regression-2026-11-16/after-M-hover.png）
- [图后正文：修复前](artifacts/layout-fold-regression-2026-11-16/before-figure-prose.png) / [修复后](artifacts/layout-fold-regression-2026-11-16/after-figure-prose.png)
- [引用块与表后正文：修复前](artifacts/layout-fold-regression-2026-11-16/before-quote-table-prose.png) / [修复后](https://github.com/yeqiana/gen-ui/releases/download/gen-ui-lite-2026-11-25/historical-screenshots.zip)（ZIP 内：evals/artifacts/layout-fold-regression-2026-11-16/after-quote-table-prose.png）

截图中的长引用段为**专门构造的回归测试文本**，不是模型对 StoryOS 的业务论断。原生模型输出内容和本次 CSS 修复效果分别有来源记录，不应将它们混为“模型生成内容全部自动通过”。

复测：

```powershell
node tests/chrome-fold-reading-regression.mjs
node tests/chrome-typography-smoke.mjs
node tests/chrome-documents-smoke.mjs
node scripts/accept-html-delivery.mjs evals/artifacts/layout-fold-regression-2026-11-16/delivery-preview/report.html evals/artifacts/layout-fold-regression-2026-11-16/delivery-acceptance --require-image
```

后续通过安装的 GEN-UI Skill 新生成页面可使用修复后的公共 CSS；已经将旧 CSS 复制/内联到历史 HTML 的独立文件不会自动变化，需要重新导出或更新其样式资源。此次交付预览采用**历史模型原始正文 + 新版 CSS 资源**，不是重新调用模型生成。
