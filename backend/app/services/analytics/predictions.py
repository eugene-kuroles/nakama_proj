"""
Prediction Service - Machine Learning based predictions and recommendations
"""
from typing import List, Dict, Optional
from collections import defaultdict
from datetime import date, timedelta

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

from app.models.call import Call
from app.schemas.analytics import (
    TimeSeriesPoint,
    PredictionPoint,
    ImprovementPrediction,
    ImprovementSuggestion,
)


class PredictionService:
    """Service for predictive analytics using ML"""
    
    def __init__(self):
        self.linear_model = LinearRegression()
        self.ridge_model = Ridge(alpha=1.0)
        self.scaler = StandardScaler()
    
    def predict_next_period(
        self,
        time_series: List[TimeSeriesPoint],
        periods_ahead: int = 4,
    ) -> List[PredictionPoint]:
        """
        Predict values for next N periods using linear regression.
        
        Args:
            time_series: Historical time series data
            periods_ahead: Number of periods to predict
            
        Returns:
            List of PredictionPoint with predicted values and confidence intervals
        """
        if not time_series or len(time_series) < 3:
            return []
        
        # Prepare data
        values = np.array([p.value for p in time_series]).reshape(-1, 1)
        X = np.arange(len(time_series)).reshape(-1, 1)
        
        # Fit model
        self.linear_model.fit(X, values.ravel())
        
        # Calculate residuals for confidence interval
        predictions_train = self.linear_model.predict(X)
        residuals = values.ravel() - predictions_train
        std_error = np.std(residuals)
        
        # Predict future values
        result = []
        last_date = time_series[-1].date
        
        for i in range(1, periods_ahead + 1):
            future_X = np.array([[len(time_series) + i - 1]])
            predicted = self.linear_model.predict(future_X)[0]
            
            # Calculate confidence interval (95%)
            confidence = 1.96 * std_error
            
            # Generate future date (simplified - just increment)
            if "-W" in last_date:
                # Weekly format
                future_date = f"{last_date.split('-W')[0]}-W{int(last_date.split('-W')[1]) + i:02d}"
            elif len(last_date) == 7:
                # Monthly format (YYYY-MM)
                year, month = int(last_date[:4]), int(last_date[5:])
                month += i
                while month > 12:
                    month -= 12
                    year += 1
                future_date = f"{year}-{month:02d}"
            else:
                # Daily format
                try:
                    last_dt = pd.to_datetime(last_date)
                    future_dt = last_dt + timedelta(days=i)
                    future_date = future_dt.strftime("%Y-%m-%d")
                except:
                    future_date = f"Period +{i}"
            
            result.append(PredictionPoint(
                date=future_date,
                predicted_value=round(float(predicted), 2),
                confidence_lower=round(float(max(0, predicted - confidence)), 2),
                confidence_upper=round(float(min(100, predicted + confidence)), 2),
            ))
        
        return result
    
    def predict_if_not_improve(
        self,
        calls: List[Call],
        manager_id: int,
        criteria_to_improve: List[int] = None,
    ) -> ImprovementPrediction:
        """
        Predict what happens if manager doesn't improve specific criteria.
        
        Args:
            calls: All calls for analysis
            manager_id: Target manager ID
            criteria_to_improve: List of criteria IDs to analyze
            
        Returns:
            ImprovementPrediction with forecast
        """
        # Filter calls for this manager
        manager_calls = [c for c in calls if c.manager_id == manager_id]
        
        if not manager_calls:
            return ImprovementPrediction(
                manager_id=manager_id,
                current_score=0.0,
                predicted_score_30_days=0.0,
                predicted_score_90_days=0.0,
                risk_level="unknown",
                criteria_at_risk=[],
            )
        
        # Sort by date
        manager_calls.sort(key=lambda x: x.call_date)
        
        # Get current average
        scores = [c.final_percent for c in manager_calls]
        current_score = np.mean(scores[-10:]) if len(scores) >= 10 else np.mean(scores)
        
        # Calculate trend
        if len(scores) >= 5:
            X = np.arange(len(scores)).reshape(-1, 1)
            y = np.array(scores)
            self.linear_model.fit(X, y)
            slope = self.linear_model.coef_[0]
            
            # Project forward (assuming ~1 call per day average)
            predicted_30 = current_score + (slope * 30)
            predicted_90 = current_score + (slope * 90)
        else:
            predicted_30 = current_score
            predicted_90 = current_score
            slope = 0
        
        # Determine risk level
        if slope < -0.5:
            risk_level = "high"
        elif slope < -0.2:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Find criteria at risk (consistently low scores)
        criteria_at_risk = []
        if manager_calls[-1].scores:
            for score in manager_calls[-1].scores:
                if score.score < 70:
                    if score.criteria:
                        criteria_at_risk.append(score.criteria.name)
        
        return ImprovementPrediction(
            manager_id=manager_id,
            current_score=round(float(current_score), 2),
            predicted_score_30_days=round(float(max(0, min(100, predicted_30))), 2),
            predicted_score_90_days=round(float(max(0, min(100, predicted_90))), 2),
            risk_level=risk_level,
            criteria_at_risk=criteria_at_risk[:5],  # Top 5 at-risk criteria
        )
    
    def predict_score_improvement(
        self,
        calls: List[Call],
        target_criteria_id: int,
        improvement_percent: float = 10.0,
    ) -> float:
        """
        Predict how much final score will improve if a specific criteria improves.
        Uses correlation between criteria score and final score.
        
        Args:
            calls: List of calls with scores
            target_criteria_id: Criteria to analyze
            improvement_percent: Expected improvement in criteria score
            
        Returns:
            Predicted improvement in final score percentage
        """
        if not calls:
            return 0.0
        
        # Collect data pairs (criteria_score, final_percent)
        data_points = []
        for call in calls:
            for score in call.scores:
                if score.criteria_id == target_criteria_id:
                    data_points.append((score.score, call.final_percent))
                    break
        
        if len(data_points) < 5:
            return 0.0
        
        # Build regression model
        criteria_scores = np.array([p[0] for p in data_points]).reshape(-1, 1)
        final_scores = np.array([p[1] for p in data_points])
        
        self.linear_model.fit(criteria_scores, final_scores)
        
        # Calculate impact
        impact_per_point = self.linear_model.coef_[0]
        predicted_improvement = impact_per_point * improvement_percent
        
        return round(float(predicted_improvement), 2)
    
    def identify_improvement_priority(
        self,
        calls: List[Call],
        manager_id: int,
    ) -> List[ImprovementSuggestion]:
        """
        Identify which criteria the manager should improve first.
        Prioritizes based on:
        - Current level (low = higher priority)
        - Impact on final score (high impact = higher priority)
        - Gap to team average
        
        Args:
            calls: All calls for analysis
            manager_id: Target manager ID
            
        Returns:
            Prioritized list of ImprovementSuggestion
        """
        if not calls:
            return []
        
        # Separate manager calls and all other calls
        manager_calls = [c for c in calls if c.manager_id == manager_id]
        all_calls = calls
        
        if not manager_calls:
            return []
        
        # Calculate team averages per criteria
        team_criteria_scores: Dict[int, List[float]] = defaultdict(list)
        criteria_names: Dict[int, str] = {}
        
        for call in all_calls:
            for score in call.scores:
                team_criteria_scores[score.criteria_id].append(score.score)
                if score.criteria:
                    criteria_names[score.criteria_id] = score.criteria.name
        
        team_averages = {
            cid: np.mean(scores) for cid, scores in team_criteria_scores.items()
        }
        
        # Calculate manager scores per criteria
        manager_criteria_scores: Dict[int, List[float]] = defaultdict(list)
        for call in manager_calls:
            for score in call.scores:
                manager_criteria_scores[score.criteria_id].append(score.score)
        
        manager_averages = {
            cid: np.mean(scores) for cid, scores in manager_criteria_scores.items()
        }
        
        # Calculate impact (correlation) for each criteria
        criteria_impact = {}
        for criteria_id in team_criteria_scores.keys():
            impact = self.predict_score_improvement(all_calls, criteria_id, 10)
            criteria_impact[criteria_id] = impact
        
        # Build suggestions
        suggestions = []
        for criteria_id, manager_avg in manager_averages.items():
            team_avg = team_averages.get(criteria_id, manager_avg)
            gap = team_avg - manager_avg
            impact = criteria_impact.get(criteria_id, 0)
            
            # Calculate priority score (higher = more important)
            # Low score + high impact + big gap = high priority
            score_factor = max(0, (100 - manager_avg) / 100)  # Lower score = higher factor
            impact_factor = abs(impact) / 10 if impact else 0  # Higher impact = higher factor
            gap_factor = max(0, gap / 50) if gap > 0 else 0  # Bigger gap = higher factor
            
            priority_score = score_factor * 0.3 + impact_factor * 0.4 + gap_factor * 0.3
            
            # Generate reason
            reasons = []
            if manager_avg < 70:
                reasons.append(f"Low score ({manager_avg:.0f}%)")
            if gap > 10:
                reasons.append(f"Below team by {gap:.0f}%")
            if impact > 0.5:
                reasons.append(f"High impact on results")
            
            reason = "; ".join(reasons) if reasons else "Room for improvement"
            
            suggestions.append({
                "criteria_id": criteria_id,
                "criteria_name": criteria_names.get(criteria_id, f"Criteria {criteria_id}"),
                "current_score": round(float(manager_avg), 1),
                "team_average": round(float(team_avg), 1),
                "gap_to_team": round(float(gap), 1),
                "impact_on_total": round(float(impact), 2),
                "priority_score": priority_score,
                "reason": reason,
            })
        
        # Sort by priority score (descending) and assign ranks
        suggestions.sort(key=lambda x: x["priority_score"], reverse=True)
        
        result = []
        for i, sugg in enumerate(suggestions[:10], 1):  # Top 10 suggestions
            result.append(ImprovementSuggestion(
                criteria_id=sugg["criteria_id"],
                criteria_name=sugg["criteria_name"],
                current_score=sugg["current_score"],
                team_average=sugg["team_average"],
                gap_to_team=sugg["gap_to_team"],
                impact_on_total=sugg["impact_on_total"],
                priority=i,
                reason=sugg["reason"],
            ))
        
        return result
    
    def predict_manager_trajectory(
        self,
        calls: List[Call],
        manager_id: int,
        days_ahead: int = 30,
    ) -> Dict:
        """
        Predict manager's score trajectory.
        
        Args:
            calls: All calls
            manager_id: Target manager
            days_ahead: How many days to project
            
        Returns:
            Dict with trajectory data
        """
        manager_calls = [c for c in calls if c.manager_id == manager_id]
        manager_calls.sort(key=lambda x: x.call_date)
        
        if len(manager_calls) < 5:
            return {
                "manager_id": manager_id,
                "has_enough_data": False,
                "message": "Not enough data for prediction (need at least 5 calls)",
            }
        
        # Build time series
        df = pd.DataFrame([
            {"date": c.call_date, "score": c.final_percent}
            for c in manager_calls
        ])
        df["date"] = pd.to_datetime(df["date"])
        df = df.set_index("date").resample("W").mean().reset_index()
        
        if len(df) < 3:
            return {
                "manager_id": manager_id,
                "has_enough_data": False,
                "message": "Not enough weekly data for prediction",
            }
        
        # Fit model
        X = np.arange(len(df)).reshape(-1, 1)
        y = df["score"].values
        
        self.ridge_model.fit(X, y)
        
        # Predict
        weeks_ahead = days_ahead // 7
        future_X = np.arange(len(df), len(df) + weeks_ahead).reshape(-1, 1)
        predictions = self.ridge_model.predict(future_X)
        
        # Calculate confidence
        train_predictions = self.ridge_model.predict(X)
        std_error = np.std(y - train_predictions)
        
        trajectory = []
        last_date = df["date"].iloc[-1]
        for i, pred in enumerate(predictions):
            week_date = last_date + timedelta(weeks=i+1)
            trajectory.append({
                "date": week_date.strftime("%Y-%m-%d"),
                "predicted_score": round(float(max(0, min(100, pred))), 2),
                "lower_bound": round(float(max(0, pred - 1.96 * std_error)), 2),
                "upper_bound": round(float(min(100, pred + 1.96 * std_error)), 2),
            })
        
        return {
            "manager_id": manager_id,
            "has_enough_data": True,
            "current_avg": round(float(y[-1]), 2),
            "trend_slope": round(float(self.ridge_model.coef_[0]), 4),
            "trajectory": trajectory,
        }
    
    def build_feature_importance(
        self,
        calls: List[Call],
    ) -> List[Dict]:
        """
        Build feature importance analysis using Random Forest.
        Shows which criteria are most predictive of final score.
        
        Args:
            calls: List of calls with scores
            
        Returns:
            List of criteria with importance scores
        """
        if not calls or len(calls) < 20:
            return []
        
        # Build feature matrix
        criteria_ids = set()
        for call in calls:
            for score in call.scores:
                criteria_ids.add(score.criteria_id)
        
        criteria_ids = sorted(criteria_ids)
        criteria_names: Dict[int, str] = {}
        
        # Build X (features) and y (target)
        X_data = []
        y_data = []
        
        for call in calls:
            features = {cid: 0.0 for cid in criteria_ids}
            for score in call.scores:
                features[score.criteria_id] = score.score
                if score.criteria:
                    criteria_names[score.criteria_id] = score.criteria.name
            
            X_data.append([features[cid] for cid in criteria_ids])
            y_data.append(call.final_percent)
        
        X = np.array(X_data)
        y = np.array(y_data)
        
        # Train Random Forest
        rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        rf.fit(X, y)
        
        # Get feature importance
        importances = rf.feature_importances_
        
        result = []
        for i, cid in enumerate(criteria_ids):
            result.append({
                "criteria_id": cid,
                "criteria_name": criteria_names.get(cid, f"Criteria {cid}"),
                "importance": round(float(importances[i]), 4),
            })
        
        result.sort(key=lambda x: x["importance"], reverse=True)
        
        return result
