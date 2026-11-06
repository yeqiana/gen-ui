# GEN-UI · 四槽发布前工程审计验收（2026-11-06）

## 验收范围与结论

基线为 GitHub `main` 的 `67f7fcf`。本次分别隔离执行原生 Codex 环境检查、HTML portal 安全修复、GitHub Actions 浏览器测试接入、v1.4.0 发布材料评审，合并后在主工作区统一复验。代码变更限定在 GEN-UI 仓库，其他工作区未修改。

**结论：实现、合并与本地自动回归已通过。正式 GitHub Release 仍不能发布，直到原生 Codex 盲测和 GitHub 远端 CI 均有通过证据。**

## 验收结果

| 项目 | 本轮结果 | 证据 |
| --- | --- | --- |
| Node/Skill/仓库规范 | **68/68 通过** | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1` |
| HTML 预览 Host 来源 | **3/3 新增安全测试通过** | [安全测试](../tests/portal-security.test.mjs) |
| 原单页 HTML Chrome | 通过 | `tests/chrome-report-smoke.mjs` |
| 离线 iframe Chrome | 通过 | `tests/chrome-portal-smoke.mjs` |
| 本机 HTTP iframe Chrome | 通过 | `tests/chrome-portal-http-smoke.mjs` |
| 真实递归目录 iframe Chrome | 10 个页面，三视口通过 | `tests/chrome-portal-directory-smoke.mjs` |
| HTML02/HTML03/HTML04 Chrome | 三组分别通过 375/768/1440px | `tests/chrome-agent-output-smoke.mjs` |
| GitHub Actions | YAML 与失败阻断检查 **3/3 通过**，远端实际运行待核实 | [工作流](../.github/workflows/validate.yml)、[门禁测试](../tests/workflow-guard.test.mjs) |
| 原生 Codex 独立盲测 | **未完成** | [环境及盲测门禁](codex-blind-gate-2026-11-06.md) |
| 正式 Tag / GitHub Release | **未执行** | [发布清单](../docs/release-readiness-v1.4.0.md) |

## 具体加固

1. 本机 HTTP 预览服务虽仅监听 `127.0.0.1`，仍增加与实际端口一致的 `Host` 头校验，拒绝经恶意域名进行 DNS 重绑定尝试。
2. 拒绝带冒号的 URL 路径片段，降低 Windows 设备/备用数据流相关路径歧义。
3. 只有门户页面来自 `http://127.0.0.1` 才启用隔离脚本预览；复制到未知 HTTP(S) 站点的入口保持静态模式。
4. 保持 iframe 两种互斥沙盒设置，未同时开启 `allow-scripts` 和 `allow-same-origin`。

**安全边界：** 即便沙盒为不可信 HTML 提供来源隔离，`allow-scripts` 仍可运行页面 JavaScript，并可能尝试访问网络资源。请只对已审查、无敏感业务数据的 HTML 启用本机交互预览。本轮不构成全面恶意 HTML 安全审计。

## CI 策略

已有工作流上新增了依赖单测的 Chrome 浏览器任务，使用官方 `actions/checkout`、`actions/setup-node` 和 `browser-actions/setup-chrome`。不上传模型 Token、不需要仓库写权限，并通过脚本返回非零退出码阻断失败。真实 GitHub Actions Runner 的成功状态必须发布后另行回读，不能从本地测试直接断言。

## 发布判断

- 可以提交本轮安全修复、测试和文档到 GitHub `main`。
- **不可打 v1.4.0 正式 Tag，不可发布正式 GitHub Release**，除非完成原生 Codex 盲测、远端 CI 通过以及版本号最终确认。
- 原生 Codex 环境检查没有模型推理，实际本地原生模型盲测仍为阻塞项。不同执行通道的 GPT-6 + WebCodex 5 组产物不能替代它。
