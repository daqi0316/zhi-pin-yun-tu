#!/bin/sh
set -e

echo "⏳ Waiting for MySQL..."
until node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection(process.env.DATABASE_URL)
    .then(c => { c.end(); process.exit(0); })
    .catch(() => process.exit(1));
" 2>/dev/null; do
  sleep 2
done

echo "✅ MySQL is ready"
echo "🔄 Pushing database schema..."
npx drizzle-kit push

echo "🌱 Seeding database..."
npx tsx db/seed.ts

echo "🚀 Starting application..."
exec node dist/boot.js
