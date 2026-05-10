import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import { candidates, interviews, offers, channels, alerts, workHistories, positions } from "../../db/schema";
import { eq, desc, sql, like, or, and } from "drizzle-orm";

// ─── Candidates ───
export const candidateRouter = createRouter({
  list: authedQuery
    .input(z.object({
      search: z.string().optional(),
      stage: z.string().optional(),
      source: z.string().optional(),
      status: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.search) {
        conditions.push(
          or(
            like(candidates.name, `%${input.search}%`),
            like(candidates.position, `%${input.search}%`),
            like(candidates.company, `%${input.search}%`),
            like(candidates.skills, `%${input.search}%`),
          )
        );
      }
      if (input?.stage && input.stage !== "全部") {
        conditions.push(eq(candidates.stage, input.stage));
      }
      if (input?.source && input.source !== "全部") {
        conditions.push(eq(candidates.source, input.source));
      }
      if (input?.status && input.status !== "全部") {
        conditions.push(eq(candidates.status, input.status));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const result = await db.select().from(candidates).where(where)
        .orderBy(desc(candidates.matchScore))
        .limit(input?.pageSize ?? 50)
        .offset(((input?.page ?? 1) - 1) * (input?.pageSize ?? 50));

      const totalResult = await db.select({ count: sql<number>`cast(count(*) as unsigned)` }).from(candidates).where(where);
      const total = totalResult[0]?.count ?? 0;

      return {
        items: result.map(c => ({ ...c, skills: JSON.parse(c.skills || "[]") })),
        total,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 50,
      };
    }),

  getById: authedQuery
    .input(z.number())
    .query(async ({ input }) => {
      const db = getDb();
      const candidate = await db.select().from(candidates).where(eq(candidates.id, input)).limit(1);
      if (!candidate[0]) throw new Error("Candidate not found");
      const workHistory = await db.select().from(workHistories).where(eq(workHistories.candidateId, input));
      return {
        ...candidate[0],
        skills: JSON.parse(candidate[0].skills || "[]"),
        workHistory,
      };
    }),

  create: authedQuery
    .input(z.object({
      name: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      position: z.string().optional(),
      company: z.string().optional(),
      experience: z.number().optional(),
      education: z.string().optional(),
      skills: z.array(z.string()).optional(),
      source: z.string().optional(),
      salary: z.string().optional(),
      stage: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(candidates).values({
        ...input,
        skills: JSON.stringify(input.skills || []),
        status: "在职-考虑机会",
      });
      const [created] = await db.select().from(candidates).orderBy(desc(candidates.id)).limit(1);
      return created;
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        position: z.string().optional(),
        company: z.string().optional(),
        experience: z.number().optional(),
        education: z.string().optional(),
        skills: z.array(z.string()).optional(),
        status: z.string().optional(),
        source: z.string().optional(),
        salary: z.string().optional(),
        matchScore: z.number().optional(),
        intentScore: z.number().optional(),
        stage: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = { ...input.data };
      if (updateData.skills) {
        updateData.skills = JSON.stringify(updateData.skills);
      }
      updateData.updatedAt = sql`CURRENT_TIMESTAMP()`;
      await db.update(candidates)
        .set(updateData)
        .where(eq(candidates.id, input.id));
      const [updated] = await db.select().from(candidates).where(eq(candidates.id, input.id)).limit(1);
      return updated;
    }),

  delete: authedQuery
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(candidates).where(eq(candidates.id, input));
      return { success: true };
    }),
});

// ─── Interviews ───
export const interviewRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    const result = await db.select().from(interviews).orderBy(desc(interviews.scheduledTime));
    return result;
  }),

  getByCandidateId: authedQuery
    .input(z.number())
    .query(async ({ input }) => {
      const db = getDb();
      return await db.select().from(interviews).where(eq(interviews.candidateId, input));
    }),

  updateScore: authedQuery
    .input(z.object({
      id: z.number(),
      scoreSkill: z.number().min(1).max(5).optional(),
      scoreProblem: z.number().min(1).max(5).optional(),
      scoreCommunication: z.number().min(1).max(5).optional(),
      scoreTeamwork: z.number().min(1).max(5).optional(),
      scoreCulture: z.number().min(1).max(5).optional(),
      feedback: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = { ...input };
      delete (updateData as any).id;

      if (input.scoreSkill || input.scoreProblem || input.scoreCommunication || input.scoreTeamwork || input.scoreCulture) {
        const s = {
          skill: input.scoreSkill ?? 0,
          problem: input.scoreProblem ?? 0,
          comm: input.scoreCommunication ?? 0,
          team: input.scoreTeamwork ?? 0,
          culture: input.scoreCulture ?? 0,
        };
        const total = (s.skill * 0.30 + s.problem * 0.20 + s.comm * 0.20 + s.team * 0.15 + s.culture * 0.15) / 5 * 100;
        updateData.totalScore = Math.round(total * 10) / 10;
      }

      await db.update(interviews)
        .set(updateData)
        .where(eq(interviews.id, input.id));
      const [updated] = await db.select().from(interviews).where(eq(interviews.id, input.id)).limit(1);
      return updated;
    }),
});

// ─── Offers ───
export const offerRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return await db.select().from(offers).orderBy(desc(offers.createdAt));
  }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      data: z.object({
        baseSalary: z.number().optional(),
        bonus: z.number().optional(),
        stock: z.number().optional(),
        status: z.string().optional(),
        acceptanceProbability: z.number().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = { ...input.data, updatedAt: sql`CURRENT_TIMESTAMP()` };
      if (input.data.baseSalary && input.data.bonus) {
        updateData.totalPackage = input.data.baseSalary * (12 + input.data.bonus) + (input.data.stock || 0) / 4;
      }
      await db.update(offers)
        .set(updateData)
        .where(eq(offers.id, input.id));
      const [updated] = await db.select().from(offers).where(eq(offers.id, input.id)).limit(1);
      return updated;
    }),
});

// ─── Channels ───
export const channelRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return await db.select().from(channels);
  }),
});

// ─── Alerts ───
export const alertRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }),

  markRead: authedQuery
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(alerts).set({ isRead: 1 }).where(eq(alerts.id, input));
      return { success: true };
    }),
});

// ─── Dashboard Stats ───
export const dashboardRouter = createRouter({
  stats: authedQuery.query(async () => {
    const db = getDb();
    const totalCandidates = (await db.select({ count: sql<number>`cast(count(*) as unsigned)` }).from(candidates))[0]?.count ?? 0;
    const totalInterviews = (await db.select({ count: sql<number>`cast(count(*) as unsigned)` }).from(interviews))[0]?.count ?? 0;
    const completedInterviews = (await db.select({ count: sql<number>`cast(count(*) as unsigned)` }).from(interviews).where(eq(interviews.status, "completed")))[0]?.count ?? 0;
    const totalOffers = (await db.select({ count: sql<number>`cast(count(*) as unsigned)` }).from(offers))[0]?.count ?? 0;
    const acceptedOffers = (await db.select({ count: sql<number>`cast(count(*) as unsigned)` }).from(offers).where(eq(offers.status, "accepted")))[0]?.count ?? 0;

    return {
      totalCandidates,
      monthlyApplications: 342,
      interviewPassRate: totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 1000) / 10 : 0,
      offerAcceptRate: totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 1000) / 10 : 0,
      avgHireDays: 26,
      monthlyHires: acceptedOffers,
    };
  }),

  activities: authedQuery.query(async () => {
    const db = getDb();
    const recentInterviews = await db.select().from(interviews)
      .orderBy(desc(interviews.scheduledTime)).limit(10);
    return recentInterviews.map(iv => ({
      id: `iv-${iv.id}`,
      user: iv.interviewer || "系统",
      action: iv.status === "completed" ? "完成了面试" : "安排了面试",
      target: `候选人 #${iv.candidateId}`,
      time: iv.scheduledTime || "",
      type: "interview",
    }));
  }),
});

// ─── Positions / JD ───
export const positionRouter = createRouter({
  list: authedQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.search) {
        conditions.push(
          or(
            like(positions.title, `%${input.search}%`),
            like(positions.company, `%${input.search}%`),
          )
        );
      }
      if (input?.status && input.status !== "全部") {
        conditions.push(eq(positions.status, input.status));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await db.select().from(positions).where(where).orderBy(desc(positions.createdAt));
    }),

  getById: authedQuery
    .input(z.number())
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(positions).where(eq(positions.id, input)).limit(1);
      if (!result[0]) throw new Error("Position not found");
      return { ...result[0], requiredSkills: JSON.parse(result[0].requiredSkills || "[]"), bonusSkills: JSON.parse(result[0].bonusSkills || "[]") };
    }),

  create: authedQuery
    .input(z.object({
      title: z.string().min(1),
      company: z.string().min(1),
      department: z.string().optional(),
      description: z.string().optional(),
      requiredSkills: z.array(z.string()).optional(),
      bonusSkills: z.array(z.string()).optional(),
      minExperience: z.number().optional(),
      maxExperience: z.number().optional(),
      minEducation: z.string().optional(),
      salaryMin: z.number().optional(),
      salaryMax: z.number().optional(),
      salaryRange: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, requiredSkills: JSON.stringify(input.requiredSkills || []), bonusSkills: JSON.stringify(input.bonusSkills || []) };
      await db.insert(positions).values(data);
      const [created] = await db.select().from(positions).orderBy(desc(positions.id)).limit(1);
      return created;
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        company: z.string().optional(),
        department: z.string().optional(),
        description: z.string().optional(),
        requiredSkills: z.array(z.string()).optional(),
        bonusSkills: z.array(z.string()).optional(),
        minExperience: z.number().optional(),
        maxExperience: z.number().optional(),
        minEducation: z.string().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        salaryRange: z.string().optional(),
        status: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = { ...input.data, updatedAt: sql`CURRENT_TIMESTAMP()` };
      if (updateData.requiredSkills) updateData.requiredSkills = JSON.stringify(updateData.requiredSkills);
      if (updateData.bonusSkills) updateData.bonusSkills = JSON.stringify(updateData.bonusSkills);
      await db.update(positions).set(updateData).where(eq(positions.id, input.id));
      const [updated] = await db.select().from(positions).where(eq(positions.id, input.id)).limit(1);
      return updated;
    }),

  delete: authedQuery
    .input(z.number())
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(positions).where(eq(positions.id, input));
      return { success: true };
    }),
});