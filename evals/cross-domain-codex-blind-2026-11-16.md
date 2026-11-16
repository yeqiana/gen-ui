# GEN-UI 跨领域真实技术文档：原生 Codex A/B 与双模型匿名评审

日期：2026-11-16。结论：**三领域六份原生 Codex 速读稿全部实际生成，双模型匿名评审两组均满分，尚无证据证明 GEN-UI 相比普通 Codex 存在语义正确率、阅读效率或决策质量优势。** 样本量极小且评分出现天花板效应；本轮没有真人盲审或计时。核心 `SKILL.md` 保持冻结。

## 1. 真实来源与可复核性

从三个不同的现有工程仓库冻结技术原文及其 SHA-256，每份配置 4 个证据核查问题，共 12 题；原文完整内容只在本机 artifacts 中保留，不随 GEN-UI 仓库提交。文档事实和运行事实必须分开。

| 领域 | 文件 | 来源版本 | 源文件 SHA-256 前缀 | 关键边界 |
| --- | --- | --- | --- | --- |
| StoryOS | `docs/architecture/Story_OS_V3_Phase2_Workflow中心化设计_V1.0.md` | Git 提交 `47cd0abe` 一致 | `312f91af84b7` | 工作流迁移是计划；禁止 Engine 直接调用生产 Worker |
| qr-audit | `docs/metrics.md` | Git 提交 `b9d83fb7` 一致 | `0a46914171c6` | 文件损失不等于配对损失；`NA_INCOMPLETE` 不可写零 |
| mcp-dock | `docs/architecture.md` | **本地尚未提交的工作区快照**，以 SHA-256 为准（基线 HEAD `0091443f` 不包含此版本全文） | `a2387a3bea45` | 审批票据核销不等于文件删除；本阶段无删除执行器 |

公共题库与完整指纹：`evals/cross-domain-cases-2026-11-16.json`。模型运行时使用的题库元数据字节指纹为 `fe1b607d070f02c34419104599d8deed4bb6c9c2bc3922c21dec7212606d913e`；运行后只补充来源版本标志、改名 `originBaseCommit`，**源文本及12道题未变**。原始元数据本机保留在 `cases-at-run.json`。

## 2. 原生 Codex 环境与控制变量

- Windows 交互用户会话启动原生 `codex-cli 0.162.1`（已登录）；不走 Claude Code 或 OpenCodex 代理。模型配置为 `gpt-6-sol`、`model_reasoning_effort=medium`；运行事件未给独立可核验的后端路由标识，不能将此当作供应商链路审计。
- 两组同一冻结原文、同一任务说明、同一运行入口和权限设置：临时隔离目录、read-only 沙箱、无 Web 搜索、无输出文件写入权限；每次为全新临时会话，最多两槽同时进行。普通组不点名 Skill，并尝试通过 `skills.config` 禁用 GEN-UI；显式组仅在提示开头添加 Codex 风格 `$gen-ui`。
- 本地 `SKILL.md` 与用户安装副本字节完全一致，均 **5,099 B**，SHA-256 为 `ca978309b388b62c68e0bd54e2e04f9ec1dd7d0c1ed2a57522c24b7e4e11ee48`。本轮无 Skill 规则改动。
- **重要归因限制：** CLI 的 JSONL 可证明会话执行和输出存在，但没有独立的“Skill 已加载/已禁用”可观测证据。启动参数与 `$gen-ui` 文本不等于 Skill 实际生效的运行时证明。故这只是两种可重放调用条件的对照，不能据此声称严格因果效应。

## 3. 实际生成（3 篇 × 2 组）

| 指标 | 普通 Codex | 显式 `$gen-ui` |
| --- | ---: | ---: |
| 成功生成完整回答 | **3/3** | **3/3** |
| 生成耗时中位数 | **19.76 秒** | **22.23 秒** |
| 回答去空白字符中位数 | **901** | **905** |

生成耗时是模型处理时间，不是人类阅读时间。一次三题对照不能用于统计显著性分析。原定约 600–800 字只是提示目标，双方的回答都存在篇幅偏长现象；不能据此得出 GEN-UI 更简洁。

## 4. 匿名模型评审

- 使用已有 `evals/blind-reading-study.mjs` 将六份回答按案例随机匿名编号；原始组别只保存在本机密封映射。匿名正文经检查未直接出现 `$gen-ui`/`GEN-UI` 自曝分组字符串。
- 两个互相隔离的 Codex 评审会话按每份来源独立核对匿名稿，合计 **6 次模型评审调用、12 条评分记录**。评审仅见原文、四个核查问题和两份匿名稿，先评分、后解封。
- 每份按 `conclusion`、`evidenceBoundary`、`omissionDetection`、`decisionSafety` 四维分别给 0–2 分。**普通组 48/48、显式组 48/48；评审间无分歧，模型均未报告关键错误。**
- **不能将满分视为独立语义正确率**：评审与答题均采用原生 Codex，同源模型有自评偏差；六份全部满分形成明显天花板效应，指标没有区分能力。基于此结果不应优化或发布更复杂的 Skill 规则。

## 5. 局限、验收与后续门禁

本轮 **真人独立盲评为 0、真人阅读计时为 0、有效阅读理解实验为 0**。仅准备了 6 名读者 × 3 题 = 18 个预留阅读任务槽位；不能把计划槽位写成真实读者。本轮来源虽跨三领域，但均为设计/工程规范文档，样本范围仍窄。

单元测试检查来源引用、匿名映射、评分字段范围、双评审覆盖、重复评分与改动后来源一致性；实际相关回归 **24/24 通过**。原始提示、Codex JSONL、模型回答、独立评审答复、密封映射只存在于忽略提交的 `evals/artifacts/cross-domain-codex-2026-11-16/`。首次桌面启动脚本被 PowerShell 错误拆行，未执行 Codex；修复后实际完成全部六次生成；未把启动故障计入模型失败。

下一阶段不继续盲目扩大提示词或程序框架：要么安排真实读者做基于同源 A/B 文章的正确率及阅读时间测量，要么换成具有冲突证据、未决根因、跨轮状态变化的真实故障报告，先建立有区分度且可人工裁决的评审标准。只有能证明真实增益，才考虑修改 `SKILL.md`。

### 可重复本地验收

```powershell
node evals/score-cross-domain-blind.mjs evals/artifacts/cross-domain-codex-2026-11-16
node --test tests/score-cross-domain-blind.test.mjs tests/score-codex-reading.test.mjs tests/prepare-reading-experiment.test.mjs tests/blind-reading-study.test.mjs tests/fresh-semantic.test.mjs
```

上述脚本不能独立补造模型回答或人类阅读耗时。缺少本机 artifacts 时只能复核公共规则和题库结构，不能复现本次模型评分。
