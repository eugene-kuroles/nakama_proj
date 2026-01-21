"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProject } from "@/app/providers";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  User,
  ChevronDown,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Manager {
  id: number;
  name: string;
  avg_score?: number;
  total_calls?: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { projectId } = useProject();
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);

  // Fetch managers list for dropdown
  const { data: managersData } = useQuery({
    queryKey: ["team-leaderboard", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const params = new URLSearchParams({ project_id: String(projectId) });
      return api.get<{
        managers: Manager[];
        team_avg: number;
      }>(`/analytics/team/leaderboard?${params}`);
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const managers = managersData?.managers || [];

  // Get current tab based on pathname
  const getCurrentTab = () => {
    if (pathname.startsWith("/executive")) return "executive";
    if (pathname.startsWith("/team")) return "team";
    if (pathname.startsWith("/my") || pathname.startsWith("/manager")) return "manager";
    if (pathname.startsWith("/call")) return "call";
    return "executive";
  };

  const currentTab = getCurrentTab();

  // Get selected manager name
  const selectedManager = managers.find(m => m.id === selectedManagerId);
  const managerDisplayName = selectedManager?.name || "Выбрать менеджера";

  // Handle manager selection
  const handleManagerSelect = (managerId: number) => {
    setSelectedManagerId(managerId);
    router.push(`/manager/${managerId}`);
  };

  // Tabs configuration
  const tabs = [
    { 
      id: "executive", 
      label: "CEO", 
      icon: LayoutDashboard, 
      href: "/executive",
      description: "Executive Overview"
    },
    { 
      id: "team", 
      label: "РОП", 
      icon: Users, 
      href: "/team",
      description: "Team Performance"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header with tabs */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-semibold text-white hidden sm:block">
                Spellit Analytics
              </span>
            </Link>

            {/* Main Tabs */}
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Link>
                );
              })}

              {/* Manager Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      currentTab === "manager"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {currentTab === "manager" && selectedManager 
                        ? selectedManager.name.split(" ")[0] 
                        : "Менеджер"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 max-h-[400px] overflow-y-auto bg-slate-800 border-slate-700"
                >
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">
                    Выберите менеджера
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {managers.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-500 text-center">
                      Нет данных о менеджерах
                    </div>
                  ) : (
                    managers.map((manager) => (
                      <DropdownMenuItem
                        key={manager.id}
                        onClick={() => handleManagerSelect(manager.id)}
                        className={cn(
                          "cursor-pointer px-3 py-2",
                          selectedManagerId === manager.id 
                            ? "bg-blue-600/20 text-blue-400" 
                            : "text-slate-300 hover:bg-slate-700"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white">
                              {manager.name.charAt(0)}
                            </div>
                            <span className="truncate">{manager.name}</span>
                          </div>
                          {manager.avg_score !== undefined && (
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded",
                              manager.avg_score >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                              manager.avg_score >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            )}>
                              {Math.round(manager.avg_score)}%
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/my" 
                      className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      <span>Мой кабинет</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
