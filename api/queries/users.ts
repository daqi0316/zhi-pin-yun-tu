import { eq } from "drizzle-orm";
import { getDb } from "../../db/connection";
import * as schema from "../../db/schema";

export async function findUserByUsername(username: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, Number(unionId)))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: {
  unionId?: string;
  name?: string;
  avatar?: string;
  role?: string;
  lastSignInAt?: Date;
}) {
  const db = getDb();

  if (data.unionId) {
    const existing = await findUserByUnionId(data.unionId);
    if (existing) {
      await db.update(schema.users)
        .set({
          name: data.name ?? existing.name,
          role: data.role ?? existing.role,
        })
        .where(eq(schema.users.id, existing.id));
      return (await findUserById(existing.id))!;
    }
  }

  const username = `user_${data.unionId ?? Date.now()}`;
  const result = await db.insert(schema.users).values({
    username,
    password: "-",
    name: data.name,
    role: data.role,
  });
  const [created] = await db.select().from(schema.users).orderBy(schema.users.id).limit(1);
  return created!;
}