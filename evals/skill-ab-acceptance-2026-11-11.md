# GEN-UI 封版前专项验收：模型压力测试与 Skill 行为 A/B（2026-11-11）

## 结论

- **独立业务模型压力测试：通过本轮验收**。新的可复现 Chrome 随机测试（固定种子 `0xC0FFEE`）覆盖时序图、ER 图、活动图，每类 40 份合法 JSON，共 **120/120 通过**。这不是“任意合法图表绝对不会碰撞”的证明。
- **真实 Codex 新旧 Skill 对照：尚未完成**。本机 Codex CLI 0.162.1 可以运行，曾通过真实模型请求返回 `OK`，但随后的正式对照两份 Markdown 任务均超时，诊断请求进一步返回 `You've hit your usage limit`。未取得可评估的 A/B 模型产物。
- **旧版与轻量版静态对照：通过**。锁定 Git `cc5c3c9`（25,981 字节）和 `d174994`（4,343 字节），默认指令体积降低约 83.3%。
- **当前代码不自动提交、不推送、不宣称正式封版**。

## 1. 新增随机业务模型验证

执行：

```powershell
node tests/chrome-semantic-stress.mjs
```

程序会在本机 Chrome 中真实渲染业务模型，再检查 JSON 校验、SVG 渲染、标签与节点碰撞、长标签安全降级、重复边唯一 ID、节点文字越界、活动图正常/异常路径语义、图表销毁和重复初始化。

| 阶段 | 测试输入 | 结果 | 说明 |
| --- | --- | --- | --- |
| 首次独立边界测试 | 时序/ER 共 80 份 | 40/80 失败 | 合法长参与者名称撑出 SVG 画布；旧固定样例未覆盖 |
| 第一轮修复 | 相同种子与 80 份模型 | 80/80 通过 | 参与者文字安全截断并保留全文 |
| 扩展复测 | 时序/ER/活动图共 120 份 | **120/120 通过** | 额外覆盖长节点名称、自定义活动路径、反复初始化 |

修改 `assets/semantic-diagrams.js`：新增 `fitSvgLabel`，对参与者名称、一般节点标题/副标题、ER 实体名称和字段名称执行按实际 SVG 字宽的安全截断，并保留可访问的完整名称。未变更 JSON 模型契约。

证据：`evals/artifacts/stress-2026-11-11/result.json`。固定种子便于复现；测试没有声称覆盖全部可能输入，也尚未对思维导图、部署、泳道、组件图执行同等级随机化。

## 2. 完整仓库回归

| 检查 | 结果 |
| --- | --- |
| `scripts/test-skill.ps1` 内的 Node 测试 | 105/105 PASS |
| `tests/chrome-documents-smoke.mjs` | 13 份文档 × 3 视口 = 39/39 PASS |
| `tests/chrome-semantic-stress.mjs` | 120/120 PASS |
| `tests/chrome-report-smoke.mjs` | PASS |
| `evals/skill-ab-runner.mjs --dry-run` | 3 个任务 × 2 版规则，6 次调用计划及语法检查 PASS |

已将 `tests/chrome-semantic-stress.mjs` 加入 GitHub Actions 的 Windows Chrome 浏览器 QA 阶段，并将脚本语法校验加入 `scripts/test-skill.ps1`。上述测试为**本地执行结果**，不代表 GitHub Actions 远端已执行。

## 3. 实际 Codex A/B 的执行边界

实际可执行脚本：

```powershell
node evals/skill-ab-runner.mjs --dry-run
node evals/skill-ab-runner.mjs
```

支持 `--case=MD|HTML|DIAGRAM` 与 `--variant=legacy|light` 进行单场景复核。脚本按历史 Git 提交读取固定版本 Skill，统一任务、统一 Codex CLI、同一套按任务所需提供的参考契约；使用临时工作目录、`--ephemeral`、`--sandbox read-only`，不读取或输出 Token，也不修改项目业务文件。

| 场景 | 比较重点 | 本次真实 A/B |
| --- | --- | --- |
| MD | Markdown 默认、结论优先、事实与未验证推测分开 | **未完成**；两版尝试超时 |
| HTML | 显式请求 HTML 时产出离线网页与真实内容组织 | **未运行**；额度不足 |
| DIAGRAM | 复杂图表任务能否生成相应 HTML + 独立业务 JSON 模型 | **未运行**；额度不足 |

脚本会记录每次真实 CLI 的退出状态、模型生成文本、token 用量、静态格式门禁，并在额度限制时停止，不会自动重试。静态格式门禁通过仍**不代表浏览器交互或视觉质量通过**；这两项需要对真实生成结果做 Chrome 验收。

此前两版 Markdown 尝试的失败证据：`evals/artifacts/skill-ab-2026-11-11/md-results.json`（`ETIMEDOUT`）。后续诊断观察到的额度限制未误记为模型输出。

## 4. 封版门槛

1. 本轮新发现的参与者/节点名称溢出已修复，并已通过对应压力用例。
2. A/B 六次真实模型调用必须产生真实可审计输出，完成质量、信息遗漏、格式选型与 tokens 消耗比较。
3. 对真实 Agent 生成的 HTML 和语义图追加浏览器交互验收；不要把内置演示视为 Agent 能力证明。
4. 压力测试仍有覆盖边界：其余四类图和更大范围的随机样本可在后续版本增加；不要承诺完全自动布局。

## 5. 并行工作区的最后复检（注意）

本轮验收期间检测到另一组并行改动正在修改 GEN-UI 的导航、架构视图以及中英文技术文档。其改动不属于本轮压力测试；未覆盖或提交其文件。对这些未提交改动合并后的**当前工作区**额外重跑：

- Node **105/105 PASS**；压力模型 **120/120 PASS**。
- 技术文档 Chrome **FAIL**：架构设计文档仍有 11 个二级章节，但总目录链接从 22 增至 25。新加的 `assets/heading-nav.js` 根据 `h2/h3/h4` 重建桌面目录，移动端静态目录却没有同步重建（桌面新增 3 个三级标题链接），导致原一致性断言失败。这是并行改动引入的待验证整合问题，不能以放宽断言掩盖。
- 在并行改动继续发生时，不能把更早的 39/39 通过描述为**当前工作区最终通过**。

**状态：本轮压力测试整改完成；真实 Agent A/B 受 Codex 额度限制；并行导航改动造成当前文档 Chrome 验收失败。暂不封版。**
