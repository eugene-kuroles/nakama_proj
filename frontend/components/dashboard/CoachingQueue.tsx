"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent } from "@/lib/utils";
import { CoachingItem } from "@/types";
import { GraduationCap, AlertCircle, Clock, CheckCircle } from "lucide-react";

interface CoachingQueueProps {
  items: CoachingItem[];
  title?: string;
  className?: string;
}

const priorityConfig = {
  high: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Срочно',
  },
  medium: {
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Средний',
  },
  low: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Низкий',
  },
};

export function CoachingQueue({
  items,
  title = "Coaching Queue",
  className,
}: CoachingQueueProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const config = priorityConfig[item.priority];
            const Icon = config.icon;
            
            return (
              <div 
                key={`${item.managerId}-${item.criteria}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div>
                    <p className="font-medium">{item.managerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.criteria}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={cn("font-bold", config.color)}>
                    {formatPercent(item.score)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
