# GEN-UI P1 · 四槽位语义收敛和联合验收

日期：2026-11-18。状态：**工程回归全绿，P1 整体仍 BLOCKED：DSA 真实候选覆盖缺口和独立人工语义验收未完成。**

## DSA：真实候选与人工样例必须分开

- 冻结原文 `0a224f8` 的 `references/audit-sop.md` 共 17 个编号章；之前唯一成功的真实 Claude Skill 候选为 4 层、12 模块，**只有 11/17 章被直接引用**。
- 零直接引用章节：**1、9、10、12、14、17**；第 16 章虽有引用，但“扫描停止判据”的语义未充分展开。来源 ID 合法和 4 条必要锚点完整并不等于完整覆盖。
- 新增只读可选工具 `evals/frozen-section-coverage.mjs` 与 `tests/frozen-section-coverage.test.mjs`，按冻结 Git 行号计数并明确声明不能证明语义正确。测试包括无引用章节与外来 ID 阻断。
- 另一个**审查者人工编排、不是 Claude 新模型输出**的 4 层、16 模块样例实现了 17/17 章节直引、4/4 来源锚点和 3/3 Chrome。完整生成 JSON/HTML 留本地仓库外，仅公开可复现行号计划 `evals/p1-dsa-17-section-editorial-plan-2026-11-18.json`。
- 详见 `evals/p1-dsa-17-section-gap-2026-11-18.md`；结果只能证明结构容量足够，不构成模型成功率或人工独立语义审核。

## Agent Lead：29 项语义核对

- 对第一版作者审订候选复查 **29 项 = 27 supported / 2 unclear**，差异明确记录在 `evals/p1-agent-lead-29-item-source-review-2026-11-18.md`。
- 仅进一步修正两个标题：“项目级 Skill 安装”→“项目级 Skill 目录放置与发现说明”，“auto 模式任务调用”→“auto 模式提示词示例”。第二版**不是新模型生成**，不修改源行、模块 ID 或关系。
- v2 的 GPT-6 AI 来源核对 **29/29 supported**，状态仍为 `ATTESTED_NOT_INDEPENDENTLY_VERIFIED`，Chrome 375/768/1440px **3/3**。旧版歧义不被抹除，独立真人签审未完成。

## PlanShip：13 条文档工作流关系

- 对冻结 `docs/architecture.md` 的全部 **13/13** 条 Mermaid 箭头逐一复核原文语义，明确 `V -- No --> X` 表示记录 FAIL/BLOCKED 并停止，不暗示重试或通过；`V -- Yes --> M` 是人工验收指南，并非已完成真人验收。
- 加强可选 `evals/mermaid-edge-audit.mjs`：一条固定的图关系只可引用自身冻结来源行，无法夹带不相关 ID；不允许给普通箭头设置空条件。专项回归 **5/5**。
- 详见 `evals/p1-plan-ship-13-edge-semantic-review-2026-11-18.md`；本检查验证来源一致性和 AI 二次阅读，不是业务生产执行证明。

## 四槽位集成后的回归

| 项目 | 验证 |
| --- | --- |
| `node --test` | **231/231 PASS** |
| 官方 `scripts/test-skill.ps1` | **193/193 PASS**，新增 DSA 章节检查已进入官方自检 |
| DSA 原模型、DSA 人工样例、Agent Lead 作者审订 v2 的离线 HTML | **9/9** 原生 Chrome 场景 PASS（各 375、768、1440px，0 问题） |
| 隔离浏览器专项 | **6/6**：折叠宽度与 M、正文换行负例、文档、Portal 和布局压力 |
| 核心 Skill | `SKILL.md` 与轮次基线完全一致，没有新增 MCP/服务或扩张 Skill 本体 |
| 付费模型 | **本轮 0 次**：未使用 Codex 额度、未走 OpenCodex 代理 |

## 后续阻断与发布界限

1. DSA 需要**另一次**前向受控的真实模型输出，包含六个缺失章节并判断第 16 章扫描停止含义；不能把人工构造的 17/17 结果冒充新模型结果。
2. Agent Lead 的 29 项和 PlanShip 的 13 条箭头需要与候选生成/编辑过程独立的真实人工语义签审；AI 复核不能代替。
3. 在独立语义核查和最终远端 CI 前，不合并 `main`、不移动既有冻结 Tag、也不发布声称 P1 完成的 Release。

完整模型事件、候选文件、审阅包和 HTML 预览均只保留在本机公共仓库外。**本轮尚未推送 GitHub。**
