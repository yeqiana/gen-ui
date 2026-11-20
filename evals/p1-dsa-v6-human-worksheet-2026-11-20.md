# GEN-UI P1 · DSA v6 独立真人审核工作页

**全部33项仍为PENDING；AI复审历史意见不能自动继承给当前候选。**

冻结来源提交：0a224f8f517ff7f380741b0880075a0f53eae64f；v5候选：850396c5d9ecca06735bd86ffd7eb00d4d91376117ab4c7a279582b3efc8534a；v6候选SHA-256：3b717e52575deba3c2c27054bcc16023516751aba7fd6c34facc960a4284e91d。

## 模块主张审核（16项）

| 模块 | 当前主张 | 冻结来源行 | 真人审核 |
| --- | --- | --- | --- |
| module-01 | 现象卡采集现象/时间/影响/复现/关联标识、错误码及 DB/缓存/MQ/日志状态；待填项不算已验证 | references/audit-sop.md:3、references/audit-sop.md:7、references/audit-sop.md:11、references/audit-sop.md:14、references/audit-sop.md:17、references/audit-sop.md:18、references/audit-sop.md:19 | PENDING |
| module-02 | 全链路模板逐层询问谁写、谁读、状态存储处、唯一键、版本/generation、重试/补偿责任、完成判定与告警责任；实际答案待核证 | references/audit-sop.md:23、references/audit-sop.md:31、references/audit-sop.md:55、references/audit-sop.md:61、references/audit-sop.md:62、references/audit-sop.md:65、references/audit-sop.md:60 | PENDING |
| module-03 | 状态机核对 claim、lease owner/token/generation、过期接管、旧Worker、retry limit、cursor单调、部分成功表达、FAILED重放、terminal提前及crash恢复；保留无租约例外 | references/audit-sop.md:81、references/audit-sop.md:82、references/audit-sop.md:83、references/audit-sop.md:84、references/audit-sop.md:86、references/audit-sop.md:87、references/audit-sop.md:88、references/audit-sop.md:89、references/audit-sop.md:90、references/audit-sop.md:91、references/audit-sop.md:85 | PENDING |
| module-04 | 事务矩阵按实际依赖先验 DB 成功 + Outbox 成功基线，再覆盖 Outbox/缓存或投影/MQ/HTTP 失败、外部成功 DB rollback 与 commit 前后 crash；避免不可恢复半提交 | references/audit-sop.md:95、references/audit-sop.md:96、references/audit-sop.md:97、references/audit-sop.md:98、references/audit-sop.md:99、references/audit-sop.md:100、references/audit-sop.md:101、references/audit-sop.md:102、references/audit-sop.md:103、references/audit-sop.md:93、references/audit-sop.md:94 | PENDING |
| module-05 | Lease 待测 A claim→A卡住→lease过期→B steal→B complete→A恢复complete；旧写拒绝、B结果不被覆盖，用0行或等效冲突证据，不固定指标名 | references/audit-sop.md:104、references/audit-sop.md:108、references/audit-sop.md:110、references/audit-sop.md:111、references/audit-sop.md:113 | PENDING |
| module-06 | MQ/Delivery 待测 100 receivers: 99 success + 1 fail、失败子集重试、duplicate receiver event；durable intent 和对象级去重不得吞其他合法对象 | references/audit-sop.md:116、references/audit-sop.md:117、references/audit-sop.md:118、references/audit-sop.md:119、references/audit-sop.md:120、references/audit-sop.md:122、references/audit-sop.md:123、references/audit-sop.md:125、references/audit-sop.md:127、references/audit-sop.md:128、references/audit-sop.md:129、references/audit-sop.md:124、references/audit-sop.md:114、references/audit-sop.md:121 | PENDING |
| module-07 | 缓存快照与权限隔离：错配按契约回源，降级不得放开访问 | references/audit-sop.md:140、references/audit-sop.md:150 | PENDING |
| module-08 | Reader/Reconcile 同一正确性契约：Reader invalid ⇒ Reconcile 不得 healthy | references/audit-sop.md:154、references/audit-sop.md:160 | PENDING |
| module-09 | 兼容矩阵与发布顺序：正确性前提需实际门禁或可验证流程 | references/audit-sop.md:165、references/audit-sop.md:174 | PENDING |
| module-10 | Job 假绿与真正完成：按状态契约区分完成、跳过、无任务、降级与失败 | references/audit-sop.md:184、references/audit-sop.md:185 | PENDING |
| module-11 | Recovery 四问：Failure、Detection、Repair Owner、RTO 均需回答 | references/audit-sop.md:189、references/audit-sop.md:192、references/audit-sop.md:190、references/audit-sop.md:191 | PENDING |
| module-12 | Finding 根因与证据：Root Cause 与 Source Evidence | references/audit-sop.md:210、references/audit-sop.md:212 | PENDING |
| module-13 | 二次评审表与处置：真实性、Impact、Likelihood、级别与治理包 | references/audit-sop.md:223、references/audit-sop.md:225 | PENDING |
| module-14 | 治理包模板及上线 Gate | references/audit-sop.md:226、references/audit-sop.md:241 | PENDING |
| module-15 | 验收关闭不得仅凭旧测试：代码改了或原有测试全绿不能关闭 | references/audit-sop.md:245、references/audit-sop.md:246 | PENDING |
| module-16 | 停扫需已审无新高优先级、余项以测试/文档/可观测性为主、治理稳定、扫描收益低；保留未验证范围；交付列明 Gate/回滚/剩余风险 | references/audit-sop.md:259、references/audit-sop.md:261、references/audit-sop.md:262、references/audit-sop.md:263、references/audit-sop.md:264、references/audit-sop.md:266、references/audit-sop.md:267、references/audit-sop.md:278 | PENDING |

## 章节完整性审核（17项）

| 章节 | 核对范围 | 冻结SOP行 | 真人审核 |
| --- | --- | --- | --- |
| 1 现象卡 | 核对当前候选正文/模块是否实质表达本章关键条件：采集现象、时间、影响、频率、复现、关联标识、错误码、DB/缓存/MQ及日志指标；不得由模板推断真实系统状态。模板与直引不能代替真实验证。 | 7、9、10、11、12、13、14、15、16、17、18、19 | PENDING |
| 2 全链路模板 | 逐项核对修订后的当前候选与冻结 SOP；模板仅定义待回答/待执行的检查，不代表已经取得真实项目证据。必要边界：全链路模板逐层询问谁写、谁读、状态存储处、唯一键、版本/generation、重试/补偿责任、完成判定与告警责任；实际答案待核证 | 21、23、31、55、57、58、59、60、61、62、63、64、65、66 | PENDING |
| 3 状态机检查模板 | 逐项核对修订后的当前候选与冻结 SOP；模板仅定义待回答/待执行的检查，不代表已经取得真实项目证据。必要边界：状态机核对 claim、lease owner/token/generation、过期接管、旧Worker、retry limit、cursor单调、部分成功表达、FAILED重放、terminal提前及crash恢复；保留无租约例外 | 67、80、81、82、83、84、85、86、87、88、89、90、91 | PENDING |
| 4 事务故障矩阵 | 核对新版模块及说明是否覆盖本章每一条条件，包括完整时序、正向/故障矩阵、必要字段、观察方式与按需适用边界。冻结来源短代码行可由章节行号引用，但不得伪造不存在的证据ID：第4章按实际依赖选择待测矩阵：先用 DB 成功 + Outbox 成功作正向基线；再测 DB 成功而 Outbox 失败、缓存/投影失败（投影不得被缓存一词替代）、MQ 失败、HTTP 失败、外部副作用或所有权变更成功却 DB rollback、Outbox 落盘进程 crash、commit 前 crash 和 commit 后下游前 crash。合格目标是没有不可恢复半提交。这里仅列测试模板，没有实际执行生产测试。 | 92、93、94、95、96、97、98、99、100、101、102、103 | PENDING |
| 5 Lease / stale worker 矩阵 | 核对新版模块及说明是否覆盖本章每一条条件，包括完整时序、正向/故障矩阵、必要字段、观察方式与按需适用边界。冻结来源短代码行可由章节行号引用，但不得伪造不存在的证据ID：第5章完整待测时序 A claim → A卡住 → lease过期 → B steal → B complete → A恢复后complete；A的过期写入必须被拒，B结果不得覆盖。数据库条件更新可用影响0行证明拒绝，其他存储或协议须给出等效可观察证据；记录拒绝/冲突而不能把某个指标名称当作所有项目固定接口。本项尚未真实执行。 | 104、105、106、107、108、109、110、111、112、113 | PENDING |
| 6 MQ / Delivery 矩阵 | 核对新版模块及说明是否覆盖本章每一条条件，包括完整时序、正向/故障矩阵、必要字段、观察方式与按需适用边界。冻结来源短代码行可由章节行号引用，但不得伪造不存在的证据ID：第6章待测 publish fail、broker confirm timeout、duplicate consume、out-of-order、consumer ACK后crash、callback前crash、100 receivers: 99 success + 1 fail、failed receiver subset retry、duplicate receiver event，以及批次完成与单项处理记录不一致。不变量为durable delivery intent、按失败receiver粒度恢复、去重粒度不得吞掉其他合法对象的处理。仅为模板并未运行MQ测试。 | 114、115、116、117、118、119、120、121、122、123、124、125、126、127、128、129 | PENDING |
| 7 Snapshot / Cache 脏数据矩阵 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 140、150 | PENDING |
| 8 Reader / Reconcile 一致性检查 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 154、160 | PENDING |
| 9 Compatibility 矩阵 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 165、174 | PENDING |
| 10 Job / Reconcile 假绿矩阵 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 184、185 | PENDING |
| 11 Recovery 四问 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 189、192 | PENDING |
| 12 Finding 模板 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 210、212 | PENDING |
| 13 二次评审表 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 223、225 | PENDING |
| 14 治理包模板 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 226、241 | PENDING |
| 15 验收关闭标准 | 此章节在图中的陈述是否忠实覆盖关键目标/不变量？直接引用是否不足以代表完整语义？ | 245、246 | PENDING |
| 16 扫描停止判据 | 核对当前候选正文/模块是否实质表达本章关键条件：已审范围无新高优先级发现、余项以测试/文档/可观测性为主、治理包稳定、继续扫描收益低于修复；保留未审环境和证据缺口。模板与直引不能代替真实验证。 | 259、260、261、262、263、264、266 | PENDING |
| 17 最终交付格式 | 核对当前候选正文/模块是否实质表达本章关键条件：范围、真实现象、核心不变量、已确认问题、排除/误报、治理包、修复顺序、测试证据、恢复闭环、上线Gate、回滚、剩余风险、结论。模板与直引不能代替真实验证。 | 267、269、270、271、272、273、274、275、276、277、278、279、280、281 | PENDING |

### 审核边界

- 上述只是审计SOP要求，不代表实际扫描Java仓库、执行故障注入或生成真实生产证据。
- 特别复核第4章正向基线与投影失败，第5章106/109等短代码行的精确时序，第6章100/99/1对象级去重。
- 部分短代码行不能生成Evidence ID，必须以冻结章节行号核对，不得伪造ID。
- 独立真人需逐项记录supported/unsupported/unclear、差异原因及实际身份；当前不予签审、不得发布。
