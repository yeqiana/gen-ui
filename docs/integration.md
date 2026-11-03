# Gen UI 接入与安全边界

Gen UI 分成两条可以独立使用的路径：**Agent 输出约束**和**宿主 Renderer 集成**。不要将两者混为一谈。

## 1. 纯 Markdown 路径（默认）

调用 Agent → 读取 [SKILL.md](../SKILL.md) → 标准 Markdown 输出 → CLI / GitHub / IDE 预览。

该路径不要求业务代码、HTTP 服务或模型专属 API。宿主能力未知时始终使用此路径。

## 2. 交互路径（可选）

仅当**自有网页 / Webview**已经集成并显式启用受控 Renderer 时才采用。

~~~text
Agent 生成 Markdown 回退 + JSON 数据
                |
           消息层分类型
                |
          JSON Schema 校验
                |
      安全白名单组件 Renderer
                |
            本地状态更新
~~~

演示协议版本为 `gen-ui-demo/v1`，详细字段见 [renderer-contract.md](../references/renderer-contract.md)。这只是仓库内部示例，**不是 OpenUI Lang、A2UI 或 ChatGPT DIL**；要集成这些框架，需要按其官方版本单独开发适配器。

## 3. 职责边界

| 位置 | 责任 | 不能做的事 |
| --- | --- | --- |
| Skill | 引导回答结构，提供纯 Markdown 降级 | 假装 CLI 可以渲染动态组件 |
| Model | 生成文字及可选数据描述 | 输出可执行代码作为交互事件 |
| Transport | 传输、分流、完整性控制 | 执行流式 JSON 片段 |
| Validator | 校验 Schema、数量、数值、引用 | 信任模型声明的组件权限 |
| Renderer | textContent 渲染与本地状态更新 | 注入 innerHTML / eval 模型内容 |
| Host business layer | 鉴权、审计、用户确认与副作用 | 由模型指定任意网络请求 |

## 4. WebCodex 接入建议（未实施）

若未来接入本地 WebCodex，只需在消息渲染链路增加*可选*数据类型及 Renderer，不修改本地 Runner 的执行调度逻辑。先展示 Markdown 原文，在 Renderer 加载失败时维持正常阅读；所有外部副作用继续走现有工具权限。

## 5. 验收要求

- Markdown-only 客户端不丢关键信息
- 非法协议拒绝渲染，不触发 DOM 脚本
- slider 状态仅在本地更新，无模型请求
- 未经授权的 API、文件系统及发布操作不可通过 JSON 协议调用
- 断网可以直接打开 Demo 页面

这不是生产级组件框架；当前只提供 slider、只读 metric 和 note 的最小闭环。