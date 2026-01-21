"use client";

import { useState } from "react";
import { PeriodFilter } from "@/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KPICard } from "@/components/cards/KPICard";
import { LineChart } from "@/components/charts/LineChart";
import { AfterCallFeedback } from "@/components/dashboard/AfterCallFeedback";
import { ConversationMetrics } from "@/components/dashboard/ConversationMetrics";
import { BestWorstExamples } from "@/components/dashboard/BestWorstExamples";
import { RadarChart } from "@/components/charts/RadarChart";
import { useManagerSummary } from "@/hooks/useAnalytics";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  AlertCircle, 
  Percent, 
  Phone, 
  Trophy, 
  Users,
  TrendingUp,
  TrendingDown 
} from "lucide-react";

export default function MyDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const { user } = useAuth();
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
  const managerId = user?.manager_id || null;
  const { data, isLoading, error } = useManagerSummary(managerId, dateFrom, dateTo);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">Загрузка данных...</span>
      </div>
    );
  }

  // No manager_id state (for non-manager roles)
  if (!managerId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Performance"
          subtitle={user?.name || "Менеджер"}
          period={period}
          onPeriodChange={setPeriod}
        />
        <div className="flex items-center justify-center min-h-[300px] bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Аккаунт не привязан к менеджеру
            </h3>
            <p className="text-slate-400">
              Ваш аккаунт не связан с профилем менеджера.<br />
              Обратитесь к администратору для настройки.
            </p>
          </div>
        </div>
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

  // Mock data for Radar Chart (criteria profile) - поле должно называться subject
  const radarData = [
    { subject: "Приветствие", user: 75, team: 72 },
    { subject: "Выявление потр.", user: 62, team: 65 },
    { subject: "Презентация", user: 68, team: 60 },
    { subject: "Возражения", user: 45, team: 50 },
    { subject: "Закрытие", user: 52, team: 55 },
    { subject: "Доп. продажи", user: 58, team: 48 },
  ];

  // Mock data for After-Call Feedback
  const feedbackStrengths = [
    {
      id: "s1",
      type: "strength" as const,
      title: "Отличное установление контакта",
      description: "Клиенты отмечают дружелюбность и профессионализм в начале разговора",
      criteriaName: "Приветствие",
    },
    {
      id: "s2",
      type: "strength" as const,
      title: "Хорошая презентация продукта",
      description: "Четко объясняете преимущества и особенности",
      criteriaName: "Презентация",
    },
  ];

  const feedbackImprovements = [
    {
      id: "i1",
      type: "improvement" as const,
      title: "Работа с возражениями",
      description: "Часто переходите к следующему этапу, не полностью отработав возражение клиента",
      criteriaName: "Отработка возражений",
      priority: "high" as const,
    },
    {
      id: "i2",
      type: "improvement" as const,
      title: "Выявление потребностей",
      description: "Недостаточно вопросов для понимания реальных потребностей клиента",
      criteriaName: "Выявление потребностей",
      priority: "medium" as const,
    },
  ];

  const feedbackActions = [
    {
      id: "a1",
      type: "action" as const,
      title: "Используйте технику SPIN",
      description: "Задавайте последовательно: Ситуационные → Проблемные → Извлекающие → Направляющие вопросы",
    },
    {
      id: "a2",
      type: "action" as const,
      title: "Фиксируйте возражения",
      description: "Перед ответом повторите возражение клиента, чтобы показать что вы его услышали",
    },
  ];

  // Mock data for Conversation Metrics
  const conversationMetrics = {
    avgTalkTime: 180, // 3 min
    avgListenTime: 240, // 4 min
    avgCallDuration: 420, // 7 min
    talkToListenRatio: 0.75,
    questionsAsked: 8,
    clientEngagement: 72,
    scriptCompliance: 85,
  };

  const teamConversationMetrics = {
    avgTalkTime: 200,
    avgListenTime: 220,
    avgCallDuration: 420,
    talkToListenRatio: 0.9,
    questionsAsked: 6,
    clientEngagement: 68,
    scriptCompliance: 80,
  };

  // Mock data for Best/Worst Examples
  const bestExamples = [
    {
      id: 1,
      date: "15 дек 2025",
      clientName: "ООО Рога и Копыта",
      duration: 420,
      score: 95,
      criteriaName: "Презентация продукта",
      quote: "Вы очень хорошо объяснили все преимущества, теперь мне всё понятно",
      reason: "Отличная структура презентации, использование конкретных примеров",
    },
    {
      id: 2,
      date: "12 дек 2025",
      clientName: "ИП Иванов",
      duration: 380,
      score: 92,
      criteriaName: "Установление контакта",
      quote: "Приятно иметь дело с профессионалами",
      reason: "Быстро установил доверительный контакт, персонализированный подход",
    },
  ];

  const worstExamples = [
    {
      id: 3,
      date: "18 дек 2025",
      clientName: "АО СтройМонтаж",
      duration: 240,
      score: 25,
      criteriaName: "Работа с возражениями",
      quote: "Вы так и не ответили на мой вопрос о гарантиях",
      reason: "Пропущено ключевое возражение, клиент потерял интерес",
    },
    {
      id: 4,
      date: "16 дек 2025",
      clientName: "ООО ТехноСервис",
      duration: 180,
      score: 30,
      criteriaName: "Выявление потребностей",
      quote: "Мне кажется вы не поняли что нам нужно",
      reason: "Недостаточно уточняющих вопросов, поспешный переход к презентации",
    },
  ];

  const handleExampleClick = (example: any) => {
    // Navigate to call detail page
    router.push(`/call/${example.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Performance"
        subtitle={user?.name || "Менеджер"}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Моя оценка"
          value={`${Math.round(avg_score * 10) / 10}%`}
          changeLabel="за период"
          icon={Percent}
        />
        <KPICard
          title="Мои звонки"
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

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Summary */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-4">📊 Ваш результат</h3>
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(avg_score)}`}>
              {Math.round(avg_score * 10) / 10}%
            </div>
            <p className="text-slate-400 mt-2">Средняя оценка звонков</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {vs_team > 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400">Выше команды на {Math.round(vs_team * 10) / 10}%</span>
                </>
              ) : vs_team < 0 ? (
                <>
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <span className="text-red-400">Ниже команды на {Math.abs(Math.round(vs_team * 10) / 10)}%</span>
                </>
              ) : (
                <span className="text-slate-400">= На уровне команды</span>
              )}
            </div>
          </div>
        </div>

        {/* Rank Summary */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-4">🏆 Ваш рейтинг</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-white">
              #{rank}
            </div>
            <p className="text-slate-400 mt-2">из {total_managers} менеджеров</p>
            <div className="mt-4">
              {rank === 1 && <span className="text-yellow-400">🥇 Лидер команды!</span>}
              {rank === 2 && <span className="text-slate-300">🥈 Второе место</span>}
              {rank === 3 && <span className="text-amber-600">🥉 Третье место</span>}
              {rank > 3 && rank <= Math.ceil(total_managers / 2) && (
                <span className="text-emerald-400">✓ В верхней половине</span>
              )}
              {rank > Math.ceil(total_managers / 2) && (
                <span className="text-yellow-400">⚡ Есть потенциал для роста</span>
              )}
            </div>
          </div>
        </div>

        {/* Calls Summary */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-4">📞 Ваши звонки</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-400">
              {total_calls}
            </div>
            <p className="text-slate-400 mt-2">звонков за период</p>
            <div className="mt-4">
              <p className="text-slate-300">
                Средняя продолжительность: {Math.floor(conversationMetrics.avgCallDuration / 60)}:{(conversationMetrics.avgCallDuration % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - My Profile vs Team */}
        <RadarChart
          title="🎯 Мой профиль по критериям"
          data={radarData}
          radars={[
            { dataKey: "user", name: "Я", color: "hsl(221, 83%, 53%)", fillOpacity: 0.3 },
            { dataKey: "team", name: "Команда", color: "hsl(142, 76%, 36%)", fillOpacity: 0.1 },
          ]}
          height={350}
        />

        {/* Trend Chart */}
        {trendChartData.length > 0 && (
          <LineChart
            title="📈 Динамика моих оценок по неделям"
            data={trendChartData}
            lines={[
              { dataKey: "value", name: "Моя оценка", color: "hsl(221, 83%, 53%)" },
            ]}
            xAxisKey="date"
            yAxisDomain={[0, 100]}
            yAxisUnit="%"
            showLegend={false}
            height={350}
          />
        )}
      </div>

      {/* Conversation Metrics & Feedback Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Metrics */}
        <ConversationMetrics
          data={conversationMetrics}
          teamAvg={teamConversationMetrics}
          title="🎙️ Conversation Metrics"
        />

        {/* After-Call Feedback */}
        <AfterCallFeedback
          strengths={feedbackStrengths}
          improvements={feedbackImprovements}
          actions={feedbackActions}
          title="💡 After-Call Feedback"
        />
      </div>

      {/* Best/Worst Examples */}
      <BestWorstExamples
        bestExamples={bestExamples}
        worstExamples={worstExamples}
        title="📋 Best & Worst Examples"
        onExampleClick={handleExampleClick}
      />
    </div>
  );
}
