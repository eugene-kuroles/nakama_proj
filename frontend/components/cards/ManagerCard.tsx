"use client";

import { cn, formatPercent, getScoreColor, getTrendIndicator } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Phone } from "lucide-react";

interface ManagerCardProps {
  rank: number;
  name: string;
  score: number;
  calls: number;
  trend?: number;
  onClick?: () => void;
  className?: string;
}

export function ManagerCard({
  rank,
  name,
  score,
  calls,
  trend,
  onClick,
  className,
}: ManagerCardProps) {
  const trendInfo = trend !== undefined ? getTrendIndicator(trend) : null;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div
      className={cn(
        "card p-4 cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="w-10 h-10 flex items-center justify-center text-lg">
          {getRankBadge(rank)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{calls} звонков</span>
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <p className={cn("text-lg font-bold", getScoreColor(score))}>
            {formatPercent(score)}
          </p>
          {trendInfo && trend !== undefined && (
            <div className={cn("flex items-center justify-end gap-1 text-xs", trendInfo.color)}>
              {trend > 1 && <TrendingUp className="h-3 w-3" />}
              {trend < -1 && <TrendingDown className="h-3 w-3" />}
              {trend >= -1 && trend <= 1 && <Minus className="h-3 w-3" />}
              <span>{trend > 0 ? "+" : ""}{formatPercent(trend)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
