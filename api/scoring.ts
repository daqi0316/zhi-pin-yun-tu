/**
 * 智聘云图 — AI 评分引擎
 *
 * 基于 docs/评分体系设计V1.md 的公式实现
 * 学术依据：Kristof-Brown (2005) P-J Fit, Schmidt & Hunter (1998) 效度元分析
 *
 * 综合得分 = 技能匹配×30% + 经验匹配×25% + 教育背景×10%
 *          + 能力信号×15% + 稳定性×10% + 薪酬匹配×10%
 */

// ─── 评分结果类型 ───

export interface DimensionScore {
  name: string
  score: number // 0-100
  detail: string
  level: 'S' | 'A' | 'B' | 'C' | 'D'
}

export interface ResumeScoreResult {
  total: number // 综合得分 0-100
  level: 'S' | 'A' | 'B' | 'C' | 'D'
  dimensions: {
    skillMatch: DimensionScore
    experienceMatch: DimensionScore
    education: DimensionScore
    capabilitySignal: DimensionScore
    stability: DimensionScore
    salaryFit: DimensionScore
  }
}

// ─── 输入类型 ───

export interface ScoringInput {
  candidateSkills: string[]
  candidateExperience: number           // 工作年限
  candidateEducation: string           // 教育背景文本
  candidateSalaryExpectation?: number  // 期望月薪（元）
  workHistory?: Array<{
    company: string
    position?: string
    startDate?: string
    endDate?: string
    description?: string
  }>
  // 岗位要求
  positionRequiredSkills: string[]
  positionBonusSkills: string[]
  positionMinExperience: number
  positionMaxExperience: number
  positionMinEducation?: string
  positionSalaryMin?: number
  positionSalaryMax?: number
}

// ─── 辅助函数 ───

function scoreToLevel(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S'
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  return 'D'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ─── 维度一：技能匹配（权重30%） ───

function calcSkillMatch(
  candidateSkills: string[],
  requiredSkills: string[],
  bonusSkills: string[],
): DimensionScore {
  const cSkills = candidateSkills.map(s => s.toLowerCase().trim())
  const rSkills = requiredSkills.map(s => s.toLowerCase().trim())
  const bSkills = bonusSkills.map(s => s.toLowerCase().trim())

  const matchedRequired = rSkills.filter(r => cSkills.some(c => c.includes(r) || r.includes(c)))
  const matchedBonus = bSkills.filter(b => cSkills.some(c => c.includes(b) || b.includes(c)))

  const requiredScore = rSkills.length > 0 ? (matchedRequired.length / rSkills.length) * 100 : 0
  const bonusScore = bSkills.length > 0 ? (matchedBonus.length / bSkills.length) * 100 : 0

  // 公式：必须技能×70% + 加分技能×30%
  const score = Math.round(requiredScore * 0.7 + bonusScore * 0.3)

  return {
    name: '技能匹配',
    score: clamp(score, 0, 100),
    detail: `必须技能 ${matchedRequired.length}/${rSkills.length}，加分技能 ${matchedBonus.length}/${bSkills.length}`,
    level: scoreToLevel(score),
  }
}

// ─── 维度二：经验匹配（权重25%） ───

function calcExperienceMatch(
  candidateExperience: number,
  minExp: number,
  maxExp: number,
  workHistory?: ScoringInput['workHistory'],
): DimensionScore {
  // 年限匹配度
  const targetExp = (minExp + maxExp) / 2
  const expDiff = Math.abs(candidateExperience - targetExp)
  const expMatchPercent = targetExp > 0
    ? Math.max(0, 1 - expDiff / targetExp)
    : 1

  const expMatchScore = expMatchPercent * 60

  // 行业相关性（基于 workHistory 做简单判断）
  // 现阶段简化：有工作经验就给一定的行业相关性分
  const industryScore = (workHistory && workHistory.length > 0) ? 80 : 20

  // 公式：年限匹配×60 + 行业相关性×40
  const score = Math.round(expMatchScore + industryScore * 0.4)

  return {
    name: '经验匹配',
    score: clamp(score, 0, 100),
    detail: `年限 ${candidateExperience}年，目标 ${targetExp}年，年限匹配度 ${Math.round(expMatchPercent * 100)}%`,
    level: scoreToLevel(score),
  }
}

// ─── 维度三：教育背景（权重10%） ───

function calcEducation(education: string): DimensionScore {
  const edu = education.toLowerCase()

  // 简单关键词评分
  if (/博士/.test(edu) && (/985|清|北|复|交|浙大/.test(edu) || /海外|留学|Top/.test(edu))) {
    return { name: '教育背景', score: 95, detail: '博士 / 顶尖院校', level: 'S' }
  }
  if (/硕士/.test(edu) && (/985/.test(edu) || /211/.test(edu))) {
    return { name: '教育背景', score: 85, detail: '硕士 / 985-211院校', level: 'A' }
  }
  if (/硕士/.test(edu)) {
    return { name: '教育背景', score: 80, detail: '硕士', level: 'A' }
  }
  if (/本科/.test(edu) && (/985/.test(edu) || /211/.test(edu))) {
    return { name: '教育背景', score: 75, detail: '本科 / 985-211院校', level: 'A' }
  }
  if (/本科/.test(edu)) {
    return { name: '教育背景', score: 65, detail: '本科', level: 'B' }
  }
  if (/大专/.test(edu)) {
    return { name: '教育背景', score: 30, detail: '大专', level: 'D' }
  }

  // 无法识别，给中等分
  return { name: '教育背景', score: 50, detail: '无法识别教育层级', level: 'C' }
}

// ─── 维度四：能力信号（权重15%） ───

function calcCapabilitySignal(
  workHistory?: ScoringInput['workHistory'],
): DimensionScore {
  if (!workHistory || workHistory.length === 0) {
    return { name: '能力信号', score: 20, detail: '缺乏工作经历信息', level: 'D' }
  }

  let signalScore = 0

  // 大厂背景 (30%)
  const bigTech = ['腾讯', '阿里巴巴', '字节跳动', '百度', '华为', '美团', '京东', '网易', '小米', '蚂蚁', '滴滴', '快手']
  const hasBigTech = workHistory.some(w =>
    bigTech.some(b => w.company.includes(b)),
  )
  if (hasBigTech) signalScore += 30

  // 职级晋升信号 (30%) — 有过多家公司或岗位变动
  if (workHistory.length >= 2) signalScore += 20
  if (workHistory.length >= 3) signalScore += 10

  // 项目复杂度 (30%) — 有描述信息且较长
  const hasComplexProject = workHistory.some(w =>
    w.description && w.description.length > 20,
  )
  if (hasComplexProject) signalScore += 20
  // 描述中有 manage/lead/负责/主导/架构 等关键词
  const hasLeadership = workHistory.some(w =>
    /lead|manage|负责|主导|架构|负责人|团队|manager/i.test(w.description || ''),
  )
  if (hasLeadership) signalScore += 10

  // 管理经验 (10%)
  const hasManagement = workHistory.some(w =>
    /团队|管理|经理|总监|team|lead/i.test(w.position || ''),
  )
  if (hasManagement) signalScore += 10

  return {
    name: '能力信号',
    score: clamp(signalScore, 0, 100),
    detail: `大厂${hasBigTech ? '✓' : '✗'} · 晋升信号${workHistory.length >= 2 ? '✓' : '✗'} · 管理经验${hasManagement ? '✓' : '✗'}`,
    level: scoreToLevel(signalScore),
  }
}

// ─── 维度五：稳定性（权重10%） ───

function calcStability(
  candidateExperience: number,
  workHistory?: ScoringInput['workHistory'],
): DimensionScore {
  if (!workHistory || workHistory.length === 0) {
    return { name: '稳定性', score: 50, detail: '缺乏工作经历信息', level: 'C' }
  }

  // 平均任职时长
  const avgTenure = candidateExperience / workHistory.length

  // 公式：min(平均任职时长 / 3, 1) × 100
  const score = Math.round(Math.min(avgTenure / 3, 1) * 100)

  // 检测短跳次数 (< 1年)
  const shortStints = workHistory.filter(w => {
    if (!w.startDate || !w.endDate) return false
    const start = new Date(w.startDate).getTime()
    const end = new Date(w.endDate).getTime()
    if (isNaN(start) || isNaN(end)) return false
    const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000)
    return years < 1
  }).length

  const detail = `平均在职 ${avgTenure.toFixed(1)}年，短跳 ${shortStints}次`
  const adjustedScore = shortStints >= 2 ? Math.max(score - shortStints * 10, 0) : score

  return {
    name: '稳定性',
    score: clamp(adjustedScore, 0, 100),
    detail,
    level: scoreToLevel(adjustedScore),
  }
}

// ─── 维度六：薪酬匹配（权重10%） ───

function calcSalaryFit(
  salaryExpectation: number | undefined,
  salaryMin: number | undefined,
  salaryMax: number | undefined,
): DimensionScore {
  if (!salaryExpectation || (!salaryMin && !salaryMax)) {
    return { name: '薪酬匹配', score: 60, detail: '薪酬信息不足，按中等分处理', level: 'B' }
  }

  const budgetMid = ((salaryMin || 0) + (salaryMax || salaryMin || 0)) / 2
  if (budgetMid === 0) {
    return { name: '薪酬匹配', score: 60, detail: '预算信息不足', level: 'B' }
  }

  const deviation = (salaryExpectation - budgetMid) / budgetMid * 100 // 偏离百分比
  let score: number

  if (Math.abs(deviation) <= 10) {
    score = 95 // S
  } else if (Math.abs(deviation) <= 20) {
    score = 80 // A
  } else if (Math.abs(deviation) <= 30) {
    score = 65 // B
  } else if (Math.abs(deviation) <= 50) {
    score = 45 // C
  } else {
    score = 20 // D
  }

  return {
    name: '薪酬匹配',
    score,
    detail: `期望 ${salaryExpectation}元，预算中位 ${Math.round(budgetMid)}元，偏离 ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`,
    level: scoreToLevel(score),
  }
}

// ─── 主入口 ───

export function calculateResumeScore(input: ScoringInput): ResumeScoreResult {
  const skillMatch = calcSkillMatch(
    input.candidateSkills,
    input.positionRequiredSkills,
    input.positionBonusSkills,
  )
  const experienceMatch = calcExperienceMatch(
    input.candidateExperience,
    input.positionMinExperience,
    input.positionMaxExperience,
    input.workHistory,
  )
  const education = calcEducation(input.candidateEducation)
  const capabilitySignal = calcCapabilitySignal(input.workHistory)
  const stability = calcStability(input.candidateExperience, input.workHistory)
  const salaryFit = calcSalaryFit(
    input.candidateSalaryExpectation,
    input.positionSalaryMin,
    input.positionSalaryMax,
  )

  // 综合得分 = 权重加权
  const total = Math.round(
    skillMatch.score * 0.30 +
    experienceMatch.score * 0.25 +
    education.score * 0.10 +
    capabilitySignal.score * 0.15 +
    stability.score * 0.10 +
    salaryFit.score * 0.10
  )

  return {
    total: clamp(total, 0, 100),
    level: scoreToLevel(total),
    dimensions: {
      skillMatch,
      experienceMatch,
      education,
      capabilitySignal,
      stability,
      salaryFit,
    },
  }
}
