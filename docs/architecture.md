# 系统架构

## 整体架构

```
┌─────────────────────────────────────────┐
│             前端 (React 19)               │
│  Vite HMR Dev Server → http://localhost:3000  │
│  tRPC Client → @trpc/react-query            │
└──────────────┬──────────────────────────┘
               │ /api/trpc/*
┌──────────────▼──────────────────────────┐
│           后端 (Hono + tRPC)              │
│  @hono/vite-dev-server 统一处理 API 路由   │
│  app.fetch() 处理所有请求                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        数据库 (SQLite + drizzle ORM)       │
│  better-sqlite3 (WAL 模式)                 │
│  文件: data/app.db                        │
└─────────────────────────────────────────┘
```

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端框架 | React 19 | 最新稳定版 |
| 构建工具 | Vite 7 | HMR 开发服务器 |
| 样式 | Tailwind CSS 3 + shadcn/ui | 40+ 组件 |
| 路由 + 数据获取 | react-router 7 + @tanstack/react-query 5 | |
| API 层 | tRPC 11 | 类型安全端到端 |
| 后端 | Hono 4 + @hono/node-server | 轻量、兼容 Fetch API |
| 数据库 | better-sqlite3 + drizzle ORM | SQLite WAL 模式 |
| 状态持久化 | cookies（JWT 式 token） | jose 库签名 |

## 目录分层

```
api/         — 后端 tRPC 路由、中间件、业务逻辑
src/         — 前端 React 源码
  pages/     — 页面组件
  components/— UI 组件 + 业务组件
  hooks/     — React hooks
  providers/ — 上下文提供者 (tRPC, etc.)
db/          — 数据库 schema、连接、种子数据
contracts/   — 前后端共享的类型、常量、错误码
data/        — SQLite 数据库文件（gitignore）
docs/        — 设计文档
scripts/     — 开发 & CI 脚本
tasks/       — 当前任务状态追踪
evals/       — 回归测试用例
```

## 关键数据流

用户操作 → React 页面 → tRPC 客户端 → /api/trpc/* (Hono) → tRPC 路由处理 → Drizzle ORM → SQLite → 返回数据
