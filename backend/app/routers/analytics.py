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


# ============================================================================
# Best/Worst Examples
# ============================================================================

class CallExample(BaseModel):
    """Call example with score and context"""
    id: int
    call_id: int
    date: str
    duration: int
    score: float
    criteria_name: str
    criteria_number: int
    quote: Optional[str] = None
    reason: Optional[str] = None


class BestWorstExamplesResponse(BaseModel):
    """Best and worst call examples"""
    best_examples: List[CallExample]
    worst_examples: List[CallExample]


@router.get("/manager/{manager_id}/examples", response_model=BestWorstExamplesResponse)
async def get_manager_examples(
    manager_id: int,
    project_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(2, ge=1, le=10),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get best and worst call examples for a specific manager.
    """
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Best examples - highest scoring criteria with quotes
    best_query = (
        select(
            CallScore.id,
            CallScore.call_id,
            CallScore.score,
            CallScore.quote,
            CallScore.reason,
            Call.call_date,
            Call.duration_seconds,
            Criteria.name.label("criteria_name"),
            Criteria.number.label("criteria_number"),
        )
        .join(Call, Call.id == CallScore.call_id)
        .join(Criteria, Criteria.id == CallScore.criteria_id)
        .where(
            and_(
                Call.manager_id == manager_id,
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
                CallScore.quote.isnot(None),
                CallScore.quote != "",
                Criteria.in_final_score == True,
            )
        )
        .order_by(func.cast(CallScore.score, SAFloat).desc())
        .limit(limit)
    )
    
    best_result = await db.execute(best_query)
    best_examples = [
        CallExample(
            id=row.id,
            call_id=row.call_id,
            date=row.call_date.strftime("%d %b %Y") if row.call_date else "",
            duration=row.duration_seconds or 0,
            score=float(row.score) if row.score and row.score.replace('.', '').isdigit() else 0,
            criteria_name=row.criteria_name,
            criteria_number=row.criteria_number,
            quote=row.quote,
            reason=row.reason,
        )
        for row in best_result.all()
    ]
    
    # Worst examples - lowest scoring criteria with quotes
    worst_query = (
        select(
            CallScore.id,
            CallScore.call_id,
            CallScore.score,
            CallScore.quote,
            CallScore.reason,
            Call.call_date,
            Call.duration_seconds,
            Criteria.name.label("criteria_name"),
            Criteria.number.label("criteria_number"),
        )
        .join(Call, Call.id == CallScore.call_id)
        .join(Criteria, Criteria.id == CallScore.criteria_id)
        .where(
            and_(
                Call.manager_id == manager_id,
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
                CallScore.quote.isnot(None),
                CallScore.quote != "",
                Criteria.in_final_score == True,
            )
        )
        .order_by(func.cast(CallScore.score, SAFloat).asc())
        .limit(limit)
    )
    
    worst_result = await db.execute(worst_query)
    worst_examples = [
        CallExample(
            id=row.id,
            call_id=row.call_id,
            date=row.call_date.strftime("%d %b %Y") if row.call_date else "",
            duration=row.duration_seconds or 0,
            score=float(row.score) if row.score and row.score.replace('.', '').isdigit() else 0,
            criteria_name=row.criteria_name,
            criteria_number=row.criteria_number,
            quote=row.quote,
            reason=row.reason,
        )
        for row in worst_result.all()
    ]
    
    return BestWorstExamplesResponse(
        best_examples=best_examples,
        worst_examples=worst_examples,
    )


# ============================================================================
# VOC - Voice of Customer (Objections)
# ============================================================================

class VOCItem(BaseModel):
    """Voice of Customer tag item"""
    tag: str
    count: int
    trend: float = 0


class VOCResponse(BaseModel):
    """VOC/objections summary"""
    items: List[VOCItem]
    total_mentions: int


@router.get("/voc", response_model=VOCResponse)
async def get_voc_tags(
    project_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get Voice of Customer / Objections tags from criteria like:
    'Какие возражения озвучил Клиент (теги)'
    
    Parses tags from score field which may contain multiple comma-separated values.
    """
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Find objection criteria
    objection_keywords = [
        "возражения",
        "возражение",
        "теги",
        "tag",
    ]
    
    # Query all scores from objection-type criteria
    scores_query = (
        select(CallScore.score)
        .join(Call, Call.id == CallScore.call_id)
        .join(Criteria, Criteria.id == CallScore.criteria_id)
        .where(
            and_(
                Call.project_id == project_id,
                Call.call_date >= date_from,
                Call.call_date <= date_to,
                CallScore.score.isnot(None),
                CallScore.score != "",
            )
        )
        .filter(
            Criteria.name.ilike("%возражен%") | 
            Criteria.name.ilike("%теги%") |
            Criteria.name.ilike("%тег%")
        )
    )
    
    result = await db.execute(scores_query)
    all_scores = result.scalars().all()
    
    # Parse and count tags
    tag_counts: dict[str, int] = {}
    
    for score_value in all_scores:
        if not score_value:
            continue
        
        # Split by common delimiters
        tags = []
        for delimiter in [",", ";", "|", "\n"]:
            if delimiter in score_value:
                tags = [t.strip() for t in score_value.split(delimiter)]
                break
        
        if not tags:
            tags = [score_value.strip()]
        
        for tag in tags:
            if tag and len(tag) > 1:
                clean_tag = tag.strip()
                tag_counts[clean_tag] = tag_counts.get(clean_tag, 0) + 1
    
    # Sort by count and take top
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    items = [
        VOCItem(tag=tag, count=count)
        for tag, count in sorted_tags
    ]
    
    total = sum(count for _, count in sorted_tags)
    
    return VOCResponse(items=items, total_mentions=total)


# ============================================================================
# Win/Loss Summary
# ============================================================================

class WinLossReason(BaseModel):
    """Win or loss reason"""
    reason: str
    count: int
    percentage: float


class WinLossSummaryResponse(BaseModel):
    """Win/Loss summary statistics"""
    wins: int
    losses: int
    pending: int
    win_rate: float
    top_win_reasons: List[WinLossReason]
    top_loss_reasons: List[WinLossReason]


@router.get("/win-loss", response_model=WinLossSummaryResponse)
async def get_win_loss_summary(
    project_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get Win/Loss summary based on lead_status from extra_data.
    
    Categorizes leads as:
    - Wins: Статусы типа 'Оплата', 'Закрыто', 'Успешно'
    - Losses: Статусы типа 'Отказ', 'Недозвон', 'Отменен'
    - Pending: Все остальные (В работе, Новый и т.д.)
    """
    import json
    
    if not date_to:
        date_to = date.today()
    if not date_from:
        date_from = date_to - timedelta(days=30)
    
    # Get all calls with extra_data
    query = select(Call.extra_data, Call.final_percent).where(
        and_(
            Call.project_id == project_id,
            Call.call_date >= date_from,
            Call.call_date <= date_to,
            Call.extra_data.isnot(None),
        )
    )
    
    result = await db.execute(query)
    calls = result.all()
    
    # Status categorization
    win_keywords = ['оплат', 'закрыт', 'успе', 'выигра', 'купил', 'продаж']
    loss_keywords = ['отказ', 'недозвон', 'отмен', 'проигр', 'потерян', 'не подошло']
    
    wins = 0
    losses = 0
    pending = 0
    
    win_reasons: dict[str, int] = {}
    loss_reasons: dict[str, int] = {}
    
    for call in calls:
        extra_data = call.extra_data
        if isinstance(extra_data, str):
            try:
                extra_data = json.loads(extra_data)
            except:
                continue
        
        if not extra_data:
            pending += 1
            continue
        
        lead_status = extra_data.get('lead_status', '').lower() if extra_data.get('lead_status') else ''
        
        is_win = any(kw in lead_status for kw in win_keywords)
        is_loss = any(kw in lead_status for kw in loss_keywords)
        
        if is_win:
            wins += 1
            # Track win reasons based on high score criteria
            if call.final_percent and call.final_percent >= 70:
                win_reasons["Высокий скоринг звонка"] = win_reasons.get("Высокий скоринг звонка", 0) + 1
            else:
                win_reasons["Качественная отработка"] = win_reasons.get("Качественная отработка", 0) + 1
        elif is_loss:
            losses += 1
            # Track loss reasons
            if 'недозвон' in lead_status:
                loss_reasons["Недозвон"] = loss_reasons.get("Недозвон", 0) + 1
            elif 'отказ' in lead_status:
                loss_reasons["Отказ клиента"] = loss_reasons.get("Отказ клиента", 0) + 1
            elif 'отмен' in lead_status:
                loss_reasons["Отмена"] = loss_reasons.get("Отмена", 0) + 1
            else:
                loss_reasons["Другое"] = loss_reasons.get("Другое", 0) + 1
        else:
            pending += 1
    
    total = wins + losses + pending
    win_rate = (wins / total * 100) if total > 0 else 0
    
    # Convert reasons to response format
    def reasons_to_list(reasons: dict, total_category: int) -> List[WinLossReason]:
        sorted_reasons = sorted(reasons.items(), key=lambda x: x[1], reverse=True)[:3]
        return [
            WinLossReason(
                reason=r,
                count=c,
                percentage=round(c / total_category * 100, 1) if total_category > 0 else 0
            )
            for r, c in sorted_reasons
        ]
    
    return WinLossSummaryResponse(
        wins=wins,
        losses=losses,
        pending=pending,
        win_rate=win_rate,
        top_win_reasons=reasons_to_list(win_reasons, wins),
        top_loss_reasons=reasons_to_list(loss_reasons, losses),
    )
