# GEN-UI P1 · 普通流程箭头保真与真实模型复测

日期：2026-11-18。状态：**新增来源门禁及一次真实模型生成均通过；独立语义验收尚未通过。**

## 结论及历史证据边界

对冻结 PlanShip `docs/architecture.md` 的 7 条普通 Mermaid `-->` 箭头，以前模型写成 `depends`。仅有执行顺序或图中箭头不能直接证明模块之间有依赖关系。本轮只在 `evals/` 的离线结构校验器增加窄范围门禁：**原文有明确普通 Mermaid 流程箭头时，关系类型须为 `flow`，而不是 `depends`**。带 `Yes/No` 条件的箭头仍必须是 `controls` 且保留原样条件标签，普通文字中明确表达依赖关系仍可用 `depends`。不改变 `SKILL.md`、任何历史模型候选、原有必需来源边界或评分器的语义免责声明。

2026-11-18 前一份真实模型候选原本按当时的来源规则得到 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`；在**新版前向门禁**下，7 条 `depends` 都被准确拦截，状态为 `BLOCKED`。不把新版结果冒充历史模型测试结果，也不替换原始候选。

## 一次受限真实模型试验

冻结来源：`unseen-panorama-2026-11-17.json` 中 PlanShip 的 Git 提交 `a7a974c2fa6f2b49f0ca7f3fb3e28b3ae39c2520`，两个冻结文件校验不变。模型与真实 Skill 事件、CLI 原始 `result` 对象逐一核对；模型输出未经自动修补、没有重试筛选。

| 项目 | 结果 |
| --- | --- |
| 模型 | Claude CLI `claude-sonnet-5`，一次调用 |
| Skill 激活 | 原始事件出现 `Skill(gen-ui)`，随后成功返回 `Launching skill: gen-ui` |
| 费用 | CLI 报告 US$0.1255824，非实际账单；未使用 Codex 额度 |
| 输出 | 严格 JSON；21 模块、12 关系 |
| 关系分类 | **7 条 `flow`、5 条带原样 Yes/No 的 `controls`** |
| 冻结来源 | 4/4 必需边界，0 条结构错误，`STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` |
| 浏览器 | 生成 HTML 在 Chrome 375/768/1440px **3/3 通过**，0 报错 |
| 独立人工语义验收 | **未完成，不放行** |

源码 `scoreUnseen` 合成回归覆盖普通箭头使用 `depends/controls/data/composes` 均被阻断，以及真实文本证据支持的 `depends` 不被误杀。合格 HTML 与原始 JSONL、审查包、引用原文只放在本地仓库外临时目录，公开仓库不上传真实模型日志和本机路径。

## 33 项 AI 辅助语义初核与尚存的来源歧义

新候选共 21 个模块、12 条关系。依据冻结 Git 原文逐项进行 AI 辅助初核：**28 supported、5 unclear、0 pending**。该记录不是经认证的独立人工评审，程序按 `BLOCKED_SEMANTIC_DISAGREEMENT` 处理，不会把 `humanSemanticReviews` 设置为 1。支持结论只指文档与关系表达相符，**不意味着任何计划、测试或验收已经在生产真实执行**。

5 个 `unclear` 是 `module:1`、`module:10`、`relation:0`、`relation:9`、`relation:10`，根因在冻结源文档自身：

- `docs/architecture.md:7` 把 Mermaid 节点 `A` 写成“Codex or Claude invokes PlanShip”；第 16 行又把同一个 `A` 写成“Real tests on final integrated source”，第 17 行接着使用 `A --> V`。同一节点 ID 有两种不同标签，图中步骤身份和边方向存在歧义；不能由模型擅自假设是两个不同节点或宣称全部正确。
- `docs/architecture.md:18` 还有 `V -- No --> X` 失败分支；新候选没有对应关系，而源图的 `X` 又无解释性标签。缺失分支属于完整性待审，不能凭空补造含义，也不把此项记作结构评分已覆盖。
- 其余流程箭头和模块描述都有冻结文档行号旁证，但经过的只是**AI 源文档初核**，未经独立审查人完整确认。

## 下一轮建议

先在 PlanShip 源项目中澄清 Mermaid `A` 节点复用和 `X` 失败分支，再冻结新来源快照，交由独立审查人核对关系语义与覆盖完整性。不可直接修改本轮历史候选或把旧 Git 快照悄悄替换成修订版。GEN-UI 侧保持轻量，不继续堆积自动推断规则以掩盖来源不确定性。
