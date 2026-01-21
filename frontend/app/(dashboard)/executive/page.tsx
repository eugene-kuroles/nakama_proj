"use client";

import { useState } from "react";
import { PeriodFilter } from "@/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TopIssues } from "@/components/dashboard/TopIssues";
import { RiskSignals } from "@/components/dashboard/RiskSignals";
import { SentimentCard } from "@/components/dashboard/SentimentCard";
import { WinLossSummary } from "@/components/dashboard/WinLossSummary";
import { VOCRequests } from "@/components/dashboard/VOCRequests";
import { KPICard } from "@/components/cards/KPICard";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { formatDuration } from "@/lib/utils";
import { useExecutiveSummary, useVOC, useWinLoss } from "@/hooks/useAnalytics";
import { Loader2, Percent, Phone, Clock, Users, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

export default function ExecutiveDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>("year");
  
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
  const { data, isLoading, error } = useExecutiveSummary(dateFrom, dateTo);
  const { data: vocData } = useVOC(dateFrom, dateTo);
  const { data: winLossData } = useWinLoss(dateFrom, dateTo);

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

  const { kpis, top_managers, problem_criteria, trend } = data;

  // Prepare chart data
  const trendChartData = trend.map((t) => ({
    date: `Нед ${t.period}`,
    value: Math.round(t.value * 10) / 10,
  }));

  const teamPerformanceData = top_managers
    .sort((a, b) => b.avg_score - a.avg_score)
    .map((m) => ({
      name: m.name.split(" ")[0],
      score: Math.round(m.avg_score * 10) / 10,
    }));

  const issuesData = problem_criteria.map((c) => ({
    criteria: c.name,
    avgScore: Math.round(c.avg_score * 10) / 10,
    count: 0,
  }));

  // Mock data for new components (will be replaced with real API data)
  const riskSignals = [
    {
      id: "1",
      type: "declining" as const,
      title: "Падение качества",
      description: "3 менеджера показывают снижение оценки более 10% за последние 2 недели",
      impact: "high" as const,
      count: 3,
    },
    {
      id: "2",
      type: "critical" as const,
      title: "Критические ошибки",
      description: "Выявлены критические ошибки в 5% звонков (неверная информация о продукте)",
      impact: "high" as const,
      count: Math.round(kpis.total_calls * 0.05),
    },
    {
      id: "3",
      type: "sla" as const,
      title: "Длительные звонки",
      description: "15% звонков превышают целевое время без улучшения качества",
      impact: "medium" as const,
    },
  ];

  const sentimentData = {
    positive: Math.round(kpis.total_calls * 0.45),
    neutral: Math.round(kpis.total_calls * 0.35),
    negative: Math.round(kpis.total_calls * 0.20),
    trend: 5, // +5% positive vs last period
  };

  // Win/Loss data from API or fallback
  const winLossSummary = winLossData ? {
    wins: winLossData.wins,
    losses: winLossData.losses,
    pending: winLossData.pending,
    topWinReasons: winLossData.top_win_reasons.map(r => ({
      reason: r.reason,
      count: r.count,
      percentage: r.percentage,
    })),
    topLossReasons: winLossData.top_loss_reasons.map(r => ({
      reason: r.reason,
      count: r.count,
      percentage: r.percentage,
    })),
  } : {
    wins: Math.round(kpis.total_calls * 0.35),
    losses: Math.round(kpis.total_calls * 0.25),
    pending: Math.round(kpis.total_calls * 0.40),
    topWinReasons: [
      { reason: "Данные загружаются...", count: 0, percentage: 0 },
    ],
    topLossReasons: [
      { reason: "Данные загружаются...", count: 0, percentage: 0 },
    ],
  };

  // VOC items from API or fallback to mock
  const vocItems = vocData?.items?.map((item, idx) => ({
    topic: item.tag,
    count: item.count,
    trend: item.trend || 0,
    sentiment: (idx % 3 === 0 ? "positive" : idx % 3 === 1 ? "neutral" : "negative") as "positive" | "neutral" | "negative",
  })) || [
    { topic: "Нет данных", count: 0, trend: 0, sentiment: "neutral" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Executive Overview"
        subtitle="Общая картина качества звонков"
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Средняя оценка"
          value={`${Math.round(kpis.avg_score * 10) / 10}%`}
          change={Math.round(kpis.score_change * 10) / 10}
          changeLabel="vs прошлый период"
          icon={Percent}
        />
        <KPICard
          title="Звонков"
          value={kpis.total_calls}
          change={kpis.calls_change}
          changeLabel="vs прошлый период"
          icon={Phone}
        />
        <KPICard
          title="Общее время"
          value={formatDuration(kpis.total_duration_minutes * 60)}
          changeLabel="часов"
          icon={Clock}
        />
        <KPICard
          title="Менеджеров"
          value={kpis.total_managers}
          icon={Users}
        />
      </div>

      {/* Executive Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Trend */}
        <LineChart
          title="Динамика качества по неделям"
          data={trendChartData}
          lines={[
            { dataKey: "value", name: "Средняя оценка", color: "hsl(221, 83%, 53%)" },
          ]}
          xAxisKey="date"
          yAxisDomain={[0, 100]}
          yAxisUnit="%"
          height={280}
        />

        {/* Risk Signals */}
        <RiskSignals signals={riskSignals} title="🚨 Risk Signals" />
      </div>

      {/* Sentiment & Win/Loss Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentCard data={sentimentData} title="😊 Sentiment & Trust" />
        <WinLossSummary data={winLossSummary} title="📊 Win/Loss Summary" />
      </div>

      {/* VOC & Problem Criteria Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VOCRequests items={vocItems} title="💬 VOC & Requests" />
        <TopIssues issues={issuesData} title="⚠️ Проблемные критерии" />
      </div>

      {/* Team Performance Bar Chart */}
      {teamPerformanceData.length > 0 && (
        <BarChart
          title="🏆 Топ менеджеры по оценке"
          data={teamPerformanceData}
          bars={[
            { dataKey: "score", name: "Оценка", showLabel: true },
          ]}
          xAxisKey="name"
          yAxisDomain={[0, 100]}
          yAxisUnit="%"
          colorByValue
          height={350}
        />
      )}
    </div>
  );
}
