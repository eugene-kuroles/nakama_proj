"""
User schemas for authentication
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = UserRole.MANAGER


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    manager_id: Optional[int] = None
    project_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for decoded token data"""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
