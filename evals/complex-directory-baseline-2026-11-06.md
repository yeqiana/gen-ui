# GEN-UI 目录递归集成 · 复杂场景验收（2026-11-06）

本轮通过已授权 WebCodex Runner 的隔离 worktree 执行，基线提交为 7a60616。没有修改其他业务工作区，也未读取生产数据库。

## 一、真实 GEN-UI 仓库目录

递归集成实际仓库根目录，**独立槽位初次发现 7 个非自动生成 HTML 页面**，合入 HTML02、HTML03、HTML04 后，统一 Chrome 复验发现 **10 个独立页面**。来源包括 demo/report.html、demo/index.html、demo/portal-pages 多级页面和五组评测中的四个 HTML 产物。

生成前后逐一比较原始 HTML 的 SHA-256，全部保持一致；重复生成没有将旧的自动生成目录入口重新计入。实际 Chrome 在 375、768、1440 像素三个宽度下验证页面数量、iframe 内部导航、嵌套页面加载、折叠和无外层溢出。所有访问限定在本机 127.0.0.1。

## 二、复杂目录压力样例

构造包含 **38 个 HTML** 的多级目录，同时提供 CSS、JS、SVG，覆盖五级深度、中文文件名以及空格、#、&、% 等特殊字符。保留原有手写 index.html，生成单独 portal.html。

38 个页面均被收录；中文和特殊字符 URI 编码正确；所有原始 HTML 及手写首页的文件哈希不变。本机 HTTP 服务实际获取全部页面，并抽查关联的样式、脚本、图像路径。测试结束后已清理临时目录。

## 三、可复现证据

- [复杂目录自动测试](../tests/portal-complex.test.mjs)
- [真实仓库 Chrome 测试](../tests/chrome-portal-directory-smoke.mjs)
- [浏览器 JSON 证据](directory-browser-2026-11-06.json)

复验命令：

    node --test tests/portal-complex.test.mjs
    node tests/chrome-portal-directory-smoke.mjs --report evals/directory-browser-2026-11-06.json
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1

**结果：** 新增 2 项目录集成测试全部通过；单独槽位的 56/56 回归通过。统一合并后，再增加了 6 项证据完整性测试，最终仓库回归 **62/62 通过**。真实 Chrome 在合并后的 10 个页面目录中完成导航与嵌套页加载验收。

**限制：** 这里的“真实目录”是 GEN-UI 开源项目本身；38 页目录为构造的压力样本，并非业务生产目录。此结果不能证明所有未知 HTML 的安全性或生产网站兼容性。
