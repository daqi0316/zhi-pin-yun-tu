import { useState } from 'react'
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Heart,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

const statusOptions = ['全部', '在职-考虑机会', '在职-积极求职', '离职-随时到岗']
const stageOptions = ['全部', '初筛', '一面', '二面', '终面', 'offer阶段']
const sourceOptions = ['全部', '猎头推荐', '内推', '主动投递', 'LinkedIn', 'Boss直聘']

interface CandidateDetail {
  id: number
  name: string
  avatar: string | null
  position: string | null
  company: string | null
  experience: number | null
  skills: string[]
  education: string | null
  status: string | null
  matchScore: number | null
  intentScore: number | null
  source: string | null
  phone: string | null
  email: string | null
  location: string | null
  salary: string | null
  stage: string | null
}

export default function TalentPool() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [stageFilter, setStageFilter] = useState('全部')
  const [sourceFilter, setSourceFilter] = useState('全部')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null)

  const { data, isLoading } = trpc.candidate.list.useQuery({
    search: search || undefined,
    status: statusFilter !== '全部' ? statusFilter : undefined,
    stage: stageFilter !== '全部' ? stageFilter : undefined,
    source: sourceFilter !== '全部' ? sourceFilter : undefined,
  })

  const candidates = data?.items ?? []

  const getMatchColor = (score: number | null) => {
    if (!score) return '#94A3B8'
    if (score >= 90) return '#06D6A0'
    if (score >= 80) return '#2D8FF0'
    return '#F59E0B'
  }

  const getStageColor = (stage: string | null) => {
    const s = stage || ''
    if (s === 'offer阶段') return { bg: '#06D6A012', text: '#06D6A0' }
    if (s === '终面') return { bg: '#2D8FF012', text: '#2D8FF0' }
    if (s === '二面') return { bg: '#8B5CF612', text: '#8B5CF6' }
    return { bg: '#F59E0B12', text: '#F59E0B' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">人才库</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            共 {data?.total ?? 0} 位候选人 · 本页 {candidates.length} 位
          </p>
        </div>
        <button className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors">
          + 新增候选人
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名、职位、技能..."
              className="w-full h-9 pl-10 pr-4 bg-slate-100/80 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
            />
          </div>
          {[
            { label: '求职状态', value: statusFilter, set: setStatusFilter, options: statusOptions },
            { label: '招聘阶段', value: stageFilter, set: setStageFilter, options: stageOptions },
            { label: '来源渠道', value: sourceFilter, set: setSourceFilter, options: sourceOptions },
          ].map((f) => (
            <div key={f.label} className="relative">
              <select
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="h-9 pl-3 pr-8 bg-slate-100/80 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 appearance-none cursor-pointer"
              >
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {f.label}: {o}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          ))}
          <button className="h-9 px-3 flex items-center gap-1.5 bg-slate-100/80 rounded-xl text-sm text-[#475569] hover:bg-slate-200/60 transition-colors">
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <div className="w-8 h-8 border-2 border-[#2D8FF0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#94A3B8]">加载中...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-3">候选人</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">技能</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">匹配度</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">来源</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">阶段</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCandidate({
                      id: c.id,
                      name: c.name,
                      avatar: c.avatar,
                      position: c.position,
                      company: c.company,
                      experience: c.experience,
                      skills: Array.isArray(c.skills) ? c.skills : [],
                      education: c.education,
                      status: c.status,
                      matchScore: c.matchScore,
                      intentScore: c.intentScore,
                      source: c.source,
                      phone: c.phone,
                      email: c.email,
                      location: c.location,
                      salary: c.salary,
                      stage: c.stage,
                    })}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-sm font-semibold">
                          {c.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-[#1E293B]">{c.name}</div>
                          <div className="text-xs text-[#94A3B8]">{c.position} · {c.experience}年</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(c.skills) ? c.skills : []).slice(0, 3).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-100 rounded-md text-xs text-[#475569]">
                            {s}
                          </span>
                        ))}
                        {(Array.isArray(c.skills) ? c.skills : []).length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-[#94A3B8]">
                            +{(c.skills as string[]).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${c.matchScore || 0}%`,
                              background: getMatchColor(c.matchScore),
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: getMatchColor(c.matchScore) }}>
                          {c.matchScore || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#475569]">{c.source}</td>
                    <td className="px-4 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: getStageColor(c.stage).bg,
                          color: getStageColor(c.stage).text,
                        }}
                      >
                        {c.stage}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors" title="收藏">
                          <Heart className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors" title="沟通">
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors" title="星标">
                          <Star className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedCandidate(null)} />
          <div className="relative w-[480px] h-full bg-white shadow-2xl overflow-y-auto custom-scrollbar">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">候选人详情</h2>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-2xl font-bold">
                  {selectedCandidate.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">{selectedCandidate.name}</h3>
                  <p className="text-sm text-[#475569]">{selectedCandidate.position}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8]">
                    <Briefcase className="w-3 h-3" />
                    {selectedCandidate.company}
                    <MapPin className="w-3 h-3 ml-1" />
                    {selectedCandidate.location}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-[#94A3B8]">AI匹配度</div>
                  <div className="text-xl font-bold" style={{ color: getMatchColor(selectedCandidate.matchScore) }}>
                    {selectedCandidate.matchScore ?? '-'}%
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-[#94A3B8]">求职意向</div>
                  <div className="text-xl font-bold" style={{ color: selectedCandidate.intentScore && selectedCandidate.intentScore >= 85 ? '#06D6A0' : '#2D8FF0' }}>
                    {selectedCandidate.intentScore ?? '-'}%
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-[#94A3B8]">期望薪资</div>
                  <div className="text-lg font-bold text-[#1E293B]">{selectedCandidate.salary || '面议'}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-[#94A3B8]">当前状态</div>
                  <div className="text-sm font-medium text-[#1E293B]">{selectedCandidate.status}</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-[#1E293B] mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#2D8FF0]" />
                  教育背景
                </h4>
                <p className="text-sm text-[#475569]">{selectedCandidate.education || '未提供'}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-[#1E293B] mb-2">技能标签</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((s) => (
                    <span key={s} className="px-3 py-1.5 bg-[#2D8FF0]/8 text-[#2D8FF0] rounded-lg text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-[#1E293B] mb-2">联系方式</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#475569]">
                    <span className="text-[#94A3B8]">电话:</span> {selectedCandidate.phone || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-[#475569]">
                    <span className="text-[#94A3B8]">邮箱:</span> {selectedCandidate.email || '-'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors">
                  安排面试
                </button>
                <button className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  发送消息
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
