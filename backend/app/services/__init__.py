"""
Services module - business logic layer
"""
from app.services.upload import UploadService, UploadResult
from app.services.analytics import (
    KPIService,
    TrendsService,
    CorrelationService,
    AggregationService,
    PredictionService,
)
from app.services.reports import (
    ExecutiveReportBuilder,
    TeamReportBuilder,
    ManagerReportBuilder,
)

__all__ = [
    # Upload
    "UploadService",
    "UploadResult",
    # Analytics
    "KPIService",
    "TrendsService",
    "CorrelationService",
    "AggregationService",
    "PredictionService",
    # Reports
    "ExecutiveReportBuilder",
    "TeamReportBuilder",
    "ManagerReportBuilder",
]
