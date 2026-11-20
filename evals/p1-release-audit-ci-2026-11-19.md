# GEN-UI P1 · 隔离发布前 CI / 安全审计

日期：2026-11-19。**本地工程基线通过；官方 Release 为 NO-GO。**

| 实测项目 | 退出码 | 时间(ms) |
| --- | ---: | ---: |
| `node-full` | 0 | 10678 |
| `official-skill` | 0 | 12984 |
| `fold-chrome` | 0 | 11519 |
| `panorama-chrome` | 0 | 957 |

## GitHub Actions 静态检查

- 存在 `.github/workflows/validate.yml`，包含 push、pull_request、workflow_dispatch 触发和 Ubuntu 官方 Skill、Windows Chrome 两类工作流。Checkout 使用 `persist-credentials: false`。
- **这只是 YAML 静态检查，没有触发 GitHub CI，也不能证明云端依赖可用或远端测试已通过。**

## 轻量与脱敏

- `SKILL.md` 大小 5099 bytes，SHA256 `ca978309b388b62c68e0bd54e2e04f9ec1dd7d0c1ed2a57522c24b7e4e11ee48`。未引入额外服务/MCP。
- 已有冻结 Tag 保持为 `762a137c97f3880565a49e8e51f176198490032a`，没有移动或发布。
- 42 份公开 P1 记录完成常见 GitHub Token/Bearer 形式初筛，命中 0；不是完整秘密扫描。

## 放行界限

- DSA 16 模块+17 章节、Agent Lead 29 项、PlanShip 13 条关系+5 边界均需实际独立人工确认。
- 本地候选审核门禁仅验证结构/填写一致性，**不能伪造人类身份、签名、远端 CI 成功**。
- 最终集成分支合并后还需重新跑全量回归；正式 P1 Release 持续 NO-GO。
