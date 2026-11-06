# GEN-UI · 五组 Agent 输出评测矩阵（2026-11-06）

## 测试身份与口径

本次采用 ChatGPT GPT-6 作为 Coding Agent，借助 WebCodex 已授权 Runner 读写 GEN-UI 隔离工作区、运行代码检查与真实 Chrome 验收。**没有调用独立的本地 Codex CLI**，也没有执行未知的第三方生成脚本。所有业务数据均为模拟。

本轮以 GitHub main 版本 7a60616 为基线，在四个隔离 worktree 中补齐 HTML02、HTML03、HTML04；HTML01 和 MD01 来自 2026-11-05 的前一轮基线。因此以下“5 组已覆盖”指评测矩阵有完整原始产物，不代表五组在同一 Skill 版本下独立盲测通过，更不能推断其他模型遵循率。

## 统一结果

| 用例 | 原始生成物 | 静态门禁 | 真实浏览器 / 终端 | 结果 |
| --- | --- | --- | --- | --- |
| HTML01 工程测试报告 | [页面](artifacts/HTML01-webcodex-gpt6-20261105/report.html) | 11/11 | Chrome 三种视口、分页/统计/筛选 | 历史基线通过 |
| HTML02 长文本与 all | [页面](artifacts/HTML02-webcodex-gpt6-20261106/report.html) | 9/9 | 375/768/1440px、移动浮层、有效 Tab、all 独立筛选 | 本轮通过 |
| HTML03 标签表单与抽屉 | [页面](artifacts/HTML03-webcodex-gpt6-20261106/report.html) | 10/10 | 三视口、键盘标签、表单校验保留、详情焦点返回 | 本轮通过 |
| HTML04 中文离线看板 | [页面](artifacts/HTML04-webcodex-gpt6-20261106/report.html) | 9/9 | 三视口、状态统计/图表/筛选/空态/分页 | 本轮通过 |
| MD01 纯 Markdown 回退 | [文档](artifacts/MD01-webcodex-gpt6-20261105/answer.md) | 3/3 | 终端结构验收，无假交互控件 | 历史基线通过 |

以上五组结构规则合计 **42/42 项检查通过**，但这些项是静态启发式规则，不应称为“模型准确率 100%”。

## 证据定位

- [HTML02 静态 JSON](artifacts/HTML02-webcodex-gpt6-20261106/static-gate.json) / [Chrome JSON](artifacts/HTML02-webcodex-gpt6-20261106/browser-evidence.json)
- [HTML03 静态 JSON](artifacts/HTML03-webcodex-gpt6-20261106/static-gate.json) / [Chrome JSON](artifacts/HTML03-webcodex-gpt6-20261106/browser-evidence.json)
- [HTML04 静态 JSON](artifacts/HTML04-webcodex-gpt6-20261106/static-gate.json) / [Chrome JSON](artifacts/HTML04-webcodex-gpt6-20261106/browser-evidence.json)
- [HTML01/MD01 历史基线及 SHA-256](webcodex-agent-baseline-2026-11-05.md)
- [复杂真实目录验收](complex-directory-baseline-2026-11-06.md) / [真实目录 Chrome JSON](directory-browser-2026-11-06.json)
- [三组新页面可重复 Chrome 脚本](../tests/chrome-agent-output-smoke.mjs)
- [五组证据完整性校验](../tests/agent-evidence.test.mjs)

## 复验

在 GEN-UI 仓库根目录执行：

    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
    node tests/chrome-agent-output-smoke.mjs --case HTML02 --input evals/artifacts/HTML02-webcodex-gpt6-20261106/report.html --report evals/artifacts/HTML02-webcodex-gpt6-20261106/browser-evidence.json
    node tests/chrome-agent-output-smoke.mjs --case HTML03 --input evals/artifacts/HTML03-webcodex-gpt6-20261106/report.html --report evals/artifacts/HTML03-webcodex-gpt6-20261106/browser-evidence.json
    node tests/chrome-agent-output-smoke.mjs --case HTML04 --input evals/artifacts/HTML04-webcodex-gpt6-20261106/report.html --report evals/artifacts/HTML04-webcodex-gpt6-20261106/browser-evidence.json

## 局限与下一步

1. 这次是当前对话 Agent 已知测试用例下的真实输出，不是独立多次盲测，无法由单个样本估算生产通过率。
2. 浏览器测试验证了关键交互和尺寸，但尚未做跨浏览器、完整 WCAG 评估、第三方 HTML 全面安全审计或人工独立设计盲评。
3. 早期原生 Codex CLI 的 HTML04 尝试因命令策略阻止而没有产物，不能与本轮 GPT-6 + WebCodex 路线混为一谈。
4. 正式发布下一版本前，建议另行做一次不提前告知测试细节的真实任务回归，并覆盖多页面 iframe 目录输出在更大业务仓库中的使用体验。
