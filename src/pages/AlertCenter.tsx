import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bell,
  Clock,
  Zap,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";

const alertConfig: Record<
  string,
  { icon: typeof AlertTriangle; color: string; label: string; bg: string }
> = {
  risk: {
    icon: AlertTriangle,
    color: "#FF5A65",
    label: "高风险",
    bg: "#FEE2E2",
  },
  warning: {
    icon: AlertCircle,
    color: "#F59E0B",
    label: "警告",
    bg: "#FEF3C7",
  },
  info: { icon: Info, color: "#2D8FF0", label: "提醒", bg: "#DBEAFE" },
  success: {
    icon: CheckCircle2,
    color: "#06D6A0",
    label: "成功",
    bg: "#D1FAE5",
  },
};

export default function AlertCenter() {
  const navigate = useNavigate();
  const { data: alertList = [] } = trpc.alert.list.useQuery();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const markReadMutation = trpc.alert.markRead.useMutation();
  const markAllReadMutation = trpc.alert.markAllRead.useMutation();
  const createMutation = trpc.alert.create.useMutation();
  const deleteMutation = trpc.alert.delete.useMutation();
  const executeActionMutation = trpc.alert.executeAction.useMutation();
  const autoGenerateMutation = trpc.alert.autoGenerate.useMutation();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState("全部");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: "info" as "risk" | "warning" | "info" | "success",
    title: "",
    description: "",
    candidateId: "",
    action: "",
  });

  const isAdmin = currentUser?.role === "admin";

  const filtered =
    filter === "全部"
      ? alertList
      : alertList.filter((a: any) => a.type === filter);

  const unreadCount = alertList.filter((a: any) => !a.isRead).length;
  const riskCount = alertList.filter((a: any) => a.type === "risk").length;
  const warningCount = alertList.filter(
    (a: any) => a.type === "warning"
  ).length;

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(id, {
      onSuccess: () => utils.alert.list.invalidate(),
    });
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => utils.alert.list.invalidate(),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定删除此预警？")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          utils.alert.list.invalidate();
          setSelectedAlert(null);
        },
      });
    }
  };

  const handleAction = (alert: any) => {
    executeActionMutation.mutate(alert.id, {
      onSuccess: result => {
        utils.alert.list.invalidate();
        if (result.candidateId) {
          navigate(`/talent`);
        }
        setSelectedAlert(null);
      },
    });
  };

  const handleCreate = () => {
    if (!newAlert.title) return;
    createMutation.mutate(
      {
        type: newAlert.type,
        title: newAlert.title,
        description: newAlert.description || undefined,
        candidateId: newAlert.candidateId
          ? Number(newAlert.candidateId)
          : undefined,
        action: newAlert.action || undefined,
      },
      {
        onSuccess: () => {
          utils.alert.list.invalidate();
          setShowCreate(false);
          setNewAlert({
            type: "info",
            title: "",
            description: "",
            candidateId: "",
            action: "",
          });
        },
      }
    );
  };

  const getActionLabel = (action: string | null) => {
    if (!action) return null;
    const labels: Record<string, string> = {
      联系候选人: "联系候选人",
      调整Offer: "调整Offer",
      安排面试: "安排面试",
      跟进沟通: "跟进沟通",
      查看详情: "查看详情",
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">预警监控</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            AI智能预警与风险监控中心
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5A6508] rounded-lg">
            <AlertTriangle className="w-4 h-4 text-[#FF5A65]" />
            <span className="text-sm font-semibold text-[#FF5A65]">
              {riskCount} 高风险
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F59E0B08] rounded-lg">
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-semibold text-[#F59E0B]">
              {warningCount} 警告
            </span>
          </div>
          {isAdmin && (
            <>
              <button
                onClick={() => setShowCreate(true)}
                className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                新建预警
              </button>
              <button
                onClick={() => {
                  autoGenerateMutation.mutate(undefined, {
                    onSuccess: result => {
                      utils.alert.list.invalidate();
                      if (result.generated > 0) {
                        alert(`已自动生成 ${result.generated} 条预警`);
                      } else {
                        alert("当前无需生成新预警");
                      }
                    },
                  });
                }}
                disabled={autoGenerateMutation.isPending}
                className="h-9 px-4 bg-[#8B5CF6] text-white rounded-xl text-sm font-medium hover:bg-[#7C3AED] transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Zap className="w-4 h-4" />
                {autoGenerateMutation.isPending ? "生成中..." : "自动生成"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "未读预警",
            value: unreadCount,
            icon: Bell,
            color: "#FF5A65",
          },
          {
            label: "高风险预警",
            value: riskCount,
            icon: ShieldAlert,
            color: "#F59E0B",
          },
          {
            label: "警告事件",
            value: warningCount,
            icon: Zap,
            color: "#8B5CF6",
          },
          {
            label: "总计预警",
            value: alertList.length,
            icon: CheckCircle2,
            color: "#06D6A0",
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/60"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}12` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span className="text-xs text-[#94A3B8]">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#1E293B] font-tabular">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {["全部", "risk", "warning", "info", "success"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-4 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#2D8FF0] text-white"
                  : "bg-white text-[#475569] border border-slate-200/60 hover:bg-slate-50"
              }`}
            >
              {f === "全部" ? "全部" : alertConfig[f]?.label || f}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#475569] hover:text-[#2D8FF0] transition-colors"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
            全部已读
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((alert: any) => {
          const cfg = alertConfig[alert.type ?? "info"];
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md group ${
                !alert.isRead
                  ? alert.type === "risk"
                    ? "border-[#FF5A65]/30 warning-row"
                    : alert.type === "warning"
                      ? "border-[#F59E0B]/30"
                      : "border-slate-200/60"
                  : "border-slate-200/60 opacity-70"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-[#1E293B]">
                      {alert.title}
                    </h3>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#FF5A65] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {typeof alert.createdAt === "string"
                          ? new Date(alert.createdAt).toLocaleDateString(
                              "zh-CN"
                            )
                          : String(alert.createdAt ?? "")}
                      </span>
                      {alert.candidateId && (
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          候选人#{alert.candidateId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.isRead && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#475569] hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          标记已读
                        </button>
                      )}
                      {alert.action && (
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                          style={{ background: cfg.color }}
                        >
                          <Zap className="w-3 h-3" />
                          {getActionLabel(alert.action)}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#FF5A65]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#94A3B8]">暂无预警信息</p>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  新建预警
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
                    预警类型
                  </label>
                  <div className="flex gap-2">
                    {(
                      Object.entries(alertConfig) as [
                        string,
                        (typeof alertConfig)[string],
                      ][]
                    ).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() =>
                          setNewAlert({ ...newAlert, type: key as any })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          newAlert.type === key
                            ? "text-white"
                            : "bg-slate-100 text-[#475569] hover:bg-slate-200"
                        }`}
                        style={
                          newAlert.type === key ? { background: cfg.color } : {}
                        }
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    标题 *
                  </label>
                  <input
                    value={newAlert.title}
                    onChange={e =>
                      setNewAlert({ ...newAlert, title: e.target.value })
                    }
                    placeholder="如：候选人流失风险预警"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    描述
                  </label>
                  <textarea
                    value={newAlert.description}
                    onChange={e =>
                      setNewAlert({ ...newAlert, description: e.target.value })
                    }
                    rows={3}
                    placeholder="预警详细说明..."
                    className="w-full p-3 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      关联候选人ID
                    </label>
                    <input
                      type="number"
                      value={newAlert.candidateId}
                      onChange={e =>
                        setNewAlert({
                          ...newAlert,
                          candidateId: e.target.value,
                        })
                      }
                      placeholder="可选"
                      className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                      操作按钮
                    </label>
                    <select
                      value={newAlert.action}
                      onChange={e =>
                        setNewAlert({ ...newAlert, action: e.target.value })
                      }
                      className="w-full h-10 px-3 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                    >
                      <option value="">无操作</option>
                      <option value="联系候选人">联系候选人</option>
                      <option value="调整Offer">调整Offer</option>
                      <option value="安排面试">安排面试</option>
                      <option value="跟进沟通">跟进沟通</option>
                      <option value="查看详情">查看详情</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={!newAlert.title || createMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  创建预警
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

      {/* Action Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedAlert(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const cfg = alertConfig[selectedAlert.type ?? "info"];
                    const Icon = cfg.icon;
                    return (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: cfg.bg }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: cfg.color }}
                        />
                      </div>
                    );
                  })()}
                  <h2 className="text-lg font-semibold text-[#1E293B]">
                    {selectedAlert.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                {selectedAlert.description}
              </p>

              {selectedAlert.candidateId && (
                <div className="p-4 bg-slate-50 rounded-xl mb-6">
                  <h3 className="text-sm font-medium text-[#1E293B] mb-2">
                    关联候选人与建议操作
                  </h3>
                  <p className="text-sm text-[#475569] mb-3">
                    候选人ID:{" "}
                    <span className="font-medium text-[#1E293B]">
                      #{selectedAlert.candidateId}
                    </span>
                  </p>
                  {selectedAlert.type === "risk" && (
                    <p className="text-sm text-[#FF5A65] bg-[#FF5A65]/5 rounded-lg p-3">
                      高风险预警：建议立即联系该候选人了解最新意向，必要时调整薪资方案或加快面试流程。
                    </p>
                  )}
                  {selectedAlert.type === "warning" && (
                    <p className="text-sm text-[#F59E0B] bg-[#F59E0B]/5 rounded-lg p-3">
                      需关注：该候选人在关键流程节点，请及时跟进避免流失。
                    </p>
                  )}
                  {selectedAlert.type === "info" && (
                    <p className="text-sm text-[#2D8FF0] bg-[#2D8FF0]/5 rounded-lg p-3">
                      信息提醒：可查看候选人详情了解更多。
                    </p>
                  )}
                  {selectedAlert.type === "success" && (
                    <p className="text-sm text-[#06D6A0] bg-[#06D6A0]/5 rounded-lg p-3">
                      好消息：该候选人进展顺利，建议尽快推进下一阶段。
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(selectedAlert)}
                  disabled={executeActionMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {executeActionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {executeActionMutation.isPending
                    ? "处理中..."
                    : getActionLabel(selectedAlert.action) || "执行操作"}
                </button>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  稍后处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
