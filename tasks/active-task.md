# 活跃任务

## 当前任务：Phase 1 收尾 + Phase 2 推进

**优先级**: P0 - 核心功能

### 已完成
- [x] MySQL 8 迁移 (mysql2 + drizzle ORM)
- [x] JWT cookie 认证 (authedQuery 中间件)
- [x] 前端全部页面切真实 tRPC API
- [x] 评分引擎前端可视化 (雷达图 + 维度条 + 风险分析 + AI Summary)
- [x] 公司关联度前端
- [x] Position CRUD 后端 + 前端 (列表/创建/搜索/过滤/详情/编辑/删除)
- [x] 岗位管理页面路由 + 侧边栏导航
- [x] 面试流程 BARS 5维度行为锚定评分 UI (替换原单一评分)
- [x] 岗位详情弹窗 (查看/编辑/删除/状态切换)
- [x] TypeScript 零错误, vitest 10测试全通过
- [x] 端到端 API 验证通过

### 待办
- [ ] Position 列表关联候选人匹配数
- [ ] 角色权限: adminQuery 用于管理员专属操作
- [ ] Analytics 仪表盘增强 (真实数据聚合图表)
- [ ] 面试 BARS 评分与候选人画像评分联动
- [ ] 评分权重按岗位类型定制 (技术/产品/运营)

---

## 任务追踪规范

- 每个新任务新建 `tasks/<任务名>.md`
- 完工后归档到 `tasks/archive/`
- 当前任务链始终写在 `tasks/active-task.md`