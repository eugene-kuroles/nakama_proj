"use client";

import { ThumbsUp, ThumbsDown, Play, Quote, ExternalLink } from "lucide-react";

interface CallExample {
  id: number;
  date: string;
  clientName?: string;
  duration: number;
  score: number;
  criteriaName: string;
  quote: string;
  reason: string;
}

interface BestWorstExamplesProps {
  bestExamples: CallExample[];
  worstExamples: CallExample[];
  title?: string;
  onExampleClick?: (example: CallExample) => void;
}

export function BestWorstExamples({ 
  bestExamples, 
  worstExamples, 
  title = "Best & Worst Examples",
  onExampleClick 
}: BestWorstExamplesProps) {
  
  const ExampleCard = ({ example, type }: { example: CallExample; type: "best" | "worst" }) => {
    const colors = type === "best" 
      ? { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "text-emerald-400" }
      : { bg: "bg-red-500/10", border: "border-red-500/30", icon: "text-red-400" };
    
    return (
      <div
        onClick={() => onExampleClick?.(example)}
        className={`p-4 rounded-lg ${colors.bg} border ${colors.border} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {type === "best" ? (
              <ThumbsUp className={`h-4 w-4 ${colors.icon}`} />
            ) : (
              <ThumbsDown className={`h-4 w-4 ${colors.icon}`} />
            )}
            <span className="text-sm font-medium text-white">{example.criteriaName}</span>
          </div>
          <span className={`text-sm font-bold ${type === "best" ? "text-emerald-400" : "text-red-400"}`}>
            {example.score}%
          </span>
        </div>
        
        {/* Quote */}
        {example.quote && (
          <div className="mb-2 p-2 bg-slate-700/30 rounded border-l-2 border-slate-500">
            <div className="flex items-start gap-2">
              <Quote className="h-3 w-3 text-slate-500 mt-1 flex-shrink-0" />
              <p className="text-xs text-slate-300 italic line-clamp-2">"{example.quote}"</p>
            </div>
          </div>
        )}
        
        {/* Reason */}
        <p className="text-xs text-slate-400 line-clamp-2">{example.reason}</p>
        
        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{example.date}</span>
          <div className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            <span>{Math.floor(example.duration / 60)}:{(example.duration % 60).toString().padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Examples */}
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" />
            Лучшие примеры
          </h4>
          <div className="space-y-3">
            {bestExamples.length > 0 ? (
              bestExamples.map((example) => (
                <ExampleCard key={example.id} example={example} type="best" />
              ))
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                Нет примеров
              </div>
            )}
          </div>
        </div>
        
        {/* Worst Examples */}
        <div>
          <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
            <ThumbsDown className="h-4 w-4" />
            Нужна работа
          </h4>
          <div className="space-y-3">
            {worstExamples.length > 0 ? (
              worstExamples.map((example) => (
                <ExampleCard key={example.id} example={example} type="worst" />
              ))
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                Нет примеров
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
