"""
Analytics services module
"""
from app.services.analytics.kpi import KPIService
from app.services.analytics.trends import TrendsService
from app.services.analytics.correlations import CorrelationService
from app.services.analytics.aggregations import AggregationService
from app.services.analytics.predictions import PredictionService

__all__ = [
    "KPIService",
    "TrendsService",
    "CorrelationService",
    "AggregationService",
    "PredictionService",
]
