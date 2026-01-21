"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
  stickyHeader?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "Нет данных",
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr, 'ru')
        : bStr.localeCompare(aStr, 'ru');
    });
  }, [data, sortKey, sortDirection]);

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 text-primary" />;
    }
    return <ChevronDown className="h-4 w-4 text-primary" />;
  };

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <Table>
        <TableHeader className={cn(stickyHeader && "sticky top-0 bg-card z-10")}>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={cn(
                  "font-semibold",
                  column.sortable && "cursor-pointer select-none",
                  column.className
                )}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && getSortIcon(String(column.key))}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, index) => (
              <TableRow
                key={index}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => {
                  const value = row[column.key as keyof T];
                  return (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render
                        ? column.render(value, row, index)
                        : String(value ?? '')}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
