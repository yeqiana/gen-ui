# GEN-UI P1 · PlanShip 冻结来源流程关系逆向复核

日期：2026-11-18。性质：**程序化逐边复核 + AI 检查，不是独立真人审查或实际业务执行证明。**

| 核查 | 实际结果 |
| --- | --- |
| structure | STRUCTURAL_PASS_SEMANTIC_UNVERIFIED |
| sourceCommit | c2368e5fcbc4a75b2bf0da1def2246e9be06e480 |
| requiredBoundaries | 6 |
| sourceEdges | 13 |
| candidateModules | 29 |
| candidateRelations | 13 |
| matchedEdges | 13 |
| unexpectedRelationCount | 0 |
| conditional | 6 |
| failNo | true |

## 13 条流程边逐项映射

| 源行 | 起点 | 终点 | 条件 | 匹配的候选关系数 |
| ---: | --- | --- | --- | ---: |
| 7 | A | I | 无 | 1 |
| 8 | I | P | 无 | 1 |
| 9 | P | R | 无 | 1 |
| 10 | R | G | 无 | 1 |
| 11 | G | D | Yes | 1 |
| 12 | G | T | No | 1 |
| 13 | T | T2 | Yes | 1 |
| 14 | T | B | No | 1 |
| 15 | T2 | B | 无 | 1 |
| 16 | B | RT | 无 | 1 |
| 17 | RT | V | 无 | 1 |
| 18 | V | X | No | 1 |
| 19 | V | M | Yes | 1 |

## 决策边界

- 所有核查针对冻结 Git commit c2368e5fcbc4a75b2bf0da1def2246e9be06e480；原候选和冻结来源均未改动。
- 结构门禁只证明来源行及关系表示一致，不能说明项目已真实执行、测试通过或部署。
- 失败出口 No → FAIL/BLOCKED 与 Yes → Manual acceptance 必须分别保留，不能把前者视为自动成功或自动重试。
- 原 42 项 AI 审查仍属于 ATTESTED_NOT_INDEPENDENTLY_VERIFIED；缺少真人独立审核记录，P1 不放行。
