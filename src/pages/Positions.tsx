import { useState } from 'react'
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  DollarSign,
  Clock,
  X,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function Positions() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [showCreate, setShowCreate] = useState(false)
  const [newPos, setNewPos] = useState({ title: '', company: '', department: '', description: '', requiredSkills: '', bonusSkills: '', minExperience: '', maxExperience: '', salaryMin: '', salaryMax: '' })

  const { data: positions = [], refetch } = trpc.position.list.useQuery({
    search: search || undefined,
    status: statusFilter !== '全部' ? statusFilter : undefined,
  })

  const createMutation = trpc.position.create.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); setNewPos({ title: '', company: '', department: '', description: '', requiredSkills: '', bonusSkills: '', minExperience: '', maxExperience: '', salaryMin: '', salaryMax: '' }) } })

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#06D6A012', text: '#06D6A0' },
    paused: { bg: '#F59E0B12', text: '#F59E0B' },
    closed: { bg: '#94A3B812', text: '#94A3B8' },
  }

  const handleCreate = () => {
    if (!newPos.title || !newPos.company) return
    createMutation.mutate({
      title: newPos.title,
      company: newPos.company,
      department: newPos.department || undefined,
      description: newPos.description || undefined,
      requiredSkills: newPos.requiredSkills ? newPos.requiredSkills.split(',').map(s => s.trim()) : undefined,
      bonusSkills: newPos.bonusSkills ? newPos.bonusSkills.split(',').map(s => s.trim()) : undefined,
      minExperience: newPos.minExperience ? Number(newPos.minExperience) : undefined,
      maxExperience: newPos.maxExperience ? Number(newPos.maxExperience) : undefined,
      salaryMin: newPos.salaryMin ? Number(newPos.salaryMin) : undefined,
      salaryMax: newPos.salaryMax ? Number(newPos.salaryMax) : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">岗位管理</h1>
          <p className="text-sm text-[#94A3B8] mt-1">JD管理 · 技能要求 · 薪资范围</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          新建岗位
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索岗位名称或公司..."
            className="w-full h-9 pl-10 pr-4 bg-white border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
          />
        </div>
        <div className="flex gap-2">
          {['全部', 'active', 'paused', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-[#2D8FF0] text-white' : 'bg-white border border-slate-200/60 text-[#475569] hover:bg-slate-50'
              }`}
            >
              {s === 'active' ? '招聘中' : s === 'paused' ? '暂停' : s === 'closed' ? '已关闭' : '全部'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {positions.map((pos: any) => {
          const requiredSkills: string[] = typeof pos.requiredSkills === 'string' ? JSON.parse(pos.requiredSkills || '[]') : (pos.requiredSkills || [])
          const colors = statusColors[pos.status] || statusColors['active']
          return (
            <div key={pos.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-slate-200/40 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#1E293B] truncate">{pos.title}</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{pos.company}{pos.department ? ` · ${pos.department}` : ''}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ml-2" style={{ background: colors.bg, color: colors.text }}>
                  {pos.status === 'active' ? '招聘中' : pos.status === 'paused' ? '暂停' : '已关闭'}
                </span>
              </div>

              {pos.description && (
                <p className="text-xs text-[#475569] line-clamp-2 mb-3">{pos.description}</p>
              )}

              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {requiredSkills.slice(0, 5).map((skill: string) => (
                    <span key={skill} className="px-2 py-0.5 bg-[#2D8FF0]/8 text-[#2D8FF0] rounded text-[10px] font-medium">{skill}</span>
                  ))}
                  {requiredSkills.length > 5 && <span className="text-[10px] text-[#94A3B8]">+{requiredSkills.length - 5}</span>}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                {(pos.minExperience != null || pos.maxExperience != null) && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pos.minExperience ?? 0}-{pos.maxExperience ?? '?'}年</span>
                )}
                {(pos.salaryMin != null || pos.salaryMax != null) && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{(pos.salaryMin ?? 0) / 1000}k-{(pos.salaryMax ?? 0) / 1000}k</span>
                )}
                {(pos as any).location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(pos as any).location}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#94A3B8]">暂无岗位，点击右上角创建新岗位</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[560px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">新建岗位</h2>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">岗位名称 *</label>
                  <input value={newPos.title} onChange={(e) => setNewPos({ ...newPos, title: e.target.value })} placeholder="如：高级Java工程师" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">所属公司 *</label>
                  <input value={newPos.company} onChange={(e) => setNewPos({ ...newPos, company: e.target.value })} placeholder="如：字节跳动" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">部门</label>
                  <input value={newPos.department} onChange={(e) => setNewPos({ ...newPos, department: e.target.value })} placeholder="如：技术部" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">岗位描述</label>
                  <textarea value={newPos.description} onChange={(e) => setNewPos({ ...newPos, description: e.target.value })} rows={3} placeholder="JD 详细描述..." className="w-full p-3 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 resize-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">必备技能（逗号分隔）</label>
                  <input value={newPos.requiredSkills} onChange={(e) => setNewPos({ ...newPos, requiredSkills: e.target.value })} placeholder="Java, Spring Cloud, Redis" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">加分技能（逗号分隔）</label>
                  <input value={newPos.bonusSkills} onChange={(e) => setNewPos({ ...newPos, bonusSkills: e.target.value })} placeholder="Docker, Kubernetes" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">最低经验（年）</label>
                    <input type="number" value={newPos.minExperience} onChange={(e) => setNewPos({ ...newPos, minExperience: e.target.value })} placeholder="3" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">最高经验（年）</label>
                    <input type="number" value={newPos.maxExperience} onChange={(e) => setNewPos({ ...newPos, maxExperience: e.target.value })} placeholder="5" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">最低月薪（元）</label>
                    <input type="number" value={newPos.salaryMin} onChange={(e) => setNewPos({ ...newPos, salaryMin: e.target.value })} placeholder="40000" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">最高月薪（元）</label>
                    <input type="number" value={newPos.salaryMax} onChange={(e) => setNewPos({ ...newPos, salaryMax: e.target.value })} placeholder="55000" className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={!newPos.title || !newPos.company || createMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? '创建中...' : '创建岗位'}
                </button>
                <button onClick={() => setShowCreate(false)} className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}