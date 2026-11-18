# GEN-UI P1 · 四槽位并发集成验收（2026-11-18）

状态：**工程联合回归通过；P1 语义泛化及人工独立验收仍未放行。**

## 并行槽位和集成提交

| 槽位 | 工作成果 | 集成后的 Git 提交 |
| --- | --- | --- |
| DSA | 可选紧凑 Evidence ID JSON Schema，不修改默认 Schema 与来源解析器；167 个冻结 ID 保持一致 | `8c2ed5a` |
| Agent Lead | 测试建议冒充已完成验证的审查风险提示，仅提示而不自动裁决；真实旧候选准确命中 2 项 | `469dc43` |
| PlanShip | 新冻结来源 13 条 Mermaid 流程边逐条比对，13/13 精确匹配，6 条条件关系保留 | `10c9150` |
| Browser | 四组 Windows 原生 Chrome 浏览器回归，包含正确样本与负向注入样本 | `a32b7e0` |

四个隔离 worktree 均基于 `f42bcc5` 开始，并且提交后逐个 cherry-pick 到当前 P1 工作分支，**无合并冲突**。

## 集成后同一源码联合验证

| 测试项 | 命令 | 实测 |
| --- | --- | --- |
| 完整 Node | `node --test` | **224/224 PASS** |
| Skill / 仓库规范 | `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File scripts/test-skill.ps1` | **184/184 PASS** |
| 离线全景图 Chrome | `node tests/chrome-unseen-panorama-smoke.mjs` | **375/768/1440px，3/3 PASS** |
| 隔离浏览器专项 | 四个独立脚本 | **4/4 PASS**；详见 `evals/p1-integration-browser-matrix-2026-11-18.md` |

## 验收边界

- **DSA：** 上轮真实 Claude 调用仍因虚构 ID 和预算限制失败；此次仅新增可选择的紧凑 Schema，**未再次调用模型**、未证明生成准确性或实际费用下降。
- **Agent Lead：** 新提示在历史真实候选中标记 `module:23`、`module:24`；尚未生成新候选、尚未完成独立语义签审。
- **PlanShip：** 13/13 是冻结原文与候选关系的结构保真，不代表业务已真实执行、经过独立人工验收或生产部署。
- **发布：** 本轮未推送 GitHub、未合并 `main`、未创建 Release；已冻结 Tag `gen-ui-baseline-2026-11-18` 未改动。
- **安全与费用：** 无 OpenCodex 代理、无 Codex 额度消耗、无新的付费 LLM 调用；公开仓库只记录聚合结果与 SHA，不提交原始模型事件和本机路径。

**结论：工程级 P1 改造可进入下一轮受控真实模型和独立语义验证，不能宣称 GEN-UI P1 已正式放行。**
