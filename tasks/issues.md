# 待修复问题清单

> 扫描日期：2026-05-13 | 发现问题：20 个

---

## 🔴 CRITICAL — 运行时错误 / 数据完整性（4 个）

### #1 种子数据 status 不匹配 → 评分/匹配始终为 0

| 字段 | 内容 |
|------|------|
| 文件 | `db/seed.ts:30-38` / `api/routers/scoring.ts:157,250,375` |
| 原因 | 种子 candidates 的 `status` 是 `"在职-考虑机会"`、`"在职-积极求职"`、`"离职-随时到岗"`。但 `scoring.matchCandidates`、`scoring.rescoreAll`、`positionMatch.counts`、`position.update` 自动匹配 全部过滤 `eq(candidates.status, "active")` |
| 影响 | 匹配候选人数始终返回 0，岗位匹配统计、自动重算全部失效 |
| 方案 | A) 种子数据 status 改为 `"active"`，新增一个字段存储详细状态 B) 后端查询改为 `neq("inactive")` 或去掉过滤 |

### #2 星座背景组件导入缺失 → Home 页崩溃

| 字段 | 内容 |
|------|------|
| 文件 | `src/components/ConstellationBackground.tsx:5` |
| 原因 | `import { constellationNodes, constellationConnections } from "@/data/mockData"` — 文件 `src/data/mockData.ts` 不存在 |
| 影响 | Home 页 3D 星座背景加载失败，可能整页崩溃 |
| 方案 | A) 创建 `src/data/mockData.ts` 补充缺失数据 B) 添加 ErrorBoundary 兜底 C) 替换为静态背景 |

### #3 无级联删除 → 删候选人留孤儿数据

| 字段 | 内容 |
|------|------|
| 文件 | `db/schema.ts` — `interviews.candidateId`、`offers.candidateId`、`alerts.candidateId`、`workHistories.candidateId`、`interviews.positionId`、`offers.positionId` |
| 原因 | 所有外键只有 `.references()`，没有 `onDelete: "cascade"` |
| 影响 | `candidate.delete` / `position.delete` 只删主表行，留下孤儿 interviews/offers/alerts/workHistories |
| 方案 | 在 schema 外键上添加 Drizzle cascade 配置，或用事务手动清理子表 |

### #4 简历删除路由未正确注册

| 字段 | 内容 |
|------|------|
| 文件 | `api/boot.ts` |
| 原因 | 之前尝试添加 `DELETE /api/upload/resume/:filename` 遇到 Vite dev server 不支持 DELETE → 改为 `POST /api/upload/resume/delete/:filename`，但该路由可能与其他路由冲突 |
| 影响 | 已上传的简历无法删除 |
| 方案 | 验证当前路由状态，若无删除端点则补上（用 POST 代替 DELETE，或确认 DELETE 在 Hono 可用） |

---

## 🟠 HIGH — 功能缺口（4 个）

### #5 Offer 页面 JOIN 缺失 → 候选人姓名永远显示"候选人"

| 字段 | 内容 |
|------|------|
| 文件 | `src/pages/OfferManage.tsx:211,213,379,385` / `api/routers/index.ts:580-582` |
| 原因 | 前端渲染 `offer.candidateName`、`offer.candidateAvatar`、`offer.position`。但 `offer.list` 只查 `offers` 表，不 JOIN `candidates` 和 `positions` 表。`sentDate`、`deadline`、`competitorOffers` 也未被返回 |
| 影响 | 所有 Offer 卡片姓名显示 `"候选人"`，头像全是 `avatar1.jpg`，职位信息缺失 |
| 方案 | `offer.list` 添加 LEFT JOIN 返回 `candidateName`、`candidateAvatar`、`positionTitle` 等反范式字段 |

### #6 analytics.positionEfficiency 字符串匹配不稳定

| 字段 | 内容 |
|------|------|
| 文件 | `api/routers/analytics.ts:161` |
| 原因 | `c.position?.includes(pos.title)` 用字符串包含匹配。如 `"Java工程师"` 不会匹配 `"高级Java工程师"` |
| 影响 | Analytics 岗位效率表数字可能偏少 |
| 方案 | 改用 `interviews.positionId` / `offers.positionId` 外键关联统计 |

### #7 候选人生命周期断裂 — 按钮无功能

| 字段 | 内容 |
|------|------|
| 文件 | `src/pages/TalentPool.tsx:803-808`、`src/pages/TalentProfiles.tsx:623-632` |
| 问题按钮 | TalentPool: "安排面试" / "发送消息" / "收藏" / "沟通" / "星标" / "高级筛选"。TalentProfiles: "发送Offer" / "发起沟通" |
| 影响 | 用户无法从候选人详情直接跳转安排面试 / 发 Offer / 发消息 |
| 方案 | 按钮绑定跳转逻辑，携带 `candidateId` 参数到 InterviewFlow / OfferManage 页面 |

### #8 Dashboard.tsx 孤儿页面（硬编码数据 + 未路由）

| 字段 | 内容 |
|------|------|
| 文件 | `src/pages/Dashboard.tsx` |
| 原因 | 页面存在但未在 `src/App.tsx` 注册路由。数据全硬编码（`"+12.5%"` 等），未调用 API |
| 影响 | 不可访问的废弃代码 |
| 方案 | A) 删除 `Dashboard.tsx`，`Home.tsx` 已替代 B) 或改造后注册路由 |

---

## 🟡 MEDIUM — 缺失功能 / 死代码（6 个）

### #9 TalentPool 无分页控件

| 字段 | 内容 |
|------|------|
| 文件 | `src/pages/TalentPool.tsx` |
| 原因 | `candidate.list` API 支持 `page`/`pageSize`/返回 `total`，但前端从不传 `page` 参数，无页码导航 |
| 影响 | 始终只显示前 50 条 |
| 方案 | 添加分页组件（上一页/下一页 + 页码） |

### #10 候选人删除未暴露到前端

| 字段 | 内容 |
|------|------|
| 文件 | `src/pages/TalentPool.tsx` |
| 原因 | `candidate.delete` adminQuery 存在，但前端无删除按钮。对比 interviews/offers/channels/positions/alerts 都有 |
| 影响 | 候选人只能通过 API 直接调删除 |
| 方案 | 在候选人详情/列表中为 admin 角色添加删除按钮 |

### #11 candidate.notes 字段无 UI 入口

| 字段 | 内容 |
|------|------|
| 文件 | `db/schema.ts:64` / `api/routers/index.ts` / `src/pages/TalentPool.tsx` |
| 原因 | DB 有 `notes` 列，API `update` 支持，但创建/编辑表单都不包含 |
| 影响 | 无法为候选人添加备注 |
| 方案 | 在创建表单和详情中添加 notes 文本框 |

### #12 interview.list 无过滤/搜索/分页

| 字段 | 内容 |
|------|------|
| 文件 | `api/routers/index.ts:324-331` |
| 原因 | `interview.list` 返回全量，无 status/stage/date 过滤和分页 |
| 影响 | 数据大时看板不可用 |
| 方案 | 添加 `status`、`stage`、`search`、`page` 参数 |

### #13 通知订阅无前端管理页面

| 字段 | 内容 |
|------|------|
| 文件 | `api/routers/notifications.ts` |
| 原因 | notification CRUD 完整但无前端 UI |
| 影响 | Webhook/钉钉通知配置只能通过 API 调 |
| 方案 | 在设置或预警页添加通知订阅配置面板 |

### #14 analytics.channelTrends 有 API 无前端

| 字段 | 内容 |
|------|------|
| 文件 | `api/routers/analytics.ts:200-215` / `src/pages/Analytics.tsx` |
| 原因 | endpoint 存在但 Analytics 页面未调用 |
| 影响 | 渠道趋势数据不可见 |
| 方案 | Analytics 页面添加渠道趋势图表或表格 |

---

## 🔵 LOW — 打磨项（6 个）

### #15 4 处静默吞错误，无用户反馈

| # | 文件 | 行号 | 说明 |
|---|------|------|------|
| 1 | `api/routers/index.ts` | 446 | interview.updateScore 联动评分异常被吞 |
| 2 | `api/routers/index.ts` | 1062 | autoGenerate 通知异常被吞 |
| 3 | `api/lib/notifications.ts` | 59 | webhook 发送异常被吞 |
| 4 | `src/pages/TalentPool.tsx` | 194-198 | 文件上传失败无提示 |
| **方案** | 至少在前端上传失败时显示 toast 提示 | 

### #16 硬编码头像路径 `/images/avatar1.jpg`

| 文件 | 行号 |
|------|------|
| `src/pages/Home.tsx` | 213 |
| `src/pages/Dashboard.tsx` | 149 |
| `src/pages/OfferManage.tsx` | 211, 379 |
| **方案** | 统一为默认头像组件或占位符，无头像时用姓名首字母 |

### #17 analytics.trends 周标签误导

| 文件 | `api/routers/analytics.ts:82-83` |
|------|------|
| 方案 | 标签加上年份或自然周序号 |

### #18 offerRouter 缺 getById

| 文件 | `api/routers/index.ts` |
|------|------|
| 影响 | 无法按 ID 获取单个 Offer（对比 candidate 有 getById） |
| 方案 | 添加 `offer.getById` 端点 |

### #19 Offer 筛选缺 expired 状态

| 文件 | `src/pages/OfferManage.tsx:183` |
|------|------|
| 影响 | `expired` 在 statusConfig 定义了但筛选按钮不包含 |
| 方案 | 筛选按钮添加 `expired` |

### #20 sendNotifications 查询语义错误

| 文件 | `api/lib/notifications.ts:18-21` |
|------|------|
| 问题 | `where(undefined as any)` 选择全部行，代码异味 |
| 方案 | 改为 `where()` 或用 drizzle 的 `sql` 模板 |

---

## 修复优先级建议

```
第一批 (1h):   #1 种子status  #5 Offer JOIN  #2 星座背景
第二批 (2h):   #7 生命周期按钮  #9 分页  #10 候选人删除  #3 级联删除
第三批 (2h):   #6 岗位匹配  #11 notes字段  #12 面试过滤  #13 通知管理
第四批 (1h):   #14 渠道趋势  #8 清理Dashboard  #15-20 打磨
```
