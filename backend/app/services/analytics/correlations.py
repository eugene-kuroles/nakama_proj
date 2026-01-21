"""
Correlation Service - Correlation and impact analysis
"""
from typing import List, Dict, Optional
from collections import defaultdict

import numpy as np
import pandas as pd
from scipy.stats import pearsonr, spearmanr

from app.models.call import Call
from app.models.criteria import Criteria
from app.schemas.analytics import (
    CorrelationMatrix,
    CriteriaImpact,
    HeatMapData,
)


class CorrelationService:
    """Service for correlation and impact analysis"""
    
    def calculate_criteria_correlations(
        self,
        calls: List[Call],
    ) -> CorrelationMatrix:
        """
        Calculate correlation matrix between all criteria.
        
        Args:
            calls: List of Call objects with loaded scores
            
        Returns:
            CorrelationMatrix with labels and 2D correlation values
        """
        if not calls:
            return CorrelationMatrix(labels=[], matrix=[])
        
        # Build DataFrame with criteria scores
        criteria_scores: Dict[int, Dict[int, float]] = defaultdict(dict)  # call_id -> {criteria_id: score}
        criteria_names: Dict[int, str] = {}
        
        for call in calls:
            for score in call.scores:
                criteria_scores[call.id][score.criteria_id] = score.score
                if score.criteria:
                    criteria_names[score.criteria_id] = score.criteria.name
        
        if not criteria_scores:
            return CorrelationMatrix(labels=[], matrix=[])
        
        # Convert to DataFrame
        df = pd.DataFrame.from_dict(criteria_scores, orient="index")
        df = df.dropna(axis=1, how="all")  # Remove criteria with all NaN
        
        if df.empty or len(df.columns) < 2:
            return CorrelationMatrix(labels=[], matrix=[])
        
        # Calculate correlation matrix
        corr_matrix = df.corr(method="pearson")
        
        # Build result
        criteria_ids = list(corr_matrix.columns)
        labels = [criteria_names.get(cid, f"Criteria {cid}") for cid in criteria_ids]
        
        # Truncate long names for display
        labels = [name[:30] + "..." if len(name) > 30 else name for name in labels]
        
        matrix = []
        for i, row_id in enumerate(criteria_ids):
            row_values = []
            for j, col_id in enumerate(criteria_ids):
                value = corr_matrix.iloc[i, j]
                row_values.append(round(float(value), 3) if not np.isnan(value) else 0.0)
            matrix.append(row_values)
        
        return CorrelationMatrix(labels=labels, matrix=matrix)
    
    def calculate_criteria_impact(
        self,
        calls: List[Call],
    ) -> List[CriteriaImpact]:
        """
        Calculate impact of each criteria on final score.
        Uses Pearson correlation between criteria score and final_percent.
        
        Args:
            calls: List of Call objects with loaded scores
            
        Returns:
            List of CriteriaImpact sorted by absolute correlation (descending)
        """
        if not calls:
            return []
        
        # Collect scores for each criteria and final percent
        criteria_data: Dict[int, List[tuple]] = defaultdict(list)  # criteria_id -> [(score, final_percent)]
        criteria_names: Dict[int, str] = {}
        
        for call in calls:
            for score in call.scores:
                criteria_data[score.criteria_id].append((score.score, call.final_percent))
                if score.criteria:
                    criteria_names[score.criteria_id] = score.criteria.name
        
        # Calculate correlation for each criteria
        impacts = []
        for criteria_id, data_points in criteria_data.items():
            if len(data_points) < 3:  # Need at least 3 points for meaningful correlation
                continue
            
            scores, final_percents = zip(*data_points)
            scores_array = np.array(scores)
            final_array = np.array(final_percents)
            
            # Check variance
            if np.std(scores_array) == 0 or np.std(final_array) == 0:
                correlation = 0.0
            else:
                correlation, p_value = pearsonr(scores_array, final_array)
                if np.isnan(correlation):
                    correlation = 0.0
            
            # Categorize impact
            abs_corr = abs(correlation)
            if abs_corr >= 0.6:
                category = "high"
            elif abs_corr >= 0.3:
                category = "medium"
            else:
                category = "low"
            
            impacts.append(CriteriaImpact(
                criteria_id=criteria_id,
                criteria_name=criteria_names.get(criteria_id, f"Criteria {criteria_id}"),
                correlation=round(float(correlation), 3),
                impact_category=category,
            ))
        
        # Sort by absolute correlation (descending)
        impacts.sort(key=lambda x: abs(x.correlation), reverse=True)
        
        return impacts
    
    def find_critical_criteria(
        self,
        calls: List[Call],
        threshold: float = 0.6,
    ) -> List[CriteriaImpact]:
        """
        Find criteria that have high impact on final score.
        
        Args:
            calls: List of Call objects
            threshold: Minimum absolute correlation to consider as critical
            
        Returns:
            List of critical criteria with high impact
        """
        all_impacts = self.calculate_criteria_impact(calls)
        
        return [
            impact for impact in all_impacts
            if abs(impact.correlation) >= threshold
        ]
    
    def calculate_manager_criteria_matrix(
        self,
        calls: List[Call],
    ) -> HeatMapData:
        """
        Build manager × criteria matrix for heatmap visualization.
        Shows average score for each manager on each criteria.
        
        Args:
            calls: List of Call objects with loaded scores and manager info
            
        Returns:
            HeatMapData for heatmap visualization
        """
        if not calls:
            return HeatMapData(rows=[], columns=[], values=[])
        
        # Collect data
        manager_criteria_scores: Dict[int, Dict[int, List[float]]] = defaultdict(lambda: defaultdict(list))
        manager_names: Dict[int, str] = {}
        criteria_names: Dict[int, str] = {}
        criteria_order: Dict[int, int] = {}
        
        for call in calls:
            manager_id = call.manager_id
            if call.manager:
                manager_names[manager_id] = call.manager.name
            
            for score in call.scores:
                criteria_id = score.criteria_id
                manager_criteria_scores[manager_id][criteria_id].append(score.score)
                
                if score.criteria:
                    criteria_names[criteria_id] = score.criteria.name
                    if criteria_id not in criteria_order:
                        criteria_order[criteria_id] = score.criteria.order
        
        if not manager_criteria_scores:
            return HeatMapData(rows=[], columns=[], values=[])
        
        # Get sorted manager and criteria lists
        manager_ids = sorted(manager_criteria_scores.keys())
        criteria_ids = sorted(
            criteria_names.keys(),
            key=lambda x: criteria_order.get(x, 999)
        )
        
        # Build matrix
        rows = [manager_names.get(mid, f"Manager {mid}") for mid in manager_ids]
        columns = [
            criteria_names.get(cid, f"Criteria {cid}")[:25]  # Truncate for display
            for cid in criteria_ids
        ]
        
        values = []
        for manager_id in manager_ids:
            row_values = []
            for criteria_id in criteria_ids:
                scores = manager_criteria_scores[manager_id][criteria_id]
                if scores:
                    avg = round(float(np.mean(scores)), 1)
                else:
                    avg = 0.0  # No data
                row_values.append(avg)
            values.append(row_values)
        
        return HeatMapData(rows=rows, columns=columns, values=values)
    
    def calculate_criteria_groups_correlation(
        self,
        calls: List[Call],
    ) -> CorrelationMatrix:
        """
        Calculate correlation matrix between criteria groups.
        Uses average score per group.
        
        Args:
            calls: List of Call objects with group_averages
            
        Returns:
            CorrelationMatrix between groups
        """
        if not calls:
            return CorrelationMatrix(labels=[], matrix=[])
        
        # Collect group averages
        group_scores: Dict[int, Dict[int, float]] = defaultdict(dict)  # call_id -> {group_id: score}
        group_names: Dict[int, str] = {}
        
        for call in calls:
            for group_avg in call.group_averages:
                group_scores[call.id][group_avg.group_id] = group_avg.average_score
                if group_avg.group:
                    group_names[group_avg.group_id] = group_avg.group.name
        
        if not group_scores:
            return CorrelationMatrix(labels=[], matrix=[])
        
        # Convert to DataFrame
        df = pd.DataFrame.from_dict(group_scores, orient="index")
        df = df.dropna(axis=1, how="all")
        
        if df.empty or len(df.columns) < 2:
            return CorrelationMatrix(labels=[], matrix=[])
        
        # Calculate correlation
        corr_matrix = df.corr(method="pearson")
        
        group_ids = list(corr_matrix.columns)
        labels = [group_names.get(gid, f"Group {gid}") for gid in group_ids]
        
        matrix = []
        for i in range(len(group_ids)):
            row = []
            for j in range(len(group_ids)):
                value = corr_matrix.iloc[i, j]
                row.append(round(float(value), 3) if not np.isnan(value) else 0.0)
            matrix.append(row)
        
        return CorrelationMatrix(labels=labels, matrix=matrix)
    
    def analyze_weak_criteria(
        self,
        calls: List[Call],
        score_threshold: float = 70.0,
        min_calls: int = 10,
    ) -> List[Dict]:
        """
        Find criteria where managers consistently score low.
        
        Args:
            calls: List of Call objects
            score_threshold: Score below which is considered "weak"
            min_calls: Minimum calls to consider criteria as analyzed
            
        Returns:
            List of weak criteria with statistics
        """
        if not calls:
            return []
        
        # Collect scores by criteria
        criteria_scores: Dict[int, List[float]] = defaultdict(list)
        criteria_names: Dict[int, str] = {}
        
        for call in calls:
            for score in call.scores:
                criteria_scores[score.criteria_id].append(score.score)
                if score.criteria:
                    criteria_names[score.criteria_id] = score.criteria.name
        
        # Analyze each criteria
        weak_criteria = []
        for criteria_id, scores in criteria_scores.items():
            if len(scores) < min_calls:
                continue
            
            scores_array = np.array(scores)
            avg_score = np.mean(scores_array)
            
            if avg_score < score_threshold:
                below_threshold = sum(1 for s in scores if s < score_threshold)
                weak_criteria.append({
                    "criteria_id": criteria_id,
                    "criteria_name": criteria_names.get(criteria_id, f"Criteria {criteria_id}"),
                    "average_score": round(float(avg_score), 1),
                    "min_score": round(float(np.min(scores_array)), 1),
                    "max_score": round(float(np.max(scores_array)), 1),
                    "total_calls": len(scores),
                    "below_threshold_count": below_threshold,
                    "below_threshold_percent": round(below_threshold / len(scores) * 100, 1),
                })
        
        # Sort by average score (ascending = worst first)
        weak_criteria.sort(key=lambda x: x["average_score"])
        
        return weak_criteria
