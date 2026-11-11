# GEN-UI 封版前整改与验收快照（2026-11-11）

## 本轮处理

- 将此前未提交的 SVG 文本安全截断修复纳入回归验证；完整标签保留在 SVG title 和元素的可访问信息中。
- 合并导航的桌面与移动目录生成逻辑，支持无 JS 时的静态目录，修复英文案例原侧栏缺少 nav 的语义问题。
- 从源样式中移除表格状态圆点，避免文字与伪元素重复；浏览器测试改为验证伪元素的内容不存在，而不是检查不存在的伪元素的 display 属性。
- 为八类架构图加入真实三级嵌套示例和响应式布局校验。
- HTML 交付门禁新增静态目录、实际脚本路径、图标按钮可访问属性校验；门禁自动接入 scripts/test-skill.ps1，而非只依赖人工运行。
- A/B 脚本对照固定历史提交 cc5c3c9 与运行时当前已提交 HEAD；dry-run 完全离线，不执行真实模型；输出目录随提交变化，并将 HTML/Markdown 产物按格式保存。

## 实际本地验收结果

| 验收范围 | 结果 | 证据入口 |
| --- | --- | --- |
| Node 单元测试 + HTML 静态交付门禁 | 118/118 通过 | `scripts/test-skill.ps1` |
| Chrome 六组测试 | 6/6 通过 | `tests/chrome-*.mjs` |
| 中英文文档 + 视口 | 14 页面 × 3 视口 = 42/42 | `tests/chrome-documents-smoke.mjs` |
| 固定种子语义图压力样本 | 120/120（时序、ER、活动） | `tests/chrome-semantic-stress.mjs` |
| A/B 调用规划与版本锁定 | dry-run 通过；3 场景 × 2 版本 | `tests/skill-ab-runner.test.mjs` |

## 仍未通过的封版门槛

**真实 Codex A/B：未完成，不能宣称已通过。** 此前两次 Markdown 请求超时，诊断随后遇到账号用量限制。当前脚本已准备好对照 Markdown / HTML / DIAGRAM 三种场景与历史/当前 Skill，但本次没有取得六组真实模型输出，因此不能评估生成质量、信息遗漏或实际 token 变化。不得用 dry-run 或仓库内置演示替代该证据。

对真实 Codex 输出还需执行 `scripts/validate-html-report.mjs` 和 Chrome 浏览器验收，并区分内容错误、格式错误与运行时交互缺陷。压力测试仅覆盖指定三类图的确定性样本，不能证明任意合法输入无碰撞；其余四类图随机压力测试也尚未完成。

**结论：代码和回归门禁就绪，正式封版仍需真实模型 A/B 证据。** 本文是本地验收快照，不代表 GitHub Actions 已完成或远端已发布。

## 第四轮缺口整改复检（同日增量）

- HTML 交付验证器增加正文内真实锚点检查，兼容包含标题的 section，阻断远程自动加载脚本、样式、图片、iframe、srcset 和本地缺失资源，公开点击引用仍可使用。新增负例验证见 tests/html-report-delivery.test.mjs。
- 七类语义图从三类/120 份扩展到七类/280 份，每类 40 份固定种子 JSON，桌面 900px 和移动 375px 均实际渲染、检查关系标签避让、节点文字边界、类型交互及重复初始化。证据分别为 evals/artifacts/stress-2026-11-11/result.json 与 result-mobile.json。
- README 对应中英文技术文档截图通过 Chrome --update-previews 从当前源码重新生成（9 张），英文测试验收矩阵已移动到正确章节并在截图中可见。修复图表工具栏 SVG icon 参数传递错误及 fit/fullscreen 图标重复问题。
- 真实 Codex Skill A/B：本轮在 WebCodex SYSTEM Runner 上调用单次 MD-light 任务仍超时。未产生真实可验收模型输出；不能据此认为 Skill 行为提升。桌面账户方式受工具授权限制，未进行越权操作。**A/B 仍为封版阻塞项。**
- 上述回归仅代表本地 Runner 验证，不能替代 GitHub Actions 远端流水线或真实 Agent A/B。正式封版结论维持“暂不封版”，直到真实模型对照闭环。