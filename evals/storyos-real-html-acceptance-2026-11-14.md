# GEN-UI · StoryOS HTML 真实交付一致性验收

日期：2026-11-14。状态：历史 StoryOS 输出的交付适配版已通过本地验收；全新上下文独立生成验证另行记录。

## 一、样本来源与边界

- **原生模型输出**：`evals/artifacts/codex-typography-blind-2026-11-13/storyos/report-v3.html`，2026-11-13 原生 Codex 生成的 StoryOS 架构设计分析，包含 Run / Node / Task / Attempt、Outbox、Fencing Token、恢复、失败与风险。
- **本轮交付适配版**：`evals/artifacts/storyos-real-html-acceptance-2026-11-14/report.html`。保留原有正文，仅修正本地相对路径、接入公共图片查看器，并补充标有“概念示意、非业务运行证据”的 SVG 图。**不是本轮模型重新生成**。
- **可独立离线打开的报告包**：`evals/artifacts/storyos-real-html-acceptance-2026-11-14/StoryOS-GEN-UI-offline.zip`，含入口 `report.html`、本地 CSS/JS、示意图及来源说明。解压后用 Chrome/Edge 打开即可。
- **不属于本轮的证据**：Skill 在全新上下文自行发现/加载的成功率，业务源码事实、数据库结构或实际线上任务执行情况。本轮未调用新的模型，不消耗 Codex 推理配额。

## 二、发现的误判与根因

原有导航折叠门禁仅检查外层 `main` 居中，却未检查内部真正的阅读区块。

StoryOS 折叠导航后的 1440px 页面中，`main` 中心约为 755px，但正文首个 `header` 的中心为 **624px**，离 720px 的屏幕中心差 **96px**。旧检查显示通过，截图仍然偏左。

增强门禁后，`actual narrative block stays centered after folding` **先复现 FAIL**；再于 `demo/documents/assets/document.css` 的折叠模式中为真实的 `header / section / footer` 增加水平居中规则；修改后所有样本回归通过。没有改动已有表格、图表或正文业务事实。

## 三、真实浏览器验收

| 检查对象 | 结果 | 证据 |
| --- | --- | --- |
| 原版 StoryOS 静态结构及排版 | 静态 PASS；Typography 6/6 | 现有门禁 |
| 适配后的 StoryOS HTML | **43/43 PASS** | `browser/acceptance.json`、7 张 Chrome 截图 |
| 离线 ZIP 中真正可打开的 HTML | **43/43 PASS** | `packed-browser/acceptance.json` |
| 15 份技术文档既有回归 | **45/45 PASS** | `tests/chrome-documents-smoke.mjs` |
| StoryOS Typography 回归 | **6/6 PASS** | 现有生成模式专项 |
| 负例：历史原版无内容图片 | **预期 FAIL** | `--require-image` 拒绝“没有图片却声明图片验收” |
| 负例：故意引用不存在的查看器 JS | **预期 FAIL** | 同时拦截资源缺失与图片无弹层 |

新增的 `scripts/accept-html-delivery.mjs` 是**按需执行、零第三方依赖**的 Chrome/Edge 门禁，检查 375/768/1440px 的真实目录链接、长导航单滚动、折叠 M 悬停/单击/Enter、**实际阅读区块的水平中心**、每张内容图片及图片文件链接、页面内遮罩、滚轮缩放、全屏、页面横向溢出、离线资源以及运行时脚本错误。每轮保存截图和 JSON；出错则保留失败详情。

### 折叠侧栏视觉修正补充（同日）

旧版 StoryOS 模型输出在 1440px 下的左侧页面留白约为 42px，折叠栏本体 58px，M 与第一个目录图标中心相差约 10px；报告页则用 68px 折叠栏，首个图标偏离 M 中线约 5px。现统一收窄折叠布局：文档页面左侧留白 14px，桌面折叠栏 58px（报告窄屏 56px）、M 点击区域 36px、目录/箭头 18px，淡蓝 hover 使用 `rgba(58,131,247,.04)`。实测 M 与第一个目录图标中心均为约 **42.5px**，1440px 实际阅读区中心约 **741px**。新增 4 个视觉检查，合计 43/43，通过详情和更新后的截图见 `evals/artifacts/storyos-rail-refinement-2026-11-14/`。该修正不改变正文业务证据边界。

### 正文提前换行根因与修复（2026-11-14）

用户提供的“结论与分析边界”截图显示中文段落未利用完整阅读行。真实 Chrome 测量显示，在 1440px 页面下章节宽 755px、原中文段落宽 644px，但 `text-wrap:balance` 将首行文字主动压到约 **504px**，相当于右侧空出 251px。该问题不是 `<br>` 硬换行，而是“段落均衡换行 + `46ic` 限宽”的叠加结果。

修复：在 `assets/typography.css` 将中文长段落改为 `text-wrap:wrap`，超宽阅读上限改为 `62ic`，并让 `demo/documents/assets/document.css` 的普通中文技术文档共用该上限；英文继续使用 72ch。相同段落展开状态下首行可自然用到约 **742px**，段落本身宽 **755px**。同时扩展 `tests/chrome-typography-smoke.mjs` 和 `scripts/accept-html-delivery.mjs`：检查正文 **首行利用率和父容器真实内容宽度**，不再用“已换行、未溢出”代表阅读质量。

验证：当前 StoryOS 报告及更新后的离线报告包均 **46/46 PASS**（375/768/1440）；默认 Typography **66/66**，技术文档 **45/45**，Typography 单元测试 **4/4**。隔离负例恢复旧 `46ic + balance` 后在交付门禁中按预期 FAIL。更新截图、JSON 及负例均存放于 `evals/artifacts/storyos-natural-wrap-2026-11-14/`。这仍是历史模型内容的交付适配与 CSS 修复，不是模型独立生成实验。

浏览器在独立临时用户目录中运行，并阻断 HTTP(S) 请求。只应对**可信的本地 HTML**运行，不能将陌生页面中的脚本直接作为可信测试输入。

## 四、复测命令

~~~powershell
$sample = "evals/artifacts/storyos-real-html-acceptance-2026-11-14/offline-package/report.html"
node scripts/validate-html-report.mjs $sample
node scripts/accept-html-delivery.mjs $sample "evals/artifacts/storyos-real-html-acceptance-2026-11-14/packed-browser" --require-image
node tests/chrome-typography-smoke.mjs --generated $sample
~~~

如果 HTML 没有内容图片，可以省略 `--require-image`，但交付说明必须标注图片行为“未覆盖”；不能以这个样本的通过代替任意新模型输出的验收。

**本文记录的是先前历史模型 HTML 的交付适配与浏览器验收，未执行新模型生成或 StoryOS 业务代码验收。** 原有并行槽位的四个已修改文件以及历史评测数据均保留。
