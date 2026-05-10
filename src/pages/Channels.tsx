import { useEffect, useState } from 'react'
import {
  TrendingUp,
  Users,
  MousePointerClick,
  DollarSign,
  Play,
  Pause,
  Settings,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

export default function Channels() {
  const { data: channelsData } = trpc.channel.list.useQuery()
  const [channelList, setChannelList] = useState<any[]>([])

  useEffect(() => {
    if (channelsData) {
      setChannelList(channelsData as any[])
    }
  }, [channelsData])

  const toggleStatus = (id: number) => {
    setChannelList((prev) =>
      prev.map((ch: any) =>
        ch.id === id
          ? { ...ch, status: ch.status === 'active' ? 'paused' : 'active' }
          : ch
      )
    )
  }

  const totalApplications = channelList.reduce((s: number, c: any) => s + (c.applications || 0), 0)
  const totalOffers = channelList.reduce((s: number, c: any) => s + (c.offers || 0), 0)
  const avgConversion = totalApplications > 0 ? (totalOffers / totalApplications * 100).toFixed(1) : '0'
  const totalCost = channelList.reduce((s: number, c: any) => s + (c.cost || 0), 0)
  const avgRoi = channelList.length > 0 ? (channelList.reduce((s: number, c: any) => s + (c.roi || 0), 0) / channelList.length).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">渠道管理</h1>
          <p className="text-sm text-[#94A3B8] mt-1">全渠道数据监控与效率分析</p>
        </div>
        <button className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors">
          + 新增渠道
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总投递量', value: totalApplications, icon: Users, color: '#2D8FF0', change: '+15.2%' },
          { label: '总Offer数', value: totalOffers, icon: MousePointerClick, color: '#06D6A0', change: '+8.7%' },
          { label: '平均转化率', value: `${avgConversion}%`, icon: TrendingUp, color: '#F59E0B', change: '-1.3%' },
          { label: '渠道总投入', value: `¥${(totalCost / 10000).toFixed(1)}万`, icon: DollarSign, color: '#8B5CF6', change: `ROI ${avgRoi}` },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-200/60">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}12` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: stat.change.startsWith('+') ? '#06D6A0' : stat.change.startsWith('-') ? '#FF5A65' : '#2D8FF0' }}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-[#1E293B] font-tabular">{stat.value}</div>
              <div className="text-xs text-[#94A3B8] mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {channelList.map((ch: any) => (
          <div
            key={ch.id}
            className={`bg-white rounded-2xl border border-slate-200/60 p-5 transition-all hover:shadow-lg hover:shadow-slate-200/50 ${
              ch.status !== 'active' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: ch.status === 'active' ? '#2D8FF0' : '#94A3B8' }}
                >
                  {ch.name?.slice(0, 1) || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#1E293B]">{ch.name}</h3>
                  <span className="text-xs text-[#94A3B8]">{ch.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStatus(ch.id)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                  title={ch.status === 'active' ? '暂停' : '启动'}
                >
                  {ch.status === 'active' ? (
                    <Pause className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-[#06D6A0]" />
                  )}
                </button>
                <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="w-full h-[60px] mb-4 rounded-lg bg-slate-50 flex items-center justify-center">
              <span className="text-xs text-[#94A3B8]">趋势暂无</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-sm font-semibold text-[#1E293B] font-tabular">{ch.applications || 0}</div>
                <div className="text-[10px] text-[#94A3B8]">投递量</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-[#1E293B] font-tabular">{ch.conversionRate || 0}%</div>
                <div className="text-[10px] text-[#94A3B8]">转化率</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold" style={{ color: (ch.roi || 0) >= 3 ? '#06D6A0' : (ch.roi || 0) >= 2 ? '#2D8FF0' : '#F59E0B' }}>
                  {ch.roi || 0}
                </div>
                <div className="text-[10px] text-[#94A3B8]">ROI</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-[#94A3B8]">投入 ¥{((ch.cost || 0) / 10000).toFixed(1)}万</span>
              <span className={`text-xs font-medium ${ch.status === 'active' ? 'text-[#06D6A0]' : 'text-[#94A3B8]'}`}>
                {ch.status === 'active' ? '运行中' : '已暂停'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}