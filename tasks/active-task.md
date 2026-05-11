# 活跃任务

## 当前阶段：Sprint 6 — 高级功能（待开发）

> 详细开发路线图见 `tasks/completion-order.md`，架构设计见 `docs/architecture.md`

---

## Sprint 1-5 已完成 (23/25 任务)

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

---

## 待办: Sprint 6 — 高级功能（2天）

| 序号 | 任务 | 工时 | 依赖 |
|------|------|------|------|
| 24 | AI Copilot 对接 Kimi | 2d | Kimi OAuth + 对话 API |
| 25 | AI 面试评语生成 | 1d | 基于 BARS 分数自动生成 |

---

## 技术备忘

- **端口**: 3000 被 `/Users/qixia/Downloads/harness-engineering/app/` 占用，本机开发用 3001
- **测试**: `npx vitest run` — 18 tests, api/scoring.test.ts
- **类型检查**: `npx tsc --noEmit` — 零错误
- **DB**: MySQL 8 本地运行，用户 `root:723319`，库名 `zhypx`
- **关键文件**: `api/router.ts` (路由注册), `api/scoring.ts` (评分引擎), `db/schema.ts` (数据表)
