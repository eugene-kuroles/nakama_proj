"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { BarChart3, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      
      // Redirect based on user role
      const role = userData?.role || 'manager';
      switch (role) {
        case 'ceo':
        case 'admin':
          router.push("/executive");
          break;
        case 'rop':
        case 'sales_director':
          router.push("/team");
          break;
        case 'manager':
        default:
          router.push("/my");
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Spellit</h1>
              <p className="text-sm text-blue-200">Analytics</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              Добро пожаловать
            </h2>
            <p className="text-slate-300">
              Войдите в систему аналитики
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Вход...</span>
                </>
              ) : (
                <span>Войти</span>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
            <p className="text-sm text-blue-200 text-center">
              <strong>CEO:</strong> testceo@spellit.ai / ceo123
            </p>
            <p className="text-sm text-blue-200 text-center">
              <strong>РОП:</strong> testrop@spellit.ai / rop123
            </p>
            <p className="text-sm text-blue-200 text-center">
              <strong>Менеджер:</strong> testman@spellit.ai / man123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          © 2026 Spellit Analytics. Все права защищены.
        </p>
      </div>
    </div>
  );
}
