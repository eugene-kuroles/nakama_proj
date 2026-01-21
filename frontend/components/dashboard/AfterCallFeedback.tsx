"use client";

import { MessageSquare, Lightbulb, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

interface FeedbackItem {
  id: string;
  type: "strength" | "improvement" | "action";
  title: string;
  description: string;
  criteriaName?: string;
  priority?: "high" | "medium" | "low";
}

interface AfterCallFeedbackProps {
  strengths: FeedbackItem[];
  improvements: FeedbackItem[];
  actions: FeedbackItem[];
  title?: string;
}

const priorityColors = {
  high: "bg-red-500/20 border-red-500/30",
  medium: "bg-yellow-500/20 border-yellow-500/30",
  low: "bg-blue-500/20 border-blue-500/30",
};

export function AfterCallFeedback({ 
  strengths, 
  improvements, 
  actions, 
  title = "After-Call Feedback" 
}: AfterCallFeedbackProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        {title}
      </h3>
      
      <div className="space-y-6">
        {/* Strengths */}
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Сильные стороны ({strengths.length})
          </h4>
          <div className="space-y-2">
            {strengths.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    {item.criteriaName && (
                      <span className="inline-block mt-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                        {item.criteriaName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {strengths.length === 0 && (
              <p className="text-sm text-slate-500">Недостаточно данных для анализа</p>
            )}
          </div>
        </div>
        
        {/* Improvements */}
        <div>
          <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Зоны роста ({improvements.length})
          </h4>
          <div className="space-y-2">
            {improvements.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${item.priority ? priorityColors[item.priority] : "bg-yellow-500/10 border-yellow-500/30"}`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    {item.criteriaName && (
                      <span className="inline-block mt-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                        {item.criteriaName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {improvements.length === 0 && (
              <p className="text-sm text-slate-500">Недостаточно данных для анализа</p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div>
          <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Рекомендации ({actions.length})
          </h4>
          <div className="space-y-2">
            {actions.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {actions.length === 0 && (
              <p className="text-sm text-slate-500">Недостаточно данных для анализа</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
