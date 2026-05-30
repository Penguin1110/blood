import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { adminLogin } from "@/api";
import { useAdmin } from "@/context/AdminContext";

export function AdminLogin() {
  const { admin, setAdmin } = useAdmin();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (admin) return <Navigate to="/admin/donations" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("請輸入管理員帳號與密碼");
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminLogin({ username: username.trim(), password });
      setAdmin(res.admin);
      navigate("/admin/donations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">管理員登入</h1>
          <p className="text-slate-500 font-medium mt-2">捐血紀錄審核後台</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">管理員帳號</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-rose-400"
              placeholder="admin1@blood.local"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">密碼</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-rose-400"
                placeholder="請輸入密碼"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-500 text-white font-bold py-3 rounded-2xl hover:bg-rose-600 transition-colors disabled:opacity-60"
          >
            {isLoading ? "登入中…" : "登入審核後台"}
          </button>

          <Link
            to="/login"
            className="block text-center text-sm font-bold text-slate-500 hover:text-rose-500"
          >
            返回一般使用者登入
          </Link>
        </form>
      </div>
    </div>
  );
}
