# GEN-UI v1.4.0 · 正式发布门禁（候选稿）

状态：**未发布 / 不能打 Tag**。本文是待完成检查清单，不代表 GitHub Release 已创建。检查日期：2026-11-06。

## 基线与版本

- 检查时 `main` 基线：`67f7fcf8671205800af018535744158d7d61c8a2`。
- 仓库内 CHANGELOG 记载历史 v1.0，但本机 `git tag --list` 没有现成的 Release Tag。不能推断 v1.1、v1.2、v1.3 已正式发布。
- `v1.4.0` 仅作为下一候选版本号；是否采用，须在发布阶段核实远端 Tag 和 Release 列表并决定是否需要补齐或调整版本序列。

## 发布检查

| 检查项 | 当前状态 | 证据要求 |
| --- | --- | --- |
| Skill 标识与目录结构 | 已有自动化验证 | `scripts/test-skill.ps1` |
| Node.js 自动化回归 | **68/68 项本地测试通过**，远端 CI 待验证 | 测试完整日志、失败阻断 |
| Chrome 375/768/1440px 浏览器回归 | 本地 7 组 Chrome 测试通过，远端 CI 尚待验证 | GitHub Actions 成功运行记录 |
| GitHub Actions 自动阻止失败合入 | 本地工作流检查 **3/3 通过**，**远端实际运行待验证** | 真实 PR / push 检查结论 |
| 本地预览 Host / iframe 安全修复 | 本地 3/3 安全测试及 Chrome 双模式回归通过 | 安全回归结果 |
| 原生 Codex 独立盲测 | **阻塞 / 未验证** | 非当前会话模型、原始文件和独立评审 |
| 中英文 README 与安装流程 | 文档复审中 | 双语链接和实际安装路径检查 |
| Git Tag / GitHub Release | **未执行** | 发布门禁全部满足后创建、回读 |
| GitHub main 与本地同步 | 检查时已同步 | 提交哈希、Tree、工作区干净 |

## 手动验收建议

1. 在全新普通权限工作目录安装 GEN-UI Skill，确认 Codex 或其它宿主的 Skill 发现成功；不覆盖已有用户自定义 Skill。
2. 在不提供具体样式答案的真实任务中验证 Markdown 回退和 HTML/iframe 生成，保存原始模型输出。
3. 使用业务无敏感数据的多目录 HTML 样本测试递归集成和资源路径。
4. 在 GitHub Actions 的最新推送/PR 中确认单元测试和全部 Chrome 测试实际运行（不能用本地绿灯代替）。
5. 审核发布变更清单、License、README 英中文一致性与版本历史，才允许 Tag 与 Release。

## 推荐发布步骤（仅说明，不自动执行）

- 先在独立分支合入通过评审的安全、测试和文档改动，并复跑全部自动化与 Chrome。
- 让 GitHub Actions 验证合并提交；失败则修复，不强制发布。
- 补齐原生 Codex 独立盲测或明确作为暂缓发布理由；不能用 GPT-6 + WebCodex 历史 5 组替代。
- 核实远端 Tag / Release 的实际存在性后确定版本号。
- 若全部门禁通过，才生成发布说明、Tag 和 GitHub Release，并回读验证。

## 参考资料

- [GEN-UI 五组 Agent 评测](../evals/webcodex-agent-matrix-2026-11-06.md)
- [原生 Codex 盲测未完成证据](../evals/codex-blind-gate-2026-11-06.md)
- [目录复杂场景验收](../evals/complex-directory-baseline-2026-11-06.md)
- [Github Actions](../.github/workflows/validate.yml)
