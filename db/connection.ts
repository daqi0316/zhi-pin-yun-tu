import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

let pool: mysql.Pool;

export function getDb() {
  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL || "mysql://root:root@localhost:3306/zhypx");
  }
  return drizzle(pool, { schema, mode: "default" });
}

export function getPool() {
  if (!pool) getDb();
  return pool;
}