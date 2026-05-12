import { useState, useCallback } from "react";
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
  ChevronRight,
  Plus,
  X,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const stageColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  初筛: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
  一面: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  二面: { bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" },
  终面: { bg: "#FCE7F3", text: "#9D174D", border: "#FBCFE8" },
  技术终面: { bg: "#FCE7F3", text: "#9D174D", border: "#FBCFE8" },
  HR面: { bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" },
  设计评审: { bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" },
  Offer: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
  offer阶段: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
};

const statusConfig: Record<
  string,
  { label: string; icon: typeof Clock; color: string }
> = {
  pending: { label: "待进行", icon: Clock, color: "#F59E0B" },
  completed: { label: "已完成", icon: CheckCircle2, color: "#06D6A0" },
  cancelled: { label: "已取消", icon: XCircle, color: "#94A3B8" },
  "no-show": { label: "爽约", icon: UserX, color: "#FF5A65" },
};

const interviewTypeConfig: Record<
  string,
  { icon: typeof Phone; color: string }
> = {
  电话: { icon: Phone, color: "#2D8FF0" },
  视频: { icon: Video, color: "#8B5CF6" },
  现场: { icon: MapPin, color: "#06D6A0" },
};

type BarsDimension = {
  key: string;
  label: string;
  weight: number;
  descriptions: string[];
};

const barsDimensions: BarsDimension[] = [
  {
    key: "scoreSkill",
    label: "专业技能",
    weight: 30,
    descriptions: [
      "几乎不具备岗位要求的核心技能",
      "技能基础薄弱，仅停留在理论层面",
      "具备基本技能，能完成常规任务，但深度不足",
      "熟练掌握核心技能，能独立完成复杂任务",
      "对核心技能有深度理解，能回答原理性问题，有实际项目落地经验",
    ],
  },
  {
    key: "scoreProblem",
    label: "问题解决",
    weight: 20,
    descriptions: [
      "面对问题无从下手，缺乏逻辑思维",
      "只能按照既定流程解决问题，缺乏独立判断",
      "能解决常规问题，但面对复杂问题缺乏系统性",
      "能快速定位问题核心，给出合理的解决路径",
      "能系统性地拆解复杂问题，提出多套方案并权衡优劣",
    ],
  },
  {
    key: "scoreCommunication",
    label: "沟通表达",
    weight: 20,
    descriptions: [
      "沟通困难，难以理解其意图",
      "表达混乱，抓不住重点",
      "表达基本清楚，偶尔需要追问才能理解要点",
      "表达流畅，逻辑清晰，能有效传递信息",
      "表达清晰有条理，能根据听众调整表达方式，善于说服和推动",
    ],
  },
  {
    key: "scoreTeamwork",
    label: "团队协作",
    weight: 15,
    descriptions: [
      "无法融入团队，有协作冲突历史",
      "合作意识薄弱，倾向于单打独斗",
      "能完成自己分内工作，但较少主动协作",
      "良好合作者，能配合团队完成任务",
      "善于跨团队协作，能主动补位，推动团队目标达成",
    ],
  },
  {
    key: "scoreCulture",
    label: "文化匹配",
    weight: 15,
    descriptions: [
      "明显不匹配（如只看重薪资、对公司业务缺乏认同）",
      "存在一定价值观差异或动机不纯",
      "无明显冲突，但匹配度一般",
      "价值观基本一致，求职动机合理",
      "价值观高度契合，对行业有热情，职业规划与公司方向一致",
    ],
  },
];

function BarsScoreInput({
  dimension,
  value,
  onChange,
}: {
  dimension: BarsDimension;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1E293B]">
          {dimension.label}
        </span>
        <span className="text-xs text-[#94A3B8] font-medium">
          权重 {dimension.weight}%
        </span>
      </div>
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all ${
              value === score
                ? "bg-[#2D8FF0] text-white shadow-md shadow-[#2D8FF0]/30"
                : "bg-slate-100 text-[#475569] hover:bg-slate-200"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      {value > 0 && (
        <div className="px-3 py-2 bg-[#2D8FF0]/5 border border-[#2D8FF0]/10 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#2D8FF0] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {value}
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {dimension.descriptions[value - 1]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function BarsResultSummary({ scores }: { scores: Record<string, number> }) {
  const weights: Record<string, number> = {
    scoreSkill: 0.3,
    scoreProblem: 0.2,
    scoreCommunication: 0.2,
    scoreTeamwork: 0.15,
    scoreCulture: 0.15,
  };
  const total = Object.entries(weights).reduce(
    (sum, [key, w]) => sum + (scores[key] || 0) * w,
    0
  );
  const percentage = Math.round((total * 100) / 5);
  const grade =
    percentage >= 90
      ? "S"
      : percentage >= 75
        ? "A"
        : percentage >= 60
          ? "B"
          : percentage >= 40
            ? "C"
            : "D";
  const gradeColor: Record<string, string> = {
    S: "#06D6A0",
    A: "#2D8FF0",
    B: "#F59E0B",
    C: "#FF5A65",
    D: "#94A3B8",
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1E293B]">综合评分</h3>
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-bold"
            style={{ color: gradeColor[grade] }}
          >
            {percentage}
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: gradeColor[grade] + "20",
              color: gradeColor[grade],
            }}
          >
            {grade}级
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {barsDimensions.map(dim => {
          const score = scores[dim.key] || 0;
          const pct = score * 20;
          return (
            <div key={dim.key} className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8] w-16 text-right flex-shrink-0">
                {dim.label}
              </span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #2D8FF0, #06D6A0)`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-[#475569] w-6">
                {score}/5
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#94A3B8] mt-2">
        面试得分 = 专业技能×30% + 问题解决×20% + 沟通表达×20% + 团队协作×15% +
        文化匹配×15%
      </p>
    </div>
  );
}

export default function InterviewFlow() {
  const { data: interviewList = [], refetch } = trpc.interview.list.useQuery();
  const updateScoreMutation = trpc.interview.updateScore.useMutation();
  const generateFeedbackMutation =
    trpc.ai.interview.generateFeedback.useMutation();
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [barsScores, setBarsScores] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState("");
  const [showBars, setShowBars] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newInterview, setNewInterview] = useState({
    candidateId: "",
    positionId: "",
    stage: "初筛",
    interviewer: "",
    scheduledTime: new Date().toISOString().slice(0, 16),
    type: "视频",
  });

  const createMutation = trpc.interview.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreate(false);
      setNewInterview({
        candidateId: "",
        positionId: "",
        stage: "初筛",
        interviewer: "",
        scheduledTime: new Date().toISOString().slice(0, 16),
        type: "视频",
      });
    },
  });
  const deleteMutation = trpc.interview.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleCreate = () => {
    if (!newInterview.candidateId) return;
    createMutation.mutate({
      candidateId: Number(newInterview.candidateId),
      positionId: newInterview.positionId
        ? Number(newInterview.positionId)
        : undefined,
      stage: newInterview.stage,
      interviewer: newInterview.interviewer || undefined,
      scheduledTime: newInterview.scheduledTime || undefined,
      type: newInterview.type,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定删除该面试记录？此操作不可恢复。")) {
      deleteMutation.mutate(id);
    }
  };

  const stages = [
    "初筛",
    "一面",
    "二面",
    "终面",
    "HR面",
    "技术终面",
    "设计评审",
    "offer阶段",
  ];

  const getCandidatesByStage = (stageName: string) => {
    return interviewList.filter((iv: any) => iv.stage === stageName);
  };

  const handleScoreChange = useCallback((key: string, value: number) => {
    setBarsScores(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveBars = async () => {
    if (!selectedInterview) return;
    const allScored = barsDimensions.every(d => barsScores[d.key] > 0);
    if (!allScored) return;
    await updateScoreMutation.mutateAsync({
      id: selectedInterview.id,
      feedback: feedbackText || undefined,
      status: "completed",
      scoreSkill: barsScores.scoreSkill,
      scoreProblem: barsScores.scoreProblem,
      scoreCommunication: barsScores.scoreCommunication,
      scoreTeamwork: barsScores.scoreTeamwork,
      scoreCulture: barsScores.scoreCulture,
    });
    await refetch();
    setSelectedInterview(null);
    setBarsScores({});
    setFeedbackText("");
    setShowBars(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">面试流程</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            BARS行为锚定评分法 · 结构化面试评估
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            创建面试
          </button>
          <div className="flex items-center gap-2 text-sm text-[#475569]">
            <Calendar className="w-4 h-4 text-[#94A3B8]" />
            <span>
              待面:{" "}
              {interviewList.filter((i: any) => i.status === "pending").length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#475569]">
            <CheckCircle2 className="w-4 h-4 text-[#06D6A0]" />
            <span>
              已评:{" "}
              {
                interviewList.filter((i: any) => i.status === "completed")
                  .length
              }
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {stages.map(stageName => {
            const stageCandidates = getCandidatesByStage(stageName);
            const colors = stageColors[stageName] || stageColors["初筛"];
            return (
              <div key={stageName} className="flex-shrink-0 w-[260px]">
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
                  style={{
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.text }}
                  >
                    {stageName}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: colors.border, color: colors.text }}
                  >
                    {stageCandidates.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {stageCandidates.map((iv: any) => {
                    const status =
                      statusConfig[iv.status] || statusConfig["pending"];
                    const StatusIcon = status.icon;
                    const typeCfg =
                      interviewTypeConfig[iv.type] ||
                      interviewTypeConfig["视频"];
                    const TypeIcon = typeCfg.icon;
                    return (
                      <div
                        key={iv.id}
                        className="bg-white border border-slate-200/80 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-[#2D8FF0]/20 transition-all"
                        onClick={() => {
                          if (iv.status === "pending") {
                            setSelectedInterview(iv);
                            setBarsScores({});
                            setFeedbackText("");
                            setShowBars(true);
                          } else {
                            setSelectedInterview(iv);
                            setShowBars(false);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-medium">
                            {(iv.interviewer || "?").charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#1E293B] truncate">
                              候选人#{iv.candidateId}
                            </div>
                            <div className="text-[10px] text-[#94A3B8] truncate">
                              {iv.stage}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TypeIcon
                              className="w-3 h-3"
                              style={{ color: typeCfg.color }}
                            />
                            <span className="text-[10px] text-[#94A3B8]">
                              {iv.type || "面试"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusIcon
                              className="w-3 h-3"
                              style={{ color: status.color }}
                            />
                            <span
                              className="text-[10px]"
                              style={{ color: status.color }}
                            >
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 text-[10px] text-[#94A3B8]">
                          {iv.scheduledTime || ""}
                        </div>
                        {iv.totalScore && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                            <span className="text-xs font-semibold text-[#F59E0B]">
                              {iv.totalScore}分
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
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
                <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-3">
                  面试ID
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  候选人
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  面试类型
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  面试官
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  时间
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  状态
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  BARS评分
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {interviewList.map((iv: any) => {
                const status =
                  statusConfig[iv.status] || statusConfig["pending"];
                const StatusIcon = status.icon;
                const hasBars = iv.status === "completed" && iv.totalScore;
                return (
                  <tr
                    key={iv.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#475569]">
                      #{iv.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-medium">
                          {iv.candidateId}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#1E293B]">
                            候选人#{iv.candidateId}
                          </div>
                          <div className="text-xs text-[#94A3B8]">
                            {iv.stage}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-xs text-[#475569]">
                        {iv.type || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#475569]">
                      {iv.interviewer || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#475569]">
                      {iv.scheduledTime || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5">
                        <StatusIcon
                          className="w-3.5 h-3.5"
                          style={{ color: status.color }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: status.color }}
                        >
                          {status.label}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {hasBars ? (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                          <span className="text-sm font-semibold text-[#F59E0B]">
                            {iv.totalScore}
                          </span>
                          {iv.scoreSkill && (
                            <div className="flex gap-0.5 ml-1">
                              {[
                                { label: "技", val: iv.scoreSkill },
                                { label: "题", val: iv.scoreProblem },
                                { label: "达", val: iv.scoreCommunication },
                                { label: "协", val: iv.scoreTeamwork },
                                { label: "文", val: iv.scoreCulture },
                              ].map(d => (
                                <span
                                  key={d.label}
                                  className="text-[9px] px-1 py-0.5 bg-[#2D8FF0]/10 text-[#2D8FF0] rounded font-medium"
                                >
                                  {d.label}
                                  {d.val}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">--</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {iv.status === "pending" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedInterview(iv);
                              setBarsScores({});
                              setFeedbackText("");
                              setShowBars(true);
                            }}
                            className="px-2.5 py-1 bg-[#2D8FF0] text-white rounded-lg text-xs hover:bg-[#1a7de0] transition-colors flex items-center gap-1"
                          >
                            <ChevronRight className="w-3 h-3" />
                            BARS评分
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(iv.id);
                            }}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#FF5A65]" />
                          </button>
                        </div>
                      )}
                      {hasBars && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedInterview(iv);
                              setShowBars(false);
                            }}
                            className="px-2.5 py-1 border border-slate-200 text-[#475569] rounded-lg text-xs hover:bg-slate-50 transition-colors"
                          >
                            查看详情
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(iv.id);
                            }}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#FF5A65]" />
                          </button>
                        </div>
                      )}
                      {iv.status !== "pending" && !hasBars && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(iv.id);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#FF5A65]" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInterview &&
        showBars &&
        selectedInterview.status === "pending" && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setSelectedInterview(null)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1E293B]">
                      BARS 行为锚定评分
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      根据行为描述选择对应等级 (1-5分)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-medium">
                      {selectedInterview.candidateId}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#1E293B]">
                        候选人#{selectedInterview.candidateId}
                      </div>
                      <div className="text-xs text-[#94A3B8]">
                        {selectedInterview.stage} ·{" "}
                        {selectedInterview.interviewer}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  {barsDimensions.map(dim => (
                    <BarsScoreInput
                      key={dim.key}
                      dimension={dim}
                      value={barsScores[dim.key] || 0}
                      onChange={v => handleScoreChange(dim.key, v)}
                    />
                  ))}
                </div>

                <BarsResultSummary scores={barsScores} />

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#1E293B]">
                      评价备注
                    </label>
                    <button
                      onClick={() => {
                        if (
                          generateFeedbackMutation.isPending
                        )
                          return;
                        if (
                          !barsDimensions.every(
                            d => barsScores[d.key] > 0
                          ) &&
                          !selectedInterview?.totalScore
                        )
                          return;
                        generateFeedbackMutation.mutate(
                          { interviewId: selectedInterview.id },
                          {
                            onSuccess: data => {
                              setFeedbackText(data.feedback);
                            },
                          }
                        );
                      }}
                      disabled={
                        generateFeedbackMutation.isPending ||
                        (!barsDimensions.every(d => barsScores[d.key] > 0) &&
                          !selectedInterview?.totalScore)
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#2D8FF0] bg-[#2D8FF0]/10 hover:bg-[#2D8FF0]/20 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {generateFeedbackMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      AI 生成评语
                    </button>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    rows={3}
                    placeholder="输入面试评价备注（可选）..."
                    className="w-full p-3 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveBars}
                    disabled={
                      !barsDimensions.every(d => barsScores[d.key] > 0) ||
                      updateScoreMutation.isPending
                    }
                    className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {updateScoreMutation.isPending
                      ? "提交中..."
                      : "提交 BARS 评分"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInterview(null);
                      setBarsScores({});
                      setFeedbackText("");
                    }}
                    className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {selectedInterview &&
        !showBars &&
        selectedInterview.status === "completed" && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setSelectedInterview(null)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-[#1E293B]">
                    面试评分详情
                  </h2>
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-sm font-medium">
                    {selectedInterview.candidateId}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-[#1E293B]">
                      候选人#{selectedInterview.candidateId}
                    </div>
                    <div className="text-xs text-[#94A3B8]">
                      {selectedInterview.stage} ·{" "}
                      {selectedInterview.interviewer}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="text-xl font-bold text-[#F59E0B]">
                      {selectedInterview.totalScore}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {barsDimensions.map(dim => {
                    const scoreKey = dim.key as keyof typeof selectedInterview;
                    const score = (selectedInterview[scoreKey] as number) || 0;
                    if (!score) return null;
                    return (
                      <div key={dim.key} className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-[#1E293B]">
                            {dim.label}{" "}
                            <span className="text-[#94A3B8] font-normal">
                              ({dim.weight}%)
                            </span>
                          </span>
                          <span className="text-sm font-bold text-[#2D8FF0]">
                            {score}/5
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2D8FF0] to-[#06D6A0]"
                            style={{ width: `${score * 20}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#475569] leading-relaxed">
                          {dim.descriptions[score - 1]}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {selectedInterview.feedback && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-[#1E293B]">
                      评价备注
                    </span>
                    <p className="mt-1 text-sm text-[#475569]">
                      {selectedInterview.feedback}
                    </p>
                  </div>
                )}
                <div className="flex mt-4">
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  创建面试
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    候选人 ID *
                  </label>
                  <input
                    type="number"
                    value={newInterview.candidateId}
                    onChange={e =>
                      setNewInterview({
                        ...newInterview,
                        candidateId: e.target.value,
                      })
                    }
                    placeholder="输入候选人 ID"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    岗位 ID
                  </label>
                  <input
                    type="number"
                    value={newInterview.positionId}
                    onChange={e =>
                      setNewInterview({
                        ...newInterview,
                        positionId: e.target.value,
                      })
                    }
                    placeholder="输入岗位 ID（可选）"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      面试阶段
                    </label>
                    <select
                      value={newInterview.stage}
                      onChange={e =>
                        setNewInterview({
                          ...newInterview,
                          stage: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    >
                      {["初筛", "一面", "二面", "终面", "HR面", "技术终面"].map(
                        s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      面试类型
                    </label>
                    <select
                      value={newInterview.type}
                      onChange={e =>
                        setNewInterview({
                          ...newInterview,
                          type: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    >
                      {["视频", "电话", "现场"].map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    面试官
                  </label>
                  <input
                    value={newInterview.interviewer}
                    onChange={e =>
                      setNewInterview({
                        ...newInterview,
                        interviewer: e.target.value,
                      })
                    }
                    placeholder="面试官姓名"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    面试时间
                  </label>
                  <input
                    type="datetime-local"
                    value={newInterview.scheduledTime}
                    onChange={e =>
                      setNewInterview({
                        ...newInterview,
                        scheduledTime: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={
                    !newInterview.candidateId || createMutation.isPending
                  }
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40"
                >
                  {createMutation.isPending ? "创建中..." : "创建面试"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
