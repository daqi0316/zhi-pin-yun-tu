import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import { candidates, positions, workHistories } from "../../db/schema";
import { eq, desc, like } from "drizzle-orm";
import {
  calculateResumeScore,
  calculateIntentScore,
  detectPositionType,
  type ScoringInput,
} from "../scoring";
import { groupByCompany, analyzeCandidateRelations } from "../company-relation";

// ─── 评分相关路由 ───

export const scoringRouter = createRouter({
  /**
   * 对单个候选人进行评分
   * 输入：candidateId + positionId
   * 输出：6维度评分 + 综合分
   */
  scoreCandidate: authedQuery
    .input(
      z.object({
        candidateId: z.number(),
        positionId: z.number().optional(),
        // 允许手动传入岗位要求（前端直接配）
        requiredSkills: z.array(z.string()).optional(),
        bonusSkills: z.array(z.string()).optional(),
        minExperience: z.number().optional(),
        maxExperience: z.number().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      // 获取候选人
      const candidate = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, input.candidateId))
        .limit(1);
      if (!candidate[0]) throw new Error("候选人不存在");

      // 获取候选人的工作经历
      const workHistory = await db
        .select()
        .from(workHistories)
        .where(eq(workHistories.candidateId, input.candidateId));

      // 获取岗位要求（如果有 positionId）
      let requiredSkills = input.requiredSkills ?? [];
      let bonusSkills = input.bonusSkills ?? [];
      let minExp = input.minExperience ?? 0;
      let maxExp = input.maxExperience ?? 10;
      let salaryMin = input.salaryMin;
      let salaryMax = input.salaryMax;
      let posTitle = "";

      if (input.positionId) {
        const position = await db
          .select()
          .from(positions)
          .where(eq(positions.id, input.positionId))
          .limit(1);
        if (position[0]) {
          posTitle = position[0].title ?? "";
          requiredSkills =
            requiredSkills.length > 0
              ? requiredSkills
              : JSON.parse(position[0].requiredSkills || "[]");
          bonusSkills =
            bonusSkills.length > 0
              ? bonusSkills
              : JSON.parse(position[0].bonusSkills || "[]");
          if (!input.minExperience) minExp = position[0].minExperience ?? 0;
          if (!input.maxExperience) maxExp = position[0].maxExperience ?? 10;
          if (!input.salaryMin) salaryMin = position[0].salaryMin ?? undefined;
          if (!input.salaryMax) salaryMax = position[0].salaryMax ?? undefined;
        }
      }

      const scoringInput: ScoringInput = {
        candidateSkills: JSON.parse(candidate[0].skills || "[]"),
        candidateExperience: candidate[0].experience ?? 0,
        candidateEducation: candidate[0].education ?? "",
        candidateSalaryExpectation: candidate[0].salaryExpectation ?? undefined,
        workHistory: workHistory.map(w => ({
          company: w.company,
          position: w.position ?? undefined,
          startDate: w.startDate ?? undefined,
          endDate: w.endDate ?? undefined,
          description: undefined,
        })),
        positionRequiredSkills: requiredSkills,
        positionBonusSkills: bonusSkills,
        positionMinExperience: minExp,
        positionMaxExperience: maxExp,
        positionSalaryMin: salaryMin,
        positionSalaryMax: salaryMax,
        positionType: detectPositionType(posTitle, requiredSkills),
      };

      const result = calculateResumeScore(scoringInput);

      const intentResult = calculateIntentScore({
        candidateStatus: candidate[0].status ?? "在职",
        candidateStage: candidate[0].stage ?? "初筛",
        candidateSalaryExpectation: candidate[0].salaryExpectation ?? undefined,
        positionSalaryMin: salaryMin,
        positionSalaryMax: salaryMax,
        candidateSource: candidate[0].source ?? undefined,
      });

      await db
        .update(candidates)
        .set({ matchScore: result.total, intentScore: intentResult.total })
        .where(eq(candidates.id, input.candidateId));

      return {
        candidateId: input.candidateId,
        candidateName: candidate[0].name,
        ...result,
        intentScore: intentResult,
      };
    }),

  /**
   * 匹配候选人：按 positionId 对所有活跃候选人评分，返回排序结果
   */
  matchCandidates: authedQuery
    .input(
      z.object({
        positionId: z.number(),
        minScore: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const position = await db
        .select()
        .from(positions)
        .where(eq(positions.id, input.positionId))
        .limit(1);
      if (!position[0]) throw new Error("岗位不存在");

      const pos = position[0];
      const requiredSkills = JSON.parse(pos.requiredSkills || "[]") as string[];
      const bonusSkills = JSON.parse(pos.bonusSkills || "[]") as string[];

      const allCandidates = await db
        .select()
        .from(candidates)
        .where(eq(candidates.status, "active"))
        .orderBy(desc(candidates.createdAt));

      const allWork = await db.select().from(workHistories);

      const results: Array<{
        candidateId: number;
        candidateName: string;
        matchScore: number;
        intentScore: number;
        level: "S" | "A" | "B" | "C" | "D";
      }> = [];

      for (const c of allCandidates) {
        const cWorkHistory = allWork.filter(w => w.candidateId === c.id);

        const scoringInput: ScoringInput = {
          candidateSkills: JSON.parse(c.skills || "[]"),
          candidateExperience: c.experience ?? 0,
          candidateEducation: c.education ?? "",
          candidateSalaryExpectation: c.salaryExpectation ?? undefined,
          workHistory: cWorkHistory.map(w => ({
            company: w.company,
            position: w.position ?? undefined,
            startDate: w.startDate ?? undefined,
            endDate: w.endDate ?? undefined,
            description: undefined,
          })),
          positionRequiredSkills: requiredSkills,
          positionBonusSkills: bonusSkills,
          positionMinExperience: pos.minExperience ?? 0,
          positionMaxExperience: pos.maxExperience ?? 10,
          positionSalaryMin: pos.salaryMin ?? undefined,
          positionSalaryMax: pos.salaryMax ?? undefined,
          positionType: detectPositionType(pos.title ?? "", requiredSkills),
        };

        const result = calculateResumeScore(scoringInput);

        const intentResult = calculateIntentScore({
          candidateStatus: c.status ?? "在职",
          candidateStage: c.stage ?? "初筛",
          candidateSalaryExpectation: c.salaryExpectation ?? undefined,
          positionSalaryMin: pos.salaryMin ?? undefined,
          positionSalaryMax: pos.salaryMax ?? undefined,
          candidateSource: c.source ?? undefined,
        });

        if (result.total >= input.minScore) {
          results.push({
            candidateId: c.id,
            candidateName: c.name,
            matchScore: result.total,
            intentScore: intentResult.total,
            level: result.level,
          });
        }

        await db
          .update(candidates)
          .set({ matchScore: result.total, intentScore: intentResult.total })
          .where(eq(candidates.id, c.id));
      }

      results.sort((a, b) => b.matchScore - a.matchScore);

      return {
        positionId: pos.id,
        positionTitle: pos.title,
        total: results.length,
        matched: results.filter(r => r.matchScore >= 60).length,
        candidates: results,
      };
    }),

  /**
   * 批量重新评分（对现有候选人）
   */
  rescoreAll: authedQuery
    .input(
      z.object({
        positionId: z.number().optional(),
        requiredSkills: z.array(z.string()).optional(),
        bonusSkills: z.array(z.string()).optional(),
        minExperience: z.number().optional(),
        maxExperience: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const allCandidates = await db
        .select()
        .from(candidates)
        .where(eq(candidates.status, "active"))
        .orderBy(desc(candidates.createdAt));

      let requiredSkills = input.requiredSkills ?? [];
      let bonusSkills = input.bonusSkills ?? [];
      let minExp = input.minExperience ?? 0;
      let maxExp = input.maxExperience ?? 10;
      let salaryMin: number | undefined;
      let salaryMax: number | undefined;
      let posTitle = "";

      if (input.positionId) {
        const position = await db
          .select()
          .from(positions)
          .where(eq(positions.id, input.positionId))
          .limit(1);
        if (position[0]) {
          posTitle = position[0].title ?? "";
          requiredSkills =
            requiredSkills.length > 0
              ? requiredSkills
              : JSON.parse(position[0].requiredSkills || "[]");
          bonusSkills =
            bonusSkills.length > 0
              ? bonusSkills
              : JSON.parse(position[0].bonusSkills || "[]");
          if (!input.minExperience) minExp = position[0].minExperience ?? 0;
          if (!input.maxExperience) maxExp = position[0].maxExperience ?? 10;
          salaryMin = position[0].salaryMin ?? undefined;
          salaryMax = position[0].salaryMax ?? undefined;
        }
      }

      const results: Array<{ id: number; name: string; score: number }> = [];

      for (const c of allCandidates) {
        const workHistory = await db
          .select()
          .from(workHistories)
          .where(eq(workHistories.candidateId, c.id));

        const scoringInput: ScoringInput = {
          candidateSkills: JSON.parse(c.skills || "[]"),
          candidateExperience: c.experience ?? 0,
          candidateEducation: c.education ?? "",
          candidateSalaryExpectation: c.salaryExpectation ?? undefined,
          workHistory: workHistory.map(w => ({
            company: w.company,
            position: w.position ?? undefined,
            startDate: w.startDate ?? undefined,
            endDate: w.endDate ?? undefined,
          })),
          positionRequiredSkills: requiredSkills,
          positionBonusSkills: bonusSkills,
          positionMinExperience: minExp,
          positionMaxExperience: maxExp,
        positionSalaryMin: salaryMin,
        positionSalaryMax: salaryMax,
        positionType: detectPositionType(posTitle, requiredSkills),
      };

        const result = calculateResumeScore(scoringInput);

        const intentResult = calculateIntentScore({
          candidateStatus: c.status ?? "在职",
          candidateStage: c.stage ?? "初筛",
          candidateSalaryExpectation: c.salaryExpectation ?? undefined,
          positionSalaryMin: salaryMin,
          positionSalaryMax: salaryMax,
          candidateSource: c.source ?? undefined,
        });

        await db
          .update(candidates)
          .set({ matchScore: result.total, intentScore: intentResult.total })
          .where(eq(candidates.id, c.id));

        results.push({
          id: c.id,
          name: c.name,
          score: result.total,
          intentScore: intentResult.total,
        });
      }

      return {
        total: results.length,
        updated: results,
        averageScore: Math.round(
          results.reduce((s, r) => s + r.score, 0) / results.length
        ),
      };
    }),
});

// ─── 岗位匹配统计路由 ───

/**
 * 批量获取各岗位的匹配候选人统计
 * 对每个活跃岗位，快速计算匹配候选人数（B级及以上）
 */
export const positionMatchRouter = createRouter({
  counts: authedQuery
    .input(
      z
        .object({
          positionIds: z.array(z.number()).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const allPositions = await db
        .select()
        .from(positions)
        .orderBy(desc(positions.createdAt));
      const filteredPositions =
        input?.positionIds && input.positionIds.length > 0
          ? allPositions.filter(p => input.positionIds!.includes(p.id))
          : allPositions;

      const allCandidates = await db
        .select()
        .from(candidates)
        .where(eq(candidates.status, "active"));

      const allWork = await db.select().from(workHistories);

      const countsMap: Record<number, { total: number; matched: number }> = {};

      for (const pos of filteredPositions) {
        const requiredSkills = JSON.parse(
          pos.requiredSkills || "[]"
        ) as string[];
        const bonusSkills = JSON.parse(pos.bonusSkills || "[]") as string[];
        let matched = 0;

        for (const c of allCandidates) {
          const cWorkHistory = allWork.filter(w => w.candidateId === c.id);

          const scoringInput: ScoringInput = {
            candidateSkills: JSON.parse(c.skills || "[]"),
            candidateExperience: c.experience ?? 0,
            candidateEducation: c.education ?? "",
            candidateSalaryExpectation: c.salaryExpectation ?? undefined,
            workHistory: cWorkHistory.map(w => ({
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
          };

          const result = calculateResumeScore(scoringInput);
          if (result.total >= 60) matched++;
        }

        countsMap[pos.id] = { total: allCandidates.length, matched };
      }

      return countsMap;
    }),
});

// ─── 公司关联度路由 ───

export const relationRouter = createRouter({
  /**
   * 按公司分组查看候选人
   */
  companyGroups: authedQuery.query(async () => {
    const db = getDb();
    const allCandidates = await db
      .select({
        id: candidates.id,
        name: candidates.name,
      })
      .from(candidates)
      .where(like(candidates.status, "在职%"));

    const allWork = await db.select().from(workHistories);

    const groups = groupByCompany(allCandidates, allWork);
    return groups;
  }),

  /**
   * 查询指定候选人的关联度网络
   */
  candidateRelations: authedQuery.input(z.number()).query(async ({ input }) => {
    const db = getDb();
    const candidate = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, input))
      .limit(1);
    if (!candidate[0]) throw new Error("候选人不存在");

    const allCandidates = await db
      .select({
        id: candidates.id,
        name: candidates.name,
      })
      .from(candidates)
      .where(like(candidates.status, "在职%"));

    const allWork = await db.select().from(workHistories);

    const relations = analyzeCandidateRelations(
      input,
      candidate[0].name,
      allCandidates,
      allWork
    );

    return {
      candidate: { id: input, name: candidate[0].name },
      relations,
    };
  }),
});
