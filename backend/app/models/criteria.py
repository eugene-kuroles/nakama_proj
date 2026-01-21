"""
Criteria models - evaluation criteria for calls
"""
import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, Boolean, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.call import CallScore, CallGroupAverage


class ScoreType(str, enum.Enum):
    """Type of scoring for a criteria"""
    NUMERIC = "numeric"
    TAG = "tag"
    RECOMMENDATION = "recommendation"


class CriteriaGroup(Base):
    """Group of criteria - e.g., 'Установление контакта', 'Выявление потребностей'"""
    __tablename__ = "criteria_groups"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="criteria_groups")
    criteria: Mapped[List["Criteria"]] = relationship("Criteria", back_populates="group", lazy="selectin")
    call_group_averages: Mapped[List["CallGroupAverage"]] = relationship(
        "CallGroupAverage", 
        back_populates="group", 
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<CriteriaGroup(id={self.id}, name={self.name})>"


class Criteria(Base):
    """Individual criteria within a group"""
    __tablename__ = "criteria"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("criteria_groups.id"), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    in_final_score: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    score_type: Mapped[ScoreType] = mapped_column(Enum(ScoreType), default=ScoreType.NUMERIC, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    group: Mapped["CriteriaGroup"] = relationship("CriteriaGroup", back_populates="criteria")
    call_scores: Mapped[List["CallScore"]] = relationship("CallScore", back_populates="criteria", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Criteria(id={self.id}, number={self.number}, name={self.name[:30]})>"
