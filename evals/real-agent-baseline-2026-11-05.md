# GEN-UI 本地 Agent 与浏览器验证基线（2026-11-05）

## 执行结果

本基线严格区分仓库可信示例验证、静态检查工具和真实 Coding Agent 生成结果。

| 验收对象 | 状态 | 证据 |
| --- | --- | --- |
| 仓库 Node 回归 | 通过 | scripts/test-skill.ps1 |
| 仓库 demo 的真实 Chrome 交互 | 通过 | tests/chrome-report-smoke.mjs，原始结果：chrome-demo-baseline-2026-11-05.json |
| Agent 产物静态门禁自测 | 通过 | tests/agent-evaluation.test.mjs |
| HTML01、HTML02、HTML03、HTML04、MD01 真实 Agent 生成 | **未执行** | 不存在真实 Agent 产物，不能计算模型通过率 |

## 浏览器基线

对项目内自行编写、已审查的 demo/report.html，真实 Chrome 验证了：

- 375 / 768 / 1440px 下：20 条数据、无无效文本键盘焦点，所有详情操作都有唯一辅助技术名称。
- 合法模块名称 all 能与“全部模块”区分，独立筛选及重置正常。
- 合法超长文本的截断焦点随布局更新，悬浮提示不越出移动端屏幕。
- 新增第 68 条模拟记录后，记录可见、焦点正确、成功提示保留。

复验命令：

    node tests/chrome-report-smoke.mjs

可选保存 JSON 证据：

    node tests/chrome-report-smoke.mjs --report "D:\temp\gen-ui-browser-report.json"

此脚本只执行仓库可信示例，不允许向其传入任意 Agent 生成 HTML。不是完整 WCAG 人工验收。

## 本地 Codex 阻塞

2026-11-05，在已注册的 WebCodex 本地 Runner 中观察到：

- codex-cli 0.162.1 已安装，但 codex login status 返回 Not logged in。
- Runner 实际运行身份为 NT AUTHORITY\SYSTEM，与用户桌面登录会话并非同一个身份，不能据此判定桌面版 Codex 未登录。
- 本地 Ollama / LM Studio 服务端口 11434 / 1234 未监听。
- 未读取、复制、迁移任何登录凭据，也未启动任何消耗付费额度的模型生成任务。

因此尚无可信的真实 Agent 输出，不得声称模型合规率或 Agent 通过率。

## 后续真实 Agent 验收步骤

1. 在本人已登录的 Codex 用户会话中，按 evals/agent-cases.json 运行一组真实提示词并加载本仓库的 Skill。
2. 将原始产物 HTML（及 CSS/JS）或 Markdown 保存在独立目录，不把 demo 示例伪装为模型生成物。
3. 使用 scripts/evaluate-agent-output.mjs 对产物执行静态门禁，并保存输出 JSON。
4. 审查生成代码安全后，再手动通过浏览器验证筛选、分页、图表和键盘行为，并保存截图。
5. 记录模型版本、时间、提示词、生成文件、人工验收结论，未执行的项保留“未执行”。

这是一份真实且可重复的工程验证基线，不是模型生成效果报告。
