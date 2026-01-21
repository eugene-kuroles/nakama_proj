"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn, getScoreColor, getScoreBgColor, formatPercent } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  score: number;
  maxScore?: number;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreCard({
  label,
  score,
  maxScore = 100,
  showPercent = true,
  size = 'md',
  className,
}: ScoreCardProps) {
  const percent = (score / maxScore) * 100;
  
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      "hover:shadow-md",
      getScoreBgColor(percent),
      className
    )}>
      <CardContent className={cn("space-y-2", sizeClasses[size])}>
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "font-bold",
            valueSizeClasses[size],
            getScoreColor(percent)
          )}>
            {showPercent ? formatPercent(percent, 0) : score}
          </span>
          {!showPercent && maxScore !== 100 && (
            <span className="text-sm text-muted-foreground">
              / {maxScore}
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percent >= 85 && "bg-emerald-500",
              percent >= 70 && percent < 85 && "bg-amber-500",
              percent >= 50 && percent < 70 && "bg-orange-500",
              percent < 50 && "bg-red-500",
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
