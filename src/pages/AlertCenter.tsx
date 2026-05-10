import { useState } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bell,
  Clock,
  Zap,
  Eye,
  ChevronRight,
  X,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

const alertConfig: Record<string, { icon: typeof AlertTriangle; color: string; label: string; bg: string }> = {
  risk: { icon: AlertTriangle, color: '#FF5A65', label: '高风险', bg: '#FEE2E2' },
  warning: { icon: AlertCircle, color: '#F59E0B', label: '警告', bg: '#FEF3C7' },
  info: { icon: Info, color: '#2D8FF0', label: '提醒', bg: '#DBEAFE' },
  success: { icon: CheckCircle2, color: '#06D6A0', label: '成功', bg: '#D1FAE5' },
}

export default function AlertCenter() {
  const { data: alertList = [] } = trpc.alert.list.useQuery()
  const markReadMutation = trpc.alert.markRead.useMutation()
  const utils = trpc.useUtils()
  const [filter, setFilter] = useState('全部')
  const [selectedAlert, setSelectedAlert] = useState<any>(null)

  const filtered = filter === '全部' ? alertList : alertList.filter((a: any) => a.type === filter)

  const unreadCount = alertList.filter((a: any) => !a.isRead).length
  const riskCount = alertList.filter((a: any) => a.type === 'risk').length
  const warningCount = alertList.filter((a: any) => a.type === 'warning').length

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(id, {
      onSuccess: () => utils.alert.list.invalidate(),
    })
  }

  const handleAction = (alert: any) => {
    handleMarkRead(alert.id)
    setSelectedAlert(alert)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">预警监控</h1>
          <p className="text-sm text-[#94A3B8] mt-1">AI智能预警与风险监控中心</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5A6508] rounded-lg">
            <AlertTriangle className="w-4 h-4 text-[#FF5A65]" />
            <span className="text-sm font-semibold text-[#FF5A65]">{riskCount} 高风险</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F59E0B08] rounded-lg">
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-semibold text-[#F59E0B]">{warningCount} 警告</span>
          </div>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '未读预警', value: unreadCount, icon: Bell, color: '#FF5A65' },
          { label: '人才流失风险', value: riskCount, icon: ShieldAlert, color: '#F59E0B' },
          { label: 'Offer竞对拦截', value: 3, icon: Zap, color: '#8B5CF6' },
          { label: '已处理今日', value: 8, icon: CheckCircle2, color: '#06D6A0' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}12` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span className="text-xs text-[#94A3B8]">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#1E293B] font-tabular">{stat.value}</div>
            </div>
          )
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['全部', 'risk', 'warning', 'info', 'success'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-8 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#2D8FF0] text-white'
                : 'bg-white text-[#475569] border border-slate-200/60 hover:bg-slate-50'
            }`}
          >
            {f === '全部' ? '全部' : alertConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const cfg = alertConfig[alert.type ?? 'info']
          const Icon = cfg.icon
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                !alert.isRead
                  ? alert.type === 'risk'
                    ? 'border-[#FF5A65]/30 warning-row'
                    : alert.type === 'warning'
                      ? 'border-[#F59E0B]/30'
                      : 'border-slate-200/60'
                  : 'border-slate-200/60 opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-[#1E293B]">{alert.title}</h3>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#FF5A65] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-[#475569] leading-relaxed">{alert.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {typeof alert.createdAt === 'string' ? alert.createdAt : String(alert.createdAt ?? '')}
                      </span>
                      {alert.candidateId && (
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {alert.candidateId ? `候选人#${alert.candidateId}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.isRead && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#475569] hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          标记已读
                        </button>
                      )}
                      {alert.action && (
                        <button
                          onClick={() => handleAction(alert)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                          style={{ background: cfg.color }}
                        >
                          <Zap className="w-3 h-3" />
                          {alert.action}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedAlert(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const cfg = alertConfig[selectedAlert.type ?? 'info']
                    const Icon = cfg.icon
                    return (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: cfg.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                    )
                  })()}
                  <h2 className="text-lg font-semibold text-[#1E293B]">{selectedAlert.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-[#475569] leading-relaxed mb-6">{selectedAlert.description}</p>

              {selectedAlert.candidateId && (
                <div className="p-4 bg-slate-50 rounded-xl mb-6">
                  <h3 className="text-sm font-medium text-[#1E293B] mb-2">候选人信息</h3>
                  <p className="text-sm text-[#475569]">
                    建议立即与该候选人取得联系，了解其最新求职意向，必要时调整Offer条件以提升接受概率。
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors"
                >
                  执行操作
                </button>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  稍后处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
