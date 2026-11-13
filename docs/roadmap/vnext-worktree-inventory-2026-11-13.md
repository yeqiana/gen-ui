# vNext · 工作区遗留文件分类清单（2026-11-13）

> 这是一份基于当前 Git 状态的只读分类记录：**本轮没有移动、删除、归档或暂存这些历史文件**，也未替其他并行任务判断修改归属。

## 一、已有并行 UI 修改（保留）

- demo/documents/assets/document.css
- demo/ui-refresh.css

这些文件正在独立变化，不进入本轮能力路由提交。

## 二、历史评测报告与产物（保留）

Git 状态下 evals/ 历史报告及模型 A/B/HTML 诊断产物路径 84 个。历史结果只表示当时的运行条件；HTML 真实生成曾为 0/3，不能将静态 Demo 当成模型验收。是否公开提交原始产物需再独立审阅，优先检查脱敏。

## 三、原有测试及评测脚本（保留）

- tests/fourth-round.test.mjs
- tests/information-design.test.mjs
- scripts/score-information-design-stability.mjs
- scripts/verify-generated-report.mjs
- tests/chrome-typography-smoke.mjs

上述文件可能包含此前未收口的实验和检查脚本。本轮用户明确不测试，因此不运行、不修改、不直接合并其内容。

## 四、处理规则

1. 不执行 git clean、git reset --hard、自动删除、批量移动或强制推送。
2. evals/artifacts/ 中存在已经被 Git 跟踪的正式历史产物，不应粗暴把整个目录加入 gitignore 后误以为旧证据已清理。
3. 后续需要发布历史数据时，逐份判断证据、隐私、大小与必要性；未审查的内容继续留在本地。
4. 单独提交 vNext 文档和路由文件，不与并发 CSS、历史测试修改混合。
5. 本轮未进行任何模型、浏览器和自动化测试。相关内容仅能标记为源码整理完成，**未测试**。

## 五、快照说明

读取 Git 状态时待处理路径 97 个。此数字包含当前执行中部分 vNext 文件，后续会变化，不能视为稳定的发布统计。

## 六、独立交付单元与风险（2026-11-13 补充审查）

> 本节为只读审查形成的**时间点快照**。Typography 相关文件另有并行开发，文件内容可能继续变化。没有运行测试、回滚、清理、合并、发布或推送。

| 单元 | 涉及文件 | 交付建议 | 待处理风险 |
| --- | --- | --- | --- |
| **A · Typography 阅读排版** | `SKILL.md`、`references/typography.md`、`assets/typography.css`、HTML 规范与参考、`demo/*.css`、`.github/workflows/validate.yml`、`scripts/test-skill.ps1`、排版测试与 Fixture | 等并行修改稳定后，作为依赖完整的一组审阅和单独提交 | 规范、CSS、CI、浏览器用例互相引用；只提交 CSS 会导致资源与规则不一致；本轮未复验 |
| **B · 信息设计评测用例** | `evals/information-design-cases.json`、`evals/agent-evaluation.md`、`tests/information-design.test.mjs` | 独立评审评测用例和文字断言 | 新增压缩与摘要用例；静态断言依赖参考规范原文，规范精简后可能过期；本轮未测试 |
| **C · 品牌导航历史回归** | `tests/fourth-round.test.mjs` | 与旧品牌显示修复代码比对后再决定独立提交 | 不应误归为排版或 vNext 的新增功能 |
| **D · 历史模型与浏览器证据** | `evals/artifacts/` 的 A/B、StoryOS、HTML 超时、Typography 目录；对应 `evals/*.md` | 原件保留，发布前仅精选已脱敏且链接完整的必要文件 | HTML 真实生成曾出现 0/3 超时；失败证据不构成已通过验收 |
| **E · 评测辅助工具** | `scripts/score-information-design-stability.mjs`、`scripts/verify-generated-report.mjs`、`tests/chrome-typography-smoke.mjs` 及 Fixtures | 随各自功能独立审阅，再决定是否加入版本 | 脚本存在不等于执行过；本轮禁止自动测试 |

### 建议收口顺序

1. 等 A 的并行开发停止修改后再做完整依赖审查，避免覆盖正在推进的工作。
2. B 与 C 分开记录和提交，不把修改历史误当做新的模型效果证明。
3. D 的原始产物只保留必要、脱敏、可追溯的公开版本，不执行自动删除或整个目录忽略。
4. E 属于开发工具，需与对应功能一起复核；不能把工具自测当成真实 Agent HTML 验收。
5. 本次只交付分类文档。用户明确要求暂不测试，也暂不触发远端 CI；此前本地提交 `66f081f` 仍未推送。

### 本轮可确认的静态状态

- `SKILL.md` 约 4.9 KiB，信息设计参考约 3 KiB；均只是读取到的文件体积，**不是测试通过证明**，后续并行工作可能改变它们。
- `.github/workflows/validate.yml` 和 `scripts/test-skill.ps1` 已出现在待提交差异中，发布 Typography 时需要与 HTML/CSS、参考规范及测试入口一并审查。
- `main` 当前相对 `origin/main` 领先一个提交，剩余工作区具有多项未提交和未跟踪内容；本节不操作这些文件。
