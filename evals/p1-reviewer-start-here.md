# GEN-UI P1 · 真人审核入口

**审核对象：PR #13 的审核分支；当前仍为 Draft / P1 NO-GO，80 项都未签审。**

## 下载审核包

1. 打开 [PR #13](https://github.com/yeqiana/gen-ui/pull/13) 的 **Checks**，选择最新提交对应的、成功完成的 **Validate Gen UI Skill** 工作流（优先 `pull_request` 事件）。
2. 打开该工作流运行页下方的 **Artifacts**，下载 `gen-ui-p1-human-review-80-items`。GitHub 可能要求登录；附件保留 30 天，过期后可在最新提交重新运行工作流生成。
3. 解压后在本机浏览器打开 `index.html`，按 **DSA 33 / Agent Lead 28 / PlanShip 19** 核对 80 项主张、冻结原文和问题。
4. 把 `review-decisions-template.csv` **复制到解压目录之外**再填写 `supported / unsupported / unclear`、理由、审核人和时间；审核原包不修改。
5. 可在解压目录外运行 `node <GEN-UI 仓库目录>/scripts/verify-p1-human-handoff.mjs <审核包目录>` 校验包内清单与引用一致性；但清单不是签名，外部包身份仍需通过可信渠道核实。

## 重要边界

- GitHub Actions 负责生成、校验和上传审核材料，**不自动填写审核结论**。
- 工程 CI 绿色不等于 80 项真人签审已完成；未获得独立审核结论前，不合并 main、不移动冻结 Tag、不创建 Release。
- 审核包仅包含三个公开仓库的固定 Git 来源、候选、交接材料和离线页面，不使用本地私有路径，也不产生付费模型调用。
