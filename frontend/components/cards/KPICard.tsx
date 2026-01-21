"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn, getTrendIndicator, formatChange, formatPercent } from "@/lib/utils";
import { TrendDirection } from "@/types";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  trend?: TrendDirection;
  changeLabel?: string;
  icon?: LucideIcon;
  format?: "number" | "percent" | "duration" | "none";
  className?: string;
}

export function KPICard({
  title,
  value,
  unit,
  change,
  trend,
  changeLabel,
  icon: Icon,
  format = "none",
  className,
}: KPICardProps) {
  const formattedValue = (() => {
    if (format === "percent" && typeof value === "number") {
      return formatPercent(value);
    }
    if (format === "number" && typeof value === "number") {
      return value.toLocaleString("ru-RU");
    }
    return String(value);
  })();

  const trendInfo = change !== undefined ? getTrendIndicator(change) : null;
  const actualTrend = trend || trendInfo?.trend || 'flat';

  const TrendIcon = actualTrend === 'up' 
    ? TrendingUp 
    : actualTrend === 'down' 
      ? TrendingDown 
      : Minus;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
      "bg-gradient-to-br from-card to-card/80",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                {formattedValue}
              </span>
              {unit && (
                <span className="text-lg text-muted-foreground font-medium">
                  {unit}
                </span>
              )}
            </div>
          </div>
          {Icon && (
            <div className="p-3 rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        
        {change !== undefined && (
          <div className={cn(
            "mt-4 flex items-center gap-1.5 text-sm font-medium",
            trendInfo?.color
          )}>
            <TrendIcon className="h-4 w-4" />
            <span>{formatChange(change)}</span>
            {changeLabel && (
              <span className="text-muted-foreground font-normal">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Decorative gradient */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1",
        actualTrend === 'up' && "bg-gradient-to-r from-emerald-500 to-emerald-400",
        actualTrend === 'down' && "bg-gradient-to-r from-red-500 to-red-400",
        actualTrend === 'flat' && "bg-gradient-to-r from-muted to-muted/50",
      )} />
    </Card>
  );
}
