import { useRef, useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

function LineChart({
  data,
}: {
  data: {
    label: string;
    candidates: number;
    interviews: number;
    offers: number;
  }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 800;
    const h = 280;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, w, h);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(
      1,
      ...data.flatMap(d => [d.candidates, d.interviews, d.offers])
    );
    const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;

    // Grid
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = "#94A3B8";
      ctx.font = '11px "Inter", sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(
        String(Math.round(maxVal - (maxVal / 4) * i)),
        padding.left - 8,
        y + 4
      );
    }

    // X labels
    ctx.textAlign = "center";
    const showEvery = Math.max(1, Math.floor(data.length / 8));
    data.forEach((d, i) => {
      if (i % showEvery === 0 || i === data.length - 1) {
        const x =
          data.length > 1
            ? padding.left + i * xStep
            : padding.left + chartW / 2;
        ctx.fillStyle = "#94A3B8";
        ctx.font = '10px "Inter", sans-serif';
        ctx.fillText(d.label, x, h - 12);
      }
    });

    const lines = [
      { key: "candidates" as const, color: "#2D8FF0", label: "候选人" },
      { key: "interviews" as const, color: "#8B5CF6", label: "面试" },
      { key: "offers" as const, color: "#06D6A0", label: "Offer" },
    ];

    lines.forEach(line => {
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2.5;
      data.forEach((d, i) => {
        const x =
          data.length > 1
            ? padding.left + i * xStep
            : padding.left + chartW / 2;
        const y = padding.top + chartH - (d[line.key] / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      data.forEach((d, i) => {
        const x =
          data.length > 1
            ? padding.left + i * xStep
            : padding.left + chartW / 2;
        const y = padding.top + chartH - (d[line.key] / maxVal) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = line.color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    const legendX = padding.left;
    const legendY = 8;
    lines.forEach((line, i) => {
      const lx = legendX + i * 80;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      ctx.moveTo(lx, legendY);
      ctx.lineTo(lx + 16, legendY);
      ctx.stroke();
      ctx.fillStyle = "#475569";
      ctx.font = '11px "Inter", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(line.label, lx + 20, legendY + 4);
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ maxWidth: 800, height: 280 }}
    />
  );
}

function FunnelChart({
  data,
}: {
  data: {
    totalCandidates: number;
    passedScreening: number;
    interviewed: number;
    passedInterview: number;
    offered: number;
    hired: number;
  };
}) {
  const stages = [
    { label: "总候选人", value: data.totalCandidates, color: "#2D8FF0" },
    { label: "通过初筛", value: data.passedScreening, color: "#3B9BF5" },
    { label: "进入面试", value: data.interviewed, color: "#5BAFF8" },
    { label: "通过面试", value: data.passedInterview, color: "#7BC3FB" },
    { label: "发送Offer", value: data.offered, color: "#9BD7FE" },
    { label: "成功入职", value: data.hired, color: "#06D6A0" },
  ];

  const maxVal = Math.max(stages[0].value, 1);

  return (
    <div className="space-y-2">
      {stages.map((item, i) => {
        const width = (item.value / maxVal) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8] w-16 text-right">
              {item.label}
            </span>
            <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                style={{
                  width: `${Math.max(width, 2)}%`,
                  background: item.color,
                }}
              >
                <span className="text-xs font-semibold text-white">
                  {item.value}
                </span>
              </div>
              {i < stages.length - 1 && stages[i + 1].value > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8]">
                  {(
                    (stages[i + 1].value / Math.max(item.value, 1)) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [trendPeriod, setTrendPeriod] = useState<"weekly" | "monthly">(
    "weekly"
  );
  const { data: channelsData = [] } = trpc.channel.list.useQuery();
  const { data: trendsData } = trpc.analytics.trends.useQuery({
    period: trendPeriod,
    weeks: 8,
  });
  const { data: funnelData } = trpc.analytics.funnel.useQuery();
  const { data: positionEff = [] } =
    trpc.analytics.positionEfficiency.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const channelsList = channelsData as any[];

  const trendBars = trendsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">数据分析</h1>
          <p className="text-sm text-[#94A3B8] mt-1">全维度招聘数据洞察</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "本月候选人",
            value: stats?.monthlyApplications ?? "-",
            suffix: "人",
            change:
              stats?.candidateChange != null
                ? `${stats.candidateChange > 0 ? "+" : ""}${stats.candidateChange}%`
                : null,
            icon: Users,
            color: "#2D8FF0",
          },
          {
            label: "面试转化率",
            value: stats?.interviewPassRate ?? "-",
            suffix: "%",
            change: null,
            icon: Target,
            color: "#06D6A0",
          },
          {
            label: "平均招聘周期",
            value: stats?.avgHireDays ?? "-",
            suffix: "天",
            change: null,
            icon: Clock,
            color: "#F59E0B",
          },
          {
            label: "Offer接受率",
            value: stats?.offerAcceptRate ?? "-",
            suffix: "%",
            change: null,
            icon: TrendingUp,
            color: "#8B5CF6",
          },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/60"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}12` }}
                >
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <span className="text-xs text-[#94A3B8]">{kpi.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1E293B] font-tabular">
                  {kpi.value}
                </span>
                <span className="text-sm text-[#94A3B8]">{kpi.suffix}</span>
              </div>
              {kpi.change && (
                <span
                  className="text-xs font-medium mt-1 inline-block"
                  style={{
                    color: kpi.change.startsWith("+")
                      ? "#06D6A0"
                      : kpi.change.startsWith("-")
                        ? "#FF5A65"
                        : "#94A3B8",
                  }}
                >
                  {kpi.change} 环比
                </span>
              )}
            </div>
          );
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
              <button
                onClick={() => setTrendPeriod("weekly")}
                className={`h-7 px-3 rounded-lg text-xs transition-colors ${trendPeriod === "weekly" ? "bg-[#2D8FF0] text-white" : "bg-slate-100 text-[#475569]"}`}
              >
                按周
              </button>
              <button
                onClick={() => setTrendPeriod("monthly")}
                className={`h-7 px-3 rounded-lg text-xs transition-colors ${trendPeriod === "monthly" ? "bg-[#2D8FF0] text-white" : "bg-slate-100 text-[#475569]"}`}
              >
                按月
              </button>
            </div>
          </div>
          {trendBars.length > 0 ? (
            <LineChart data={trendBars} />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-[#94A3B8] text-sm">
              暂无趋势数据
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <h2 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2D8FF0]" />
            转化漏斗
          </h2>
          {funnelData ? (
            <FunnelChart data={funnelData} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[#94A3B8] text-sm">
              加载中...
            </div>
          )}
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
                <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-3">
                  岗位
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  候选人
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  匹配(B级+)
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  面试
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  Offer
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  匹配率
                </th>
                <th className="text-left text-xs font-medium text-[#94A3B8] px-4 py-3">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {positionEff.map((pos: any) => (
                <tr
                  key={pos.positionId}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">
                        {pos.position}
                      </p>
                      <p className="text-xs text-[#94A3B8]">{pos.company}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#475569] font-tabular">
                    {pos.applicants}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#475569] font-tabular">
                    {pos.matches}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#475569] font-tabular">
                    {pos.interviews}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#475569] font-tabular">
                    {pos.offers}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color:
                          pos.conversionRate >= 25
                            ? "#06D6A0"
                            : pos.conversionRate >= 15
                              ? "#2D8FF0"
                              : "#F59E0B",
                      }}
                    >
                      {pos.conversionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        pos.status === "active"
                          ? "bg-[#06D6A0]/10 text-[#06D6A0]"
                          : pos.status === "paused"
                            ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                            : "bg-slate-100 text-[#94A3B8]"
                      }`}
                    >
                      {pos.status === "active"
                        ? "招聘中"
                        : pos.status === "paused"
                          ? "已暂停"
                          : "已关闭"}
                    </span>
                  </td>
                </tr>
              ))}
              {positionEff.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-[#94A3B8]"
                  >
                    暂无岗位数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <h2 className="font-semibold text-[#1E293B] mb-4">渠道效率对比</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {channelsList.map((ch: any) => (
            <div key={ch.id} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-sm font-semibold text-[#1E293B] mb-2">
                {ch.name}
              </div>
              <div className="h-24 flex items-end justify-center gap-1">
                {[
                  {
                    label: "投递",
                    value: ch.applications || 0,
                    color: "#2D8FF0",
                  },
                  {
                    label: "面试",
                    value: ch.interviews || 0,
                    color: "#8B5CF6",
                  },
                  { label: "Offer", value: ch.offers || 0, color: "#06D6A0" },
                ].map(bar => (
                  <div
                    key={bar.label}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-6 rounded-t-md transition-all"
                      style={{
                        height: `${(bar.value / Math.max(ch.applications || 1, 1)) * 80}px`,
                        background: bar.color,
                      }}
                    />
                    <span className="text-[9px] text-[#94A3B8]">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-[#94A3B8]">
                转化率{" "}
                <span className="font-semibold text-[#1E293B]">
                  {ch.conversionRate || 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
