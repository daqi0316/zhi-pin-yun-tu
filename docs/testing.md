# 测试策略

## 测试框架

使用 Vitest 4，配置文件 `vitest.config.ts`。

## 运行测试

```bash
# 全量运行
npm test

# 仅运行 API 测试
npx vitest run api/

# 监听模式（开发时）
npx vitest
```

## 测试文件位置

测试文件用 `.test.ts` 或 `.spec.ts` 后缀，放在被测模块同目录下。

当前配置（`vitest.config.ts`）只扫描：
- `api/**/*.test.ts`
- `api/**/*.spec.ts`

如需添加前端组件测试，需扩展 `include` 配置。

## 测试类型

| 类型 | 范围 | 位置 |
|---|------|------|
| 单元测试 | 纯函数、工具函数 | 同目录下 |
| API 测试 | tRPC 路由逻辑 | api/ 下 |
| 数据库测试 | 查询/写入逻辑 | db/ 下 |

## 测试规范

- API 测试使用真实 SQLite 内存数据库（`:memory:`）或测试用 db 文件
- 不在测试中修改 `data/app.db` 生产数据
- 每次测试前清理/重置数据
- 测试函数命名：`describe('模块名')` + `it('应该能做什么')`
