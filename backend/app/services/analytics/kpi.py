"""
KPI Service - Key Performance Indicators calculations
"""
from datetime import date
from typing import List, Dict, Optional
from collections import defaultdict

import numpy as np
import pandas as pd

from app.models.call import Call
from app.schemas.analytics import (
    ManagerRanking,
    CriteriaStats,
    KPISummary,
)


class KPIService:
    """Service for calculating Key Performance Indicators"""
    
    def calculate_average_score(
        self,
        calls: List[Call],
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> float:
        """
        Calculate average final_percent score for calls in period.
        
        Args:
            calls: List of Call objects
            date_from: Optional start date filter
            date_to: Optional end date filter
            
        Returns:
            Average score as float (0-100)
        """
        if not calls:
            return 0.0
        
        filtered_calls = self._filter_by_date(calls, date_from, date_to)
        
        if not filtered_calls:
            return 0.0
        
        scores = [call.final_percent for call in filtered_calls]
        return round(np.mean(scores), 2)
    
    def calculate_calls_count(
        self,
        calls: List[Call],
        group_by: str = "day",
    ) -> Dict[str, int]:
        """
        Count calls grouped by time period.
        
        Args:
            calls: List of Call objects
            group_by: Grouping period - 'day', 'week', 'month'
            
        Returns:
            Dict with period as key and count as value
        """
        if not calls:
            return {}
        
        # Convert to DataFrame for easier grouping
        df = pd.DataFrame([
            {"date": call.call_date, "id": call.id}
            for call in calls
        ])
        
        if df.empty:
            return {}
        
        df["date"] = pd.to_datetime(df["date"])
        
        # Group by period
        if group_by == "day":
            df["period"] = df["date"].dt.strftime("%Y-%m-%d")
        elif group_by == "week":
            df["period"] = df["date"].dt.strftime("%Y-W%V")
        elif group_by == "month":
            df["period"] = df["date"].dt.strftime("%Y-%m")
        else:
            df["period"] = df["date"].dt.strftime("%Y-%m-%d")
        
        counts = df.groupby("period").size().to_dict()
        return dict(sorted(counts.items()))
    
    def calculate_total_duration(self, calls: List[Call]) -> int:
        """
        Calculate total call duration in seconds.
        
        Args:
            calls: List of Call objects
            
        Returns:
            Total duration in seconds
        """
        if not calls:
            return 0
        
        return sum(call.duration for call in calls)
    
    def calculate_manager_ranking(
        self,
        calls: List[Call],
        period: str = "week",
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[ManagerRanking]:
        """
        Calculate manager ranking by average score.
        
        Args:
            calls: List of Call objects
            period: Period for grouping - 'week', 'month', 'all'
            date_from: Optional start date filter
            date_to: Optional end date filter
            
        Returns:
            List of ManagerRanking sorted by average score (descending)
        """
        if not calls:
            return []
        
        filtered_calls = self._filter_by_date(calls, date_from, date_to)
        
        if not filtered_calls:
            return []
        
        # Group calls by manager
        manager_calls: Dict[int, List[Call]] = defaultdict(list)
        manager_names: Dict[int, str] = {}
        
        for call in filtered_calls:
            manager_calls[call.manager_id].append(call)
            if call.manager:
                manager_names[call.manager_id] = call.manager.name
        
        # Calculate metrics for each manager
        rankings = []
        for manager_id, calls_list in manager_calls.items():
            scores = [c.final_percent for c in calls_list]
            avg_score = round(np.mean(scores), 2)
            
            # Determine trend (simplified - compare first and second half)
            trend = "stable"
            if len(scores) >= 4:
                mid = len(scores) // 2
                first_half_avg = np.mean(scores[:mid])
                second_half_avg = np.mean(scores[mid:])
                diff = second_half_avg - first_half_avg
                if diff > 5:
                    trend = "up"
                elif diff < -5:
                    trend = "down"
            
            rankings.append(ManagerRanking(
                manager_id=manager_id,
                manager_name=manager_names.get(manager_id, f"Manager {manager_id}"),
                average_score=avg_score,
                calls_count=len(calls_list),
                trend=trend,
            ))
        
        # Sort by score (descending) and assign ranks
        rankings.sort(key=lambda x: x.average_score, reverse=True)
        for i, ranking in enumerate(rankings, 1):
            ranking.rank = i
        
        return rankings
    
    def calculate_criteria_scores(
        self,
        calls: List[Call],
    ) -> Dict[str, CriteriaStats]:
        """
        Calculate statistics for each criteria across all calls.
        
        Args:
            calls: List of Call objects with loaded scores
            
        Returns:
            Dict with criteria_id as key and CriteriaStats as value
        """
        if not calls:
            return {}
        
        # Collect scores by criteria
        criteria_scores: Dict[int, List[float]] = defaultdict(list)
        criteria_names: Dict[int, str] = {}
        
        for call in calls:
            for score in call.scores:
                criteria_scores[score.criteria_id].append(score.score)
                if score.criteria:
                    criteria_names[score.criteria_id] = score.criteria.name
        
        # Calculate stats for each criteria
        result = {}
        for criteria_id, scores in criteria_scores.items():
            if scores:
                scores_array = np.array(scores)
                result[str(criteria_id)] = CriteriaStats(
                    criteria_id=criteria_id,
                    criteria_name=criteria_names.get(criteria_id, f"Criteria {criteria_id}"),
                    average_score=round(float(np.mean(scores_array)), 2),
                    min_score=round(float(np.min(scores_array)), 2),
                    max_score=round(float(np.max(scores_array)), 2),
                    std_deviation=round(float(np.std(scores_array)), 2),
                    calls_count=len(scores),
                )
        
        return result
    
    def calculate_summary(
        self,
        calls: List[Call],
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> KPISummary:
        """
        Calculate KPI summary for dashboard.
        
        Args:
            calls: List of Call objects
            date_from: Period start date
            date_to: Period end date
            
        Returns:
            KPISummary with aggregated metrics
        """
        filtered_calls = self._filter_by_date(calls, date_from, date_to)
        
        # Get unique managers
        manager_ids = set(call.manager_id for call in filtered_calls)
        
        # Calculate period bounds if not provided
        if filtered_calls:
            call_dates = [call.call_date.date() if hasattr(call.call_date, 'date') else call.call_date for call in filtered_calls]
            actual_start = date_from or min(call_dates)
            actual_end = date_to or max(call_dates)
        else:
            actual_start = date_from or date.today()
            actual_end = date_to or date.today()
        
        return KPISummary(
            average_score=self.calculate_average_score(filtered_calls),
            total_calls=len(filtered_calls),
            total_duration_minutes=self.calculate_total_duration(filtered_calls) // 60,
            managers_count=len(manager_ids),
            period_start=actual_start,
            period_end=actual_end,
        )
    
    def _filter_by_date(
        self,
        calls: List[Call],
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[Call]:
        """Filter calls by date range."""
        if not date_from and not date_to:
            return calls
        
        filtered = []
        for call in calls:
            call_date = call.call_date.date() if hasattr(call.call_date, 'date') else call.call_date
            
            if date_from and call_date < date_from:
                continue
            if date_to and call_date > date_to:
                continue
            
            filtered.append(call)
        
        return filtered
