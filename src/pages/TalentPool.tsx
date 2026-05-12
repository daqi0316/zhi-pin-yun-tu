import { useState, useEffect } from "react";
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
  X,
  Clock,
  UserPlus,
  FileText,
  Bell,
  ArrowRight,
  Download,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const statusOptions = [
  "全部",
  "在职-考虑机会",
  "在职-积极求职",
  "离职-随时到岗",
];
const stageOptions = ["全部", "初筛", "一面", "二面", "终面", "offer阶段"];
const sourceOptions = [
  "全部",
  "猎头推荐",
  "内推",
  "主动投递",
  "LinkedIn",
  "Boss直聘",
];

interface CandidateDetail {
  id: number;
  name: string;
  avatar: string | null;
  position: string | null;
  company: string | null;
  experience: number | null;
  skills: string[];
  education: string | null;
  status: string | null;
  matchScore: number | null;
  intentScore: number | null;
  source: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  salary: string | null;
  stage: string | null;
}

export default function TalentPool() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [stageFilter, setStageFilter] = useState("全部");
  const [sourceFilter, setSourceFilter] = useState("全部");
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [exporting, setExporting] = useState(false);

  const utils = trpc.useUtils();
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
    company: "",
    experience: "",
    education: "",
    skills: "",
    source: "主动投递",
    salary: "",
    stage: "初筛",
    location: "",
  });

  const { data, isLoading, refetch } = trpc.candidate.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "全部" ? statusFilter : undefined,
    stage: stageFilter !== "全部" ? stageFilter : undefined,
    source: sourceFilter !== "全部" ? sourceFilter : undefined,
  });

  const candidates = data?.items ?? [];

  useEffect(() => {
    if (!exporting) return;
    utils.export.candidatesCSV
      .fetch()
      .then(result => {
        if (result?.csv && result?.filename) {
          const blob = new Blob([result.csv], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          a.click();
          URL.revokeObjectURL(url);
        }
        setExporting(false);
      })
      .catch(() => setExporting(false));
  }, [exporting, utils]);

  const { data: candidateDetail } = trpc.candidate.detail.useQuery(
    selectedId!,
    { enabled: !!selectedId }
  );

  const timelineIcons: Record<string, typeof Clock> = {
    candidate: UserPlus,
    interview: FileText,
    offer: Star,
    alert: Bell,
    stage: ArrowRight,
  };

  const createMutation = trpc.candidate.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreate(false);
      setNewCandidate({
        name: "",
        phone: "",
        email: "",
        position: "",
        company: "",
        experience: "",
        education: "",
        skills: "",
        source: "主动投递",
        salary: "",
        stage: "初筛",
        location: "",
      });
    },
  });

  const handleCreate = () => {
    if (!newCandidate.name) return;
    createMutation.mutate({
      name: newCandidate.name,
      phone: newCandidate.phone || undefined,
      email: newCandidate.email || undefined,
      position: newCandidate.position || undefined,
      company: newCandidate.company || undefined,
      experience: newCandidate.experience
        ? Number(newCandidate.experience)
        : undefined,
      education: newCandidate.education || undefined,
      skills: newCandidate.skills
        ? newCandidate.skills.split(",").map(s => s.trim())
        : undefined,
      source: newCandidate.source || undefined,
      salary: newCandidate.salary || undefined,
      stage: newCandidate.stage || undefined,
      location: newCandidate.location || undefined,
    });
  };

  const getMatchColor = (score: number | null) => {
    if (!score) return "#94A3B8";
    if (score >= 90) return "#06D6A0";
    if (score >= 80) return "#2D8FF0";
    return "#F59E0B";
  };

  const getStageColor = (stage: string | null) => {
    const s = stage || "";
    if (s === "offer阶段") return { bg: "#06D6A012", text: "#06D6A0" };
    if (s === "终面") return { bg: "#2D8FF012", text: "#2D8FF0" };
    if (s === "二面") return { bg: "#8B5CF612", text: "#8B5CF6" };
    return { bg: "#F59E0B12", text: "#F59E0B" };
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExporting(true)}
            className="h-9 px-4 border border-slate-200 text-[#1E293B] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors"
          >
            + 新增候选人
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名、职位、技能..."
              className="w-full h-9 pl-10 pr-4 bg-slate-100/80 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
            />
          </div>
          {[
            {
              label: "求职状态",
              value: statusFilter,
              set: setStatusFilter,
              options: statusOptions,
            },
            {
              label: "招聘阶段",
              value: stageFilter,
              set: setStageFilter,
              options: stageOptions,
            },
            {
              label: "来源渠道",
              value: sourceFilter,
              set: setSourceFilter,
              options: sourceOptions,
            },
          ].map(f => (
            <div key={f.label} className="relative">
              <select
                value={f.value}
                onChange={e => f.set(e.target.value)}
                className="h-9 pl-3 pr-8 bg-slate-100/80 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 appearance-none cursor-pointer"
              >
                {f.options.map(o => (
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
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-3">
                    候选人
                  </th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                    技能
                  </th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                    匹配度
                  </th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                    来源
                  </th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                    阶段
                  </th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-sm font-semibold">
                          {c.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-[#1E293B]">
                            {c.name}
                          </div>
                          <div className="text-xs text-[#94A3B8]">
                            {c.position} · {c.experience}年
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(c.skills) ? c.skills : [])
                          .slice(0, 3)
                          .map((s: string) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-slate-100 rounded-md text-xs text-[#475569]"
                            >
                              {s}
                            </span>
                          ))}
                        {(Array.isArray(c.skills) ? c.skills : []).length >
                          3 && (
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
                        <span
                          className="text-sm font-semibold"
                          style={{ color: getMatchColor(c.matchScore) }}
                        >
                          {c.matchScore || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#475569]">
                      {c.source}
                    </td>
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
                        <button
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                          title="收藏"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                          title="沟通"
                        >
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                          title="星标"
                        >
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
      {selectedId && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => {
              setSelectedId(null);
              setSelectedCandidate(null);
            }}
          />
          <div className="relative w-[520px] h-full bg-white shadow-2xl overflow-y-auto custom-scrollbar">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  候选人详情
                </h2>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedCandidate(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400"
                >
                  ✕
                </button>
              </div>

              {!candidateDetail ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#2D8FF0] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-2xl font-bold">
                      {candidateDetail.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1E293B]">
                        {candidateDetail.name}
                      </h3>
                      <p className="text-sm text-[#475569]">
                        {candidateDetail.position}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8]">
                        <Briefcase className="w-3 h-3" />
                        {candidateDetail.company}
                        <MapPin className="w-3 h-3 ml-1" />
                        {candidateDetail.location}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs text-[#94A3B8]">AI匹配度</div>
                      <div
                        className="text-xl font-bold"
                        style={{
                          color:
                            (candidateDetail.matchScore ?? 0) >= 75
                              ? "#06D6A0"
                              : (candidateDetail.matchScore ?? 0) >= 60
                                ? "#2D8FF0"
                                : "#F59E0B",
                        }}
                      >
                        {candidateDetail.matchScore ?? "-"}%
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs text-[#94A3B8]">求职意向</div>
                      <div
                        className="text-xl font-bold"
                        style={{
                          color:
                            (candidateDetail.intentScore ?? 0) >= 85
                              ? "#06D6A0"
                              : "#2D8FF0",
                        }}
                      >
                        {candidateDetail.intentScore ?? "-"}%
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs text-[#94A3B8]">期望薪资</div>
                      <div className="text-lg font-bold text-[#1E293B]">
                        {candidateDetail.salary || "面议"}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="text-xs text-[#94A3B8]">当前阶段</div>
                      <div className="text-sm font-medium text-[#1E293B]">
                        {candidateDetail.stage || candidateDetail.status}
                      </div>
                    </div>
                  </div>

                  {/* Linked Records Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#2D8FF0]/5 border border-[#2D8FF0]/10 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-[#2D8FF0]">
                        {(candidateDetail as any).interviews?.length ?? 0}
                      </div>
                      <div className="text-xs text-[#94A3B8]">面试</div>
                    </div>
                    <div className="bg-[#06D6A0]/5 border border-[#06D6A0]/10 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-[#06D6A0]">
                        {(candidateDetail as any).offers?.length ?? 0}
                      </div>
                      <div className="text-xs text-[#94A3B8]">Offer</div>
                    </div>
                    <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/10 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-[#F59E0B]">
                        {(candidateDetail as any).alerts?.length ?? 0}
                      </div>
                      <div className="text-xs text-[#94A3B8]">预警</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-[#1E293B] mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#2D8FF0]" />
                      教育背景
                    </h4>
                    <p className="text-sm text-[#475569]">
                      {candidateDetail.education || "未提供"}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-[#1E293B] mb-2">
                      技能标签
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(candidateDetail.skills)
                        ? candidateDetail.skills
                        : []
                      ).map((s: string) => (
                        <span
                          key={s}
                          className="px-3 py-1.5 bg-[#2D8FF0]/8 text-[#2D8FF0] rounded-lg text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-[#1E293B] mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#2D8FF0]" />
                      状态流转
                    </h4>
                    <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                      {((candidateDetail as any).timeline ?? []).map(
                        (event: any, i: number) => {
                          const TIcon = timelineIcons[event.type] || Clock;
                          return (
                            <div key={i} className="relative">
                              <div className="absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white bg-[#2D8FF0] top-1" />
                              <div>
                                <p className="text-sm font-medium text-[#1E293B]">
                                  {event.title}
                                </p>
                                <p className="text-xs text-[#94A3B8] mt-0.5">
                                  {new Date(event.date).toLocaleDateString(
                                    "zh-CN",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                  {" · "}
                                  {event.description}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Linked Interviews */}
                  {((candidateDetail as any).interviews ?? []).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-[#1E293B] mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#2D8FF0]" />
                        关联面试 ({(candidateDetail as any).interviews.length})
                      </h4>
                      <div className="space-y-2">
                        {(candidateDetail as any).interviews.map((iv: any) => (
                          <div
                            key={iv.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-[#1E293B]">
                                {iv.stage} · {iv.type}
                              </p>
                              <p className="text-xs text-[#94A3B8]">
                                {iv.interviewer} ·{" "}
                                {iv.scheduledTime
                                  ? new Date(
                                      iv.scheduledTime
                                    ).toLocaleDateString("zh-CN")
                                  : "待定"}
                              </p>
                            </div>
                            <div className="text-right">
                              {iv.totalScore && (
                                <span className="text-sm font-semibold text-[#2D8FF0]">
                                  {iv.totalScore}分
                                </span>
                              )}
                              <span
                                className={`block text-xs px-2 py-0.5 rounded ${
                                  iv.status === "completed"
                                    ? "bg-[#06D6A0]/10 text-[#06D6A0]"
                                    : iv.status === "pending"
                                      ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                                      : "bg-slate-100 text-[#94A3B8]"
                                }`}
                              >
                                {iv.status === "completed"
                                  ? "已完成"
                                  : iv.status === "pending"
                                    ? "待面试"
                                    : iv.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Offers */}
                  {((candidateDetail as any).offers ?? []).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-[#1E293B] mb-2 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-[#06D6A0]" />
                        关联Offer ({(candidateDetail as any).offers.length})
                      </h4>
                      <div className="space-y-2">
                        {(candidateDetail as any).offers.map((o: any) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-[#1E293B]">
                                总包{" "}
                                {o.totalPackage
                                  ? (o.totalPackage / 10000).toFixed(1) + "万"
                                  : "待定"}
                              </p>
                              <p className="text-xs text-[#94A3B8]">
                                {o.recruiter || ""}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                o.status === "accepted"
                                  ? "bg-[#06D6A0]/10 text-[#06D6A0]"
                                  : o.status === "sent" ||
                                      o.status === "negotiating"
                                    ? "bg-[#2D8FF0]/10 text-[#2D8FF0]"
                                    : "bg-slate-100 text-[#94A3B8]"
                              }`}
                            >
                              {o.status === "accepted"
                                ? "已接受"
                                : o.status === "sent"
                                  ? "已发送"
                                  : o.status === "negotiating"
                                    ? "谈判中"
                                    : o.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Alerts */}
                  {((candidateDetail as any).alerts ?? []).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-[#1E293B] mb-2 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-[#FF5A65]" />
                        关联预警 ({(candidateDetail as any).alerts.length})
                      </h4>
                      <div className="space-y-2">
                        {(candidateDetail as any).alerts.map((a: any) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-[#1E293B]">
                                {a.title}
                              </p>
                              <p className="text-xs text-[#94A3B8]">
                                {a.description}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                a.type === "risk"
                                  ? "bg-[#FF5A65]/10 text-[#FF5A65]"
                                  : a.type === "warning"
                                    ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                                    : "bg-[#2D8FF0]/10 text-[#2D8FF0]"
                              }`}
                            >
                              {a.type === "risk"
                                ? "高风险"
                                : a.type === "warning"
                                  ? "警告"
                                  : "提醒"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-[#1E293B] mb-2">
                      联系方式
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-[#475569]">
                        <span className="text-[#94A3B8]">电话:</span>{" "}
                        {candidateDetail.phone || "-"}
                      </div>
                      <div className="flex items-center gap-2 text-[#475569]">
                        <span className="text-[#94A3B8]">邮箱:</span>{" "}
                        {candidateDetail.email || "-"}
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
                </>
              )}
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-[560px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  新增候选人
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
                    姓名 *
                  </label>
                  <input
                    value={newCandidate.name}
                    onChange={e =>
                      setNewCandidate({ ...newCandidate, name: e.target.value })
                    }
                    placeholder="候选人姓名"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    职位
                  </label>
                  <input
                    value={newCandidate.position}
                    onChange={e =>
                      setNewCandidate({
                        ...newCandidate,
                        position: e.target.value,
                      })
                    }
                    placeholder="如：高级Java工程师"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    当前公司
                  </label>
                  <input
                    value={newCandidate.company}
                    onChange={e =>
                      setNewCandidate({
                        ...newCandidate,
                        company: e.target.value,
                      })
                    }
                    placeholder="如：字节跳动"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      工作年限
                    </label>
                    <input
                      type="number"
                      value={newCandidate.experience}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          experience: e.target.value,
                        })
                      }
                      placeholder="5"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      学历
                    </label>
                    <input
                      value={newCandidate.education}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          education: e.target.value,
                        })
                      }
                      placeholder="如：硕士 / 985院校"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    技能（逗号分隔）
                  </label>
                  <input
                    value={newCandidate.skills}
                    onChange={e =>
                      setNewCandidate({
                        ...newCandidate,
                        skills: e.target.value,
                      })
                    }
                    placeholder="Java, Spring Cloud, Redis"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      电话
                    </label>
                    <input
                      value={newCandidate.phone}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          phone: e.target.value,
                        })
                      }
                      placeholder="13800138000"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      邮箱
                    </label>
                    <input
                      value={newCandidate.email}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          email: e.target.value,
                        })
                      }
                      placeholder="candidate@example.com"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      来源渠道
                    </label>
                    <select
                      value={newCandidate.source}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          source: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    >
                      {[
                        "主动投递",
                        "猎头推荐",
                        "内推",
                        "LinkedIn",
                        "Boss直聘",
                      ].map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      期望薪资
                    </label>
                    <input
                      value={newCandidate.salary}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          salary: e.target.value,
                        })
                      }
                      placeholder="如：50K-60K"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      所在城市
                    </label>
                    <input
                      value={newCandidate.location}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          location: e.target.value,
                        })
                      }
                      placeholder="如：北京"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      招聘阶段
                    </label>
                    <select
                      value={newCandidate.stage}
                      onChange={e =>
                        setNewCandidate({
                          ...newCandidate,
                          stage: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    >
                      {["初筛", "一面", "二面", "终面", "offer阶段"].map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={!newCandidate.name || createMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40"
                >
                  {createMutation.isPending ? "创建中..." : "创建候选人"}
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
