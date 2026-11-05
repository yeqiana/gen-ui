# GEN-UI：真实 Codex 用户会话测试记录（2026-11-05）

本报告记录**确实启动过的 Codex CLI 模型任务**，并严格区别于“成功生成符合 Skill 的 HTML”。基线来源是提交 `f98d673`。

## 结论

已确认原生 Codex CLI 可以在 Windows 桌面用户会话中通过登录检查，**此前后台 SYSTEM Runner 中的 `Not logged in` 不能代表桌面用户未登录**。

本次使用独立、非管理员的用户会话计划任务执行 `HTML04` 用例。Codex 模型启动并完成对话轮次，但其内部 `exec_command` 在启动 PowerShell 之前返回 `CreateProcess ... blocked by policy`，因此无法读取 Skill 或创建交付文件。**该用例判定为环境阻塞（blocked），不是 Skill 通过，也不是 Skill 质量失败。**

| 测试项 | 观察结果 |
| --- | --- |
| Codex CLI | `0.162.1` |
| 执行身份 | Windows 桌面交互会话 1，普通权限 |
| CLI 登录检查 | 通过，返回 0 |
| 真实提示词 | `evals/agent-cases.json` 中的 `HTML04` |
| Agent 会话启动 | 成功 |
| 模型轮次 | 已完成 |
| 文件交付 | **0 个** |
| HTML 静态验收 | 未运行（无产物） |
| Chrome 产物验收 | 未运行（无产物） |
| Skill 遵循率 | **尚未测量** |
| 失败分类 | Windows 执行工具策略拒绝 |

本次 Codex JSONL 记录的模型用量为 **输入 42,650 tokens、输出 415 tokens**；它是单次执行记录，不等同于金额或套餐扣费结果。

## 执行边界与安全

- 没有读取、导出、迁移或复制 Codex 认证文件和 Token。
- 没有使用 `danger-full-access`，没有关闭执行策略，也没有绕过被拒绝的工具调用。
- 测试输出目录与 GEN-UI 源仓库隔离，原仓库未被 Agent 修改。
- 没有修改任何 StoryOS 计划任务或正在运行的 WebCodex 后台服务。
- 专用的一次性计划任务已在测试后注销；测试脚本和原始日志仅保留在本机独立目录，**不上传到公共 GitHub**。

[Codex Windows CLI 已有相似问题记录](https://github.com/openai/codex/issues/59314)（2026-11-04），但这只能说明现象相似，**不能确定内部实际命中的策略**。

## 后续评测状态

`HTML01`、`HTML02`、`HTML03`、`MD01`：**未执行**。

`HTML04`：**已启动 Codex，但工具策略阻塞，未生成文件，无法计算通过率**。

等 Codex 自身能在受控的 `workspace-write` 模式执行正常本地读取/写入命令后，方可重新完成 `HTML04` 并运行静态门禁与真实浏览器验收。不要把现有仓库 demo 的 43 项测试作为真实 Agent 合规证据。
