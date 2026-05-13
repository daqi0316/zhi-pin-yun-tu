import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../../db/connection";
import { users, roles, userRoles } from "../../db/schema";
import { eq, desc, sql, like, or, and, inArray } from "drizzle-orm";
import { hashSync, compareSync } from "bcryptjs";

export const usersRouter = createRouter({
  list: adminQuery
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
          roleId: z.number().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.search) {
        conditions.push(
          or(
            like(users.username, `%${input.search}%`),
            like(users.name, `%${input.search}%`)
          )
        );
      }
      if (input?.status && input.status !== "全部") {
        conditions.push(eq(users.status, input.status));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(input?.pageSize ?? 20)
        .offset(((input?.page ?? 1) - 1) * (input?.pageSize ?? 20));

      const totalResult = await db
        .select({ count: sql<number>`cast(count(*) as unsigned)` })
        .from(users)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      const userIds = result.map(u => u.id);
      const allUserRoles =
        userIds.length > 0
          ? await db
              .select()
              .from(userRoles)
              .where(inArray(userRoles.userId, userIds))
          : [];

      const allRoles = await db.select().from(roles);
      const roleMap = new Map(allRoles.map(r => [r.id, r]));

      const items = result.map(u => {
        const uRoles = allUserRoles
          .filter(ur => ur.userId === u.id)
          .map(ur => roleMap.get(ur.roleId))
          .filter(Boolean);
        const primaryRole = uRoles[0]?.name ?? u.role;
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          role: primaryRole,
          status: u.status,
          roleIds: uRoles.map(r => r!.id),
          roleLabels: uRoles.map(r => r!.label),
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      });

      return {
        items,
        total,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
      };
    }),

  listRoles: adminQuery.query(async () => {
    const db = getDb();
    return await db.select().from(roles).orderBy(roles.id);
  }),

  getById: adminQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, input))
      .limit(1);
    if (!user) throw new Error("用户不存在");

    const ur = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, input));
    const allRoles = await db.select().from(roles);
    const roleMap = new Map(allRoles.map(r => [r.id, r]));
    const userRoleList = ur.map(r => roleMap.get(r.roleId)).filter(Boolean);

    return {
      ...user,
      roleIds: userRoleList.map(r => r!.id),
      roleLabels: userRoleList.map(r => r!.label),
    };
  }),

  create: adminQuery
    .input(
      z.object({
        username: z.string().min(2).max(100),
        password: z.string().min(4),
        name: z.string().min(1),
        roleIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);
      if (existing) throw new Error("用户名已存在");

      const roleList = await db
        .select()
        .from(roles)
        .where(inArray(roles.id, input.roleIds));
      const primaryRole = roleList[0]?.name ?? "user";

      const [inserted] = await db
        .insert(users)
        .values({
          username: input.username,
          password: hashSync(input.password, 10),
          name: input.name,
          role: primaryRole,
        })
        .$returningId();

      const userId = inserted.insertId ?? inserted.id;

      await db.insert(userRoles).values(
        input.roleIds.map(roleId => ({ userId, roleId }))
      );

      return { id: userId, success: true };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).optional(),
          roleIds: z.array(z.number()).min(1).optional(),
          status: z.enum(["active", "disabled"]).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const updateData: Record<string, unknown> = {};
      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.status !== undefined)
        updateData.status = input.data.status;

      if (input.data.roleIds !== undefined) {
        const roleList = await db
          .select()
          .from(roles)
          .where(inArray(roles.id, input.data.roleIds));
        updateData.role = roleList[0]?.name ?? "user";

        await db
          .delete(userRoles)
          .where(eq(userRoles.userId, input.id));
        await db.insert(userRoles).values(
          input.data.roleIds.map(roleId => ({
            userId: input.id,
            roleId,
          }))
        );
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = sql`CURRENT_TIMESTAMP()`;
        await db.update(users).set(updateData).where(eq(users.id, input.id));
      }

      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      return updated;
    }),

  delete: adminQuery.input(z.number()).mutation(async ({ input, ctx }) => {
    if (input === ctx.user?.id) {
      throw new Error("不能删除自己的账号");
    }
    const db = getDb();
    await db.delete(userRoles).where(eq(userRoles.userId, input));
    await db.delete(users).where(eq(users.id, input));
    return { success: true };
  }),

  changePassword: authedQuery
    .input(
      z.object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(4),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .limit(1);
      if (!user) throw new Error("用户不存在");

      const valid = user.password.startsWith("$2")
        ? compareSync(input.oldPassword, user.password)
        : user.password === input.oldPassword;

      if (!valid) throw new Error("原密码错误");

      await db
        .update(users)
        .set({
          password: hashSync(input.newPassword, 10),
          updatedAt: sql`CURRENT_TIMESTAMP()`,
        })
        .where(eq(users.id, ctx.user!.id));

      return { success: true };
    }),

  resetPassword: adminQuery
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(4),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({
          password: hashSync(input.newPassword, 10),
          updatedAt: sql`CURRENT_TIMESTAMP()`,
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
