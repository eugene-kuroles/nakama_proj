"""
Executive Report Builder - Reports for CEO/C-level
"""
from datetime import date, timedelta
from typing import List, Optional

from app.models.call import Call
from app.schemas.analytics import (
    ExecutiveReport,
    ExecutiveSummary,
    RiskSignal,
    TimeSeriesPoint,
    CriteriaStats,
    ManagerRanking,
    TrendResult,
)
from app.services.analytics.kpi import KPIService
from app.services.analytics.trends import TrendsService
from app.services.analytics.aggregations import AggregationService
from app.services.analytics.correlations import CorrelationService


class ExecutiveReportBuilder:
    """Builder for executive (CEO) reports"""
    
    def __init__(self):
        self.kpi_service = KPIService()
        self.trends_service = TrendsService()
        self.aggregation_service = AggregationService()
        self.correlation_service = CorrelationService()
    
    def build(
        self,
        calls: List[Call],
        date_from: date,
        date_to: date,
    ) -> ExecutiveReport:
        """
        Build complete executive report.
        
        Args:
            calls: List of Call objects for the period
            date_from: Report period start
            date_to: Report period end
            
        Returns:
            ExecutiveReport with all sections
        """
        return ExecutiveReport(
            period_start=date_from,
            period_end=date_to,
            summary=self._build_summary(calls, date_from, date_to),
            trends=self._build_trends(calls),
            top_issues=self._build_top_issues(calls),
            manager_ranking=self._build_ranking(calls),
            risk_signals=self._build_risks(calls),
        )
    
    def _build_summary(
        self,
        calls: List[Call],
        date_from: date,
        date_to: date,
    ) -> ExecutiveSummary:
        """Build executive summary section."""
        # Calculate core metrics
        kpi_summary = self.kpi_service.calculate_summary(calls, date_from, date_to)
        
        # Calculate trend
        time_series = self.trends_service.calculate_time_series(calls, metric="score", group_by="day")
        values = [p.value for p in time_series]
        score_trend = self.trends_service.calculate_trend(values)
        
        # Get best and worst performers
        ranking = self.kpi_service.calculate_manager_ranking(calls)
        best_performer = ranking[0] if ranking else None
        needs_attention = ranking[-1] if ranking else None
        
        return ExecutiveSummary(
            total_calls=kpi_summary.total_calls,
            average_score=kpi_summary.average_score,
            score_trend=score_trend,
            managers_count=kpi_summary.managers_count,
            best_performer=best_performer,
            needs_attention=needs_attention,
        )
    
    def _build_trends(self, calls: List[Call]) -> List[TimeSeriesPoint]:
        """Build trend data for the main chart."""
        return self.trends_service.calculate_time_series(
            calls, 
            metric="score", 
            group_by="day"
        )
    
    def _build_top_issues(self, calls: List[Call]) -> List[CriteriaStats]:
        """Find top problem criteria (lowest average scores)."""
        criteria_stats = self.kpi_service.calculate_criteria_scores(calls)
        
        # Sort by average score (ascending = worst first)
        sorted_stats = sorted(
            criteria_stats.values(),
            key=lambda x: x.average_score
        )
        
        # Return top 5 worst criteria
        return sorted_stats[:5]
    
    def _build_ranking(self, calls: List[Call]) -> List[ManagerRanking]:
        """Build manager leaderboard."""
        return self.kpi_service.calculate_manager_ranking(calls)
    
    def _build_risks(self, calls: List[Call]) -> List[RiskSignal]:
        """Identify risk signals that need attention."""
        risks = []
        
        # Check for declining trends
        time_series = self.trends_service.calculate_time_series(calls, metric="score", group_by="week")
        if len(time_series) >= 2:
            values = [p.value for p in time_series]
            trend = self.trends_service.calculate_trend(values)
            
            if trend.direction == "down" and abs(trend.change_percent) > 5:
                risks.append(RiskSignal(
                    type="score_decline",
                    severity="high" if abs(trend.change_percent) > 10 else "medium",
                    description=f"Общий балл снижается на {abs(trend.change_percent):.1f}% за период",
                    affected_entity="Вся команда",
                    recommendation="Провести анализ причин снижения и разработать план коррекции",
                ))
        
        # Check for weak criteria
        weak_criteria = self.correlation_service.analyze_weak_criteria(calls, score_threshold=60)
        for weak in weak_criteria[:3]:  # Top 3 weak criteria
            risks.append(RiskSignal(
                type="criteria_issue",
                severity="high" if weak["average_score"] < 50 else "medium",
                description=f"Критерий '{weak['criteria_name']}' имеет низкий средний балл: {weak['average_score']:.1f}%",
                affected_entity=weak["criteria_name"],
                recommendation="Провести дополнительное обучение по данному критерию",
            ))
        
        # Check for managers at risk
        ranking = self.kpi_service.calculate_manager_ranking(calls)
        for manager in ranking:
            if manager.average_score < 60 or manager.trend == "down":
                severity = "high" if manager.average_score < 50 or (manager.trend == "down" and manager.average_score < 65) else "medium"
                
                risks.append(RiskSignal(
                    type="manager_risk",
                    severity=severity,
                    description=f"Менеджер '{manager.manager_name}' показывает низкие результаты ({manager.average_score:.1f}%)" + 
                               (", тренд снижается" if manager.trend == "down" else ""),
                    affected_entity=manager.manager_name,
                    recommendation="Назначить персональный коучинг и отслеживать прогресс",
                ))
        
        # Sort by severity
        severity_order = {"high": 0, "medium": 1, "low": 2}
        risks.sort(key=lambda x: severity_order.get(x.severity, 3))
        
        return risks[:10]  # Top 10 risks
    
    def build_quick_summary(self, calls: List[Call]) -> dict:
        """
        Build a quick summary for dashboard widget.
        
        Args:
            calls: List of calls
            
        Returns:
            Dict with key metrics
        """
        if not calls:
            return {
                "total_calls": 0,
                "average_score": 0,
                "trend": "stable",
                "managers": 0,
            }
        
        scores = [c.final_percent for c in calls]
        manager_ids = set(c.manager_id for c in calls)
        
        # Calculate simple trend
        trend = "stable"
        if len(scores) >= 10:
            first_half = scores[:len(scores)//2]
            second_half = scores[len(scores)//2:]
            diff = sum(second_half)/len(second_half) - sum(first_half)/len(first_half)
            if diff > 3:
                trend = "up"
            elif diff < -3:
                trend = "down"
        
        return {
            "total_calls": len(calls),
            "average_score": round(sum(scores) / len(scores), 1),
            "trend": trend,
            "managers": len(manager_ids),
        }
