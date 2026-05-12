import { useState, useEffect, useRef } from "react";
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
  X,
  Loader2,
  User,
  Bot,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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
  const [copilotMsg, setCopilotMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const aiChatMutation = trpc.ai.chat.send.useMutation({
    onSuccess: data => {
      setChatHistory(prev => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    },
  });
  const [searchVal, setSearchVal] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: searchResults } = trpc.search.global.useQuery(
    { q: searchVal },
    { enabled: searchVal.length >= 2 }
  );

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const hasResults =
    searchResults &&
    (searchResults.candidates.length > 0 ||
      searchResults.positions.length > 0 ||
      searchResults.interviews.length > 0);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleCopilotSend = (msg: string) => {
    if (!msg.trim() || aiChatMutation.isPending) return;
    const newHistory = [...chatHistory, { role: "user" as const, content: msg }];
    setChatHistory(newHistory);
    setCopilotMsg("");
    aiChatMutation.mutate({
      message: msg,
      history: chatHistory,
    });
  };

  const suggestedQuestions = [
    "对比张明远和李思涵的AI画像差异",
    "生成本月渠道转化率报表",
    "推荐初筛通过率最高的渠道",
    "分析本周面试爽约原因",
  ];

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
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => searchVal.length >= 2 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="搜索候选人、岗位、面试..."
                className="w-full h-9 pl-10 pr-4 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 focus:border-[#2D8FF0]/40 transition-all"
              />
              {searchVal && (
                <button
                  onClick={() => {
                    setSearchVal("");
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {showResults && searchResults && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-2xl border border-slate-200/60 max-h-[400px] overflow-y-auto z-50">
                  {hasResults ? (
                    <div className="py-2">
                      {searchResults.candidates.length > 0 && (
                        <div>
                          <div className="px-4 py-1.5 text-xs font-medium text-[#94A3B8] uppercase">
                            候选人
                          </div>
                          {searchResults.candidates.map((c: any) => (
                            <button
                              key={`c-${c.id}`}
                              onMouseDown={() => {
                                setSearchVal("");
                                setShowResults(false);
                                navigate("/talent");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {c.name?.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1E293B] truncate">
                                  {c.name}
                                </p>
                                <p className="text-xs text-[#94A3B8] truncate">
                                  {c.position} · {c.company}
                                </p>
                              </div>
                              {c.matchScore && (
                                <span className="text-xs font-semibold text-[#2D8FF0]">
                                  {c.matchScore}%
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.positions.length > 0 && (
                        <div>
                          <div className="px-4 py-1.5 text-xs font-medium text-[#94A3B8] uppercase">
                            岗位
                          </div>
                          {searchResults.positions.map((p: any) => (
                            <button
                              key={`p-${p.id}`}
                              onMouseDown={() => {
                                setSearchVal("");
                                setShowResults(false);
                                navigate("/positions");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#2D8FF0]/10 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-4 h-4 text-[#2D8FF0]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1E293B] truncate">
                                  {p.title}
                                </p>
                                <p className="text-xs text-[#94A3B8] truncate">
                                  {p.company}
                                  {p.department ? ` · ${p.department}` : ""}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.interviews.length > 0 && (
                        <div>
                          <div className="px-4 py-1.5 text-xs font-medium text-[#94A3B8] uppercase">
                            面试
                          </div>
                          {searchResults.interviews.map((iv: any) => (
                            <button
                              key={`iv-${iv.id}`}
                              onMouseDown={() => {
                                setSearchVal("");
                                setShowResults(false);
                                navigate("/interviews");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
                                <Route className="w-4 h-4 text-[#8B5CF6]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1E293B] truncate">
                                  {iv.stage} · 候选人#{iv.candidateId}
                                </p>
                                <p className="text-xs text-[#94A3B8] truncate">
                                  {iv.interviewer} · {iv.status}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-[#94A3B8]">
                      未找到匹配结果
                    </div>
                  )}
                </div>
              )}
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
                {currentUser && typeof currentUser === "object" ? currentUser.name.charAt(0) : "?"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-[#1E293B]">
                  {currentUser && typeof currentUser === "object" ? currentUser.name : "未登录"}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {currentUser && typeof currentUser === "object" && currentUser.role === "admin" ? "招聘总监" : "招聘专员"}
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
          className="fixed right-0 top-[60px] bottom-0 z-[60] bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-slate-200/60 transition-all duration-300 flex flex-col"
          style={{
            width: 420,
            left: collapsed ? 72 : 240,
          }}
        >
          <div className="px-5 py-4 border-b border-slate-200/60 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[#1E293B]">AI 招聘助手</span>
            </div>
            <button
              onClick={() => setShowCopilot(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#1E293B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.length === 0 ? (
              <>
                <div className="bg-gradient-to-br from-[#2D8FF0]/5 to-[#06D6A0]/5 rounded-2xl p-4 border border-[#2D8FF0]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-[#1E293B]">
                      AI 招聘助手
                    </span>
                  </div>
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
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopilotSend(q)}
                      disabled={aiChatMutation.isPending}
                      className="w-full text-left p-3 rounded-xl border border-slate-200/60 hover:border-[#2D8FF0]/30 hover:bg-[#2D8FF0]/5 transition-all text-sm text-[#475569] disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#2D8FF0] text-white rounded-br-md"
                          : "bg-slate-100 text-[#1E293B] rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {aiChatMutation.isPending && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-slate-100">
                      <Loader2 className="w-4 h-4 text-[#2D8FF0] animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          <div className="p-4 border-t border-slate-200/60 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={copilotMsg}
                onChange={e => setCopilotMsg(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleCopilotSend(copilotMsg);
                }}
                placeholder="输入你的问题..."
                disabled={aiChatMutation.isPending}
                className="w-full h-10 pl-4 pr-10 bg-slate-100 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 disabled:opacity-50"
              />
              <button
                onClick={() => handleCopilotSend(copilotMsg)}
                disabled={aiChatMutation.isPending || !copilotMsg.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-[#2D8FF0] flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                {aiChatMutation.isPending ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
