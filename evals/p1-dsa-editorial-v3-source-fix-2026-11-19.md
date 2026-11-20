# DSA P1 · 修复候选正文与审核要求不一致

**发现并修复确定的语义缺陷。** v2 的 notes 已说明完整停止标准，但模块11的四问、模块16的多条件标题仍被简化；用户阅读模块时可能遗漏。v3 保留 notes 并定点补强标题与证据。

| 模块 | 原版标题 | 修订标题 | 冻结证据行 |
| --- | --- | --- | --- |
| module-11 | Recovery 四问：Failure 怎么坏、RTO 多久必须收敛等 | Recovery 四问：Failure、Detection、Repair Owner、RTO 均需回答 | references/audit-sop.md:189、references/audit-sop.md:192、references/audit-sop.md:190、references/audit-sop.md:191 |
| module-16 | 扫描收口限定已审范围并保留未验证缺口；最终交付包含上线 Gate | 扫描停止综合已审范围、新高优先级发现、治理稳定和扫描/修复收益，保留未验证范围；交付遵循最终格式与上线 Gate | references/audit-sop.md:261、references/audit-sop.md:278、references/audit-sop.md:263、references/audit-sop.md:264、references/audit-sop.md:266、references/audit-sop.md:267 |

- 作者审订 v3 SHA256：`c39b033e7b9b3a6615ba0d3e638c3f2996d77f762ca7fc7db6586efe6eb86005`；编辑 v2 SHA256：`7bc5f85accc92f1fd1952abb9f0fc6bb7a1c65976d94c2cf3a42c200e6e66cbf`。
- 真实模型未重新运行，原文件不变；来源门禁 STRUCTURAL_PASS_SEMANTIC_UNVERIFIED，17/17 章直引，16模块。
- 新33项人工审核清单与候选一致，全部PENDING；独立真人审核仍未发生。
- 新HTML由冻结来源渲染，待 Chrome 验证。
