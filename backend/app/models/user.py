"""
User model for authentication and authorization
"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Enum, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserRole(str, enum.Enum):
    """User roles for RBAC"""
    CEO = "ceo"
    SALES_DIRECTOR = "sales_director"
    ROP = "rop"  # Руководитель отдела продаж
    MANAGER = "manager"
    MARKETING = "marketing"
    PRODUCT = "product"
    ADMIN = "admin"


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.MANAGER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Link to manager for manager role users
    manager_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("managers.id"), nullable=True)
    # Default project for this user
    project_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("projects.id"), nullable=True)
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
