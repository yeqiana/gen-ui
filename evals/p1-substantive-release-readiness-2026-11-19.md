# GEN-UI P1 · 四槽位来源语义复核与第三方材料收口

**2026-11-19：本地工程复测 PASS；真实独立人工签审仍未开始，正式 P1 Release NO-GO。**

## 真正需要处理的两个内容问题

- DSA 真正的 Claude 候选以第 16 模块标题“无新高优先级发现即停”概括扫描停止；冻结 SOP 第 259–266 行同时要求治理包稳定、扫描边际收益较低、保留未验证范围。**缺少条件可能造成过早停止**，这才是需要下一轮定点修订的语义问题。
- PlanShip 冻结 Mermaid 图第11行 plan-only 分支写发布技术 MD+读者 MD，而正式质量门禁第58行要求对应离线 HTML 与索引；存在**交付范围未在图中说明**的歧义，尚不是已证实的功能故障。
- Agent Lead 29 项来源在“文档指导”范围未发现新矛盾，但 `relation:1` 的 flow 仅代表建议验证顺序，不能被当作已实际执行。

## 隔离第四槽位真实本地验证

| 检查 | 退出码 |
| --- | ---: |
| full-node | 0 |
| official-skill | 0 |
| fold-chrome | 0 |
| three-project-chrome | 0 |

Node **246/246**、官方 Skill 自检 **208/208**、折叠 Chrome PASS、三项目 HTML 的 Chrome **9/9**。这些是在此次四槽位变更合并之前完成的基础测试，合入后仍须复跑。

## 可交给第三方的离线本地审核包

- 已在当前 Windows 用户临时目录创建 ZIP：`genui-p1-auditor-offline-packet-20261119-r1.zip`，约 32222 字节，SHA256：`f3bd025986e85952d0bc52699ae17b4993f70ecfe6cc6d3a3c6599ac5fd512a1`。
- 内含 DSA、Agent Lead、PlanShip 的**完整待审候选 JSON、冻结来源 Markdown、原始 P1 待填审核清单**、Manifest 和 SHA256 校验信息（共3个案例）。
- DSA/AgentLead/PlanShip 的候选 SHA 均与公开的冻结 handoff 一致；没有复制付费模型原始事件、Prompt、API Token 或用户本地私有凭据。
- **ZIP 未加密、仅保存在本地**；只有经过授权的审核人和允许的数据传输渠道才应获取。没有识别、指定或联系外部真人审核者，更没有替其填写决定。
- 对外只提交 ZIP 的公共校验元数据（`evals/p1-substantive-auditor-packet-metadata-2026-11-19.json`），**不把包含候选正文的 ZIP 加入公开 Git 仓库**。

## 正式阻断

- 原 80 项（DSA 33 / Agent Lead 29 / PlanShip 18）仍由独立真人复核；本轮 AI 源码阅读只是帮助找到矛盾的辅助意见，不能替代签字。
- GitHub 远端 CI 没有对本轮最终 commit 运行，未推送、未合并 main、未打 Tag 或创建 Release。
- 不再增加重量级审核平台，只修复两个具体语义漏洞，组织可信审核后再放行。

核心 `SKILL.md` 与本轮起始 `07d9988` 完全一致。冻结 Tag `gen-ui-baseline-2026-11-18` 仍解析为 `762a137c97f3880565a49e8e51f176198490032a`。
