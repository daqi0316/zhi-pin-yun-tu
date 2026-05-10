import { useState } from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
  Video,
  Phone,
  MapPin,
  Star,
  Calendar,
} from 'lucide-react'
import { trpc } from '@/providers/trpc'

const stageColors: Record<string, { bg: string; text: string; border: string }> = {
  '初筛': { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  '一面': { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  '二面': { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' },
  '终面': { bg: '#FCE7F3', text: '#9D174D', border: '#FBCFE8' },
  '技术终面': { bg: '#FCE7F3', text: '#9D174D', border: '#FBCFE8' },
  'HR面': { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  '设计评审': { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' },
  'Offer': { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  'offer阶段': { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: '待进行', icon: Clock, color: '#F59E0B' },
  completed: { label: '已完成', icon: CheckCircle2, color: '#06D6A0' },
  cancelled: { label: '已取消', icon: XCircle, color: '#94A3B8' },
  'no-show': { label: '爽约', icon: UserX, color: '#FF5A65' },
}

const interviewTypeConfig: Record<string, { icon: typeof Phone; color: string }> = {
  '电话': { icon: Phone, color: '#2D8FF0' },
  '视频': { icon: Video, color: '#8B5CF6' },
  '现场': { icon: MapPin, color: '#06D6A0' },
}

export default function InterviewFlow() {
  const { data: interviewList = [], refetch } = trpc.interview.list.useQuery()
  const updateScoreMutation = trpc.interview.updateScore.useMutation()
  const [selectedInterview, setSelectedInterview] = useState<any>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null)

  const stages = ['初筛', '一面', '二面', '终面', 'HR面', '技术终面', '设计评审', 'offer阶段']

  const getCandidatesByStage = (stageName: string) => {
    return interviewList.filter((iv: any) => iv.stage === stageName)
  }

  const handleSaveFeedback = async () => {
    if (!selectedInterview || feedbackScore === null) return
    await updateScoreMutation.mutateAsync({
      id: selectedInterview.id,
      feedback: feedbackText,
      status: 'completed',
      ...(feedbackScore <= 5 ? {
        scoreSkill: Math.round(feedbackScore * 5 / 100),
        scoreProblem: Math.round(feedbackScore * 5 / 100),
        scoreCommunication: Math.round(feedbackScore * 5 / 100),
        scoreTeamwork: Math.round(feedbackScore * 5 / 100),
        scoreCulture: Math.round(feedbackScore * 5 / 100),
      } : {}),
    })
    await refetch()
    setSelectedInterview(null)
    setFeedbackText('')
    setFeedbackScore(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">面试流程</h1>
          <p className="text-sm text-[#94A3B8] mt-1">拖拽管理候选人面试进度</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#475569]">
            <Calendar className="w-4 h-4 text-[#94A3B8]" />
            <span>本周安排: {interviewList.filter((i: any) => i.status === 'pending').length} 场面试</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {stages.map((stageName) => {
            const stageCandidates = getCandidatesByStage(stageName)
            const colors = stageColors[stageName] || stageColors['初筛']
            return (
              <div key={stageName} className="flex-shrink-0 w-[260px]">
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  <span className="text-sm font-medium" style={{ color: colors.text }}>{stageName}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: colors.border, color: colors.text }}>
                    {stageCandidates.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {stageCandidates.map((iv: any) => {
                    const status = statusConfig[iv.status] || statusConfig['pending']
                    const StatusIcon = status.icon
                    const typeCfg = interviewTypeConfig[iv.type] || interviewTypeConfig['视频']
                    const TypeIcon = typeCfg.icon
                    return (
                      <div
                        key={iv.id}
                        className="bg-white border border-slate-200/80 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-[#2D8FF0]/20 transition-all"
                        onClick={() => setSelectedInterview(iv)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-medium">
                            {(iv.interviewer || '?').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#1E293B] truncate">候选人#{iv.candidateId}</div>
                            <div className="text-[10px] text-[#94A3B8] truncate">{iv.stage}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TypeIcon className="w-3 h-3" style={{ color: typeCfg.color }} />
                            <span className="text-[10px] text-[#94A3B8]">{iv.type || '面试'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" style={{ color: status.color }} />
                            <span className="text-[10px]" style={{ color: status.color }}>{status.label}</span>
                          </div>
                        </div>
                        <div className="mt-1.5 text-[10px] text-[#94A3B8]">{iv.scheduledTime || ''}</div>
                        {iv.totalScore && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                            <span className="text-xs font-semibold text-[#F59E0B]">{iv.totalScore}分</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-[#1E293B]">近期面试安排</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-3">面试ID</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">候选人</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">面试类型</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">面试官</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">时间</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">状态</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {interviewList.map((iv: any) => {
                const status = statusConfig[iv.status] || statusConfig['pending']
                const StatusIcon = status.icon
                return (
                  <tr key={iv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-[#475569]">#{iv.id}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-medium">
                          {iv.candidateId}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#1E293B]">候选人#{iv.candidateId}</div>
                          <div className="text-xs text-[#94A3B8]">{iv.stage}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-xs text-[#475569]">{iv.type || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#475569]">{iv.interviewer || '-'}</td>
                    <td className="px-4 py-4 text-sm text-[#475569]">{iv.scheduledTime || '-'}</td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5">
                        <StatusIcon className="w-3.5 h-3.5" style={{ color: status.color }} />
                        <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {iv.status === 'pending' && (
                        <button
                          onClick={() => setSelectedInterview(iv)}
                          className="px-2.5 py-1 bg-[#2D8FF0] text-white rounded-lg text-xs hover:bg-[#1a7de0] transition-colors"
                        >
                          填写反馈
                        </button>
                      )}
                      {iv.status === 'completed' && iv.totalScore && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-[#06D6A0]/10 text-[#06D6A0] rounded-lg text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          {iv.totalScore}分
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInterview && selectedInterview.status === 'pending' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedInterview(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-[#1E293B] mb-4">面试反馈</h2>
              <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-sm font-medium">
                  {selectedInterview.candidateId}
                </div>
                <div>
                  <div className="font-medium text-sm text-[#1E293B]">候选人#{selectedInterview.candidateId}</div>
                  <div className="text-xs text-[#94A3B8]">{selectedInterview.stage} · {selectedInterview.interviewer}</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">面试评分 (0-100)</label>
                <div className="flex gap-2">
                  {[60, 70, 80, 90, 95].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFeedbackScore(s)}
                      className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                        feedbackScore === s ? 'bg-[#2D8FF0] text-white' : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-[#1E293B] mb-2 block">评价备注</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="输入面试评价..."
                  className="w-full p-3 bg-slate-100 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveFeedback}
                  disabled={feedbackScore === null || updateScoreMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  提交反馈
                </button>
                <button
                  onClick={() => setSelectedInterview(null)}
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