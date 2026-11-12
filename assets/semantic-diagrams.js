/* Semantic, offline SVG diagrams. Selection and diagram-specific controls are primary; panning is canvas-only. */
"use strict";
(() => {
 const NS="http://www.w3.org/2000/svg";
 const T=(zh,en)=>({zh,en});
 const text=(value,lang)=>typeof value==="string"?value:(value?.[lang]??"");
 let instanceCounter=0;
 const instances=new WeakMap();
 const M={
 sequence:{
  title:T("异步任务提交时序图","Asynchronous run submission sequence"),
  desc:T("从客户端提交运行请求，到 API 写入 Outbox、Worker 消费并持久化任务，再返回运行编号。","A client submits a run; the API writes an Outbox event; a worker consumes and persists tasks before the run ID is returned."),
  participants:[
   {id:"client",name:T("客户端","Client"),sub:T("发起请求","Request")},
   {id:"api",name:T("API 服务","API service"),sub:T("校验与接入","Validate")},
   {id:"worker",name:T("工作线程","Worker"),sub:T("消费任务","Consume")},
   {id:"db",name:T("MySQL","MySQL"),sub:T("事务持久化","Persist")}
  ],
  messages:[
   {from:"client",to:"api",y:155,label:T("POST /runs","POST /runs"),kind:"sync",detail:T("客户端提交运行请求，携带幂等键与业务参数。","The client submits a run request with an idempotency key and business parameters.")},
   {from:"api",to:"db",y:230,label:T("事务写入 Run + Outbox","Commit Run + Outbox"),kind:"sync",detail:T("同一事务创建运行实例并写入 Outbox，避免业务数据与事件脱节。","One transaction creates the run and its Outbox event so business state and event intent cannot diverge.")},
   {from:"db",to:"api",y:305,label:T("提交成功","Commit"),kind:"return",detail:T("数据库提交成功后，API 才确认接收。","The API acknowledges only after the database commit succeeds.")},
   {from:"api",to:"worker",y:380,label:T("投递 RunRequested","Publish event"),kind:"async",detail:T("Outbox 发布器将事件投递给 Worker；重复投递由消费者幂等处理。","The Outbox publisher delivers the event; consumers handle duplicate delivery idempotently.")},
   {from:"worker",to:"db",y:455,label:T("创建 Task / Attempt","Create Task / Attempt"),kind:"sync",detail:T("Worker 创建任务和执行尝试，并记录围栏版本以约束写入权。","The worker creates tasks and attempts, recording a fencing version to constrain write ownership.")},
   {from:"api",to:"client",y:530,label:T("202 + runId","202 + runId"),kind:"return",detail:T("API 返回运行编号与查询入口；任务执行在后台继续。","The API returns a run ID and query location while execution continues asynchronously.")}
  ]
 },
 mind:{
  title:T("StoryOS 工作流思维导图","StoryOS workflow mind map"),
  desc:T("以内容生产目标为中心，拆分策划、生产、质量与恢复四条主线。","A content-production goal branches into planning, production, quality, and recovery."),
  root:{id:"goal",x:35,y:260,w:190,h:76,title:T("内容生产目标","Content production"),sub:T("从一句话到可交付内容","Prompt to deliverable"),detail:T("工作流入口：接收创作目标，并生成可追踪的生产运行实例。","Workflow entry: accept a creative goal and create a traceable production run.")},
  branches:[
   {id:"plan",x:340,y:65,title:T("策划阶段","Planning"),sub:T("定义内容结构","Shape the story"),detail:T("将一句话需求拆分为故事设定、角色、章节与分镜。","Turn a short brief into a story bible, characters, chapters, and scenes."),children:[
    {id:"brief",title:T("故事设定","Story bible"),detail:T("明确世界观、主题、角色约束和风格边界。","Define world, theme, character constraints, and style.")},
    {id:"scenes",title:T("分镜拆解","Scene planning"),detail:T("把章节拆成可独立执行、可审查的场景任务。","Split chapters into independently executable and reviewable scenes.")}
   ]},
   {id:"produce",x:340,y:205,title:T("生产阶段","Production"),sub:T("并行生成资产","Generate assets"),detail:T("以任务为单位并行生产文本与图像，保留每次执行尝试。","Generate text and images in parallel task units while retaining every attempt."),children:[
    {id:"text",title:T("文本生成","Text generation"),detail:T("生成章节、对白和镜头说明，并保留版本。","Generate chapters, dialogue, and shot descriptions with versions.")},
    {id:"image",title:T("图像生成","Image generation"),detail:T("按场景生成图片，记录模型、参数和资产来源。","Generate scene images and record model, parameters, and provenance.")}
   ]},
   {id:"quality",x:340,y:345,title:T("质量阶段","Quality"),sub:T("审核与返工","Review and revise"),detail:T("对生成结果执行结构、内容与视觉质量检查。","Run structural, content, and visual quality checks on generated output."),children:[
    {id:"check",title:T("规则检查","Rule checks"),detail:T("检查字段完整性、格式约束、引用和资源数量。","Check required fields, formatting, references, and asset counts.")},
    {id:"review",title:T("人工复核","Human review"),detail:T("对低置信度或高影响结果进入人工确认。","Route low-confidence or high-impact results to human review.")}
   ]},
   {id:"recover",x:340,y:485,title:T("恢复阶段","Recovery"),sub:T("失败可定位、可续跑","Trace and resume"),detail:T("区分技术失败与质量不合格，使用不同重试和恢复策略。","Separate technical failures from quality rejection and apply different retry/recovery policies."),children:[
    {id:"retry",title:T("失败重试","Retry policy"),detail:T("对限流、网络和模型异常采用退避与次数上限。","Use backoff and attempt limits for rate limits, network, and model failures.")},
    {id:"resume",title:T("断点恢复","Resume"),detail:T("重启后对账任务状态，恢复未完成工作并保留证据。","Reconcile task state after restart and resume unfinished work with evidence.")}
   ]}
  ]
 },
 deploy:{
  title:T("任务编排系统部署拓扑图","Task orchestration deployment topology"),
  desc:T("展示客户端、应用服务、异步工作节点与数据基础设施之间的部署边界和协议。","Shows deployment boundaries and protocols across clients, application services, workers, and data infrastructure."),
  zones:[
   {id:"client",x:20,y:55,w:220,h:450,title:T("接入层","Client zone"),detail:T("用户入口与外部调用方。","User entry points and external callers.")},
   {id:"app",x:260,y:55,w:430,h:450,title:T("应用与执行层","Application zone"),detail:T("承载 API、任务编排、异步执行和模型适配。","Hosts API, orchestration, asynchronous workers, and model adapters.")},
   {id:"data",x:710,y:55,w:370,h:450,title:T("数据基础设施","Data zone"),detail:T("提供缓存、消息投递和持久化能力。","Provides cache, message delivery, and durable storage.")}
  ],
  nodes:[
   {id:"web",zone:"client",x:55,y:135,w:150,h:70,title:T("Web / Mobile","Web / Mobile"),sub:T("用户入口","User entry"),kind:"client",detail:T("接收用户命令、展示运行状态和结果。","Accepts user commands and displays run state and results.")},
   {id:"api",zone:"app",x:300,y:125,w:160,h:72,title:T("API Gateway","API Gateway"),sub:T("认证 · 限流 · 接入","Auth · Rate limit"),kind:"service",detail:T("校验身份、请求参数和幂等键，返回运行查询入口。","Validates identity, request parameters, and idempotency keys.")},
   {id:"orchestrator",zone:"app",x:300,y:275,w:160,h:72,title:T("Orchestrator","Orchestrator"),sub:T("状态机 · 调度","State · Scheduling"),kind:"service",detail:T("协调 Run、Task 与 Attempt 状态，并应用重试和恢复策略。","Coordinates Run, Task, and Attempt state with retry and recovery policies.")},
   {id:"worker",zone:"app",x:500,y:275,w:155,h:72,title:T("Worker Pool","Worker pool"),sub:T("异步任务执行","Async execution"),kind:"worker",detail:T("消费消息、调用模型和工具，并以围栏版本提交执行结果。","Consumes messages, calls models and tools, and commits results with fencing.")},
   {id:"model",zone:"app",x:500,y:420,w:155,h:58,title:T("Model Adapter","Model adapter"),sub:T("外部模型接口","Model API"),kind:"external",detail:T("隔离模型供应商协议、限流和超时策略。","Isolates provider protocols, rate limits, and timeouts.")},
   {id:"redis",zone:"data",x:765,y:135,w:135,h:70,title:T("Redis","Redis"),sub:T("缓存 · 租约心跳","Cache · Lease"),kind:"cache",detail:T("辅助调度、心跳与短期缓存；不作为最终业务事实来源。","Supports scheduling, heartbeats, and short-lived cache; it is not the source of business truth.")},
   {id:"mysql",zone:"data",x:930,y:285,w:125,h:90,title:T("MySQL","MySQL"),sub:T("状态 · Outbox · 证据","State · Outbox"),kind:"database",detail:T("持久化运行状态、任务尝试、围栏版本、Outbox 和产物索引。","Persists run state, attempts, fencing versions, Outbox events, and artifact indexes.")},
   {id:"mq",zone:"data",x:765,y:390,w:135,h:70,title:T("RabbitMQ","RabbitMQ"),sub:T("异步事件","Async events"),kind:"queue",detail:T("承载可重投递的异步事件，消费者以幂等键防止重复副作用。","Carries redeliverable events; consumers use idempotency keys to prevent duplicate effects.")}
  ],
  edges:[
   {from:"web",to:"api",label:T("HTTPS","HTTPS"),d:"M205 170 H300",lx:252,ly:151},
   {from:"api",to:"orchestrator",label:T("REST / Command","REST / Command"),d:"M380 197 V275",lx:445,ly:240},
   {from:"orchestrator",to:"worker",label:T("Task dispatch","Task dispatch"),d:"M460 311 H500",lx:480,ly:290},
   {from:"worker",to:"redis",label:T("Lease / Heartbeat","Lease / Heartbeat"),d:"M655 295 H725 V170 H765",lx:715,ly:220},
   {from:"worker",to:"mysql",label:T("Conditional write","Conditional write"),d:"M655 330 H790 V330 H930",lx:840,ly:311},
   {from:"worker",to:"mq",label:T("Publish / Ack","Publish / Ack"),d:"M580 347 V425 H765",lx:675,ly:405},
   {from:"worker",to:"model",label:T("HTTPS / Timeout","HTTPS / Timeout"),d:"M577 347 V420",lx:635,ly:388}
  ]
 },
 er:{
  title:T("运行任务持久化 ER 图","Run/task persistence ER diagram"),
  desc:T("展示 Run、Task、Attempt 和 Artifact 四个实体及主外键和一对多关系。","Shows Run, Task, Attempt, and Artifact entities with primary/foreign keys and one-to-many relationships."),
  entities:[
   {id:"run",x:40,y:90,w:230,title:T("RUN","RUN"),sub:T("运行实例","Run aggregate"),fields:[["run_id","PK","运行主键","Run identifier"],["status","状态","生命周期状态","Lifecycle state"],["created_at","时间","创建时间","Creation time"]],detail:T("一次业务运行的聚合根。保存全局状态和创建信息。","Aggregate root for one business run; stores overall state and creation metadata.")},
   {id:"task",x:390,y:90,w:245,title:T("TASK","TASK"),sub:T("可独立执行单元","Executable unit"),fields:[["task_id","PK","任务主键","Task identifier"],["run_id","FK","所属运行","Owning run"],["node_key","索引","工作流节点","Workflow node"],["status","状态","任务状态","Task state"]],detail:T("Run 下可独立调度、重试和汇总的任务。","An independently scheduled, retried, and aggregated task within a Run.")},
   {id:"attempt",x:755,y:90,w:245,title:T("ATTEMPT","ATTEMPT"),sub:T("一次执行尝试","Execution attempt"),fields:[["attempt_id","PK","尝试主键","Attempt identifier"],["task_id","FK","所属任务","Owning task"],["fence_version","围栏","执行权版本","Ownership version"],["state","状态","尝试结果","Attempt result"]],detail:T("每次实际执行单独记录，围栏版本用于拒绝过期执行者写入。","Each execution is recorded separately; fencing rejects writes from stale owners.")},
   {id:"artifact",x:390,y:370,w:245,title:T("ARTIFACT","ARTIFACT"),sub:T("执行产物","Produced artifact"),fields:[["artifact_id","PK","产物主键","Artifact identifier"],["task_id","FK","来源任务","Source task"],["uri","地址","产物位置","Artifact location"],["sha256","摘要","内容校验","Content digest"]],detail:T("保存任务产物的定位信息与内容摘要，支持追溯和校验。","Stores artifact location and content digest for traceability and verification.")}
  ],
  relations:[
   {from:"run",to:"task",label:"1 : N",d:"M270 160 H390",lx:330,ly:145,detail:T("一个 Run 可包含多个 Task；每个 Task 必须属于一个 Run。","One Run contains many Tasks; each Task belongs to exactly one Run.")},
   {from:"task",to:"attempt",label:"1 : N",d:"M635 160 H755",lx:695,ly:145,detail:T("一个 Task 可有多次 Attempt；每次 Attempt 只归属一个 Task。","A Task can have multiple Attempts; each Attempt belongs to one Task.")},
   {from:"task",to:"artifact",label:"1 : N",d:"M510 270 V370",lx:565,ly:320,detail:T("一个 Task 可产生多个 Artifact；每个 Artifact 记录来源 Task。","A Task can produce multiple Artifacts; each Artifact records its source Task.")}
  ]
 },
 activity:{
  title:T("异步任务执行活动图","Asynchronous task activity diagram"),
  desc:T("从接收请求到校验、调度、执行和审核，明确正常、拒绝与失败恢复分支。","From request intake through validation, scheduling, execution, and review, including success, rejection, and recovery branches."),
  nodes:[
   {id:"start",kind:"start",x:55,y:285,w:32,h:32,title:T("开始","Start"),detail:T("接收到用户触发的运行请求。","A user-triggered run request is received.")},
   {id:"request",kind:"action",x:125,y:270,w:140,h:62,title:T("接收请求","Receive request"),sub:T("解析输入与幂等键","Parse payload"),detail:T("解析请求并提取幂等键，建立请求上下文。","Parse the payload and idempotency key, then establish request context.")},
   {id:"validate",kind:"action",x:315,y:270,w:140,h:62,title:T("校验参数","Validate input"),sub:T("权限 · 格式 · 配额","Auth · Schema · Quota"),detail:T("校验权限、字段格式、配额和依赖是否可用。","Validate permissions, schema, quota, and dependency readiness.")},
   {id:"valid",kind:"decision",x:505,y:250,w:110,h:100,title:T("参数有效？","Valid?"),detail:T("判断请求是否满足进入工作流的前置条件。","Decide whether the request satisfies workflow preconditions.")},
   {id:"reject",kind:"action",x:690,y:445,w:155,h:65,title:T("返回校验错误","Return validation error"),sub:T("不创建运行实例","No run created"),detail:T("参数不合法时返回明确错误，不创建半成品运行记录。","Return a clear error without creating a partial run.")},
   {id:"create",kind:"action",x:690,y:105,w:155,h:65,title:T("创建 Run","Create Run"),sub:T("Run + Outbox 事务","Run + Outbox"),detail:T("在同一事务创建 Run 和 Outbox 事件。","Create the Run and Outbox event in one transaction.")},
   {id:"dispatch",kind:"action",x:900,y:105,w:155,h:65,title:T("派发 Task","Dispatch tasks"),sub:T("异步消息投递","Async delivery"),detail:T("按节点和并发限制投递任务，重复消息由幂等机制处理。","Dispatch tasks under node and concurrency limits; idempotency handles duplicates.")},
   {id:"execute",kind:"action",x:900,y:285,w:155,h:65,title:T("执行与审核","Execute and review"),sub:T("模型调用 · 质量检查","Model · Quality"),detail:T("执行外部调用并对产物进行质量检查，记录 Attempt 和证据。","Call external services and review artifacts while recording attempts and evidence.")},
   {id:"quality",kind:"decision",x:1115,y:270,w:110,h:100,title:T("质量通过？","Quality pass?"),detail:T("质量不合格与技术异常采用不同的后续策略。","Quality rejection and technical failure use different follow-up policies.")},
   {id:"publish",kind:"action",x:1320,y:105,w:150,h:65,title:T("准备交付","Prepare output"),sub:T("产物索引与追踪","Artifacts"),detail:T("生成交付索引，确保产物可定位、可追溯。","Create a delivery index so artifacts are locatable and traceable.")},
   {id:"retry",kind:"action",x:1320,y:335,w:150,h:65,title:T("重试 / 人工复核","Retry / Human review"),sub:T("按失败类别分流","Classify failure"),detail:T("技术失败进入退避重试；质量失败进入修订或人工复核。","Technical failures use backoff; quality failures go to revision or human review.")},
   {id:"end",kind:"end",x:1550,y:125,w:36,h:36,title:T("完成","Done"),detail:T("运行进入可交付或终态。","The run reaches a deliverable or terminal state.")},
   {id:"errorEnd",kind:"end",x:900,y:465,w:36,h:36,title:T("拒绝","Rejected"),detail:T("请求未通过参数校验。","The request did not pass validation.")}
  ],
  edges:[
   {from:"start",to:"request",label:T("触发","Trigger"),d:"M87 301 H125",lx:106,ly:250},
   {from:"request",to:"validate",label:T("输入","Payload"),d:"M265 301 H315",lx:290,ly:250},
   {from:"validate",to:"valid",label:T("检查完成","Checked"),d:"M455 301 H505",lx:480,ly:250},
   {from:"valid",to:"create",label:T("是 / Yes","Yes"),d:"M560 250 V137 H690",lx:625,ly:120,path:"normal"},
   {from:"valid",to:"reject",label:T("否 / No","No"),d:"M560 350 V477 H690",lx:625,ly:460,path:"reject"},
   {from:"create",to:"dispatch",label:T("提交","Commit"),d:"M845 137 H900",lx:872,ly:88,path:"normal"},
   {from:"dispatch",to:"execute",label:T("消息","Message"),d:"M977 170 V285",lx:1030,ly:230,path:"normal"},
   {from:"execute",to:"quality",label:T("产物","Artifact"),d:"M1055 317 H1115",lx:1085,ly:255,path:"normal"},
   {from:"quality",to:"publish",label:T("通过","Pass"),d:"M1170 270 V137 H1320",lx:1245,ly:120,path:"normal"},
   {from:"quality",to:"retry",label:T("不通过","Reject"),d:"M1170 370 V367 H1320",lx:1245,ly:348,path:"retry"},
   {from:"publish",to:"end",label:T("交付","Deliver"),d:"M1470 137 H1550",lx:1510,ly:117,path:"normal"},
   {from:"reject",to:"errorEnd",label:T("返回错误","Return error"),d:"M845 477 H900",lx:872,ly:425,path:"reject"},
   {from:"retry",to:"end",label:T("重试后完成","Resume"),d:"M1470 367 H1510 V143 H1550",lx:1510,ly:330,path:"retry"}
  ]
 },
 swim:{
  title:T("任务执行跨角色泳道图","Cross-role task execution swimlane"),
  desc:T("按用户、API、Worker 和数据库分离职责，展示请求如何穿过不同责任边界。","Separates User, API, Worker, and Database responsibilities as a request crosses ownership boundaries."),
  lanes:[
   {id:"user",y:65,title:T("用户 / 调用方","User / Caller"),detail:T("发起运行、查看状态和接收结果。","Starts a run, checks status, and receives results.")},
   {id:"api",y:175,title:T("API 服务","API service"),detail:T("负责身份、参数校验、幂等和运行入口。","Owns identity, validation, idempotency, and run intake.")},
   {id:"worker",y:285,title:T("Worker","Worker"),detail:T("负责消费、执行、重试和结果提交。","Owns consumption, execution, retry, and result commit.")},
   {id:"db",y:395,title:T("持久化层","Persistence"),detail:T("负责事务状态、Outbox 与执行证据。","Owns transactional state, Outbox, and execution evidence.")}
  ],
  nodes:[
   {id:"submit",lane:"user",x:205,y:90,w:145,h:58,title:T("提交运行请求","Submit run"),detail:T("调用方提交参数和幂等键。","Caller submits payload and idempotency key.")},
   {id:"accept",lane:"api",x:390,y:200,w:145,h:58,title:T("校验并接收","Validate & accept"),detail:T("API 验证权限、参数并确认幂等语义。","API validates permissions and payload and enforces idempotency.")},
   {id:"create",lane:"api",x:690,y:200,w:145,h:58,title:T("创建 Run","Create Run"),detail:T("API 事务创建运行实例和 Outbox 事件。","API transaction creates the run and Outbox event.")},
   {id:"consume",lane:"worker",x:390,y:310,w:145,h:58,title:T("消费事件","Consume event"),detail:T("Worker 接收可重投递消息并检查任务状态。","Worker receives a redeliverable event and checks task state.")},
   {id:"execute",lane:"worker",x:690,y:310,w:145,h:58,title:T("执行 Task","Execute task"),detail:T("Worker 调用工具或模型并保存 Attempt 证据。","Worker calls tools or models and records Attempt evidence.")},
   {id:"persist",lane:"db",x:690,y:420,w:145,h:58,title:T("提交结果","Commit result"),detail:T("条件更新校验 fencing token 后持久化任务结果。","Conditional update validates the fencing token before persisting the result.")},
   {id:"respond",lane:"user",x:875,y:90,w:145,h:58,title:T("查看运行状态","View run state"),detail:T("调用方按 runId 查询运行状态与结果。","Caller queries run state and output by runId.")}
  ],
  edges:[
   {from:"submit",to:"accept",label:T("HTTPS","HTTPS"),d:"M350 119 H370 V229 H390",lx:370,ly:170},
   {from:"accept",to:"create",label:T("校验通过","Validated"),d:"M535 229 H690",lx:612,ly:209},
   {from:"create",to:"consume",label:T("Outbox / MQ","Outbox / MQ"),d:"M762 258 V285 H462 V310",lx:610,ly:270},
   {from:"consume",to:"execute",label:T("领取任务","Claim"),d:"M535 339 H690",lx:612,ly:319},
   {from:"execute",to:"persist",label:T("结果 + Token","Result + Token"),d:"M762 368 V420",lx:840,ly:398},
   {from:"persist",to:"respond",label:T("状态查询","Status query"),d:"M835 449 H1040 V119 H1020",lx:950,ly:432}
  ]
 },
 component:{
  title:T("任务编排系统组件与依赖图","Task orchestration component and dependency diagram"),
  desc:T("展示 UI、API、编排器、调度器、消息队列、缓存和数据库之间的接口与依赖。","Shows interfaces and dependencies among UI, API, orchestrator, scheduler, queue, cache, and database."),
  zones:[
   {id:"edge",x:20,y:55,w:220,h:440,title:T("接入组件","Entry components")},
   {id:"core",x:260,y:55,w:455,h:440,title:T("核心业务组件","Core components")},
   {id:"infra",x:735,y:55,w:350,h:440,title:T("基础设施组件","Infrastructure")}
  ],
  nodes:[
   {id:"ui",zone:"edge",x:55,y:130,w:150,h:72,title:T("Web UI","Web UI"),sub:T("交互与状态展示","Interaction"),ports:["REST"],detail:T("展示运行状态、任务列表、日志和交付物。","Presents run state, task lists, logs, and deliverables.")},
   {id:"api",zone:"core",x:300,y:130,w:160,h:72,title:T("API Controller","API controller"),sub:T("请求与权限边界","Request boundary"),ports:["REST","Command"],detail:T("对外暴露受权限保护的命令和查询接口。","Exposes permission-guarded command and query interfaces.")},
   {id:"orchestrator",zone:"core",x:300,y:290,w:160,h:72,title:T("Run Orchestrator","Run orchestrator"),sub:T("状态机与恢复","State & Recovery"),ports:["Command","Event"],detail:T("管理 Run、Task 状态汇总、重试和恢复策略。","Manages Run and Task state aggregation, retries, and recovery.")},
   {id:"scheduler",zone:"core",x:520,y:290,w:160,h:72,title:T("Task Scheduler","Task scheduler"),sub:T("并发与租约","Concurrency"),ports:["Event","Lease"],detail:T("控制并发、领取任务和执行权租约。","Controls concurrency, task claiming, and execution leases.")},
   {id:"redis",zone:"infra",x:785,y:110,w:135,h:72,title:T("Redis","Redis"),sub:T("Lease / Cache","Lease / Cache"),ports:["Lease"],detail:T("保存短期租约、心跳和缓存数据。","Stores short-lived leases, heartbeats, and cache data.")},
   {id:"mq",zone:"infra",x:785,y:250,w:135,h:72,title:T("RabbitMQ","RabbitMQ"),sub:T("Event transport","Event transport"),ports:["Event"],detail:T("负责异步事件传输和重投递。","Transports asynchronous events and redeliveries.")},
   {id:"db",zone:"infra",x:785,y:390,w:135,h:72,title:T("MySQL","MySQL"),sub:T("Source of truth","Source of truth"),ports:["SQL"],detail:T("持久化业务状态、Outbox、Attempt 和 Artifact 索引。","Persists business state, Outbox, attempts, and artifact indexes.")}
  ],
  edges:[
   {from:"ui",to:"api",label:T("HTTPS / JSON","HTTPS / JSON"),d:"M205 166 H300",lx:252,ly:110},
   {from:"api",to:"orchestrator",label:T("Command","Command"),d:"M380 202 V290",lx:435,ly:247},
   {from:"orchestrator",to:"scheduler",label:T("Dispatch event","Dispatch event"),d:"M460 326 H520",lx:490,ly:270},
   {from:"scheduler",to:"mq",label:T("Publish / Consume","Publish / Consume"),d:"M680 326 H745 V286 H785",lx:746,ly:235},
   {from:"orchestrator",to:"redis",label:T("Lease check","Lease check"),d:"M460 305 H735 V146 H785",lx:610,ly:270},
   {from:"scheduler",to:"db",label:T("SQL / Fencing","SQL / Fencing"),d:"M600 362 V426 H785",lx:690,ly:405},
   {from:"orchestrator",to:"db",label:T("State / Outbox","State / Outbox"),d:"M380 362 V465 H760 V426 H785",lx:575,ly:452}
  ]
 }
 };
 function svg(tag,attrs,parent,content){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null)n.setAttribute(k,String(v));});if(content!==undefined)n.textContent=content;if(parent)parent.appendChild(n);return n;}
 function html(tag,cls,parent,content){const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;if(parent)parent.appendChild(n);return n;}
 const ICON={
  plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4-4M8 11h6M11 8v6"/></svg>',
  minus:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4-4M8 11h6"/></svg>',
  fit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>',
  expand:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M3 3l7 7M16 3h5v5m0-5-7 7M21 16v5h-5m5 0-7-7M8 21H3v-5m0 5 7-7"/></svg>',
  collapse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8H3m5 0V3m8 5h5m-5 0V3m0 13h5m-5 0v5M8 16H3m5 0v5"/></svg>',
  layout:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="8" height="6" rx="1"/><rect x="13" y="14" width="8" height="6" rx="1"/><path d="M11 7h4v4m-4 6H7v-3"/></svg>',
  prev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg>',
  next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7"/></svg>',
  fields:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M10 10v9M14 14h4"/></svg>',
  ports:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="7" height="8" rx="1"/><rect x="14" y="8" width="7" height="8" rx="1"/><path d="M10 12h4M7 8V4M17 8V4M7 16v4M17 16v4"/></svg>',
  "path-normal":'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h8l3-4h5M15 8l3-3M15 8l3 3"/><circle cx="4" cy="12" r="2"/></svg>',
  "path-retry":'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h9a6 6 0 1 1-5.8 7.5M5 7l4-4M5 7l4 4"/></svg>',
  "path-all":'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h5l4-5h7M9 12l4 5h7M18 5l2 2-2 2M18 15l2 2-2 2"/></svg>',
  lanes:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/></svg>',
  zones:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>',
  "expand-all":'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M10 12h4M12 10v4"/></svg>',
 };
 function btn(parent,action,label,icon){const b=html("button","semantic-tool",parent);b.type="button";b.dataset.action=action;b.setAttribute("aria-label",label);b.title=label;b.innerHTML=icon||"";if(!icon)b.textContent=label;return b;}
 function fitSvgLabel(node,fullText,maxWidth){
  node.textContent=fullText;
  if(node.getComputedTextLength()<=maxWidth)return;
  const chars=Array.from(fullText);let low=0,high=chars.length;
  while(low<high){const middle=Math.ceil((low+high)/2);node.textContent=chars.slice(0,middle).join("")+"…";if(node.getComputedTextLength()<=maxWidth)low=middle;else high=middle-1;}
  node.textContent=chars.slice(0,low).join("")+"…";
  const title=svg("title",{},node,fullText);title.setAttribute("data-full-label","true");
 }
 function labelWidth(value,lang){return Math.max(44,[...value].reduce((n,c)=>n+(c.charCodeAt(0)>255?12:7),0)+18);}
 function edge(svgRoot,spec,lang,defs){
  const edgeIndex=Number(svgRoot.dataset.edgeCount||0);svgRoot.dataset.edgeCount=String(edgeIndex+1);const uniqueId="edge-"+(spec.id??svgRoot.dataset.markerId+"-"+edgeIndex);
   const g=svg("g",{class:"semantic-edge", "data-selectable":"true","data-id":uniqueId,"data-source":spec.from,"data-target":spec.to,"data-kind":"relationship","data-title":text(spec.label,lang),"data-summary":text(spec.detail||T("该连线表示两个元素之间的关系。","This connector represents a relationship between two elements."),lang),"tabindex":"0","role":"button"},svgRoot);
  svg("path",{d:spec.d,fill:"none",stroke:"#748aa5","stroke-width":"2.2","stroke-linecap":"round","stroke-linejoin":"round","marker-end":"url(#"+svgRoot.dataset.markerId+")","stroke-dasharray":spec.dashed?"6 5":null},g);
  const value=text(spec.label,lang);
  if(value){const w=labelWidth(value,lang),x=spec.lx-w/2,y=spec.ly-11;const chip=svg("g",{class:"semantic-edge-chip","data-selectable":"true","data-id":g.dataset.id,"data-source":spec.from,"data-target":spec.to,"data-kind":"relationship","data-title":g.dataset.title,"data-summary":g.dataset.summary,"data-detail":text(spec.detail||spec.label,lang),"data-base-x":spec.lx,"data-base-y":spec.ly,"data-label-span":spec.labelSpan||"",tabindex:"0",role:"button","aria-label":value},svgRoot);svg("rect",{class:"semantic-edge-label-bg",x,y,width:w,height:22,rx:6,fill:"#fff",stroke:"#d0d5dd","stroke-width":"1"},chip);svg("text",{class:"semantic-edge-label",x:spec.lx,y:spec.ly+4,"text-anchor":"middle","font-size":"12","font-family":"system-ui,sans-serif",fill:"#344054"},chip,value);svg("title",{},chip,value);if(spec.messageIndex!==undefined){g.dataset.messageIndex=spec.messageIndex;chip.dataset.messageIndex=spec.messageIndex;}if(spec.path){g.dataset.path=spec.path;chip.dataset.path=spec.path;}}
  return g;
 }
 function selectable(g,id,kind,title,summary,detail){g.dataset.selectable="true";g.dataset.id=id;g.dataset.kind=kind;g.dataset.title=text(title,window.__genUiLang);g.dataset.summary=text(summary||title,window.__genUiLang);g.dataset.detail=text(detail||summary||title,window.__genUiLang);g.setAttribute("tabindex","0");g.setAttribute("role","button");g.setAttribute("aria-label",g.dataset.title);}
 function boxNode(root,n,lang,opts){
  const g=svg("g",{class:"semantic-node semantic-node-"+(opts?.kind||"service"),transform:"translate("+n.x+" "+n.y+")","data-x":n.x,"data-y":n.y,"data-w":n.w,"data-h":n.h},root);
  selectable(g,n.id,opts?.kind||"component",n.title,n.sub,n.detail);
  svg("rect",{class:"semantic-node-shape",width:n.w,height:n.h,rx:opts?.radius||9,fill:opts?.fill||"#f5f9ff",stroke:opts?.stroke||"#9dbce3","stroke-width":"1.6"},g);
  fitSvgLabel(svg("text",{x:n.w/2,y:n.sub?26:n.h/2+5,"text-anchor":"middle","font-size":"14","font-weight":"650",fill:"#1a1c1f","font-family":"system-ui,sans-serif"},g),text(n.title,lang),Math.max(15,n.w-20));
  if(n.sub)fitSvgLabel(svg("text",{x:n.w/2,y:46,"text-anchor":"middle","font-size":"11",fill:"#667085","font-family":"system-ui,sans-serif"},g),text(n.sub,lang),Math.max(15,n.w-20));
  if(n.ports){n.ports.forEach((port,i)=>{const p=svg("g",{class:"semantic-port","data-port":"true"},g);svg("circle",{cx:n.w-10,cy:16+i*15,r:4,fill:"#fff",stroke:"#3a83f7","stroke-width":"1.4"},p);svg("title",{},p,text(T("接口：","Port: "),lang)+port);});}
  return g;
 }
 function actorNode(root,p,lang,x,height){
  const g=svg("g",{class:"semantic-node semantic-actor","transform":"translate("+(x-68)+" 28)"},root);selectable(g,p.id,"participant",p.name,p.sub,T("参与者，点击可高亮其生命线及相关消息。","Participant; click to highlight its lifeline and related messages."));
  svg("rect",{width:136,height:54,rx:8,fill:"#eff6ff",stroke:"#7aa8e8","stroke-width":"1.6"},g);
  fitSvgLabel(svg("text",{x:68,y:23,"text-anchor":"middle","font-size":"14","font-weight":"650",fill:"#1a1c1f"},g),text(p.name,lang),116);
  fitSvgLabel(svg("text",{x:68,y:42,"text-anchor":"middle","font-size":"10.5",fill:"#667085"},g),text(p.sub,lang),116);
  svg("line",{class:"semantic-lifeline",x1:68,y1:54,x2:68,y2:height-30,stroke:"#9aa9bb","stroke-dasharray":"5 5","stroke-width":"1.5"},g);
  return g;
 }
 function entityNode(root,e,lang,showFields){
  const height=46+e.fields.length*29+10,g=svg("g",{class:"semantic-node semantic-entity","transform":"translate("+e.x+" "+e.y+")","data-x":e.x,"data-y":e.y,"data-w":e.w,"data-h":height},root);
  selectable(g,e.id,"entity",e.title,e.sub,e.detail);
  svg("rect",{class:"semantic-node-shape",width:e.w,height,rx:7,fill:"#fff",stroke:"#8ba8cc","stroke-width":"1.5"},g);
  svg("rect",{width:e.w,height:46,rx:7,fill:"#eaf2ff",stroke:"#8ba8cc","stroke-width":"1.3"},g);
  svg("path",{d:"M0 39 H"+e.w,stroke:"#8ba8cc","stroke-width":"1"},g);
  fitSvgLabel(svg("text",{x:14,y:20,"font-size":"14","font-weight":"750",fill:"#1a1c1f"},g),text(e.title,lang),Math.max(15,e.w-28));
  if(e.sub)fitSvgLabel(svg("text",{x:14,y:36,"font-size":"10.5",fill:"#667085"},g),text(e.sub,lang),Math.max(15,e.w-28));
  e.fields.forEach((f,i)=>{
   const row=svg("g",{class:"semantic-field","data-field":"true","data-field-type":f[1],"data-entity":e.id,transform:"translate(0 "+(46+i*29)+")"},g);
   selectable(row,e.id+"-"+f[0],"field",T(f[0],f[0]),T(f[2],f[3]),T("字段类型："+f[1]+"；所属实体："+text(e.title,lang),"Field type: "+f[1]+"; entity: "+text(e.title,lang)));
   svg("rect",{x:1,y:0,width:e.w-2,height:28,fill:i%2?"#fbfcfe":"#fff",stroke:"#eef1f5","stroke-width":".6"},row);
   fitSvgLabel(svg("text",{x:12,y:18,"font-size":"11.5","font-family":"ui-monospace,monospace",fill:"#344054"},row),f[0],Math.max(15,e.w-62));
   svg("text",{x:e.w-12,y:18,"font-size":"10","text-anchor":"end","font-weight":"700",fill:f[1]==="PK"?"#23764f":f[1]==="FK"?"#3a83f7":"#667085"},row,f[1]);
  });
  return g;
 }
 function measureEdgeText(value,lang){
 const str=text(value,lang),canvas=measureEdgeText.canvas||(measureEdgeText.canvas=document.createElement("canvas"));
 const context=canvas.getContext("2d");
 if(!context)return [...str].reduce((n,c)=>n+(c.codePointAt(0)>255?12:7),0);
 context.font="12px system-ui, sans-serif";
 return Math.ceil(context.measureText(str).width);
}
function sequencePositions(m,lang){
 const index=new Map(m.participants.map((p,i)=>[p.id,i]));
 const gaps=Array(Math.max(0,m.participants.length-1)).fill(210);
 // All directed messages constrain their full span (adjacent, reverse and cross-participant).
 const constraints=m.messages.filter(msg=>index.has(msg.from)&&index.has(msg.to)&&msg.from!==msg.to)
  .map(msg=>{
   const from=index.get(msg.from),to=index.get(msg.to);
   return {lo:Math.min(from,to),hi:Math.max(from,to),need:Math.min(1800,measureEdgeText(msg.label,lang)+80)};
  }).sort((a,b)=>(a.hi-a.lo)-(b.hi-b.lo));
 for(const c of constraints){
  const current=gaps.slice(c.lo,c.hi).reduce((sum,n)=>sum+n,0);
  if(current>=c.need)continue;
  const delta=(c.need-current)/(c.hi-c.lo);
  for(let k=c.lo;k<c.hi;k++)gaps[k]+=delta;
 }
 const xs=[145];for(const gap of gaps)xs.push(xs[xs.length-1]+gap);
 return xs;
}
function renderSequence(root,m,lang,height,xs){
  const map={};m.participants.forEach((p,i)=>map[p.id]=xs[i]);
  m.participants.forEach((p,i)=>actorNode(root,p,lang,xs[i],height));
  m.participants.slice(1).forEach(p=>{const msgs=m.messages.map((x,i)=>({from:x.from,to:x.to,y:x.y??155+i*75})).filter(x=>x.from===p.id||x.to===p.id);if(!msgs.length)return;const from=Math.min(...msgs.map(x=>x.y)),to=Math.max(...msgs.map(x=>x.y));svg("rect",{class:"semantic-activation",x:map[p.id]-6,y:from+10,width:12,height:Math.max(32,to-from-10),rx:3,fill:"#dceafe",stroke:"#5b91d6","stroke-width":"1"},root);});
  m.messages.forEach((msg,i)=>{
   const x1=map[msg.from],x2=map[msg.to],y=msg.y??155+i*75,ret=msg.kind==="return",self=msg.from===msg.to;
   const loopWidth=64,labelWidth=measureEdgeText(msg.label,lang),d=self?("M"+x1+" "+y+" H"+(x1+loopWidth)+" V"+(y+26)+" H"+(x1+2)):("M"+x1+" "+y+" H"+x2);
    // Keep the self-call loop compact; place its full message label in a dedicated right-side span.
    const edgeSpec={from:msg.from,to:msg.to,label:msg.label,lx:self?x1+loopWidth+18+labelWidth/2:(x1+x2)/2,ly:y-17,d,dashed:ret,detail:msg.detail,messageIndex:i,labelSpan:self?labelWidth+32:Math.abs(x2-x1)};
   const g=edge(root,edgeSpec,lang);g.dataset.messageIndex=i;g.dataset.kind="message";g.dataset.title=text(msg.label,lang);g.dataset.summary=text(T("消息类型："+(ret?"返回":msg.kind==="async"?"异步":"同步"),"Message type: "+(ret?"return":msg.kind),lang),lang);g.dataset.detail=text(msg.detail,lang);
   if(msg.kind==="async")g.querySelector("path").setAttribute("stroke","#3a83f7");
  });
 }
 function renderMind(root,m,lang){
  const r=m.root;boxNode(root,{...r},lang,{kind:"goal",fill:"#e8f2ff",stroke:"#3a83f7",radius:16});
  m.branches.forEach((b,i)=>{
   const by=b.y+24;
   const x1=r.x+r.w,x2=b.x,mid=x1+(x2-x1)/2;const path="M"+x1+" "+(r.y+r.h/2)+" C"+mid+" "+(r.y+r.h/2)+", "+mid+" "+by+", "+x2+" "+by;
   edge(root,{from:r.id,to:b.id,label:"",d:path,detail:b.detail},lang);
   const g=boxNode(root,{id:b.id,x:b.x,y:b.y,w:185,h:68,title:b.title,sub:b.sub,detail:b.detail},lang,{kind:"branch",fill:["#eef6ff","#eef9f1","#fff7eb","#f4f0ff"][i],stroke:["#8db4e8","#8ac5a0","#e5bd79","#b4a0e3"][i]});
   const toggle=svg("g",{class:"semantic-branch-toggle","data-toggle-branch":b.id,"data-expanded":"true","aria-expanded":"true",role:"button",tabindex:"0","aria-label":text(T("展开或折叠","Expand or collapse"),lang)},g);
   svg("circle",{cx:166,cy:34,r:10,fill:"#fff",stroke:"#8a9bb0"},toggle);
   svg("path",{d:"M161 34h10",stroke:"#475467","stroke-width":"1.5"},toggle);
   b.children.forEach((c,j)=>{
    const cy=c.y??b.y+12+j*58,cx=c.x??b.x+310;
    const branchEdge=svg("g",{class:"semantic-branch-edge","data-parent":b.id},root);svg("path",{d:"M"+(b.x+185)+" "+by+" H"+(b.x+245)+" V"+(cy+22)+" H"+cx,fill:"none",stroke:"#b0bdcd","stroke-width":"1.6"},branchEdge);
    const child=boxNode(root,{id:c.id,x:cx,y:cy,w:225,h:44,title:c.title,sub:null,detail:c.detail},lang,{kind:"leaf",fill:"#fff",stroke:"#c7d1dd",radius:7});
    child.dataset.parent=b.id;child.classList.add("semantic-branch-child");
   });
  });
 }
 function zone(root,z,lang){
  const g=svg("g",{class:"semantic-zone","data-zone-toggle":z.id,"data-selectable":"true","data-id":"zone-"+z.id,"data-kind":"boundary","data-title":text(z.title,lang),"data-summary":text(z.detail||z.title,lang),"data-detail":text(z.detail||z.title,lang),role:"button",tabindex:"0"},root);
  svg("rect",{x:z.x,y:z.y,width:z.w,height:z.h,rx:12,fill:"#f8fafc",stroke:"#b8c7d8","stroke-dasharray":"7 5","stroke-width":"1.5"},g);
  svg("text",{x:z.x+14,y:z.y+25,"font-size":"13","font-weight":"700",fill:"#475467"},g,text(z.title,lang));
  svg("text",{x:z.x+z.w-18,y:z.y+25,"font-size":"16","text-anchor":"end",fill:"#3a83f7","data-zone-glyph":"true"},g,"−");
 }
 function renderDeploy(root,m,lang){
  m.zones.forEach(z=>zone(root,z,lang));
  m.edges.forEach(e=>edge(root,e,lang));
  m.nodes.forEach(n=>{const group=svg("g",{"data-zone-content":n.zone},root);boxNode(group,n,lang,{kind:n.kind,fill:n.kind==="database"?"#fff7eb":n.kind==="cache"?"#eef9f1":n.kind==="external"?"#f5f0ff":"#f5f9ff",stroke:n.kind==="database"?"#d8a65b":"#9dbce3",radius:n.kind==="database"?18:9});});
 }
 function renderER(root,m,lang){
  m.relations.forEach(e=>edge(root,e,lang));
  m.entities.forEach(e=>entityNode(root,e,lang,true));
 }
 function diamond(root,n,lang){
  const g=svg("g",{class:"semantic-node semantic-decision",transform:"translate("+n.x+" "+n.y+")","data-x":n.x,"data-y":n.y,"data-w":n.w,"data-h":n.h},root);
  selectable(g,n.id,"decision",n.title,n.sub,n.detail);
  svg("polygon",{class:"semantic-node-shape",points:(n.w/2)+",0 "+n.w+","+ (n.h/2)+" "+(n.w/2)+","+n.h+" 0,"+(n.h/2),fill:"#fff7eb",stroke:"#d8a65b","stroke-width":"1.7"},g);
  svg("text",{x:n.w/2,y:n.h/2+5,"text-anchor":"middle","font-size":"13","font-weight":"700",fill:"#7a541b"},g,text(n.title,lang));
 }
 function circleNode(root,n,lang){
  const g=svg("g",{class:"semantic-node semantic-terminal",transform:"translate("+n.x+" "+n.y+")"},root);
  selectable(g,n.id,"terminal",n.title,n.title,n.detail);
  svg("circle",{class:"semantic-node-shape",cx:n.w/2,cy:n.h/2,r:n.w/2-2,fill:n.kind==="start"?"#e9f8ef":"#fff",stroke:n.kind==="start"?"#3b9a69":"#667085","stroke-width":"3"},g);
  if(n.kind==="end")svg("circle",{cx:n.w/2,cy:n.h/2,r:n.w/2-7,fill:"none",stroke:"#667085","stroke-width":"1.4"},g);
 }
 function renderActivity(root,m,lang){
  m.edges.forEach(e=>edge(root,e,lang));
  const inferred=new Map();for(const e of m.edges){if(!e.path)continue;for(const id of [e.from,e.to]){if(!inferred.has(id))inferred.set(id,new Set());inferred.get(id).add(e.path);}}
  m.nodes.forEach(n=>{if(n.kind==="decision")diamond(root,n,lang);else if(n.kind==="start"||n.kind==="end")circleNode(root,n,lang);else boxNode(root,n,lang,{kind:"activity",fill:"#f5f9ff",stroke:"#9dbce3"});const g=root.querySelector('[data-id="'+n.id+'"]');if(g){const paths=n.paths??(n.path?[n.path]:[...(inferred.get(n.id)??[])]);g.dataset.paths=paths.join(",");}});
 }
 function lane(root,l,lang){
  const g=svg("g",{class:"semantic-lane","data-lane-toggle":l.id,"data-selectable":"true","data-id":"lane-"+l.id,"data-kind":"lane","data-title":text(l.title,lang),"data-summary":text(l.detail,lang),"data-detail":text(l.detail,lang),role:"button",tabindex:"0"},root);
  svg("rect",{x:20,y:l.y,width:1020,height:104,rx:7,fill:"#fbfcfe",stroke:"#d5dde7","stroke-width":"1"},g);
  svg("rect",{x:20,y:l.y,width:150,height:104,rx:7,fill:"#eef3f9",stroke:"#d5dde7"},g);
  svg("text",{x:95,y:l.y+43,"text-anchor":"middle","font-size":"13","font-weight":"700",fill:"#344054"},g,text(l.title,lang));
  svg("text",{x:95,y:l.y+64,"text-anchor":"middle","font-size":"10","fill":"#667085"},g,text(T("职责泳道","Responsibility"),lang));
 }
 function renderSwim(root,m,lang){
  m.lanes.forEach(l=>lane(root,l,lang));
  m.edges.forEach(e=>edge(root,e,lang));
  m.nodes.forEach(n=>{const group=svg("g",{"data-lane-content":n.lane},root);boxNode(group,n,lang,{kind:"task",fill:"#fff",stroke:"#91a8c5"});});
 }
 function renderComponent(root,m,lang){
  m.zones.forEach(z=>zone(root,z,lang));
  m.edges.forEach(e=>edge(root,e,lang));
  m.nodes.forEach(n=>{const group=svg("g",{"data-zone-content":n.zone},root);boxNode(group,n,lang,{kind:"component",fill:"#fff",stroke:"#8ba8cc"});});
 }
 function render(model,type,root,lang){
  const requestedWidth=model.canvas?.width??(type==="sequence"?960:type==="mind"?920:type==="deploy"?1100:type==="er"?1040:type==="activity"?1640:type==="swim"?1060:1100);
   const sequenceXs=type==="sequence"?sequencePositions(model,lang):null;
   const selfLabelRight=type==="sequence"?Math.max(0,...model.messages.filter(msg=>msg.from===msg.to).map(msg=>{const participantIndex=model.participants.findIndex(p=>p.id===msg.from);return sequenceXs[participantIndex]+64+18+measureEdgeText(msg.label,lang)+40;})):0;
   const w=type==="sequence"?Math.max(requestedWidth,sequenceXs[sequenceXs.length-1]+110,selfLabelRight):requestedWidth;
  const requestedHeight=model.canvas?.height??(type==="sequence"?620:type==="mind"?590:type==="deploy"?560:type==="er"?560:type==="activity"?590:type==="swim"?535:550);
   const h=type==="sequence"?Math.max(requestedHeight,Math.max(...model.messages.map((m,i)=>m.y??155+i*75))+95):requestedHeight;
  const svgRoot=svg("svg",{class:"semantic-svg",viewBox:"0 0 "+w+" "+h,role:"img","aria-label":text(model.title,lang),"preserveAspectRatio":"xMinYMin meet"},root);
  svg("title",{},svgRoot,text(model.title,lang));svg("desc",{},svgRoot,text(model.desc,lang));
  const markerId="semantic-arrow-"+type+"-"+(++instanceCounter);svgRoot.dataset.markerId=markerId;const defs=svg("defs",{},svgRoot),marker=svg("marker",{id:markerId,viewBox:"0 0 10 10",markerWidth:"7",markerHeight:"7",refX:"9",refY:"5",orient:"auto"},defs);svg("path",{d:"M0 0 L9 5 L0 10 Z",fill:"#627a95"},marker);
  if(type==="sequence")renderSequence(svgRoot,model,lang,h,sequenceXs);
  if(type==="mind")renderMind(svgRoot,model,lang);
  if(type==="deploy")renderDeploy(svgRoot,model,lang);
  if(type==="er")renderER(svgRoot,model,lang);
  if(type==="activity")renderActivity(svgRoot,model,lang);
  if(type==="swim")renderSwim(svgRoot,model,lang);
  if(type==="component")renderComponent(svgRoot,model,lang);
  svgRoot.querySelectorAll(".semantic-edge-chip").forEach(chip=>svgRoot.appendChild(chip));
  return {svg:svgRoot,w,h};
 }

 function layoutLabels(svgRoot,graph){
  const matrix=svgRoot.getScreenCTM();
  if(!matrix||svgRoot.getBoundingClientRect().width<1)return;
  const inverse=matrix.inverse();
  const point=(x,y)=>new DOMPoint(x,y).matrixTransform(inverse);
  const box=n=>{
   const r=n.getBoundingClientRect(),a=point(r.left,r.top),b=point(r.right,r.bottom);
   return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};
  };
  const collide=(a,b,pad=5)=>a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;
  const nodes=[...svgRoot.querySelectorAll(".semantic-node-shape,.semantic-actor>rect")].filter(n=>n.getClientRects().length&&n.getBoundingClientRect().width>0).map(box);
  const chips=[...svgRoot.querySelectorAll(".semantic-edge-chip")].filter(n=>!n.classList.contains("is-hidden"));const fallback=svgRoot.closest(".genui-semantic-diagram")?.querySelector(".semantic-label-fallbacks");if(fallback)fallback.replaceChildren();
  const arrowTips=[...svgRoot.querySelectorAll(".semantic-edge path[marker-end]")].flatMap(path=>{
    try{const length=path.getTotalLength(),tip=path.getPointAtLength(length),unitPixels=Math.max(.02,Math.hypot(matrix.a,matrix.b)),margin=Math.min(220,Math.max(22,18/unitPixels));return [{x:tip.x-margin,y:tip.y-margin,w:margin*2,h:margin*2}];}
    catch{return [];}
   });const placed=[];
  const offsets=[0,-28,28,-56,56,-84,84,-112,112,-140,140,-168,168,-196,196,-224,224,-252,252];
  const candidates=offsets.flatMap(dy=>offsets.map(dx=>({dx,dy,cost:dx*dx+dy*dy*1.06}))).sort((a,b)=>a.cost-b.cost);
  for(const chip of chips){
   chip.classList.remove("is-layout-fallback");const bg=chip.querySelector(".semantic-edge-label-bg"),caption=chip.querySelector(".semantic-edge-label");
   if(!bg||!caption)continue;
   const fullText=chip.querySelector("title")?.textContent||caption.textContent;caption.textContent=fullText;
   const available=Number(chip.dataset.labelSpan)||244;const maxWidth=Math.min(Math.max(44,available-28),graph.w-40);const chars=Array.from(fullText);
   if(caption.getComputedTextLength()>maxWidth){let lo=0,hi=chars.length;while(lo<hi){const mid=Math.ceil((lo+hi)/2);caption.textContent=chars.slice(0,mid).join("")+"…";if(caption.getComputedTextLength()<=maxWidth)lo=mid;else hi=mid-1;}caption.textContent=chars.slice(0,lo).join("")+"…";}
   chip.dataset.truncated=String(caption.textContent!==fullText);const w=Math.max(36,Math.ceil(caption.getComputedTextLength()+20)),h=22;
   const cx=Number(chip.dataset.baseX),cy=Number(chip.dataset.baseY);
   bg.setAttribute("width",w);
   let best=null;
   for(const {dx,dy} of candidates){
    const cx2=cx+dx,cy2=cy+dy;
    const r={x:cx2-w/2,y:cy2-h/2,w,h};
    if(r.x<5||r.y<5||r.x+r.w>graph.w-5||r.y+r.h>graph.h-5)continue;
    if(nodes.some(n=>collide(r,n))||arrowTips.some(n=>collide(r,n,2))||placed.some(n=>collide(r,n)))continue;
    best={cx:cx2,cy:cy2,rect:r};break;
   }
   chip.dataset.layoutOk=String(!!best);
   if(!best){chip.dataset.layoutOk="fallback";chip.classList.add("is-layout-fallback");if(fallback){const button=html("button","semantic-fallback-link",fallback,fullText);button.type="button";button.title=fullText;button.addEventListener("click",()=>{const e=[...svgRoot.querySelectorAll(".semantic-edge")].find(n=>n.dataset.id===chip.dataset.id);e?.dispatchEvent(new MouseEvent("click",{bubbles:true}));});}continue;}
   bg.setAttribute("x",best.rect.x);
   bg.setAttribute("y",best.rect.y);
   caption.setAttribute("x",best.cx);
   caption.setAttribute("y",best.cy+4);
   placed.push(best.rect);
  }
  if(fallback)fallback.hidden=fallback.childElementCount===0;
 }


 function validateModel(type,m){
  const fail=reason=>({ok:false,error:reason});
  const validText=x=>typeof x==="string"?x.length>0&&x.length<=300:!!x&&typeof x==="object"&&["zh","en"].every(lang=>typeof x[lang]==="string"&&x[lang].length>0&&x[lang].length<=300);
  const array=(x,max=100)=>Array.isArray(x)&&x.length>0&&x.length<=max;
  const id=x=>typeof x==="string"&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(x);
  const num=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=10000;
  const xy=n=>n&&num(n.x)&&num(n.y);
  const wh=n=>n&&num(n.w)&&num(n.h)&&n.w>=20&&n.h>=20;
  const shape=n=>n&&id(n.id)&&validText(n.title)&&xy(n)&&wh(n);
  if(!m||typeof m!=="object"||Array.isArray(m)||!validText(m.title)||!validText(m.desc))return fail("title/desc");
  if(m.canvas&&(!num(m.canvas.width)||!num(m.canvas.height)||m.canvas.width<300||m.canvas.height<200||m.canvas.width>4096||m.canvas.height>4096))return fail("canvas");
  const listName={sequence:"participants",mind:"branches",deploy:"nodes",er:"entities",activity:"nodes",swim:"nodes",component:"nodes"}[type];
  if(!listName||!array(m[listName]))return fail(listName||"type");
  const collections=[];
  if(type==="sequence"){
   if(!array(m.participants,24)||!array(m.messages,80)||!m.participants.every(n=>id(n.id)&&validText(n.name)))return fail("participants/messages");
   collections.push(...m.participants);
   if(!m.messages.every(n=>id(n.from)&&id(n.to)&&validText(n.label)&&(!n.kind||["sync","async","return"].includes(n.kind))&&(!("y" in n)||num(n.y))))return fail("messages");
  }else if(type==="mind"){
   if(!shape(m.root)||!m.branches.every(n=>id(n.id)&&validText(n.title)&&xy(n)&&array(n.children,12)&&n.children.every(c=>id(c.id)&&validText(c.title))))return fail("mind");
   collections.push(m.root,...m.branches,...m.branches.flatMap(b=>b.children));
  }else{
   if(!m[listName].every(shape))return fail(listName+" shape");
   collections.push(...m[listName]);
   if(type==="er"){
    if(!array(m.relations,100)||!m.entities.every(n=>array(n.fields,30)&&n.fields.every(f=>Array.isArray(f)&&f.length===4&&f.every(x=>typeof x==="string"&&x.length>0&&x.length<=120))))return fail("entities/fields");
   }else if(type==="deploy"||type==="component"){
    if(!array(m.zones,30)||!m.zones.every(n=>id(n.id)&&validText(n.title)&&xy(n)&&wh(n))||!m.nodes.every(n=>id(n.zone)&&(!n.ports||Array.isArray(n.ports)&&n.ports.length<=12&&n.ports.every(x=>typeof x==="string"&&x.length<80))))return fail("zones/ports");
   }else if(type==="swim"){
    if(!array(m.lanes,30)||!m.lanes.every(n=>id(n.id)&&validText(n.title)&&num(n.y))||!m.nodes.every(n=>id(n.lane)))return fail("lanes");
   }
  }
  const ids=collections.map(n=>n.id);
  if(new Set(ids).size!==ids.length)return fail("duplicate ids");
  if(type==="deploy"||type==="component"){const zones=new Set(m.zones.map(n=>n.id));if(!m.nodes.every(n=>zones.has(n.zone)))return fail("node zone");}
  if(type==="swim"){const lanes=new Set(m.lanes.map(n=>n.id));if(!m.nodes.every(n=>lanes.has(n.lane)))return fail("node lane");}
  const edges=type==="sequence"?m.messages:type==="er"?m.relations:type==="mind"?[]:m.edges;
  if(type!=="mind"){
   if(!array(edges,100)||!edges.every(e=>ids.includes(e.from)&&ids.includes(e.to)))return fail("edge endpoints");
   if(!edges.every(e=>!e.id||id(e.id))||new Set(edges.filter(e=>e.id).map(e=>e.id)).size!==edges.filter(e=>e.id).length)return fail("relationship ids");
   if(type==="activity"&&(!m.nodes.every(n=>!n.path||["normal","retry","reject"].includes(n.path))||!m.nodes.every(n=>!n.paths||Array.isArray(n.paths)&&n.paths.length<=3&&n.paths.every(p=>["normal","retry","reject"].includes(p)))||!edges.every(e=>!e.path||["normal","retry","reject"].includes(e.path))))return fail("activity paths");
   if(type!=="sequence"&&!edges.every(e=>typeof e.d==="string"&&e.d.length<=900&&/^[MmLlHhVvCcSsQqTtAaZz0-9., +\-]*$/.test(e.d)&&validText(e.label)&&num(e.lx)&&num(e.ly)))return fail("edge route or label");
  }
  return {ok:true};
 }
 function readModel(host,type){
  const source=host.querySelector(':scope > script[type="application/json"][data-diagram-model]');
  if(!source)return{ok:true,model:M[type]};
  if(source.textContent.length>64000)return{ok:false,error:"model too large"};
  try{
   const model=JSON.parse(source.textContent),checked=validateModel(type,model);
   return checked.ok?{ok:true,model}:{ok:false,error:checked.error};
  }catch{return{ok:false,error:"invalid JSON"};}
 }

 function init(host){
  if(instances.has(host))return instances.get(host);
  const type=host.dataset.semanticDiagram;if(!M[type])return;
  const loaded=readModel(host,type);if(!loaded.ok){host.dataset.semanticError=loaded.error;host.querySelector(".semantic-error")?.remove();const err=html("p","semantic-error",host,"图表数据校验失败 / Invalid diagram data: "+loaded.error);err.setAttribute("role","alert");return;}
  host.dataset.semanticReady="true";delete host.dataset.semanticError;const model=loaded.model;const modelSource=host.querySelector(':scope > script[type="application/json"][data-diagram-model]')?.cloneNode(true)??null;const controller=new AbortController(),signal=controller.signal;let disposed=false;
  const lang=document.documentElement.lang?.startsWith("en")?"en":"zh";window.__genUiLang=lang;
  host.innerHTML="";
  const shell=html("div","semantic-shell",host),toolbar=html("div","semantic-toolbar",shell);
  html("strong","semantic-title",toolbar,text(model.title,lang));
  const tools=html("div","semantic-tools",toolbar);
  const add=(a,l,i)=>btn(tools,a,l,i||ICON[a]);
   const labelButton=(button,label)=>{button.title=label;button.setAttribute("aria-label",label);};
  if(type==="sequence"){add("prev",text(T("上一步消息","Previous message"),lang),ICON.prev);add("next",text(T("下一步消息","Next message"),lang),ICON.next);}
  if(type==="er")add("fields",text(T("隐藏普通字段","Hide non-key fields"),lang),"");
  if(type==="component")add("ports",text(T("隐藏接口端口","Hide interface ports"),lang),"");
  if(type==="activity"){add("path-normal",text(T("正常路径","Success path"),lang),"");add("path-retry",text(T("失败路径","Recovery path"),lang),"");add("path-all",text(T("显示全部路径","Show all paths"),lang),"");}
  if(type==="swim")add("lanes",text(T("折叠泳道","Collapse lanes"),lang),"");
  if(type==="mind")add("expand-all",text(T("展开全部分支","Expand all branches"),lang),"");
  if(type==="deploy")add("zones",text(T("折叠部署区域","Collapse zones"),lang),"");
  add("read",text(T("移动端聚焦阅读","Focus reading on mobile"),lang),ICON.plus);add("zoom-out",text(T("缩小","Zoom out"),lang),ICON.minus);html("span","semantic-zoom",tools,"100%").dataset.zoom="true";add("zoom-in",text(T("放大","Zoom in"),lang),ICON.plus);add("fit",text(T("适应窗口","Fit to view"),lang),ICON.fit);add("fullscreen",text(T("全屏查看","Fullscreen"),lang),ICON.expand);
  const body=html("div","semantic-body",shell),stage=html("div","semantic-stage",body);stage.tabIndex=0;stage.setAttribute("role","region");stage.setAttribute("aria-label",text(model.title,lang));
  const inspector=html("aside","semantic-inspector",body);inspector.setAttribute("aria-live","polite");inspector.setAttribute("aria-label",text(T("图表元素说明","Diagram element details"),lang));
  html("strong","semantic-inspector-title",inspector,text(T("交互说明","How to interact"),lang));
  html("p","semantic-inspector-summary",inspector,text(T("点击图中的节点、连线或字段，查看其职责和关系。","Select a node, connector, or field to inspect its role and relationships."),lang));
  html("p","semantic-inspector-detail",inspector,text(T("画布空白处可拖动平移；使用缩放和适应窗口按钮浏览。","Drag the empty canvas to pan; use zoom and fit controls to navigate."),lang));
  const graph=render(model,type,stage,lang),svgRoot=graph.svg,zoomLabel=tools.querySelector("[data-zoom]");
  const labelOverflow=html("div","semantic-label-fallbacks",shell);labelOverflow.hidden=true;labelOverflow.setAttribute("aria-label",text(T("关系标签完整文本","Full connector labels"),lang));
  let labelFrame=null;function scheduleLabelLayout(){if(disposed)return;if(labelFrame!==null)cancelAnimationFrame(labelFrame);labelFrame=requestAnimationFrame(()=>{labelFrame=null;layoutLabels(svgRoot,graph);});}
  host.closest("details")?.addEventListener("toggle",scheduleLabelLayout,{signal});window.addEventListener("resize",scheduleLabelLayout,{signal});
  let view={x:0,y:0,w:graph.w,h:graph.h},fullscreenBusy=false,fallback=false,pan=null,reading=false,sequenceIndex=0,fieldsVisible=true,portsVisible=true,lanesCollapsed=false,zonesCollapsed=false;
  const fit=()=>{reading=false;const b=tools.querySelector('[data-action="read"]');b?.setAttribute("aria-pressed","false");view={x:0,y:0,w:graph.w,h:graph.h};apply();};
  const read=()=>{reading=!reading;const b=tools.querySelector('[data-action="read"]');b?.setAttribute("aria-pressed",String(reading));if(!reading){fit();return;}const w=Math.min(graph.w,440),h=Math.min(graph.h,Math.max(200,w*stage.clientHeight/Math.max(1,stage.clientWidth)));view={x:Math.max(0,(graph.w-w)/2),y:Math.max(0,(graph.h-h)/2),w,h};apply();};
  const apply=()=>{svgRoot.setAttribute("viewBox",[view.x,view.y,view.w,view.h].join(" "));zoomLabel.textContent=Math.round(graph.w/view.w*100)+"%";scheduleLabelLayout();};
  const zoom=f=>{const w=Math.max(graph.w/3,Math.min(graph.w*2,view.w*f)),h=w*graph.h/graph.w;view={x:view.x+(view.w-w)/2,y:view.y+(view.h-h)/2,w,h};apply();};
  const activeFullscreen=()=>document.fullscreenElement===shell||fallback;
  const syncFullscreen=()=>{if(document.fullscreenElement)fallback=false;const active=activeFullscreen(),b=tools.querySelector('[data-action="fullscreen"]');shell.classList.toggle("is-fallback-fullscreen",fallback);b.innerHTML=active?ICON.collapse:ICON.expand;b.setAttribute("aria-pressed",String(active));b.title=text(T(active?"退出全屏":"全屏查看",active?"Exit fullscreen":"Fullscreen"),lang);b.setAttribute("aria-label",b.title);scheduleLabelLayout();};
  const full=async()=>{if(fullscreenBusy)return;fullscreenBusy=true;try{if(activeFullscreen()){if(document.fullscreenElement===shell&&typeof document.exitFullscreen==="function")await document.exitFullscreen();else if(fallback)fallback=false;}else if(!document.fullscreenElement){try{if(typeof shell.requestFullscreen!=="function")throw Error("unsupported");await shell.requestFullscreen();}catch{fallback=true;}}}catch{shell.dataset.fullscreenError="exit-failed";}finally{fullscreenBusy=false;syncFullscreen();}};
  tools.addEventListener("click",e=>{
   const b=e.target.closest("button[data-action]");if(!b)return;const a=b.dataset.action;
   if(a==="read")read();else if(a==="zoom-in")zoom(.8);else if(a==="zoom-out")zoom(1.25);else if(a==="fit")fit();else if(a==="fullscreen")full();
   else if(a==="prev"||a==="next"){const count=model.messages.length;sequenceIndex=Math.max(0,Math.min(count-1,sequenceIndex+(a==="next"?1:-1)));selectMessage(sequenceIndex);}
   else if(a==="fields"){fieldsVisible=!fieldsVisible;stage.querySelectorAll(".semantic-entity").forEach(entity=>{let index=0;entity.querySelectorAll("[data-field]").forEach(row=>{const hide=!fieldsVisible&&!["PK","FK"].includes(row.dataset.fieldType);row.classList.toggle("is-hidden",hide);if(!hide){row.setAttribute("transform","translate(0 "+(46+index*29)+")");index++;}});const height=56+index*29;entity.dataset.h=height;entity.querySelector(".semantic-node-shape")?.setAttribute("height",height);});labelButton(b,text(T(fieldsVisible?"隐藏普通字段":"显示普通字段",fieldsVisible?"Hide non-key fields":"Show non-key fields"),lang));scheduleLabelLayout();}
   else if(a==="ports"){portsVisible=!portsVisible;stage.querySelectorAll("[data-port]").forEach(n=>n.classList.toggle("is-hidden",!portsVisible));labelButton(b,text(T(portsVisible?"隐藏接口端口":"显示接口端口",portsVisible?"Hide ports":"Show ports"),lang));}
   else if(a==="path-normal"||a==="path-retry"){const wanted=a==="path-normal"?new Set(["normal"]):new Set(["retry","reject"]);stage.querySelectorAll("[data-path],[data-paths]").forEach(n=>{const paths=(n.dataset.paths??n.dataset.path??"").split(",").filter(Boolean);n.classList.toggle("is-path-muted",paths.length>0&&!paths.some(path=>wanted.has(path)));});}
   else if(a==="path-all")stage.querySelectorAll(".is-path-muted").forEach(n=>n.classList.remove("is-path-muted"));
   else if(a==="expand-all"){stage.querySelectorAll("[data-parent]").forEach(n=>n.classList.remove("is-hidden"));stage.querySelectorAll("[data-toggle-branch]").forEach(n=>{n.dataset.expanded="true";n.setAttribute("aria-expanded","true");n.querySelector("path")?.setAttribute("d","M161 34h10");});}
   else if(a==="zones"){zonesCollapsed=!zonesCollapsed;stage.querySelectorAll("[data-zone-content]").forEach(n=>n.classList.toggle("is-hidden",zonesCollapsed));syncEdges();labelButton(b,text(T(zonesCollapsed?"展开部署区域":"折叠部署区域",zonesCollapsed?"Expand zones":"Collapse zones"),lang));}
   else if(a==="lanes"){lanesCollapsed=!lanesCollapsed;stage.querySelectorAll("[data-lane-content]").forEach(n=>n.classList.toggle("is-hidden",lanesCollapsed));syncEdges();labelButton(b,text(T(lanesCollapsed?"展开泳道":"折叠泳道",lanesCollapsed?"Expand lanes":"Collapse lanes"),lang));}
  });
  function syncEdges(){stage.querySelectorAll(".semantic-edge,.semantic-edge-chip").forEach(e=>{const a=stage.querySelector('[data-id="'+e.dataset.source+'"]'),b=stage.querySelector('[data-id="'+e.dataset.target+'"]');e.classList.toggle("is-hidden",!!(a?.closest(".is-hidden")||b?.closest(".is-hidden")));});}
  function selectMessage(index){sequenceIndex=index;stage.querySelectorAll(".is-selected,.is-related").forEach(n=>n.classList.remove("is-selected","is-related"));const same=[...stage.querySelectorAll('[data-message-index="'+index+'"]')];same.forEach(n=>n.classList.add("is-selected"));const n=same.find(x=>x.classList.contains("semantic-edge"))??same[0];if(n){[n.dataset.source,n.dataset.target].forEach(id=>stage.querySelector('[data-id="'+id+'"]')?.classList.add("is-related"));show(n);}}
  function show(n){inspector.querySelector(".semantic-inspector-title").textContent=n.dataset.title||text(T("图表元素","Diagram element"),lang);inspector.querySelector(".semantic-inspector-summary").textContent=n.dataset.summary||"";inspector.querySelector(".semantic-inspector-detail").textContent=n.dataset.detail||"";}
  function select(n){stage.querySelectorAll(".is-selected").forEach(x=>x.classList.remove("is-selected"));stage.querySelectorAll(".is-related").forEach(x=>x.classList.remove("is-related"));n.classList.add("is-selected");const id=n.dataset.id;stage.querySelectorAll(".semantic-edge,.semantic-edge-chip").forEach(e=>{const related=e.dataset.source===id||e.dataset.target===id||n.matches(".semantic-edge,.semantic-edge-chip")&&e.dataset.id===n.dataset.id;e.classList.toggle("is-related",related);});if(n.matches(".semantic-edge,.semantic-edge-chip")){[n.dataset.source,n.dataset.target].forEach(k=>stage.querySelector('[data-id="'+k+'"]')?.classList.add("is-related"));}show(n);}
  stage.addEventListener("click",e=>{
   const toggle=e.target.closest("[data-toggle-branch]");if(toggle){const id=toggle.dataset.toggleBranch,expanded=toggle.dataset.expanded!=="true";const descendants=[...stage.querySelectorAll('[data-parent="'+id+'"]')],focusedInside=descendants.some(n=>n.contains(document.activeElement));toggle.dataset.expanded=String(expanded);toggle.setAttribute("aria-expanded",String(expanded));descendants.forEach(n=>n.classList.toggle("is-hidden",!expanded));const p=toggle.querySelector("path");if(p)p.setAttribute("d",expanded?"M161 34h10":"M161 34h10m-5-5v10");if(!expanded&&focusedInside)toggle.focus();return;}
   const zone=e.target.closest("[data-zone-toggle]");if(zone&&type==="deploy"){const id=zone.dataset.zoneToggle;const hidden=zone.dataset.collapsed!=="true";zone.dataset.collapsed=String(hidden);stage.querySelectorAll('[data-zone-content="'+id+'"]').forEach(n=>n.classList.toggle("is-hidden",hidden));const glyph=zone.querySelector("[data-zone-glyph]");if(glyph)glyph.textContent=hidden?"+":"−";syncEdges();return;}
   const lane=e.target.closest("[data-lane-toggle]");if(lane&&type==="swim"){const id=lane.dataset.laneToggle;const hidden=lane.dataset.collapsed!=="true";lane.dataset.collapsed=String(hidden);stage.querySelectorAll('[data-lane-content="'+id+'"]').forEach(n=>n.classList.toggle("is-hidden",hidden));syncEdges();return;}
   const target=e.target.closest("[data-selectable]");if(target){if(target.dataset.messageIndex!==undefined)selectMessage(Number(target.dataset.messageIndex));else select(target);return;}
  });
  stage.addEventListener("keydown",e=>{const toggle=e.target.closest("[data-toggle-branch],[data-zone-toggle],[data-lane-toggle]");if(toggle&&(e.key==="Enter"||e.key===" ")){e.preventDefault();toggle.dispatchEvent(new MouseEvent("click",{bubbles:true}));return;}const target=e.target.closest("[data-selectable]");if(target&&(e.key==="Enter"||e.key===" ")){e.preventDefault();if(target.dataset.messageIndex!==undefined)selectMessage(Number(target.dataset.messageIndex));else select(target);}});
  stage.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest("[data-selectable]"))return;pan={id:e.pointerId,x:e.clientX,y:e.clientY,viewX:view.x,viewY:view.y};stage.setPointerCapture?.(e.pointerId);});
  stage.addEventListener("pointermove",e=>{if(!pan||pan.id!==e.pointerId)return;const r=svgRoot.getBoundingClientRect();view.x=pan.viewX-(e.clientX-pan.x)*view.w/Math.max(1,r.width);view.y=pan.viewY-(e.clientY-pan.y)*view.h/Math.max(1,r.height);apply();});
  ["pointerup","pointercancel","lostpointercapture"].forEach(k=>stage.addEventListener(k,()=>{pan=null;}));
  stage.addEventListener("wheel",e=>{if(!e.ctrlKey)return;e.preventDefault();zoom(e.deltaY<0?.9:1.1);},{passive:false});
  stage.addEventListener("keydown",e=>{if(e.target.closest("[data-selectable]"))return;if(e.key==="+"||e.key==="="){e.preventDefault();zoom(.8);}else if(e.key==="-"){e.preventDefault();zoom(1.25);}else if(e.key==="0"){e.preventDefault();fit();}else if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();const d=view.w/12;view.x+=e.key==="ArrowLeft"?-d:e.key==="ArrowRight"?d:0;view.y+=e.key==="ArrowUp"?-d:e.key==="ArrowDown"?d:0;apply();}});
  document.addEventListener("fullscreenchange",syncFullscreen,{signal});document.addEventListener("fullscreenerror",syncFullscreen,{signal});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&fallback){e.preventDefault();fallback=false;syncFullscreen();}},{signal});
  const instance={destroy(){if(disposed)return;disposed=true;controller.abort();if(labelFrame!==null)cancelAnimationFrame(labelFrame);if(document.fullscreenElement===shell&&typeof document.exitFullscreen==="function")document.exitFullscreen().catch(()=>{});fallback=false;host.replaceChildren(...(modelSource?[modelSource]:[]));delete host.dataset.semanticReady;instances.delete(host);}};
  instances.set(host,instance);apply();syncFullscreen();scheduleLabelLayout();return instance;
 }
 function destroy(host){instances.get(host)?.destroy();}
 window.GenUISemantic={init,validateModel,destroy,types:Object.keys(M)};
 function start(){document.querySelectorAll("[data-semantic-diagram]").forEach(init);}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();