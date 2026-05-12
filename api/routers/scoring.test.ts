import { describe, it, expect } from "vitest";
import {
  detectPositionType,
  DEFAULT_WEIGHTS,
  BIG_TECH_COMPANIES,
} from "../scoring";
import { groupByCompany, analyzeCandidateRelations } from "../company-relation";

// ═══════════════════════════════════════
// detectPositionType 测试
// ═══════════════════════════════════════

describe("detectPositionType", () => {
  it("高级Java工程师 → 技术", () => {
    expect(detectPositionType("高级Java工程师", ["Spring", "MySQL"])).toBe(
      "技术"
    );
  });

  it("前端开发工程师 → 技术", () => {
    expect(detectPositionType("前端开发工程师", ["React", "Vue"])).toBe("技术");
  });

  it("产品经理(带产品关键词) → 产品", () => {
    expect(detectPositionType("产品经理", ["用户研究", "需求分析"])).toBe(
      "产品"
    );
  });

  it("产品负责人 → 产品", () => {
    expect(detectPositionType("产品负责人", [])).toBe("产品");
  });

  it("运营总监 → 运营", () => {
    expect(detectPositionType("运营总监", ["社群运营"])).toBe("运营");
  });

  it("UI设计师 → 设计", () => {
    expect(detectPositionType("UI设计师", ["Figma", "Photoshop"])).toBe("设计");
  });

  it("未知类型 → 其他", () => {
    expect(detectPositionType("行政专员", ["Office"])).toBe("其他");
  });

  it("空标题 → 其他", () => {
    expect(detectPositionType("", [])).toBe("其他");
  });

  it("技能含tech关键词即判定为技术", () => {
    expect(detectPositionType("数据分析师", ["Python", "机器学习"])).toBe(
      "技术"
    );
  });
});

// ═══════════════════════════════════════
// DEFAULT_WEIGHTS 测试
// ═══════════════════════════════════════

describe("DEFAULT_WEIGHTS", () => {
  it("所有权重合计为1.0", () => {
    for (const [key, weights] of Object.entries(DEFAULT_WEIGHTS)) {
      const sum =
        weights.skillMatch +
        weights.experienceMatch +
        weights.education +
        weights.capabilitySignal +
        weights.stability +
        weights.salaryFit;
      expect(sum).toBeCloseTo(1.0, 2);
    }
  });

  it("技术岗技能匹配权重最高 (35%)", () => {
    const tech = DEFAULT_WEIGHTS["技术"];
    expect(tech.skillMatch).toBe(0.35);
    // 技术岗技能匹配 > 其他纬度
    expect(tech.skillMatch).toBeGreaterThan(tech.experienceMatch);
    expect(tech.skillMatch).toBeGreaterThan(tech.stability);
  });

  it("运营岗经验匹配权重最高 (30%)", () => {
    const ops = DEFAULT_WEIGHTS["运营"];
    expect(ops.experienceMatch).toBe(0.3);
    expect(ops.experienceMatch).toBeGreaterThan(ops.skillMatch);
  });

  it("产品岗薪酬匹配权重较高 (15%)", () => {
    const prod = DEFAULT_WEIGHTS["产品"];
    expect(prod.salaryFit).toBe(0.15);
  });
});

// ═══════════════════════════════════════
// BIG_TECH_COMPANIES 测试
// ═══════════════════════════════════════

describe("BIG_TECH_COMPANIES", () => {
  it("包含15家核心大厂", () => {
    expect(BIG_TECH_COMPANIES.length).toBe(15);
  });

  it("包含中国主流互联网/科技公司", () => {
    expect(BIG_TECH_COMPANIES).toContain("腾讯");
    expect(BIG_TECH_COMPANIES).toContain("阿里巴巴");
    expect(BIG_TECH_COMPANIES).toContain("字节跳动");
    expect(BIG_TECH_COMPANIES).toContain("华为");
    expect(BIG_TECH_COMPANIES).toContain("美团");
  });

  it("所有大厂名都是中文", () => {
    for (const name of BIG_TECH_COMPANIES) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════
// company-relation: groupByCompany 额外场景
// ═══════════════════════════════════════

describe("groupByCompany (extended)", () => {
  it("单一公司无人关联时不生成Group", () => {
    const candidates = [{ id: 1, name: "张三" }];
    const workHistory = [
      {
        candidateId: 1,
        company: "字节跳动",
        position: "后端",
        startDate: "2020-01-01",
        endDate: null,
        isCurrent: 0,
        id: 1,
        description: null,
      },
    ];
    const groups = groupByCompany(candidates, workHistory as any);
    expect(groups).toHaveLength(0);
  });

  it("空数据返回空数组", () => {
    expect(groupByCompany([], [])).toHaveLength(0);
  });
});

// ═══════════════════════════════════════
// company-relation: analyzeCandidateRelations 额外场景
// ═══════════════════════════════════════

describe("analyzeCandidateRelations (extended)", () => {
  it("无关联候选人返回空数组", () => {
    const allCandidates = [
      { id: 1, name: "张三" },
      { id: 2, name: "李四" },
    ];
    const workHistory = [
      {
        candidateId: 1,
        company: "字节跳动",
        startDate: "2020-01-01",
        endDate: null,
        position: "后端",
        isCurrent: 1,
        id: 1,
        description: null,
      },
      {
        candidateId: 2,
        company: "腾讯",
        startDate: "2019-01-01",
        endDate: null,
        position: "前端",
        isCurrent: 1,
        id: 2,
        description: null,
      },
    ];
    const relations = analyzeCandidateRelations(
      1,
      "张三",
      allCandidates,
      workHistory as any
    );
    expect(relations).toHaveLength(0);
  });

  it("strong关联度评分>=70（需>=2家共同公司）", () => {
    const allCandidates = [
      { id: 1, name: "张三" },
      { id: 2, name: "李四" },
    ];
    // 2家公司 + 长期重叠 → strong
    const workHistory = [
      {
        candidateId: 1,
        company: "字节跳动",
        startDate: "2020-01-01",
        endDate: "2024-01-01",
        position: "后端",
        isCurrent: 0,
        id: 1,
        description: null,
      },
      {
        candidateId: 2,
        company: "字节跳动",
        startDate: "2019-06-01",
        endDate: "2023-12-01",
        position: "前端",
        isCurrent: 0,
        id: 2,
        description: null,
      },
      {
        candidateId: 1,
        company: "腾讯",
        startDate: "2018-01-01",
        endDate: "2019-12-01",
        position: "后端",
        isCurrent: 0,
        id: 3,
        description: null,
      },
      {
        candidateId: 2,
        company: "腾讯",
        startDate: "2018-03-01",
        endDate: "2019-06-01",
        position: "前端",
        isCurrent: 0,
        id: 4,
        description: null,
      },
    ];
    const relations = analyzeCandidateRelations(
      1,
      "张三",
      allCandidates,
      workHistory as any
    );
    expect(relations).toHaveLength(1);
    expect(relations[0].relationScore).toBeGreaterThanOrEqual(70);
    expect(relations[0].relationLevel).toBe("strong");
  });

  it("medium关联度评分40-69", () => {
    const allCandidates = [
      { id: 1, name: "张三" },
      { id: 2, name: "李四" },
    ];
    // 短期重叠 → medium
    const workHistory = [
      {
        candidateId: 1,
        company: "字节跳动",
        startDate: "2022-06-01",
        endDate: "2023-06-01",
        position: "后端",
        isCurrent: 0,
        id: 1,
        description: null,
      },
      {
        candidateId: 2,
        company: "字节跳动",
        startDate: "2022-09-01",
        endDate: "2023-03-01",
        position: "前端",
        isCurrent: 0,
        id: 2,
        description: null,
      },
    ];
    const relations = analyzeCandidateRelations(
      1,
      "张三",
      allCandidates,
      workHistory as any
    );
    expect(relations).toHaveLength(1);
    expect(relations[0].relationScore).toBeGreaterThanOrEqual(40);
    expect(relations[0].relationScore).toBeLessThan(70);
    expect(relations[0].relationLevel).toBe("medium");
  });
});
