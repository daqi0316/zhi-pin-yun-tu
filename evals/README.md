# 评估用例集

用于 Harness Engineering 的回归测试体系（eval set）。
每次修改 Harness（AGENTS.md、scripts/、工具配置）后，在这些用例上复跑，验证没有退化。

## 用例

| ID | 描述 | 期望结果 | 优先级 |
|----|------|---------|--------|
| E01 | 启动开发服务器 | `npm run dev` 启动成功，访问 localhost:3000 返回页面 | P0 |
| E02 | TypeScript 类型检查 | `npx tsc -b` 无错误 | P0 |
| E03 | 全量测试 | `npm test` 全部通过 | P0 |
| E04 | 候选人列表查询 | tRPC `candidate.list` 返回候选人数组 | P1 |
| E05 | 候选人详情查询 | tRPC `candidate.getById` 返回含 workHistory | P1 |
| E06 | 候选人创建 | 创建候选人后能在列表中找到 | P1 |
| E07 | 面试评分更新 | 提交评分后 totalScore 正确计算 | P1 |
| E08 | 数据库连接 | `getDb()` 正常返回 drizzle 实例 | P1 |
| E09 | 脚本 check.sh 通过 | 完整跑通所有检查步骤 | P0 |
| E10 | 静态资源构建 | `npm run build` 成功 | P1 |

## 使用方式

```bash
# 跑自动化 eval
npx vitest run evals/

# 手动验证 E01（启动服务器）
npm run dev
```
