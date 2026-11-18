# GEN-UI P1 · DSA 可选紧凑证据 Schema 验收

日期：2026-11-18。状态：**离线约束与冻结原文一致性通过；没有新真实模型调用，不能声称费用、语义准确率或生成合格率改善。**

| 指标 | 核验值 |
| --- | --- |
| frozenCommit | 0a224f8f517ff7f380741b0880075a0f53eae64f |
| entries | 167 |
| identicalWhitelist | true |
| normalLayersMax | 8 |
| compactLayersMax | 4 |
| compactModulesPerLayer | 4 |
| compactEvidencePerModule | 2 |
| compactRelationsMax | 16 |
| normalSchemaSHA256 | 1eddf9b87fbf2ea23aa4eff7b1b6977d840db4cdd9eea026123f88ccad8fd9e7 |
| compactSchemaSHA256 | dcae78e29dd7ec2c7d79f689a83f412eb68a8bd309d1a331d45d34f45b532201 |

设计：新文件 `evidence-ids.compact-output-schema.json` 仅供选择紧凑试验使用，标准 `evidence-ids.output-schema.json` 的默认上限、ID 白名单和解析器不变。紧凑模式最多 4 层，每层 4 模块（合计最多 16），每模块最多 2 个证据，关系最多 16 条；不减少来源目录的 167 个 ID，不降低必需来源边界要求。

风险：语义压缩可能遗漏重要内容，须由来源边界校验和独立语义审核继续阻断，不得把长度约束当作质量通过。上一轮 DSA 真实失败记录仍有效，未重跑、未修改历史候选或冻结 Tag。
