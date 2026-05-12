import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:723319@localhost:3306/zhypx";

let pool: mysql.Pool;

export function getDb() {
  if (!pool) {
    pool = mysql.createPool(DATABASE_URL);
  }
  return drizzle(pool, { schema, mode: "default" });
}

export function getPool() {
  if (!pool) getDb();
  return pool;
}