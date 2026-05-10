# 开发工作流

## 日常开发流程

1. **先看 AGENTS.md** 了解项目概况和规矩
2. **看 tasks/active-task.md** 了解当前任务
3. **设计阶段**：新增功能先出方案，确认后再编码
4. **实现阶段**：小步提交，每完成一个功能点跑 `bash scripts/check.sh`
5. **测试阶段**：功能完成后跑 `npm test`
6. **存档点**：每完成一个功能提交 Git + 更新 docs/

## 新增 API 路由

```
1. 在 api/routers/ 下新建 router 文件（参考 index.ts 的写法）
2. 在 api/routers/index.ts 中注册
3. 在 api/router.ts 中合并
4. 写测试文件 xx.test.ts
5. 跑 npm test 验证
```

## 新增页面

```
1. 在 src/pages/ 下新建页面
2. 在 src/App.tsx 中添加路由
3. 前端开发时用 Vite HMR，实时看效果
```

## 数据库变更

```
npm run db:generate   # 生成迁移文件
npm run db:migrate    # 执行迁移
npm run db:push       # 直接推 schema（开发环境）
```

## Agent 工作流

1. Agent 读取 AGENTS.md 了解项目
2. 查看 tasks/active-task.md 明确当前任务
3. 如需新增功能 → 先在 docs/ 下写方案文档
4. 编码 → 每次修改后跑 npm run check 确保不坏
5. 跑 npm test 验证
6. 更新 tasks/active-task.md 进度
7. 任务完成 → Git commit + 更新相关文档

## 沟通规范

- 所有 Agent 输出必须使用中文
- 回答先给一句话结论，再展开
- 不要使用 mock/假数据，除非明确要求
