# GEN-UI P1 · 四组原生 Chrome 独立回归矩阵

日期：2026-11-18。隔离槽位在 Windows 本地运行原生 Chrome，不涉及模型调用、网络加载或修改冻结报告。

| 验证脚本 | 退出码 | 时长（毫秒） |
| --- | ---: | ---: |
| tests/chrome-unseen-panorama-smoke.mjs | 0 | 1137 |
| tests/chrome-fold-reading-regression.mjs | 0 | 11572 |
| tests/chrome-prose-alignment-regression.mjs | 0 | 11419 |
| tests/chrome-real-generated-typography.mjs | 0 | 2221 |

- 离线架构全景图检查横向滚动容器、引用展示与不同视口。
- 折叠阅读包含正确样本与故意破坏的正文宽度、品牌 M，验证负向门禁会拦截。
- 正文排版负向注入验证窄段落、窄列表及多余首行缩进被拒绝。
- 归档真实生成 HTML 进行 375/768/1024/1440 四视口的独立排版回归。

结论：**4/4 组脚本退出码 0**，并不代表失败的 DSA 候选已通过 Chrome；后者没有合法结构化结果，禁止生成“验收通过”的 HTML。浏览器测试仅覆盖现有合格样例与归档候选，不替代 P1 语义核验或远端 CI。原始长日志保存在本机仓库外。
