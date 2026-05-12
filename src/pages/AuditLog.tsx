import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Shield,
  Clock,
  User,
  FileText,
  Users,
  Calendar,
  Briefcase,
  Tag,
  Bell,
  FileSpreadsheet,
  ChevronRight,
  Search,
  RefreshCw,
} from "lucide-react";

const entityConfig: Record<
  string,
  { icon: typeof Shield; label: string; color: string }
> = {
  candidate: { icon: Users, label: "候选人", color: "#2D8FF0" },
  interview: { icon: Calendar, label: "面试", color: "#8B5CF6" },
  offer: { icon: FileText, label: "Offer", color: "#F59E0B" },
  position: { icon: Briefcase, label: "岗位", color: "#10B981" },
  channel: { icon: Tag, label: "渠道", color: "#EC4899" },
  alert: { icon: Bell, label: "预警", color: "#FF5A65" },
};

const actionConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  create: { label: "创建", color: "#10B981", bg: "#D1FAE5" },
  update: { label: "更新", color: "#2D8FF0", bg: "#DBEAFE" },
  delete: { label: "删除", color: "#FF5A65", bg: "#FEE2E2" },
};

export function AuditLog() {
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.auditLog.list.useQuery({
    entityType: entityFilter || undefined,
    page,
    pageSize: 20,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
          <p className="text-sm text-gray-500 mt-1">
            记录所有数据变更操作，追溯责任人
          </p>
        </div>
        <button
          onClick={() => {
            setPage(1);
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setEntityFilter("")}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            !entityFilter
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          全部
        </button>
        {Object.entries(entityConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setEntityFilter(key)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
                entityFilter === key
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={
                entityFilter === key
                  ? { backgroundColor: cfg.color }
                  : undefined
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : !data?.items?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Shield className="w-12 h-12 mb-3" />
            <p className="text-sm">暂无操作记录</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    操作
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    类型
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    操作人
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                    变更内容
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                    时间
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log: any) => {
                  const entity = entityConfig[log.entityType];
                  const act = actionConfig[log.action];
                  const EntityIcon = entity?.icon || FileText;
                  const changes = log.changes
                    ? (Object.entries(log.changes) as [
                        string,
                        { old: unknown; new: unknown },
                      ][])
                    : [];

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium"
                          style={{
                            color: act?.color,
                            backgroundColor: act?.bg,
                          }}
                        >
                          {act?.label || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: entity?.color }}
                        >
                          <EntityIcon className="w-3.5 h-3.5" />
                          {entity?.label || log.entityType}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        #{log.entityId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {log.userName || "系统"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {changes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {changes.slice(0, 3).map(([key, val]) => (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded"
                              >
                                {key}:
                                <span className="text-gray-400 line-through text-[10px]">
                                  {String(val.old ?? "—").slice(0, 15)}
                                </span>
                                <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                                <span className="font-medium">
                                  {String(val.new ?? "—").slice(0, 15)}
                                </span>
                              </span>
                            ))}
                            {changes.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{changes.length - 3}项
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                共 {data.total} 条记录
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-white"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= data.total}
                  className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-white"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
