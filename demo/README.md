# Demo 导航与清理说明

Demo 目录只保留可独立运行的成品、被测试引用的原始夹具及其必要静态资源。历史测试证据归 `evals/`，不要混进 `demo/`；私有原始素材不入库。

| 目录 / 文件 | 保留理由 | 使用方法 |
| --- | --- | --- |
| [cases/index.html](cases/index.html) | 五个业务案例展廊与可公开预览 | 本地浏览器打开 |
| [cases/*.html](cases/index.html) | 五个独立、脱敏的 HTML 成品 | 无需网络或服务 |
| [report.html](report.html) | 工程质量报告正式示例 | 与同目录 CSS/JS 一起使用 |
| [portal-pages/index.html](portal-pages/index.html) | 旧四页固定测试夹具，不改页面数量 | 浏览器回归要求恰好 4 页 |
| [index.html](index.html) | `gen-ui-demo/v1` 声明式协议示例 | 离线教学用滑块 |
| `renderer.js`、`report.js`、样式及流程脚本 | 与以上示例和自动测试存在明确依赖 | 禁止随意删除 |
| `cases/assets/*.png` | 用 HTML 截出的公开安全预览 | README 与展廊直接引用 |

**为何不删 `portal-pages/` 的四份旧 HTML？** 它们是目录发现、独立 iframe 页面、锚点导航与窄屏回归的固定样本。删除或改成五个新案例会导致测试基线不再成立。新案例已独立整理到 `cases/`。

### 对外展示口径

- StoryOS 基于真实设计资料，但公开作品、封面和数字均经过重绘。
- IM 与冷热库基于历史设计，不是本轮当前源码审计或正式投产证明。
- TV 为 HTML 大屏概念，不是电视实拍。
- QR 报告内所有百分比为合成数据。

详见 [案例来源与脱敏记录](../docs/cases.md)、[HTML 报告规范](../references/html-report-contract.md)和[仓库中文 README](../README.zh-CN.md)。

### 快速验收

~~~powershell
node tests/chrome-cases-smoke.mjs
node tests/chrome-report-smoke.mjs
node tests/chrome-portal-smoke.mjs
~~~
