"use client";

import { AlertTriangle, TrendingDown, Clock, MessageCircleOff, ThumbsDown } from "lucide-react";

interface RiskSignal {
  id: string;
  type: "declining" | "sla" | "no_contact" | "negative" | "critical";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  count?: number;
}

interface RiskSignalsProps {
  signals: RiskSignal[];
  title?: string;
}

const riskIcons = {
  declining: TrendingDown,
  sla: Clock,
  no_contact: MessageCircleOff,
  negative: ThumbsDown,
  critical: AlertTriangle,
};

const riskColors = {
  high: { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-400", icon: "text-red-400" },
  medium: { bg: "bg-yellow-500/20", border: "border-yellow-500/30", text: "text-yellow-400", icon: "text-yellow-400" },
  low: { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400", icon: "text-blue-400" },
};

export function RiskSignals({ signals, title = "Risk Signals" }: RiskSignalsProps) {
  if (signals.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          {title}
        </h3>
        <div className="text-center py-8 text-emerald-400">
          <span className="text-4xl">✓</span>
          <p className="mt-2">Критических рисков не обнаружено</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-400" />
        {title}
      </h3>
      
      <div className="space-y-3">
        {signals.map((signal) => {
          const Icon = riskIcons[signal.type];
          const colors = riskColors[signal.impact];
          
          return (
            <div
              key={signal.id}
              className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${colors.icon} mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${colors.text}`}>{signal.title}</h4>
                    {signal.count && (
                      <span className={`text-sm ${colors.text}`}>{signal.count} случаев</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{signal.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
