import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Building2,
  Briefcase,
  Route,
  UserCircle,
  FileCheck,
  BarChart3,
  Bell,
  Search,
  LogOut,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const navItems = [
  { key: "/", label: "总览", icon: LayoutDashboard },
  { key: "/talent", label: "人才库", icon: Users },
  { key: "/relations", label: "公司关联", icon: GitBranch },
  { key: "/positions", label: "岗位管理", icon: Briefcase },
  { key: "/channels", label: "渠道管理", icon: Building2 },
  { key: "/interviews", label: "面试流程", icon: Route },
  { key: "/profiles", label: "人才画像", icon: UserCircle },
  { key: "/offers", label: "Offer管理", icon: FileCheck },
  { key: "/analytics", label: "数据分析", icon: BarChart3 },
  { key: "/alerts", label: "预警监控", icon: ShieldAlert },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const activeKey = location.pathname;
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: alertsData } = trpc.alert.list.useQuery(undefined, {
    staleTime: 30000,
  });
  const unreadAlerts = alertsData?.filter(a => !a.isRead).length ?? 0;
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  useEffect(() => {
    setShowCopilot(false);
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-[#F4F6FA] flex">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300"
        style={{
          width: collapsed ? 72 : 240,
          background: "rgba(10, 15, 28, 0.95)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="ml-3 text-white font-semibold text-[15px] tracking-tight truncate">
              智聘云图
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-[#2D8FF0]/15 text-[#2D8FF0]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-[#2D8FF0]" : ""}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1 h-4 rounded-full bg-[#2D8FF0]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
            {!collapsed && <span>收起菜单</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: collapsed ? 72 : 240 }}
      >
        {/* Top Bar */}
        <header className="h-[60px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-40">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="AI 智能搜索：输入职位、技能或自然语言查询..."
                className="w-full h-9 pl-10 pr-4 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 focus:border-[#2D8FF0]/40 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              onClick={() => navigate("/alerts")}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-[18px] h-[18px] text-[#475569]" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF5A65] text-white text-[10px] flex items-center justify-center font-medium">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* Copilot */}
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#2D8FF0]/10 to-[#06D6A0]/10 hover:from-[#2D8FF0]/20 hover:to-[#06D6A0]/20 transition-all"
            >
              <Sparkles className="w-[18px] h-[18px] text-[#2D8FF0]" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-medium">
                {currentUser?.name?.charAt(0) || "?"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-[#1E293B]">
                  {currentUser?.name || "未登录"}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {currentUser?.role === "admin" ? "招聘总监" : "招聘专员"}
                </p>
              </div>
            </div>

            <button
              onClick={() => logoutMutation.mutate()}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Copilot Panel */}
      {showCopilot && (
        <div
          className="fixed right-0 top-[60px] bottom-0 z-[60] bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-slate-200/60 transition-all duration-300"
          style={{ width: 420, left: collapsed ? 72 : 240 }}
        >
          <div className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-[#1E293B]">
                  AI 招聘助手
                </span>
              </div>
              <button
                onClick={() => setShowCopilot(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#1E293B]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm text-[#475569]">
                  你好！我是你的AI招聘助手。我可以帮你：
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-[#475569]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D8FF0]" />
                    智能匹配候选人
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]" />
                    生成招聘数据报表
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A65]" />
                    分析渠道转化效率
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    预警人才流失风险
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                {[
                  "对比张明远和李思涵的AI画像差异",
                  "生成本月渠道转化率报表",
                  "推荐初筛通过率最高的渠道",
                  "分析本周面试爽约原因",
                ].map((q, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-3 rounded-xl border border-slate-200/60 hover:border-[#2D8FF0]/30 hover:bg-[#2D8FF0]/5 transition-all text-sm text-[#475569]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200/60">
              <div className="relative">
                <input
                  type="text"
                  placeholder="输入你的问题..."
                  className="w-full h-10 pl-4 pr-10 bg-slate-100 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-[#2D8FF0] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
