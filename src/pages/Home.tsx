import { Suspense, lazy, Component } from "react";
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
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const ConstellationBackground = lazy(
  () => import("@/components/ConstellationBackground")
);

class ErrorBoundaryFallback extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0" style={{ background: "#0A0F1C" }} />
      );
    }
    return this.props.children;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: activities } = trpc.dashboard.activities.useQuery();
  const { data: candidateData } = trpc.candidate.list.useQuery({});
  const { data: alertsData } = trpc.alert.list.useQuery();

  const kpis = [
    {
      label: "人才库总量",
      value: stats?.totalCandidates ?? "-",
      change:
        stats?.candidateChange != null
          ? `${stats.candidateChange > 0 ? "+" : ""}${stats.candidateChange}%`
          : "-",
      up: (stats?.candidateChange ?? 0) >= 0,
      icon: Users,
      color: "#2D8FF0",
    },
    {
      label: "本月投递量",
      value: stats?.monthlyApplications ?? "-",
      change:
        stats?.candidateChange != null
          ? `${stats.candidateChange > 0 ? "+" : ""}${stats.candidateChange}%`
          : "-",
      up: (stats?.candidateChange ?? 0) >= 0,
      icon: Mail,
      color: "#06D6A0",
    },
    {
      label: "面试通过率",
      value: stats?.interviewPassRate ? `${stats.interviewPassRate}%` : "-",
      change: "",
      up: true,
      icon: TrendingUp,
      color: "#F59E0B",
    },
    {
      label: "Offer接受率",
      value: stats?.offerAcceptRate ? `${stats.offerAcceptRate}%` : "-",
      change: "",
      up: true,
      icon: CheckCircle2,
      color: "#8B5CF6",
    },
    {
      label: "平均招聘周期",
      value: stats?.avgHireDays ? `${stats.avgHireDays}天` : "-",
      change: "",
      up: false,
      icon: Clock,
      color: "#EC4899",
    },
    {
      label: "本月入职人数",
      value: stats?.monthlyHires ?? "-",
      change:
        stats?.hireChange != null
          ? `${stats.hireChange > 0 ? "+" : ""}${stats.hireChange}%`
          : "-",
      up: (stats?.hireChange ?? 0) >= 0,
      icon: Sparkles,
      color: "#10B981",
    },
  ];

  const candidates = candidateData?.items ?? [];

  return (
    <div className="min-h-screen relative" style={{ background: "#0A0F1C" }}>
      <Suspense
        fallback={
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: "#0A0F1C" }}
          >
            <div className="text-[#94A3B8] text-sm">加载人才星图中...</div>
          </div>
        }
      >
        <ErrorBoundaryFallback>
          <ConstellationBackground />
        </ErrorBoundaryFallback>
      </Suspense>

      <div className="relative z-10 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">人才引力图谱</h1>
            <p className="text-sm text-slate-400 mt-1">
              3D可视化人才网络 · 拖拽旋转探索
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
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
                className="rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                }}
                onClick={() => navigate("/analytics")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${kpi.color}20` }}
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
                <div className="text-2xl font-bold text-white font-tabular">
                  {kpi.value}
                </div>
                <div className="text-xs text-slate-400 mt-1">{kpi.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="lg:col-span-2 rounded-2xl border border-white/10 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">高匹配候选人</h2>
              <button
                onClick={() => navigate("/talent")}
                className="text-sm text-[#2D8FF0] hover:text-[#5aaaf5] transition-colors flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {candidates.slice(0, 5).map((c: any) => (
                <div
                  key={c.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => navigate("/profiles")}
                >
                  <img
                    src={c.avatar || "/images/avatar1.jpg"}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">
                        {c.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {c.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {c.company}
                      </span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">
                        {c.experience}年经验
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">AI匹配</div>
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
                      <div className="text-xs text-slate-500">意向度</div>
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
                            ? "#06D6A015"
                            : c.stage === "终面"
                              ? "#2D8FF015"
                              : "#F59E0B15",
                        color:
                          c.stage === "offer阶段"
                            ? "#06D6A0"
                            : c.stage === "终面"
                              ? "#2D8FF0"
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
            <div
              className="rounded-2xl border border-white/10 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="font-semibold text-white text-sm">近期动态</h2>
              </div>
              <div className="p-4 space-y-3">
                {(activities ?? []).slice(0, 5).map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background:
                          act.type === "offer"
                            ? "#06D6A015"
                            : act.type === "interview"
                              ? "#2D8FF015"
                              : "#F59E0B15",
                      }}
                    >
                      {act.type === "interview" && (
                        <Calendar className="w-3.5 h-3.5 text-[#2D8FF0]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">
                        <span className="font-medium text-white">
                          {act.user}
                        </span>{" "}
                        {act.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {act.target}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl border border-white/10 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold text-white text-sm">紧急预警</h2>
                <button
                  onClick={() => navigate("/alerts")}
                  className="text-sm text-[#2D8FF0] hover:text-[#5aaaf5] transition-colors flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-3.5 h-3.5" />
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
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
