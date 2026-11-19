# GEN-UI P1 · DSA 两处定点语义审订 v2

日期：2026-11-19。**作者审订派生候选，不是 Claude 新生成、真人签审或原结果替换。**

- 冻结原文 Git：`0a224f8f517ff7f380741b0880075a0f53eae64f`。原 Claude 候选 SHA-256：`da2bd16ccfb5d4ae84b1f4daff10a6dbbec0b86172d2f4d1f2fef22d68a8283b`，作者审订版 SHA-256：`2b563106ac1bb654f5153176f7cce8384f144b91c3a601d2e29ec40f854b9394`。原始候选保持未动。
- 模块11：原“Failure、RTO 等”容易略过 Detection 与 Repair Owner；编辑为 **Failure / Detection / Repair Owner / RTO 四问**，新增冻结源行 `190、191`。
- 模块16：将“无高优先级发现即停”纠正为**综合已审范围、高优先级发现、治理包稳定、继续扫描与修复收益，并保留未验证范围**；证据新增源行 `263、264、266、267`，保留 `261、278`。
- 注意：第17章原文 `279【回滚】`、`280【剩余风险】` 行较短，现有 ID 目录按长度过滤，不能把这两行伪装成直接证据 ID；编辑标题改用“遵循最终格式与 Gate”，审核人仍应直接检查原文这两个字段。

## 真实验收

- 冻结来源结构：`STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`，4/4 来源锚点，17/17 章有直接引用；模型层次仍 4层/16模块。
- HTML：原生 Windows Chrome 375/768/1440px **3/3 PASS**。
- 本轮新付费模型调用：**0**。没有改 `SKILL.md`、历史 Claude 原件或已有人工审核清单。
- 不得将本轮编辑版本标为原生模型输出；语义人工签审仍 **PENDING**。

完整候选及 HTML 留在本机 `%TEMP%\genui-p1-dsa-edited-source-20261119-v2`，不加入 Public Git。
