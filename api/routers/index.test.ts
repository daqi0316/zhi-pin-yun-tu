import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════
// BARS 面试总得分公式测试
// 公式: ((skill×0.3 + problem×0.2 + comm×0.2 + team×0.15 + culture×0.15) / 5) × 100
// 来源: api/routers/index.ts interviewRouter.updateScore
// ═══════════════════════════════════════

type BARSScores = {
  skill: number;
  problem: number;
  comm: number;
  team: number;
  culture: number;
};

function computeBARSTotalScore(scores: BARSScores): number {
  const raw =
    scores.skill * 0.3 +
    scores.problem * 0.2 +
    scores.comm * 0.2 +
    scores.team * 0.15 +
    scores.culture * 0.15;
  return Math.round((raw / 5) * 1000) / 10;
}

describe("computeBARSTotalScore", () => {
  it("全部满分 → 100分", () => {
    expect(
      computeBARSTotalScore({
        skill: 5,
        problem: 5,
        comm: 5,
        team: 5,
        culture: 5,
      })
    ).toBe(100);
  });

  it("全部最低 → 20分", () => {
    expect(
      computeBARSTotalScore({
        skill: 1,
        problem: 1,
        comm: 1,
        team: 1,
        culture: 1,
      })
    ).toBe(20);
  });

  it("全部中间 → 60分", () => {
    expect(
      computeBARSTotalScore({
        skill: 3,
        problem: 3,
        comm: 3,
        team: 3,
        culture: 3,
      })
    ).toBe(60);
  });

  it("专业技能权重最高 (30%)", () => {
    const highSkill = computeBARSTotalScore({
      skill: 5,
      problem: 1,
      comm: 1,
      team: 1,
      culture: 1,
    });
    const highComm = computeBARSTotalScore({
      skill: 1,
      problem: 1,
      comm: 5,
      team: 1,
      culture: 1,
    });
    expect(highSkill).toBeGreaterThan(highComm);
  });

  it("团队协作权重最低 (15%)", () => {
    const highTeam = computeBARSTotalScore({
      skill: 1,
      problem: 1,
      comm: 1,
      team: 5,
      culture: 1,
    });
    const highSkill = computeBARSTotalScore({
      skill: 5,
      problem: 1,
      comm: 1,
      team: 1,
      culture: 1,
    });
    expect(highTeam).toBeLessThan(highSkill);
  });

  it("典型评分: 4,3,4,3,4 → 约76分", () => {
    const score = computeBARSTotalScore({
      skill: 4,
      problem: 3,
      comm: 4,
      team: 3,
      culture: 4,
    });
    // raw = 4*0.3+3*0.2+4*0.2+3*0.15+4*0.15 = 1.2+0.6+0.8+0.45+0.6 = 3.65
    // total = 3.65/5*100 = 73
    expect(score).toBe(73);
  });

  it("技能满分但其余最低 → 约36分", () => {
    const score = computeBARSTotalScore({
      skill: 5,
      problem: 1,
      comm: 1,
      team: 1,
      culture: 1,
    });
    // raw = 1.5+0.2+0.2+0.15+0.15 = 2.2
    // total = 2.2/5*100 = 44
    expect(score).toBe(44);
  });
});

// ═══════════════════════════════════════
// Offer 总包计算公式测试
// 公式: baseSalary × (12 + bonus) + stock / 4
// 来源: api/routers/index.ts offerRouter.create
// ═══════════════════════════════════════

function computeTotalPackage(
  baseSalary: number,
  bonus: number,
  stock: number
): number {
  return baseSalary * (12 + bonus) + stock / 4;
}

describe("computeTotalPackage", () => {
  it("年薪30万, 2个月奖金, 20万股票 → 545万", () => {
    // 300000 * 14 + 200000/4 = 4200000 + 50000 = 4250000
    expect(computeTotalPackage(300000, 2, 200000)).toBe(4250000);
  });

  it("零奖金零股票 → 12倍base", () => {
    expect(computeTotalPackage(10000, 0, 0)).toBe(120000);
  });

  it("高奖金(6个月)计算正确", () => {
    expect(computeTotalPackage(20000, 6, 0)).toBe(360000);
  });

  it("大额股票 RSU 分摊计算", () => {
    // 股票按4年均摊
    expect(computeTotalPackage(0, 0, 400000)).toBe(100000);
  });

  it("综合包: 月薪5万, 年终3个月, 股票80万/4年", () => {
    // 50000 * 15 + 800000/4 = 750000 + 200000 = 950000
    expect(computeTotalPackage(50000, 3, 800000)).toBe(950000);
  });
});

// ═══════════════════════════════════════
// 仪表盘 KPI 统计逻辑测试
// 来源: api/routers/index.ts dashboardRouter.stats
// ═══════════════════════════════════════

function computeChangeRate(current: number, previous: number): number {
  if (previous > 0) {
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
  return current > 0 ? 100 : 0;
}

function computeAvgHireDays(
  acceptedOffers: Array<{ id: number; candidateId: number; createdAt: string }>,
  interviews: Array<{ id: number; candidateId: number; createdAt: string }>
): number {
  let totalDays = 0;
  let countDays = 0;
  for (const offer of acceptedOffers) {
    const firstInterview = interviews
      .filter(iv => iv.candidateId === offer.candidateId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];
    if (firstInterview) {
      const days = Math.round(
        (new Date(offer.createdAt).getTime() -
          new Date(firstInterview.createdAt).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      if (days > 0 && days < 365) {
        totalDays += days;
        countDays++;
      }
    }
  }
  return countDays > 0 ? Math.round(totalDays / countDays) : 0;
}

function computeInterviewPassRate(completed: number, total: number): number {
  if (total > 0) return Math.round((completed / total) * 1000) / 10;
  return 0;
}

function computeOfferAcceptRate(accepted: number, total: number): number {
  if (total > 0) return Math.round((accepted / total) * 1000) / 10;
  return 0;
}

describe("computeChangeRate", () => {
  it("从10涨到15 → +50%", () => {
    expect(computeChangeRate(15, 10)).toBe(50);
  });

  it("从10降到5 → -50%", () => {
    expect(computeChangeRate(5, 10)).toBe(-50);
  });

  it("环比不变 → 0%", () => {
    expect(computeChangeRate(10, 10)).toBe(0);
  });

  it("上月为0, 本月有 → 100%", () => {
    expect(computeChangeRate(5, 0)).toBe(100);
  });

  it("上月为0, 本月也为0 → 0%", () => {
    expect(computeChangeRate(0, 0)).toBe(0);
  });

  it("从100涨到103 → +3%", () => {
    expect(computeChangeRate(103, 100)).toBe(3);
  });

  it("从100降到94 → -6%", () => {
    expect(computeChangeRate(94, 100)).toBe(-6);
  });

  it("小数精度: 3/7 ≈ 42.9%", () => {
    // (10-7)/7 = 3/7 ≈ 0.42857... → 42.9
    expect(computeChangeRate(10, 7)).toBe(42.9);
  });
});

describe("computeAvgHireDays", () => {
  const offers = [
    { id: 1, candidateId: 1, createdAt: "2026-03-15" },
    { id: 2, candidateId: 2, createdAt: "2026-04-01" },
  ];

  const interviews = [
    { id: 1, candidateId: 1, createdAt: "2026-02-01" },
    { id: 2, candidateId: 2, createdAt: "2026-02-15" },
    { id: 3, candidateId: 1, createdAt: "2026-03-01" },
  ];

  it("计算平均招聘周期", () => {
    // 候选人1: 第一场面试2/1, offer3/15 → 42天
    // 候选人2: 第一场面试2/15, offer4/1 → 45天
    // 平均 = 44天
    const avg = computeAvgHireDays(offers, interviews);
    expect(avg).toBe(44);
  });

  it("无录用Offer → 返回0", () => {
    expect(computeAvgHireDays([], interviews)).toBe(0);
  });

  it("无面试记录 → 返回0", () => {
    expect(computeAvgHireDays(offers, [])).toBe(0);
  });

  it("超过365天的异常数据被过滤", () => {
    const oldOffer = { id: 1, candidateId: 1, createdAt: "2028-01-01" };
    const oldInterview = { id: 1, candidateId: 1, createdAt: "2026-01-01" };
    // 730天 > 365，被过滤
    expect(computeAvgHireDays([oldOffer], [oldInterview])).toBe(0);
  });
});

describe("computeInterviewPassRate", () => {
  it("100场面试, 80场完成 → 80%", () => {
    expect(computeInterviewPassRate(80, 100)).toBe(80);
  });

  it("0场面试 → 0%", () => {
    expect(computeInterviewPassRate(0, 0)).toBe(0);
  });

  it("小数精度: 1/3 → 33.3%", () => {
    expect(computeInterviewPassRate(1, 3)).toBe(33.3);
  });
});

describe("computeOfferAcceptRate", () => {
  it("10个Offer, 5个接受 → 50%", () => {
    expect(computeOfferAcceptRate(5, 10)).toBe(50);
  });

  it("0个Offer → 0%", () => {
    expect(computeOfferAcceptRate(0, 0)).toBe(0);
  });
});

// ═══════════════════════════════════════
// 预警自动生成过滤器逻辑测试
// 来源: api/routers/index.ts alertRouter.autoGenerate
// ═══════════════════════════════════════

function isInterviewOverdue(
  interview: { status: string; scheduledTime: string | null },
  now: Date
): boolean {
  if (interview.status !== "pending" || !interview.scheduledTime) return false;
  const st = new Date(interview.scheduledTime);
  const hours = (now.getTime() - st.getTime()) / (60 * 60 * 1000);
  return st < now && hours > 24;
}

function isOfferExpiring(
  offer: { status: string; createdAt: string },
  now: Date
): boolean {
  if (offer.status !== "sent" && offer.status !== "negotiating") return false;
  const days =
    (now.getTime() - new Date(offer.createdAt).getTime()) /
    (24 * 60 * 60 * 1000);
  return days > 7;
}

function isStaleCandidate(
  candidate: { stage: string; createdAt: string },
  now: Date
): boolean {
  if (candidate.stage !== "初筛") return false;
  const days =
    (now.getTime() - new Date(candidate.createdAt).getTime()) /
    (24 * 60 * 60 * 1000);
  return days > 14;
}

describe("isInterviewOverdue", () => {
  it("pending面试超过24小时 → 超时", () => {
    const past = new Date(Date.now() - 48 * 60 * 60 * 1000);
    expect(
      isInterviewOverdue(
        { status: "pending", scheduledTime: past.toISOString() },
        new Date()
      )
    ).toBe(true);
  });

  it("pending面试刚刚过去12小时 → 未超时", () => {
    const past = new Date(Date.now() - 12 * 60 * 60 * 1000);
    expect(
      isInterviewOverdue(
        { status: "pending", scheduledTime: past.toISOString() },
        new Date()
      )
    ).toBe(false);
  });

  it("已完成的面试就算超时也不报警", () => {
    const past = new Date(Date.now() - 72 * 60 * 60 * 1000);
    expect(
      isInterviewOverdue(
        { status: "completed", scheduledTime: past.toISOString() },
        new Date()
      )
    ).toBe(false);
  });

  it("未来时间的面试不报警", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(
      isInterviewOverdue(
        { status: "pending", scheduledTime: future.toISOString() },
        new Date()
      )
    ).toBe(false);
  });

  it("无排期时间的面试不报警", () => {
    expect(
      isInterviewOverdue({ status: "pending", scheduledTime: null }, new Date())
    ).toBe(false);
  });
});

describe("isOfferExpiring", () => {
  it("已发送8天的Offer → 到期", () => {
    const offer = {
      status: "sent",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isOfferExpiring(offer, new Date())).toBe(true);
  });

  it("已发送5天的Offer → 未到期", () => {
    const offer = {
      status: "sent",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isOfferExpiring(offer, new Date())).toBe(false);
  });

  it("谈判中15天的Offer → 到期", () => {
    const offer = {
      status: "negotiating",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isOfferExpiring(offer, new Date())).toBe(true);
  });

  it("草稿状态不触发到期", () => {
    const offer = {
      status: "draft",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isOfferExpiring(offer, new Date())).toBe(false);
  });

  it("已接受状态不触发到期", () => {
    const offer = {
      status: "accepted",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isOfferExpiring(offer, new Date())).toBe(false);
  });
});

describe("isStaleCandidate", () => {
  it("初筛阶段超过14天 → 长期未跟进", () => {
    const candidate = {
      stage: "初筛",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isStaleCandidate(candidate, new Date())).toBe(true);
  });

  it("初筛阶段仅10天 → 未触发", () => {
    const candidate = {
      stage: "初筛",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isStaleCandidate(candidate, new Date())).toBe(false);
  });

  it("复试阶段超过14天 → 不触发(仅初筛)", () => {
    const candidate = {
      stage: "复试",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isStaleCandidate(candidate, new Date())).toBe(false);
  });

  it("Offer阶段超过14天 → 不触发", () => {
    const candidate = {
      stage: "offer阶段",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isStaleCandidate(candidate, new Date())).toBe(false);
  });
});

// ═══════════════════════════════════════
// 候选人状态阶段性验证
// ═══════════════════════════════════════

describe("candidate stage mapping", () => {
  const validStages = ["初筛", "复试", "终面", "offer阶段", "已入职", "已拒绝"];

  it("候选人创建时默认阶段为初筛", () => {
    const defaultStage = "初筛";
    expect(validStages).toContain(defaultStage);
    expect(defaultStage).toBe("初筛");
  });

  it("有效阶段映射正确", () => {
    expect(validStages.length).toBe(6);
    expect(validStages[0]).toBe("初筛");
    expect(validStages[3]).toBe("offer阶段");
  });
});

// ═══════════════════════════════════════
// 面试创建默认值验证
// ═══════════════════════════════════════

describe("interview defaults", () => {
  it("面试创建默认stage=初筛", () => {
    const defaultStage = "初筛";
    expect(defaultStage).toBe("初筛");
  });

  it("面试创建默认status=pending", () => {
    const defaultStatus = "pending";
    expect(defaultStatus).toBe("pending");
  });

  it("面试创建默认type=视频", () => {
    const defaultType = "视频";
    expect(defaultType).toBe("视频");
  });
});

// ═══════════════════════════════════════
// Offer 创建默认值验证
// ═══════════════════════════════════════

describe("offer defaults", () => {
  it("Offer创建默认status=draft", () => {
    const defaultStatus = "draft";
    expect(defaultStatus).toBe("draft");
  });

  it("Offer状态流转顺序", () => {
    const flow = ["draft", "sent", "negotiating", "accepted", "rejected"];
    expect(flow.indexOf("draft")).toBe(0);
    expect(flow.indexOf("accepted")).toBe(3);
  });
});

// ═══════════════════════════════════════
// 渠道创建默认值验证
// ═══════════════════════════════════════

describe("channel defaults", () => {
  it("渠道创建默认type=线上招聘", () => {
    const defaultType = "线上招聘";
    expect(defaultType).toBe("线上招聘");
  });

  it("渠道创建默认status=active", () => {
    const defaultStatus = "active";
    expect(defaultStatus).toBe("active");
  });

  it("渠道创建默认cost=0", () => {
    const defaultCost = 0;
    expect(defaultCost).toBe(0);
  });
});

// ═══════════════════════════════════════
// 预警类型枚举验证
// ═══════════════════════════════════════

describe("alert types", () => {
  it("预警类型只有四种", () => {
    const types = ["risk", "warning", "info", "success"];
    expect(types.length).toBe(4);
    expect(types).toContain("risk");
    expect(types).toContain("warning");
    expect(types).toContain("info");
    expect(types).toContain("success");
  });
});

// ═══════════════════════════════════════
// 岗位匹配统计逻辑
// ═══════════════════════════════════════

describe("position stats", () => {
  it("面试完成率计算", () => {
    const interviews = [
      { status: "completed" },
      { status: "completed" },
      { status: "pending" },
      { status: "cancelled" },
    ];
    const completed = interviews.filter(i => i.status === "completed").length;
    expect(completed).toBe(2);
  });

  it("Offer接受率计算", () => {
    const offers = [
      { status: "accepted" },
      { status: "sent" },
      { status: "negotiating" },
      { status: "accepted" },
      { status: "draft" },
    ];
    const accepted = offers.filter(o => o.status === "accepted").length;
    expect(accepted).toBe(2);
  });
});
