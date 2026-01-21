'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, BarChart3 } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'detail' in err 
        ? (err as { detail: string }).detail 
        : 'Неверный email или пароль';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-4 text-center pb-8">
          {/* Logo */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Добро пожаловать
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Войдите в систему аналитики звонков
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="h-11"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Пароль
                </Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Забыли пароль?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0"
              />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                Запомнить меня
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 font-medium shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Демо-доступ: <span className="font-mono text-foreground/70">demo@example.com / demo123</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
