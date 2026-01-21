"""
Analytics schemas - DTOs for analytics services
"""
from datetime import date, datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


# ============ KPI Schemas ============

class ManagerRanking(BaseModel):
    """Manager ranking data"""
    manager_id: int
    manager_name: str
    average_score: float
    calls_count: int
    trend: str = "stable"  # up, down, stable
    rank: int = 0


class CriteriaStats(BaseModel):
    """Statistics for a single criteria"""
    criteria_id: int
    criteria_name: str
    average_score: float
    min_score: float
    max_score: float
    std_deviation: float
    calls_count: int


class KPISummary(BaseModel):
    """KPI summary for dashboard"""
    average_score: float
    total_calls: int
    total_duration_minutes: int
    managers_count: int
    period_start: date
    period_end: date


# ============ Trend Schemas ============

class TrendResult(BaseModel):
    """Result of trend calculation"""
    direction: str  # up, down, stable
    change_percent: float
    moving_average: List[float]
    slope: float
    confidence: float = 0.0


class WoWComparison(BaseModel):
    """Week-over-week comparison"""
    current_week_avg: float
    previous_week_avg: float
    change_percent: float
    direction: str
    current_week_count: int
    previous_week_count: int


class TimeSeriesPoint(BaseModel):
    """Single point in time series"""
    date: str  # ISO format: "2025-01-06"
    value: float
    label: Optional[str] = None  # "Week 2", "January"


class AnomalyPoint(BaseModel):
    """Anomaly detection result"""
    index: int
    value: float
    expected_value: float
    deviation: float
    date: Optional[str] = None


# ============ Correlation Schemas ============

class CorrelationMatrix(BaseModel):
    """Correlation matrix data"""
    labels: List[str]  # Criteria names
    matrix: List[List[float]]  # 2D correlation values


class CriteriaImpact(BaseModel):
    """Impact of a criteria on final score"""
    criteria_id: int
    criteria_name: str
    correlation: float  # Pearson correlation with final_percent
    impact_category: str  # high, medium, low


class HeatMapData(BaseModel):
    """Heatmap data for visualization"""
    rows: List[str]  # Manager names
    columns: List[str]  # Criteria names
    values: List[List[float]]  # 2D matrix


# ============ Aggregation Schemas ============

class ManagerAggregation(BaseModel):
    """Aggregated metrics for a manager"""
    manager_id: int
    manager_name: str
    total_calls: int
    average_score: float
    total_duration_minutes: int
    first_call: Optional[date] = None
    last_call: Optional[date] = None


class CriteriaAggregation(BaseModel):
    """Aggregated metrics for a criteria"""
    criteria_id: int
    criteria_name: str
    group_name: str
    average_score: float
    calls_evaluated: int
    score_distribution: Dict[str, int] = {}  # {"0-20": 5, "21-40": 10, ...}


class GroupAggregation(BaseModel):
    """Aggregated metrics for a criteria group"""
    group_id: int
    group_name: str
    average_score: float
    criteria_count: int
    calls_evaluated: int


class PeriodAggregation(BaseModel):
    """Aggregated metrics for a time period"""
    period: str  # "2025-01-06", "2025-W02", "2025-01"
    period_label: str  # "Mon 6 Jan", "Week 2", "January"
    calls_count: int
    average_score: float
    total_duration_minutes: int


class PercentilesResult(BaseModel):
    """Percentile distribution"""
    p10: float
    p25: float
    p50: float  # median
    p75: float
    p90: float
    min_value: float
    max_value: float


# ============ Prediction Schemas ============

class PredictionPoint(BaseModel):
    """Single prediction point"""
    date: str
    predicted_value: float
    confidence_lower: float
    confidence_upper: float


class ImprovementPrediction(BaseModel):
    """Prediction of what happens without improvement"""
    manager_id: int
    current_score: float
    predicted_score_30_days: float
    predicted_score_90_days: float
    risk_level: str  # low, medium, high
    criteria_at_risk: List[str]


class ImprovementSuggestion(BaseModel):
    """Suggestion for improvement prioritization"""
    criteria_id: int
    criteria_name: str
    current_score: float
    team_average: float
    gap_to_team: float
    impact_on_total: float  # How much final_percent will improve
    priority: int  # 1 = highest priority
    reason: str


# ============ Radar Chart Schemas ============

class RadarChartData(BaseModel):
    """Data for radar/spider chart"""
    labels: List[str]  # Criteria group names
    values: List[float]  # Manager's values
    team_avg: List[float]  # Team average values


# ============ Report Schemas ============

class ExecutiveSummary(BaseModel):
    """Summary for executive report"""
    total_calls: int
    average_score: float
    score_trend: TrendResult
    managers_count: int
    best_performer: Optional[ManagerRanking] = None
    needs_attention: Optional[ManagerRanking] = None


class RiskSignal(BaseModel):
    """Risk signal for executive report"""
    type: str  # score_decline, criteria_issue, manager_risk
    severity: str  # low, medium, high
    description: str
    affected_entity: str  # Manager name or criteria name
    recommendation: str


class ExecutiveReport(BaseModel):
    """Executive (CEO) report"""
    period_start: date
    period_end: date
    summary: ExecutiveSummary
    trends: List[TimeSeriesPoint]
    top_issues: List[CriteriaStats]
    manager_ranking: List[ManagerRanking]
    risk_signals: List[RiskSignal]


class CoachingItem(BaseModel):
    """Item for coaching queue"""
    manager_id: int
    manager_name: str
    priority: int
    focus_areas: List[str]
    recent_score: float
    score_trend: str


class TeamReport(BaseModel):
    """Team (ROP) report"""
    period_start: date
    period_end: date
    leaderboard: List[ManagerRanking]
    criteria_heatmap: HeatMapData
    coaching_queue: List[CoachingItem]
    team_trends: List[TimeSeriesPoint]
    team_average: float


class ManagerReport(BaseModel):
    """Individual manager report"""
    manager_id: int
    manager_name: str
    period_start: date
    period_end: date
    my_kpis: KPISummary
    my_radar: RadarChartData
    my_trend: List[TimeSeriesPoint]
    growth_areas: List[ImprovementSuggestion]
    recent_calls: List[Dict]  # Simplified call data
