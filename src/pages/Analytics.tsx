import { useRef, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

const weeklyData = [
  { week: 'W1', applications: 120, interviews: 35, offers: 8 },
  { week: 'W2', applications: 145, interviews: 42, offers: 10 },
  { week: 'W3', applications: 98, interviews: 28, offers: 6 },
  { week: 'W4', applications: 167, interviews: 55, offers: 12 },
  { week: 'W5', applications: 132, interviews: 48, offers: 9 },
  { week: 'W6', applications: 189, interviews: 62, offers: 15 },
  { week: 'W7', applications: 156, interviews: 50, offers: 11 },
  { week: 'W8', applications: 203, interviews: 70, offers: 18 },
]

const positionStats = [
  { position: '高级Java工程师', applicants: 89, matches: 23, conversion: 25.8, avgDays: 28 },
  { position: '产品经理', applicants: 67, matches: 18, conversion: 26.9, avgDays: 22 },
  { position: '前端技术专家', applicants: 54, matches: 15, conversion: 27.8, avgDays: 25 },
  { position: '算法工程师', applicants: 45, matches: 12, conversion: 26.7, avgDays: 32 },
  { position: 'UI/UX设计师', applicants: 76, matches: 19, conversion: 25.0, avgDays: 20 },
]

function LineChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = 800
    const h = 280
    canvas.width = w * 2
    canvas.height = h * 2
    ctx.scale(2, 2)
    ctx.clearRect(0, 0, w, h)

    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    const maxVal = Math.max(...weeklyData.flatMap((d) => [d.applications, d.interviews, d.offers]))
    const xStep = chartW / (weeklyData.length - 1)

    ctx.strokeStyle = '#F1F5F9'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()
      ctx.fillStyle = '#94A3B8'
      ctx.font = '11px "Inter", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), padding.left - 8, y + 4)
    }

    ctx.textAlign = 'center'
    weeklyData.forEach((d, i) => {
      const x = padding.left + i * xStep
      ctx.fillStyle = '#94A3B8'
      ctx.font = '11px "Inter", sans-serif'
      ctx.fillText(d.week, x, h - 12)
    })

    const lines = [
      { key: 'applications' as const, color: '#2D8FF0', label: '投递量' },
      { key: 'interviews' as const, color: '#8B5CF6', label: '面试量' },
      { key: 'offers' as const, color: '#06D6A0', label: 'Offer数' },
    ]

    lines.forEach((line) => {
      ctx.beginPath()
      ctx.strokeStyle = line.color
      ctx.lineWidth = 2.5
      weeklyData.forEach((d, i) => {
        const x = padding.left + i * xStep
        const y = padding.top + chartH - (d[line.key] / maxVal) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      weeklyData.forEach((d, i) => {
        const x = padding.left + i * xStep
        const y = padding.top + chartH - (d[line.key] / maxVal) * chartH
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = line.color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    })

    const legendX = padding.left
    const legendY = 8
    lines.forEach((line, i) => {
      const lx = legendX + i * 80
      ctx.beginPath()
      ctx.strokeStyle = line.color
      ctx.lineWidth = 2
      ctx.moveTo(lx, legendY)
      ctx.lineTo(lx + 16, legendY)
      ctx.stroke()
      ctx.fillStyle = '#475569'
      ctx.font = '11px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(line.label, lx + 20, legendY + 4)
    })
  }, [])

  return <canvas ref={canvasRef} className="w-full" style={{ maxWidth: 800, height: 280 }} />
}

function FunnelChart() {
  const data = [
    { label: '投递', value: 1080, color: '#2D8FF0' },
    { label: '初筛通过', value: 324, color: '#3B9BF5' },
    { label: '进入面试', value: 186, color: '#5BAFF8' },
    { label: '通过面试', value: 95, color: '#7BC3FB' },
    { label: '收到Offer', value: 62, color: '#9BD7FE' },
    { label: '成功入职', value: 42, color: '#06D6A0' },
  ]

  const maxVal = data[0].value

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const width = (item.value / maxVal) * 100
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8] w-16 text-right">{item.label}</span>
            <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                style={{ width: `${width}%`, background: item.color }}
              >
                <span className="text-xs font-semibold text-white">{item.value}</span>
              </div>
              {i < data.length - 1 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8]">
                  {((data[i + 1].value / item.value) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Analytics() {
  const { data: channelsData = [] } = trpc.channel.list.useQuery()
  const channelsList = channelsData as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">数据分析</h1>
          <p className="text-sm text-[#94A3B8] mt-1">全维度招聘数据洞察</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 bg-white border border-slate-200/60 rounded-xl text-sm text-[#475569] hover:bg-slate-50 transition-colors">
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '本月投递量', value: 1, suffix: '080', change: '+18.5%', icon: Users, color: '#2D8FF0' },
          { label: '面试转化率', value: '17.2', suffix: '%', change: '+2.3%', icon: Target, color: '#06D6A0' },
          { label: '平均招聘周期', value: 26, suffix: '天', change: '-3天', icon: Clock, color: '#F59E0B' },
          { label: 'Offer接受率', value: '67.7', suffix: '%', change: '+5.8%', icon: TrendingUp, color: '#8B5CF6' },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}12` }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <span className="text-xs text-[#94A3B8]">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1E293B] font-tabular">
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                </span>
                <span className="text-sm text-[#94A3B8]">{kpi.suffix}</span>
              </div>
              <span className="text-xs font-medium mt-1 inline-block" style={{ color: kpi.change.startsWith('+') ? '#06D6A0' : '#FF5A65' }}>
                {kpi.change} 环比
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1E293B] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2D8FF0]" />
              招聘趋势
            </h2>
            <div className="flex items-center gap-2">
              <button className="h-7 px-3 bg-[#2D8FF0] text-white rounded-lg text-xs">近8周</button>
              <button className="h-7 px-3 bg-slate-100 text-[#475569] rounded-lg text-xs">近3月</button>
              <button className="h-7 px-3 bg-slate-100 text-[#475569] rounded-lg text-xs">近1年</button>
            </div>
          </div>
          <LineChart />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <h2 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2D8FF0]" />
            转化漏斗
          </h2>
          <FunnelChart />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-[#1E293B] flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#2D8FF0]" />
            岗位招聘效率
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-3">岗位</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">投递人数</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">匹配人数</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">转化率</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">平均招聘周期</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">趋势</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {positionStats.map((pos) => (
                <tr key={pos.position} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#1E293B]">{pos.position}</td>
                  <td className="px-4 py-4 text-sm text-[#475569] font-tabular">{pos.applicants}</td>
                  <td className="px-4 py-4 text-sm text-[#475569] font-tabular">{pos.matches}</td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold" style={{ color: pos.conversion >= 26 ? '#06D6A0' : '#2D8FF0' }}>
                      {pos.conversion}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#475569] font-tabular">{pos.avgDays}天</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#06D6A0]" />
                      <span className="text-xs text-[#06D6A0]">+5.2%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <h2 className="font-semibold text-[#1E293B] mb-4">渠道效率对比</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {channelsList.map((ch: any) => (
            <div key={ch.id} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-sm font-semibold text-[#1E293B] mb-2">{ch.name}</div>
              <div className="h-24 flex items-end justify-center gap-1">
                {[
                  { label: '投递', value: ch.applications || 0, color: '#2D8FF0' },
                  { label: '面试', value: ch.interviews || 0, color: '#8B5CF6' },
                  { label: 'Offer', value: ch.offers || 0, color: '#06D6A0' },
                ].map((bar) => (
                  <div key={bar.label} className="flex flex-col items-center gap-1">
                    <div
                      className="w-6 rounded-t-md transition-all"
                      style={{
                        height: `${(bar.value / Math.max(ch.applications || 1, 1)) * 80}px`,
                        background: bar.color,
                      }}
                    />
                    <span className="text-[9px] text-[#94A3B8]">{bar.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-[#94A3B8]">
                转化率 <span className="font-semibold text-[#1E293B]">{ch.conversionRate || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}