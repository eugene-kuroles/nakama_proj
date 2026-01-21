"use client";

import { ThumbsUp, ThumbsDown, HelpCircle, Quote } from "lucide-react";

interface WinLossReason {
  reason: string;
  count: number;
  percentage: number;
}

interface WinLossData {
  wins: number;
  losses: number;
  pending: number;
  topWinReasons: WinLossReason[];
  topLossReasons: WinLossReason[];
}

interface WinLossSummaryProps {
  data: WinLossData;
  title?: string;
}

export function WinLossSummary({ data, title = "Win/Loss Summary" }: WinLossSummaryProps) {
  const total = data.wins + data.losses + data.pending;
  const winRate = total > 0 ? Math.round((data.wins / total) * 100) : 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      {/* Win Rate Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="rgb(71 85 105 / 0.5)"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="rgb(34 197 94)"
              strokeWidth="12"
              strokeDasharray={`${(winRate / 100) * 352} 352`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{winRate}%</div>
              <div className="text-xs text-slate-400">Win Rate</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <ThumbsUp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-emerald-400">{data.wins}</div>
          <div className="text-xs text-slate-400">Успешных</div>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <ThumbsDown className="h-5 w-5 text-red-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-400">{data.losses}</div>
          <div className="text-xs text-slate-400">Потеряно</div>
        </div>
        <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <HelpCircle className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{data.pending}</div>
          <div className="text-xs text-slate-400">В работе</div>
        </div>
      </div>
      
      {/* Top Reasons */}
      <div className="space-y-4">
        {/* Win Reasons */}
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Почему покупают:</h4>
          <div className="space-y-2">
            {data.topWinReasons.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Quote className="h-3 w-3 text-slate-500" />
                <span className="text-slate-300 flex-1">{r.reason}</span>
                <span className="text-emerald-400">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Loss Reasons */}
        <div>
          <h4 className="text-sm font-medium text-red-400 mb-2">Почему отказывают:</h4>
          <div className="space-y-2">
            {data.topLossReasons.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Quote className="h-3 w-3 text-slate-500" />
                <span className="text-slate-300 flex-1">{r.reason}</span>
                <span className="text-red-400">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
