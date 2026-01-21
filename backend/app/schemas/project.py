"""
Project schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    """Schema for creating a new project"""
    name: str = Field(..., min_length=1, max_length=255)
    client_name: str = Field(..., min_length=1, max_length=255)
    nakama_project_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    client_name: Optional[str] = Field(None, min_length=1, max_length=255)
    nakama_project_id: Optional[int] = None


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: int
    name: str
    client_name: str
    nakama_project_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
