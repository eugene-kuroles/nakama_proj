"use client";

import { DataTable, Column } from "./DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPercent, formatDuration, formatDate, getScoreColor, getScoreBgColor } from "@/lib/utils";
import { CallRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, Eye } from "lucide-react";
import Link from "next/link";

interface CallsTableProps {
  data: CallRecord[];
  title?: string;
  showManager?: boolean;
  onRowClick?: (call: CallRecord) => void;
  className?: string;
}

export function CallsTable({
  data,
  title = "Звонки",
  showManager = true,
  onRowClick,
  className,
}: CallsTableProps) {
  const columns: Column<CallRecord>[] = [
    {
      key: 'date',
      header: 'Дата',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(value as string)}</span>
        </div>
      ),
    },
    {
      key: 'client_name',
      header: 'Клиент',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{(value as string) || '—'}</span>
      ),
    },
    ...(showManager ? [{
      key: 'manager_name',
      header: 'Менеджер',
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{value as string}</span>
        </div>
      ),
    }] as Column<CallRecord>[] : []),
    {
      key: 'duration',
      header: 'Длительность',
      sortable: true,
      className: 'text-center',
      render: (value) => (
        <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(value as number)}</span>
        </div>
      ),
    },
    {
      key: 'score',
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
              getScoreBgColor(score),
              getScoreColor(score),
            )}
          >
            {formatPercent(score, 0)}
          </Badge>
        );
      },
    },
    {
      key: 'id',
      header: '',
      className: 'text-right w-24',
      render: (value) => (
        <Button 
          variant="ghost" 
          size="sm"
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/call/${value}`}>
            <Eye className="h-4 w-4 mr-1" />
            Детали
          </Link>
        </Button>
      ),
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
          data={data}
          columns={columns}
          onRowClick={onRowClick}
          emptyMessage="Нет звонков"
          stickyHeader
        />
      </CardContent>
    </Card>
  );
}
