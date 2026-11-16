# GEN-UI 第三阶段：三主题独立生成与交付稳定基线

日期：2026-11-16。结论：**三主题在“明确使用 Skill + 本地 Runner 预置标准静态资源”的受控条件下 3/3 通过**。这不是未指定 Skill、未知宿主或完全由模型自行打包资源的普遍成功率证明。

## 目标及执行边界

- 使用 Windows 桌面用户会话中已登录的原生 Claude Code，由本地 WebCodex Runner 发起三个全新的隔离工作区。**未使用 OpenCodex 代理、未调用 Codex 额度**。
- 每个工作区只安装了当前仓库的 GEN-UI `SKILL.md`、references 和本地静态资源；模型只接收主题/交付要求，不接收旧 HTML 报告或整份 Skill 正文。
- 静态资源由本地 Runner 执行 `node scripts/prepare-html-assets.mjs <输出目录>` 一次性预置 7 个公共文件；该脚本零第三方依赖，拒绝覆盖不同内容、不输出旧 HTML。
- 模型各自编写 `report.html` 和一个主题 SVG，并在 CLI 正常退出后才进行外部验收。报告中的业务方案/风险未经过真实生产系统测试，不能将 HTML 验收误认为业务通过。

## 独立交付结果

| 主题 | 原生生成 HTML | 离线静态检查 | Chrome 交互及内容 | Typography（375 / 768 / 1440） |
| --- | --- | --- | --- | --- |
| StoryOS 异步编排 | 24,693 B、独立 SVG | PASS | **55/55** | **6/6** |
| 私人生活决策器 | 24,684 B、独立 SVG | PASS | **62/62** | **6/6** |
| Java 企业知识库 RAG | 43,954 B、独立 SVG | PASS | **62/62** | **6/6** |
| 合计 | **3/3 已生成** | **3/3** | **179/179** | **18/18** |

Chrome 检查涵盖实际导航、折叠 M 默认/悬停/键盘展开、当前页图片弹层与滚轮放大、资源离线加载、内容关键词及 375/768/1440px 的阅读区。单项关键词通过不等于完整的事实正确性评审。

现有回归：15 份文档 **45/45** 视口场景、原有 Typography **66/66**、HTML 静态合约和正反例（提前断行、正文异常缩进、隐藏 M）通过。新资源交接单测 **1/1** 通过，Typography 合约 **4/4** 通过。

## 本轮发现和纠正

1. **真实失败根因：** 前两轮独立生成被限制的跨目录读写/资源复制、反复读取完整 CSS/JS、模型回合或预算耗尽拖住；部分会话只生成 SVG 而没有 HTML。
2. **交付顺序：** 核心 Skill 强调优先写 `report.html`，然后画图；静态 HTML 优先只加载 essentials，完整交互合约仅按需加载。Skill 主文件保持约 5 KiB，不引入运行时框架。
3. **公共资源：** 新增 `scripts/prepare-html-assets.mjs`，替代模型逐个发起 7 个文件复制命令；CLI 的授权由宿主负责。脚本不能证明模型可以在所有宿主自主执行外部命令。
4. **真实 CSS 缺陷：** `.doc-summary strong{display:block}` 错误影响摘要正文内部加粗，导致大段文字提前换行；改为 `.doc-summary>strong`，只让摘要标题独占一行。
5. **验收选择器：** Typography Chrome 改为测量真实 `p` 元素及其父宽度，不再把整个 `.genui-prose` 容器作为一段文字，也不会因普通正文没标专用 class 而完全漏检。不可拆分词组留出合理行尾容差，但仍要求自然换行、无溢出，并保留负例拦截。

**来源完整性：** 三份 `report.html` 与各自主题 SVG 在验收过程中保持模型生成的原始字节。首次验收发现摘要 CSS 缺陷后，仅在独立交付副本里同步修复后的**公共 `assets/document.css`**，并重新进行三题全部验收；未经修补的最初生成资产未被冒称全部通过。校验 SHA-256 见本地 `evals/artifacts/independent-generation-2026-11-16/stage3b/delivery-manifest.json`。原始会话日志包含本地环境信息，未作为公开仓库交付。

## 自动发现单独验证

另启一份全新本地会话，提示词**没有出现 GEN-UI 名称**，只请求离线 HTML、导航和图表。执行记录确认 Claude Code 自行调用 **Skill** 工具并读取相关 HTML、Typography、语义图资料。因本项只测“自动选择”，在确认触发后主动停止，**不计入 3/3 完整 HTML 成功率**。一例触发成功不能推断所有未点名任务都能自动触发。

## 公开基线与尚未解决的边界

本次冻结的是：**GEN-UI Skill 内容组织 + 标准静态资源交接 + 已验证的离线 HTML 渲染规则**。继续保持 Markdown 默认输出，HTML 按需提供。三主题只证明本次受控环境的 3/3；未知客户端、无本地 Runner、无执行授权、未经验证的模型输出仍可能失败。所有历史失败证据保留，不以修过的成品替代原始样本。

复测方法：

```powershell
node --test tests/html-assets-handoff.test.mjs
node --test tests/typography-contract.test.mjs
node tests/chrome-fold-reading-regression.mjs
node tests/chrome-typography-smoke.mjs
node tests/chrome-documents-smoke.mjs
# 指定实际模型生成的 HTML 后再执行：
node scripts/validate-html-report.mjs <report.html>
node scripts/accept-html-delivery.mjs <report.html> <evidence-dir> --require-image
```
