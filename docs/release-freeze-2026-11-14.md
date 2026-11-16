# GEN-UI · 2026-11-14 稳定基线冻结

状态：**功能冻结（基线）**。不是对全部未来生成结果的质量保证；新的 UI 能力暂停扩张，只接受有复现证据的缺陷修复或必要的安全修补。

## 范围

- 核心 Skill 保持按需路由：普通回答默认 Markdown；技术报告需要时交付离线 HTML；不增加运行时框架依赖。
- 冻结导航展开/折叠、M 悬停展开、唯一目录滚动区、正文真实阅读区居中、中文段落自然换行与图片当前页遮罩/滚轮缩放等已验证行为。
- 交付门禁分层：静态结构及资源检查为默认路径；明确需要交互验收时调用 Chrome/Edge。新增 `--require-text TERM` 是可选的任务内容存在性检查，避免“跑题的 HTML 也显示页面全绿”。字面关键词验证不等于语义正确性审核。

## 原生 Codex 独立生成证据

2026-11-14 在 Windows 桌面用户 Session 1 启动官方 `@openai/codex` CLI，全新、空白工作目录与全新非持久会话。使用用户目录正式安装的 `gen-ui` Skill；提示词指定 StoryOS 需求，但**没有注入整份 Skill、旧报告源码或 Demo HTML**。执行记录显示模型读取 Skill 及相关 HTML/Typography/图片规则，未读取此前 StoryOS 报告或 Demo HTML。

**最终样例：** [原样生成的 StoryOS 报告](../evals/artifacts/native-codex-storyos-2026-11-14/report.html) 与同目录 `assets/` 本地资源。[清单与 SHA-256](../evals/artifacts/native-codex-storyos-2026-11-14/manifest.json) 记录文件原始字节，发布前不人工修改模型输出。

| 检查 | 最终样例 | 说明 |
| --- | --- | --- |
| StoryOS 内容及未验证边界 | 符合本次指定主题 | 含五阶段、Outbox、Fencing Token、MySQL、Redis、恢复、验收建议；不冒充业务实测 |
| HTML 静态交付 | PASS | 本地相对资源齐全 |
| Chrome/Edge 交互验收 | **46/46 PASS** | 375 / 768 / 1440px；展开/折叠、实际居中、M 图标、图片弹层、滚轮缩放 |
| 生成 HTML Typography | **6/6 PASS** | 三种视口与对应目录状态 |
| 新增任务关键词门禁 | **50/50 PASS** | 交互 46 项 + StoryOS / Outbox / Fencing / STORYBOARD 4 项 |
| 反例：错误主题的 HTML | **预期 FAIL** | 无 StoryOS 内容时，原 39 项页面检查通过，新增内容项失败 |

### 如实保留的失败与限制

- 第一次尝试受 Windows 命令执行策略限制，虽然模型启动，但无法读取 Skill，也没有输出 HTML。
- 第二次因 CLI 参数互斥，未启动模型生成。
- 第三次虽然读取 Skill 并生成页面，却偏离要求，输出《小步交付工作指南》；页面检查通过并不代表任务完成。该失败推动新增任务关键词门禁。
- 最终一次在 Codex 自动审批审查模式下成功。这证明的是**明确调用 GEN-UI 的一次冷启动样本**，并非模型自动发现 Skill 或多个题材重复生成的稳定通过率。
- 未验证 StoryOS 的实际代码、故障注入与生产运行；HTML 是技术设计建议，不是业务验收通过的证据。原始模型事件日志、电脑账号信息及本地绝对路径没有发布到 GitHub。

## 2026-11-16 缺陷修补：标题提前断行

用户反馈部分 HTML 标题在有剩余行宽时提前换行。稳定基线新增 H1–H4 自然换行要求与像素级 Chrome 门禁，并保留 1440px 正反例截图。该修复不扩张 UI 能力、不改动冻结的原生 Codex 生成样本、不新增依赖；参阅 [标题排版回归](../evals/heading-natural-wrap-2026-11-16.md)。先前 50/50 数字是冻结时的历史验收，不代表新门禁计数。

## 冻结后规则

1. 没有明确用户痛点时，不增加新组件、新框架或新的默认加载规则。
2. 每次修复必须有失败复现、最小修改和针对性验收；相同问题不得只凭“有换行/没溢出”就判通过。
3. 新生成 HTML 的内容相关性由任务提出方给出必要关键词/可观察需求；交互门禁只能补充，不能替代人工判断。
4. 其他并行任务的未提交工作不属于此次版本冻结，不因本次发布强制合并或清理。

### 复测命令

```powershell
$report = "evals/artifacts/native-codex-storyos-2026-11-14/report.html"
node scripts/validate-html-report.mjs $report
node scripts/accept-html-delivery.mjs $report "evals/artifacts/native-codex-storyos-2026-11-14/verification" --require-image --require-text StoryOS --require-text Outbox --require-text Fencing --require-text STORYBOARD
node tests/chrome-typography-smoke.mjs --generated $report
```
