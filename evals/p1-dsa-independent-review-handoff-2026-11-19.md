# GEN-UI P1 · DSA 17 章独立语义审核交接

冻结 Git `0a224f8f517ff7f380741b0880075a0f53eae64f`；真实 Claude 候选 SHA256 `da2bd16ccfb5d4ae84b1f4daff10a6dbbec0b86172d2f4d1f2fef22d68a8283b`，完整候选仍保存在本机仓库外。**16 条模块 + 17 条章节核查全部 PENDING**。

本试验事先把16模块和每模块两条证据绑定，17/17“引用存在”不能替代独立的语义覆盖审核，更不能证明陌生项目自主泛化。

| 模块 | 模型输出陈述 | 对应SOP章 | 来源行 | 第三方审核 |
| ---: | --- | --- | --- | --- |
| 1 | 现象卡与证据未验证：按需选用的检查模板，缺失证据标为未验证 | 1 | references/audit-sop.md:3、references/audit-sop.md:19 | PENDING |
| 2 | 实际调用链与事务边界：按项目实际依赖重画 | 2 | references/audit-sop.md:23、references/audit-sop.md:61 | PENDING |
| 3 | 状态机缺失租约的契约条件：无租约执行器不得误报 | 3 | references/audit-sop.md:88、references/audit-sop.md:90 | PENDING |
| 4 | 半提交故障矩阵：目标不存在不可恢复半提交 | 4 | references/audit-sop.md:99、references/audit-sop.md:103 | PENDING |
| 5 | Lease 过期写入阻断：过期写入被拒绝、新结果不被覆盖 | 5 | references/audit-sop.md:104、references/audit-sop.md:113 | PENDING |
| 6 | MQ 交付意图与去重：durable intent，去重不吞合法对象 | 6 | references/audit-sop.md:127、references/audit-sop.md:129 | PENDING |
| 7 | 缓存快照与权限隔离：错配按契约回源，降级不得放开访问 | 7 | references/audit-sop.md:140、references/audit-sop.md:150 | PENDING |
| 8 | Reader/Reconcile 同一正确性契约：Reader invalid ⇒ Reconcile 不得 healthy | 8 | references/audit-sop.md:154、references/audit-sop.md:160 | PENDING |
| 9 | 兼容矩阵与发布顺序：正确性前提需实际门禁或可验证流程 | 9 | references/audit-sop.md:165、references/audit-sop.md:174 | PENDING |
| 10 | Job 假绿与真正完成：按状态契约区分完成、跳过、无任务、降级与失败 | 10 | references/audit-sop.md:184、references/audit-sop.md:185 | PENDING |
| 11 | Recovery 四问：Failure 怎么坏、RTO 多久必须收敛等 | 11 | references/audit-sop.md:189、references/audit-sop.md:192 | PENDING |
| 12 | Finding 根因与证据：Root Cause 与 Source Evidence | 12 | references/audit-sop.md:210、references/audit-sop.md:212 | PENDING |
| 13 | 二次评审表与处置：真实性、Impact、Likelihood、级别与治理包 | 13 | references/audit-sop.md:223、references/audit-sop.md:225 | PENDING |
| 14 | 治理包模板及上线 Gate | 14 | references/audit-sop.md:226、references/audit-sop.md:241 | PENDING |
| 15 | 验收关闭不得仅凭旧测试：代码改了或原有测试全绿不能关闭 | 15 | references/audit-sop.md:245、references/audit-sop.md:246 | PENDING |
| 16 | 扫描停止判据与最终交付：约定范围无新高优先级发现即停，报告含上线 Gate | 16、17 | references/audit-sop.md:261、references/audit-sop.md:278 | PENDING |

## 17 章节的完整性复核

| 章节 | 原标题 | 直接引用的冻结行 | 决定 |
| ---: | --- | --- | --- |
| 1 | 现象卡 | 19 | PENDING |
| 2 | 全链路模板 | 23、61 | PENDING |
| 3 | 状态机检查模板 | 88、90 | PENDING |
| 4 | 事务故障矩阵 | 99、103 | PENDING |
| 5 | Lease / stale worker 矩阵 | 104、113 | PENDING |
| 6 | MQ / Delivery 矩阵 | 127、129 | PENDING |
| 7 | Snapshot / Cache 脏数据矩阵 | 140、150 | PENDING |
| 8 | Reader / Reconcile 一致性检查 | 154、160 | PENDING |
| 9 | Compatibility 矩阵 | 165、174 | PENDING |
| 10 | Job / Reconcile 假绿矩阵 | 184、185 | PENDING |
| 11 | Recovery 四问 | 189、192 | PENDING |
| 12 | Finding 模板 | 210、212 | PENDING |
| 13 | 二次评审表 | 223、225 | PENDING |
| 14 | 治理包模板 | 226、241 | PENDING |
| 15 | 验收关闭标准 | 245、246 | PENDING |
| 16 | 扫描停止判据 | 261 | PENDING |
| 17 | 最终交付格式 | 278 | PENDING |

## 独立签审准则

- 要求外部审核者核对原冻结 Git、SHA256、模型候选原文，不依赖已编辑的演示 HTML 作为唯一证据。
- 逐条填写 supported/unsupported/unclear 和理由，特别确认不可选模板与已部署事实的区分、Reader/Reconcile条件、第16+17章合并后的语义。
- 缺少独立审核身份、真实记录，或任何一项 pending / unclear / unsupported，P1 必须继续阻断。AI 对照评审不能代填真人签审。

机器可读清单：`evals/p1-dsa-independent-review-handoff-2026-11-19.json`。
