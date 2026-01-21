"""
Schemas for Excel parsing - data classes for parsed data
"""
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any


@dataclass
class CriteriaGroupData:
    """Parsed criteria group from Excel"""
    name: str
    order: int


@dataclass
class CriteriaData:
    """Parsed criteria from Excel"""
    group_name: str
    number: int
    name: str
    prompt: Optional[str] = None
    in_final_score: bool = True
    order: int = 0


@dataclass
class ParsedCriteria:
    """Result of parsing Criteria sheet"""
    groups: List[CriteriaGroupData] = field(default_factory=list)
    criteria: List[CriteriaData] = field(default_factory=list)


@dataclass
class CallScoreData:
    """Parsed call score from Excel"""
    criteria_number: int
    score: Optional[str] = None
    reason: Optional[str] = None
    quote: Optional[str] = None


@dataclass
class ParsedCall:
    """Parsed call from AI sheet"""
    metadata: Dict[str, Any] = field(default_factory=dict)
    scores: List[CallScoreData] = field(default_factory=list)
    final_percent: Optional[float] = None


@dataclass
class ColumnMapping:
    """Mapping of Excel columns to data fields"""
    meta_columns: Dict[int, str] = field(default_factory=dict)
    criteria_columns: Dict[int, tuple] = field(default_factory=dict)  # {criteria_num: (score_col, reason_col, quote_col)}
    formula_columns: Dict[int, str] = field(default_factory=dict)
    
    def add_score_column(self, criteria_num: int, col_idx: int) -> None:
        """Add score column for criteria"""
        if criteria_num not in self.criteria_columns:
            self.criteria_columns[criteria_num] = (col_idx, None, None)
        else:
            existing = self.criteria_columns[criteria_num]
            self.criteria_columns[criteria_num] = (col_idx, existing[1], existing[2])
    
    def add_reason_column(self, criteria_num: int, col_idx: int) -> None:
        """Add reason column for criteria"""
        if criteria_num not in self.criteria_columns:
            self.criteria_columns[criteria_num] = (None, col_idx, None)
        else:
            existing = self.criteria_columns[criteria_num]
            self.criteria_columns[criteria_num] = (existing[0], col_idx, existing[2])
    
    def add_quote_column(self, criteria_num: int, col_idx: int) -> None:
        """Add quote column for criteria"""
        if criteria_num not in self.criteria_columns:
            self.criteria_columns[criteria_num] = (None, None, col_idx)
        else:
            existing = self.criteria_columns[criteria_num]
            self.criteria_columns[criteria_num] = (existing[0], existing[1], col_idx)
