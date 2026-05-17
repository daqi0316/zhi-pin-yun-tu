# 活跃任务

## 当前阶段：全部完成 🎉

> 详细开发路线图见 `tasks/completion-order.md`，架构设计见 `docs/architecture.md`

---

## Sprint 1-8 已完成 (34/34 任务)

### Sprint 1 — CRUD 补全 ✅
- [x] 候选人新建表单 + 编辑 + 删除
- [x] 面试创建 & 删除 & BARS评分UI
- [x] Offer 创建流程 & 谈判
- [x] 渠道 CRUD 完整增删改

### Sprint 2 — 预警 & 权限 ✅
- [x] 预警创建/编辑/删除/全部已读/执行操作
- [x] adminQuery 角色权限（position/channel/alert写操作+全部delete）
- [x] 意向分 calculateIntentScore（4维度加权）
- [x] 前端角色UI隐藏非admin按钮

### Sprint 3 — 数据真实化 ✅
- [x] dashboard.stats 真实月度聚合 + 环比变化率
- [x] api/routers/analytics: trends(周/月) / funnel(6阶段) / positionEfficiency
- [x] Analytics 全量真实数据: 趋势折线图 / 漏斗 / 岗位效率表
- [x] TalentProfiles 硬编码positionId:1 → 岗位下拉选择器

### Sprint 4 — 业务联动 ✅
- [x] interview.updateScore 评分后自动联动刷新候选人 matchScore
- [x] candidate.detail 端点: 状态流转时间线 + 关联面试/Offer/预警
- [x] TalentPool 候选人详情重写: 时间线 + 面试/Offer/预警列表
- [x] position.stats 端点: 岗位详情展示面试数/Offer数

### Sprint 5 — 体验优化 ✅
- [x] search.global 全局搜索: 跨候选人/岗位/面试 + Layout顶部搜索下拉
- [x] alert.autoGenerate 预警自动生成: 面试超时/Offer到期/长期未跟进
- [x] analytics.channelTrends 渠道趋势数据
- [x] BIG_TECH_COMPANIES 导出为常量 + customBigTech 参数支持
- [x] DEFAULT_WEIGHTS 按岗位类型(技术/产品/运营)差异化权重 + detectPositionType

### Sprint 6 — 高级功能 ✅
- [x] AI Copilot 对接 DeepSeek (api/routers/ai.ts chat.send + Layout Copilot面板)
- [x] AI 面试评语生成 (基于 BARS 分数自动生成 + InterviewFlow 按钮)

### Sprint 7 — 基础设施增强 ✅
- [x] API 集成测试: 109 tests / 4 files (BARS评分/Offer总包/仪表盘KPI/预警过滤/漏斗/岗位效率)
- [x] 审计日志: auditLogs表 + recordAudit + auditLogRouter + 前端AuditLog页面 + 全CRUD追踪
- [x] 候选人自动匹配触发器: position.update 变更时自动重算所有候选人匹配分
- [x] 通知推送集成: notificationSubscriptions表 + Webhook/钉钉通知 + alert创建/自动生成触发
- [x] 数据导出: CSV导出候选人/面试/Offer + 前端导出按钮
- [x] 面试排期日历: interview.calendar端点 + InterviewCalendar组件 + 看板/日历切换
- [x] 移动端响应式适配: 汉堡菜单 + 侧边栏overlay + 响应式间距

### Sprint 8 — 简历管理 ✅ (2026-05-13)
- [x] 简历上传: POST /api/upload/resume multipart (PDF/DOCX/DOC/TXT, <10MB)
- [x] 简历预览: GET /api/uploads/resumes/:filename 文件服务
- [x] 前端集成: TalentPool 新建表单上传区 + 候选人详情简历链接

---

## 技术备忘

- **端口**: 3001（vite.config.ts + api/boot.ts + .env）
- **APP_URL**: http://localhost:3001（通知链接用，生产需改为实际域名）
- **测试**: `npx vitest run` — 109 tests, 4 files, 零失败
- **类型检查**: `npx tsc --noEmit` — 零错误
- **DB**: MySQL 8 本地运行，用户 `root`，密码见 `.env` `MYSQL_ROOT_PASSWORD`，库名 `zhypx`
- **Docker**: `docker compose up -d` 启动 MySQL
- **关键文件**: `api/router.ts` (17个子路由), `api/boot.ts` (4条原生路由), `api/scoring.ts` (评分引擎), `db/schema.ts` (10张表)
- **DEEPSEEK_API_KEY**: 需在 .env 中配置后方可启用 AI Copilot 和 AI 面试评语功能

## 当前系统规模

| 维度 | 数量 |
|------|------|
| API tRPC 子路由 | 17 个 |
| API 原生路由 | 4 条 (upload/resume, static serve, catch-all) |
| 数据库表 | 10 张 |
| 前端页面 | 13 个 |
| 测试文件 | 4 个 (109 tests) |
| shadcn/ui 组件 | 40+ |
| Sprint 总数 | 8 个 (34 tasks) |
