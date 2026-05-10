import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Users,
  Building2,
  Calendar,
  ChevronRight,
  ArrowLeft,
  GitBranch,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function CompanyRelations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const candidateIdParam = searchParams.get('candidateId')
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    candidateIdParam ? Number(candidateIdParam) : null,
  )

  // 所有候选人列表
  const { data: candidateData } = trpc.candidate.list.useQuery({})
  const candidates = candidateData?.items ?? []

  // 公司分组数据
  const { data: groups } = trpc.relation.companyGroups.useQuery()

  // 选中候选人的关联网络
  const { data: relationData, isLoading: relationLoading } = trpc.relation.candidateRelations.useQuery(
    selectedCandidateId!,
    { enabled: !!selectedCandidateId },
  )

  const handleSelectCandidate = (id: number) => {
    setSelectedCandidateId(id)
    setSearchParams({ candidateId: String(id) })
  }

  const handleBack = () => {
    setSelectedCandidateId(null)
    setSearchParams({})
  }

  const relationColor = (level: string) => {
    switch (level) {
      case 'strong': return { bg: '#06D6A012', text: '#06D6A0', label: '强关联' }
      case 'medium': return { bg: '#F59E0B12', text: '#F59E0B', label: '中关联' }
      default: return { bg: '#94A3B812', text: '#94A3B8', label: '弱关联' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedCandidateId ? (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">
              {selectedCandidateId ? '公司关联网络' : '公司关联度'}
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              {selectedCandidateId
                ? `查看${relationData?.candidate.name || ''}的同公司关系网`
                : '基于工作经历自动关联同公司候选人'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Candidate selector or Company groups */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-sm text-[#1E293B]">
              {selectedCandidateId ? '切换候选人' : '选择候选人'}
            </h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
            {candidates.map((c: any) => (
              <button
                key={c.id}
                onClick={() => handleSelectCandidate(c.id)}
                className={`w-full px-5 py-3 flex items-center gap-3 text-left transition-colors ${
                  selectedCandidateId === c.id ? 'bg-[#2D8FF0]/5 border-l-2 border-[#2D8FF0]' : 'hover:bg-slate-50/50 border-l-2 border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {c.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1E293B]">{c.name}</div>
                  <div className="text-xs text-[#94A3B8] truncate">{c.position}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Relations detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCandidateId ? (
            relationLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#2D8FF0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#94A3B8]">分析关联网络...</p>
              </div>
            ) : relationData && relationData.relations.length > 0 ? (
              <>
                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xl font-bold">
                      {relationData.candidate.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#1E293B]">{relationData.candidate.name}</h2>
                      <p className="text-sm text-[#94A3B8]">
                        关联 {relationData.relations.length} 位候选人
                      </p>
                    </div>
                    <div className="ml-auto flex gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#06D6A0]">
                          {relationData.relations.filter(r => r.relationLevel === 'strong').length}
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">强关联</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#F59E0B]">
                          {relationData.relations.filter(r => r.relationLevel === 'medium').length}
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">中关联</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#94A3B8]">
                          {relationData.relations.filter(r => r.relationLevel === 'weak').length}
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">弱关联</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Relation Cards */}
                {relationData.relations.map((rel, i) => {
                  const color = relationColor(rel.relationLevel)
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#2D8FF0] flex items-center justify-center text-white text-sm font-semibold">
                              {rel.candidateB.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[#1E293B]">{rel.candidateB.name}</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{
                                  background: color.bg,
                                  color: color.text,
                                }}>
                                  {color.label}
                                </span>
                              </div>
                              <div className="text-xs text-[#94A3B8] mt-0.5">
                                关联度评分: {rel.relationScore}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-[#94A3B8]">重叠总月数</div>
                            <div className="text-sm font-semibold text-[#1E293B]">{rel.totalOverlapMonths}个月</div>
                          </div>
                        </div>

                        {/* Shared Companies */}
                        <div className="space-y-2">
                          {rel.sharedCompanies.map((sc, j) => (
                            <div key={j} className="p-3 bg-slate-50 rounded-xl">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-3.5 h-3.5 text-[#2D8FF0]" />
                                <span className="text-sm font-medium text-[#1E293B]">{sc.company}</span>
                                <span className="text-xs text-[#94A3B8]">重叠 {sc.overlapMonths}个月</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-[#475569]">
                                <span>他: {sc.positions.a || '未知'}</span>
                                <span>她: {sc.positions.b || '未知'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-[#94A3B8]">未找到关联候选人</p>
                <p className="text-xs text-[#94A3B8] mt-1">该候选人没有与其他候选人共享公司经历</p>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {/* 公司分组概览 */}
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-sm text-[#1E293B] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#2D8FF0]" />
                    公司分组概览
                  </h2>
                </div>
                {groups && groups.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {groups.map((g: any) => (
                      <div key={g.company} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-[#1E293B]">{g.company}</span>
                          <span className="text-xs px-2 py-0.5 bg-[#2D8FF0]/8 text-[#2D8FF0] rounded-full">
                            {g.candidates.length} 人
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {g.candidates.map((c: any) => (
                            <button
                              key={c.candidateId}
                              onClick={() => handleSelectCandidate(c.candidateId)}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs text-[#475569] hover:bg-[#2D8FF0]/8 hover:text-[#2D8FF0] transition-colors"
                            >
                              <Users className="w-3 h-3" />
                              {c.name}
                              <span className="text-[#94A3B8]">·</span>
                              <span className="text-[#94A3B8]">{c.position || '-'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[#94A3B8]">暂无公司关联数据</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-[#2D8FF0]/5 to-[#06D6A0]/5 rounded-2xl border border-[#2D8FF0]/15 p-6">
                <h3 className="font-semibold text-sm text-[#1E293B] mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2D8FF0]" />
                  什么是公司关联度？
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  公司关联度分析基于候选人的工作经历，自动识别在同一公司工作过的候选人群体，
                  并计算他们在职时间是否有重叠。这有助于：
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[#475569]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D8FF0]" />
                    发现内部推荐线索 — 候选人间可能互相认识
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]" />
                    验证工作经历真实性 — 时间重叠可作为交叉验证
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                    评估团队背景 — 同一公司出来的人可能有相近文化
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
