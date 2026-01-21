"use client";

import { useState } from "react";
import { PeriodFilter } from "@/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Scorecards } from "@/components/dashboard/Scorecards";
import { CoachingPlan } from "@/components/dashboard/CoachingPlan";
import { CoachingQueue } from "@/components/dashboard/CoachingQueue";
import { useTeamLeaderboard } from "@/hooks/useAnalytics";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  AlertCircle, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Target 
} from "lucide-react";

export default function TeamDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const router = useRouter();

  // Calculate date range based on period
  const getDateRange = () => {
    const dataYear = 2025;
    let dateFrom: string;
    let dateTo: string = `${dataYear}-12-31`;
    
    switch (period) {
      case "week":
        dateFrom = `${dataYear}-12-11`;
        dateTo = `${dataYear}-12-18`;
        break;
      case "month":
        dateFrom = `${dataYear}-11-18`;
        dateTo = `${dataYear}-12-18`;
        break;
      case "quarter":
        dateFrom = `${dataYear}-09-18`;
        dateTo = `${dataYear}-12-18`;
        break;
      case "year":
      default:
        dateFrom = `${dataYear}-01-01`;
        dateTo = `${dataYear}-12-31`;
    }
    
    return { dateFrom, dateTo };
  };

  const { dateFrom, dateTo } = getDateRange();
  const { data, isLoading, error } = useTeamLeaderboard(dateFrom, dateTo);

  // Handle manager click
  const handleManagerClick = (managerId: number) => {
    router.push(`/manager/${managerId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">Загрузка данных...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-400">Ошибка загрузки: {error.message}</span>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AlertCircle className="h-8 w-8 text-yellow-500" />
        <span className="ml-2 text-yellow-400">Нет данных. Проверьте выбранный проект.</span>
      </div>
    );
  }

  const { managers, team_avg, period: periodLabel } = data;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  // Get score background
  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  // Get rank badge
  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  // Mock data for Scorecards (will be replaced with real API data)
  const scorecardsData = [
    { id: 1, name: "Приветствие и представление", groupName: "Установление контакта", avgScore: 75, teamAvg: 72, trend: 3 },
    { id: 2, name: "Выявление потребностей", groupName: "Выявление потребностей", avgScore: 62, teamAvg: 65, trend: -5 },
    { id: 3, name: "Презентация продукта", groupName: "Презентация", avgScore: 58, teamAvg: 60, trend: 2 },
    { id: 4, name: "Работа с возражениями", groupName: "Отработка возражений", avgScore: 45, teamAvg: 50, trend: -8 },
    { id: 5, name: "Закрытие сделки", groupName: "Закрытие", avgScore: 52, teamAvg: 55, trend: 0 },
  ];

  // Mock data for Coaching Plan
  const coachingTasks = managers
    .filter(m => m.avg_score < team_avg)
    .slice(0, 4)
    .map((m, i) => ({
      id: `task-${m.id}`,
      managerId: m.id,
      managerName: m.name,
      skill: i % 2 === 0 ? "Работа с возражениями" : "Выявление потребностей",
      priority: m.avg_score < 30 ? "high" as const : m.avg_score < 50 ? "medium" as const : "low" as const,
      status: i === 0 ? "in_progress" as const : "pending" as const,
      deadline: i < 2 ? "2025-12-20" : "2025-12-27",
      notes: `Фокус на улучшение результатов по критерию`,
    }));

  // Coaching Queue data - правильная структура для CoachingItem
  const coachingQueue = managers
    .filter(m => m.avg_score < team_avg - 5)
    .slice(0, 5)
    .map((m, i) => ({
      managerId: m.id,
      managerName: m.name,
      criteria: i % 3 === 0 ? "Работа с возражениями" : i % 3 === 1 ? "Выявление потребностей" : "Презентация продукта",
      score: Math.round(m.avg_score),
      priority: m.avg_score < 30 ? "high" as const : m.avg_score < 50 ? "medium" as const : "low" as const,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Team Performance"
        subtitle="Управление командой и рейтинг менеджеров"
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Команда (среднее)</p>
              <p className={`text-2xl font-bold ${getScoreColor(team_avg)}`}>
                {Math.round(team_avg * 10) / 10}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Активных менеджеров</p>
              <p className="text-2xl font-bold text-white">{managers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Target className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Требуют коучинга</p>
              <p className="text-2xl font-bold text-yellow-400">{coachingQueue.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Minus className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Период</p>
              <p className="text-sm font-medium text-white">{periodLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">🏆 Leaderboard</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ранг
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Менеджер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Средняя оценка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Звонков
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  vs Команда
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {managers.map((manager, index) => {
                const vsTeam = manager.avg_score - team_avg;
                const rank = index + 1;
                
                return (
                  <tr
                    key={manager.id}
                    onClick={() => handleManagerClick(manager.id)}
                    className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg">{getRankBadge(rank)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {manager.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{manager.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(manager.avg_score)} ${getScoreColor(manager.avg_score)}`}>
                        {Math.round(manager.avg_score * 10) / 10}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {manager.total_calls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {vsTeam > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : vsTeam < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        ) : (
                          <Minus className="h-4 w-4 text-slate-400" />
                        )}
                        <span className={vsTeam > 0 ? "text-emerald-400" : vsTeam < 0 ? "text-red-400" : "text-slate-400"}>
                          {vsTeam > 0 ? "+" : ""}{Math.round(vsTeam * 10) / 10}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coaching Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coaching Queue */}
        <CoachingQueue items={coachingQueue} title="👨‍🏫 Coaching Queue" />
        
        {/* Coaching Plan */}
        <CoachingPlan 
          tasks={coachingTasks} 
          title="📅 Coaching Plan (2 недели)"
          onTaskClick={(task) => handleManagerClick(task.managerId)}
        />
      </div>

      {/* Scorecards */}
      <Scorecards
        criteria={scorecardsData}
        title="📊 Scorecards по критериям"
        onCriteriaClick={(c) => console.log("Criteria clicked:", c)}
      />
    </div>
  );
}
