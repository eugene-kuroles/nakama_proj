"""
Team Report Builder - Reports for ROP (Sales Department Head)
"""
from datetime import date
from typing import List, Dict

from app.models.call import Call
from app.schemas.analytics import (
    TeamReport,
    ManagerRanking,
    HeatMapData,
    CoachingItem,
    TimeSeriesPoint,
)
from app.services.analytics.kpi import KPIService
from app.services.analytics.trends import TrendsService
from app.services.analytics.aggregations import AggregationService
from app.services.analytics.correlations import CorrelationService
from app.services.analytics.predictions import PredictionService


class TeamReportBuilder:
    """Builder for team (ROP) reports"""
    
    def __init__(self):
        self.kpi_service = KPIService()
        self.trends_service = TrendsService()
        self.aggregation_service = AggregationService()
        self.correlation_service = CorrelationService()
        self.prediction_service = PredictionService()
    
    def build(
        self,
        calls: List[Call],
        date_from: date,
        date_to: date,
    ) -> TeamReport:
        """
        Build complete team report for ROP.
        
        Args:
            calls: List of Call objects for the period
            date_from: Report period start
            date_to: Report period end
            
        Returns:
            TeamReport with all sections
        """
        # Calculate team average
        scores = [c.final_percent for c in calls]
        team_avg = round(sum(scores) / len(scores), 2) if scores else 0.0
        
        return TeamReport(
            period_start=date_from,
            period_end=date_to,
            leaderboard=self._build_leaderboard(calls),
            criteria_heatmap=self._build_heatmap(calls),
            coaching_queue=self._build_coaching_queue(calls),
            team_trends=self._build_trends(calls),
            team_average=team_avg,
        )
    
    def _build_leaderboard(self, calls: List[Call]) -> List[ManagerRanking]:
        """Build manager leaderboard with detailed metrics."""
        return self.kpi_service.calculate_manager_ranking(calls)
    
    def _build_heatmap(self, calls: List[Call]) -> HeatMapData:
        """Build manager × criteria heatmap."""
        return self.correlation_service.calculate_manager_criteria_matrix(calls)
    
    def _build_coaching_queue(self, calls: List[Call]) -> List[CoachingItem]:
        """
        Build prioritized coaching queue.
        Managers who need attention first.
        """
        if not calls:
            return []
        
        ranking = self.kpi_service.calculate_manager_ranking(calls)
        coaching_queue = []
        
        priority = 1
        for manager in ranking:
            # Determine if manager needs coaching
            needs_coaching = (
                manager.average_score < 70 or
                manager.trend == "down"
            )
            
            if needs_coaching:
                # Find focus areas using improvement suggestions
                manager_calls = [c for c in calls if c.manager_id == manager.manager_id]
                suggestions = self.prediction_service.identify_improvement_priority(
                    calls, 
                    manager.manager_id
                )
                
                focus_areas = [s.criteria_name for s in suggestions[:3]]
                
                coaching_queue.append(CoachingItem(
                    manager_id=manager.manager_id,
                    manager_name=manager.manager_name,
                    priority=priority,
                    focus_areas=focus_areas,
                    recent_score=manager.average_score,
                    score_trend=manager.trend,
                ))
                priority += 1
        
        return coaching_queue
    
    def _build_trends(self, calls: List[Call]) -> List[TimeSeriesPoint]:
        """Build team trend data."""
        return self.trends_service.calculate_time_series(
            calls,
            metric="score",
            group_by="day"
        )
    
    def build_manager_comparison(
        self,
        calls: List[Call],
        manager_ids: List[int],
    ) -> Dict:
        """
        Build detailed comparison between selected managers.
        
        Args:
            calls: All calls
            manager_ids: IDs of managers to compare
            
        Returns:
            Comparison data
        """
        comparison = self.aggregation_service.compare_managers(calls, manager_ids)
        
        # Add trend data for each manager
        for manager_name, data in comparison.items():
            manager_calls = [c for c in calls if c.manager_id == data["manager_id"]]
            time_series = self.trends_service.calculate_time_series(
                manager_calls, 
                metric="score", 
                group_by="week"
            )
            values = [p.value for p in time_series]
            trend = self.trends_service.calculate_trend(values)
            data["trend"] = {
                "direction": trend.direction,
                "change_percent": trend.change_percent,
            }
        
        return comparison
    
    def build_criteria_analysis(self, calls: List[Call]) -> Dict:
        """
        Build detailed criteria analysis for the team.
        
        Args:
            calls: List of calls
            
        Returns:
            Criteria analysis data
        """
        # Get weak criteria
        weak_criteria = self.correlation_service.analyze_weak_criteria(calls)
        
        # Get criteria impact
        criteria_impact = self.correlation_service.calculate_criteria_impact(calls)
        
        # Get criteria aggregation
        criteria_agg = self.aggregation_service.aggregate_by_criteria(calls)
        
        return {
            "weak_criteria": weak_criteria[:10],
            "high_impact_criteria": [c.model_dump() for c in criteria_impact if c.impact_category == "high"],
            "criteria_stats": [c.model_dump() for c in criteria_agg],
        }
    
    def build_weekly_digest(self, calls: List[Call]) -> Dict:
        """
        Build a weekly digest for ROP.
        
        Args:
            calls: Calls for the week
            
        Returns:
            Weekly digest data
        """
        if not calls:
            return {
                "has_data": False,
                "message": "No calls in this period",
            }
        
        scores = [c.final_percent for c in calls]
        ranking = self.kpi_service.calculate_manager_ranking(calls)
        
        # Find star performer (highest score + positive trend)
        star = None
        for m in ranking:
            if m.trend == "up" or (m.trend == "stable" and m.average_score >= 80):
                star = m
                break
        
        # Find who needs help
        needs_help = [m for m in ranking if m.average_score < 65 or m.trend == "down"]
        
        return {
            "has_data": True,
            "total_calls": len(calls),
            "team_average": round(sum(scores) / len(scores), 1),
            "star_performer": star.model_dump() if star else None,
            "needs_help": [m.model_dump() for m in needs_help[:3]],
            "top_3": [m.model_dump() for m in ranking[:3]],
            "bottom_3": [m.model_dump() for m in ranking[-3:]] if len(ranking) >= 3 else [],
        }
