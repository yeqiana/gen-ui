# GEN-UI 七类语义图表 · 本地 JSON 数据契约

## 一、设计定位

此能力用于把 AI 生成的**业务结构信息**转为可理解、可探索的离线 SVG 图，而非单纯美化 Markdown。七类图包含时序、思维导图、部署拓扑、ER、活动、泳道和组件图。每类都具备节点/关系检查器与对应的展开、筛选或逐步演示。

## 二、HTML 输入

在文档内定义容器，并在容器内直接放置一个 `type="application/json"` 的数据块：

```html
<div class="genui-semantic-diagram" data-semantic-diagram="er">
  <script type="application/json" data-diagram-model>
    {"title":{"zh":"业务 ER 图","en":"Business ER"},
     "desc":{"zh":"示例实体关系","en":"Sample relationship"},
     "canvas":{"width":760,"height":420},
     "entities":[{"id":"account","x":35,"y":90,"w":230,"h":180,
       "title":{"zh":"账户","en":"Account"},
       "fields":[["account_id","PK","主键","Primary key"]]},
       {"id":"order","x":440,"y":90,"w":235,"h":180,
       "title":{"zh":"订单","en":"Order"},
       "fields":[["order_id","PK","主键","Primary key"],
                 ["account_id","FK","所属账户","Owning account"]]}],
     "relations":[{"from":"account","to":"order","label":"1 : N",
       "d":"M265 160 H440","lx":355,"ly":140}]}
  </script>
</div>
```

引入本地 `assets/semantic-diagrams.css` 与 `assets/semantic-diagrams.js` 即可自动初始化。也可调用 `window.GenUISemantic.init(host)` 初始化动态添加的容器；`validateModel(type, model)` 可独立检查输入。

**安全边界：** 禁止远端 JSON/JS 自动抓取。服务端生成 HTML 时必须将 JSON 中 `<` 转为 `\\u003c`，避免 `</script>` 提前结束标签。文本全部写入 `textContent` 或安全 SVG 文本节点，不将数据拼接为 HTML。

## 三、通用字段

| 字段 | 说明 |
|---|---|
| `data-semantic-diagram` | `sequence / mind / deploy / er / activity / swim / component` |
| `title`、`desc` | 非空字符串，或同时包含 `zh` 和 `en` 的语言对象 |
| `canvas.width / height` | 可选，SVG 逻辑坐标尺寸，均为 300–4096 或宽度≥300、高度≥200 |
| `id` | 英文字母开头的唯一 ID，后接字母、数字、下划线或连字符，最多 64 位 |
| `x/y/w/h` | 节点初始布局（SVG 逻辑坐标）；不能为 NaN、Infinity 或负数 |
| `edges/relations` | `from`、`to` 必须引用已存在的节点 |
| `d` | SVG Path 路径（只接受常见路径命令与数字），需满足输入尺寸限制 |
| `label / lx / ly` | 连线文字与初始锚点，渲染后自动避让节点和其他标签 |
| `detail / sub` | 详情与节点辅助说明（可选，支持中英双语） |

## 四、七类图的必要数据

| 类型 | 最小数据结构 | 对应交互 |
|---|---|---|
| sequence | `participants[]`、`messages[]`（from/to/label/kind） | 消息逐步演示、参与者和消息查看 |
| mind | `root`、`branches[]`（每项包含 `children[]`） | 分支/子主题展开与折叠 |
| deploy | `zones[]`、`nodes[]`、`edges[]`，节点包含 `zone` | 部署区域显隐与关系查看 |
| er | `entities[]`（含 `fields[][]`）、`relations[]` | PK/FK 与普通字段筛选 |
| activity | `nodes[]`（action/decision/start/end）、`edges[]` | 正常与异常路径高亮 |
| swim | `lanes[]`、`nodes[]`（含 `lane`）、`edges[]` | 责任泳道折叠与展开 |
| component | `zones[]`、`nodes[]`（含 `ports[]`）、`edges[]` | 接口端口显隐、依赖查看 |

所有类型都有点击节点、连线、字段后的详情检查器，支持局部缩放、平移、适应视口、全屏及退出。移动端提供概览/聚焦阅读切换。

## 五、生成与验收准则

1. **先建模，再绘图。** AI 先抽取节点、关系、方向、重要性、职责和说明，不应把任意图都变成方框图。
2. 对需要位置的拓扑/组件/活动/泳道/ER 图，当前版本仍需由生成方提供初始坐标和路径，渲染器负责**连接文字避让**；尚未实现完全自动化节点布图。
3. 连接标签须有独立白底图层，并用最终浏览器坐标检测标签—节点、标签—标签及文字溢出，结果为 0 才通过。
4. 折叠节点时必须隐藏其附属连接线，ER 隐藏字段时实体高度应同步变化；反复操作保持幂等和键盘可达。
5. 无效 JSON、重复 ID、悬空引用、非有限坐标和超大数据必须失败关闭，不加载外部资源，不执行输入内容。
6. 在 375/768/1440px 的中英文页面和不同图示交互后重新验证无遮挡、无横向页面溢出。
7. **真实示例：** `demo/custom-diagram-model.html`（订单业务 ER / 订单时序，均由独立 JSON 生成）。


## 连线长度与方向约束

- 时序图相邻、跨节点与反向消息共享真实字体测量约束：将每条消息所需的最小长度分配到它跨越的所有参与者间隙。长消息有受控上限及可访问的全文标签，不能覆盖节点或把字号无限缩小。
- 具有确定方向的边使用 marker-end，保留对比适中的箭头尺寸。关系标签需避让节点、箭头尖端和其他标签；空间不足时显示可点击的外部标签入口，不能强行覆盖。
- 紧凑步骤流程使用 assets/flow-label-layout.js，按 SVG getComputedTextLength() 扩展节点间距。过宽时要求图内横向滚动及最低可读像素尺度，不能强行把数千 SVG 单位挤进窄画布。布局应优先在缩放控制器初始化前完成；后续动态更新必须同步刷新控制器的缩放基准，支持 fit/zoom/全屏幂等恢复。真实边界测试：tests/chrome-layout-edge-cases.mjs。
