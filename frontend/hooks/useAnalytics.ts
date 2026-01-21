"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProject } from "@/app/providers";

// Types for API responses
export interface KPISummary {
  avg_score: number;
  total_calls: number;
  total_duration_minutes: number;
  total_managers: number;
  score_change: number;
  calls_change: number;
}

export interface ManagerRanking {
  id: number;
  name: string;
  avg_score: number;
  total_calls: number;
  trend: number;
}

export interface CriteriaStats {
  id: number;
  name: string;
  group_name: string;
  avg_score: number;
  impact_score: number;
}

export interface TrendPoint {
  period: string;
  value: number;
  label: string;
}

export interface ExecutiveSummary {
  kpis: KPISummary;
  top_managers: ManagerRanking[];
  problem_criteria: CriteriaStats[];
  trend: TrendPoint[];
}

export interface TeamLeaderboard {
  managers: ManagerRanking[];
  team_avg: number;
  period: string;
}

export interface ManagerSummary {
  avg_score: number;
  total_calls: number;
  rank: number;
  total_managers: number;
  vs_team: number;
  trend: TrendPoint[];
}

// Hook for executive summary
export function useExecutiveSummary(dateFrom?: string, dateTo?: string) {
  const { projectId } = useProject();
  
  return useQuery({
    queryKey: ["executive-summary", projectId, dateFrom, dateTo],
    queryFn: async () => {
      if (!projectId) return null;
      
      const params = new URLSearchParams({ project_id: String(projectId) });
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      
      return api.get<ExecutiveSummary>(`/analytics/executive/summary?${params}`);
    },
    enabled: !!projectId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for team leaderboard
export function useTeamLeaderboard(dateFrom?: string, dateTo?: string) {
  const { projectId } = useProject();
  
  return useQuery({
    queryKey: ["team-leaderboard", projectId, dateFrom, dateTo],
    queryFn: async () => {
      if (!projectId) return null;
      
      const params = new URLSearchParams({ project_id: String(projectId) });
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      
      return api.get<TeamLeaderboard>(`/analytics/team/leaderboard?${params}`);
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

// Hook for manager summary
export function useManagerSummary(managerId: number | null, dateFrom?: string, dateTo?: string) {
  const { projectId } = useProject();
  
  return useQuery({
    queryKey: ["manager-summary", managerId, projectId, dateFrom, dateTo],
    queryFn: async () => {
      if (!projectId || !managerId) return null;
      
      const params = new URLSearchParams({ project_id: String(projectId) });
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      
      return api.get<ManagerSummary>(`/analytics/manager/${managerId}/summary?${params}`);
    },
    enabled: !!projectId && !!managerId,
    staleTime: 60 * 1000,
  });
}
