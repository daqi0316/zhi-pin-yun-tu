#!/bin/bash
set -e

echo "═══════════════════════════════════"
echo "  智聘云图 全量检查"
echo "═══════════════════════════════════"
echo ""

echo "📐  代码格式检查 (Prettier)..."
npx prettier --check "api/**/*.ts" "src/**/*.{ts,tsx}" "db/**/*.ts" "contracts/**/*.ts" 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  ✅ 格式通过"
else
  echo "  ⚠️  格式有问题，运行 npm run format 修复"
fi
echo ""

echo "🔍  ESLint 检查..."
npx eslint . --max-warnings=50 2>/dev/null && echo "  ✅ Lint 通过" || echo "  ⚠️  Lint 有警告/错误"
echo ""

echo "📝  TypeScript 类型检查..."
npx tsc -b 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  ✅ 类型检查通过"
else
  echo "  ❌ 类型检查失败，请修复"
  exit 1
fi
echo ""

echo "🧪  运行测试..."
npx vitest run 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  ✅ 测试全部通过"
else
  echo "  ❌ 测试失败，请修复"
  exit 1
fi
echo ""

echo "═══════════════════════════════════"
echo "  ✅ 全量检查通过，可以提交!"
echo "═══════════════════════════════════"