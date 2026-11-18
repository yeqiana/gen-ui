# GEN-UI P1 · 四槽位扩展 Chrome 与公开证据审计

日期：2026-11-18。状态：**八组真实 Windows Chrome 检查通过，P1 语义验收仍未独立完成。**

| 原生 Chrome 专项 | 结果 | 时长（ms） |
| --- | --- | ---: |
| `tests/chrome-report-smoke.mjs` | PASS | 6068 |
| `tests/chrome-documents-smoke.mjs` | PASS | 12937 |
| `tests/chrome-heading-wrap-regression.mjs` | PASS | 14146 |
| `tests/chrome-fold-reading-regression.mjs` | PASS | 11271 |
| `tests/chrome-typography-smoke.mjs` | PASS | 7300 |
| `tests/chrome-layout-edge-cases.mjs` | PASS | 15457 |
| `tests/chrome-semantic-stress.mjs` | PASS | 26888 |
| `tests/chrome-portal-smoke.mjs` | PASS | 1621 |

扩展覆盖：报告交互与图片遮罩、技术文档中英文布局、标题换行负例、导航折叠前后 M 标识与正文宽度、排版与字距、布局极端情形、随机语义图 280 项种子压力检查、Portal 导航。负向测试包括段落提前换行、缩进失真和折叠品牌图标隐藏，检查能识别故意注入的破坏。

## 公开证据安全检查

- 本轮检查了已有 13 份 `evals/p1-*-2026-11-18.md` 文档的常见 Token/密码令牌模式与 Windows 用户路径，命中：**0**。
- 本项为保守的固定模式初筛，不等于全仓库秘密扫描、也不能证明所有个人信息都不存在；本轮保留原始模型事件及本地试验数据在仓库外。

## 本轮结论

- **8/8 Chrome 脚本通过**；`chrome-semantic-stress` 的 280 个固定种子样例通过。
- 测试针对现有合格 HTML/归档页面，不能代替 DSA 新模型生成候选的专项审查，后者必须基于它自己的输出单独跑 Chrome。
- 不移动 GEN-UI Tag，不修改核心 Skill，不声称完成独立人工语义验收。
