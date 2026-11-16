# GEN-UI 原生 Codex：真实工程文档 A/B 生成及证据核查

日期：2026-11-16。**结论：原生 Codex 桌面会话与 GEN-UI 安装均可正常使用；3 份真实仓库报告 × 2 个输出组共 6/6 份生成成功。两组均完整命中预设的 12/12 条词项诊断，但本轮没有独立盲审或真人阅读计时，不能据此推断 GEN-UI 比禁用 Skill 更准确或更快。**

## 运行环境与冻结条件

- 使用 Windows 桌面交互用户 `RENRP\yeqian`，不是 SYSTEM 会话。原生 `codex-cli 0.162.1`；登录探测返回 0。CLI 读取现有登录配置，未接入 Claude Code，未使用 OpenCodex 配置。检查用户 Codex 配置：默认 `model = gpt-6-sol`、`model_reasoning_effort = medium`，未配置自定义 `model_provider`/`model_providers`，并清空了 `OPENAI_BASE_URL`、`OPENAI_API_BASE` 环境覆盖。CLI 输出没有单独提供可核验的模型路由标识，故以上是**用户配置**而不是独立网络链路审计。
- Skill 文件 `SKILL.md` 与用户级安装文件 SHA-256 完全相同：`ca978309b388b62c68e0bd54e2e04f9ec1dd7d0c1ed2a57522c24b7e4e11ee48`，均 5,099 B。**本轮未修改 Skill 主文件或其参考规则**。
- 题面来源：`evals/real-reading-cases-2026-11-16.json` 已冻结的三份**仓库真实评测报告**（未使用虚构业务数据），运行前逐份校验源文件 SHA-256：`fresh-semantic-2026-11-16.md`、`reading-continuity-2026-11-16.md`、`independent-html-stability-2026-11-16.md`。注意，这三篇均讨论 GEN-UI 自身，属于**自指样本**，不等同于跨领域未知技术报告。
- 同一来源、同一正文和同一“600–800 汉字工程决策速读”任务；`baseline` 不写 Skill 名称，并通过 CLI `skills.config` 条目尝试禁止 GEN-UI；`explicit` 在提示前加 Codex 形式的 `$gen-ui`。两组均使用只读 sandbox、`approval_policy=never`、无网络检索、无工具写入、临时隔离工作目录，最大两槽并发。测试只在 `evals/artifacts/real-reading-pilot-2026-11-16/codex-native/` 本地留原始提示、JSONL 事件、输出、stderr 与状态文件，不公开提交。
- **归因限制：** CLI 的 JSONL 记录了模型回答与正常完成，但未暴露专门的 Skill 加载/生效确认事件；显式出现 `$gen-ui`、Skill 文件存在并不等于已证明该 Skill 改变了模型行为。禁止组的 CLI 配置覆盖已被接受，但同样没有单独的 Skill 禁用运行态证明。尤其输入报告正文也包含大量 GEN-UI 术语，不是严格的隔离因果实验。

## 生成实测与自动诊断

| 指标 | 普通组 baseline | 显式 `$gen-ui` |
| --- | ---: | ---: |
| 有效完成/计划 | **3/3** | **3/3** |
| 生成耗时中位数 | **22.57 秒** | **23.63 秒** |
| 回答去空白字符中位数 | **840** | **910** |
| 指定词项/事实诊断 | **12/12** | **12/12** |

这 12 项自动诊断仅检查各文档的关键数值与界限表达（每文档 4 项），例如“45/60 是当前覆盖率，15 份后来全过可至 60/60”、“R2 不能仅因缺日志断言未实现”、“末版 4/4 未全量重跑”、“三主题 3/3 为受控交付”、“Chrome 179/179、Typography 18/18”以及“HTML 不等于生产业务验收”。**不能将 12/12 当作独立语义正确率**。脚本 `evals/score-codex-reading.mjs` 可对本机原始事件重新计算。

## 人工定向核查（非独立盲审）

- 两组均明确承认 30 次运行与自动初筛不足以证明 GEN-UI 具有普遍语义优势；都把 **45/60=75%** 视为当前执行覆盖率，把剩余 15 份全部通过的情景写为 **60/60=100%**，没有重复此前的错误。
- 多轮评审材料中，两组均保留 R2“缺证据 ≠ 未实现”、N1 生产阻断条件、QR01 `12/12` 与 `11/12` 的冲突，以及“中间版本通过不等于末版完整复测通过”的界限。
- HTML 稳定性材料中，两组均保存 `3/3`、`179/179`、`18/18` 等核心数值，未将离线 HTML 验收等同于实际业务生产验收。显式组并未在三篇上持续表现出更短输出。
- 目前仅做了定向人工阅读和既有关键词诊断；没有双人独立盲审、跨读者计时、评分者一致性或统计显著性判断。生成耗时不是阅读耗时，更不是用户决策速度。

## 环境观察与下一步

- Codex 已可通过桌面交互会话运行，不需再恢复 Claude Code。旁路出现两个其他目录中的无效 Skill YAML frontmatter 警告（`douyin-ai-horror` 和隔离 `isolated-read-probe`），**没有阻止本轮 6 份回答完成**；未修改这些无关文件。
- 下一次为了真正检验 GEN-UI 的价值，应换用**不提及 GEN-UI 的真实工程材料**，并增加运行态可验证的 Skill 加载/禁用证据，然后在两组回答内容事实等价的前提下做独立盲审与真人阅读计时。若效果差异不成立，继续维持 Skill 核心轻量、冻结，不盲目增重。

## 复验命令

```powershell
node evals/score-codex-reading.mjs evals/artifacts/real-reading-pilot-2026-11-16/codex-native
node --test tests/score-codex-reading.test.mjs tests/prepare-reading-experiment.test.mjs tests/blind-reading-study.test.mjs tests/fresh-semantic.test.mjs
```

模型运行脚本、认证探测、原始 JSONL 和带本地用户路径的诊断日志仅保存在已忽略的本机 artifacts 中。测试工具本身是 Node 内置库实现，不引入 MCP 服务、框架或后台常驻进程。
