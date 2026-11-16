# GEN-UI 跨项目真实工程文档 A/B 对照（Codex gpt-6-luna High）

日期：2026-11-16。**已完成 6 份原生模型生成、12 次同模型匿名自动复核；尚无真人盲审和阅读时间实测，不足以声称 Skill 显著优于普通 Codex。**

## 1. 运行条件与冻结来源

- Windows 桌面用户会话原生 Codex CLI 0.162.1。最小探测、6 次正式生成及 12 次复核均显式请求 `-m gpt-6-luna`、`model_reasoning_effort="high"`，全部正常退出。此证据能证明 CLI 接受参数并返回回答；**JSONL 未提供可独立核验的服务端实际模型路由**。
- 使用原生 Codex 登录；本机未配置自定义 model provider，运行环境移除 `OPENAI_BASE_URL`、`OPENAI_API_BASE`、`OPENAI_API_KEY` 覆盖，不调用 Claude Code 或 OpenCodex。这不是底层网络链路审计。
- 仓库 Skill 与本机安装的 `SKILL.md` SHA-256 相同：`ca978309b388b62c68e0bd54e2e04f9ec1dd7d0c1ed2a57522c24b7e4e11ee48`，均为 5,099 B。**本轮没有修改核心 Skill 或 references。**
- 普通组使用不提 Skill 的相同任务，并通过 CLI `skills.config` 条目尝试禁用 GEN-UI；显式组在任务前添加 `$gen-ui`。每份回答使用独立临时工作目录、非持久会话、只读 sandbox、禁用网页检索，最多两槽并发。
- 三份材料是其他工程仓库中的现存原文，不是实时项目状态审计；生成前按 SHA-256 验证字节一致：

| 领域 | 来源文档（相对仓库） | 源 SHA-256 |
| --- | --- | --- |
| StoryOS | `docs/Story_OS_Runtime_Projection_Drift_生产状态派生一致性治理方案_V1.0.md` | `4bdd8c554c3a82136227ce41666e36d9f3e46c2b17d48d5c5b1747601013f365` |
| qr-audit | `references/evidence-contract.md` | `80d6ad1e912e4ffda5d5154e26a5f01aea2ac5b25af731871f0d2c5e6bc22808` |
| mcp-dock | `docs/approval-core.md` | `2230425a5bd0756342d88f611adf02d8104fbb822712b25f0f5b957744adf3f6` |

## 2. 真实生成结果

| 文档 | 普通组（耗时/去空白字符） | 显式 GEN-UI（耗时/去空白字符） | 有效生成 |
| --- | ---: | ---: | --- |
| StoryOS | 18.26s / 681 | 17.48s / 617 | 2/2 |
| qr-audit | 15.73s / 587 | 19.08s / 577 | 2/2 |
| mcp-dock | 16.36s / 696 | 21.57s / 642 | 2/2 |
| **三篇中位数** | **16.36s / 681** | **19.08s / 617** | **6/6** |

**生成耗时不是人类阅读耗时，文本长度不是理解正确率。** 显式组本次三篇均更短，但生成时间中位数较长。样本仅三篇，不能推断普遍提升。

## 3. 匿名质量复核：两轮同模型，不是真人

将每份摘要匿名化后，交由两次独立临时会话的 `gpt-6-luna` High 自动复核。评审输入只包含原文和匿名摘要，不含组别；按结论、证据边界、重要遗漏、决策安全四维各 0–2 分，最高 8 分/次。12 次评审均产生有效结构化 JSON。

| 领域 | 普通组（两评合计/16） | 显式 GEN-UI（两评合计/16） |
| --- | ---: | ---: |
| StoryOS | 15 | 14 |
| qr-audit | 14 | 13 |
| mcp-dock | 14 | 14 |
| **合计** | **43/48** | **41/48** |

- 两组都保留了大部分核心状态/数据边界；没有把 StoryOS 历史治理目标称为当前全部修复，也没有把 mcp-dock 审批票据核销视为真实执行了删除。
- 评审指出的主要问题是**摘要丢失具体约束**，例如 StoryOS 权威事实来源、qr-audit 的贡献模式禁止 early stop 及重试/状态规则、mcp-dock 的精确人工确认文本。两组都有遗漏。
- qr-audit 显式摘要中，将“哈希算法或作用范围不匹配，不能直接比较”概括成“会使证据无效”。一名同模型评审标为过度扩大原契约，另一名未标成关键错误。**争议应交由真人复核，不自动将其定为已证实的严重缺陷。**
- 六份摘要中有两份的两次评分不一致（StoryOS 普通组、qr-audit 显式组）。评审与生成使用相同底座，存在共性偏好；总分不能替代独立人工评分和显著性检验。

## 4. 结论与下一轮门禁

1. **本轮没有证据证明 GEN-UI 在事实正确性或阅读效率上优于普通 Codex；不因此增加核心规则。**
2. CLI 接受 `skills.config` 禁用及 `$gen-ui` 显式语法，但 JSONL 未暴露可靠的运行态 Skill 加载/禁用事件。因此不能把两组差别全归因于 Skill。
3. 三篇为非随机抽样的真实工程材料，各只有一次 A/B，没有真人阅读试验，不能估计稳定性或统计显著性。
4. 下一轮优先真人裁决 qr-audit 争议；独立盲审六份匿名摘要；在内容等价时开展读者阅读计时与理解题，并独立补验 Skill 是否被真实加载/禁用。

## 5. 原始证据与保护

运行命令与 6 份摘要、12 份匿名评分、原生 JSONL、密封分组键都仅存本机 `evals/artifacts/cross-domain-luna-high-2026-11-16/`，该目录已加入 `.gitignore`。**不公开原始输入、模型日志、用户本机路径或敏感凭据。** 临时运行计划任务完成后删除，未部署新服务或框架。

相关旧回归：

```powershell
node --test tests/score-codex-reading.test.mjs tests/prepare-reading-experiment.test.mjs tests/blind-reading-study.test.mjs tests/fresh-semantic.test.mjs
```