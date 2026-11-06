# GEN-UI 多页面极简化改造验收（2026-11-05）

## 改造范围

1. 目录导航：每个页面标题关联一个真实 HTML 页面；已有 `id` 的 H2 标题可作为对应页面的子导航，主内容区始终使用嵌入式 iframe。
2. 目录递归：构建阶段扫描指定目录及子目录内的 `.html` / `.htm`，保留原始文件及 CSS、JS、图片资源，不覆盖手工维护的 `index.html`。支持 3MiB 以上 HTML 的只读索引。
3. 视觉：黑白灰为主，左侧导航桌面折叠、移动端打开与 Esc 关闭；弱化边框、卡片、渐变和无意义的小标题。
4. 个人 IP：8 个 SVG 统一为单色抽象剪影/线条，不再出现紫蓝渐变、珊瑚装饰。
5. 原有单页报告保留交互和表格筛选、固定首列、弹窗、抽屉等行为，其侧栏亦可收起。

## 安全兼容性

| 访问方式 | iframe 权限 | CSS | 子页面 JS/表单 |
| --- | --- | --- | --- |
| 双击 `demo/portal-pages/index.html`（`file://`） | `sandbox="allow-same-origin"`，无脚本权限 | 加载 | JS 禁止；表单无脚本逻辑 |
| 使用 127.0.0.1 本机 HTTP 服务 | `sandbox="allow-scripts allow-forms"`，无同源权限 | 加载 | 在隔离框架内执行 |

两种模式都没有取消 iframe 沙盒，也没有同时打开 `allow-scripts` 与 `allow-same-origin`。只有可信的原始 HTML 才建议启用本地交互预览；源文件不应包含不被授权的网络副作用。

## 使用

```powershell
# 仓库根目录运行；指定含有多个 HTML 的输出目录
node scripts/build-html-portal.mjs --dir "D:\reports" --title "工程验收报告"

# 双击 D:\reports\index.html：纯静态但保留 CSS
# 若页面包含筛选、弹窗等 JS 交互则启动本地服务
node scripts/serve-html-portal.mjs --dir "D:\reports" --port 8765
# 浏览器打开 http://127.0.0.1:8765/
```

若原目录已有手工维护的 index.html，则用 `--output "D:\reports\portal.html"`，本机预览时打开 `http://127.0.0.1:8765/portal.html`。

## 验收证据

- [递归构建、安全边界与兼容性测试](../tests/portal.test.mjs)：10/10 通过。
- [Chrome 静态模式回归](chrome-portal-baseline-2026-11-05.json)：375/768/1440px 均加载 4 个独立页面、8 个小标题的导航，真实 iframe CSS 计算字体为 14px，无遮挡与外层溢出；桌面折叠和移动关闭正常。
- [Chrome 本地 HTTP 交互回归](chrome-portal-http-baseline-2026-11-05.json)：独立 iframe 中 JS 标记执行，外部 CSS 背景和字体大小正确，父页面无法读取子页面 DOM。
- [桌面实际渲染截图](portal-preview-1440.png)：来自 Chrome，纯模拟示例。
- [本机 HTTP 交互预览截图](portal-preview-http-1440.png)：对照验证沙盒隔离预览的视觉效果。
- [原单页报告回归脚本](../tests/chrome-report-smoke.mjs)：旧表格筛选、分页、长文本、弹窗等继续验证。
- 自动化入口：`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1`。

**说明：** 测试样本是仓库内可信模拟页面，不是任意陌生 HTML 的全面安全审计；没有运行外部模型、数据库或真实业务系统。
