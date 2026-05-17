import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Sparkles, ShieldCheck } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: err => {
      setError(err.message || "登录失败，请检查用户名和密码");
      setLoading(false);
    },
  });

  // 如果已登录直接跳转
  const { data: me } = trpc.auth.me.useQuery();
  useEffect(() => {
    if (me) {
      navigate("/", { replace: true });
    }
  }, [me, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D8FF0] to-[#06D6A0] mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">智聘云图</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            AI 驱动的人才招聘管理平台
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-lg shadow-slate-200/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 focus:border-[#2D8FF0]/40 transition-all"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full h-10 px-3.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D8FF0]/20 focus:border-[#2D8FF0]/40 transition-all"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#FF5A6508] border border-[#FF5A6515] rounded-xl text-sm text-[#FF5A65]">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#2D8FF0] to-[#06D6A0] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-center text-[#94A3B8]">
              请使用管理员分配的账号登录
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
