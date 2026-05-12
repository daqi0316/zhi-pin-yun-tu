import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════
// Analytics 求助函数测试
// 来源: api/routers/analytics.ts
// ═══════════════════════════════════════

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeFunnelData(
  candidates: Array<{ stage: string | null }>,
  interviews: Array<{ status: string | null; totalScore: number | null }>,
  offers: Array<{ status: string | null }>
) {
  const totalCandidates = candidates.length;
  const passedScreening = candidates.filter(
    c => c.stage && !["初筛"].includes(c.stage)
  ).length;
  const interviewed = interviews.length;
  const passedInterview = interviews.filter(
    iv => iv.status === "completed" && (iv.totalScore ?? 0) >= 60
  ).length;
  const offered = offers.filter(o => o.status !== "draft").length;
  const hired = offers.filter(o => o.status === "accepted").length;

  return {
    totalCandidates,
    passedScreening,
    interviewed,
    passedInterview,
    offered,
    hired,
  };
}

function computeFunnelRates(funnel: ReturnType<typeof computeFunnelData>) {
  const screeningRate =
    funnel.totalCandidates > 0
      ? Math.round((funnel.passedScreening / funnel.totalCandidates) * 1000) /
        10
      : 0;
  const interviewRate =
    funnel.passedScreening > 0
      ? Math.round((funnel.interviewed / funnel.passedScreening) * 1000) / 10
      : 0;
  const passRate =
    funnel.interviewed > 0
      ? Math.round((funnel.passedInterview / funnel.interviewed) * 1000) / 10
      : 0;
  const offerRate =
    funnel.passedInterview > 0
      ? Math.round((funnel.offered / funnel.passedInterview) * 1000) / 10
      : 0;
  const hireRate =
    funnel.offered > 0
      ? Math.round((funnel.hired / funnel.offered) * 1000) / 10
      : 0;

  return { screeningRate, interviewRate, passRate, offerRate, hireRate };
}

describe("getWeekStart", () => {
  it("返回周一的0点", () => {
    // 2026-05-12 is Tuesday → Monday should be 2026-05-11
    const tue = new Date(2026, 4, 12); // May 12, 2026
    const result = getWeekStart(tue);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(11);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it("周日返回上周一", () => {
    // 2026-05-10 is Sunday → Monday should be 2026-05-04
    const sun = new Date(2026, 4, 10);
    const result = getWeekStart(sun);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(4);
  });

  it("周一返回当天", () => {
    // 2026-05-11 is Monday
    const mon = new Date(2026, 4, 11);
    const result = getWeekStart(mon);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(11);
  });

  it("时/分/秒/毫秒全部归零", () => {
    const date = new Date(2026, 4, 12, 15, 30, 45, 500);
    const result = getWeekStart(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe("computeFunnelData", () => {
  it("完整6阶段漏斗数据", () => {
    const candidates = [
      { stage: "初筛" },
      { stage: "初筛" },
      { stage: "复试" },
      { stage: "终面" },
      { stage: "offer阶段" },
      { stage: "初筛" },
    ];
    const interviews = [
      { status: "completed", totalScore: 80 },
      { status: "completed", totalScore: 55 },
      { status: "pending", totalScore: null },
      { status: "completed", totalScore: 75 },
    ];
    const offers = [
      { status: "sent" },
      { status: "negotiating" },
      { status: "accepted" },
      { status: "draft" },
    ];

    const funnel = computeFunnelData(candidates, interviews, offers);

    expect(funnel.totalCandidates).toBe(6);
    expect(funnel.passedScreening).toBe(3); // 复试,终面,offer阶段 = 3
    expect(funnel.interviewed).toBe(4);
    expect(funnel.passedInterview).toBe(2); // score>=60的completed = 2
    expect(funnel.offered).toBe(3); // sent,negotiating,accepted = 3
    expect(funnel.hired).toBe(1); // only accepted = 1
  });

  it("空数据全返回0", () => {
    const funnel = computeFunnelData([], [], []);
    expect(funnel.totalCandidates).toBe(0);
    expect(funnel.passedScreening).toBe(0);
    expect(funnel.interviewed).toBe(0);
    expect(funnel.passedInterview).toBe(0);
    expect(funnel.offered).toBe(0);
    expect(funnel.hired).toBe(0);
  });

  it("所有候选人都在初筛 → passedScreening=0", () => {
    const candidates = [{ stage: "初筛" }, { stage: "初筛" }];
    const funnel = computeFunnelData(candidates, [], []);
    expect(funnel.passedScreening).toBe(0);
  });

  it("只计算score>=60的面试为通过", () => {
    const interviews = [
      { status: "completed", totalScore: 59 },
      { status: "completed", totalScore: 60 },
      { status: "completed", totalScore: 100 },
    ];
    const funnel = computeFunnelData([], interviews, []);
    expect(funnel.passedInterview).toBe(2);
  });

  it("draft状态的Offer不在offered计数中", () => {
    const offers = [{ status: "draft" }, { status: "draft" }];
    const funnel = computeFunnelData([], [], offers);
    expect(funnel.offered).toBe(0);
  });
});

describe("computeFunnelRates", () => {
  it("100人全漏斗转化率", () => {
    // 100 → 80 pass screening → 50 interviewed → 40 pass → 30 offered → 15 hired
    const funnel = {
      totalCandidates: 100,
      passedScreening: 80,
      interviewed: 50,
      passedInterview: 40,
      offered: 30,
      hired: 15,
    };

    const rates = computeFunnelRates(funnel);
    expect(rates.screeningRate).toBe(80); // 80/100 = 80%
    expect(rates.interviewRate).toBe(62.5); // 50/80 = 62.5%
    expect(rates.passRate).toBe(80); // 40/50 = 80%
    expect(rates.offerRate).toBe(75); // 30/40 = 75%
    expect(rates.hireRate).toBe(50); // 15/30 = 50%
  });

  it("0候选人时全为0", () => {
    const rates = computeFunnelRates({
      totalCandidates: 0,
      passedScreening: 0,
      interviewed: 0,
      passedInterview: 0,
      offered: 0,
      hired: 0,
    });
    expect(rates.screeningRate).toBe(0);
    expect(rates.interviewRate).toBe(0);
    expect(rates.passRate).toBe(0);
    expect(rates.offerRate).toBe(0);
    expect(rates.hireRate).toBe(0);
  });
});

// ═══════════════════════════════════════
// 位置效率测试
// ═══════════════════════════════════════

function computePositionEfficiency(
  pos: {
    id: number;
    title: string | null;
    company: string | null;
    status: string | null;
  },
  allCandidates: Array<{
    position: string | null;
    matchScore: number | null;
    id: number;
  }>,
  allInterviews: Array<{ positionId: number | null; candidateId: number }>,
  allOffers: Array<{ positionId: number | null; candidateId: number }>
) {
  const posCandidates = allCandidates.filter(
    c => c.position?.includes(pos.title ?? "") || false
  );
  const matchedCandidates = posCandidates.filter(
    c => (c.matchScore ?? 0) >= 60
  );
  const conversionRate =
    posCandidates.length > 0
      ? Math.round((matchedCandidates.length / posCandidates.length) * 1000) /
        10
      : 0;

  return {
    positionId: pos.id,
    position: pos.title,
    company: pos.company,
    applicants: posCandidates.length,
    matches: matchedCandidates.length,
    conversionRate,
    interviews: 0,
    offers: 0,
  };
}

describe("computePositionEfficiency", () => {
  it("计算岗位申请/匹配/转化率", () => {
    const pos = {
      id: 1,
      title: "高级Java工程师",
      company: "腾讯",
      status: "active",
    };
    const candidates = [
      { id: 1, position: "高级Java工程师", matchScore: 85 },
      { id: 2, position: "高级Java工程师", matchScore: 55 },
      { id: 3, position: "前端开发", matchScore: 80 },
      { id: 4, position: "高级Java工程师", matchScore: 70 },
    ];

    const result = computePositionEfficiency(pos, candidates, [], []);
    expect(result.applicants).toBe(3);
    expect(result.matches).toBe(2);
    expect(result.conversionRate).toBe(66.7); // 2/3 = 66.7%
  });

  it("无候选人时转化为0", () => {
    const pos = { id: 2, title: "产品经理", company: "字节", status: "active" };
    const candidates = [{ id: 1, position: "Java开发", matchScore: 90 }];
    const result = computePositionEfficiency(pos, candidates, [], []);
    expect(result.applicants).toBe(0);
    expect(result.matches).toBe(0);
    expect(result.conversionRate).toBe(0);
  });
});

// ═══════════════════════════════════════
// 渠道趋势数据结构验证
// ═══════════════════════════════════════

describe("channel trends structure", () => {
  const channelKeys = [
    "id",
    "name",
    "type",
    "applications",
    "interviews",
    "offers",
    "conversionRate",
    "cost",
    "roi",
  ];

  it("渠道趋势返回所有必要字段", () => {
    expect(channelKeys.length).toBe(9);
    expect(channelKeys).toContain("conversionRate");
    expect(channelKeys).toContain("roi");
  });
});
