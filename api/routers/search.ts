import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import { candidates, positions, interviews } from "../../db/schema";
import { like, or, and } from "drizzle-orm";

export const searchRouter = createRouter({
  global: authedQuery
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const q = `%${input.q}%`;

      const [candidateResults, positionResults, interviewResults] =
        await Promise.all([
          db
            .select({
              id: candidates.id,
              name: candidates.name,
              position: candidates.position,
              company: candidates.company,
              skills: candidates.skills,
              matchScore: candidates.matchScore,
            })
            .from(candidates)
            .where(
              or(
                like(candidates.name, q),
                like(candidates.position, q),
                like(candidates.company, q),
                like(candidates.skills, q),
                like(candidates.education, q)
              )
            )
            .limit(10),

          db
            .select({
              id: positions.id,
              title: positions.title,
              company: positions.company,
              department: positions.department,
              requiredSkills: positions.requiredSkills,
            })
            .from(positions)
            .where(
              or(
                like(positions.title, q),
                like(positions.company, q),
                like(positions.requiredSkills, q),
                like(positions.description, q)
              )
            )
            .limit(5),

          db
            .select({
              id: interviews.id,
              candidateId: interviews.candidateId,
              stage: interviews.stage,
              interviewer: interviews.interviewer,
              status: interviews.status,
              scheduledTime: interviews.scheduledTime,
            })
            .from(interviews)
            .where(
              or(like(interviews.stage, q), like(interviews.interviewer, q))
            )
            .limit(5),
        ]);

      return {
        candidates: candidateResults.map(c => ({
          ...c,
          skills: JSON.parse(c.skills || "[]"),
        })),
        positions: positionResults.map(p => ({
          ...p,
          requiredSkills: JSON.parse(p.requiredSkills || "[]"),
        })),
        interviews: interviewResults,
      };
    }),
});
