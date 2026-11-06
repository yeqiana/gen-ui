# GEN-UI 个人 IP 极简化与跨页面视觉统一验收（2026-11-06）

## 范围与实现

- 基于 `assets/icons/gen-ui-mark.svg` 的**单路径、双峰猫耳**个人 IP；保留 16/20/24px 小尺寸适配与单色风格，不引入独立的相似 Logo 副本。
- 单页报告 `demo/report.html`：左侧导航品牌、页面页眉、页脚与 favicon 均引用同一 SVG；折叠按钮仍位于侧栏内部，扩展态用图标按钮并保留中文无障碍提示。
- 递归门户：`scripts/build-html-portal.mjs` 从项目自带 SVG 读取源文件，在生成入口的左栏、工作区页眉与左栏页脚复用同一路径；favicon 采用该 SVG 的 Base64 data URI，使**输出到任意目录的门户仍可离线显示**，不依赖原仓库目录或远程资源。
- `demo/portal-pages/index.html` 已用生成器重新生成；`assets/portal-shell.css` 与 `demo/report.css` 增加小尺寸和窄屏布局。
- 新增自动化校验：独立生成器复用品牌路径与 favicon 原始字节一致性；单页报告三个位置的真实资源引用；真实 Chrome DOM 检查可见尺寸、相同图形与无溢出。

## 本地实测结果

| 验收命令 | 结果 |
| --- | --- |
| `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1` | 73/73 项自动化测试通过 |
| `node tests/chrome-report-smoke.mjs` | 375/768/1440px 品牌加载、页眉/侧栏/页脚、交互及横向溢出测试通过 |
| `node tests/chrome-portal-smoke.mjs` | 375/768/1440px 三处品牌 SVG 路径、favicon、原有侧栏及 iframe 验收通过 |
| `node tests/chrome-portal-http-smoke.mjs` | HTTP 隔离 iframe 交互通过（不授予同源权限） |
| `node tests/chrome-portal-directory-smoke.mjs` | 递归发现真实仓库 10 页，iframe 切换、内部帧加载及折叠通过 |

实测对象是**仓库内可信演示页面和真实仓库目录**，不代表任意 Agent 生成页面都符合规范。

## Chrome 视觉证据

截图由本地 Chrome CDP 对 375/768/1440px 截取，保存在同级 `visual-brand-2026-11-06/` 目录，未采用生成式图片替代浏览器截图。

| 页面 | 375px | 768px | 1440px |
| --- | --- | --- | --- |
| 单页报告 | [手机](visual-brand-2026-11-06/report-375.png) | [平板](visual-brand-2026-11-06/report-768.png) | [桌面](visual-brand-2026-11-06/report-1440.png) |
| 递归门户 | [手机](visual-brand-2026-11-06/portal-375.png) | [平板](visual-brand-2026-11-06/portal-768.png) | [桌面](visual-brand-2026-11-06/portal-1440.png) |

人工检查发现并已修正：原 1440px 单页侧栏中品牌名称换行；原 375px 门户页眉状态与导航拥挤。重新截取的最终截图中，两处已改善。

## 限制与发布边界

- 本轮仅为本地实现与验证。Git 提交、推送、GitHub Actions 远端结果及正式 Release 应分别核实，不得以本地测试代替远端结果。
- 图标识别的审美判断仍需人工主观确认。自动检查证明路径复用、资源加载、尺寸与交互状态，不证明市场品牌辨识度。
- 未修改任意独立 HTML 子页面的原始源码或资源；递归门户只修改自动生成的入口及其生成器。
