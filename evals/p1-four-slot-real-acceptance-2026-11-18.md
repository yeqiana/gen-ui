# GEN-UI P1 · 四槽位第二轮真实模型与反事实联合验收

日期：2026-11-18。**状态：工程联合验收通过；DSA 单次真实模型候选来源结构及 Chrome 通过；P1 独立人工语义签审未完成，仍不放行。**

## 1. 四个隔离工作槽位

| 槽位 | 最新成果 | 当前证据边界 |
| --- | --- | --- |
| DSA | 原始冻结 Git 的 167 个 ID 中选择 42 条前向试验；一次真实 Claude CLI `claude-sonnet-5` 调用成功，实际启动 `Skill(gen-ui)`，得到 **4 层 / 12 模块 / 0 关系 / 22 引用**；引用 22/22 合法，**4/4 来源边界**，Chrome 3/3 | 结构门禁是 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`；GPT-6 对 12 项模板性陈述的 AI 原文核对 12/12 supported，工具仍为 `ATTESTED_NOT_INDEPENDENTLY_VERIFIED`，不是独立人工验收 |
| Agent Lead | 对旧真实模型候选独立另存作者审订版，只把两个测试建议标题改成“建议：……”；来源检查通过，时间语义风险 2 → 0，Chrome 3/3 | **不是重新调用模型**，原候选完全保留，29 条独立人工语义核查未完成 |
| PlanShip | 针对已有模型候选进行六类反事实变异；发现通用来源评分仍会放行错端点、遗漏失败出口，新增可选的**冻结 Mermaid 关系身份校验**，原 13/13 边通过，4 组单元负向测试通过 | 金标映射由现有冻结原文及 AI 辅助复核产生，不是人工独立签审，不升级原评分器的语义承诺 |
| 浏览器与公开证据 | 8/8 组 Windows Chrome 脚本通过，含 280 个固定种子的语义图压力样例；当时扫描的 13 份既有 P1 文档常见敏感模式零命中 | 模式扫描不等于完整秘密审计；浏览器测试不证明模型语义正确 |

详细证据分别见：

- `evals/p1-dsa-compact-real-2026-11-18.md`、`evals/p1-dsa-compact-line-selection-2026-11-18.json`
- `evals/p1-agent-lead-editorial-candidate-2026-11-18.md`
- `evals/p1-plan-ship-adversarial-edge-gate-2026-11-18.md`、`evals/p1-plan-ship-golden-edges-2026-11-18.json`
- `evals/p1-four-slot-browser-security-2026-11-18.md`

所有原始 Claude 事件 JSONL、未编辑模型原始候选、审查原件和生成 HTML 都只留在本机公开仓库外；仓库内只提交来源 SHA、行号、聚合验证结果和非敏感可重跑代码。

## 2. 集成后同一份代码联合验证

| 验收 | 实测 |
| --- | --- |
| `node --test` | **228 / 228 PASS** |
| `scripts/test-skill.ps1` 官方入口 | **190 / 190 PASS**（包含新增 Mermaid 端点负例和时间语义风险测试） |
| 通用离线全景 Chrome | **3 / 3 PASS**（375、768、1440px） |
| DSA 新真实模型 HTML + Agent Lead 审订 HTML 同次 Chrome | **6 / 6 PASS**（两个候选各 375、768、1440px） |
| 扩展原生 Chrome 组 | **8 / 8 PASS**（在隔离槽位运行，包含折叠宽度、M 标记、换行、图片/文档、Portal 和随机语义图） |
| Windows 本地运行模式 | 未走 OpenCodex；未消耗 Codex 额度 |

DSA 本轮的**唯一付费模型调用**，CLI 报告用量为 **US$0.1404536**，不是核对后的账单金额，也不应将 `--max-budget-usd` 视为绝对费用限制。本轮没有为 Agent Lead、PlanShip 或浏览器槽位追加付费模型调用。

## 3. 剩余门禁与建议

1. DSA：需由真正独立的审核者确认 12 项模板性语义及对源文档的遗漏是否可接受；目前仅从 167 个冻结 ID 中精选 42 条用于一次成功试验，不能宣称完整来源覆盖度或稳定成功率。
2. Agent Lead：基于审订候选，需核对 29 项源文档语义；标签歧义消除不等于实际测试已经执行。
3. PlanShip：冻结 13 条 Mermaid 边已通过新的端点/条件门禁；金标关系映射及工作流业务含义仍需要独立人工复核。
4. 在以上语义门禁落实且远端 CI 对**最终提交**重新运行前，不合并 `main`、不移动冻结 Tag、不创建声称 P1 完成的 Release。

**最终判定：工程层 P1 进展实质有效，P1 总体未正式放行。**
