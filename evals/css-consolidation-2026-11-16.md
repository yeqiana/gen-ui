# GEN-UI CSS 轻量去重验收（2026-11-16）

## 范围

只清理已有 CSS 的重复覆盖，不新增组件、不扩展 Skill 主文件：
- `assets/heading-nav.css`：合并折叠品牌按钮 40px→36px 的重复尺寸声明，保留实际生效的 4% 淡蓝 hover、18px 箭头及单一 M 标识；删除已经被覆盖的旧图标文件引用、旧按钮定位与旧目录顶边距。
- `demo/documents/assets/document.css`：删除 `.doc-main{--genui-prose-width:100%}` 的冗余 Token 覆盖，保留章节正文真实宽度规则。中文/英文 Token 仍是参考值，不作为正文硬裁切。

## 独立回归

- `node tests/chrome-fold-reading-regression.mjs` PASS：正例 58 项，错误正文限宽/首行缩进检测到 5 项失败，隐藏 M 检测到 2 项失败。
- `node tests/chrome-typography-smoke.mjs` PASS：66 个场景。
- `node tests/chrome-documents-smoke.mjs` PASS：15 份文档、45 个视口场景。
- `node tests/chrome-report-smoke.mjs` PASS。
- `node --test tests/typography-contract.test.mjs` PASS：4/4。

这是既有 DOM/CSS 布局回归，不代表对所有独立新模型生成的可靠性证明。下一步独立生成测试另行记录。

## 第二阶段补充：起始折叠状态与门禁自洽性

部分 AI 生成的文档以 `data-sidebar-collapsed="true"` 作为初始状态。先前交付门禁和 Typography 浏览器检查假定页面总是初始展开，执行无条件单击时会误把页面切到展开态，导致折叠 M、正文居中等一组虚假失败。本次修改测试而非改写原始 HTML：

- `scripts/accept-html-delivery.mjs`：检测初始状态；若桌面端初始折叠，先单独确认 M 默认可见、只有一个标识、无额外按钮，再恢复展开态，执行统一的「展开 → 折叠 → 悬停 → 单击/键盘展开」验收。
- `tests/chrome-typography-smoke.mjs`：先规范化展开态，再以相同顺序实测折叠态，避免以错误状态标注截图和度量数据。
- `tests/chrome-fold-reading-regression.mjs`：新增初始折叠正向夹具，375/768/1440px 不遗漏，桌面 768/1440 两个初始折叠 M 检查必须通过，原有限宽/缩进及隐藏 M 的反向夹具继续失败。

**独立生成案例的重新核验：** 首次 Chrome 验收未通过的 StoryOS 原始生成页经修复测试状态后，HTML 交付与交互 **62/62 PASS**，Typography **6/6 PASS**，未修改该文件任何 HTML/CSS/JS。这里仅证明这一份原始生成文件在**预置公共静态资源**的测试条件下符合门禁；该次跨主题独立生成共 3 例，其中生活决策器、Java RAG 均未交付完整 HTML，**不能把第二阶段通过写成第三阶段独立生成 3/3 稳定**。

本阶段保持核心 `SKILL.md` 不增重，CSS 去重与验收纠偏分别追踪，未提交其他并行评测修改。
