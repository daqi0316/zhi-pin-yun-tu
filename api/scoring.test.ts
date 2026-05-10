import { describe, it, expect } from 'vitest'
import { calculateResumeScore } from './scoring'
import { groupByCompany, analyzeCandidateRelations } from './company-relation'

// ═══════════════════════════════════════
// 评分引擎测试
// ═══════════════════════════════════════

describe('calculateResumeScore', () => {
  // 构建一个 JD 要求
  const baseInput = {
    positionRequiredSkills: ['Java', 'Spring Cloud', 'Redis', 'MySQL', 'Kafka'],
    positionBonusSkills: ['Docker', 'Kubernetes', '微服务'],
    positionMinExperience: 3,
    positionMaxExperience: 5,
    positionSalaryMin: 40000,
    positionSalaryMax: 55000,
  }

  it('高匹配候选人应得 A 级以上', () => {
    const result = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Java', 'Spring Cloud', 'Redis', 'MySQL', 'Kafka', 'Docker', '微服务'],
      candidateExperience: 5,
      candidateEducation: '硕士 · 浙江大学 985',
      candidateSalaryExpectation: 48000,
      workHistory: [
        { company: '字节跳动', position: '高级Java工程师', startDate: '2022-03-01', description: '负责电商中台系统架构设计与核心模块开发，主导微服务拆分，团队规模15人' },
        { company: '蚂蚁集团', position: '技术经理', startDate: '2019-06-01', endDate: '2022-02-28', description: '团队管理，核心支付系统' },
      ],
    })

    expect(result.level).toBe('A')
    expect(result.total).toBeGreaterThanOrEqual(75)
    expect(result.dimensions.skillMatch.score).toBeGreaterThanOrEqual(90)
    expect(result.dimensions.stability.score).toBeGreaterThanOrEqual(70)
  })

  it('技能完全不匹配应得低分', () => {
    const result = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Photoshop', 'Figma', 'UI Design'],
      candidateExperience: 2,
      candidateEducation: '大专',
      candidateSalaryExpectation: 80000,
      workHistory: [
        { company: '小设计公司', position: '设计师', startDate: '2023-01-01' },
      ],
    })

    expect(result.level).toBe('D')
    expect(result.total).toBeLessThan(40)
    expect(result.dimensions.skillMatch.score).toBeLessThan(40)
  })

  it('技能匹配评分公式正确：必须技能70% + 加分技能30%', () => {
    const result = calculateResumeScore({
      positionRequiredSkills: ['Java', 'Python', 'SQL'],
      positionBonusSkills: ['Docker', 'Redis'],
      candidateSkills: ['Java', 'Python', 'Docker'],
      candidateExperience: 4,
      candidateEducation: '本科 · 普通大学',
      candidateSalaryExpectation: 45000,
      positionSalaryMin: 40000,
      positionSalaryMax: 60000,
      positionMinExperience: 3,
      positionMaxExperience: 5,
      workHistory: [
        { company: '某公司', position: '开发', startDate: '2021-01-01' },
      ],
    })

    // 必须技能 2/3 = 66.7 → 66.7*0.7 = 46.7
    // 加分技能 1/2 = 50 → 50*0.3 = 15
    // 总分 = 61.7 → 62
    expect(result.dimensions.skillMatch.score).toBe(62)
  })

  it('稳定性：平均在职时长越长分越高', () => {
    // 高稳定：平均3年以上
    const stable = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Java'],
      candidateExperience: 9,
      candidateEducation: '本科',
      workHistory: [
        { company: 'A公司', startDate: '2020-01-01', endDate: '2023-01-01' },
        { company: 'B公司', startDate: '2023-01-01', endDate: '2026-01-01' },
        { company: 'C公司', startDate: '2026-01-01' },
      ],
    })

    // 低稳定：频繁短跳
    const unstable = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Java'],
      candidateExperience: 4,
      candidateEducation: '本科',
      workHistory: [
        { company: 'A公司', startDate: '2022-01-01', endDate: '2022-06-01' },
        { company: 'B公司', startDate: '2022-07-01', endDate: '2023-01-01' },
        { company: 'C公司', startDate: '2023-02-01', endDate: '2023-08-01' },
        { company: 'D公司', startDate: '2023-09-01', endDate: '2024-03-01' },
      ],
    })

    expect(stable.dimensions.stability.score).toBeGreaterThan(unstable.dimensions.stability.score)
  })

  it('薪酬偏离越小得分越高', () => {
    const inRange = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Java'],
      candidateExperience: 4,
      candidateEducation: '本科',
      candidateSalaryExpectation: 50000,
      workHistory: [{ company: 'A公司' }],
    })

    const wayOff = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Java'],
      candidateExperience: 4,
      candidateEducation: '本科',
      candidateSalaryExpectation: 100000,
      workHistory: [{ company: 'A公司' }],
    })

    expect(inRange.dimensions.salaryFit.score).toBeGreaterThan(wayOff.dimensions.salaryFit.score)
  })

  it('能力信号：大厂背景加分', () => {
    const bigTech = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Java'],
      candidateExperience: 5,
      candidateEducation: '本科',
      workHistory: [
        { company: '腾讯', position: '高级工程师', startDate: '2021-01-01', description: '负责核心系统架构设计' },
        { company: '字节跳动', position: '工程师', startDate: '2019-01-01', endDate: '2020-12-31' },
      ],
    })

    const noName = calculateResumeScore({
      ...baseInput,
      candidateSkills: ['Java'],
      candidateExperience: 5,
      candidateEducation: '本科',
      workHistory: [
        { company: '小公司', position: '开发', startDate: '2021-01-01', description: '写代码' },
      ],
    })

    expect(bigTech.dimensions.capabilitySignal.score).toBeGreaterThan(noName.dimensions.capabilitySignal.score)
  })
})

// ═══════════════════════════════════════
// 公司关联度测试
// ═══════════════════════════════════════

describe('groupByCompany', () => {
  const candidates = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' },
  ]

  const workHistory = [
    { candidateId: 1, company: '字节跳动', position: '后端', startDate: null, endDate: null, isCurrent: 0, id: 1, description: null },
    { candidateId: 2, company: '字节跳动', position: '前端', startDate: null, endDate: null, isCurrent: 0, id: 2, description: null },
    { candidateId: 3, company: '腾讯', position: '产品', startDate: null, endDate: null, isCurrent: 0, id: 3, description: null },
  ]

  it('应正确按公司分组', () => {
    const groups = groupByCompany(candidates, workHistory as any)
    expect(groups).toHaveLength(1) // 只有字节跳动有 >=2 人
    expect(groups[0].company).toBe('字节跳动')
    expect(groups[0].candidates).toHaveLength(2)
  })
})

describe('analyzeCandidateRelations', () => {
  const allCandidates = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' },
  ]

  // 张三和李四都在字节跳动待过，并且时间有重叠
  const workHistory = [
    { candidateId: 1, company: '字节跳动', position: '后端', startDate: '2020-01-01', endDate: '2023-06-01', isCurrent: 0, id: 1, description: null },
    { candidateId: 2, company: '字节跳动', position: '前端', startDate: '2021-03-01', endDate: '2024-01-01', isCurrent: 0, id: 2, description: null },
    { candidateId: 3, company: '腾讯', position: '产品', startDate: '2019-01-01', endDate: '2022-01-01', isCurrent: 0, id: 3, description: null },
  ]

  it('应找出同公司关联的候选人', () => {
    const relations = analyzeCandidateRelations(1, '张三', allCandidates, workHistory as any)

    expect(relations).toHaveLength(1)
    expect(relations[0].candidateB.name).toBe('李四')
    expect(relations[0].sharedCompanies[0].company).toBe('字节跳动')
  })

  it('应计算准确的时间重叠月数', () => {
    const relations = analyzeCandidateRelations(1, '张三', allCandidates, workHistory as any)

    // 张三 2020.01-2023.06, 李四 2021.03-2024.01
    // 重叠 = 2021.03 到 2023.06 = 27个月
    expect(relations[0].sharedCompanies[0].overlapMonths).toBe(27)
  })

  it('没有共同公司的候选人不应出现在关联中', () => {
    const relations = analyzeCandidateRelations(3, '王五', allCandidates, workHistory as any)

    expect(relations).toHaveLength(0)
  })
})
