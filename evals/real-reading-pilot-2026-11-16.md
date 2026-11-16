# GEN-UI：真实工程文档阅读实验准备和无效模型试跑（2026-11-16）

## 阶段结论

本轮已从 GEN-UI 仓库冻结 3 份**真实已存档的工程评测报告**，建立 12 道阅读理解/证据界限/决策题和 6 名预留读者 × 3 篇 = 18 个**计划阅读任务槽位**。来源 SHA-256、证据引用句和答案相互校验，来源一变即拒绝准备。三篇均属于 GEN-UI 自身的工程记录，不能代表一般技术文档的广泛领域分布。

这只是**实验基础设施准备**，目前实际读者为 **0**，独立评审者为 **0**，完成的阅读任务为 **0**；不能声称有效果提升。

## 冻结来源

- `evals/fresh-semantic-2026-11-16.md`：运行状态、Skill 触发和语义判断的区别，尤其是 45/60 被误写成条件上限。
- `evals/reading-continuity-2026-11-16.md`：R2 未验证不等于未实现、N1 授权范围、末版 4/4 未全量重跑。
- `evals/independent-html-stability-2026-11-16.md`：3/3 受控交付、179/179 Chrome 和 18/18 Typography、静态资源预置与业务真实性边界。

各文档以文件 SHA-256 锁定，题目/标准答案/原文证据见 `real-reading-cases-2026-11-16.json`；题目与密封答案分开，避免把标准答案交给读者。生成的本地 `allocation.json` 使用 opaque 刺激版本 ID，6 名读者对每篇材料按 A/B 各 3 份平衡，同一人不会再次阅读同源材料。计划分配不能证明 6 名真人已参与。

## 原生模型试跑：6/6 环境无效，不计质量样本

本机先尝试用此前使用过的 Claude Code 原生 CLI，对三份工程报告各生成 `baseline` 与 `explicit /gen-ui` 的速读版本。结果：

| 组别 | 计划生成 | 可供阅读的有效文本 | 诊断 |
| --- | ---: | ---: | --- |
| baseline | 3 | 0 | 原生 CLI 返回 Not logged in，需要重新登录 |
| explicit | 3 | 0 | 返回 Unknown command: /gen-ui，不能将 exit 0 误当模型正确生成 |
| 合计 | 6 | **0** | 本轮不计入内容质量或阅读速度比较 |

本机 Skill 目录仍存在、`SKILL.md` 5,099 字节，SHA-256 前缀 `ca978309b388`，与上一轮冻结文件一致。**文件存在不能代替客户端已注册 Skill 的证据**；认证与 Skill 命令注册必须分别复核。原始尝试日志仅留在 `evals/artifacts/real-reading-pilot-2026-11-16/`，不提交公开仓库。

此前的 `2dff81b` 在 GitHub 远端尚未同步：GitHub main 为 `5259e21`；常规非交互 Git 凭据不可用，尝试本机 `GH_TOKEN` 后远端对当前仓库返回 403 写入拒绝。未经修复凭据不得宣称已推送。

## 可靠的下一步门禁

1. 在原生 Claude Code 客户端重新完成账号认证，确认可正常回复简单消息；单独确认 `/gen-ui` 被客户端识别，且确实读取正确 Skill。先做一个最小成功样本，不重复 6 次错误请求。
2. 对同一冻结原文生成两份内容版本；除了 Skill 启用条件之外尽量保持模型、读写权限、提示词、预算一致。记录实际工具加载和回答正文，并由盲审者先核对两版都没有事实缺失或编造。只有通过内容门禁的两个版本才交给读者。
3. 使用 `prepare-reading-experiment.mjs` 生成的匿名安排；至少两名独立评分者先审答案，按正确率、遗漏、决策判断裁决；真人阅读时分别记录阅读时间和作答时间。比较主指标时须同时保证准确率不下降。
4. 对已知合成题反例 45/60=75% 与未测全过后的 60/60=100% 保留独立诊断；原自动词项初筛不等于推理正确。

## 重复准备命令

```powershell
node evals/prepare-reading-experiment.mjs evals/real-reading-cases-2026-11-16.json evals/artifacts/reading-experiment-2026-11-16
node --test tests/prepare-reading-experiment.test.mjs tests/blind-reading-study.test.mjs tests/fresh-semantic.test.mjs
```

注意：`SEALED-READING-KEY-DO-NOT-SHARE.json` 是原文/答案/分组密钥，只留在本机。`allocation.json` 记录 `usableForTimedStudy:false`，直到双版本已生成并核验后才允许开始计时。不要通过手动修改标记替代外部核验。
