"use client";

import { Smile, Meh, Frown, TrendingUp, TrendingDown } from "lucide-react";

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  trend: number; // percentage change
}

interface SentimentCardProps {
  data: SentimentData;
  title?: string;
}

export function SentimentCard({ data, title = "Sentiment & Trust" }: SentimentCardProps) {
  const total = data.positive + data.neutral + data.negative;
  const positivePercent = total > 0 ? Math.round((data.positive / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((data.neutral / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((data.negative / total) * 100) : 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      {/* Progress Bar */}
      <div className="h-4 rounded-full overflow-hidden flex bg-slate-700/50 mb-4">
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: `${positivePercent}%` }}
        />
        <div
          className="bg-yellow-500 transition-all duration-500"
          style={{ width: `${neutralPercent}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${negativePercent}%` }}
        />
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <Smile className="h-8 w-8 text-emerald-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-emerald-400">{positivePercent}%</div>
          <div className="text-xs text-slate-400">Позитив</div>
        </div>
        <div className="text-center">
          <Meh className="h-8 w-8 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-400">{neutralPercent}%</div>
          <div className="text-xs text-slate-400">Нейтрал</div>
        </div>
        <div className="text-center">
          <Frown className="h-8 w-8 text-red-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-red-400">{negativePercent}%</div>
          <div className="text-xs text-slate-400">Негатив</div>
        </div>
      </div>
      
      {/* Trend */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-center gap-2">
        {data.trend > 0 ? (
          <>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">+{data.trend}% позитива vs прошлый период</span>
          </>
        ) : data.trend < 0 ? (
          <>
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-red-400">{data.trend}% позитива vs прошлый период</span>
          </>
        ) : (
          <span className="text-slate-400">Без изменений vs прошлый период</span>
        )}
      </div>
    </div>
  );
}
