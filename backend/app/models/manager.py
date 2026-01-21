"""
Manager model - represents a sales manager in a project
"""
from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.call import Call


class Manager(Base):
    """Manager model - represents a sales manager tracked in the system"""
    __tablename__ = "managers"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id"), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)  # ID from CRM
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="managers")
    calls: Mapped[List["Call"]] = relationship("Call", back_populates="manager", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Manager(id={self.id}, name={self.name}, project_id={self.project_id})>"
