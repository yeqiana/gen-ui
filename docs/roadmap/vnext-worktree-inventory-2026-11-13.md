# vNext · 工作区遗留文件分类清单（2026-11-13）

> 这是一份基于当前 Git 状态的只读分类记录：**本轮没有移动、删除、归档或暂存这些历史文件**，也未替其他并行任务判断修改归属。

## 一、已有并行 UI 修改（保留）

- demo/documents/assets/document.css
- demo/ui-refresh.css

这些文件正在独立变化，不进入本轮能力路由提交。

## 二、历史评测报告与产物（保留）

Git 状态下 evals/ 历史报告及模型 A/B/HTML 诊断产物路径 84 个。历史结果只表示当时的运行条件；HTML 真实生成曾为 0/3，不能将静态 Demo 当成模型验收。是否公开提交原始产物需再独立审阅，优先检查脱敏。

## 三、原有测试及评测脚本（保留）

- tests/fourth-round.test.mjs
- tests/information-design.test.mjs
- scripts/score-information-design-stability.mjs
- scripts/verify-generated-report.mjs
- tests/chrome-typography-smoke.mjs

上述文件可能包含此前未收口的实验和检查脚本。本轮用户明确不测试，因此不运行、不修改、不直接合并其内容。

## 四、处理规则

1. 不执行 git clean、git reset --hard、自动删除、批量移动或强制推送。
2. evals/artifacts/ 中存在已经被 Git 跟踪的正式历史产物，不应粗暴把整个目录加入 gitignore 后误以为旧证据已清理。
3. 后续需要发布历史数据时，逐份判断证据、隐私、大小与必要性；未审查的内容继续留在本地。
4. 单独提交 vNext 文档和路由文件，不与并发 CSS、历史测试修改混合。
5. 本轮未进行任何模型、浏览器和自动化测试。相关内容仅能标记为源码整理完成，**未测试**。

## 五、快照说明

读取 Git 状态时待处理路径 97 个。此数字包含当前执行中部分 vNext 文件，后续会变化，不能视为稳定的发布统计。
