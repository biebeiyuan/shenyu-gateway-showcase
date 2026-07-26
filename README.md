# Shenyu Gateway Vibe Coding Case Study

在线演示：https://biebeiyuan.github.io/shenyu-gateway-showcase/

一个从长期真实使用中逐步长出来的前端作品集 Demo。它背后是一个真实运行的 LLM 长期记忆网关：约 5 万行前后端代码（Python/FastAPI + Vue 3）、537 个自动化测试、17 次数据库迁移、297 次提交，部署在 Linux VPS 上持续服务真实长期对话三个月。本页不连接生产网关，也不冒充商业化产品；页面用合成数据还原三件我真正反复思考和实现过的事情：

1. 一条消息如何经过真实窗口、固定上下文层、自动浮现、Memory Island、最终 Messages 拼装和安全返回。
2. 主动 Recall、Client tool、Mixed tool 如何识别执行责任，并在 `working_messages`、pending transcript 与客户端可见调用之间续接协议。
3. 我如何把真实使用感受、产品边界和 Agent 的技术判断对齐，最后交付可验证、可维护的改动。

## 为什么这样展示

这个作品不是功能清单，而是一次“从真实问题到可维护行为”的 Vibe Coding 过程。页面重点展示产品判断、边界、证据和取舍，不展示真实提示词、对话、日志、API 或私有记忆。

## 三个章节

- **一条消息怎样穿过网关**：九段加工线从原始请求一直走到安全返回。Calendar、Bookshelf / Notebook / recap 属于 `slow`，Heartbeat 是独立层；它们都与 Mem / Stars 的浮现判断分开。最后再把 system prefix、较早历史、Memory Island、最近对话与当前消息拼成真正的 `messages[]`，`tools[]` 始终是独立字段。
- **模型要行动时，谁来执行**：把自动浮现与主动 Recall 分开，用“客户端打开文件”“网关主动 Recall”“Recall + 打开文件”三条时序演示执行归属。页面会随步骤实时显示本次请求内存中的 `working_messages`、跨请求的 `pending_gateway_tool_turns` 和客户端真正看见的调用；Mixed tool 还原 Gateway calls 逐个 `await`、等待 Client、重建完整 transcript、上游成功后再消费 pending 的顺序。
- **我怎样与 Agent 一起完成工程工作**：用“界面看得见，Agent 工具却打不开”这个脱敏案例，先直接给出使用症状、确认根因和最终结果，再在同一张工作面里逐步呈现人的观察、Agent 的证据路径与双方共同决定。每一步形成的确定性会累积下来，最后落回代码行为、回归测试、现行文档和地图复核，而不是停在一次聊天里。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 项目结构

```text
src/
├── App.vue              # 三个章节、请求播放、工具时序和人机工程协作
├── data/showcase.ts     # 全部脱敏展示数据与静态证据
├── style.css            # 响应式视觉系统与三章工作台
└── types.ts             # 展示数据契约
```

## 展示声明

本项目只表达经过整理的产品逻辑和真实实现边界，不复刻生产后台，不连接任何真实服务。所有请求、工具、错误、缓存和维护记录均为合成展示内容。
