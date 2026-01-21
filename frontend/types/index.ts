// Common types for the application

export type TrendDirection = 'up' | 'down' | 'flat';

export type UserRole = 'ceo' | 'sales_director' | 'rop' | 'manager' | 'marketing' | 'product' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  manager_id?: number; // For manager role - linked manager
}

export interface Manager {
  id: number;
  name: string;
  external_id: string;
  project_id: number;
}

export interface Call {
  id: number;
  external_id: string;
  call_date: string;
  call_week: string;
  duration_seconds: number;
  final_percent: number;
  manager_id: number;
  manager?: Manager;
}

export interface CallScore {
  id: number;
  call_id: number;
  criteria_id: number;
  score: string;
  reason?: string;
  quote?: string;
  criteria?: Criteria;
}

export interface CriteriaGroup {
  id: number;
  name: string;
  project_id: number;
  order: number;
}

export interface Criteria {
  id: number;
  group_id: number;
  number: number;
  name: string;
  prompt?: string;
  in_final_score: boolean;
  score_type: 'numeric' | 'tag' | 'recommendation';
}

export interface Project {
  id: number;
  name: string;
  client_name: string;
  created_at: string;
}

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
  impact_score?: number;
}

export interface TrendPoint {
  period: string;
  value: number;
  label: string;
}

export interface CoachingItem {
  managerId: number;
  managerName: string;
  criteria: string;
  score: number;
  priority: 'high' | 'medium' | 'low';
}

export interface GrowthArea {
  id: string;
  criteria: string;
  score: number;
  teamAvg: number;
  gap: number;
  recommendation: string;
}

export interface CallRecord {
  id: string;
  date: string;
  duration: number;
  score: number;
  manager_id: string;
  manager_name: string;
  client_name?: string;
  criteria_scores: CriteriaScore[];
}

export interface ManagerStats {
  id: string;
  name: string;
  avatar: string;
  total_calls: number;
  avg_score: number;
  trend: TrendDirection;
  change: number;
  rank: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

export interface TeamCriteriaData {
  managerId: string;
  managerName: string;
  criteria: Record<string, number>;
}

export type PeriodFilter = 'day' | 'week' | 'month' | 'quarter' | 'year';

// API Response types
export interface ExecutiveSummaryResponse {
  kpis: KPISummary;
  top_managers: ManagerRanking[];
  problem_criteria: CriteriaStats[];
  trend: TrendPoint[];
}

export interface TeamLeaderboardResponse {
  managers: ManagerRanking[];
  team_avg: number;
  period: string;
}

export interface ManagerSummaryResponse {
  avg_score: number;
  total_calls: number;
  rank: number;
  total_managers: number;
  vs_team: number;
  trend: TrendPoint[];
}
