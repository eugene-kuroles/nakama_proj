"""
Trends Service - Trend analysis and dynamics calculations
"""
from datetime import date
from typing import List, Optional
from collections import defaultdict

import numpy as np
import pandas as pd
from scipy import stats

from app.models.call import Call
from app.schemas.analytics import (
    TrendResult,
    WoWComparison,
    TimeSeriesPoint,
    AnomalyPoint,
)


class TrendsService:
    """Service for calculating trends and dynamics"""
    
    def calculate_trend(
        self,
        values: List[float],
        period: int = 7,
    ) -> TrendResult:
        """
        Determine trend direction using linear regression and moving average.
        
        Args:
            values: List of metric values (chronologically ordered)
            period: Days for moving average calculation
            
        Returns:
            TrendResult with direction, change percent, and moving average
        """
        if not values or len(values) < 2:
            return TrendResult(
                direction="stable",
                change_percent=0.0,
                moving_average=values if values else [],
                slope=0.0,
                confidence=0.0,
            )
        
        values_array = np.array(values, dtype=float)
        
        # Calculate moving average
        if len(values) >= period:
            moving_avg = pd.Series(values).rolling(window=period, min_periods=1).mean().tolist()
        else:
            moving_avg = pd.Series(values).expanding(min_periods=1).mean().tolist()
        
        # Linear regression for trend
        x = np.arange(len(values))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values_array)
        
        # Calculate change percent
        first_value = values_array[0]
        last_value = values_array[-1]
        if first_value != 0:
            change_percent = ((last_value - first_value) / first_value) * 100
        else:
            change_percent = 0.0 if last_value == 0 else 100.0
        
        # Determine direction based on slope and significance
        # Use 5% threshold for meaningful change
        threshold = 0.05 * np.mean(values_array) if np.mean(values_array) != 0 else 1.0
        
        if slope > threshold and p_value < 0.1:
            direction = "up"
        elif slope < -threshold and p_value < 0.1:
            direction = "down"
        else:
            direction = "stable"
        
        return TrendResult(
            direction=direction,
            change_percent=round(change_percent, 2),
            moving_average=[round(v, 2) for v in moving_avg],
            slope=round(slope, 4),
            confidence=round(r_value ** 2, 3),  # R-squared as confidence
        )
    
    def calculate_week_over_week(
        self,
        current_week: List[Call],
        previous_week: List[Call],
    ) -> WoWComparison:
        """
        Compare metrics between current and previous week.
        
        Args:
            current_week: Calls from current week
            previous_week: Calls from previous week
            
        Returns:
            WoWComparison with averages and change
        """
        current_avg = 0.0
        previous_avg = 0.0
        
        if current_week:
            current_scores = [call.final_percent for call in current_week]
            current_avg = round(np.mean(current_scores), 2)
        
        if previous_week:
            previous_scores = [call.final_percent for call in previous_week]
            previous_avg = round(np.mean(previous_scores), 2)
        
        # Calculate change percent
        if previous_avg != 0:
            change_percent = ((current_avg - previous_avg) / previous_avg) * 100
        else:
            change_percent = 0.0 if current_avg == 0 else 100.0
        
        # Determine direction
        if change_percent > 2:
            direction = "up"
        elif change_percent < -2:
            direction = "down"
        else:
            direction = "stable"
        
        return WoWComparison(
            current_week_avg=current_avg,
            previous_week_avg=previous_avg,
            change_percent=round(change_percent, 2),
            direction=direction,
            current_week_count=len(current_week),
            previous_week_count=len(previous_week),
        )
    
    def calculate_time_series(
        self,
        calls: List[Call],
        metric: str = "score",
        group_by: str = "day",
    ) -> List[TimeSeriesPoint]:
        """
        Build time series data for charts.
        
        Args:
            calls: List of Call objects
            metric: Metric to calculate - 'score', 'count', 'duration'
            group_by: Grouping period - 'day', 'week', 'month'
            
        Returns:
            List of TimeSeriesPoint for charting
        """
        if not calls:
            return []
        
        # Convert to DataFrame
        data = []
        for call in calls:
            data.append({
                "date": pd.to_datetime(call.call_date),
                "score": call.final_percent,
                "duration": call.duration,
                "id": call.id,
            })
        
        df = pd.DataFrame(data)
        
        # Set date format and label format based on grouping
        if group_by == "day":
            df["period"] = df["date"].dt.strftime("%Y-%m-%d")
            df["label"] = df["date"].dt.strftime("%a %d %b")  # "Mon 06 Jan"
        elif group_by == "week":
            df["period"] = df["date"].dt.strftime("%Y-W%V")
            df["label"] = "Week " + df["date"].dt.isocalendar().week.astype(str)
        elif group_by == "month":
            df["period"] = df["date"].dt.strftime("%Y-%m")
            df["label"] = df["date"].dt.strftime("%B %Y")  # "January 2025"
        else:
            df["period"] = df["date"].dt.strftime("%Y-%m-%d")
            df["label"] = df["date"].dt.strftime("%a %d %b")
        
        # Group and aggregate based on metric
        if metric == "score":
            grouped = df.groupby(["period", "label"]).agg({"score": "mean"}).reset_index()
            value_col = "score"
        elif metric == "count":
            grouped = df.groupby(["period", "label"]).size().reset_index(name="count")
            value_col = "count"
        elif metric == "duration":
            grouped = df.groupby(["period", "label"]).agg({"duration": "sum"}).reset_index()
            grouped["duration"] = grouped["duration"] / 60  # Convert to minutes
            value_col = "duration"
        else:
            grouped = df.groupby(["period", "label"]).agg({"score": "mean"}).reset_index()
            value_col = "score"
        
        # Sort by period
        grouped = grouped.sort_values("period")
        
        # Build result
        result = []
        for _, row in grouped.iterrows():
            result.append(TimeSeriesPoint(
                date=row["period"],
                value=round(float(row[value_col]), 2),
                label=row["label"],
            ))
        
        return result
    
    def detect_anomalies(
        self,
        values: List[float],
        threshold: float = 2.0,
        dates: Optional[List[str]] = None,
    ) -> List[AnomalyPoint]:
        """
        Detect anomalies (outliers) in values using Z-score method.
        
        Args:
            values: List of metric values
            threshold: Number of standard deviations to consider as anomaly
            dates: Optional list of dates corresponding to values
            
        Returns:
            List of AnomalyPoint with detected anomalies
        """
        if not values or len(values) < 3:
            return []
        
        values_array = np.array(values, dtype=float)
        mean = np.mean(values_array)
        std = np.std(values_array)
        
        if std == 0:
            return []
        
        anomalies = []
        for i, value in enumerate(values_array):
            z_score = (value - mean) / std
            deviation = abs(z_score)
            
            if deviation > threshold:
                anomalies.append(AnomalyPoint(
                    index=i,
                    value=round(float(value), 2),
                    expected_value=round(float(mean), 2),
                    deviation=round(float(z_score), 2),
                    date=dates[i] if dates and i < len(dates) else None,
                ))
        
        return anomalies
    
    def calculate_score_distribution(
        self,
        calls: List[Call],
        bins: int = 10,
    ) -> List[dict]:
        """
        Calculate distribution of scores for histogram.
        
        Args:
            calls: List of Call objects
            bins: Number of bins for distribution
            
        Returns:
            List of dicts with bin info and count
        """
        if not calls:
            return []
        
        scores = [call.final_percent for call in calls]
        
        # Create bins
        bin_edges = np.linspace(0, 100, bins + 1)
        counts, _ = np.histogram(scores, bins=bin_edges)
        
        result = []
        for i in range(len(counts)):
            bin_start = bin_edges[i]
            bin_end = bin_edges[i + 1]
            result.append({
                "range": f"{int(bin_start)}-{int(bin_end)}",
                "min": int(bin_start),
                "max": int(bin_end),
                "count": int(counts[i]),
            })
        
        return result
    
    def calculate_rolling_statistics(
        self,
        calls: List[Call],
        window: int = 7,
        group_by: str = "day",
    ) -> List[dict]:
        """
        Calculate rolling statistics (mean, std, min, max) for time series.
        
        Args:
            calls: List of Call objects
            window: Rolling window size
            group_by: Grouping period
            
        Returns:
            List of dicts with rolling statistics
        """
        time_series = self.calculate_time_series(calls, metric="score", group_by=group_by)
        
        if not time_series:
            return []
        
        values = [p.value for p in time_series]
        dates = [p.date for p in time_series]
        
        series = pd.Series(values)
        rolling = series.rolling(window=window, min_periods=1)
        
        result = []
        for i, ts_point in enumerate(time_series):
            result.append({
                "date": dates[i],
                "value": values[i],
                "rolling_mean": round(float(rolling.mean().iloc[i]), 2),
                "rolling_std": round(float(rolling.std().iloc[i]) if i > 0 else 0.0, 2),
                "rolling_min": round(float(rolling.min().iloc[i]), 2),
                "rolling_max": round(float(rolling.max().iloc[i]), 2),
            })
        
        return result
