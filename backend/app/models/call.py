"""
Call models - represents analyzed calls and their scores
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.manager import Manager
    from app.models.criteria import Criteria, CriteriaGroup


class Call(Base):
    """Call model - represents an analyzed sales call"""
    __tablename__ = "calls"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id"), nullable=False)
    manager_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("managers.id"), nullable=True)
    
    # External identifiers
    external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # nakama item_set_id
    
    # Call metadata
    call_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    call_week: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "2025-01-06 - 2025-01-12"
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Computed scores
    final_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Raw metadata from CRM/Excel (renamed from 'metadata' to avoid SQLAlchemy conflict)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="calls")
    manager: Mapped[Optional["Manager"]] = relationship("Manager", back_populates="calls")
    scores: Mapped[List["CallScore"]] = relationship("CallScore", back_populates="call", lazy="selectin", cascade="all, delete-orphan")
    group_averages: Mapped[List["CallGroupAverage"]] = relationship("CallGroupAverage", back_populates="call", lazy="selectin", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Call(id={self.id}, external_id={self.external_id}, date={self.call_date})>"


class CallScore(Base):
    """Score for a specific criteria on a call"""
    __tablename__ = "call_scores"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    call_id: Mapped[int] = mapped_column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False)
    criteria_id: Mapped[int] = mapped_column(Integer, ForeignKey("criteria.id"), nullable=False)
    
    # Score value (can be numeric like "5", "0" or tags like "Да", "Нет", etc.)
    score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # AI reasoning and quotes
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quote: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    call: Mapped["Call"] = relationship("Call", back_populates="scores")
    criteria: Mapped["Criteria"] = relationship("Criteria", back_populates="call_scores")
    
    def __repr__(self) -> str:
        return f"<CallScore(call_id={self.call_id}, criteria_id={self.criteria_id}, score={self.score})>"


class CallGroupAverage(Base):
    """Average score for a criteria group on a call"""
    __tablename__ = "call_group_averages"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    call_id: Mapped[int] = mapped_column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("criteria_groups.id"), nullable=False)
    
    # Average score for the group (0-100%)
    average_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    call: Mapped["Call"] = relationship("Call", back_populates="group_averages")
    group: Mapped["CriteriaGroup"] = relationship("CriteriaGroup", back_populates="call_group_averages")
    
    def __repr__(self) -> str:
        return f"<CallGroupAverage(call_id={self.call_id}, group_id={self.group_id}, avg={self.average_percent})>"
