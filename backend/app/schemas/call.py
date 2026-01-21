"""
Call schemas
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field

from app.schemas.manager import ManagerResponse
from app.schemas.criteria import CriteriaResponse, CriteriaGroupResponse


class CallScoreCreate(BaseModel):
    """Schema for creating a call score"""
    call_id: int
    criteria_id: int
    score: str = Field(..., max_length=100)
    reason: Optional[str] = None
    quote: Optional[str] = None


class CallScoreResponse(BaseModel):
    """Schema for call score response"""
    id: int
    call_id: int
    criteria_id: int
    score: str
    reason: Optional[str]
    quote: Optional[str]
    criteria: Optional[CriteriaResponse] = None
    
    class Config:
        from_attributes = True


class CallGroupAverageCreate(BaseModel):
    """Schema for creating a call group average"""
    call_id: int
    group_id: int
    average_percent: Decimal = Field(..., ge=0, le=100)


class CallGroupAverageResponse(BaseModel):
    """Schema for call group average response"""
    id: int
    call_id: int
    group_id: int
    average_percent: Decimal
    group: Optional[CriteriaGroupResponse] = None
    
    class Config:
        from_attributes = True


class CallCreate(BaseModel):
    """Schema for creating a call"""
    project_id: int
    manager_id: int
    external_id: str = Field(..., max_length=255)
    call_date: date
    call_week: str = Field(..., max_length=50)
    duration_seconds: int = Field(default=0, ge=0)
    final_percent: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    metadata_json: Optional[dict[str, Any]] = None


class CallResponse(BaseModel):
    """Schema for call response"""
    id: int
    project_id: int
    manager_id: Optional[int] = None
    external_id: Optional[str] = None
    call_date: Optional[date] = None
    call_week: Optional[str] = None
    duration_seconds: Optional[int] = 0
    final_percent: Optional[Decimal] = None
    extra_data: Optional[dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CallListResponse(BaseModel):
    """Schema for list of calls with pagination"""
    items: List[CallResponse]
    total: int
    page: int
    size: int
    pages: int


class CallDetailResponse(CallResponse):
    """Schema for detailed call response with scores"""
    manager: Optional[ManagerResponse] = None
    scores: List[CallScoreResponse] = []
    group_averages: List[CallGroupAverageResponse] = []
    extra_data: Optional[dict[str, Any]] = None  # CRM data, contact info, etc.
    
    class Config:
        from_attributes = True
