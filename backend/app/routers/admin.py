"""
⚙️ Admin Router - File upload, Project management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.manager import Manager
from app.models.criteria import CriteriaGroup, Criteria
from app.schemas.project import ProjectCreate, ProjectResponse
from app.core.security import require_roles

router = APIRouter()


# ============================================================================
# Response Schemas
# ============================================================================

class UploadResult(BaseModel):
    """Result of file upload"""
    success: bool
    message: str
    criteria_count: int = 0
    calls_count: int = 0
    managers_count: int = 0


class ProjectListResponse(BaseModel):
    """List of projects"""
    items: List[ProjectResponse]
    total: int


# ============================================================================
# Project Management
# ============================================================================

@router.get("/projects", response_model=ProjectListResponse)
async def get_projects(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CEO, UserRole.SALES_DIRECTOR])),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all projects.
    """
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    projects = result.scalars().all()
    
    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=len(projects),
    )


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project.
    """
    project = Project(
        name=project_data.name,
        client_name=project_data.client_name,
        nakama_project_id=project_data.nakama_project_id,
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return project


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CEO, UserRole.SALES_DIRECTOR])),
    db: AsyncSession = Depends(get_db),
):
    """
    Get project by ID.
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    return project


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a project.
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    await db.delete(project)
    await db.commit()
    
    return {"message": "Project deleted successfully"}


# ============================================================================
# File Upload
# ============================================================================

@router.post("/upload/{project_id}", response_model=UploadResult)
async def upload_excel(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload Excel file with Criteria and AI sheets.
    
    The file should contain:
    - Criteria sheet: List of evaluation criteria
    - AI sheet: Call analysis results
    
    Other sheets will be ignored.
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xlsx, .xls) are supported",
        )
    
    # Check project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    # TODO: Implement Excel parsing using Agent 5's integration module
    # For now, return a placeholder response
    
    return UploadResult(
        success=True,
        message=f"File '{file.filename}' received. Processing will be implemented by integration module.",
        criteria_count=0,
        calls_count=0,
        managers_count=0,
    )


# ============================================================================
# Users Management
# ============================================================================

class UserListItem(BaseModel):
    """User list item"""
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """List of users"""
    items: List[UserListItem]
    total: int


@router.get("/users", response_model=UserListResponse)
async def get_users(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all users (admin only).
    """
    from app.models.user import User as UserModel
    
    result = await db.execute(select(UserModel).order_by(UserModel.created_at.desc()))
    users = result.scalars().all()
    
    return UserListResponse(
        items=[
            UserListItem(
                id=u.id,
                email=u.email,
                name=u.name,
                role=u.role.value,
                is_active=u.is_active,
            )
            for u in users
        ],
        total=len(users),
    )


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Toggle user active status (admin only).
    """
    from app.models.user import User as UserModel
    
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent self-deactivation
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself",
        )
    
    user.is_active = not user.is_active
    await db.commit()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"}
