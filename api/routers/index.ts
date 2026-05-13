import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../../db/connection";
import {
  candidates,
  interviews,
  offers,
  channels,
  alerts,
  workHistories,
  positions,
} from "../../db/schema";
import { eq, desc, sql, like, or, and } from "drizzle-orm";
import { calculateResumeScore, type ScoringInput } from "../scoring";
import { recordAudit } from "../lib/audit";
import { sendNotifications } from "../lib/notifications";

// ─── Candidates ───
export const candidateRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          search: z.string().optional(),
          stage: z.string().optional(),
          source: z.string().optional(),
          status: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.search) {
        conditions.push(
          or(
            like(candidates.name, `%${input.search}%`),
            like(candidates.position, `%${input.search}%`),
            like(candidates.company, `%${input.search}%`),
            like(candidates.skills, `%${input.search}%`)
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
      const result = await db
        .select()
        .from(candidates)
        .where(where)
        .orderBy(desc(candidates.matchScore))
        .limit(input?.pageSize ?? 50)
        .offset(((input?.page ?? 1) - 1) * (input?.pageSize ?? 50));

      const totalResult = await db
        .select({ count: sql<number>`cast(count(*) as unsigned)` })
        .from(candidates)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      return {
        items: result.map(c => ({
          ...c,
          skills: JSON.parse(c.skills || "[]"),
        })),
        total,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 50,
      };
    }),

  getById: authedQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    const candidate = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, input))
      .limit(1);
    if (!candidate[0]) throw new Error("Candidate not found");
    const workHistory = await db
      .select()
      .from(workHistories)
      .where(eq(workHistories.candidateId, input));
    return {
      ...candidate[0],
      skills: JSON.parse(candidate[0].skills || "[]"),
      workHistory,
    };
  }),

  create: authedQuery
    .input(
      z.object({
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
        resumeUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(candidates).values({
        ...input,
        skills: JSON.stringify(input.skills || []),
        status: "在职-考虑机会",
      });
      const [created] = await db
        .select()
        .from(candidates)
        .orderBy(desc(candidates.id))
        .limit(1);
      await recordAudit({
        action: "create",
        entityType: "candidate",
        entityId: created.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        changes: { name: { old: null, new: input.name } },
      });
      return created;
  }),

  getById: authedQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    const [offer] = await db
      .select()
      .from(offers)
      .where(eq(offers.id, input))
      .limit(1);
    if (!offer) throw new Error("Offer not found");
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, offer.candidateId ?? 0))
      .limit(1);
    const [position] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, offer.positionId ?? 0))
      .limit(1);
    return {
      ...offer,
      candidateName: candidate?.name ?? "候选人",
      candidateAvatar: candidate?.avatar ?? "",
      positionTitle: position?.title ?? "",
    };
  }),

  update: authedQuery
    .input(
      z.object({
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
          resumeUrl: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, input.id))
        .limit(1);
      const updateData: Record<string, unknown> = { ...input.data };
      if (updateData.skills) {
        updateData.skills = JSON.stringify(updateData.skills);
      }
      updateData.updatedAt = sql`CURRENT_TIMESTAMP()`;
      await db
        .update(candidates)
        .set(updateData)
        .where(eq(candidates.id, input.id));
      const [updated] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, input.id))
        .limit(1);
      if (existing) {
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, val] of Object.entries(input.data)) {
          if (existing[key as keyof typeof existing] !== val) {
            changes[key] = {
              old: existing[key as keyof typeof existing],
              new: val,
            };
          }
        }
        if (Object.keys(changes).length > 0) {
          await recordAudit({
            action: "update",
            entityType: "candidate",
            entityId: input.id,
            userId: ctx.user?.id,
            userName: ctx.user?.name,
            changes,
          });
        }
      }
      return updated;
    }),

  delete: adminQuery.input(z.number()).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete(candidates).where(eq(candidates.id, input));
    await recordAudit({
      action: "delete",
      entityType: "candidate",
      entityId: input,
      userId: ctx.user?.id,
      userName: ctx.user?.name,
    });
    return { success: true };
  }),

  detail: authedQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, input))
      .limit(1);
    if (!candidate) throw new Error("Candidate not found");

    const workHistory = await db
      .select()
      .from(workHistories)
      .where(eq(workHistories.candidateId, input));

    const candidateInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.candidateId, input))
      .orderBy(desc(interviews.scheduledTime));

    const candidateOffers = await db
      .select()
      .from(offers)
      .where(eq(offers.candidateId, input))
      .orderBy(desc(offers.createdAt));

    const candidateAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.candidateId, input))
      .orderBy(desc(alerts.createdAt));

    // Build timeline
    const timeline: Array<{
      date: string;
      type: "candidate" | "interview" | "offer" | "alert" | "stage";
      title: string;
      description: string;
    }> = [];

    timeline.push({
      date: candidate.createdAt,
      type: "candidate",
      title: "候选人入库",
      description: `${candidate.name} 通过 ${candidate.source || "未知渠道"} 进入人才库`,
    });

    for (const iv of candidateInterviews) {
      timeline.push({
        date: iv.createdAt,
        type: "interview",
        title: iv.status === "completed" ? "面试完成" : "安排面试",
        description: `${iv.stage || ""} · ${iv.interviewer || ""} (${iv.type || ""})${iv.totalScore ? ` · 得分${iv.totalScore}` : ""}`,
      });
    }

    for (const o of candidateOffers) {
      timeline.push({
        date: o.createdAt,
        type: "offer",
        title:
          o.status === "accepted"
            ? "Offer已接受"
            : o.status === "sent"
              ? "Offer已发送"
              : o.status === "negotiating"
                ? "Offer谈判中"
                : "Offer草稿",
        description: `总包 ${o.totalPackage ? (o.totalPackage / 10000).toFixed(1) + "万" : "待定"}${o.recruiter ? ` · ${o.recruiter}` : ""}`,
      });
    }

    for (const a of candidateAlerts) {
      timeline.push({
        date: a.createdAt,
        type: "alert",
        title: a.title,
        description: a.description || "",
      });
    }

    timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      ...candidate,
      skills: JSON.parse(candidate.skills || "[]"),
      workHistory,
      interviews: candidateInterviews,
      offers: candidateOffers,
      alerts: candidateAlerts,
      timeline,
    };
  }),
});

// ─── Interviews ───
export const interviewRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          status: z.string().optional(),
          stage: z.string().optional(),
          search: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status && input.status !== "全部") {
        conditions.push(eq(interviews.status, input.status));
      }
      if (input?.stage && input.stage !== "全部") {
        conditions.push(eq(interviews.stage, input.stage));
      }
      if (input?.search) {
        conditions.push(
          or(
            like(candidates.name, `%${input.search}%`),
            like(interviews.interviewer, `%${input.search}%`),
            like(interviews.stage, `%${input.search}%`)
          )
        );
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select()
        .from(interviews)
        .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
        .where(where)
        .orderBy(desc(interviews.scheduledTime))
        .limit(input?.pageSize ?? 50)
        .offset(((input?.page ?? 1) - 1) * (input?.pageSize ?? 50));

      const totalResult = await db
        .select({ count: sql<number>`cast(count(*) as unsigned)` })
        .from(interviews)
        .where(where);
      const total = totalResult[0]?.count ?? 0;

      return {
        items: result,
        total,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 50,
      };
    }),

  getByCandidateId: authedQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    return await db
      .select()
      .from(interviews)
      .where(eq(interviews.candidateId, input));
  }),

  updateScore: authedQuery
    .input(
      z.object({
        id: z.number(),
        scoreSkill: z.number().min(1).max(5).optional(),
        scoreProblem: z.number().min(1).max(5).optional(),
        scoreCommunication: z.number().min(1).max(5).optional(),
        scoreTeamwork: z.number().min(1).max(5).optional(),
        scoreCulture: z.number().min(1).max(5).optional(),
        feedback: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(interviews)
        .where(eq(interviews.id, input.id))
        .limit(1);
      const updateData: Record<string, unknown> = { ...input };
      delete (updateData as any).id;

      if (
        input.scoreSkill ||
        input.scoreProblem ||
        input.scoreCommunication ||
        input.scoreTeamwork ||
        input.scoreCulture
      ) {
        const s = {
          skill: input.scoreSkill ?? 0,
          problem: input.scoreProblem ?? 0,
          comm: input.scoreCommunication ?? 0,
          team: input.scoreTeamwork ?? 0,
          culture: input.scoreCulture ?? 0,
        };
        const total =
          ((s.skill * 0.3 +
            s.problem * 0.2 +
            s.comm * 0.2 +
            s.team * 0.15 +
            s.culture * 0.15) /
            5) *
          100;
        updateData.totalScore = Math.round(total * 10) / 10;
      }

      await db
        .update(interviews)
        .set(updateData)
        .where(eq(interviews.id, input.id));
      const [updated] = await db
        .select()
        .from(interviews)
        .where(eq(interviews.id, input.id))
        .limit(1);

      if (updated && updated.positionId && updated.candidateId) {
        try {
          const [candidate] = await db
            .select()
            .from(candidates)
            .where(eq(candidates.id, updated.candidateId))
            .limit(1);
          const [position] = await db
            .select()
            .from(positions)
            .where(eq(positions.id, updated.positionId))
            .limit(1);

          if (candidate && position) {
            const workHistory = await db
              .select()
              .from(workHistories)
              .where(eq(workHistories.candidateId, candidate.id));

            const scoringInput: ScoringInput = {
              candidateSkills: JSON.parse(candidate.skills || "[]"),
              candidateExperience: candidate.experience ?? 0,
              candidateEducation: candidate.education ?? "",
              candidateSalaryExpectation:
                candidate.salaryExpectation ?? undefined,
              workHistory: workHistory.map(w => ({
                company: w.company,
                position: w.position ?? undefined,
                startDate: w.startDate ?? undefined,
                endDate: w.endDate ?? undefined,
              })),
              positionRequiredSkills: JSON.parse(
                position.requiredSkills || "[]"
              ),
              positionBonusSkills: JSON.parse(position.bonusSkills || "[]"),
              positionMinExperience: position.minExperience ?? 0,
              positionMaxExperience: position.maxExperience ?? 10,
              positionSalaryMin: position.salaryMin ?? undefined,
              positionSalaryMax: position.salaryMax ?? undefined,
            };

            const result = calculateResumeScore(scoringInput);
            await db
              .update(candidates)
              .set({ matchScore: result.total })
              .where(eq(candidates.id, candidate.id));
          }
        } catch (e) {
          console.error("Failed to rescore after interview update:", e);
        }
      }

      if (existing) {
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, val] of Object.entries(input)) {
          if (key !== "id" && existing[key as keyof typeof existing] !== val) {
            changes[key] = {
              old: existing[key as keyof typeof existing],
              new: val,
            };
          }
        }
        if (Object.keys(changes).length > 0) {
          await recordAudit({
            action: "update",
            entityType: "interview",
            entityId: input.id,
            userId: ctx.user?.id,
            userName: ctx.user?.name,
            changes,
          });
        }
      }

      return updated;
    }),

  create: authedQuery
    .input(
      z.object({
        candidateId: z.number(),
        positionId: z.number().optional(),
        stage: z.string().optional(),
        interviewer: z.string().optional(),
        scheduledTime: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(interviews).values({
        candidateId: input.candidateId,
        positionId: input.positionId,
        stage: input.stage ?? "初筛",
        interviewer: input.interviewer ?? "面试官",
        scheduledTime: input.scheduledTime ?? new Date().toISOString(),
        type: input.type ?? "视频",
        status: "pending",
      });
      const [created] = await db
        .select()
        .from(interviews)
        .orderBy(desc(interviews.id))
        .limit(1);
      await recordAudit({
        action: "create",
        entityType: "interview",
        entityId: created.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        changes: { stage: { old: null, new: input.stage ?? "初筛" } },
      });
      return created;
    }),

  delete: adminQuery.input(z.number()).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete(interviews).where(eq(interviews.id, input));
    await recordAudit({
      action: "delete",
      entityType: "interview",
      entityId: input,
      userId: ctx.user?.id,
      userName: ctx.user?.name,
    });
    return { success: true };
  }),

  calendar: authedQuery
    .input(
      z
        .object({
          year: z.number().optional(),
          month: z.number().min(1).max(12).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const year = input?.year ?? now.getFullYear();
      const month = input?.month ?? now.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const allInterviews = await db
        .select()
        .from(interviews)
        .orderBy(desc(interviews.scheduledTime));

      const monthInterviews = allInterviews.filter(iv => {
        if (!iv.scheduledTime) return false;
        const t = new Date(iv.scheduledTime).getTime();
        const s = new Date(startDate).getTime();
        const e = new Date(endDate).getTime();
        return t >= s && t <= e;
      });

      const days: Record<string, typeof allInterviews> = {};
      for (const iv of monthInterviews) {
        const day = iv.scheduledTime!.slice(0, 10);
        if (!days[day]) days[day] = [];
        days[day].push(iv);
      }

      return {
        year,
        month,
        total: monthInterviews.length,
        days: Object.entries(days).map(([date, items]) => ({
          date,
          count: items.length,
          items,
        })),
      };
    }),
});

// ─── Offers ───
export const offerRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        offer: offers,
        candidateName: candidates.name,
        candidateAvatar: candidates.avatar,
        candidatePhone: candidates.phone,
        candidateEmail: candidates.email,
        positionTitle: positions.title,
      })
      .from(offers)
      .leftJoin(candidates, eq(offers.candidateId, candidates.id))
      .leftJoin(positions, eq(offers.positionId, positions.id))
      .orderBy(desc(offers.createdAt));
    return rows.map(r => ({
      ...r.offer,
      candidateName: r.candidateName ?? "候选人",
      candidateAvatar: r.candidateAvatar ?? "/images/avatar1.jpg",
      candidatePhone: r.candidatePhone ?? "",
      candidateEmail: r.candidateEmail ?? "",
      positionTitle: r.positionTitle ?? "",
    }));
  }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          baseSalary: z.number().optional(),
          bonus: z.number().optional(),
          stock: z.number().optional(),
          status: z.string().optional(),
          acceptanceProbability: z.number().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, input.id))
        .limit(1);
      const updateData: Record<string, unknown> = {
        ...input.data,
        updatedAt: sql`CURRENT_TIMESTAMP()`,
      };
      if (input.data.baseSalary && input.data.bonus) {
        updateData.totalPackage =
          input.data.baseSalary * (12 + input.data.bonus) +
          (input.data.stock || 0) / 4;
      }
      await db.update(offers).set(updateData).where(eq(offers.id, input.id));
      const [updated] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, input.id))
        .limit(1);
      if (existing) {
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, val] of Object.entries(input.data)) {
          if (existing[key as keyof typeof existing] !== val) {
            changes[key] = {
              old: existing[key as keyof typeof existing],
              new: val,
            };
          }
        }
        if (Object.keys(changes).length > 0) {
          await recordAudit({
            action: "update",
            entityType: "offer",
            entityId: input.id,
            userId: ctx.user?.id,
            userName: ctx.user?.name,
            changes,
          });
        }
      }
      return updated;
    }),

  create: authedQuery
    .input(
      z.object({
        candidateId: z.number(),
        positionId: z.number().optional(),
        baseSalary: z.number().optional(),
        bonus: z.number().optional(),
        stock: z.number().optional(),
        status: z.string().optional(),
        recruiter: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const base = input.baseSalary ?? 0;
      const bon = input.bonus ?? 0;
      const stk = input.stock ?? 0;
      const totalPackage = base * (12 + bon) + stk / 4;
      await db.insert(offers).values({
        candidateId: input.candidateId,
        positionId: input.positionId,
        baseSalary: base,
        bonus: bon,
        stock: stk,
        totalPackage,
        status: input.status ?? "draft",
        recruiter: input.recruiter,
        notes: input.notes,
      });
      const [created] = await db
        .select()
        .from(offers)
        .orderBy(desc(offers.id))
        .limit(1);
      await recordAudit({
        action: "create",
        entityType: "offer",
        entityId: created.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        changes: { totalPackage: { old: null, new: totalPackage } },
      });
      return created;
    }),

  delete: adminQuery.input(z.number()).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete(offers).where(eq(offers.id, input));
    await recordAudit({
      action: "delete",
      entityType: "offer",
      entityId: input,
      userId: ctx.user?.id,
      userName: ctx.user?.name,
    });
    return { success: true };
  }),
});

// ─── Channels ───
export const channelRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return await db.select().from(channels);
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string().optional(),
        cost: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(channels).values({
        name: input.name,
        type: input.type ?? "线上招聘",
        cost: input.cost ?? 0,
        status: "active",
      });
      const [created] = await db
        .select()
        .from(channels)
        .orderBy(desc(channels.id))
        .limit(1);
      await recordAudit({
        action: "create",
        entityType: "channel",
        entityId: created.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        changes: { name: { old: null, new: input.name } },
      });
      return created;
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          type: z.string().optional(),
          applications: z.number().optional(),
          interviews: z.number().optional(),
          offers: z.number().optional(),
          conversionRate: z.number().optional(),
          cost: z.number().optional(),
          roi: z.number().optional(),
          status: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .update(channels)
        .set(input.data as any)
        .where(eq(channels.id, input.id));
      const [updated] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, input.id))
        .limit(1);
      await recordAudit({
        action: "update",
        entityType: "channel",
        entityId: input.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
      });
      return updated;
    }),

  delete: adminQuery.input(z.number()).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete(channels).where(eq(channels.id, input));
    await recordAudit({
      action: "delete",
      entityType: "channel",
      entityId: input,
      userId: ctx.user?.id,
      userName: ctx.user?.name,
    });
    return { success: true };
  }),
});

// ─── Alerts ───
export const alertRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }),

  markRead: authedQuery.input(z.number()).mutation(async ({ input }) => {
    const db = getDb();
    await db.update(alerts).set({ isRead: 1 }).where(eq(alerts.id, input));
    return { success: true };
  }),

  markAllRead: authedQuery.mutation(async () => {
    const db = getDb();
    await db.update(alerts).set({ isRead: 1 }).where(eq(alerts.isRead, 0));
    return { success: true };
  }),

  create: adminQuery
    .input(
      z.object({
        type: z.enum(["risk", "warning", "info", "success"]),
        title: z.string().min(1),
        description: z.string().optional(),
        candidateId: z.number().optional(),
        action: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(alerts).values({
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        candidateId: input.candidateId ?? null,
        action: input.action ?? null,
        isRead: 0,
      });
      const [created] = await db
        .select()
        .from(alerts)
        .orderBy(desc(alerts.id))
        .limit(1);
      await recordAudit({
        action: "create",
        entityType: "alert",
        entityId: created.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        changes: { title: { old: null, new: input.title } },
      });
      sendNotifications({
        id: created.id,
        type: created.type || "info",
        title: created.title,
        description: created.description,
        candidateId: created.candidateId,
        action: created.action,
      }).catch(() => {});
      return created;
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          type: z.enum(["risk", "warning", "info", "success"]).optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          candidateId: z.number().optional(),
          action: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = { ...input.data };
      if (input.data.candidateId === undefined) delete updateData.candidateId;
      await db.update(alerts).set(updateData).where(eq(alerts.id, input.id));
      const [updated] = await db
        .select()
        .from(alerts)
        .where(eq(alerts.id, input.id))
        .limit(1);
      await recordAudit({
        action: "update",
        entityType: "alert",
        entityId: input.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
      });
      return updated;
    }),

  delete: adminQuery.input(z.number()).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete(alerts).where(eq(alerts.id, input));
    await recordAudit({
      action: "delete",
      entityType: "alert",
      entityId: input,
      userId: ctx.user?.id,
      userName: ctx.user?.name,
    });
    return { success: true };
  }),

  executeAction: authedQuery.input(z.number()).mutation(async ({ input }) => {
    const db = getDb();
    const [alert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, input))
      .limit(1);
    if (!alert) throw new Error("预警不存在");

    await db.update(alerts).set({ isRead: 1 }).where(eq(alerts.id, input));

    if (alert.candidateId) {
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, alert.candidateId))
        .limit(1);

      if (candidate && alert.type === "risk") {
        await db
          .update(candidates)
          .set({ status: "在职-考虑机会", updatedAt: sql`CURRENT_TIMESTAMP()` })
          .where(eq(candidates.id, alert.candidateId));
      }
    }

    return {
      success: true,
      alertId: input,
      action: alert.action,
      candidateId: alert.candidateId,
      type: alert.type,
    };
  }),

  autoGenerate: adminQuery.mutation(async () => {
    const db = getDb();
    const now = new Date();
    const generated: Array<{ title: string; type: string }> = [];

    const allCandidates = await db.select().from(candidates);
    const allInterviews = await db.select().from(interviews);
    const allOffers = await db.select().from(offers);

    // 1. 面试超时预警
    const overdueInterviews = allInterviews.filter(iv => {
      if (iv.status !== "pending" || !iv.scheduledTime) return false;
      const st = new Date(iv.scheduledTime);
      return st < now && now.getTime() - st.getTime() > 24 * 60 * 60 * 1000;
    });
    for (const iv of overdueInterviews) {
      const exists = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.candidateId, iv.candidateId),
            eq(alerts.type, "warning"),
            like(alerts.title, "%面试超时%")
          )
        )
        .limit(1);
      if (exists.length > 0) continue;
      await db.insert(alerts).values({
        type: "warning",
        title: "面试超时未完成",
        description: `候选人 #${iv.candidateId} 的 ${iv.stage} 面试已过 ${Math.ceil((now.getTime() - new Date(iv.scheduledTime).getTime()) / (24 * 60 * 60 * 1000))} 天未完成`,
        candidateId: iv.candidateId,
        action: "联系候选人",
      });
      generated.push({ title: "面试超时未完成", type: "warning" });
    }

    // 2. Offer到期预警
    const expiringOffers = allOffers.filter(o => {
      if (o.status !== "sent" && o.status !== "negotiating") return false;
      const created = new Date(o.createdAt);
      const days = Math.ceil(
        (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000)
      );
      return days > 7;
    });
    for (const o of expiringOffers) {
      const exists = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.candidateId, o.candidateId),
            eq(alerts.type, "risk"),
            like(alerts.title, "%Offer待响应%")
          )
        )
        .limit(1);
      if (exists.length > 0) continue;
      await db.insert(alerts).values({
        type: "risk",
        title: "Offer待响应超7天",
        description: `候选人 #${o.candidateId} 的 Offer 已发送超过7天未响应，存在流失风险`,
        candidateId: o.candidateId,
        action: "调整Offer",
      });
      generated.push({ title: "Offer待响应超7天", type: "risk" });
    }

    // 3. 长期未跟进
    const staleCandidates = allCandidates.filter(c => {
      if (c.stage !== "初筛") return false;
      const days = Math.ceil(
        (now.getTime() - new Date(c.createdAt).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      return days > 14;
    });
    for (const c of staleCandidates) {
      const exists = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.candidateId, c.id),
            eq(alerts.type, "info"),
            like(alerts.title, "%长期未跟进%")
          )
        )
        .limit(1);
      if (exists.length > 0) continue;
      await db.insert(alerts).values({
        type: "info",
        title: "候选人长期未跟进",
        description: `候选人 ${c.name} 入库 ${Math.ceil((now.getTime() - new Date(c.createdAt).getTime()) / (24 * 60 * 60 * 1000))} 天仍处于初筛阶段`,
        candidateId: c.id,
        action: "安排面试",
      });
      generated.push({ title: "候选人长期未跟进", type: "info" });
    }

    // 异步发送通知（不阻塞响应）
    (async () => {
      try {
        const recentAlerts = await db
          .select()
          .from(alerts)
          .where(eq(alerts.isRead, 0))
          .orderBy(desc(alerts.id))
          .limit(generated.length || 10);
        for (const a of recentAlerts) {
          await sendNotifications({
            id: a.id,
            type: a.type || "info",
            title: a.title,
            description: a.description,
            candidateId: a.candidateId,
            action: a.action,
          });
        }
      } catch (e) {
        console.error("Failed to send auto-generated alert notifications:", e);
      }
    })();

    return { generated: generated.length, items: generated };
  }),
});

// ─── Dashboard Stats ───
export const dashboardRouter = createRouter({
  stats: authedQuery.query(async () => {
    const db = getDb();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const allCandidates = await db.select().from(candidates);
    const allInterviews = await db.select().from(interviews);
    const allOffers = await db.select().from(offers);

    const totalCandidates = allCandidates.length;
    const totalInterviews = allInterviews.length;
    const completedInterviews = allInterviews.filter(
      iv => iv.status === "completed"
    ).length;
    const totalOffers = allOffers.length;
    const acceptedOffers = allOffers.filter(
      o => o.status === "accepted"
    ).length;

    const thisMonthCandidates = allCandidates.filter(c => {
      const cd = new Date(c.createdAt);
      return cd >= thisMonthStart;
    }).length;

    const lastMonthCandidates = allCandidates.filter(c => {
      const cd = new Date(c.createdAt);
      return cd >= lastMonthStart && cd < lastMonthEnd;
    }).length;

    const thisMonthOffers = allOffers.filter(o => {
      const od = new Date(o.createdAt);
      return od >= thisMonthStart;
    }).length;

    const thisMonthHires = allOffers.filter(o => {
      const od = new Date(o.createdAt);
      return od >= thisMonthStart && o.status === "accepted";
    }).length;

    const lastMonthHires = allOffers.filter(o => {
      const od = new Date(o.createdAt);
      return (
        od >= lastMonthStart && od < lastMonthEnd && o.status === "accepted"
      );
    }).length;

    // Average hire days: for accepted offers, find first interview -> offer accept time
    let avgHireDays = 0;
    const acceptedOffersList = allOffers.filter(o => o.status === "accepted");
    if (acceptedOffersList.length > 0) {
      let totalDays = 0;
      let countDays = 0;
      for (const offer of acceptedOffersList) {
        const firstInterview = allInterviews
          .filter(iv => iv.candidateId === offer.candidateId)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];
        if (firstInterview) {
          const startDate = new Date(firstInterview.createdAt);
          const endDate = new Date(offer.createdAt);
          const days = Math.round(
            (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
          );
          if (days > 0 && days < 365) {
            totalDays += days;
            countDays++;
          }
        }
      }
      avgHireDays = countDays > 0 ? Math.round(totalDays / countDays) : 0;
    }

    const candidateChange =
      lastMonthCandidates > 0
        ? Math.round(
            ((thisMonthCandidates - lastMonthCandidates) /
              lastMonthCandidates) *
              1000
          ) / 10
        : thisMonthCandidates > 0
          ? 100
          : 0;

    const hireChange =
      lastMonthHires > 0
        ? Math.round(
            ((thisMonthHires - lastMonthHires) / lastMonthHires) * 1000
          ) / 10
        : thisMonthHires > 0
          ? 100
          : 0;

    const interviewPassRate =
      totalInterviews > 0
        ? Math.round((completedInterviews / totalInterviews) * 1000) / 10
        : 0;

    const offerAcceptRate =
      totalOffers > 0
        ? Math.round((acceptedOffers / totalOffers) * 1000) / 10
        : 0;

    return {
      totalCandidates,
      monthlyApplications: thisMonthCandidates,
      candidateChange,
      interviewPassRate,
      offerAcceptRate,
      avgHireDays,
      monthlyHires: thisMonthHires,
      hireChange,
      monthlyOffers: thisMonthOffers,
    };
  }),

  activities: authedQuery.query(async () => {
    const db = getDb();
    const recentInterviews = await db
      .select()
      .from(interviews)
      .orderBy(desc(interviews.scheduledTime))
      .limit(10);
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
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.search) {
        conditions.push(
          or(
            like(positions.title, `%${input.search}%`),
            like(positions.company, `%${input.search}%`)
          )
        );
      }
      if (input?.status && input.status !== "全部") {
        conditions.push(eq(positions.status, input.status));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await db
        .select()
        .from(positions)
        .where(where)
        .orderBy(desc(positions.createdAt));
    }),

  getById: authedQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(positions)
      .where(eq(positions.id, input))
      .limit(1);
    if (!result[0]) throw new Error("Position not found");
    return {
      ...result[0],
      requiredSkills: JSON.parse(result[0].requiredSkills || "[]"),
      bonusSkills: JSON.parse(result[0].bonusSkills || "[]"),
    };
  }),

  create: adminQuery
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const data = {
        ...input,
        requiredSkills: JSON.stringify(input.requiredSkills || []),
        bonusSkills: JSON.stringify(input.bonusSkills || []),
      };
      await db.insert(positions).values(data);
      const [created] = await db
        .select()
        .from(positions)
        .orderBy(desc(positions.id))
        .limit(1);
      await recordAudit({
        action: "create",
        entityType: "position",
        entityId: created.id,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        changes: { title: { old: null, new: input.title } },
      });
      return created;
    }),

  update: adminQuery
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = {
        ...input.data,
        updatedAt: sql`CURRENT_TIMESTAMP()`,
      };
      if (updateData.requiredSkills)
        updateData.requiredSkills = JSON.stringify(updateData.requiredSkills);
      if (updateData.bonusSkills)
        updateData.bonusSkills = JSON.stringify(updateData.bonusSkills);
      await db
        .update(positions)
        .set(updateData)
        .where(eq(positions.id, input.id));
      const [updated] = await db
        .select()
        .from(positions)
        .where(eq(positions.id, input.id))
        .limit(1);
      if (Object.keys(input.data).length > 0) {
        await recordAudit({
          action: "update",
          entityType: "position",
          entityId: input.id,
          userId: ctx.user?.id,
          userName: ctx.user?.name,
        });
      }

      const scoringChanged =
        input.data.requiredSkills ||
        input.data.bonusSkills ||
        input.data.minExperience !== undefined ||
        input.data.maxExperience !== undefined ||
        input.data.salaryMin !== undefined ||
        input.data.salaryMax !== undefined;

      if (scoringChanged) {
        try {
          const pos = updated;
          const requiredSkills = JSON.parse(
            pos.requiredSkills || "[]"
          ) as string[];
          const bonusSkills = JSON.parse(pos.bonusSkills || "[]") as string[];
          const posTitle = pos.title ?? "";

          const allCandidates = await db
            .select()
            .from(candidates)
            .where(eq(candidates.status, "active"));

          const allWork = await db.select().from(workHistories);

          let rescored = 0;
          for (const c of allCandidates) {
            const cWork = allWork.filter(w => w.candidateId === c.id);
            const result = calculateResumeScore({
              candidateSkills: JSON.parse(c.skills || "[]"),
              candidateExperience: c.experience ?? 0,
              candidateEducation: c.education ?? "",
              candidateSalaryExpectation: c.salaryExpectation ?? undefined,
              workHistory: cWork.map(w => ({
                company: w.company,
                position: w.position ?? undefined,
                startDate: w.startDate ?? undefined,
                endDate: w.endDate ?? undefined,
              })),
              positionRequiredSkills: requiredSkills,
              positionBonusSkills: bonusSkills,
              positionMinExperience: pos.minExperience ?? 0,
              positionMaxExperience: pos.maxExperience ?? 10,
              positionSalaryMin: pos.salaryMin ?? undefined,
              positionSalaryMax: pos.salaryMax ?? undefined,
            });

            const intentResult = calculateIntentScore({
              candidateStatus: c.status ?? "在职",
              candidateStage: c.stage ?? "初筛",
              candidateSalaryExpectation: c.salaryExpectation ?? undefined,
              positionSalaryMin: pos.salaryMin ?? undefined,
              positionSalaryMax: pos.salaryMax ?? undefined,
              candidateSource: c.source ?? undefined,
            });

            await db
              .update(candidates)
              .set({
                matchScore: result.total,
                intentScore: intentResult.total,
              })
              .where(eq(candidates.id, c.id));
            rescored++;
          }
          console.log(
            `[auto-match] 岗位 "${updated.title}" 更新，自动重算 ${rescored} 位候选人匹配分`
          );
        } catch (err) {
          console.error("[auto-match] 自动匹配失败:", err);
        }
      }

      return updated;
    }),

  delete: adminQuery.input(z.number()).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete(positions).where(eq(positions.id, input));
    await recordAudit({
      action: "delete",
      entityType: "position",
      entityId: input,
      userId: ctx.user?.id,
      userName: ctx.user?.name,
    });
    return { success: true };
  }),

  stats: authedQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    const posInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.positionId, input));
    const posOffers = await db
      .select()
      .from(offers)
      .where(eq(offers.positionId, input));

    return {
      interviewCount: posInterviews.length,
      completedInterviews: posInterviews.filter(iv => iv.status === "completed")
        .length,
      offerCount: posOffers.length,
      acceptedOffers: posOffers.filter(o => o.status === "accepted").length,
    };
  }),
});
