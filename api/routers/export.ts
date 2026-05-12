import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import {
  candidates,
  interviews,
  offers,
  workHistories,
  positions,
} from "../../db/schema";
import { desc, eq } from "drizzle-orm";

function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (val: string | number | null): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = headers.map(escape).join(",");
  const dataLines = rows.map(row => row.map(escape).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export const exportRouter = createRouter({
  candidatesCSV: authedQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(candidates)
      .orderBy(desc(candidates.matchScore));

    const headers = [
      "ID",
      "姓名",
      "职位",
      "公司",
      "电话",
      "邮箱",
      "地点",
      "经验(年)",
      "学历",
      "技能",
      "状态",
      "来源",
      "薪资期望",
      "匹配分",
      "意向分",
      "阶段",
      "入库时间",
    ];

    const rows = items.map(c => [
      c.id,
      c.name,
      c.position,
      c.company,
      c.phone,
      c.email,
      c.location,
      c.experience,
      c.education,
      JSON.parse(c.skills || "[]").join("; "),
      c.status,
      c.source,
      c.salaryExpectation,
      c.matchScore,
      c.intentScore,
      c.stage,
      c.createdAt,
    ]);

    return { csv: toCSV(headers, rows), filename: "候选人列表.csv" };
  }),

  interviewsCSV: authedQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(interviews)
      .orderBy(desc(interviews.scheduledTime));

    const headers = [
      "ID",
      "候选人ID",
      "岗位ID",
      "阶段",
      "面试官",
      "排期时间",
      "类型",
      "状态",
      "技能分",
      "问题解决分",
      "沟通分",
      "协作分",
      "文化分",
      "总分",
      "评语",
      "创建时间",
    ];

    const rows = items.map(iv => [
      iv.id,
      iv.candidateId,
      iv.positionId,
      iv.stage,
      iv.interviewer,
      iv.scheduledTime,
      iv.type,
      iv.status,
      iv.scoreSkill,
      iv.scoreProblem,
      iv.scoreCommunication,
      iv.scoreTeamwork,
      iv.scoreCulture,
      iv.totalScore,
      iv.feedback,
      iv.createdAt,
    ]);

    return { csv: toCSV(headers, rows), filename: "面试记录.csv" };
  }),

  offersCSV: authedQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(offers)
      .orderBy(desc(offers.createdAt));

    const headers = [
      "ID",
      "候选人ID",
      "岗位ID",
      "月薪",
      "奖金月数",
      "股票",
      "总包",
      "状态",
      "Recruiter",
      "接单概率",
      "创建时间",
    ];

    const rows = items.map(o => [
      o.id,
      o.candidateId,
      o.positionId,
      o.baseSalary,
      o.bonus,
      o.stock,
      o.totalPackage,
      o.status,
      o.recruiter,
      o.acceptanceProbability,
      o.createdAt,
    ]);

    return { csv: toCSV(headers, rows), filename: "Offer记录.csv" };
  }),
});
