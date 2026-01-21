"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PeriodFilter } from "@/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KPICard } from "@/components/cards/KPICard";
import { LineChart } from "@/components/charts/LineChart";
import { useManagerSummary, useTeamLeaderboard } from "@/hooks/useAnalytics";
import { 
  Loader2, 
  AlertCircle, 
  Percent, 
  Phone, 
  Trophy, 
  Users,
  ArrowLeft,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function ManagerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const managerId = Number(params.id);
  
  const [period, setPeriod] = useState<PeriodFilter>("year");

  // Calculate date range - using 2025 demo data
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
  const { data, isLoading, error } = useManagerSummary(managerId, dateFrom, dateTo);
  const { data: teamData } = useTeamLeaderboard(dateFrom, dateTo);

  // Find manager name from team data
  const managerInfo = teamData?.managers.find(m => m.id === managerId);
  const managerName = managerInfo?.name || `Менеджер #${managerId}`;

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
        <span className="ml-2 text-yellow-400">Нет данных за выбранный период.</span>
      </div>
    );
  }

  const { avg_score, total_calls, rank, total_managers, vs_team, trend } = data;

  // Prepare chart data
  const trendChartData = trend.map((t) => ({
    date: `Нед ${t.period}`,
    value: Math.round(t.value * 10) / 10,
  }));

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/20";
    if (score >= 60) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Назад к команде</span>
      </button>

      {/* Header */}
      <PageHeader
        title={managerName}
        subtitle="Детальная статистика менеджера"
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Средняя оценка"
          value={`${Math.round(avg_score * 10) / 10}%`}
          changeLabel="за период"
          icon={Percent}
        />
        <KPICard
          title="Звонков"
          value={total_calls}
          changeLabel="за период"
          icon={Phone}
        />
        <KPICard
          title="Место в рейтинге"
          value={`#${rank} / ${total_managers}`}
          changeLabel="в команде"
          icon={Trophy}
        />
        <KPICard
          title="vs Команда"
          value={`${vs_team > 0 ? "+" : ""}${Math.round(vs_team * 10) / 10}%`}
          changeLabel="разница"
          icon={Users}
        />
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className={`rounded-xl p-6 border ${getScoreBg(avg_score)} border-slate-700/50`}>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Результат</h3>
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(avg_score)}`}>
              {Math.round(avg_score * 10) / 10}%
            </div>
            <p className="text-slate-400 mt-2">Средняя оценка звонков</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {vs_team > 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400">
                    Выше команды на {Math.round(vs_team * 10) / 10}%
                  </span>
                </>
              ) : vs_team < 0 ? (
                <>
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <span className="text-red-400">
                    Ниже команды на {Math.abs(Math.round(vs_team * 10) / 10)}%
                  </span>
                </>
              ) : (
                <span className="text-slate-400">На уровне команды</span>
              )}
            </div>
          </div>
        </div>

        {/* Rank Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Рейтинг в команде</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-white">
              #{rank}
            </div>
            <p className="text-slate-400 mt-2">из {total_managers} менеджеров</p>
            <div className="mt-4">
              {rank === 1 && <span className="text-yellow-400 text-lg">🥇 Лидер команды!</span>}
              {rank === 2 && <span className="text-slate-300 text-lg">🥈 Второе место</span>}
              {rank === 3 && <span className="text-amber-600 text-lg">🥉 Третье место</span>}
              {rank > 3 && rank <= Math.ceil(total_managers / 2) && (
                <span className="text-emerald-400">✓ В верхней половине</span>
              )}
              {rank > Math.ceil(total_managers / 2) && (
                <span className="text-yellow-400">⚡ Есть потенциал для роста</span>
              )}
            </div>
          </div>
        </div>

        {/* Calls Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Активность</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-400">
              {total_calls}
            </div>
            <p className="text-slate-400 mt-2">звонков за период</p>
            <div className="mt-4">
              <div className="text-sm text-slate-300">
                {total_calls > 50 ? (
                  <span className="text-emerald-400">Высокая активность</span>
                ) : total_calls > 20 ? (
                  <span className="text-yellow-400">Средняя активность</span>
                ) : (
                  <span className="text-red-400">Низкая активность</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {trendChartData.length > 0 && (
        <LineChart
          title="Динамика оценок по неделям"
          data={trendChartData}
          lines={[
            { dataKey: "value", name: "Оценка", color: "hsl(221, 83%, 53%)" },
          ]}
          xAxisKey="date"
          yAxisDomain={[0, 100]}
          yAxisUnit="%"
          showLegend={false}
          height={350}
        />
      )}

      {/* Coaching Recommendations */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">💡 Рекомендации для коучинга</h3>
        <div className="space-y-3">
          {avg_score < 50 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-200">
                <strong>Критический уровень:</strong> Требуется интенсивная работа над базовыми навыками продаж.
                Рекомендуется провести серию индивидуальных сессий с разбором звонков.
              </p>
            </div>
          )}
          {avg_score >= 50 && avg_score < 70 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200">
                <strong>Зона развития:</strong> Есть потенциал для роста. Рекомендуется фокус на 
                конкретных этапах продаж с наименьшими показателями.
              </p>
            </div>
          )}
          {avg_score >= 70 && avg_score < 85 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200">
                <strong>Хороший уровень:</strong> Менеджер демонстрирует стабильные результаты.
                Рекомендуется работа над отдельными навыками для выхода на топ-уровень.
              </p>
            </div>
          )}
          {avg_score >= 85 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-200">
                <strong>Отличный результат:</strong> Менеджер показывает высокий уровень!
                Рекомендуется использовать как наставника и пример best practices для команды.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
