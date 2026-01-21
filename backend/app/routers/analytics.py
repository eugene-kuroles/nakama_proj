"""
📊 Analytics Router - KPIs, Trends, Reports
"""
from typing import Optional, List
from datetime import date, timedelta
from sqlalchemy import Float as SAFloat
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.call import Call, CallScore
from app.models.manager import Manager
from app.models.criteria import Criteria, CriteriaGroup
from app.core.security import get_current_active_user, require_roles

router = APIRouter()


# ============================================================================
# Response Schemas
# ============================================================================

class KPISummary(BaseModel):
    """Executive summary KPIs"""
    avg_score: float
    total_calls: int
    total_duration_minutes: int
    total_managers: int
    score_change: float  # vs previous period
    calls_change: int


class ManagerRanking(BaseModel):
    """Manager ranking item"""
    id: int
    name: str
    avg_score: float
    total_calls: int
    trend: float  # change vs previous period


class CriteriaStats(BaseModel):
    """Criteria statistics"""
    id: int
    name: str
    group_name: str
    avg_score: float
    impact_score: float  # correlation with final score


class TrendPoint(BaseModel):
    """Time series point"""
    period: str
    value: float
    label: str


class ExecutiveSummaryResponse(BaseModel):
    """Executive dashboard summary"""
    kpis: KPISummary
    top_managers: List[ManagerRanking]
    problem_criteria: List[CriteriaStats]
    trend: List[TrendPoint]


class TeamLeaderboardResponse(BaseModel):
    """Team leaderboard"""
    managers: List[ManagerRanking]
    team_avg: float
    period: str


# ============================================================================
# Executive Endpoints (CEO)
# ============================================================================

@router.get("/executive/summary", response_model=ExecutiveSummaryResponse)
async def get_executive_summary(
    project_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(require_roles([UserRole.CEO, UserRole.SALES_DIRECTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Get executive summary for CEO dashboard.
    
    Includes:
    - Key KPIs (avg score, total calls, duration, managers)
    - Top performing managers
    - Problem criteria
    - Score trend over time
    """
    # Default to last 30 days
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Previous period for comparison
    period_days = (date_to - date_from).days
    prev_date_from = date_from - timedelta(days=period_days)
    prev_date_to = date_from - timedelta(days=1)
    
    # Current period KPIs
    current_query = select(
        func.avg(Call.final_percent),
        func.count(Call.id),
        func.sum(Call.duration_seconds),
        func.count(func.distinct(Call.manager_id)),
    ).where(
        and_(
            Call.project_id == project_id,
            Call.call_date >= date_from,
            Call.call_date <= date_to,
        )
    )
    
    result = await db.execute(current_query)
    current = result.one()
    
    avg_score = float(current[0] or 0)
    total_calls = current[1] or 0
    total_duration = (current[2] or 0) // 60  # to minutes
    total_managers = current[3] or 0
    
    # Previous period for comparison
    prev_query = select(
        func.avg(Call.final_percent),
        func.count(Call.id),
    ).where(
        and_(
            Call.project_id == project_id,
            Call.call_date >= prev_date_from,
            Call.call_date <= prev_date_to,
        )
    )
    
    prev_result = await db.execute(prev_query)
    prev = prev_result.one()
    
    prev_avg = float(prev[0] or 0)
    prev_calls = prev[1] or 0
    
    score_change = avg_score - prev_avg
    calls_change = total_calls - prev_calls
    
    # Top managers
    top_managers_query = (
        select(
            Manager.id,
            Manager.name,
            func.avg(Call.final_percent).label("avg_score"),
            func.count(Call.id).label("total_calls"),
        )
        .join(Call, Call.manager_id == Manager.id)
        .where(
            and_(
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
            )
        )
        .group_by(Manager.id, Manager.name)
        .order_by(func.avg(Call.final_percent).desc())
        .limit(5)
    )
    
    top_result = await db.execute(top_managers_query)
    top_managers = [
        ManagerRanking(
            id=row.id,
            name=row.name,
            avg_score=float(row.avg_score or 0),
            total_calls=row.total_calls,
            trend=0.0,  # TODO: Calculate trend
        )
        for row in top_result.all()
    ]
    
    # Problem criteria (lowest avg scores)
    # Exclude recommendation groups: "Рекомендации", "Фильтры", "Скоринг"
    excluded_groups = ["Рекомендации", "Фильтры", "Скоринг"]
    
    criteria_query = (
        select(
            Criteria.id,
            Criteria.name,
            CriteriaGroup.name.label("group_name"),
            func.avg(func.cast(CallScore.score, SAFloat)).label("avg_score"),
        )
        .join(CallScore, CallScore.criteria_id == Criteria.id)
        .join(Call, Call.id == CallScore.call_id)
        .join(CriteriaGroup, CriteriaGroup.id == Criteria.group_id)
        .where(
            and_(
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
                Criteria.in_final_score == True,
                Criteria.score_type != "recommendation",
                ~CriteriaGroup.name.in_(excluded_groups),
            )
        )
        .group_by(Criteria.id, Criteria.name, CriteriaGroup.name)
        .order_by(func.avg(func.cast(CallScore.score, SAFloat)))
        .limit(5)
    )
    
    criteria_result = await db.execute(criteria_query)
    problem_criteria = [
        CriteriaStats(
            id=row.id,
            name=row.name,
            group_name=row.group_name,
            avg_score=float(row.avg_score or 0),
            impact_score=0.0,  # TODO: Calculate correlation
        )
        for row in criteria_result.all()
    ]
    
    # Weekly trend
    trend_query = (
        select(
            Call.call_week,
            func.avg(Call.final_percent).label("avg_score"),
        )
        .where(
            and_(
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
            )
        )
        .group_by(Call.call_week)
        .order_by(Call.call_week)
    )
    
    trend_result = await db.execute(trend_query)
    trend = [
        TrendPoint(
            period=row.call_week or "Unknown",
            value=float(row.avg_score or 0),
            label=row.call_week or "Unknown",
        )
        for row in trend_result.all()
    ]
    
    return ExecutiveSummaryResponse(
        kpis=KPISummary(
            avg_score=avg_score,
            total_calls=total_calls,
            total_duration_minutes=total_duration,
            total_managers=total_managers,
            score_change=score_change,
            calls_change=calls_change,
        ),
        top_managers=top_managers,
        problem_criteria=problem_criteria,
        trend=trend,
    )


# ============================================================================
# Team Endpoints (ROP)
# ============================================================================

@router.get("/team/leaderboard", response_model=TeamLeaderboardResponse)
async def get_team_leaderboard(
    project_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(require_roles([UserRole.CEO, UserRole.SALES_DIRECTOR, UserRole.ROP, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Get team leaderboard for ROP dashboard.
    
    Returns all managers ranked by average score.
    """
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=7)
    
    # Managers ranking
    managers_query = (
        select(
            Manager.id,
            Manager.name,
            func.avg(Call.final_percent).label("avg_score"),
            func.count(Call.id).label("total_calls"),
        )
        .join(Call, Call.manager_id == Manager.id)
        .where(
            and_(
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
            )
        )
        .group_by(Manager.id, Manager.name)
        .order_by(func.avg(Call.final_percent).desc())
    )
    
    result = await db.execute(managers_query)
    managers = [
        ManagerRanking(
            id=row.id,
            name=row.name,
            avg_score=float(row.avg_score or 0),
            total_calls=row.total_calls,
            trend=0.0,
        )
        for row in result.all()
    ]
    
    # Team average
    team_avg_query = select(func.avg(Call.final_percent)).where(
        and_(
            Call.project_id == project_id,
            Call.call_date >= date_from,
            Call.call_date <= date_to,
        )
    )
    
    team_avg_result = await db.execute(team_avg_query)
    team_avg = float(team_avg_result.scalar() or 0)
    
    period = f"{date_from.isoformat()} - {date_to.isoformat()}"
    
    return TeamLeaderboardResponse(
        managers=managers,
        team_avg=team_avg,
        period=period,
    )


# ============================================================================
# Manager Endpoints
# ============================================================================

class ManagerSummaryResponse(BaseModel):
    """Manager personal summary"""
    avg_score: float
    total_calls: int
    rank: int
    total_managers: int
    vs_team: float  # difference from team average
    trend: List[TrendPoint]


@router.get("/manager/{manager_id}/summary", response_model=ManagerSummaryResponse)
async def get_manager_summary(
    manager_id: int,
    project_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get personal summary for a manager.
    """
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Manager stats
    manager_query = select(
        func.avg(Call.final_percent),
        func.count(Call.id),
    ).where(
        and_(
            Call.manager_id == manager_id,
            Call.project_id == project_id,
            Call.call_date >= date_from,
            Call.call_date <= date_to,
        )
    )
    
    result = await db.execute(manager_query)
    manager_stats = result.one()
    
    avg_score = float(manager_stats[0] or 0)
    total_calls = manager_stats[1] or 0
    
    # Team average
    team_query = select(func.avg(Call.final_percent)).where(
        and_(
            Call.project_id == project_id,
            Call.call_date >= date_from,
            Call.call_date <= date_to,
        )
    )
    
    team_result = await db.execute(team_query)
    team_avg = float(team_result.scalar() or 0)
    
    vs_team = avg_score - team_avg
    
    # Calculate rank
    rank_query = (
        select(func.count(func.distinct(Manager.id)))
        .join(Call, Call.manager_id == Manager.id)
        .where(
            and_(
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
            )
        )
        .group_by(Manager.id)
        .having(func.avg(Call.final_percent) > avg_score)
    )
    
    rank_result = await db.execute(rank_query)
    better_count = len(rank_result.all())
    rank = better_count + 1
    
    # Total managers
    total_managers_query = (
        select(func.count(func.distinct(Call.manager_id)))
        .where(
            and_(
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
            )
        )
    )
    
    total_managers_result = await db.execute(total_managers_query)
    total_managers = total_managers_result.scalar() or 0
    
    # Weekly trend
    trend_query = (
        select(
            Call.call_week,
            func.avg(Call.final_percent).label("avg_score"),
        )
        .where(
            and_(
                Call.manager_id == manager_id,
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
            )
        )
        .group_by(Call.call_week)
        .order_by(Call.call_week)
    )
    
    trend_result = await db.execute(trend_query)
    trend = [
        TrendPoint(
            period=row.call_week or "Unknown",
            value=float(row.avg_score or 0),
            label=row.call_week or "Unknown",
        )
        for row in trend_result.all()
    ]
    
    return ManagerSummaryResponse(
        avg_score=avg_score,
        total_calls=total_calls,
        rank=rank,
        total_managers=total_managers,
        vs_team=vs_team,
        trend=trend,
    )
