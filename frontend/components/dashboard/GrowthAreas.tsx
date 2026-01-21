"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, getScoreColor } from "@/lib/utils";
import { GrowthArea } from "@/types";
import { Target, Lightbulb, TrendingDown } from "lucide-react";

interface GrowthAreasProps {
  areas: GrowthArea[];
  title?: string;
  className?: string;
}

export function GrowthAreas({
  areas,
  title = "Growth Areas",
  className,
}: GrowthAreasProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {areas.map((area) => {
          const diff = area.userScore - area.teamAverage;
          
          return (
            <div 
              key={area.criteriaId}
              className="p-4 rounded-lg border bg-muted/20 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{area.criteriaName}</p>
                    <p className="text-sm text-muted-foreground">
                      Ваш результат: {' '}
                      <span className={cn("font-medium", getScoreColor(area.userScore))}>
                        {formatPercent(area.userScore)}
                      </span>
                      {' '}(команда: {formatPercent(area.teamAverage)})
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-red-600 dark:text-red-400">
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                </Badge>
              </div>
              
              {/* Recommendation */}
              <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {area.recommendation}
                </p>
              </div>
            </div>
          );
        })}
        
        {areas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Отличная работа! Нет критичных зон для улучшения.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
