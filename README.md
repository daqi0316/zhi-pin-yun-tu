# 智聘云图 — 智能招聘管理系统

基于 AI 评分引擎的全流程招聘管理平台，覆盖人才入库 → 面试评估 → Offer 管理 → 入职全链路。

## 技术栈

React 19 + Vite 7 + Tailwind CSS 3 + shadcn/ui | Hono + tRPC 11 + MySQL 8 (drizzle ORM) | DeepSeek AI

## 功能模块

- **人才库**：候选人管理、简历解析、技能标签、工作经历
- **AI 评分引擎**：6 维度综合评分（技能、经验、教育、能力、稳定性、薪酬）+ 4 维度意向评分
- **面试流程**：面试日历、BARS 五维评估（技能/问题解决/沟通/协作/文化）
- **Offer 管理**：薪资方案、竞对 Offer 追踪、接受概率预测
- **渠道分析**：招聘渠道 ROI 分析、转化漏斗
- **预警中心**：候选人流失风险、Offer 过期、面试爽约等智能预警
- **公司关联度**：人才流动网络分析
- **数据看板**：招聘仪表盘、趋势分析
- **AI 助手**：DeepSeek 驱动的对话助手和面试评语生成
- **用户管理**：多角色权限（管理员/HR/面试官/部门主管/只读）

---

## 快速开始（Docker Compose 一键部署）

### 前置条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 已安装并运行

### 启动

```bash
# 1. 克隆项目
git clone <repo-url> zhypx && cd zhypx

# 2. 一键启动（首次构建约 3-5 分钟）
docker compose up -d

# 3. 访问 http://localhost:3001
```

### 默认账号

首次运行 `npm run db:seed` 时会创建初始用户，密码通过以下环境变量指定（未设置则使用随机值）：

| 角色 | 用户名 | 环境变量 |
|---|---|---|
| 管理员 | admin | `ADMIN_PASSWORD` |
| HR | hr_zhao | `HR_PASSWORD` |
| 面试官 | iv_li | `IV_PASSWORD` |
| 部门主管 | dept_wang | `DEPT_PASSWORD` |
| 只读 | guest | `GUEST_PASSWORD` |

请在 `.env` 文件中设置这些密码，或通过用户管理功能修改。

### 自定义配置

编辑 `docker-compose.yml` 中 `app.environment` 段修改端口、密钥等。生产环境务必更换 `APP_SECRET` 和 MySQL 密码。

---

## 本地开发

### 前置条件

- Node.js 20+
- Docker Desktop（仅用于 MySQL）

### 启动开发环境

```bash
# 1. 安装依赖
npm install

# 2. 启动 MySQL
docker compose up -d mysql

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入必填项（APP_ID、APP_SECRET、DATABASE_URL）

# 4. 初始化数据库
npm run db:push
npm run db:seed

# 5. 启动开发服务器
npm run dev
# 访问 http://localhost:3001
```

### 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器（前后端一体化，HMR） |
| `npm run build` | 生产构建（Vite 前端 + esbuild 后端） |
| `npm run start` | 生产模式启动 |
| `npm run check` | TypeScript 类型检查 |
| `npm test` | 运行单元测试 |
| `npm run db:push` | 同步数据库 schema |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:reset` | 重置数据库 |
| `bash scripts/check.sh` | 提交前全量检查 |
```

---

## 项目结构

```
├── api/               # 后端（Hono + tRPC）
│   ├── boot.ts        # 服务入口
│   ├── router.ts      # tRPC 路由聚合
│   ├── scoring.ts     # AI 评分引擎
│   ├── deepseek.ts    # DeepSeek AI 封装
│   └── routers/       # 业务路由（候选人/面试/Offer/渠道/...）
├── src/               # 前端（React + shadcn/ui）
│   ├── App.tsx        # 路由配置
│   ├── pages/         # 页面组件
│   ├── components/    # 公共组件
│   └── providers/     # React Context
├── db/                # 数据库（Drizzle ORM + MySQL）
│   ├── schema.ts      # 表定义（12 张表）
│   └── seed.ts        # 种子数据
├── contracts/         # 前后端共享类型
├── docs/              # 设计文档
└── scripts/           # 工具脚本
```

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `APP_ID` | ✅ | 应用 ID |
| `APP_SECRET` | ✅ | JWT 签名密钥 |
| `DATABASE_URL` | ✅ | MySQL 连接串 |
| `PORT` | - | HTTP 端口（默认 3001） |
| `APP_URL` | - | 应用公开地址 |
| `KIMI_AUTH_URL` | - | Kimi OAuth 地址（可选） |
| `KIMI_OPEN_URL` | - | Kimi 开放平台地址（可选） |
| `DEEPSEEK_API_KEY` | - | DeepSeek API Key（AI 功能需要） |
| `OWNER_UNION_ID` | - | 管理员 union ID |
