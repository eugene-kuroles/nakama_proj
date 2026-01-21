"use client";

import { MessageSquare, TrendingUp, TrendingDown, Minus, Tag } from "lucide-react";

interface VOCItem {
  topic: string;
  count: number;
  trend: number; // percentage change
  sentiment: "positive" | "neutral" | "negative";
}

interface VOCRequestsProps {
  items: VOCItem[];
  title?: string;
}

const sentimentColors = {
  positive: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  neutral: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  negative: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function VOCRequests({ items, title = "VOC & Requests" }: VOCRequestsProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        {title}
      </h3>
      
      <p className="text-sm text-slate-400 mb-4">
        Топ запросов и барьеров клиентов по данным звонков
      </p>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${sentimentColors[item.sentiment]} flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4" />
              <span className="font-medium">{item.topic}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">{item.count} упоминаний</span>
              {item.trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : item.trend < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-400" />
              ) : (
                <Minus className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          Недостаточно данных для анализа
        </div>
      )}
    </div>
  );
}
