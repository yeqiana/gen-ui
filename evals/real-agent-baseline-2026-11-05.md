# GEN-UI 本地 Agent 与浏览器验证基线（2026-11-05）

## 执行结果

本基线分别记录：可信仓库演示的功能验证、离线产物质量门禁、真实 Codex 用户会话验证、真实 Agent 交付物评测。四者不能混为一谈。

| 验收对象 | 状态 | 证据 |
| --- | --- | --- |
| 仓库 Node 回归 | 通过 | `scripts/test-skill.ps1` |
| 仓库 demo 的真实 Chrome 交互 | 通过 | `tests/chrome-report-smoke.mjs` 与 `chrome-demo-baseline-2026-11-05.json` |
| Agent 产物静态门禁自测 | 通过 | `tests/agent-evaluation.test.mjs` |
| 桌面用户会话 Codex CLI 登录 | **通过** | 用户会话 1、CLI `0.162.1`、登录退出码 0 |
| `HTML04` 真实 Codex 生成任务 | **已启动，内部命令执行被策略阻止** | [执行记录](codex-user-session-attempt-2026-11-05.md) |
| `HTML01`、`HTML02`、`HTML03`、`MD01` 的真实模型生成 | **未执行** | 未取得模型产物 |
| 实际 Agent Skill 遵循率 | **未测量** | 无可以验收的真实 Agent HTML 交付物 |

## 浏览器基线

在本地 Chrome 对已审查的 `demo/report.html` 验证：375/768/1440px 页面宽度、20 条记录的键盘焦点与按钮名称、合法模块 `all` 的筛选与重置、截断提示的尺寸响应，以及新增第 68 条记录的定位与反馈。

重新执行：

    node tests/chrome-report-smoke.mjs
    node tests/chrome-report-smoke.mjs --report "D:\temp\gen-ui-browser-report.json"

此脚本只操作可信示例，不执行外部未知 Agent 代码；并不等于完整的 WCAG 人工验收。

## Codex 环境验证的真实结论

2026-11-05 先前由后台 `SYSTEM` Runner 执行 `codex login status` 返回 `Not logged in`，但这**不能证明桌面用户未登录**。

随后在桌面用户交互会话中建立了一次性、普通权限计划任务，运行同一 CLI 登录检查，退出码为 **0**，已证实登录成功，未复制 Token 或认证文件。

在该会话下真实启动了 `HTML04` Codex 生成任务，模型返回了完整轮次事件，但内部 `exec_command` 在启动 PowerShell 之前提示 `CreateProcess ... blocked by policy`，因此 **没有产生 `report.html` 等任何交付文件**。这属于执行环境受阻，不能算作 HTML 规范合规或不合规。

[详细记录及脱敏机器可读证据](codex-user-session-attempt-2026-11-05.md)保留实际执行时间、模型用量和安全边界。此现象与公开的 [Windows CLI 问题 #59314](https://github.com/openai/codex/issues/59314) 相似，但尚未确认相同的底层拒绝规则。

测试后已注销新增的临时计划任务；WebCodex 和 StoryOS 的原有任务未修改。

## 下一步准入条件

待 Codex 自身在**不关闭沙盒、不绕过策略**的情况下能够正常执行受控的读取和文件写入后，再对 HTML04 重新生成，随后用 `scripts/evaluate-agent-output.mjs` 检查实际产物，并在安全审查后做真实浏览器验收。

由于本次已有真实模型调用，不能再写“完全没有消耗模型额度”；Codex JSONL 已记录了实际模型 token 用量，但并未核实套餐计费/额度变化。

这是工程验证记录，**不表示模型已经完成或通过 GEN-UI 页面生成测试**。
