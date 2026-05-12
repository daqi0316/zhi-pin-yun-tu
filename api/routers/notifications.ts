import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import { notificationSubscriptions } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export const notificationRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return await db
      .select()
      .from(notificationSubscriptions)
      .orderBy(desc(notificationSubscriptions.createdAt));
  }),

  create: authedQuery
    .input(
      z.object({
        channel: z.enum(["webhook", "dingtalk"]),
        webhookUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(notificationSubscriptions).values({
        channel: input.channel,
        webhookUrl: input.webhookUrl,
        enabled: 1,
        createdBy: ctx.user?.id ?? null,
      });
      const [created] = await db
        .select()
        .from(notificationSubscriptions)
        .orderBy(desc(notificationSubscriptions.id))
        .limit(1);
      return created;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          enabled: z.number().min(0).max(1).optional(),
          webhookUrl: z.string().url().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(notificationSubscriptions)
        .set(input.data)
        .where(eq(notificationSubscriptions.id, input.id));
      const [updated] = await db
        .select()
        .from(notificationSubscriptions)
        .where(eq(notificationSubscriptions.id, input.id))
        .limit(1);
      return updated;
    }),

  delete: authedQuery.input(z.number()).mutation(async ({ input }) => {
    const db = getDb();
    await db
      .delete(notificationSubscriptions)
      .where(eq(notificationSubscriptions.id, input));
    return { success: true };
  }),
});
