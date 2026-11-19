# GEN-UI P1 · 并行 AI 审核结果对账与费用止损

结论：两套独立 DeepSeek AI 均完成针对旧版候选的 10 项语义审查，但意见有分歧。它们不是人类签审，也不是实际生产项目审计；P1 正式发布仍 NO-GO。

## 十项结论对照

| 条目 | 复审A | 复审B | 一致性 |
| --- | --- | --- | --- |
| DSA 现象卡 (chapter:1) | supported | supported | 一致 |
| DSA 全链路 (chapter:2) | supported | unclear | 有分歧 |
| DSA 状态机 (chapter:3) | unsupported | unclear | 有分歧 |
| DSA 事务矩阵 (chapter:4) | unsupported | supported | 有分歧 |
| DSA Lease (chapter:5) | unsupported | unsupported | 一致 |
| DSA MQ (chapter:6) | unsupported | unsupported | 一致 |
| DSA 停扫判据 (chapter:16) | supported | supported | 一致 |
| DSA 最终交付 (chapter:17) | supported | supported | 一致 |
| Agent Lead 关系撤回 (relation:0) | supported | supported | 一致 |
| PlanShip 交付边界 (boundary:5) | supported | unclear | 有分歧 |

复审 A：6 supported、4 unsupported、0 unclear；复审 B：5 supported、2 unsupported、3 unclear。6项一致、4项分歧：chapter:2、chapter:3、chapter:4、boundary:5。不同输入上下文的模型判断不得拼接成一次验收，更不能通过投票替代来源核验。

## 当前修订候选

- DSA v5 SHA256：850396c5d9ecca06735bd86ffd7eb00d4d91376117ab4c7a279582b3efc8534a；Agent Lead v4 SHA256：6edef594d13ab290d5e6fcedec2eee517a6e01afb3c8b70b9661b299251d37bc；PlanShip v3 SHA256：3f1c1cdb61fec65f95560bdbb3cb9b81fa00416ef2f1459d50915d4f2772a43d。旧版模型意见均不得自动继承为新版已通过。
- DSA v5 已增强状态机 token/generation、retry limit、终态时机、Lease冲突证据和 MQ重复receiver事件；PlanShip v3补齐HTML缺失、篡改和旧版本未更新门禁。
- 仍应针对原SOP复核三处：第94/96行 DB+Outbox成功基线和缓存/投影差异；第106–113行 A claim → B steal 的完整时序；第122/124/129行100个receiver中99成功1失败及对象级去重语义。这是候选的覆盖风险，非已发现真实生产漏洞。

## 费用账本与执行失误

| 项目 | CLI报告费用（美元） |
| --- | ---: |
| 用户明确授权新增总额 | $5.000000 |
| 原共享账本（含旧80项与复审A） | $4.073350 |
| 另一套并行复审B四笔费用 | $1.178055 |
| 两套合计 | **$5.251405** |
| 超出授权 | **$0.251405** |

原因：两个并行审核路径没有共用同一预算锁和成本账本，导致合计超过授权。已建立 STOP_NEW_PAID_CALLS 标记并阻断已识别的付费入口；不可再使用剩余额度为由发起新模型调用。费用为本地 CLI 报告，实际 DeepSeek 账单尚未核验。这是执行协调错误，不是受审项目的问题。

## 冻结验收边界

- 本地最新集成工程回归：Node 268/268通过、官方Skill 230/230通过、Chrome三项目三视口9/9通过。核心 SKILL.md 未修改。
- DSA33、AgentLead28、PlanShip19，共80项独立真人审核仍 PENDING。最新版还需实际来源语义复核、最终远端CI，不得将模型支持率冒充人工批准。
- 无新的推送、main合并、Tag移动或Release。P1 Release：NO-GO。
