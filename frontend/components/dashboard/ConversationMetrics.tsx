"use client";

import { MessageCircle, Timer, Mic, UserCheck, BarChart3 } from "lucide-react";

interface ConversationMetricsData {
  avgTalkTime: number; // seconds
  avgListenTime: number; // seconds
  avgCallDuration: number; // seconds
  talkToListenRatio: number;
  questionsAsked: number;
  clientEngagement: number; // percentage
  scriptCompliance: number; // percentage
}

interface ConversationMetricsProps {
  data: ConversationMetricsData;
  teamAvg?: ConversationMetricsData;
  title?: string;
}

export function ConversationMetrics({ data, teamAvg, title = "Conversation Metrics" }: ConversationMetricsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getComparisonColor = (value: number, teamValue?: number, higherIsBetter = true) => {
    if (!teamValue) return "text-slate-300";
    const diff = value - teamValue;
    if (higherIsBetter) {
      return diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-300";
    }
    return diff < 0 ? "text-emerald-400" : diff > 0 ? "text-red-400" : "text-slate-300";
  };

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    unit, 
    teamValue,
    higherIsBetter = true 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    unit?: string;
    teamValue?: string | number;
    higherIsBetter?: boolean;
  }) => (
    <div className="p-4 bg-slate-700/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-blue-400" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {teamValue !== undefined && (
        <div className="mt-1 text-xs text-slate-500">
          Команда: {teamValue}{unit}
        </div>
      )}
    </div>
  );

  // Talk/Listen ratio visual
  const talkPercent = Math.round((data.avgTalkTime / (data.avgTalkTime + data.avgListenTime)) * 100);
  const listenPercent = 100 - talkPercent;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-400" />
        {title}
      </h3>
      
      {/* Talk/Listen Ratio */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-400">Говорит {talkPercent}%</span>
          <span className="text-emerald-400">Слушает {listenPercent}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-slate-700/50">
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${talkPercent}%` }}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${listenPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{formatTime(data.avgTalkTime)}</span>
          <span>{formatTime(data.avgListenTime)}</span>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Timer}
          label="Средний звонок"
          value={formatTime(data.avgCallDuration)}
          teamValue={teamAvg ? formatTime(teamAvg.avgCallDuration) : undefined}
        />
        <MetricCard
          icon={MessageCircle}
          label="Вопросов задано"
          value={data.questionsAsked}
          teamValue={teamAvg?.questionsAsked}
          higherIsBetter={true}
        />
        <MetricCard
          icon={UserCheck}
          label="Вовлечение клиента"
          value={data.clientEngagement}
          unit="%"
          teamValue={teamAvg?.clientEngagement}
          higherIsBetter={true}
        />
        <MetricCard
          icon={Mic}
          label="Соответствие скрипту"
          value={data.scriptCompliance}
          unit="%"
          teamValue={teamAvg?.scriptCompliance}
          higherIsBetter={true}
        />
      </div>
    </div>
  );
}
