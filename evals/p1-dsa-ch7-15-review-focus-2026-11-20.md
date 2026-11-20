# GEN-UI P1 · DSA v6 第 7–15 章内容覆盖复核

日期：2026-11-20。性质：作者的离线来源对照，不是第三方独立审核，也不是实际 Java 仓库漏洞发现。

**重要区分：** 当前模块标题是精简知识表达，章节审核表仍有来源锚点；未在标题中逐项展开不自动等于错误，但实际审核不得只看“有证据 ID”就通过。

| 章节 | 冻结 SOP 行 | 当前摘要的可能信息损失 | 真人核验重点 |
| --- | --- | --- | --- |
| 7 Snapshot / Cache | 132–152 | 标题强调回源与权限，未逐项列出 weak checksum、错对象、删除复活及 fence | 检查错误数据构造、invalid reason、真实可达恢复、同批好对象不受拖累 |
| 8 Reader / Reconcile | 154–162 | 标题突出 invalid 不得 healthy，未说明 broken 的持久恢复或人工负责人与 Repair 后读契约 | 必须同一组脏数据运行 Reader / Reconcile / Repair 三方断言 |
| 9 Compatibility | 165–174 | 标题没有逐项展示 old/new writer-reader、滚动发布、回滚、schema 算法 | 不应将“有发布顺序文档”直接认作正确性门禁 |
| 10 Job 假绿 | 177–185 | 标题只写状态分类，未列出 lock conflict、LIMIT 0、单 shard 失败、局部扫描 | 完成终态不能由方法正常返回推导 |
| 11 Recovery | 189–199 | 标题有四问，但 retry / manual entry / alert / cleanup / replay idempotency 未列在标题 | 需确认这些补充维度在审查讲解中可见 |
| 12 Finding | 202–221 | 标题只强调 Root Cause 与 Source Evidence，未列 Probe / Production Evidence 等完整字段 | 模板应区分真实缺陷、业务影响、误报与执行证据 |
| 13 二次评审 | 223–225 | 摘要保留分类与影响，但没列治理合并表全部处置取值 | 不把风险与已确认缺陷混为一谈 |
| 14 治理包 | 228–243 | 标题只说明治理包与上线 Gate，未展开禁止方案、兼容、回滚、完成条件 | 审核交付模板完整性，不能凭空声称治理已执行 |
| 15 验收关闭 | 246–258 | 标题指出旧测试不足，但未逐一列出竞态、注入、恢复、调用方回归 | 关闭条件需要与适用的永久回归和上线/回滚证据绑定 |

**优先顺序：** 优先 7、8、9、10、15（故障/恢复的风险），再 11–14（交付治理完整性）。本表不增加审核总数，也不把这些章节从 PENDING 转成 supported。

冻结来源：`distributed-system-audit@0a224f8f517ff7f380741b0880075a0f53eae64f` 中 `references/audit-sop.md`；候选：`evals/p1-dsa-editorial-v6-candidate-2026-11-20.json`。
