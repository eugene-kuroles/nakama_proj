"""
Schemas for Nakama API responses
"""
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime


@dataclass
class NakamaProject:
    """Nakama project data"""
    id: int
    name: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    active_status: str = "active"
    analyzed_calls_count: int = 0
    analyzed_minutes: float = 0.0


@dataclass
class NakamaItemSet:
    """Nakama item set (call) data"""
    id: int
    name: str
    created_at: Optional[datetime] = None
    status: str = "added"
    status_within_project: str = "added"
    id_project: Optional[int] = None


@dataclass
class NakamaInsight:
    """Single criteria insight from Nakama"""
    criterion_name: str
    score: Optional[Any] = None  # Can be int, str, or empty
    reasons: str = ""
    quotes: str = ""


@dataclass
class NakamaInsightsResponse:
    """Full insights response from Nakama"""
    project_id: int
    item_set_id: int
    created_at: Optional[datetime] = None
    insights: List[NakamaInsight] = field(default_factory=list)


@dataclass
class NakamaTranscription:
    """Transcription data from Nakama"""
    output: str = ""
    google_doc: Optional[str] = None
    statistics: Dict[str, Any] = field(default_factory=dict)
    status: str = "completed"
    generated_at: Optional[datetime] = None


@dataclass
class NakamaCRMData:
    """CRM data for a call from Nakama"""
    id_item_set: int
    name: str
    crm_data: Dict[str, Any] = field(default_factory=dict)
    week_of_the_call: Optional[str] = None
    file_duration: float = 0.0
    created_at: Optional[datetime] = None
    
    @property
    def manager_name(self) -> Optional[str]:
        """Extract manager name from CRM data"""
        return (
            self.crm_data.get("manager_name") or 
            self.crm_data.get("Ответственный") or
            self.crm_data.get("manager")
        )
    
    @property
    def client_name(self) -> Optional[str]:
        """Extract client name from CRM data"""
        return (
            self.crm_data.get("client_name") or
            self.crm_data.get("Клиент") or
            self.crm_data.get("client")
        )
    
    @property
    def call_date(self) -> Optional[str]:
        """Extract call date from CRM data"""
        return (
            self.crm_data.get("call_date") or
            self.crm_data.get("Дата звонка") or
            self.crm_data.get("date")
        )
