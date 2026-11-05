# GEN-UI · WebCodex Coding Agent 首轮真实输出验收（2026-11-05）

## 一、测试身份与基线

- **来源：** 当前对话中的 ChatGPT GPT-6 Coding Agent，使用 WebCodex 已授权的本地 Runner 调用文件编辑、测试与浏览器检查。
- **并非：** 本地 Codex CLI、Claude Code、Ollama、其他独立模型提供者。此结果不能代表这些模型的规范遵循率。
- **项目：** `gen-ui`，基线分支 `main`，起始提交 `f39dddd9c591b8d7e0c4cfdb65824964c6914f79`。
- **Runner：** WebCodex 0.4.6，配置热加载代次 2；新增独立的 `gen-ui` 路径白名单，未更改已有项目执行权限和服务。
- **输入：** [五组固定评测提示词](agent-cases.json) 与 [规范](../SKILL.md)。
- **数据：** 明确为模拟；没有读取生产数据，也没有执行任何 Java 项目或真实测试系统。
- **审查等级：** 这是一轮可追溯的 Agent 产物生成与有限自动化验收，不是独立、盲测、多模型的统计评测。

## 二、执行结果

| 用例 | 实际生成 | 静态门禁 | 真实浏览器 | 当前结论 |
| --- | --- | --- | --- | --- |
| HTML01 · 中文工程测试报告 | [report.html](artifacts/HTML01-webcodex-gpt6-20261105/report.html) | **11/11 通过** | Chrome 375/768/1440px，筛选/分页/统计/图表联动通过 | 通过本轮有限验收 |
| MD01 · 纯 Markdown 宿主回退 | [answer.md](artifacts/MD01-webcodex-gpt6-20261105/answer.md) | **3/3 通过** | 不适用：纯文本宿主 | 通过本轮静态验收 |
| HTML02 · 长文本和 all 边界 | — | 未执行 | 未执行 | 未评估 |
| HTML03 · 表单、标签和抽屉 | — | 未执行 | 未执行 | 未评估 |
| HTML04 · 未显式写 HTML 的页面 | — | 本链路未执行 | 未执行 | 本链路未评估 |

**历史说明：** HTML04 曾尝试使用独立用户会话中的原生 Codex CLI，但 Windows 拦截了其内部命令执行，因此产生了 **0 个页面文件**。那次失败与本次 WebCodex + GPT-6 生成测试应分开统计。

## 三、具体证据

- [HTML01 静态结果](artifacts/HTML01-webcodex-gpt6-20261105/static-gate.json)：11 项全部通过；`producerVerified=false` 是评测器的固定说明，**不意味着评测器已经独立验证模型身份**。
- [HTML01 浏览器结果](artifacts/HTML01-webcodex-gpt6-20261105/browser-evidence.json)：三个宽度均呈现 20 行、总数 48、成功 16、失败 16、待处理 16；没有外层水平溢出、无错误焦点与运行异常。
- Chrome 验证默认分页 **20 / 20 / 8**、模块筛选为 16 条、编号筛选为 T-004、重置恢复 48 条、50 条分页显示全部 48 条。
- [MD01 静态结果](artifacts/MD01-webcodex-gpt6-20261105/static-gate.json)：Markdown 结构、无 HTML 文档、无伪交互组件三项通过。
- 原有仓库测试仍需以每次执行的真实终端记录为准；不得把示例与真实 Agent 两种测试分数混为一谈。

### 关键文件 SHA-256

| 文件 | SHA-256 |
| --- | --- |
| HTML01/report.html | `d2fe4f7fb89ff39dd5c70aa5c646bca7a8c87bf1fa38bc85ba58587c311cd0af` |
| HTML01/static-gate.json | `b5e802cb701a7b18ca9b4d56b4dacb21c90a364130db4997057c661956342727` |
| HTML01/browser-evidence.json | `5198e49de3c0f835a6b3ca42cc783d3c1ea4add8825af40063b7949dba623186` |
| MD01/answer.md | `a4ac8e46f0d50cff385bb351544253a52d0995e91e2464842d4130f1d0fc6020` |
| MD01/static-gate.json | `902a7129533280adbfb97230590ebe76643e86d94c709f3604c73eee70517d8f` |

## 四、范围与局限

1. 本次 HTML01 页面由当前 ChatGPT Agent 依据同仓库已知评测提示词生成，**并非独立盲测**；样本数仅 1，不可推断跨模型整体通过率。
2. 真实 Chrome 检查涵盖布局、数据计算和常见交互，不等于完整 WCAG、跨浏览器、网络安全或人工视觉质量验收。
3. 静态质量门禁是启发式规则，不负责验证全部实际脚本行为；原始生成物、审计 JSON 与浏览器证据需联合解读。
4. 不应将 `2/5` 当成模型的通过率；这是**已执行用例数**，其余三个用例仍未评估。

## 五、后续行动

- 用相同方式独立生成 HTML02、HTML03、HTML04 并保留原始输出。
- 逐项补充真实 Chrome 交互、移动端和键盘验收。
- 未来可在不绕过任何执行策略的前提下连接其他已授权 Agent，再比较同一提示词下的表现。
