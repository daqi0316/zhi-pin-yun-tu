import { useState } from "react";
import {
  Briefcase,
  Plus,
  Search,
  DollarSign,
  Clock,
  X,
  Pencil,
  Trash2,
  Eye,
  Star,
  Users,
  Loader2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "#06D6A012", text: "#06D6A0" },
  paused: { bg: "#F59E0B12", text: "#F59E0B" },
  closed: { bg: "#94A3B812", text: "#94A3B8" },
};

const statusLabel: Record<string, string> = {
  active: "招聘中",
  paused: "暂停",
  closed: "已关闭",
};

type PositionDetail = {
  id: number;
  title: string;
  company: string;
  department: string | null;
  description: string | null;
  requiredSkills: string[] | string;
  bonusSkills: string[] | string;
  minExperience: number | null;
  maxExperience: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function parseSkills(s: string[] | string | null | undefined): string[] {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

export default function Positions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPos, setSelectedPos] = useState<PositionDetail | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [newPos, setNewPos] = useState({
    title: "",
    company: "",
    department: "",
    description: "",
    requiredSkills: "",
    bonusSkills: "",
    minExperience: "",
    maxExperience: "",
    salaryMin: "",
    salaryMax: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    company: "",
    department: "",
    description: "",
    requiredSkills: "",
    bonusSkills: "",
    minExperience: "",
    maxExperience: "",
    salaryMin: "",
    salaryMax: "",
    status: "",
  });
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchPositionId, setMatchPositionId] = useState<number | null>(null);

  const { data: positions = [], refetch } = trpc.position.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "全部" ? statusFilter : undefined,
  });

  const { data: currentUser } = trpc.auth.me.useQuery();
  const isAdmin = currentUser?.role === "admin";

  const { data: matchCounts = {} } = trpc.positionMatch.counts.useQuery(
    undefined,
    {
      refetchInterval: 30000,
    }
  );

  const { data: matchResult, isPending: matchPending } =
    trpc.scoring.matchCandidates.useQuery(
      { positionId: matchPositionId! },
      { enabled: matchPositionId !== null }
    );

  const createMutation = trpc.position.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreate(false);
      setNewPos({
        title: "",
        company: "",
        department: "",
        description: "",
        requiredSkills: "",
        bonusSkills: "",
        minExperience: "",
        maxExperience: "",
        salaryMin: "",
        salaryMax: "",
      });
    },
  });
  const updateMutation = trpc.position.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditMode(false);
      setSelectedPos(null);
    },
  });
  const deleteMutation = trpc.position.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedPos(null);
    },
  });

  const handleCreate = () => {
    if (!newPos.title || !newPos.company) return;
    createMutation.mutate({
      title: newPos.title,
      company: newPos.company,
      department: newPos.department || undefined,
      description: newPos.description || undefined,
      requiredSkills: newPos.requiredSkills
        ? newPos.requiredSkills.split(",").map(s => s.trim())
        : undefined,
      bonusSkills: newPos.bonusSkills
        ? newPos.bonusSkills.split(",").map(s => s.trim())
        : undefined,
      minExperience: newPos.minExperience
        ? Number(newPos.minExperience)
        : undefined,
      maxExperience: newPos.maxExperience
        ? Number(newPos.maxExperience)
        : undefined,
      salaryMin: newPos.salaryMin ? Number(newPos.salaryMin) : undefined,
      salaryMax: newPos.salaryMax ? Number(newPos.salaryMax) : undefined,
    });
  };

  const openDetail = (pos: any) => {
    const skills = parseSkills(pos.requiredSkills);
    const bonus = parseSkills(pos.bonusSkills);
    setSelectedPos({ ...pos, requiredSkills: skills, bonusSkills: bonus });
    setEditForm({
      title: pos.title || "",
      company: pos.company || "",
      department: pos.department || "",
      description: pos.description || "",
      requiredSkills: skills.join(", "),
      bonusSkills: bonus.join(", "),
      minExperience: pos.minExperience ?? "",
      maxExperience: pos.maxExperience ?? "",
      salaryMin: pos.salaryMin ?? "",
      salaryMax: pos.salaryMax ?? "",
      status: pos.status || "active",
    });
    setEditMode(false);
  };

  const handleUpdate = () => {
    if (!selectedPos) return;
    updateMutation.mutate({
      id: selectedPos.id,
      data: {
        title: editForm.title || undefined,
        company: editForm.company || undefined,
        department: editForm.department || undefined,
        description: editForm.description || undefined,
        requiredSkills: editForm.requiredSkills
          ? editForm.requiredSkills.split(",").map(s => s.trim())
          : undefined,
        bonusSkills: editForm.bonusSkills
          ? editForm.bonusSkills.split(",").map(s => s.trim())
          : undefined,
        minExperience: editForm.minExperience
          ? Number(editForm.minExperience)
          : undefined,
        maxExperience: editForm.maxExperience
          ? Number(editForm.maxExperience)
          : undefined,
        salaryMin: editForm.salaryMin ? Number(editForm.salaryMin) : undefined,
        salaryMax: editForm.salaryMax ? Number(editForm.salaryMax) : undefined,
        status: editForm.status || undefined,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedPos) return;
    if (confirm(`确定删除岗位「${selectedPos.title}」？此操作不可恢复。`)) {
      deleteMutation.mutate(selectedPos.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">岗位管理</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            JD管理 · 技能要求 · 薪资范围
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            新建岗位
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索岗位名称或公司..."
            className="w-full h-9 pl-10 pr-4 bg-white border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
          />
        </div>
        <div className="flex gap-2">
          {["全部", "active", "paused", "closed"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#2D8FF0] text-white"
                  : "bg-white border border-slate-200/60 text-[#475569] hover:bg-slate-50"
              }`}
            >
              {s === "active"
                ? "招聘中"
                : s === "paused"
                  ? "暂停"
                  : s === "closed"
                    ? "已关闭"
                    : "全部"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {positions.map((pos: any) => {
          const requiredSkills = parseSkills(pos.requiredSkills);
          const colors = statusColors[pos.status] || statusColors["active"];
          return (
            <div
              key={pos.id}
              className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-slate-200/40 transition-all cursor-pointer"
              onClick={() => openDetail(pos)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#1E293B] truncate">
                    {pos.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {pos.company}
                    {pos.department ? ` · ${pos.department}` : ""}
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ml-2"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {statusLabel[pos.status] || pos.status}
                </span>
              </div>

              {pos.description && (
                <p className="text-xs text-[#475569] line-clamp-2 mb-3">
                  {pos.description}
                </p>
              )}

              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {requiredSkills.slice(0, 5).map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-[#2D8FF0]/8 text-[#2D8FF0] rounded text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {requiredSkills.length > 5 && (
                    <span className="text-[10px] text-[#94A3B8]">
                      +{requiredSkills.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                {(pos.minExperience != null || pos.maxExperience != null) && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pos.minExperience ?? 0}-{pos.maxExperience ?? "?"}年
                  </span>
                )}
                {(pos.salaryMin != null || pos.salaryMax != null) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {(pos.salaryMin ?? 0) / 1000}k-{(pos.salaryMax ?? 0) / 1000}
                    k
                  </span>
                )}
                {matchCounts[pos.id] && (
                  <span
                    className="flex items-center gap-1 text-[#2D8FF0] cursor-pointer hover:underline"
                    onClick={e => {
                      e.stopPropagation();
                      setMatchPositionId(pos.id);
                      setShowMatchModal(true);
                    }}
                  >
                    <Users className="w-3 h-3" />
                    {matchCounts[pos.id].matched}人匹配
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#94A3B8]">暂无岗位，点击右上角创建新岗位</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[560px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  新建岗位
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
                    岗位名称 *
                  </label>
                  <input
                    value={newPos.title}
                    onChange={e =>
                      setNewPos({ ...newPos, title: e.target.value })
                    }
                    placeholder="如：高级Java工程师"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    所属公司 *
                  </label>
                  <input
                    value={newPos.company}
                    onChange={e =>
                      setNewPos({ ...newPos, company: e.target.value })
                    }
                    placeholder="如：字节跳动"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    部门
                  </label>
                  <input
                    value={newPos.department}
                    onChange={e =>
                      setNewPos({ ...newPos, department: e.target.value })
                    }
                    placeholder="如：技术部"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    岗位描述
                  </label>
                  <textarea
                    value={newPos.description}
                    onChange={e =>
                      setNewPos({ ...newPos, description: e.target.value })
                    }
                    rows={3}
                    placeholder="JD 详细描述..."
                    className="w-full p-3 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    必备技能（逗号分隔）
                  </label>
                  <input
                    value={newPos.requiredSkills}
                    onChange={e =>
                      setNewPos({ ...newPos, requiredSkills: e.target.value })
                    }
                    placeholder="Java, Spring Cloud, Redis"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    加分技能（逗号分隔）
                  </label>
                  <input
                    value={newPos.bonusSkills}
                    onChange={e =>
                      setNewPos({ ...newPos, bonusSkills: e.target.value })
                    }
                    placeholder="Docker, Kubernetes"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最低经验（年）
                    </label>
                    <input
                      type="number"
                      value={newPos.minExperience}
                      onChange={e =>
                        setNewPos({ ...newPos, minExperience: e.target.value })
                      }
                      placeholder="3"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最高经验（年）
                    </label>
                    <input
                      type="number"
                      value={newPos.maxExperience}
                      onChange={e =>
                        setNewPos({ ...newPos, maxExperience: e.target.value })
                      }
                      placeholder="5"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最低月薪（元）
                    </label>
                    <input
                      type="number"
                      value={newPos.salaryMin}
                      onChange={e =>
                        setNewPos({ ...newPos, salaryMin: e.target.value })
                      }
                      placeholder="40000"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最高月薪（元）
                    </label>
                    <input
                      type="number"
                      value={newPos.salaryMax}
                      onChange={e =>
                        setNewPos({ ...newPos, salaryMax: e.target.value })
                      }
                      placeholder="55000"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={
                    !newPos.title || !newPos.company || createMutation.isPending
                  }
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? "创建中..." : "创建岗位"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPos && !editMode && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedPos(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1E293B]">
                      {selectedPos.title}
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      {selectedPos.company}
                      {selectedPos.department
                        ? ` · ${selectedPos.department}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4 text-[#475569]" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-[#FF5A65]" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPos(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: statusColors[selectedPos.status]?.bg,
                    color: statusColors[selectedPos.status]?.text,
                  }}
                >
                  {statusLabel[selectedPos.status] || selectedPos.status}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  创建于{" "}
                  {new Date(selectedPos.createdAt).toLocaleDateString("zh-CN")}
                </span>
                {matchCounts[selectedPos.id] && (
                  <button
                    onClick={() => {
                      setMatchPositionId(selectedPos.id);
                      setShowMatchModal(true);
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#2D8FF0]/10 text-[#2D8FF0] hover:bg-[#2D8FF0]/20 transition-colors flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    {matchCounts[selectedPos.id].matched}人匹配
                  </button>
                )}
              </div>

              {selectedPos.description && (
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-[#1E293B] mb-2">
                    岗位描述
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed bg-slate-50 rounded-xl p-4">
                    {selectedPos.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-5">
                {(selectedPos.minExperience != null ||
                  selectedPos.maxExperience != null) && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-[#2D8FF0]" />
                      <span className="text-xs text-[#94A3B8]">经验要求</span>
                    </div>
                    <p className="text-sm font-semibold text-[#1E293B]">
                      {selectedPos.minExperience ?? 0} -{" "}
                      {selectedPos.maxExperience ?? "?"} 年
                    </p>
                  </div>
                )}
                {(selectedPos.salaryMin != null ||
                  selectedPos.salaryMax != null) && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-[#06D6A0]" />
                      <span className="text-xs text-[#94A3B8]">薪资范围</span>
                    </div>
                    <p className="text-sm font-semibold text-[#1E293B]">
                      {((selectedPos.salaryMin ?? 0) / 1000).toFixed(0)}k -{" "}
                      {((selectedPos.salaryMax ?? 0) / 1000).toFixed(0)}k / 月
                    </p>
                  </div>
                )}
              </div>

              {Array.isArray(selectedPos.requiredSkills) &&
                selectedPos.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-[#1E293B] mb-2 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#2D8FF0]" />
                      必备技能
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPos.requiredSkills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-[#2D8FF0]/8 text-[#2D8FF0] rounded-lg text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {Array.isArray(selectedPos.bonusSkills) &&
                selectedPos.bonusSkills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-[#1E293B] mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                      加分技能
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPos.bonusSkills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-[#F59E0B]/8 text-[#F59E0B] rounded-lg text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {selectedPos && editMode && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setEditMode(false);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  编辑岗位
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    岗位状态
                  </label>
                  <select
                    value={editForm.status}
                    onChange={e =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  >
                    <option value="active">招聘中</option>
                    <option value="paused">暂停</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    岗位名称 *
                  </label>
                  <input
                    value={editForm.title}
                    onChange={e =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    所属公司 *
                  </label>
                  <input
                    value={editForm.company}
                    onChange={e =>
                      setEditForm({ ...editForm, company: e.target.value })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    部门
                  </label>
                  <input
                    value={editForm.department}
                    onChange={e =>
                      setEditForm({ ...editForm, department: e.target.value })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    岗位描述
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={e =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                    className="w-full p-3 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    必备技能（逗号分隔）
                  </label>
                  <input
                    value={editForm.requiredSkills}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        requiredSkills: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    加分技能（逗号分隔）
                  </label>
                  <input
                    value={editForm.bonusSkills}
                    onChange={e =>
                      setEditForm({ ...editForm, bonusSkills: e.target.value })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最低经验（年）
                    </label>
                    <input
                      type="number"
                      value={editForm.minExperience}
                      onChange={e =>
                        setEditForm({
                          ...editForm,
                          minExperience: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最高经验（年）
                    </label>
                    <input
                      type="number"
                      value={editForm.maxExperience}
                      onChange={e =>
                        setEditForm({
                          ...editForm,
                          maxExperience: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最低月薪（元）
                    </label>
                    <input
                      type="number"
                      value={editForm.salaryMin}
                      onChange={e =>
                        setEditForm({ ...editForm, salaryMin: e.target.value })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      最高月薪（元）
                    </label>
                    <input
                      type="number"
                      value={editForm.salaryMax}
                      onChange={e =>
                        setEditForm({ ...editForm, salaryMax: e.target.value })
                      }
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? "保存中..." : "保存修改"}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMatchModal && matchPositionId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setShowMatchModal(false);
              setMatchPositionId(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1E293B]">
                      候选人匹配
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      {matchResult?.positionTitle
                        ? `${matchResult.positionTitle} · `
                        : ""}
                      {matchPending
                        ? "计算中..."
                        : `${matchResult?.matched ?? 0} 人匹配 / ${matchResult?.total ?? 0} 人总计`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    setMatchPositionId(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {matchPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#2D8FF0] animate-spin mb-3" />
                  <p className="text-sm text-[#94A3B8]">正在计算匹配度...</p>
                </div>
              ) : matchResult && matchResult.candidates.length > 0 ? (
                <div className="space-y-3">
                  {matchResult.candidates.map((c: any) => (
                    <div
                      key={c.candidateId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                            c.level === "S"
                              ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                              : c.level === "A"
                                ? "bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0]"
                                : c.level === "B"
                                  ? "bg-[#2D8FF0]"
                                  : c.level === "C"
                                    ? "bg-[#F59E0B]"
                                    : "bg-[#94A3B8]"
                          }`}
                        >
                          {c.level}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1E293B]">
                            {c.candidateName}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            ID: {c.candidateId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.matchScore >= 75
                                ? "bg-[#06D6A0]"
                                : c.matchScore >= 60
                                  ? "bg-[#2D8FF0]"
                                  : c.matchScore >= 40
                                    ? "bg-[#F59E0B]"
                                    : "bg-[#FF5A65]"
                            }`}
                            style={{ width: `${c.matchScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[#1E293B] w-10 text-right">
                          {c.matchScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-[#94A3B8]">暂无候选人数据</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
