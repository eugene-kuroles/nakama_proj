"""
Manager Report Builder - Individual manager reports
"""
from datetime import date
from typing import List, Dict

import numpy as np

from app.models.call import Call
from app.schemas.analytics import (
    ManagerReport,
    KPISummary,
    RadarChartData,
    TimeSeriesPoint,
    ImprovementSuggestion,
)
from app.services.analytics.kpi import KPIService
from app.services.analytics.trends import TrendsService
from app.services.analytics.aggregations import AggregationService
from app.services.analytics.predictions import PredictionService


class ManagerReportBuilder:
    """Builder for individual manager reports"""
    
    def __init__(self):
        self.kpi_service = KPIService()
        self.trends_service = TrendsService()
        self.aggregation_service = AggregationService()
        self.prediction_service = PredictionService()
    
    def build(
        self,
        all_calls: List[Call],
        manager_id: int,
        date_from: date,
        date_to: date,
    ) -> ManagerReport:
        """
        Build complete individual manager report.
        
        Args:
            all_calls: All calls (for comparison)
            manager_id: Target manager ID
            date_from: Report period start
            date_to: Report period end
            
        Returns:
            ManagerReport with all sections
        """
        # Filter calls for this manager
        manager_calls = [c for c in all_calls if c.manager_id == manager_id]
        
        # Get manager name
        manager_name = "Unknown"
        if manager_calls and manager_calls[0].manager:
            manager_name = manager_calls[0].manager.name
        
        return ManagerReport(
            manager_id=manager_id,
            manager_name=manager_name,
            period_start=date_from,
            period_end=date_to,
            my_kpis=self._build_kpis(manager_calls, date_from, date_to),
            my_radar=self._build_radar_profile(all_calls, manager_calls),
            my_trend=self._build_trend(manager_calls),
            growth_areas=self._build_growth_areas(all_calls, manager_id),
            recent_calls=self._build_recent_calls(manager_calls),
        )
    
    def _build_kpis(
        self,
        calls: List[Call],
        date_from: date,
        date_to: date,
    ) -> KPISummary:
        """Build KPI summary for the manager."""
        return self.kpi_service.calculate_summary(calls, date_from, date_to)
    
    def _build_radar_profile(
        self,
        all_calls: List[Call],
        manager_calls: List[Call],
    ) -> RadarChartData:
        """
        Build radar chart data comparing manager to team average.
        Uses criteria groups as dimensions.
        """
        if not manager_calls:
            return RadarChartData(labels=[], values=[], team_avg=[])
        
        # Calculate team averages by group
        team_group_scores: Dict[int, List[float]] = {}
        group_names: Dict[int, str] = {}
        
        for call in all_calls:
            for group_avg in call.group_averages:
                if group_avg.group_id not in team_group_scores:
                    team_group_scores[group_avg.group_id] = []
                team_group_scores[group_avg.group_id].append(group_avg.average_score)
                if group_avg.group:
                    group_names[group_avg.group_id] = group_avg.group.name
        
        # Calculate manager averages by group
        manager_group_scores: Dict[int, List[float]] = {}
        for call in manager_calls:
            for group_avg in call.group_averages:
                if group_avg.group_id not in manager_group_scores:
                    manager_group_scores[group_avg.group_id] = []
                manager_group_scores[group_avg.group_id].append(group_avg.average_score)
        
        # Build radar data
        labels = []
        values = []
        team_avg = []
        
        for group_id in sorted(team_group_scores.keys()):
            labels.append(group_names.get(group_id, f"Group {group_id}"))
            
            # Team average
            team_scores = team_group_scores[group_id]
            team_avg.append(round(float(np.mean(team_scores)), 1))
            
            # Manager average
            manager_scores = manager_group_scores.get(group_id, [])
            if manager_scores:
                values.append(round(float(np.mean(manager_scores)), 1))
            else:
                values.append(0.0)
        
        return RadarChartData(
            labels=labels,
            values=values,
            team_avg=team_avg,
        )
    
    def _build_trend(self, calls: List[Call]) -> List[TimeSeriesPoint]:
        """Build manager's score trend."""
        return self.trends_service.calculate_time_series(
            calls,
            metric="score",
            group_by="day"
        )
    
    def _build_growth_areas(
        self,
        all_calls: List[Call],
        manager_id: int,
    ) -> List[ImprovementSuggestion]:
        """Build prioritized improvement suggestions."""
        return self.prediction_service.identify_improvement_priority(
            all_calls,
            manager_id
        )
    
    def _build_recent_calls(
        self,
        calls: List[Call],
        limit: int = 10,
    ) -> List[Dict]:
        """Build list of recent calls with summary."""
        # Sort by date (newest first)
        sorted_calls = sorted(calls, key=lambda c: c.call_date, reverse=True)
        
        result = []
        for call in sorted_calls[:limit]:
            result.append({
                "id": call.id,
                "date": call.call_date.isoformat() if hasattr(call.call_date, 'isoformat') else str(call.call_date),
                "score": call.final_percent,
                "duration_minutes": call.duration // 60,
                "summary": call.summary[:100] if call.summary else None,
            })
        
        return result
    
    def build_progress_report(
        self,
        all_calls: List[Call],
        manager_id: int,
    ) -> Dict:
        """
        Build detailed progress report for coaching.
        
        Args:
            all_calls: All calls for comparison
            manager_id: Target manager
            
        Returns:
            Progress report data
        """
        manager_calls = [c for c in all_calls if c.manager_id == manager_id]
        
        if not manager_calls:
            return {
                "has_data": False,
                "message": "No calls found for this manager",
            }
        
        # Sort by date
        manager_calls.sort(key=lambda c: c.call_date)
        
        scores = [c.final_percent for c in manager_calls]
        
        # Calculate progress metrics
        if len(scores) >= 10:
            first_10_avg = np.mean(scores[:10])
            last_10_avg = np.mean(scores[-10:])
            improvement = last_10_avg - first_10_avg
        else:
            first_10_avg = np.mean(scores[:len(scores)//2]) if len(scores) > 1 else scores[0]
            last_10_avg = np.mean(scores[len(scores)//2:]) if len(scores) > 1 else scores[0]
            improvement = last_10_avg - first_10_avg
        
        # Calculate consistency (inverse of standard deviation)
        std_dev = np.std(scores)
        consistency = max(0, 100 - std_dev)  # Higher = more consistent
        
        # Get trajectory prediction
        trajectory = self.prediction_service.predict_manager_trajectory(
            all_calls,
            manager_id,
            days_ahead=30
        )
        
        return {
            "has_data": True,
            "total_calls": len(manager_calls),
            "current_average": round(float(np.mean(scores[-10:])) if len(scores) >= 10 else float(np.mean(scores)), 1),
            "overall_average": round(float(np.mean(scores)), 1),
            "best_score": round(float(np.max(scores)), 1),
            "worst_score": round(float(np.min(scores)), 1),
            "improvement": round(float(improvement), 1),
            "consistency": round(float(consistency), 1),
            "trajectory": trajectory,
        }
    
    def build_comparison_with_team(
        self,
        all_calls: List[Call],
        manager_id: int,
    ) -> Dict:
        """
        Build comparison of manager with team average.
        
        Args:
            all_calls: All calls
            manager_id: Target manager
            
        Returns:
            Comparison data
        """
        manager_calls = [c for c in all_calls if c.manager_id == manager_id]
        other_calls = [c for c in all_calls if c.manager_id != manager_id]
        
        if not manager_calls:
            return {
                "has_data": False,
                "message": "No calls found for this manager",
            }
        
        manager_scores = [c.final_percent for c in manager_calls]
        team_scores = [c.final_percent for c in other_calls]
        
        manager_avg = np.mean(manager_scores)
        team_avg = np.mean(team_scores) if team_scores else manager_avg
        
        # Calculate rank
        all_manager_aggs = self.aggregation_service.aggregate_by_manager(all_calls)
        rank = 1
        for agg in all_manager_aggs:
            if agg.manager_id == manager_id:
                break
            rank += 1
        
        return {
            "has_data": True,
            "manager_average": round(float(manager_avg), 1),
            "team_average": round(float(team_avg), 1),
            "difference": round(float(manager_avg - team_avg), 1),
            "percentile": round(float(np.percentile(team_scores, manager_avg)) if team_scores else 50, 1),
            "rank": rank,
            "total_managers": len(all_manager_aggs),
        }
