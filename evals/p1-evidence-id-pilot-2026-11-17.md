# GEN-UI P1 · 冻结证据 ID 映射小规模验证

日期：2026-11-17。状态：**可选离线机制已实现、负向门禁通过；真实模型 0/2 通过，暂不视为泛化能力交付。**

## 设计与证据边界

- 只在 `evals/` 评测使用；不修改 `SKILL.md`、不增加依赖/后台服务。冻结原文依旧来自 `unseen-panorama-2026-11-17.json` 指定的 Git 提交；`frozenInputs` 重验 SHA-256、字节长度和必需边界。
- `evidence-id-map.mjs` 为每条不少于 8 字符的冻结来源行分配稳定的 ID。ID 绑定项目、Git 提交、文件 SHA、行号和原文；引用形态为 `{id:"E..."}`。原文行可以包含 Markdown 标点，但最终 quote 由校验端从可信 Git blob 原样还原。
- 模型不得自己提供 `file` 或 `quote`。不存在的 ID、跨项目 ID、混入手写引文、源指纹不符、缺少必需边界、伪造上线状态均拒绝。写在临时目录中的 catalog 只供模型选择，**不会被当作校验权威**。
- 沿用原始 `scoreUnseen` 的语义免责声明：**ID 真实不等于该行能证明所绘制的模块、关系或行为**。结构通过只叫 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`，仍需独立语义审查。此机制不自动补来源边界、修正模型 ID 或强制生成关系。
- 原 `baseline` 与 `explicit` 配对提示及实验计划原封不动；新模式为显式的 `prepare-ids`/`evidence-ids`，与旧六组模型输出严格分开。

## 三项目与历史失败样本诊断

| 项目 | 冻结证据行数 |
| --- | ---: |
| Agent Lead | 59 |
| PlanShip | 72 |
| Distributed Systems Audit | 167 |
| 合计 | **298** |

对先前六份模型输出的 302 处原始 `file+quote` 做**只读离线转换诊断**：284 处唯一对应原文行、18 处无法精确匹配。此为可映射性指标，**不是六次证据 ID 模型生成，也不意味着这 284 处语义正确**。旧模型中不能匹配的引用不进行自动纠错。

## PlanShip 两次新的真实模型试验

两次均通过 Windows 本地 Claude Code CLI 取得 `claude-sonnet-5` 模型输出，完整原始事件出现 `Skill(gen-ui)` 和 `Launching skill: gen-ui`，返回严格 JSON。日志、候选及评分仅在仓库外临时目录存放；未使用 Codex 额度。

| 项目 | 第一轮 ID 提示 | 第二轮补全关系字段说明 |
| --- | --- | --- |
| 模型引用次数 | 52 | 58 |
| 与冻结原文匹配 | 52/52 | 57/58 |
| 必需边界覆盖 | 4/4 | 4/4（仅诊断统计） |
| 模块/关系 | 27/12 | 43/12 |
| 阻断点 | 12 条关系缺少必填的 `type` | 第 8 条关系中引用了 1 个不存在的 ID |
| 正式结果 | **BLOCKED** | **BLOCKED** |
| CLI 报告用量 | 约 US$0.168 | 约 US$0.170 |

第二轮关系端点和 type 均有效；**仍因非法 ID 在还原阶段就拒绝**，不继续当作来源评分通过，也没有为该模型产物生成合格 HTML。两次 CLI 报告用量合计约 US$0.338，仅为估算，不代表实际账单。首次尝试的复杂 JSON Schema 参数错误在 CLI 启动前被拒绝，无有效模型响应。

## 测试、用法与下一步

仓库内单元/契约测试包括：确定性 ID、旧提示不变、禁止重复准备、不可伪造 ID、跨项目引用、混入手写 quote、源 SHA 变化、必需边界与部署声明阻断、旧的渲染契约保持及 HTML 转义。合格 HTML 只在人工构造的离线测试夹具中生成；**无真实模型候选通过正式渲染门禁**。

```powershell
$manifest = "evals/unseen-panorama-2026-11-17.json"
$projects = "<三个已冻结项目的仓库父目录>"
$out = "<GEN-UI 仓库外的本地评测目录>"
node evals/unseen-panorama-workflow.mjs prepare $manifest $projects $out
node evals/unseen-panorama-workflow.mjs prepare-ids $manifest $projects $out
node evals/unseen-panorama-workflow.mjs status $manifest $projects $out
# 必须另有真实模型输出，保存为 <out>/<case-id>/evidence-ids.candidate.json
node evals/unseen-panorama-workflow.mjs check $manifest $projects $out evidence-ids
node evals/unseen-panorama-workflow.mjs render $manifest $projects $out evidence-ids
```

`prepare-ids` 只可在成功 `prepare` 后调用一次，拒绝覆盖已经产生的提示。`status` 中 `evidenceIdTrials` 只反映文件是否存在；不自动声称模型调用或 Skill 激活。

**下一步建议**：停止针对单个样本反复重试。先比较不同项目和种子的 ID 选择准确率，并审计有效 ID 与模块/关系语义的真实匹配程度；必要时在 CLI 结构化输出合约中限制引用 ID 的候选集合，而不是降低校验标准或把 ID 还原当作质量保证。
