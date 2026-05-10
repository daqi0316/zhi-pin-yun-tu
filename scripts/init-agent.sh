#!/bin/bash
set -e

echo "🔧 智聘云图 — Agent 环境初始化"
echo ""

# 1. 检查 Node.js
if ! command -v node &>/dev/null; then
  echo "❌ Node.js 未安装，请先安装 Node.js 20+"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# 2. 检查 Docker
if ! command -v docker &>/dev/null; then
  echo "❌ Docker 未安装，请先安装 Docker"
  exit 1
fi
echo "✅ Docker 已安装"

# 3. 检查 MySQL 容器
if ! docker compose ps | grep -q "mysql.*running\|mysql.*Up"; then
  echo "🗄️  MySQL 容器未运行，启动中..."
  docker compose up -d
  echo "⏳ 等待 MySQL 就绪..."
  sleep 10
else
  echo "✅ MySQL 容器已运行"
fi

# 4. 安装依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
else
  echo "✅ node_modules 已存在"
fi

# 5. 配置 .env
if [ ! -f ".env" ]; then
  echo "📝 创建 .env 文件..."
  cp .env.example .env
  echo "⚠️  请编辑 .env 填入正确的配置值"
else
  echo "✅ .env 文件已存在"
fi

# 6. 推送数据库 schema
echo "🗄️  推送数据库 schema..."
npx drizzle-kit push 2>/dev/null && echo "✅ Schema 推送成功" || echo "⚠️  Schema 推送失败，请检查 DATABASE_URL"

# 7. 检查 TypeScript
echo "🔍 检查 TypeScript 编译..."
npx tsc --noEmit 2>/dev/null && echo "✅ TypeScript 编译无错误" || echo "⚠️  TypeScript 有错误，请手动检查"

# 8. 显示运行信息
echo ""
echo "🚀 启动开发服务器: npm run dev"
echo "   http://localhost:3000"
echo "🧪 运行测试:       npm test"
echo "📋 全量检查:       bash scripts/check.sh"
echo "🌱 初始化数据:     npm run db:seed"