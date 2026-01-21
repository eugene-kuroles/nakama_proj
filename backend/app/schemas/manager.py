"""
Manager schemas
"""
from datetime import datetime
from pydantic import BaseModel, Field


class ManagerCreate(BaseModel):
    """Schema for creating a new manager"""
    project_id: int
    external_id: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)


class ManagerResponse(BaseModel):
    """Schema for manager response"""
    id: int
    project_id: int
    external_id: str
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True
