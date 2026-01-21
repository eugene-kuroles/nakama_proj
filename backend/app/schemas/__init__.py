"""
Pydantic schemas for API requests and responses
"""
from app.schemas.analytics import (
    # KPI
    ManagerRanking,
    CriteriaStats,
    KPISummary,
    # Trends
    TrendResult,
    WoWComparison,
    TimeSeriesPoint,
    AnomalyPoint,
    # Correlations
    CorrelationMatrix,
    CriteriaImpact,
    HeatMapData,
    # Aggregations
    ManagerAggregation,
    CriteriaAggregation,
    GroupAggregation,
    PeriodAggregation,
    PercentilesResult,
    # Predictions
    PredictionPoint,
    ImprovementPrediction,
    ImprovementSuggestion,
    # Charts
    RadarChartData,
    # Reports
    ExecutiveSummary,
    RiskSignal,
    ExecutiveReport,
    CoachingItem,
    TeamReport,
    ManagerReport,
)

__all__ = [
    # KPI
    "ManagerRanking",
    "CriteriaStats",
    "KPISummary",
    # Trends
    "TrendResult",
    "WoWComparison",
    "TimeSeriesPoint",
    "AnomalyPoint",
    # Correlations
    "CorrelationMatrix",
    "CriteriaImpact",
    "HeatMapData",
    # Aggregations
    "ManagerAggregation",
    "CriteriaAggregation",
    "GroupAggregation",
    "PeriodAggregation",
    "PercentilesResult",
    # Predictions
    "PredictionPoint",
    "ImprovementPrediction",
    "ImprovementSuggestion",
    # Charts
    "RadarChartData",
    # Reports
    "ExecutiveSummary",
    "RiskSignal",
    "ExecutiveReport",
    "CoachingItem",
    "TeamReport",
    "ManagerReport",
]
