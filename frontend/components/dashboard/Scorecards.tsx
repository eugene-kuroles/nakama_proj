"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CriteriaScore {
  id: number;
  name: string;
  groupName: string;
  avgScore: number;
  teamAvg: number;
  trend: number;
  details?: {
    bestScore: number;
    worstScore: number;
    callsCount: number;
    recommendation?: string;
  };
}

interface ScorecardsProps {
  criteria: CriteriaScore[];
  title?: string;
  onCriteriaClick?: (criteria: CriteriaScore) => void;
}

export function Scorecards({ criteria, title = "Scorecards по критериям", onCriteriaClick }: ScorecardsProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<number | null>(null);

  // Group by group name
  const grouped = criteria.reduce((acc, c) => {
    if (!acc[c.groupName]) acc[c.groupName] = [];
    acc[c.groupName].push(c);
    return acc;
  }, {} as Record<string, CriteriaScore[]>);

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

  const handleCriteriaClick = (c: CriteriaScore) => {
    setExpandedCriteria(expandedCriteria === c.id ? null : c.id);
    onCriteriaClick?.(c);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      
      <div className="divide-y divide-slate-700/30">
        {Object.entries(grouped).map(([groupName, items]) => (
          <div key={groupName}>
            <div className="px-6 py-3 bg-slate-700/20">
              <h4 className="text-sm font-medium text-slate-400">{groupName}</h4>
            </div>
            {items.map((c) => {
              const diff = c.avgScore - c.teamAvg;
              const isExpanded = expandedCriteria === c.id;
              
              return (
                <div key={c.id}>
                  <div
                    onClick={() => handleCriteriaClick(c)}
                    className="px-6 py-3 flex items-center justify-between hover:bg-slate-700/20 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <p className="text-sm text-white">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreBg(c.avgScore)} ${getScoreColor(c.avgScore)}`}>
                          {Math.round(c.avgScore)}%
                        </span>
                      </div>
                      <div className="w-20 text-right flex items-center justify-end gap-1">
                        {diff > 2 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : diff < -2 ? (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        ) : (
                          <Minus className="h-3 w-3 text-slate-400" />
                        )}
                        <span className={`text-xs ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-400"}`}>
                          {diff > 0 ? "+" : ""}{Math.round(diff)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-slate-700/10 border-t border-slate-700/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">Средняя оценка</p>
                          <p className={`text-xl font-bold ${getScoreColor(c.avgScore)}`}>
                            {Math.round(c.avgScore)}%
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">vs Команда</p>
                          <p className={`text-xl font-bold ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {diff >= 0 ? "+" : ""}{Math.round(diff)}%
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">Лучший результат</p>
                          <p className="text-xl font-bold text-emerald-400">
                            {c.details?.bestScore ?? Math.min(100, Math.round(c.avgScore + 20))}%
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">Худший результат</p>
                          <p className="text-xl font-bold text-red-400">
                            {c.details?.worstScore ?? Math.max(0, Math.round(c.avgScore - 30))}%
                          </p>
                        </div>
                      </div>
                      
                      {/* Recommendation */}
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-400 font-medium mb-1">💡 Рекомендация:</p>
                        <p className="text-sm text-slate-300">
                          {c.details?.recommendation || 
                            (c.avgScore < 50 
                              ? `Критерий "${c.name}" требует срочного внимания. Рекомендуется провести индивидуальное обучение.`
                              : c.avgScore < 70
                              ? `Есть потенциал для улучшения. Обратите внимание на best practices по данному критерию.`
                              : `Хороший результат! Поддерживайте текущий уровень.`
                            )
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
