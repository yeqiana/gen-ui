# GEN-UI P1 · Agent Lead 二次审订候选语义复核

日期：2026-11-18。**GPT-6 AI 来源复核：29/29 supported；并非新模型调用，更非独立真人签审。**

## 两阶段审查

- 第一阶段：对作者审订 v1 的 27 模块 + 2 关系逐项核对，`27 supported / 2 unclear`，状态 `BLOCKED_SEMANTIC_DISAGREEMENT`；具体全部 29 条来源与理由见 `evals/p1-agent-lead-29-item-source-review-2026-11-18.md`。
- 第二阶段：对上述两条仅修改**标题**，保留模块 ID、证据、关系和原始冻结 Git：
  - `project-skill-install`: “项目级 Skill 安装” → “项目级 Skill 目录放置与发现说明”。
  - `auto-mode-invocation`: “auto 模式任务调用” → “auto 模式提示词示例”。
- 第二阶段来源结构 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`，源行审查 **29/29 supported / 0 unclear**；工具输出 `ATTESTED_NOT_INDEPENDENTLY_VERIFIED`，语义独立验收状态仍然 NOT_RUN。
- 浏览器对审订 v2 离线 HTML 进行 375、768、1440px，**3/3 通过**。

## 证据身份

- 源 Git：`9857d08e7c726e72070876fc08c9403a84d16f9a`。
- v1 派生候选 SHA-256：`95b4dd1542355d4d45602c968eefbbc6072476c93e7e533e103a1b9dbe0be352`；v2 派生候选 SHA-256：`ac3b878fc1771ecdf584b1ac3cc0e4fb2c1b1e7c78873bc3b59c31da4888a87f`。两者不同，绝不复用 v1 的审查包签名作为 v2 的审核。
- **本轮没有 Claude 或其他付费模型再次生成候选**。原 Claude 候选和完整 v1/v2 派生 JSON、来源审查包、HTML 预览都留在本地公共仓库外。

## 结论与风险

**仅标题语义歧义已经全部消除**；“项目级 Skill 目录放置”不再伪装成实际安装，“auto 提示词示例”不再伪装成真实执行。尽管 AI 来源复核 29/29 通过，仍不足以宣称模型真正完成开发、真实子 Agent 执行或获得独立人工语义签审。
