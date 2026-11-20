# GEN-UI P1 · 独立 checkout CI 冻结来源修复与验收

日期：2026-11-20；范围：仅 P1 测试环境与公开来源获取，不改核心 Skill 规则。

## 真实发现

本地原有 P1 来源测试依赖三个相邻 Git 仓库；直接复制 GEN-UI 文件到单独目录时缺少原始仓库，来源测试失败。不能把三个项目的完整来源复制进公开 GEN-UI 仓库，这违反现有脱敏契约。

## 解决方案

- 仅在 GitHub Actions validate job 中从公开 HTTPS 获取 allowlist：agent-lead、plan-ship、distributed-system-audit。
- 运行时读取 evals/unseen-panorama-2026-11-17.json 中的冻结 SHA，逐个验证 Git commit 对象存在；原来的来源读取程序还会验证每个文件内容的 SHA-256 与字节数。
- 临时克隆位于 GitHub Runner 的 checkout 之外，不添加 GEN-UI 可见源文件、Token 或凭据，且不触发外部付费模型。
- 如果公开仓库不可达或冻结 SHA 缺失，校验应失败，不得静默跳过或误判为发布通过。

## 独立克隆验收

- 采用带完整 Git 历史的单独 GEN-UI 克隆，在隔离 TEMP 下拉取三份公开来源 Git 仓库并校验三个冻结 commit 都可用。
- 完整官方 Skill 测试 250/250 PASS；原先仅复制文件的初步模拟缺少 .git，A/B 基线失败，不代表真实 CI 环境，已用完整 Git clone 消除模拟缺陷。
- 本轮仍未执行最终 GitHub CI；P1 真人签审 80 项仍 PENDING，正式发布 NO-GO。
