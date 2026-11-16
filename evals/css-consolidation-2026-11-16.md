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
