# GEN-UI 产品架构全景图：陌生真实项目泛化准备（2026-11-17）

**状态：来源冻结与证据门禁已完成；独立模型生成 0、人工语义盲审 0。尚不能声称 GEN-UI 的自主泛化能力已验证。**

## 三个此前未参与模板制作的项目

| 案例 | 来源范围 | 验证的难点 |
| --- | --- | --- |
| Agent Lead | `README.md`、`references/model-routing.md` | 单 Agent 优先、可用模型动态选择；不能虚构已实现的跨 Provider 自动路由、MCP 或子 Agent |
| PlanShip | `docs/architecture.md`、`docs/quality-gates.md` | Skill 工程流程与交付门禁；不能凭架构图虚构常驻数据库、API 服务或把静态校验写成业务测试通过 |
| Distributed Systems Audit | `references/audit-sop.md` | 审计 SOP 是**可选检查模板**，实际项目可能没有 MQ、Outbox、Redis；不能将每个模板组件冒充现有服务 |

完整来源以 `evals/unseen-panorama-2026-11-17.json` 冻结：逐文件 Git commit、Git blob SHA-256、来源短句与禁止误判清单。Windows 工作树与 Git blob 的换行编码可能不同，指纹必须以 **Git committed blob** 为准；只读取已提交且工作树未修改的来源，不上传原始仓库和私人日志。

## 真实生成任务（待执行）

给各自来源交由 GEN-UI 独立生成产品架构全景图，并单独输出结构化证据记录 `genui-panorama-candidate/v1`。每层、每模块、每条连接关系需要文件和精确原文片段。**不得默认必须六层**，只有来源确实存在的层次才展示；来源仅说明流程/Skill 时不得填入默认技术栈或生产部署组件。交付图应沿用现有 SVG 系列视觉语言，并分清“文档设计”“已实现”“实际验收”的证据等级。

本轮未调用任何收费模型。执行环境没有可直接使用的 Ollama/llama-cli 本地模型；所以只能完成冻结、反例门禁和静态验证，不将手工题库或静态 JSON 检查假冒为真正的模型输出。

## 证据一致性校验

- `evals/score-unseen-panorama.mjs`：只通过本地 Git `show <commit>:<file>` 验来源内容与 SHA-256；所有模块和连接必须绑定来源片段；来源被篡改、凭空添加模块/连线、伪造已上线状态或漏掉必需的边界都会阻断。
- 允许 2–8 个来源合理分层，不固定为六层；防止为了符合既有示例而虚构“数据中台、MQ、数据库”。
- 校验返回 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` **也只是可复查的证据引用完整性**。它不能判断一句原文是否真正支持模型归纳，更不能证明用户理解、模型调用来源或部署真实性；需要人工复核。
- `tests/unseen-panorama.test.mjs` 覆盖正常与伪证据、篡改指纹、无依据连线、无真实输出等负向测试。

复验示例：

```powershell
node --test tests/unseen-panorama.test.mjs
node evals/score-unseen-panorama.mjs evals/unseen-panorama-2026-11-17.json <本地真实模型生成的candidate.json> <本地工程仓库父目录>
```

**下一阶段门禁：** 先有真实、可核对的模型输出和加载证据，再做双盲语义审查、浏览器视图/模块对照与读者计时。在这些证据出现前，不修改核心 `SKILL.md`，不宣布 P0 完成。
