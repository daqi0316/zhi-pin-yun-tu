# 智聘云图 — Agent 项目指南

## 技术栈

React 19 + Vite 7 + Tailwind CSS 3 + shadcn/ui | Hono + tRPC 11 + MySQL 8 (mysql2 + drizzle ORM)

## 关键命令

```bash
docker compose up -d   # 启动 MySQL（首次或要重置数据时）
npm install            # 安装依赖
npm run db:push        # 推送 schema 到 MySQL
npm run db:seed        # 填充种子数据
npm run dev            # 前后端合一开发，http://localhost:3000
npm run check          # tsc 类型检查
npm test               # vitest（仅 api/**/*.test.ts）
bash scripts/check.sh  # 提交前全量检查：Prettier → ESLint → tsc → vitest
npm run build          # vite build + esbuild api/boot.ts
npm run start          #NODE_ENV=production node dist/boot.js
```

## 架构要点

- **前后端一体化**：dev 模式由 `@hono/vite-dev-server` 在 Vite 内代理 tRPC（`/api/trpc/*`），无需单独启后端
- **数据库**：MySQL 8，通过 `docker-compose.yml` 启动。`db/connection.ts` 统一使用 mysql2 连接池（mode: "default"），不再有双连接
- **生产构建**：`npm run build` 同时输出前端静态资源到 `dist/public/` 和后端 bundle 到 `dist/boot.js`，后者用 esbuild 打包并注入 `createRequire` banner 以支持 CJS 依赖
- **路径别名**：`@` → `src/`, `@contracts` → `contracts/`, `@db` → `db/`（vite.config.ts + tsconfig.json 同步配置）
- **认证中间件已定义**（`api/middleware.ts` 有 `authedQuery`/`adminQuery`），但所有业务 router 当前都用的 `publicQuery`（未鉴权）
- **鉴权模块**：`api/auth/session.ts` 是 `api/kimi/session.ts` 的重新导出，本地登录走 `api/auth-local.ts`

## 添加新功能

新增 API router：
1. 在 `api/routers/` 下创建文件
2. 在 `api/routers/index.ts` 导出
3. 在 `api/router.ts` 的 `appRouter` 中注册
4. 写 `.test.ts` 测试（放被测模块同目录）

新增页面：
1. 在 `src/pages/` 下创建组件
2. 在 `src/App.tsx` 添加 `<Route>`

数据库变更：
- 修改 `db/schema.ts`（使用 `drizzle-orm/mysql-core` 类型：`mysqlTable`, `varchar`, `int`, `datetime` 等）
- 更新 `db/relations.ts` 添加关联
- 运行 `npm run db:push` 同步到 MySQL
- 默认值用 `.defaultNow()` 而非 SQL 字符串；SQL 模板中用 `sql\`NOW()\`` 而非 `datetime('now')`

## 测试

- **框架**：Vitest 4，配置 `vitest.config.ts`
- **仅覆盖 API 层**：`include` 只匹配 `api/**/*.test.ts` 和 `api/**/*.spec.ts`
- 纯函数测试（如 `scoring.ts`、`company-relation.ts`）不需要数据库连接
- 需要 DB 的测试需先确保 Docker MySQL 运行

## 环境变量

复制 `.env.example` 为 `.env`。关键配置：
- `DATABASE_URL`：MySQL 连接串，本地默认 `mysql://root:root@localhost:3306/zhypx`
- `APP_ID` / `APP_SECRET`：JWT 签名密钥
- 所有字段必填，缺失会直接报错

## 当前重点

**Phase 1 基础设施**：鉴权接入 → 前端切真实 API → 评分引擎核心算法 → CRUD 完善。详见 `tasks/active-task.md`。

## 设计文档

- `docs/评分体系设计V1.md` — 评分体系
- `docs/architecture.md` — 系统架构
- `docs/dev-workflow.md` — 开发流程
- `docs/testing.md` — 测试策略