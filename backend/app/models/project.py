"""
Project model - represents a client project
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.manager import Manager
    from app.models.criteria import CriteriaGroup
    from app.models.call import Call


class Project(Base):
    """Project model - represents a client/project in the system"""
    __tablename__ = "projects"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    nakama_project_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )
    
    # Relationships
    managers: Mapped[List["Manager"]] = relationship("Manager", back_populates="project", lazy="selectin")
    criteria_groups: Mapped[List["CriteriaGroup"]] = relationship("CriteriaGroup", back_populates="project", lazy="selectin")
    calls: Mapped[List["Call"]] = relationship("Call", back_populates="project", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name}, client={self.client_name})>"
