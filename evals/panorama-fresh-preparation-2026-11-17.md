# GEN-UI · 新领域产品架构图泛化：冻结样本与状态

日期：2026-11-17。**状态：准备完成，实际模型生成未执行；不宣称通过泛化验收。**

## 来源

选用三个此前未用来编写产品架构全景图的开源项目。只从 Git 提交读取冻结的原文，不读取邻近工作区的未提交改动。

| 项目 | 来源 | Git 提交 | SHA-256（前 12 位） |
| --- | --- | --- | --- |
| Agent Lead | `README.md` | `9857d08e7c72` | `eb221035d152` |
| PlanShip | `docs/architecture.md` | `a7a974c2fa6f` | `0c6d9470719f` |
| Distributed Systems Audit | `README.md` | `0a224f8f517f` | `bd7686e0db11` |

完整哈希、三份来源的可查证片段、禁止臆造的模块/依赖/实现状态和评审要点见 `evals/panorama-fresh-cases-2026-11-17.json`。

## 评测条件与门禁

- 每份来源准备两份配对提示：普通生成组与显式 `$gen-ui` 组；要求按原文组织能力层、真实入口与支撑体系、证据边界，不强制套用先前六层模板。
- 评审时首先核对是否凭空写出了数据库、API 服务、队列、模型跨厂商自动路由，是否把 Skill 设计语义说成实际部署或已执行；再检查层级组织、关系语义、正文与 SVG 系列视觉一致性。
- 只有真实输出的独立语义复核、来源对应证据和 Chrome 视觉检查都完成，才记为有效生成/语义通过；**不把本地 Node 测试和文件存在等同于模型能力**。
- 目前 Windows 本地无可用 Ollama、LM Studio、llama-server，已探测的本地服务端口 11434、1234、8000 均未连接。根据不消耗 Codex 额度、禁止 OpenCodex 代理的约束，本轮没有额外模型调用、人工阅读计时或外部服务测试。

## 本轮实际结果

| 项目 | 结果 |
| --- | --- |
| 冻结真实来源 | 3 / 3 |
| 双组提示 | 6 / 6，存于本机临时目录 |
| 实际模型调用 | **0** |
| 独立语义盲审 | **0** |
| 真人阅读效率测试 | **0** |
| 是否证明 GEN-UI 泛化优于普通组 | **未证明** |

## 复验

```powershell
node evals/prepare-panorama-fresh.mjs prepare evals/panorama-fresh-cases-2026-11-17.json D:/workspace/YeQianWorkSpace/yeqian
node evals/prepare-panorama-fresh.mjs status evals/panorama-fresh-cases-2026-11-17.json D:/workspace/YeQianWorkSpace/yeqian
node --test tests/panorama-fresh.test.mjs
```

准备命令默认拒绝覆盖有内容的输出目录，重复准备要使用新的临时目标路径。要真正证明泛化能力，下一轮需在可用的**用户认可的本地模型/Runner**中执行这 6 个提示，收集匿名稿，并依据同一冻结原文独立裁决，不能从静态模板自动推断。
