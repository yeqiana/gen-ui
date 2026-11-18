# GEN-UI P1 · 证据 ID 语义审查门禁（阶段性）

日期：2026-11-17。状态：**离线审查机制与回归测试完成；两份真实模型产物的语义独立审查未完成，均保留阻断状态。**

> 2026-11-18 追加了重点条目初核、标题误报修复与 Yes/No 条件分支保真规则。参见 [P1 条件分支语义复核](p1-conditional-semantics-2026-11-18.md)。本文件保留上一轮原始结果，不回写历史计数。

## 范围与结果

本轮复用上一轮 PlanShip 两份真实 Claude + GEN-UI Skill 生成的候选以及已冻结的 Git 资料；**没有新增模型调用或 Codex 用量**，也未改写任何原始候选。证据 ID 能落到冻结原文行，不能直接证明模块和关系语义。

| 项目 | 第一份候选 | 第二份候选 |
| --- | ---: | ---: |
| 模块与关系待审核条数 | 39 | 55 |
| 引用文档标题的模块（提醒复核） | 1 | 1 |
| Yes/No 条件分支被写成 depends（提醒复核） | 0 | 5 |
| 原结构来源门禁 | BLOCKED：12 条关系缺 type | BLOCKED：1 个非法 ID |
| 有审查人逐项签署的合格结果 | 0 | 0 |

真实例子：冻结的 PlanShip 流程图中，`G -- Yes --> D[Publish technical + reader MD]` 表达 **Yes 条件分支**；模型却表达为 `Plan-only 请求判定 --depends--> 仅方案请求：发布技术 MD 与读者 MD`。这未必意味着模型关系完全错误，但**把条件分支视为不带条件的 depends 可能丢失语义**，必须核查。部分模块引用了 `# PlanShip workflow architecture` 标题；标题仅提供上下文，不能单独证明具体能力（个别模块还引用了其他更具体的原文，须一起审核）。

## 机制

- `evals/semantic-review.mjs` 的 `prepare` 从候选读取模块、关系和 ID，再从冻结 Git 提交（验证 SHA-256）重新解析为源文件、行号及连续原文；生成**不可直接替代人工判断**的逐条审查包 `semantic-packet.json` 和空白决策清单 `semantic-review.json`。
- 每项由审查人按 `supported` / `unsupported` / `unclear` / `pending` 选择，并给出解释。引用标题、条件分支混同依赖，仅作为**风险提示**，不会自动批准或判错。
- `check` 重新从原始候选和冻结 Git 创建审查包；验证候选哈希、来源指纹、审查包摘要及决策项一一对应。非法 ID、结构失败、审查缺项、来源变化、候选被替换、审查包被篡改都无法取得肯定结论。
- 即使所有人手动标记 `supported`，状态也只能是 `ATTESTED_NOT_INDEPENDENTLY_VERIFIED`：审查人标签是**自我声明，程序没有认证真实身份或审查独立性**；不会将 `scoreUnseen` 的 `humanSemanticReviews=0` 改成 1，不会自动升级真实模型生成的验收等级，也不影响原有静态示例渲染路径。
- 原模型事件、候选、审查清单继续**只存仓库外本地临时目录**；公开仓库仅提交脱敏的聚合观察结果、代码和测试。核心 `SKILL.md` 不动，不新增依赖、服务或后台组件。

## 复核命令

```powershell
$manifest = "evals/unseen-panorama-2026-11-17.json"
$repos = "<冻结项目仓库的父目录>"
$candidate = "<仓库外>/plan-ship/evidence-ids.candidate.json"
$reviewDir = "<仓库外>/semantic-review/plan-ship"
node evals/semantic-review.mjs prepare $manifest $repos plan-ship $candidate $reviewDir
# 手动逐项检查 semantic-packet.json 的 claim 与 evidence 后，填写 semantic-review.json
node evals/semantic-review.mjs check $manifest $repos plan-ship $candidate $reviewDir
```

本轮不声称“39/55 条语义都已验证”，也不把准备完成或工具运行成功等同于独立语义通过。下一步若需要正式质量放行，应让独立评审人确认关系方向、类型与引用覆盖，记录具体异议，再用另一个候选或重新生成的候选**独立重走整个来源和语义门禁**，而不是修补原始模型响应制造假绿。
