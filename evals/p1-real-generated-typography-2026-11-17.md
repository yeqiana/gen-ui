# GEN-UI P1 · 真实生成报告排版回归（阶段性证据）

日期：2026-11-17。范围：原样保留的历史 Agent HTML，非新模型生成实验。

## 已核验

- 来源：`evals/artifacts/storyos-real-html-acceptance-2026-11-14/report.html` 和 `evals/artifacts/codex-typography-blind-2026-11-13/storyos/report-v3.html`。两份源文件未修改，均属于 **StoryOS 同一业务领域**，不能当作两个独立技术领域。
- 实测：Chrome/Edge 375、768、1024、1440px；每份 8 个导航/视口组合，共 **16/16**。移动目录开/关、桌面侧栏展开/折叠、段落、标注的有序/无序列表、表格宽度及全页溢出均通过。
- 排版验收覆盖改进：生成式报告的 `ul.genui-prose` / `ol.genui-prose` 也必须加入 Chrome 真正的布局测量。每场景被测正文/列表块由 **20 增加至 24**；旧有列表压窄负向测试继续保留。
- 验证命令：`node tests/chrome-real-generated-typography.mjs`；新用例加入既有 Chrome CI。无新依赖，未扩写 `SKILL.md`。

## 证据边界

- 这里的「真实」仅代表文件由先前 Agent 生成并已存入仓库，不代表本轮重新调用模型。不同输出版本的页面结构与文字高度相近。
- `evals/artifacts/native-codex-storyos-2026-11-14/report.html` 保留旧版静态 `typography.css`，缺少现行 `--genui-article-width` 标记；现行验收器拒绝它，属于**旧包版本差异**，不通过修改现行规则来假绿。
- `HTML02/HTML03/HTML04` 是既有真实交互报告浏览器案例，形态不属于此处的技术文档 Typography 结构；仍由单独浏览器门禁检查。
- 此轮**未证明**跨 Agent Lead、PlanShip、Distributed Systems Audit 三个新领域的独立模型 Skill 激活、模型输出泛化或人工语义盲审。此前产品架构全景图的来源驱动演示也不能代替该证据。

## 下一阶段的独立门禁

取得确实调用模型且可证明 Skill 加载的跨领域候选后，直接复用 `node tests/chrome-typography-smoke.mjs --generated <report.html> ...`，再进行语义、图文关系及真人阅读抽检。在缺少实际候选时保持「未验证」，不合成虚假模型输出。
