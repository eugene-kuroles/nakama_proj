import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TrendDirection } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Score color utilities
export type ScoreLevel = 'excellent' | 'good' | 'warning' | 'danger';

export function getScoreLevel(percent: number): ScoreLevel {
  if (percent >= 85) return 'excellent';
  if (percent >= 70) return 'good';
  if (percent >= 50) return 'warning';
  return 'danger';
}

/**
 * Get color class based on score
 */
export function getScoreColor(percent: number): string {
  if (percent >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (percent >= 70) return "text-amber-600 dark:text-amber-400";
  if (percent >= 50) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Get background color class based on score
 */
export function getScoreBgColor(percent: number): string {
  if (percent >= 85) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (percent >= 70) return "bg-amber-100 dark:bg-amber-900/30";
  if (percent >= 50) return "bg-orange-100 dark:bg-orange-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

/**
 * Get trend color
 */
export function getTrendColor(trend: TrendDirection): string {
  const colors: Record<TrendDirection, string> = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    flat: 'text-muted-foreground',
  };
  return colors[trend];
}

/**
 * Get trend indicator
 */
export function getTrendIndicator(change: number): { icon: string; color: string; trend: TrendDirection } {
  if (change > 1) return { icon: "↑", color: "text-emerald-600 dark:text-emerald-400", trend: 'up' };
  if (change < -1) return { icon: "↓", color: "text-red-600 dark:text-red-400", trend: 'down' };
  return { icon: "→", color: "text-muted-foreground", trend: 'flat' };
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDurationShort(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format change value with sign
 */
export function formatChange(change: number, withSign: boolean = true): string {
  const sign = change > 0 ? '+' : '';
  return withSign ? `${sign}${change.toFixed(1)}%` : `${Math.abs(change).toFixed(1)}%`;
}

/**
 * Format date to short format (day month)
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format date to full format
 */
export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Chart colors for Recharts
export const chartColors = {
  primary: 'hsl(221, 83%, 53%)',
  secondary: 'hsl(142, 76%, 36%)',
  tertiary: 'hsl(38, 92%, 50%)',
  quaternary: 'hsl(280, 65%, 60%)',
  quinary: 'hsl(0, 84%, 60%)',
};

export const chartColorsList = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.tertiary,
  chartColors.quaternary,
  chartColors.quinary,
];

export function getChartColor(index: number): string {
  return chartColorsList[index % chartColorsList.length];
}

// Rank medal/emoji
export function getRankDisplay(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
}
