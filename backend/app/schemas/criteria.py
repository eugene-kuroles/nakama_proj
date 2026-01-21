"""
Criteria schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.criteria import ScoreType


class CriteriaCreate(BaseModel):
    """Schema for creating a criteria"""
    group_id: int
    number: int = Field(..., ge=1)
    name: str = Field(..., min_length=1, max_length=500)
    prompt: Optional[str] = None
    in_final_score: bool = True
    score_type: ScoreType = ScoreType.NUMERIC
    order: int = 0


class CriteriaGroupSimpleResponse(BaseModel):
    """Simplified criteria group response for nested use"""
    id: int
    name: str
    order: int
    
    class Config:
        from_attributes = True


class CriteriaResponse(BaseModel):
    """Schema for criteria response"""
    id: int
    group_id: int
    number: int
    name: str
    prompt: Optional[str] = None
    in_final_score: bool
    score_type: ScoreType
    order: int
    group: Optional[CriteriaGroupSimpleResponse] = None
    
    class Config:
        from_attributes = True


class CriteriaGroupCreate(BaseModel):
    """Schema for creating a criteria group"""
    project_id: int
    name: str = Field(..., min_length=1, max_length=255)
    order: int = 0


class CriteriaGroupResponse(BaseModel):
    """Schema for criteria group response"""
    id: int
    project_id: int
    name: str
    order: int
    criteria: List[CriteriaResponse] = []
    
    class Config:
        from_attributes = True
