"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  User,
  Phone,
  Target,
  Upload,
  Settings,
  LogOut,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/providers";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navigation: Record<string, NavItem[]> = {
  executive: [
    { name: "Обзор", href: "/executive", icon: LayoutDashboard, roles: ["ceo", "sales_director", "admin"] },
    { name: "Тренды", href: "/executive/trends", icon: TrendingUp, roles: ["ceo", "sales_director", "admin"] },
  ],
  team: [
    { name: "Команда", href: "/team", icon: Users, roles: ["ceo", "sales_director", "rop", "admin"] },
    { name: "Лидерборд", href: "/team/leaderboard", icon: Trophy, roles: ["ceo", "sales_director", "rop", "admin"] },
    { name: "Коучинг", href: "/team/coaching", icon: Target, roles: ["ceo", "sales_director", "rop", "admin"] },
  ],
  personal: [
    { name: "Мой дашборд", href: "/my", icon: User, roles: ["manager", "rop", "admin"] },
    { name: "Мои звонки", href: "/my/calls", icon: Phone, roles: ["manager", "rop", "admin"] },
    { name: "Зоны роста", href: "/my/growth", icon: Target, roles: ["manager", "rop", "admin"] },
  ],
  analytics: [
    { name: "Аналитика", href: "/analytics", icon: BarChart3 },
    { name: "Инсайты", href: "/analytics/insights", icon: Sparkles },
  ],
  admin: [
    { name: "Загрузка данных", href: "/admin/upload", icon: Upload, roles: ["admin"] },
    { name: "Настройки", href: "/admin/settings", icon: Settings, roles: ["admin"] },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filterByRole = (items: NavItem[]) => {
    if (!user) return [];
    return items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user.role);
    });
  };

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => {
    const filteredItems = filterByRole(items);
    if (filteredItems.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        <nav className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "sidebar-link",
                  isActive && "active"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Spellit</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <NavSection title="Руководство" items={navigation.executive} />
        <NavSection title="Команда" items={navigation.team} />
        <NavSection title="Личное" items={navigation.personal} />
        <NavSection title="Аналитика" items={navigation.analytics} />
        <NavSection title="Администрирование" items={navigation.admin} />
      </div>

      {/* User info & Logout */}
      {user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </aside>
  );
}
