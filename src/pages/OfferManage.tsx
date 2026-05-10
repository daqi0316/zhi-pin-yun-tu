import { useState } from 'react'
import {
  FileCheck,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#94A3B8', bg: '#F1F5F9' },
  sent: { label: '已发送', color: '#2D8FF0', bg: '#DBEAFE' },
  negotiating: { label: '谈判中', color: '#F59E0B', bg: '#FEF3C7' },
  accepted: { label: '已接受', color: '#06D6A0', bg: '#D1FAE5' },
  rejected: { label: '已拒绝', color: '#FF5A65', bg: '#FEE2E2' },
  expired: { label: '已过期', color: '#94A3B8', bg: '#F1F5F9' },
}

export default function OfferManage() {
  const { data: offersData = [], refetch } = trpc.offer.list.useQuery()
  const updateOffer = trpc.offer.update.useMutation()
  const offerList = offersData as any[]
  const [statusFilter, setStatusFilter] = useState('全部')
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null)
  const [showNegotiate, setShowNegotiate] = useState(false)

  const filtered = statusFilter === '全部' ? offerList : offerList.filter((o: any) => o.status === statusFilter)

  const stats = {
    total: offerList.length,
    sent: offerList.filter((o: any) => o.status === 'sent').length,
    negotiating: offerList.filter((o: any) => o.status === 'negotiating').length,
    accepted: offerList.filter((o: any) => o.status === 'accepted').length,
    avgAcceptance: offerList.length > 0 ? Math.round(offerList.reduce((s: number, o: any) => s + (o.acceptanceProbability || 0), 0) / offerList.length) : 0,
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateOffer.mutateAsync({ id, data: { status: newStatus } })
    await refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Offer管理</h1>
          <p className="text-sm text-[#94A3B8] mt-1">全链路Offer跟踪与谈判管理</p>
        </div>
        <button className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors">
          + 新建Offer
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Offer总数', value: stats.total, icon: FileCheck, color: '#2D8FF0' },
          { label: '已发送', value: stats.sent, icon: Send, color: '#8B5CF6' },
          { label: '谈判中', value: stats.negotiating, icon: MessageSquare, color: '#F59E0B' },
          { label: '已接受', value: stats.accepted, icon: CheckCircle2, color: '#06D6A0' },
          { label: '平均接受率', value: `${stats.avgAcceptance}%`, icon: TrendingUp, color: '#EC4899' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-xs text-[#94A3B8]">{s.label}</span>
              </div>
              <div className="text-xl font-bold text-[#1E293B] font-tabular">{s.value}</div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        {['全部', 'draft', 'sent', 'negotiating', 'accepted', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`h-8 px-4 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[#2D8FF0] text-white'
                : 'bg-white text-[#475569] border border-slate-200/60 hover:bg-slate-50'
            }`}
          >
            {s === '全部' ? '全部' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((offer: any) => {
          const cfg = statusConfig[offer.status]
          return (
            <div
              key={offer.id}
              className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={offer.candidateAvatar || '/images/avatar1.jpg'} alt={offer.candidateName || ''} className="w-11 h-11 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-semibold text-sm text-[#1E293B]">{offer.candidateName || '候选人'}</h3>
                    <p className="text-xs text-[#94A3B8]">{offer.position || '-'}</p>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: cfg?.bg, color: cfg?.color }}
                >
                  {cfg?.label || offer.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <div className="text-sm font-semibold text-[#1E293B]">{((offer.baseSalary || 0) / 1000).toFixed(0)}K</div>
                  <div className="text-[10px] text-[#94A3B8]">基本月薪</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <div className="text-sm font-semibold text-[#1E293B]">{offer.bonus || 0}个月</div>
                  <div className="text-[10px] text-[#94A3B8]">年终奖</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <div className="text-sm font-semibold text-[#1E293B]">{((offer.totalPackage || 0) / 10000).toFixed(0)}万</div>
                  <div className="text-[10px] text-[#94A3B8]">年薪包</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#94A3B8]">接受概率预测</span>
                  <span
                    className="font-semibold"
                    style={{
                      color: (offer.acceptanceProbability || 0) >= 80 ? '#06D6A0' : (offer.acceptanceProbability || 0) >= 60 ? '#2D8FF0' : '#FF5A65',
                    }}
                  >
                    {offer.acceptanceProbability || 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${offer.acceptanceProbability || 0}%`,
                      background:
                        (offer.acceptanceProbability || 0) >= 80
                          ? '#06D6A0'
                          : (offer.acceptanceProbability || 0) >= 60
                            ? '#2D8FF0'
                            : '#FF5A65',
                    }}
                  />
                </div>
                {(offer.competitorOffers || 0) > 0 && (
                  <p className="text-xs text-[#FF5A65] mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    该候选人有{offer.competitorOffers || 0}个竞对Offer
                  </p>
                )}
              </div>

              {offer.sentDate && (
                <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    发送于 {offer.sentDate}
                  </span>
                  {offer.deadline && (
                    <span className="flex items-center gap-1">
                      截止 {offer.deadline}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {offer.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange(offer.id, 'sent')}
                    className="flex-1 h-9 bg-[#2D8FF0] text-white rounded-lg text-xs font-medium hover:bg-[#1a7de0] transition-colors"
                  >
                    发送Offer
                  </button>
                )}
                {offer.status === 'sent' && (
                  <>
                    <button
                      onClick={() => { setSelectedOffer(offer); setShowNegotiate(true) }}
                      className="flex-1 h-9 bg-[#F59E0B] text-white rounded-lg text-xs font-medium hover:bg-[#d97706] transition-colors"
                    >
                      进入谈判
                    </button>
                    <button
                      onClick={() => handleStatusChange(offer.id, 'accepted')}
                      className="flex-1 h-9 bg-[#06D6A0] text-white rounded-lg text-xs font-medium hover:bg-[#059669] transition-colors"
                    >
                      已接受
                    </button>
                  </>
                )}
                {offer.status === 'negotiating' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(offer.id, 'accepted')}
                      className="flex-1 h-9 bg-[#06D6A0] text-white rounded-lg text-xs font-medium hover:bg-[#059669] transition-colors"
                    >
                      确认接受
                    </button>
                    <button
                      onClick={() => handleStatusChange(offer.id, 'rejected')}
                      className="h-9 px-3 border border-slate-200 text-[#475569] rounded-lg text-xs hover:bg-slate-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {(offer.status === 'accepted' || offer.status === 'rejected') && (
                  <button className="flex-1 h-9 bg-slate-100 text-[#94A3B8] rounded-lg text-xs font-medium cursor-default">
                    {offer.status === 'accepted' ? '已关闭 - 接受' : '已关闭 - 拒绝'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showNegotiate && selectedOffer && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowNegotiate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px]">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Offer谈判</h2>
              <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-xl">
                <img src={selectedOffer?.candidateAvatar || '/images/avatar1.jpg'} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-medium text-sm text-[#1E293B]">{selectedOffer?.candidateName || '候选人'}</div>
                  <div className="text-xs text-[#94A3B8]">当前接受概率: {selectedOffer?.acceptanceProbability ?? 0}%</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">调整基本月薪</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={30000}
                      max={80000}
                      step={1000}
                      defaultValue={selectedOffer?.baseSalary ?? 0}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold text-[#1E293B] w-16 text-right">
                      {((selectedOffer?.baseSalary ?? 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">调整年终奖</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={0.5}
                      defaultValue={selectedOffer?.bonus ?? 0}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold text-[#1E293B] w-16 text-right">
                      {selectedOffer?.bonus ?? 0}个月
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">谈判备注</label>
                  <textarea
                    rows={3}
                    placeholder="记录谈判要点..."
                    className="w-full p-3 bg-slate-100 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { handleStatusChange(selectedOffer.id, 'negotiating'); setShowNegotiate(false) }}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors"
                >
                  保存谈判记录
                </button>
                <button
                  onClick={() => setShowNegotiate(false)}
                  className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}