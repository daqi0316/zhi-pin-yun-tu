import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import { auditLogs } from "../../db/schema";
import { desc, eq, and, sql, like } from "drizzle-orm";

export const auditLogRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          entityType: z.string().optional(),
          entityId: z.number().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.entityType) {
        conditions.push(eq(auditLogs.entityType, input.entityType));
      }
      if (input?.entityId) {
        conditions.push(eq(auditLogs.entityId, input.entityId));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(auditLogs)
          .where(where)
          .orderBy(desc(auditLogs.createdAt))
          .limit(input?.pageSize ?? 50)
          .offset(((input?.page ?? 1) - 1) * (input?.pageSize ?? 50)),
        db
          .select({ count: sql<number>`cast(count(*) as unsigned)` })
          .from(auditLogs)
          .where(where),
      ]);

      return {
        items: items.map(log => ({
          ...log,
          changes: log.changes ? JSON.parse(log.changes) : null,
        })),
        total: totalResult[0]?.count ?? 0,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 50,
      };
    }),
});
