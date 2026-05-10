/**
 * 智聘云图 — 公司关联度管理
 *
 * 功能：
 * 1. 同公司候选人关联：列出在同一家公司工作过的所有候选人
 * 2. 在职时间匹配：分析候选人之间的在职时间是否有重叠
 * 3. 关联度评分：基于公司重叠次数 + 时间重叠程度给分
 */

import type { WorkHistory } from '../db/schema'

// ─── 类型 ───

export interface CompanyGroup {
  company: string
  candidates: Array<{
    candidateId: number
    name: string
    position: string | null
    startDate: string | null
    endDate: string | null
    isCurrent: boolean
  }>
}

export interface CandidateRelation {
  candidateA: { id: number; name: string }
  candidateB: { id: number; name: string }
  sharedCompanies: Array<{
    company: string
    overlapMonths: number // 在职重叠月数
    positions: { a: string | null; b: string | null }
  }>
  totalOverlapMonths: number
  relationScore: number // 0-100
  relationLevel: 'strong' | 'medium' | 'weak'
}

// ─── 辅助 ───

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12
    + (end.getMonth() - start.getMonth())
}

/**
 * 计算两个人在同一公司的时间重叠月数
 */
function calcOverlapMonths(
  startA: Date | null,
  endA: Date | null,
  startB: Date | null,
  endB: Date | null,
): number {
  // 将 null 视为无限远/现在
  const aStart = startA ?? new Date(0)
  const aEnd = endA ?? new Date()
  const bStart = startB ?? new Date(0)
  const bEnd = endB ?? new Date()

  // 重叠区间 = max(开始时间) 到 min(结束时间)
  const overlapStart = new Date(Math.max(aStart.getTime(), bStart.getTime()))
  const overlapEnd = new Date(Math.min(aEnd.getTime(), bEnd.getTime()))

  if (overlapStart >= overlapEnd) return 0 // 无重叠

  return Math.max(0, monthsBetween(overlapStart, overlapEnd))
}

// ─── 构建公司分组 ───

export function groupByCompany(
  candidates: Array<{ id: number; name: string }>,
  workHistories: WorkHistory[],
): CompanyGroup[] {
  const companyMap = new Map<string, CompanyGroup['candidates']>()

  for (const wh of workHistories) {
    const can = candidates.find(c => c.id === wh.candidateId)
    if (!can || !wh.company) continue

    const group = companyMap.get(wh.company) || []
    group.push({
      candidateId: wh.candidateId,
      name: can.name,
      position: wh.position,
      startDate: wh.startDate,
      endDate: wh.endDate,
      isCurrent: wh.isCurrent === 1,
    })
    companyMap.set(wh.company, group)
  }

  return Array.from(companyMap.entries())
    .filter(([_, c]) => c.length >= 2) // 至少2人才能形成关联
    .map(([company, candidates]) => ({ company, candidates }))
    .sort((a, b) => b.candidates.length - a.candidates.length)
}

// ─── 分析候选人间关联度 ───

export function analyzeCandidateRelations(
  candidateId: number,
  candidateName: string,
  allCandidates: Array<{ id: number; name: string }>,
  allWorkHistories: WorkHistory[],
): CandidateRelation[] {
  const myHistory = allWorkHistories.filter(w => w.candidateId === candidateId)
  const relations: CandidateRelation[] = []

  const companies = new Set(myHistory.map(w => w.company).filter(Boolean))

  for (const company of companies) {
    // 找出同样在这家公司待过的候选人
    const peers = allWorkHistories.filter(
      w => w.company === company && w.candidateId !== candidateId,
    )

    const seen = new Set<number>()
    for (const peer of peers) {
      if (seen.has(peer.candidateId)) continue
      seen.add(peer.candidateId)

      const peerCandidate = allCandidates.find(c => c.id === peer.candidateId)
      if (!peerCandidate) continue

      // 找两个人的 history 在这家公司的交集
      const myEntry = myHistory.find(w => w.company === company)
      const peerEntry = peer

      if (!myEntry) continue

      const overlap = calcOverlapMonths(
        parseDate(myEntry.startDate),
        parseDate(myEntry.endDate),
        parseDate(peerEntry.startDate),
        parseDate(peerEntry.endDate),
      )

      // 找已存在的 relation 或创建
      let rel = relations.find(
        r => r.candidateB.id === peer.candidateId || r.candidateA.id === peer.candidateId,
      )

      if (!rel) {
        rel = {
          candidateA: { id: candidateId, name: candidateName },
          candidateB: { id: peer.candidateId, name: peerCandidate.name },
          sharedCompanies: [],
          totalOverlapMonths: 0,
          relationScore: 0,
          relationLevel: 'weak',
        }
        relations.push(rel)
      }

      rel.sharedCompanies.push({
        company,
        overlapMonths: Math.round(overlap),
        positions: {
          a: myEntry.position,
          b: peerEntry.position,
        },
      })
      rel.totalOverlapMonths += overlap
    }
  }

  // 计算关联度评分
  for (const rel of relations) {
    // 评分维度：共同公司数(50%) + 总重叠月数(50%)
    const companyScore = Math.min(rel.sharedCompanies.length / 3, 1) * 50 // 3家以上算满分
    const overlapScore = Math.min(rel.totalOverlapMonths / 12, 1) * 50   // 12个月以上算满分
    const score = Math.round(companyScore + overlapScore)

    rel.relationScore = Math.max(0, Math.min(100, score))
    rel.relationLevel = score >= 70 ? 'strong' : score >= 40 ? 'medium' : 'weak'
  }

  // 按关联度排序
  return relations.sort((a, b) => b.relationScore - a.relationScore)
}
