import { useState } from "react";
import {
  Search,
  Plus,
  X,
  Shield,
  UserX,
  UserCheck,
  Loader2,
  Key,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const statusOptions = ["全部", "active", "disabled"];

export default function UserManage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    roleIds: [] as number[],
  });
  const [editData, setEditData] = useState({
    name: "",
    roleIds: [] as number[],
    status: "active" as "active" | "disabled",
  });
  const [resetPassword, setResetPassword] = useState("");

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.users.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "全部" ? statusFilter : undefined,
    page,
    pageSize,
  });

  const { data: roleList = [] } = trpc.users.listRoles.useQuery();
  const { data: currentUser } = trpc.auth.me.useQuery();

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreate(false);
      setNewUser({ username: "", password: "", name: "", roleIds: [] });
    },
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowEdit(false);
      setEditingUser(null);
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const resetPwdMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      setShowResetPwd(false);
      setEditingUser(null);
      setResetPassword("");
    },
  });

  const toggleStatus = (userId: number, current: string) => {
    const newStatus = current === "active" ? "disabled" : "active";
    updateMutation.mutate({ id: userId, data: { status: newStatus } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">用户管理</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            共 {total} 个用户 · 本页 {users.length} 个
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建用户
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="搜索用户名或姓名..."
            className="w-full h-9 pl-10 pr-4 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
          />
        </div>
        <div className="flex items-center gap-2">
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#2D8FF0] text-white"
                  : "bg-white text-[#475569] border border-slate-200/60 hover:bg-slate-50"
              }`}
            >
              {s === "全部" ? "全部" : s === "active" ? "启用" : "禁用"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#2D8FF0] animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#94A3B8] uppercase">
                    用户名
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#94A3B8] uppercase">
                    姓名
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#94A3B8] uppercase">
                    角色
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#94A3B8] uppercase">
                    状态
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[#94A3B8] uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u: any) => {
                  const isSelf =
                    currentUser &&
                    typeof currentUser === "object" &&
                    (currentUser as any).id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-semibold">
                            {u.name?.charAt(0) || u.username?.charAt(0) || "?"}
                          </div>
                          <span className="font-medium text-sm text-[#1E293B]">
                            {u.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#475569]">
                        {u.name}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(u.roleLabels ?? [u.role]).map((label: string) => (
                            <span
                              key={label}
                              className="px-2 py-0.5 bg-[#2D8FF0]/8 text-[#2D8FF0] rounded-md text-xs font-medium"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            u.status === "active"
                              ? "bg-[#06D6A0]/10 text-[#06D6A0]"
                              : "bg-[#FF5A65]/10 text-[#FF5A65]"
                          }`}
                        >
                          {u.status === "active" ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <UserX className="w-3 h-3" />
                          )}
                          {u.status === "active" ? "启用" : "禁用"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditData({
                                name: u.name || "",
                                roleIds: u.roleIds ?? [],
                                status: u.status as "active" | "disabled",
                              });
                              setShowEdit(true);
                            }}
                            className="h-7 px-2.5 rounded-lg text-xs font-medium text-[#475569] border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setResetPassword("");
                              setShowResetPwd(true);
                            }}
                            className="h-7 px-2.5 rounded-lg text-xs font-medium text-[#475569] border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1"
                          >
                            <Key className="w-3 h-3" />
                            改密
                          </button>
                          <button
                            onClick={() => toggleStatus(u.id, u.status)}
                            disabled={isSelf || updateMutation.isPending}
                            className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                              u.status === "active"
                                ? "text-amber-600 border border-amber-200 hover:bg-amber-50"
                                : "text-green-600 border border-green-200 hover:bg-green-50"
                            }`}
                            title={u.status === "active" ? "禁用" : "启用"}
                          >
                            {updateMutation.isPending
                              ? "..."
                              : u.status === "active"
                                ? "禁用"
                                : "启用"}
                          </button>
                          <button
                            onClick={() => {
                              if (isSelf) return;
                              if (
                                confirm(
                                  `确认删除用户 ${u.username}？此操作不可恢复。`
                                )
                              ) {
                                deleteMutation.mutate(u.id);
                              }
                            }}
                            disabled={isSelf}
                            className="h-7 px-2.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-[#94A3B8]"
                    >
                      暂无用户数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-[#94A3B8]">
                第 {page} 页，共 {totalPages} 页
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-sm text-[#475569] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === page
                          ? "bg-[#2D8FF0] text-white"
                          : "border border-slate-200 text-[#475569] hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-sm text-[#475569] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[440px]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  创建用户
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    用户名
                  </label>
                  <input
                    value={newUser.username}
                    onChange={e =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    placeholder="字母或数字，至少2位"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    密码
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={e =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    placeholder="至少4位"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    姓名
                  </label>
                  <input
                    value={newUser.name}
                    onChange={e =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder="如：张三"
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    角色
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roleList.map((r: any) => (
                      <button
                        key={r.id}
                        onClick={() =>
                          setNewUser(prev => ({
                            ...prev,
                            roleIds: prev.roleIds.includes(r.id)
                              ? prev.roleIds.filter(id => id !== r.id)
                              : [...prev.roleIds, r.id],
                          }))
                        }
                        className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                          newUser.roleIds.includes(r.id)
                            ? "bg-[#2D8FF0] text-white"
                            : "bg-slate-100 text-[#475569] hover:bg-slate-200"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (
                      !newUser.username ||
                      !newUser.password ||
                      !newUser.name ||
                      newUser.roleIds.length === 0
                    ) {
                      alert("请填写所有字段并选择至少一个角色");
                      return;
                    }
                    createMutation.mutate(newUser);
                  }}
                  disabled={createMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40"
                >
                  {createMutation.isPending ? "创建中..." : "创建用户"}
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

      {/* Edit Modal */}
      {showEdit && editingUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowEdit(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[440px]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  编辑用户
                </h2>
                <button
                  onClick={() => setShowEdit(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    用户名
                  </label>
                  <input
                    value={editingUser.username}
                    disabled
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    姓名
                  </label>
                  <input
                    value={editData.name}
                    onChange={e =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    角色
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roleList.map((r: any) => (
                      <button
                        key={r.id}
                        onClick={() =>
                          setEditData(prev => ({
                            ...prev,
                            roleIds: prev.roleIds.includes(r.id)
                              ? prev.roleIds.filter(id => id !== r.id)
                              : [...prev.roleIds, r.id],
                          }))
                        }
                        className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                          editData.roleIds.includes(r.id)
                            ? "bg-[#2D8FF0] text-white"
                            : "bg-slate-100 text-[#475569] hover:bg-slate-200"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                    状态
                  </label>
                  <div className="flex gap-2">
                    {(["active", "disabled"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setEditData({ ...editData, status: s })}
                        className={`h-8 px-4 rounded-lg text-xs font-medium transition-colors ${
                          editData.status === s
                            ? s === "active"
                              ? "bg-[#06D6A0] text-white"
                              : "bg-[#FF5A65] text-white"
                            : "bg-slate-100 text-[#475569] hover:bg-slate-200"
                        }`}
                      >
                        {s === "active" ? "启用" : "禁用"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (!editData.name || editData.roleIds.length === 0) {
                      alert("请填写姓名并选择至少一个角色");
                      return;
                    }
                    updateMutation.mutate({
                      id: editingUser.id,
                      data: editData,
                    });
                  }}
                  disabled={updateMutation.isPending}
                  className="flex-1 h-10 bg-[#2D8FF0] text-white rounded-xl text-sm font-medium hover:bg-[#1a7de0] transition-colors disabled:opacity-40"
                >
                  {updateMutation.isPending ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={() => setShowEdit(false)}
                  className="flex-1 h-10 border border-slate-200 text-[#475569] rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPwd && editingUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowResetPwd(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[400px]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  重置密码
                </h2>
                <button
                  onClick={() => setShowResetPwd(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#94A3B8] mb-4">
                为用户{" "}
                <strong className="text-[#1E293B]">
                  {editingUser.username}
                </strong>{" "}
                设置新密码
              </p>
              <div>
                <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                  新密码
                </label>
                <input
                  type="text"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="至少4位"
                  className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (resetPassword.length < 4) {
                      alert("密码至少4位");
                      return;
                    }
                    resetPwdMutation.mutate({
                      userId: editingUser.id,
                      newPassword: resetPassword,
                    });
                  }}
                  disabled={resetPwdMutation.isPending}
                  className="flex-1 h-10 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40"
                >
                  {resetPwdMutation.isPending ? "重置中..." : "确认重置"}
                </button>
                <button
                  onClick={() => setShowResetPwd(false)}
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
  );
}
