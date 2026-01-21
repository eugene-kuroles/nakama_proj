"use client";

import { PeriodSelector } from "./PeriodSelector";
import { PeriodFilter } from "@/types";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  period?: PeriodFilter;
  onPeriodChange?: (period: PeriodFilter) => void;
  showPeriod?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  period = 'week',
  onPeriodChange,
  showPeriod = true,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {showPeriod && onPeriodChange && (
          <PeriodSelector 
            value={period} 
            onChange={onPeriodChange} 
            className="w-[140px]"
          />
        )}
      </div>
    </div>
  );
}
