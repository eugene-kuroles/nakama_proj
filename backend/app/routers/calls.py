"""
📞 Calls Router - CRUD operations for calls
"""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.call import Call, CallScore
from app.models.project import Project
from app.schemas.call import (
    CallResponse,
    CallDetailResponse,
    CallListResponse,
)
from app.core.security import get_current_active_user

router = APIRouter()


@router.get("", response_model=CallListResponse)
async def get_calls(
    project_id: int,
    manager_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of calls with filtering and pagination.
    
    Filters:
    - project_id: Required - filter by project
    - manager_id: Optional - filter by manager
    - date_from: Optional - calls from this date
    - date_to: Optional - calls until this date
    """
    # Build query
    query = select(Call).where(Call.project_id == project_id)
    
    if manager_id:
        query = query.where(Call.manager_id == manager_id)
    
    if date_from:
        query = query.where(Call.call_date >= date_from)
    
    if date_to:
        query = query.where(Call.call_date <= date_to)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * size
    query = query.order_by(Call.call_date.desc()).offset(offset).limit(size)
    
    result = await db.execute(query)
    calls = result.scalars().all()
    
    pages = (total + size - 1) // size
    
    return CallListResponse(
        items=[CallResponse.model_validate(c) for c in calls],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


from app.models.criteria import Criteria, CriteriaGroup


@router.get("/{call_id}", response_model=CallDetailResponse)
async def get_call(
    call_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed call information with scores.
    """
    query = (
        select(Call)
        .where(Call.id == call_id)
        .options(
            selectinload(Call.manager),
            selectinload(Call.scores).selectinload(CallScore.criteria).selectinload(Criteria.group),
            selectinload(Call.group_averages),
        )
    )
    
    result = await db.execute(query)
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found",
        )
    
    return call


@router.get("/manager/{manager_id}", response_model=CallListResponse)
async def get_manager_calls(
    manager_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all calls for a specific manager.
    """
    query = select(Call).where(Call.manager_id == manager_id)
    
    if date_from:
        query = query.where(Call.call_date >= date_from)
    
    if date_to:
        query = query.where(Call.call_date <= date_to)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    offset = (page - 1) * size
    query = query.order_by(Call.call_date.desc()).offset(offset).limit(size)
    
    result = await db.execute(query)
    calls = result.scalars().all()
    
    pages = (total + size - 1) // size
    
    return CallListResponse(
        items=[CallResponse.model_validate(c) for c in calls],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
