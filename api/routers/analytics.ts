import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import {
  candidates,
  interviews,
  offers,
  positions,
  channels,
} from "../../db/schema";
import { eq, desc, sql, gte, lte, and, count } from "drizzle-orm";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const analyticsRouter = createRouter({
  trends: authedQuery
    .input(
      z
        .object({
          period: z.enum(["weekly", "monthly"]).default("weekly"),
          weeks: z.number().min(4).max(52).default(8),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const period = input?.period ?? "weekly";
      const numPeriods = input?.weeks ?? 8;

      const allCandidates = await db
        .select()
        .from(candidates)
        .orderBy(desc(candidates.createdAt));
      const allInterviews = await db
        .select()
        .from(interviews)
        .orderBy(desc(interviews.createdAt));
      const allOffers = await db
        .select()
        .from(offers)
        .orderBy(desc(offers.createdAt));

      const now = new Date();
      const buckets: Array<{
        label: string;
        candidates: number;
        interviews: number;
        offers: number;
      }> = [];

      if (period === "weekly") {
        for (let i = numPeriods - 1; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - i * 7);
          const ws = getWeekStart(weekStart);
          const we = new Date(ws);
          we.setDate(we.getDate() + 7);

          const wsStr = ws.toISOString().slice(0, 10);
          const weStr = we.toISOString().slice(0, 10);

          const weekCandidates = allCandidates.filter(c => {
            const cd = new Date(c.createdAt);
            return cd >= ws && cd < we;
          }).length;
          const weekInterviews = allInterviews.filter(iv => {
            const id = new Date(iv.createdAt);
            return id >= ws && id < we;
          }).length;
          const weekOffers = allOffers.filter(o => {
            const od = new Date(o.createdAt);
            return od >= ws && od < we;
          }).length;

          buckets.push({
            label: `${now.getFullYear()} W${i + 1} (${wsStr.slice(5)})`,
            candidates: weekCandidates,
            interviews: weekInterviews,
            offers: weekOffers,
          });
        }
      } else {
        for (let i = numPeriods - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

          const monthCandidates = allCandidates.filter(c => {
            const cd = new Date(c.createdAt);
            return cd >= d && cd < nextD;
          }).length;
          const monthInterviews = allInterviews.filter(iv => {
            const id = new Date(iv.createdAt);
            return id >= d && id < nextD;
          }).length;
          const monthOffers = allOffers.filter(o => {
            const od = new Date(o.createdAt);
            return od >= d && od < nextD;
          }).length;

          buckets.push({
            label,
            candidates: monthCandidates,
            interviews: monthInterviews,
            offers: monthOffers,
          });
        }
      }

      return { period, data: buckets };
    }),

  funnel: authedQuery.query(async () => {
    const db = getDb();

    const allCandidates = await db.select().from(candidates);
    const allInterviews = await db.select().from(interviews);
    const allOffers = await db.select().from(offers);

    const totalCandidates = allCandidates.length;
    const passedScreening = allCandidates.filter(
      c => c.stage && !["初筛"].includes(c.stage)
    ).length;
    const interviewed = allInterviews.length;
    const passedInterview = allInterviews.filter(
      iv => iv.status === "completed" && (iv.totalScore ?? 0) >= 60
    ).length;
    const offered = allOffers.filter(o => o.status !== "draft").length;
    const hired = allOffers.filter(o => o.status === "accepted").length;

    return {
      totalCandidates,
      passedScreening,
      interviewed,
      passedInterview,
      offered,
      hired,
    };
  }),

  positionEfficiency: authedQuery.query(async () => {
    const db = getDb();

    const allPositions = await db
      .select()
      .from(positions)
      .orderBy(desc(positions.createdAt));
    const allCandidates = await db.select().from(candidates);
    const allInterviews = await db.select().from(interviews);
    const allOffers = await db.select().from(offers);

    return allPositions.map(pos => {
      const posInterviewIds = allInterviews
        .filter(iv => iv.positionId === pos.id)
        .map(iv => iv.candidateId);
      const posOfferIds = allOffers
        .filter(o => o.positionId === pos.id)
        .map(o => o.candidateId);
      const associatedCandidateIds = new Set([
        ...posInterviewIds,
        ...posOfferIds,
        ...allInterviews
          .filter(iv => iv.positionId === pos.id)
          .map(iv => iv.candidateId),
      ]);
      const posCandidates = allCandidates.filter(
        c =>
          associatedCandidateIds.has(c.id) ||
          (c.position ?? "").includes(pos.title ?? "")
      );
      const matchedCandidates = posCandidates.filter(
        c => (c.matchScore ?? 0) >= 60
      );
      const posInterviews = allInterviews.filter(
        iv => iv.positionId === pos.id
      );
      const posOffers = allOffers.filter(
        o => o.positionId === pos.id
      );

      const conversionRate =
        posCandidates.length > 0
          ? Math.round(
              (matchedCandidates.length / posCandidates.length) * 1000
            ) / 10
          : 0;

      return {
        positionId: pos.id,
        position: pos.title,
        company: pos.company,
        applicants: posCandidates.length,
        matches: matchedCandidates.length,
        conversionRate,
        interviews: posInterviews.length,
        offers: posOffers.length,
        status: pos.status,
      };
    });
  }),

  channelTrends: authedQuery.query(async () => {
    const db = getDb();
    const allChannels = await db.select().from(channels);

    return allChannels.map(ch => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      applications: ch.applications || 0,
      interviews: ch.interviews || 0,
      offers: ch.offers || 0,
      conversionRate: ch.conversionRate || 0,
      cost: ch.cost || 0,
      roi: ch.roi || 0,
    }));
  }),
});
