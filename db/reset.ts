import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

async function reset() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const url = new URL(DATABASE_URL);
  const { execSync } = await import("child_process");

  console.log("🗑️  Dropping and recreating database...");
  const rootUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}`;
  const connection = await mysql.createConnection(rootUrl);
  await connection.execute(
    `DROP DATABASE IF EXISTS \`${url.pathname.slice(1)}\``
  );
  await connection.execute(
    `CREATE DATABASE \`${url.pathname.slice(1)}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
  console.log("✅ Database recreated.");

  console.log("📐 Pushing schema...");
  execSync("npx drizzle-kit push", { stdio: "inherit" });

  console.log("🌱 Seeding data...");
  execSync("npx tsx db/seed.ts", { stdio: "inherit" });

  console.log("\n🎉 Database reset complete! You can now run `npm run dev`.");
}

reset().catch(err => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
