import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

let pool: mysql.Pool;

export function getDb() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  if (!pool) {
    pool = mysql.createPool(DATABASE_URL);
  }
  return drizzle(pool, { schema, mode: "default" });
}

export function getPool() {
  if (!pool) getDb();
  return pool;
}
