# GEN-UI P1 · DSA 33 项独立人工审核工作页

**全部 PENDING。** 给未来真实独立审核者使用，不是 AI 签审意见，也不是发布通过证据。

冻结来源：`0a224f8f517ff7f380741b0880075a0f53eae64f`；作者审订候选 SHA-256：`7bc5f85accc92f1fd1952abb9f0fc6bb7a1c65976d94c2cf3a42c200e6e66cbf`。应先核对审核包里的候选、冻结原文及 SHA 再逐项阅读。

审核方式：在获授权的私密副本中逐条填写 supported / unsupported / unclear 及具体理由；任何未审或不确定项均不能放行。请勿将真人信息或敏感签审材料提交公开 Git。

## 模块语义（16 项）

| 项目 | 审订版主张 | 冻结原文 | 审核决定 / 理由 |
| --- | --- | --- | --- |
| module:0 | 现象卡与证据未验证：按需选用的检查模板，缺失证据标为未验证 | `references/audit-sop.md:3` 这些是按需选用的检查模板，不是目标项目必须采用的架构或状态命名。沿实际调用图选择相关部分；不存在的组件标为不适用，缺失的证据标为未验证。生产注入、数据修改和本地探针遵循入口文件的执行边界。；`references/audit-sop.md:19` 生产日志/指标证据： | **PENDING**（理由待填） |
| module:1 | 实际调用链与事务边界：按项目实际依赖重画 | `references/audit-sop.md:23` 下面是可选组件示意，实际链路可能分支、并行或省略其中环节；按项目实际依赖和事务边界重画。；`references/audit-sop.md:61` - 唯一键是什么？ | **PENDING**（理由待填） |
| module:2 | 状态机缺失租约的契约条件：无租约执行器不得误报 | `references/audit-sop.md:88` - FAILED 是否可重放；`references/audit-sop.md:90` - 根据目标状态契约判断缺失租约、所有权或版本是否非法；无租约执行器、由其他机制保证所有权的任务，不能仅因 PROCESSING + null lease 报缺陷 | **PENDING**（理由待填） |
| module:3 | 半提交故障矩阵：目标不存在不可恢复半提交 | `references/audit-sop.md:99` - 外部副作用/所有权变更成功 + DB rollback；`references/audit-sop.md:103` 目标：不存在不可恢复半提交。 | **PENDING**（理由待填） |
| module:4 | Lease 过期写入阻断：过期写入被拒绝、新结果不被覆盖 | `references/audit-sop.md:104` ## 5. Lease / stale worker 矩阵；`references/audit-sop.md:113` 正确结果：A 的过期写入被拒绝，B 的结果不被覆盖。数据库条件更新可以用影响 0 行证明拒绝；其他存储或协议用等效可观察证据。记录拒绝或冲突的可观测性，不能把某个指标名当作所有项目的固定接口。 | **PENDING**（理由待填） |
| module:5 | MQ 交付意图与去重：durable intent，去重不吞合法对象 | `references/audit-sop.md:127` - 有 durable delivery intent；；`references/audit-sop.md:129` - 去重粒度不得吞掉其他合法对象的处理。 | **PENDING**（理由待填） |
| module:6 | 缓存快照与权限隔离：错配按契约回源，降级不得放开访问 | `references/audit-sop.md:140` - 索引/key 指向对象 A，但内容属于对象 B；`references/audit-sop.md:150` - 按业务一致性契约拒绝、降级或回源，涉及权限/隔离的数据不得因降级放开访问； | **PENDING**（理由待填） |
| module:7 | Reader/Reconcile 同一正确性契约：Reader invalid ⇒ Reconcile 不得 healthy | `references/audit-sop.md:154` 建立同一份业务正确性契约的断言矩阵；不要求所有项目实现特定名称或结构的验证器。；`references/audit-sop.md:160` - Reader invalid ⇒ Reconcile 不得 healthy； | **PENDING**（理由待填） |
| module:8 | 兼容矩阵与发布顺序：正确性前提需实际门禁或可验证流程 | `references/audit-sop.md:165` - old writer + old reader；`references/audit-sop.md:174` 发布顺序若是正确性前提，核查是否有实际门禁或可验证的操作流程；不要假定仅有文档就一定会执行，也不预设必须引入新自动化系统。 | **PENDING**（理由待填） |
| module:9 | Job 假绿与真正完成：按状态契约区分完成、跳过、无任务、降级与失败 | `references/audit-sop.md:184` - no work performed；`references/audit-sop.md:185` 根据目标项目的状态契约区分完成、跳过、无任务、降级和失败。表示业务完成的终态不能仅因“方法正常返回”就成立。 | **PENDING**（理由待填） |
| module:10 | Recovery 四问：Failure 怎么坏、RTO 多久必须收敛等 | `references/audit-sop.md:189` Failure：怎么坏？；`references/audit-sop.md:192` RTO：多久必须收敛？ | **PENDING**（理由待填） |
| module:11 | Finding 根因与证据：Root Cause 与 Source Evidence | `references/audit-sop.md:210` Root Cause：；`references/audit-sop.md:212` Source Evidence： | **PENDING**（理由待填） |
| module:12 | 二次评审表与处置：真实性、Impact、Likelihood、级别与治理包 | `references/audit-sop.md:223` \| 编号 \| 真实性 \| Impact \| Likelihood \| 建议级别 \| 处理方式 \| 合并治理包 \|；`references/audit-sop.md:225` \| \| 已确认/风险/测试缺口/误报 \| \| \| \| 必须改/治理/测试/文档/运维/范围外 \| \| | **PENDING**（理由待填） |
| module:13 | 治理包模板及上线 Gate | `references/audit-sop.md:226` ## 14. 治理包模板；`references/audit-sop.md:241` 上线 Gate： | **PENDING**（理由待填） |
| module:14 | 验收关闭不得仅凭旧测试：代码改了或原有测试全绿不能关闭 | `references/audit-sop.md:245` ## 15. 验收关闭标准；`references/audit-sop.md:246` 不能因为“代码改了”或“原有测试全绿”关闭。 | **PENDING**（理由待填） |
| module:15 | 扫描收口限定已审范围并保留未验证缺口；最终交付包含上线 Gate | `references/audit-sop.md:266` 优先级沿用目标项目规则。收敛只针对已审范围，未验证环境和证据缺口仍需保留。；`references/audit-sop.md:278` 【上线 Gate】 | **PENDING**（理由待填） |

## 章节语义（17 项）

| 章节 | 审核目标 | 冻结源行 | 审核决定 / 理由 |
| --- | --- | --- | --- |
| 1 · 现象卡 | 章节完整性（直引不等于完整） | `references/audit-sop.md:19` 生产日志/指标证据： | **PENDING**（理由待填） |
| 2 · 全链路模板 | 章节完整性（直引不等于完整） | `references/audit-sop.md:23` 下面是可选组件示意，实际链路可能分支、并行或省略其中环节；按项目实际依赖和事务边界重画。；`references/audit-sop.md:61` - 唯一键是什么？ | **PENDING**（理由待填） |
| 3 · 状态机检查模板 | 章节完整性（直引不等于完整） | `references/audit-sop.md:88` - FAILED 是否可重放；`references/audit-sop.md:90` - 根据目标状态契约判断缺失租约、所有权或版本是否非法；无租约执行器、由其他机制保证所有权的任务，不能仅因 PROCESSING + null lease 报缺陷 | **PENDING**（理由待填） |
| 4 · 事务故障矩阵 | 章节完整性（直引不等于完整） | `references/audit-sop.md:99` - 外部副作用/所有权变更成功 + DB rollback；`references/audit-sop.md:103` 目标：不存在不可恢复半提交。 | **PENDING**（理由待填） |
| 5 · Lease / stale worker 矩阵 | 章节完整性（直引不等于完整） | `references/audit-sop.md:104` ## 5. Lease / stale worker 矩阵；`references/audit-sop.md:113` 正确结果：A 的过期写入被拒绝，B 的结果不被覆盖。数据库条件更新可以用影响 0 行证明拒绝；其他存储或协议用等效可观察证据。记录拒绝或冲突的可观测性，不能把某个指标名当作所有项目的固定接口。 | **PENDING**（理由待填） |
| 6 · MQ / Delivery 矩阵 | 章节完整性（直引不等于完整） | `references/audit-sop.md:127` - 有 durable delivery intent；；`references/audit-sop.md:129` - 去重粒度不得吞掉其他合法对象的处理。 | **PENDING**（理由待填） |
| 7 · Snapshot / Cache 脏数据矩阵 | 章节完整性（直引不等于完整） | `references/audit-sop.md:140` - 索引/key 指向对象 A，但内容属于对象 B；`references/audit-sop.md:150` - 按业务一致性契约拒绝、降级或回源，涉及权限/隔离的数据不得因降级放开访问； | **PENDING**（理由待填） |
| 8 · Reader / Reconcile 一致性检查 | 章节完整性（直引不等于完整） | `references/audit-sop.md:154` 建立同一份业务正确性契约的断言矩阵；不要求所有项目实现特定名称或结构的验证器。；`references/audit-sop.md:160` - Reader invalid ⇒ Reconcile 不得 healthy； | **PENDING**（理由待填） |
| 9 · Compatibility 矩阵 | 章节完整性（直引不等于完整） | `references/audit-sop.md:165` - old writer + old reader；`references/audit-sop.md:174` 发布顺序若是正确性前提，核查是否有实际门禁或可验证的操作流程；不要假定仅有文档就一定会执行，也不预设必须引入新自动化系统。 | **PENDING**（理由待填） |
| 10 · Job / Reconcile 假绿矩阵 | 章节完整性（直引不等于完整） | `references/audit-sop.md:184` - no work performed；`references/audit-sop.md:185` 根据目标项目的状态契约区分完成、跳过、无任务、降级和失败。表示业务完成的终态不能仅因“方法正常返回”就成立。 | **PENDING**（理由待填） |
| 11 · Recovery 四问 | 章节完整性（直引不等于完整） | `references/audit-sop.md:189` Failure：怎么坏？；`references/audit-sop.md:192` RTO：多久必须收敛？ | **PENDING**（理由待填） |
| 12 · Finding 模板 | 章节完整性（直引不等于完整） | `references/audit-sop.md:210` Root Cause：；`references/audit-sop.md:212` Source Evidence： | **PENDING**（理由待填） |
| 13 · 二次评审表 | 章节完整性（直引不等于完整） | `references/audit-sop.md:223` \| 编号 \| 真实性 \| Impact \| Likelihood \| 建议级别 \| 处理方式 \| 合并治理包 \|；`references/audit-sop.md:225` \| \| 已确认/风险/测试缺口/误报 \| \| \| \| 必须改/治理/测试/文档/运维/范围外 \| \| | **PENDING**（理由待填） |
| 14 · 治理包模板 | 章节完整性（直引不等于完整） | `references/audit-sop.md:226` ## 14. 治理包模板；`references/audit-sop.md:241` 上线 Gate： | **PENDING**（理由待填） |
| 15 · 验收关闭标准 | 章节完整性（直引不等于完整） | `references/audit-sop.md:245` ## 15. 验收关闭标准；`references/audit-sop.md:246` 不能因为“代码改了”或“原有测试全绿”关闭。 | **PENDING**（理由待填） |
| 16 · 扫描停止判据 | 章节完整性（直引不等于完整） | `references/audit-sop.md:266` 优先级沿用目标项目规则。收敛只针对已审范围，未验证环境和证据缺口仍需保留。 | **PENDING**（理由待填） |
| 17 · 最终交付格式 | 章节完整性（直引不等于完整） | `references/audit-sop.md:278` 【上线 Gate】 | **PENDING**（理由待填） |

### 审查焦点

第16章需共同考虑已审范围、优先级、治理稳定、扫描与修复收益、未验证范围；第17章交付格式还有回滚与剩余风险。

## 外部审核者签审（待真实填写）

- 审核者身份及独立性证明：**PENDING**
- 不支持与不确定项的复核结果：**PENDING**
- 冻结来源及候选 SHA 对照：**PENDING**
- 独立签审证据位置（私密）：**PENDING**
- 本文件不构成自动发布授权。
