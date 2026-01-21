"""
Nakama Sync Service - synchronizes data from nakama API to local database
"""
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.manager import Manager
from app.models.call import Call, CallScore
from app.models.criteria import Criteria, CriteriaGroup
from app.integrations.nakama.client import NakamaAPIClient
from app.integrations.nakama.schemas import NakamaItemSet


@dataclass
class SyncError:
    """Error during sync operation"""
    item_set_id: int
    error: str


@dataclass
class SyncResult:
    """Result of sync operation"""
    synced: int = 0
    skipped: int = 0
    errors: List[SyncError] = field(default_factory=list)
    
    @property
    def total_processed(self) -> int:
        return self.synced + self.skipped + len(self.errors)


class NakamaSyncService:
    """
    Service for synchronizing data from nakama API to local database.
    
    Workflow:
    1. Get list of calls from nakama for a project
    2. Filter only processed calls (status_within_project == 'processed')
    3. For each new call:
       - Load insights (criteria scores)
       - Load CRM data
       - Save to local database
    
    Usage:
        async with NakamaAPIClient() as client:
            sync_service = NakamaSyncService(client, db_session)
            result = await sync_service.sync_project(
                local_project_id=1,
                nakama_project_id=100
            )
    """
    
    def __init__(self, client: NakamaAPIClient, db: AsyncSession):
        """
        Initialize sync service.
        
        Args:
            client: NakamaAPIClient instance
            db: Async database session
        """
        self.client = client
        self.db = db
        self._criteria_cache: dict = {}
        self._manager_cache: dict = {}
    
    async def sync_project(
        self, 
        local_project_id: int,
        nakama_project_id: int,
        since: Optional[datetime] = None
    ) -> SyncResult:
        """
        Synchronize calls from nakama to local database.
        
        Args:
            local_project_id: ID of local project in our database
            nakama_project_id: ID of project in nakama API
            since: Only sync calls created after this datetime
            
        Returns:
            SyncResult with counts and errors
        """
        result = SyncResult()
        
        # Get item sets from nakama
        if since:
            item_sets = await self.client.get_item_sets_by_date(
                project_id=nakama_project_id,
                date_from=since.date(),
            )
        else:
            item_sets = await self.client.get_item_sets(
                project_id=nakama_project_id,
            )
        
        # Process each item set
        for item_set in item_sets:
            # Only sync processed calls
            if item_set.status_within_project != "processed":
                result.skipped += 1
                continue
            
            try:
                synced = await self._sync_call(
                    local_project_id,
                    nakama_project_id,
                    item_set
                )
                if synced:
                    result.synced += 1
                else:
                    result.skipped += 1
                    
            except Exception as e:
                result.errors.append(SyncError(
                    item_set_id=item_set.id,
                    error=str(e)
                ))
        
        return result
    
    async def _sync_call(
        self, 
        local_project_id: int,
        nakama_project_id: int,
        item_set: NakamaItemSet
    ) -> bool:
        """
        Synchronize a single call.
        
        Args:
            local_project_id: Local project ID
            nakama_project_id: Nakama project ID
            item_set: NakamaItemSet to sync
            
        Returns:
            True if call was synced, False if already exists
        """
        # Check if already synced
        existing = await self.db.execute(
            select(Call).where(
                Call.project_id == local_project_id,
                Call.external_id == str(item_set.id)
            )
        )
        if existing.scalar_one_or_none():
            return False  # Already synced
        
        # Load data from nakama
        insights_response = await self.client.get_insights(
            nakama_project_id, 
            item_set.id
        )
        crm_data = await self.client.get_crm_data(item_set.id)
        
        # Create call record
        call = Call(
            project_id=local_project_id,
            external_id=str(item_set.id),
            call_date=self._parse_date(crm_data.call_date),
            call_week=crm_data.week_of_the_call,
            duration_seconds=int(crm_data.file_duration) if crm_data.file_duration else None,
            metadata=crm_data.crm_data,
        )
        
        # Find or create manager
        manager_name = crm_data.manager_name
        if manager_name:
            manager = await self._get_or_create_manager(
                local_project_id, 
                manager_name
            )
            call.manager_id = manager.id
        
        self.db.add(call)
        await self.db.flush()
        
        # Add scores
        for insight in insights_response.insights:
            criteria = await self._find_criteria_by_name(
                local_project_id, 
                insight.criterion_name
            )
            if criteria:
                score = CallScore(
                    call_id=call.id,
                    criteria_id=criteria.id,
                    score=self._normalize_score(insight.score),
                    reason=insight.reasons,
                    quote=insight.quotes,
                )
                self.db.add(score)
        
        await self.db.commit()
        return True
    
    async def _get_or_create_manager(
        self, 
        project_id: int, 
        name: str
    ) -> Manager:
        """Get existing manager or create new one."""
        # Check cache
        cache_key = f"{project_id}:{name}"
        if cache_key in self._manager_cache:
            return self._manager_cache[cache_key]
        
        # Check database
        result = await self.db.execute(
            select(Manager).where(
                Manager.project_id == project_id,
                Manager.name == name
            )
        )
        manager = result.scalar_one_or_none()
        
        if not manager:
            # Create new manager
            manager = Manager(
                project_id=project_id,
                external_id=self._generate_manager_id(name),
                name=name,
            )
            self.db.add(manager)
            await self.db.flush()
        
        self._manager_cache[cache_key] = manager
        return manager
    
    async def _find_criteria_by_name(
        self, 
        project_id: int, 
        criterion_name: str
    ) -> Optional[Criteria]:
        """
        Find criteria by name (with fuzzy matching).
        
        Criterion names in nakama are formatted as "1. Приветствие и установление контакта"
        We need to match by number or by name.
        """
        # Check cache
        cache_key = f"{project_id}:{criterion_name}"
        if cache_key in self._criteria_cache:
            return self._criteria_cache[cache_key]
        
        # Try to extract number from criterion name
        match = re.match(r'^(\d+)[\.\s]', criterion_name)
        criteria_number = int(match.group(1)) if match else None
        
        # Load project criteria if not cached
        if project_id not in self._criteria_cache:
            await self._load_project_criteria(project_id)
        
        # Find by number first
        if criteria_number:
            criteria_list = self._criteria_cache.get(f"{project_id}:list", [])
            for criteria in criteria_list:
                if criteria.number == criteria_number:
                    self._criteria_cache[cache_key] = criteria
                    return criteria
        
        # Fallback: find by name similarity
        criteria_list = self._criteria_cache.get(f"{project_id}:list", [])
        criterion_clean = criterion_name.lower().strip()
        
        for criteria in criteria_list:
            if criteria.name.lower().strip() in criterion_clean:
                self._criteria_cache[cache_key] = criteria
                return criteria
        
        return None
    
    async def _load_project_criteria(self, project_id: int) -> None:
        """Load all criteria for a project into cache."""
        result = await self.db.execute(
            select(Criteria)
            .join(CriteriaGroup)
            .where(CriteriaGroup.project_id == project_id)
        )
        criteria_list = list(result.scalars().all())
        self._criteria_cache[f"{project_id}:list"] = criteria_list
    
    def _parse_date(self, value) -> Optional[datetime]:
        """Parse date from various formats."""
        if not value:
            return None
        
        if isinstance(value, datetime):
            return value
        
        if isinstance(value, str):
            # Try ISO format
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                pass
            
            # Try common formats
            for fmt in [
                "%Y-%m-%d",
                "%Y-%m-%dT%H:%M:%S",
                "%d.%m.%Y",
                "%d/%m/%Y",
            ]:
                try:
                    return datetime.strptime(value, fmt)
                except ValueError:
                    continue
        
        return None
    
    def _normalize_score(self, value) -> Optional[str]:
        """Normalize score value to string."""
        if value is None or value == "":
            return None
        
        if isinstance(value, (int, float)):
            return str(int(value)) if value == int(value) else str(value)
        
        return str(value).strip()
    
    def _generate_manager_id(self, name: str) -> str:
        """Generate a unique ID for manager from name."""
        # Simple: use lowercase name with underscores
        return name.lower().replace(" ", "_").replace(".", "")[:50]
