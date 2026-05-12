# 系统架构

## 整体架构

```
┌──────────────────────────────────────────────────┐
│                  前端 (React 19)                   │
│  Vite 7 HMR Dev Server → http://localhost:3001    │
│  @trpc/react-query + superjson 序列化              │
│                                                    │
│  src/pages/  13 个页面                             │
│   ├── Home         总览仪表盘                      │
│   ├── TalentPool   人才库 (列表/详情/CRUD)         │
│   ├── Positions    岗位管理 (CRUD/匹配统计)        │
│   ├── Channels     渠道管理 (CRUD/ROI)             │
│   ├── InterviewFlow 面试流程 (看板/日历/BARS评分)  │
│   ├── TalentProfiles 人才画像 (6维雷达图)          │
│   ├── OfferManage  Offer管理 (创建/谈判/流转)      │
│   ├── Analytics    数据分析 (趋势/漏斗/效率)       │
│   ├── AlertCenter  预警监控 (创建/执行/自动生成)   │
│   ├── CompanyRelations 公司关联度                   │
│   ├── AuditLog     操作日志                        │
│   ├── Login        登录                            │
│   └── NotFound     404                             │
└──────────────┬───────────────────────────────────┘
               │ cookie (JWT) / /api/trpc/*
┌──────────────▼───────────────────────────────────┐
│              后端 (Hono 4 + tRPC 11)               │
│  @hono/vite-dev-server 开发代理                    │
│                                                    │
│  api/router.ts 注册 17 个子路由:                    │
│   ├── auth       登录/登出/me                      │
│   ├── candidate  列表/详情/CRUD                    │
│   ├── interview  列表/评分/CRUD/日历               │
│   ├── offer      列表/创建/更新/CRUD               │
│   ├── channel    列表/CRUD                         │
│   ├── alert      列表/已读/CRUD/执行/自动生成      │
│   ├── dashboard  统计/活跃度                       │
│   ├── position   列表/详情/CRUD/统计               │
│   ├── scoring    单人评分/批量匹配/全量重算         │
│   ├── relation   公司分组/候选人关联                │
│   ├── positionMatch 岗位匹配统计                   │
│   ├── analytics  趋势/漏斗/岗位效率/渠道对比       │
│   ├── search     全局跨模块搜索                    │
│   ├── ai         AI助手/面试评语生成               │
│   ├── auditLog   操作日志查询                      │
│   ├── notification 通知订阅管理                    │
│   └── export     CSV数据导出                       │
│                                                    │
│  api/boot.ts 原生 Hono 路由:                        │
│   ├── POST /api/upload/resume  简历文件上传        │
│   └── GET  /api/uploads/resumes/:filename 文件预览 │
│                                                    │
│  api/middleware.ts:                                 │
│   ├── publicQuery  无需登录                        │
│   ├── authedQuery  需JWT cookie认证                │
│   └── adminQuery   需admin角色                     │
│                                                    │
│  核心引擎:                                          │
│   ├── api/scoring.ts        6维评分 + 4维意向分     │
│   ├── api/company-relation.ts 公司关联度分析        │
│   ├── api/lib/audit.ts     审计日志记录            │
│   └── api/lib/notifications.ts 通知推送服务         │
└──────────────┬───────────────────────────────────┘
               │ mysql2 + drizzle ORM
┌──────────────▼───────────────────────────────────┐
│           数据库 (MySQL 8 + Drizzle ORM)           │
│  docker-compose.yml 启动                          │
│  库名: zhypx                                      │
│                                                    │
│  db/schema.ts 9 张表:                              │
│   ├── users                  用户/角色             │
│   ├── positions              岗位/JD              │
│   ├── candidates             候选人 (含resumeUrl) │
│   ├── workHistories          工作经历             │
│   ├── interviews             面试记录 + BARS评分  │
│   ├── offers                 Offer + 总包计算      │
│   ├── channels               渠道                 │
│   ├── alerts                 预警                 │
│   ├── auditLogs              操作日志 (Sprint 7)   │
│   └── notificationSubscriptions 通知订阅 (Sprint 7)│
└──────────────────────────────────────────────────┘
```

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端框架 | React 19 | 最新稳定版 |
| 构建工具 | Vite 7 | HMR 开发服务器 |
| 样式 | Tailwind CSS 3 + shadcn/ui | 40+ 组件 |
| 路由 + 数据获取 | react-router 7 + @tanstack/react-query 5 | |
| API 层 | tRPC 11 | 类型安全端到端 |
| 后端 | Hono 4 + @hono/node-server | Fetch API 兼容 |
| 数据库 | MySQL 8 + mysql2 + drizzle ORM | Docker 容器化 |
| 认证 | cookies (JWT 式 token) | jose 库签名 |
| 序列化 | superjson | Date/Map/Set 透传 |
| 测试 | Vitest 4 | 纯函数 + API 测试 |
| AI 集成 | DeepSeek (Kimi) API | AI Copilot + 评语生成 |

## 目录分层

```
api/            — 后端 tRPC 路由、中间件、业务逻辑
  routers/      — 17 个子路由 + 3 个测试文件
  lib/          — 审计日志、通知等工具模块
  auth/         — JWT session 认证
src/            — 前端 React 源码
  pages/        — 13 个页面组件
  components/   — UI 组件 + Layout + InterviewCalendar
  hooks/        — React hooks
  providers/    — tRPC Provider
db/             — MySQL schema、连接、种子数据
uploads/resumes/ — 简历文件存储（.gitkeep 保留目录）
contracts/      — 前后端共享类型、常量、错误码
docs/           — 设计文档
scripts/        — 开发 & CI 脚本
tasks/          — 任务追踪
```

## 关键数据流

```
用户操作 → React page → tRPC client → /api/trpc/* 
→ Hono fetch handler → tRPC procedure (authedQuery/adminQuery) 
→ Drizzle ORM → MySQL 8 → 返回数据

评分触发链:
  position.update(技能/经验/薪酬变更)
    → 自动重算所有活跃候选人 matchScore + intentScore
    → 更新 candidates 表
    → 前端 TalentProfiles 实时刷新

审计追踪链:
  任意 create/update/delete mutation
    → recordAudit({ action, entityType, entityId, userId, changes })
    → auditLogs 表
    → AuditLog 页面可查询追溯

 通知推送链:
  alert.create / alert.autoGenerate
    → sendNotifications(alert)
    → 查询 notificationSubscriptions
    → POST webhook / 钉钉机器人

简历上传链:
  前端文件选择 (PDF/DOCX/DOC/TXT, <10MB)
    → POST /api/upload/resume (multipart)
    → 保存到 uploads/resumes/{uuid}.{ext}
    → 返回 URL → 填入 candidate.resumeUrl
    → 候选人详情页 GET /api/uploads/resumes/:filename 预览
```

## 测试覆盖

| 模块 | 测试数 | 类型 |
|------|--------|------|
| api/scoring.ts | 18 | 评分引擎纯函数 |
| api/company-relation.ts | 4 | 公司关联纯函数 |
| api/routers/index.ts | 43 | BARS/Offer/仪表盘/预警/默认值 |
| api/routers/analytics.ts | 22 | 漏斗/位置效率/周起始/渠道 |
| api/routers/scoring.ts | 21 | detectPositionType/权重/关联 |
| **合计** | **109** | **4 文件, 零失败** |
