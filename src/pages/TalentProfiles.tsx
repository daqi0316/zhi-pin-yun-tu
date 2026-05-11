import { useState, useRef, useEffect } from "react";
import {
  Search,
  Star,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Briefcase,
  MessageSquare,
  Send,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

// ─── 雷达图组件 ───

function RadarChart({
  dimensions,
}: {
  dimensions: { name: string; score: number; detail: string; level: string }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 220;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.35;
    const n = dimensions.length;
    const angleStep = (Math.PI * 2) / n;

    // Grid
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    for (let level = 1; level <= 5; level++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const dist = (r / 5) * level;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Axes
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    // Data
    ctx.beginPath();
    dimensions.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const dist = (d.score / 100) * r;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(45,143,240,0.12)";
    ctx.fill();
    ctx.strokeStyle = "#2D8FF0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Points
    dimensions.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const dist = (d.score / 100) * r;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#2D8FF0";
      ctx.fill();
    });

    // Labels
    ctx.fillStyle = "#475569";
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.textAlign = "center";
    dimensions.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const labelDist = r + 22;
      const x = cx + Math.cos(angle) * labelDist;
      const y = cy + Math.sin(angle) * labelDist;
      ctx.fillText(d.name, x, y + 4);
    });
  }, [dimensions]);

  return <canvas ref={canvasRef} className="w-[220px] h-[220px]" />;
}

// ─── 时间线组件 ───

function WorkTimeline({
  works,
}: {
  works: {
    company: string;
    position: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }[];
}) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) {
            setVisibleItems(prev => new Set(prev).add(index));
          }
        });
      },
      { threshold: 0.3 }
    );

    document
      .querySelectorAll(".timeline-item")
      .forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [works]);

  if (works.length === 0) {
    return <p className="text-sm text-[#94A3B8]">暂无工作经历</p>;
  }

  return (
    <div className="timeline-container">
      <div className="timeline-line" />
      {works.map((work, i) => (
        <div
          key={i}
          className="timeline-item"
          data-index={i}
          style={{
            opacity: visibleItems.has(i) ? 1 : 0,
            transform: visibleItems.has(i)
              ? "translateX(0)"
              : i % 2 === 0
                ? "translateX(-30px)"
                : "translateX(30px)",
            transition: "all 0.5s ease-out",
          }}
        >
          <div className="timeline-content">
            <h4 className="font-semibold text-sm text-[#1E293B]">
              {work.position || "未知职位"}
            </h4>
            <p className="text-sm text-[#2D8FF0] font-medium">{work.company}</p>
            <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
              {work.description || ""}
            </p>
          </div>
          <div className="timeline-dot" />
          <div className="timeline-date">
            {work.startDate || "?"} — {work.endDate || "至今"}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 等级徽章颜色 ───

const levelColors: Record<string, { bg: string; text: string }> = {
  S: { bg: "#06D6A012", text: "#06D6A0" },
  A: { bg: "#2D8FF012", text: "#2D8FF0" },
  B: { bg: "#F59E0B12", text: "#F59E0B" },
  C: { bg: "#FF5A6512", text: "#FF5A65" },
  D: { bg: "#94A3B812", text: "#94A3B8" },
};

// ─── 主页面 ───

export default function TalentProfiles() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
    null
  );

  // 候选人列表
  const { data: candidateData } = trpc.candidate.list.useQuery({});
  const candidates = candidateData?.items ?? [];

  // 岗位列表
  const { data: positions = [] } = trpc.position.list.useQuery({});

  const filtered = candidates.filter((c: any) => {
    const skills = Array.isArray(c.skills) ? c.skills : [];
    return (
      !search ||
      (c.name || "").includes(search) ||
      (c.position || "").includes(search) ||
      skills.some((s: string) => s.includes(search))
    );
  });

  // 选中候选人的评分数据
  const { data: scoreData, isLoading: scoreLoading } =
    trpc.scoring.scoreCandidate.useQuery(
      { candidateId: selectedId!, positionId: selectedPositionId ?? undefined },
      { enabled: !!selectedId }
    );

  // 选中候选人的详细信息
  const { data: detailData } = trpc.candidate.getById.useQuery(selectedId!, {
    enabled: !!selectedId,
  });

  const profile = scoreData;
  const candidate =
    detailData || candidates.find((c: any) => c.id === selectedId);

  const totalScore = profile?.total ?? candidate?.matchScore ?? 0;

  // 获取风险等级
  const getRiskLevel = () => {
    if (!profile) return "low";
    if (
      profile.dimensions.stability.score >= 70 &&
      profile.dimensions.capabilitySignal.score >= 70
    )
      return "low";
    if (
      profile.dimensions.stability.score >= 40 ||
      profile.dimensions.skillMatch.score >= 50
    )
      return "medium";
    return "high";
  };

  const riskLevel = getRiskLevel();
  const riskLabel =
    riskLevel === "low"
      ? "低风险"
      : riskLevel === "medium"
        ? "中风险"
        : "高风险";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">人才画像</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            AI评分引擎 · 6维度深度分析候选人能力与风险
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索候选人..."
              className="w-full h-9 pl-10 pr-4 bg-white border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
            />
          </div>
          <select
            value={selectedPositionId ?? ""}
            onChange={e =>
              setSelectedPositionId(
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="h-9 px-3 bg-white border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
          >
            <option value="">全部岗位（默认评分）</option>
            {(positionList as any[]).map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.title} · {p.company}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Candidate List */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-sm text-[#1E293B]">候选人列表</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filtered.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full px-5 py-3 flex items-center gap-3 text-left transition-colors ${
                  selectedId === c.id
                    ? "bg-[#2D8FF0]/5 border-l-2 border-[#2D8FF0]"
                    : "hover:bg-slate-50/50 border-l-2 border-transparent"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {c.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1E293B]">
                      {c.name}
                    </span>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          (c.matchScore ?? 0) >= 90 ? "#06D6A012" : "#2D8FF012",
                        color:
                          (c.matchScore ?? 0) >= 90 ? "#06D6A0" : "#2D8FF0",
                      }}
                    >
                      {c.matchScore ?? "-"}
                    </span>
                  </div>
                  <div className="text-xs text-[#94A3B8] truncate">
                    {c.position}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Profile Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedId && profile && candidate ? (
            <>
              {/* Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-2xl font-bold">
                      {candidate.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[#1E293B]">
                          {candidate.name}
                        </h2>
                        <div
                          className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{
                            background:
                              riskLevel === "low"
                                ? "#06D6A012"
                                : riskLevel === "medium"
                                  ? "#F59E0B12"
                                  : "#FF5A6512",
                            color:
                              riskLevel === "low"
                                ? "#06D6A0"
                                : riskLevel === "medium"
                                  ? "#F59E0B"
                                  : "#FF5A65",
                          }}
                        >
                          {riskLevel === "low" ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {riskLabel}
                        </div>
                      </div>
                      <p className="text-sm text-[#475569] mt-1">
                        {candidate.position || "未知职位"} ·{" "}
                        {candidate.company || "未知公司"} ·{" "}
                        {candidate.experience ?? "?"}年经验
                      </p>
                      <div className="mt-2">
                        <label className="text-xs text-[#94A3B8] block mb-1">
                          匹配岗位
                        </label>
                        <select
                          value={selectedPositionId ?? ""}
                          onChange={e =>
                            setSelectedPositionId(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="h-8 px-2.5 bg-slate-100/80 border border-slate-200/60 rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                        >
                          <option value="">选择岗位（可选）</option>
                          {positions.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.title} — {p.company}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-3xl font-bold"
                      style={{
                        color:
                          totalScore >= 90
                            ? "#06D6A0"
                            : totalScore >= 75
                              ? "#2D8FF0"
                              : totalScore >= 60
                                ? "#F59E0B"
                                : "#FF5A65",
                      }}
                    >
                      {totalScore}
                    </div>
                    <div className="text-xs text-[#94A3B8]">AI综合评分</div>
                    <div
                      className="text-xs font-medium mt-0.5"
                      style={{
                        color: levelColors[profile.level]?.text || "#94A3B8",
                      }}
                    >
                      {profile.level}级
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Radar + 维度详情 */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                  <h3 className="font-semibold text-sm text-[#1E293B] mb-4">
                    AI能力雷达 · 6维度评分
                  </h3>
                  <div className="flex justify-center">
                    <RadarChart
                      dimensions={Object.values(profile.dimensions)}
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    {Object.entries(profile.dimensions).map(
                      ([key, d]: [string, any]) => (
                        <div key={key} className="p-2.5 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#475569]">
                                {d.name}
                              </span>
                              <span
                                className="text-[10px] font-bold px-1 py-0.5 rounded"
                                style={{
                                  background:
                                    levelColors[d.level]?.bg || "#94A3B812",
                                  color:
                                    levelColors[d.level]?.text || "#94A3B8",
                                }}
                              >
                                {d.level}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${d.score}%`,
                                    background:
                                      d.score >= 90
                                        ? "#06D6A0"
                                        : d.score >= 75
                                          ? "#2D8FF0"
                                          : d.score >= 60
                                            ? "#F59E0B"
                                            : "#FF5A65",
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-semibold w-5 text-right"
                                style={{
                                  color: d.score >= 75 ? "#2D8FF0" : "#FF5A65",
                                }}
                              >
                                {d.score}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#94A3B8] truncate">
                            {d.detail}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Risk + Salary */}
                <div className="space-y-4">
                  {/* Risk Analysis */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                    <h3 className="font-semibold text-sm text-[#1E293B] mb-3">
                      风险分析
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#06D6A0] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#475569]">
                          稳定性评分: {profile.dimensions.stability.score}分 (
                          {profile.dimensions.stability.detail})
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#06D6A0] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#475569]">
                          能力信号: {profile.dimensions.capabilitySignal.detail}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#06D6A0] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#475569]">
                          技能匹配: {profile.dimensions.skillMatch.detail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Salary Analysis */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                    <h3 className="font-semibold text-sm text-[#1E293B] mb-3">
                      薪资匹配 · {profile.dimensions.salaryFit.level}级 (
                      {profile.dimensions.salaryFit.score}分)
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      {profile.dimensions.salaryFit.detail}
                    </p>
                    {profile.dimensions.salaryFit.level === "S" && (
                      <p className="text-xs text-[#06D6A0] mt-2 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        薪资在预算范围内，谈判空间良好
                      </p>
                    )}
                    {profile.dimensions.salaryFit.level === "C" && (
                      <p className="text-xs text-[#FF5A65] mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        薪资偏离较大，建议评估预算弹性
                      </p>
                    )}
                  </div>

                  {/* 公司关联度入口 */}
                  {selectedId && (
                    <button
                      onClick={() =>
                        (window.location.href = `/relations?candidateId=${selectedId}`)
                      }
                      className="w-full bg-white rounded-2xl border border-slate-200/60 p-4 hover:bg-slate-50/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm text-[#1E293B]">
                            公司关联网络
                          </h3>
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            查看与候选人有同公司交集的人
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Work History Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                <h3 className="font-semibold text-sm text-[#1E293B] mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#2D8FF0]" />
                  工作经历
                </h3>
                <WorkTimeline works={(candidate as any)?.workHistory || []} />
              </div>

              {/* AI Insight */}
              <div className="bg-gradient-to-r from-[#2D8FF0]/5 to-[#06D6A0]/5 rounded-2xl border border-[#2D8FF0]/15 p-6">
                <h3 className="font-semibold text-sm text-[#1E293B] mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#2D8FF0]" />
                  AI 评分摘要
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  综合得分 {totalScore}分 ({profile.level}级)。 技能
                  {profile.dimensions.skillMatch.level}级(
                  {profile.dimensions.skillMatch.score}分)， 经验
                  {profile.dimensions.experienceMatch.level}级(
                  {profile.dimensions.experienceMatch.score}分)， 能力信号
                  {profile.dimensions.capabilitySignal.level}级(
                  {profile.dimensions.capabilitySignal.score}分)。
                  {riskLevel === "low"
                    ? "整体风险可控，建议推进面试。"
                    : riskLevel === "medium"
                      ? "建议重点关注能力短板再决策。"
                      : "风险偏高，建议谨慎评估。"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="h-11 px-6 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  发送 Offer
                </button>
                <button className="h-11 px-6 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  发起沟通
                </button>
              </div>
            </>
          ) : scoreLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
              <div className="w-8 h-8 border-2 border-[#2D8FF0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#94A3B8]">AI评分引擎计算中...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-[#94A3B8]">选择左侧候选人查看详细画像</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
