"""
Aggregation Service - Data grouping and aggregation operations
"""
from datetime import date
from typing import List, Dict, Optional
from collections import defaultdict

import numpy as np
import pandas as pd

from app.models.call import Call
from app.schemas.analytics import (
    ManagerAggregation,
    CriteriaAggregation,
    GroupAggregation,
    PeriodAggregation,
    PercentilesResult,
)


class AggregationService:
    """Service for data grouping and aggregation"""
    
    def aggregate_by_manager(
        self,
        calls: List[Call],
        metrics: List[str] = None,
    ) -> List[ManagerAggregation]:
        """
        Aggregate metrics by manager.
        
        Args:
            calls: List of Call objects
            metrics: Metrics to include (default: score, count, duration)
            
        Returns:
            List of ManagerAggregation
        """
        if metrics is None:
            metrics = ["score", "count", "duration"]
        
        if not calls:
            return []
        
        # Group by manager
        manager_calls: Dict[int, List[Call]] = defaultdict(list)
        manager_names: Dict[int, str] = {}
        
        for call in calls:
            manager_calls[call.manager_id].append(call)
            if call.manager:
                manager_names[call.manager_id] = call.manager.name
        
        # Aggregate for each manager
        result = []
        for manager_id, manager_call_list in manager_calls.items():
            scores = [c.final_percent for c in manager_call_list]
            durations = [c.duration for c in manager_call_list]
            dates = [c.call_date for c in manager_call_list]
            
            # Get date range
            first_call = None
            last_call = None
            if dates:
                first_call = min(dates).date() if hasattr(min(dates), 'date') else min(dates)
                last_call = max(dates).date() if hasattr(max(dates), 'date') else max(dates)
            
            result.append(ManagerAggregation(
                manager_id=manager_id,
                manager_name=manager_names.get(manager_id, f"Manager {manager_id}"),
                total_calls=len(manager_call_list),
                average_score=round(float(np.mean(scores)), 2) if scores else 0.0,
                total_duration_minutes=sum(durations) // 60,
                first_call=first_call,
                last_call=last_call,
            ))
        
        # Sort by average score (descending)
        result.sort(key=lambda x: x.average_score, reverse=True)
        
        return result
    
    def aggregate_by_criteria(
        self,
        calls: List[Call],
    ) -> List[CriteriaAggregation]:
        """
        Aggregate metrics by criteria.
        
        Args:
            calls: List of Call objects with scores
            
        Returns:
            List of CriteriaAggregation
        """
        if not calls:
            return []
        
        # Collect scores by criteria
        criteria_scores: Dict[int, List[float]] = defaultdict(list)
        criteria_names: Dict[int, str] = {}
        criteria_groups: Dict[int, str] = {}
        
        for call in calls:
            for score in call.scores:
                criteria_scores[score.criteria_id].append(score.score)
                if score.criteria:
                    criteria_names[score.criteria_id] = score.criteria.name
                    if score.criteria.group:
                        criteria_groups[score.criteria_id] = score.criteria.group.name
        
        # Aggregate for each criteria
        result = []
        for criteria_id, scores in criteria_scores.items():
            scores_array = np.array(scores)
            
            # Calculate score distribution
            distribution = self._calculate_score_distribution(scores)
            
            result.append(CriteriaAggregation(
                criteria_id=criteria_id,
                criteria_name=criteria_names.get(criteria_id, f"Criteria {criteria_id}"),
                group_name=criteria_groups.get(criteria_id, "Unknown"),
                average_score=round(float(np.mean(scores_array)), 2),
                calls_evaluated=len(scores),
                score_distribution=distribution,
            ))
        
        # Sort by average score
        result.sort(key=lambda x: x.average_score, reverse=True)
        
        return result
    
    def aggregate_by_criteria_group(
        self,
        calls: List[Call],
    ) -> List[GroupAggregation]:
        """
        Aggregate metrics by criteria group.
        
        Args:
            calls: List of Call objects with group_averages
            
        Returns:
            List of GroupAggregation
        """
        if not calls:
            return []
        
        # Collect from group_averages
        group_scores: Dict[int, List[float]] = defaultdict(list)
        group_names: Dict[int, str] = {}
        group_criteria_count: Dict[int, int] = {}
        
        for call in calls:
            for group_avg in call.group_averages:
                group_scores[group_avg.group_id].append(group_avg.average_score)
                if group_avg.group:
                    group_names[group_avg.group_id] = group_avg.group.name
                    # Count criteria in group
                    if group_avg.group_id not in group_criteria_count:
                        group_criteria_count[group_avg.group_id] = len(group_avg.group.criteria) if group_avg.group.criteria else 0
        
        # Aggregate for each group
        result = []
        for group_id, scores in group_scores.items():
            result.append(GroupAggregation(
                group_id=group_id,
                group_name=group_names.get(group_id, f"Group {group_id}"),
                average_score=round(float(np.mean(scores)), 2) if scores else 0.0,
                criteria_count=group_criteria_count.get(group_id, 0),
                calls_evaluated=len(scores),
            ))
        
        # Sort by average score (descending)
        result.sort(key=lambda x: x.average_score, reverse=True)
        
        return result
    
    def aggregate_by_period(
        self,
        calls: List[Call],
        period: str = "day",
    ) -> List[PeriodAggregation]:
        """
        Aggregate metrics by time period.
        
        Args:
            calls: List of Call objects
            period: Grouping period - 'day', 'week', 'month'
            
        Returns:
            List of PeriodAggregation sorted by period
        """
        if not calls:
            return []
        
        # Convert to DataFrame for grouping
        data = []
        for call in calls:
            data.append({
                "date": pd.to_datetime(call.call_date),
                "score": call.final_percent,
                "duration": call.duration,
            })
        
        df = pd.DataFrame(data)
        
        # Set period column and label
        if period == "day":
            df["period"] = df["date"].dt.strftime("%Y-%m-%d")
            df["label"] = df["date"].dt.strftime("%a %d %b")  # "Mon 06 Jan"
        elif period == "week":
            df["period"] = df["date"].dt.strftime("%Y-W%V")
            df["label"] = "Week " + df["date"].dt.isocalendar().week.astype(str)
        elif period == "month":
            df["period"] = df["date"].dt.strftime("%Y-%m")
            df["label"] = df["date"].dt.strftime("%B %Y")
        else:
            df["period"] = df["date"].dt.strftime("%Y-%m-%d")
            df["label"] = df["date"].dt.strftime("%a %d %b")
        
        # Group and aggregate
        grouped = df.groupby(["period", "label"]).agg({
            "score": ["mean", "count"],
            "duration": "sum",
        }).reset_index()
        
        # Flatten column names
        grouped.columns = ["period", "label", "avg_score", "count", "total_duration"]
        grouped = grouped.sort_values("period")
        
        # Build result
        result = []
        for _, row in grouped.iterrows():
            result.append(PeriodAggregation(
                period=row["period"],
                period_label=row["label"],
                calls_count=int(row["count"]),
                average_score=round(float(row["avg_score"]), 2),
                total_duration_minutes=int(row["total_duration"]) // 60,
            ))
        
        return result
    
    def calculate_percentiles(
        self,
        values: List[float],
    ) -> PercentilesResult:
        """
        Calculate percentile distribution.
        
        Args:
            values: List of numeric values
            
        Returns:
            PercentilesResult with P10, P25, P50 (median), P75, P90
        """
        if not values:
            return PercentilesResult(
                p10=0.0, p25=0.0, p50=0.0, p75=0.0, p90=0.0,
                min_value=0.0, max_value=0.0,
            )
        
        arr = np.array(values)
        
        return PercentilesResult(
            p10=round(float(np.percentile(arr, 10)), 2),
            p25=round(float(np.percentile(arr, 25)), 2),
            p50=round(float(np.percentile(arr, 50)), 2),  # median
            p75=round(float(np.percentile(arr, 75)), 2),
            p90=round(float(np.percentile(arr, 90)), 2),
            min_value=round(float(np.min(arr)), 2),
            max_value=round(float(np.max(arr)), 2),
        )
    
    def aggregate_by_manager_and_group(
        self,
        calls: List[Call],
    ) -> Dict[str, Dict[str, float]]:
        """
        Aggregate scores by manager and criteria group.
        Returns nested dict: manager_name -> group_name -> average_score
        
        Args:
            calls: List of Call objects
            
        Returns:
            Nested dictionary with aggregated scores
        """
        if not calls:
            return {}
        
        # Collect scores
        data: Dict[int, Dict[int, List[float]]] = defaultdict(lambda: defaultdict(list))
        manager_names: Dict[int, str] = {}
        group_names: Dict[int, str] = {}
        
        for call in calls:
            manager_id = call.manager_id
            if call.manager:
                manager_names[manager_id] = call.manager.name
            
            for group_avg in call.group_averages:
                data[manager_id][group_avg.group_id].append(group_avg.average_score)
                if group_avg.group:
                    group_names[group_avg.group_id] = group_avg.group.name
        
        # Build result
        result = {}
        for manager_id, groups in data.items():
            manager_name = manager_names.get(manager_id, f"Manager {manager_id}")
            result[manager_name] = {}
            
            for group_id, scores in groups.items():
                group_name = group_names.get(group_id, f"Group {group_id}")
                result[manager_name][group_name] = round(float(np.mean(scores)), 2)
        
        return result
    
    def compare_managers(
        self,
        calls: List[Call],
        manager_ids: List[int],
    ) -> Dict[str, Dict]:
        """
        Compare specific managers across all metrics.
        
        Args:
            calls: List of Call objects
            manager_ids: IDs of managers to compare
            
        Returns:
            Comparison data for each manager
        """
        if not calls or not manager_ids:
            return {}
        
        # Filter calls
        filtered_calls = [c for c in calls if c.manager_id in manager_ids]
        
        # Get aggregations
        manager_aggs = self.aggregate_by_manager(filtered_calls)
        
        result = {}
        for agg in manager_aggs:
            if agg.manager_id in manager_ids:
                result[agg.manager_name] = {
                    "manager_id": agg.manager_id,
                    "total_calls": agg.total_calls,
                    "average_score": agg.average_score,
                    "total_duration_minutes": agg.total_duration_minutes,
                }
        
        return result
    
    def _calculate_score_distribution(
        self,
        scores: List[float],
        bins: int = 5,
    ) -> Dict[str, int]:
        """
        Calculate score distribution for a list of scores.
        
        Args:
            scores: List of scores
            bins: Number of bins
            
        Returns:
            Dict with bin range as key and count as value
        """
        if not scores:
            return {}
        
        bin_size = 100 // bins
        distribution = {}
        
        for i in range(bins):
            start = i * bin_size
            end = (i + 1) * bin_size if i < bins - 1 else 100
            range_key = f"{start}-{end}"
            count = sum(1 for s in scores if start <= s < end or (i == bins - 1 and s == 100))
            distribution[range_key] = count
        
        return distribution
