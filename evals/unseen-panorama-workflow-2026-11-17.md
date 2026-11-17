# GEN-UI P1 · 新领域产品架构全景图离线评测闭环

日期：2026-11-17。**状态：离线证据/渲染/Chrome 管道通过；独立模型泛化尚未验证。**

> 本文保留最初**仅准备离线提示、尚未调用模型**时的历史快照；同日后续真实 Claude Skill 激活和六组独立模型验收结果，见 [P1 独立模型实测报告](p1-independent-model-trials-2026-11-17.md)。早期表格的 0 次模型调用不代表后续未执行。

## 本轮实际完成

三份此前未用于全景图设计的真实开源项目：Agent Lead、PlanShip、Distributed Systems Audit。使用 `evals/unseen-panorama-2026-11-17.json` 冻结的 5 份 Git 文件及 SHA-256 与 12 条必须保持的事实边界。

- 从指定 Git 提交重新读取文件，验证完整 SHA-256、文件大小和事实边界，然后在**仓库外的本地目录**生成 6 份配对提示：普通组 3 份、显式 `$gen-ui` 组 3 份。准备程序不调用模型、不读取 Token、不修改业务项目。
- 复用 `score-unseen-panorama.mjs` 检查提交来源、逐字引文、模块 ID、关系端点、2–8 层结构和伪造上线/依赖等风险。只有 `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED` 才可以输出 HTML。
- 使用现有 `product-panorama-case.css` 和 `product-panorama-svg-theme.css` 嵌入式样式生成无脚本、无远程资源的独立 HTML。图形在窄屏内部滚动；没有来源支持的渠道、侧栏、技术组件或关系不硬凑。
- 新增本机 Chrome 实测：默认静态夹具 375/768/1440px **3/3 通过**；本会话根据冻结文本整理的三份**人工来源驱动演示候选**分别经过结构评分，Chrome 3 项目 × 3 视口 **9/9 通过**，并生成 9 张本地截图。演示候选只用于证明评测链路实际可用，不属于正式 A/B 组。

| 维度 | 真实结果 |
| --- | --- |
| 冻结原文 | 3 项目、5 份 Git 文件、5/5 指纹通过 |
| 保留来源边界 | 12/12 逐字证据匹配 |
| 人工演示候选 | 3 份、19 个模块、2 条有依据的关系、21 处引用 |
| 演示候选静态检查 | `STRUCTURAL_PASS_SEMANTIC_UNVERIFIED`（不代表语义判断正确） |
| 原生 Chrome 视觉/布局 | 9/9 场景通过（375 / 768 / 1440px） |
| **正式模型生成** | **0** |
| **独立 Skill 激活验证** | **0** |
| **人工盲审与真人阅读计时** | **0** |

## 复现流程

以下均为本机离线命令，不用 Codex 模型额度、OpenCodex 代理或任意付费 API：

```powershell
# 在 gen-ui 仓库内执行；项目仓库父目录需有三个对应的已提交 Git 仓库。
$projects = "<真实项目仓库的父目录>"
$out = "<不在 gen-ui 仓库内的本地临时目录>"
$manifest = "evals/unseen-panorama-2026-11-17.json"

node evals/unseen-panorama-workflow.mjs prepare $manifest $projects $out
node evals/unseen-panorama-workflow.mjs status $manifest $projects $out

# 经用户授权的本地模型执行三个项目的 baseline/explicit 提示；
# 每份输出须存为 <out>/<case-id>/<variant>.candidate.json。
# 无模型时不能假造响应；输出存在也不代表激活了 Skill。
node evals/unseen-panorama-workflow.mjs check $manifest $projects $out explicit
node evals/unseen-panorama-workflow.mjs render $manifest $projects $out explicit

# 对生成的 HTML 进行 Chrome/Edge 实机检查：
node tests/chrome-unseen-panorama-smoke.mjs --files "<out>/agent-lead/explicit.preview.html" "<out>/plan-ship/explicit.preview.html" "<out>/distributed-system-audit/explicit.preview.html"

# 只用无来源争议的静态夹具检查渲染器本身：
node tests/chrome-unseen-panorama-smoke.mjs
node --test tests/unseen-panorama-workflow.test.mjs
```

## 不可越界的结论

此流程的 `prepare` 仅创建提示。正式模型运行必须能独立证明实际调用、所用模型及 `$gen-ui` Skill 加载；纯文件名或 prompt 前缀不是加载证据。`check` 验证引文**存在**不等于引文真正支持模块语义；`render` 只生成候选页面。正式 P1 通过还需要真实的两组模型输出、独立语义盲审、视觉与读者任务验证。

本轮环境没有可用的 Ollama、LM Studio、llama.cpp 或正在运行的本地推理服务，Docker 引擎也未运行。为避免下载大型模型、擅用付费 API 或消耗 Codex 额度，本轮没有自动安装模型或创建收费调用。演示产物与截图只存在本地临时目录，不随公共仓库提交。
