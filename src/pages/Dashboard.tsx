import { useNavigate } from "react-router";
import {
  Users,
  Mail,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: activities } = trpc.dashboard.activities.useQuery();
  const { data: candidateData } = trpc.candidate.list.useQuery({});
  const { data: alertsData } = trpc.alert.list.useQuery();

  const candidates = candidateData?.items ?? [];

  const kpis = [
    {
      label: "人才库总量",
      value: stats?.totalCandidates ?? "-",
      change: "+12.5%",
      up: true,
      icon: Users,
      color: "#2D8FF0",
    },
    {
      label: "本月投递量",
      value: stats?.monthlyApplications ?? "-",
      change: "+8.3%",
      up: true,
      icon: Mail,
      color: "#06D6A0",
    },
    {
      label: "面试通过率",
      value: stats?.interviewPassRate ? `${stats.interviewPassRate}%` : "-",
      change: "-2.1%",
      up: false,
      icon: TrendingUp,
      color: "#F59E0B",
    },
    {
      label: "Offer接受率",
      value: stats?.offerAcceptRate ? `${stats.offerAcceptRate}%` : "-",
      change: "+5.2%",
      up: true,
      icon: CheckCircle2,
      color: "#8B5CF6",
    },
    {
      label: "平均招聘周期",
      value: stats?.avgHireDays ? `${stats.avgHireDays}天` : "-",
      change: "-3天",
      up: true,
      icon: Clock,
      color: "#EC4899",
    },
    {
      label: "本月入职人数",
      value: stats?.monthlyHires ?? "-",
      change: "+2人",
      up: true,
      icon: Zap,
      color: "#10B981",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">招聘总览</h1>
          <p className="text-sm text-[#94A3B8] mt-1">实时洞察招聘全流程数据</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date().toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/60 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate("/analytics")}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}12` }}
                >
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <div
                  className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? "text-[#06D6A0]" : "text-[#FF5A65]"}`}
                >
                  {kpi.up ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E293B] font-tabular">
                {kpi.value}
              </div>
              <div className="text-xs text-[#94A3B8] mt-1">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1E293B]">高匹配候选人</h2>
            <button
              onClick={() => navigate("/talent")}
              className="text-sm text-[#2D8FF0] hover:text-[#1a7de0] transition-colors"
            >
              查看全部
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {candidates.slice(0, 5).map((c: any) => (
              <div
                key={c.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => navigate("/profiles")}
              >
                <img
                  src={c.avatar || "/images/avatar1.jpg"}
                  alt={c.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#1E293B]">
                      {c.name}
                    </span>
                    <span className="text-xs text-[#94A3B8]">{c.position}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#94A3B8]">{c.company}</span>
                    <span className="text-xs text-[#94A3B8]">·</span>
                    <span className="text-xs text-[#94A3B8]">
                      {c.experience}年经验
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-[#94A3B8]">AI匹配</div>
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color:
                          (c.matchScore ?? 0) >= 90
                            ? "#06D6A0"
                            : (c.matchScore ?? 0) >= 80
                              ? "#2D8FF0"
                              : "#F59E0B",
                      }}
                    >
                      {c.matchScore ?? "-"}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#94A3B8]">意向度</div>
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color:
                          (c.intentScore ?? 0) >= 85
                            ? "#06D6A0"
                            : (c.intentScore ?? 0) >= 70
                              ? "#2D8FF0"
                              : "#F59E0B",
                      }}
                    >
                      {c.intentScore ?? "-"}%
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background:
                        c.stage === "offer阶段"
                          ? "#06D6A012"
                          : c.stage === "终面"
                            ? "#2D8FF012"
                            : c.stage === "二面"
                              ? "#8B5CF612"
                              : "#F59E0B12",
                      color:
                        c.stage === "offer阶段"
                          ? "#06D6A0"
                          : c.stage === "终面"
                            ? "#2D8FF0"
                            : c.stage === "二面"
                              ? "#8B5CF6"
                              : "#F59E0B",
                    }}
                  >
                    {c.stage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-[#1E293B]">近期动态</h2>
            </div>
            <div className="p-4 space-y-3">
              {(activities ?? []).slice(0, 5).map((act: any) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background:
                        act.type === "interview" ? "#2D8FF012" : "#F59E0B12",
                    }}
                  >
                    {act.type === "interview" && (
                      <Calendar className="w-3.5 h-3.5 text-[#2D8FF0]" />
                    )}
                    {act.type !== "interview" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#06D6A0]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1E293B]">
                      <span className="font-medium">{act.user}</span>{" "}
                      {act.action}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {act.target}
                    </p>
                  </div>
                  <span className="text-xs text-[#94A3B8] flex-shrink-0">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#1E293B]">紧急预警</h2>
              <button
                onClick={() => navigate("/alerts")}
                className="text-sm text-[#2D8FF0] hover:text-[#1a7de0] transition-colors"
              >
                查看全部
              </button>
            </div>
            <div className="p-4 space-y-3">
              {(alertsData ?? []).slice(0, 3).map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl ${
                    alert.type === "risk"
                      ? "bg-[#FF5A6508] border border-[#FF5A6515]"
                      : alert.type === "warning"
                        ? "bg-[#F59E0B08] border border-[#F59E0B15]"
                        : "bg-[#2D8FF008] border border-[#2D8FF015]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        alert.type === "risk"
                          ? "text-[#FF5A65]"
                          : alert.type === "warning"
                            ? "text-[#F59E0B]"
                            : "text-[#2D8FF0]"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        alert.type === "risk"
                          ? "text-[#FF5A65]"
                          : alert.type === "warning"
                            ? "text-[#F59E0B]"
                            : "text-[#2D8FF0]"
                      }`}
                    >
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1.5 line-clamp-2">
                    {alert.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
