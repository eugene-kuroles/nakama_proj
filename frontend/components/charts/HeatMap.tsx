"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPercent, getScoreLevel, getScoreColor } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatMapData {
  rowId: string;
  rowLabel: string;
  values: Record<string, number>;
}

interface HeatMapProps {
  title?: string;
  data: HeatMapData[];
  columns: { key: string; label: string }[];
  showValues?: boolean;
  className?: string;
}

function getCellColor(value: number): string {
  const level = getScoreLevel(value);
  const colors = {
    excellent: 'bg-emerald-500 dark:bg-emerald-600',
    good: 'bg-amber-400 dark:bg-amber-500',
    warning: 'bg-orange-500 dark:bg-orange-600',
    danger: 'bg-red-500 dark:bg-red-600',
  };
  return colors[level];
}

function getCellOpacity(value: number): number {
  // Scale opacity from 0.4 to 1 based on how far from 50% the value is
  const distance = Math.abs(value - 50);
  return 0.4 + (distance / 50) * 0.6;
}

export function HeatMap({
  title,
  data,
  columns,
  showValues = true,
  className,
}: HeatMapProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6")}>
        <div className="overflow-x-auto">
          <TooltipProvider>
            <table className="w-full border-collapse">
              {/* Header */}
              <thead>
                <tr>
                  <th className="p-2 text-left text-sm font-medium text-muted-foreground w-32">
                    {/* Empty corner */}
                  </th>
                  {columns.map((col) => (
                    <th 
                      key={col.key}
                      className="p-2 text-center text-xs font-medium text-muted-foreground"
                      style={{ minWidth: '60px' }}
                    >
                      <span className="block truncate max-w-[80px]" title={col.label}>
                        {col.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              
              {/* Body */}
              <tbody>
                {data.map((row) => (
                  <tr key={row.rowId}>
                    <td className="p-2 text-sm font-medium truncate max-w-[120px]" title={row.rowLabel}>
                      {row.rowLabel}
                    </td>
                    {columns.map((col) => {
                      const value = row.values[col.key] ?? 0;
                      return (
                        <td key={col.key} className="p-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "w-full h-10 rounded-md flex items-center justify-center",
                                  "transition-all duration-200 cursor-pointer",
                                  "hover:ring-2 hover:ring-primary hover:ring-offset-2",
                                  getCellColor(value)
                                )}
                                style={{ opacity: getCellOpacity(value) }}
                              >
                                {showValues && (
                                  <span className="text-xs font-semibold text-white drop-shadow-sm">
                                    {Math.round(value)}%
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">{row.rowLabel}</p>
                                <p className="text-muted-foreground">{col.label}</p>
                                <p className={cn("font-bold mt-1", getScoreColor(value))}>
                                  {formatPercent(value)}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-muted-foreground">&lt; 50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-muted-foreground">50-70%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-amber-400" />
            <span className="text-muted-foreground">70-85%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-muted-foreground">&gt; 85%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
