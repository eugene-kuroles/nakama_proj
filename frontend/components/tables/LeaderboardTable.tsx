"use client";

import { DataTable, Column } from "./DataTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getRankDisplay, formatPercent, getTrendIndicator } from "@/lib/utils";
import { ManagerStats } from "@/types";
import { TrendingUp, TrendingDown, Minus, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardTableProps {
  data: ManagerStats[];
  title?: string;
  onRowClick?: (manager: ManagerStats) => void;
  className?: string;
}

export function LeaderboardTable({
  data,
  title = "Leaderboard",
  onRowClick,
  className,
}: LeaderboardTableProps) {
  // Sort by avg_score descending and add rank
  const rankedData = [...data]
    .sort((a, b) => b.avg_score - a.avg_score)
    .map((manager, index) => ({
      ...manager,
      rank: index + 1,
    }));

  const columns: Column<ManagerStats & { rank: number }>[] = [
    {
      key: 'rank',
      header: '#',
      className: 'w-12 text-center',
      render: (_, row) => (
        <span className="text-lg font-medium">
          {getRankDisplay(row.rank)}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Менеджер',
      sortable: true,
      render: (_, row) => {
        const initials = row.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarImage src={row.avatar} alt={row.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.name}</span>
          </div>
        );
      },
    },
    {
      key: 'avg_score',
      header: 'Оценка',
      sortable: true,
      className: 'text-center',
      render: (value) => {
        const score = value as number;
        return (
          <Badge 
            variant="secondary"
            className={cn(
              "text-sm font-bold px-3 py-1",
              score >= 85 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              score >= 70 && score < 85 && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              score < 70 && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            {formatPercent(score)}
          </Badge>
        );
      },
    },
    {
      key: 'total_calls',
      header: 'Звонки',
      sortable: true,
      className: 'text-center',
      render: (value) => (
        <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{value as number}</span>
        </div>
      ),
    },
    {
      key: 'change',
      header: 'Тренд',
      sortable: true,
      className: 'text-right',
      render: (_, row) => {
        const change = row.change ?? 0;
        const trend = getTrendIndicator(change);
        const TrendIcon = row.trend === 'up' 
          ? TrendingUp 
          : row.trend === 'down' 
            ? TrendingDown 
            : Minus;
        
        return (
          <div className={cn("flex items-center justify-end gap-1", trend.color)}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">{trend.icon} {Math.abs(change).toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6", "p-0")}>
        <DataTable
          data={rankedData}
          columns={columns}
          onRowClick={onRowClick}
          stickyHeader
        />
      </CardContent>
    </Card>
  );
}
