"""
Upload Service - handles Excel file uploads and data import
"""
import os
import uuid
import tempfile
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import UploadFile
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.manager import Manager
from app.models.call import Call, CallScore
from app.models.criteria import Criteria, CriteriaGroup, ScoreType
from app.integrations.excel.criteria import CriteriaSheetParser
from app.integrations.excel.ai_sheet import AISheetParser
from app.integrations.excel.schemas import ParsedCriteria, ParsedCall, CriteriaData

logger = logging.getLogger(__name__)


@dataclass
class UploadResult:
    """Result of Excel upload processing"""
    success: bool = True
    criteria_count: int = 0
    groups_count: int = 0
    calls_count: int = 0
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class UploadService:
    """
    Service for processing Excel file uploads.
    
    Workflow:
    1. Save uploaded file to temp directory
    2. Parse Criteria sheet - create/update criteria and groups
    3. Parse AI sheet - create calls and scores
    4. Clean up temp file
    
    Usage:
        upload_service = UploadService(db_session)
        result = await upload_service.process_upload(file, project_id)
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize upload service.
        
        Args:
            db: Async database session
        """
        self.db = db
        self._manager_cache: Dict[str, Manager] = {}
        self._criteria_cache: Dict[int, Criteria] = {}
    
    async def process_upload(
        self, 
        file: UploadFile, 
        project_id: int
    ) -> UploadResult:
        """
        Process an uploaded Excel file.
        
        Args:
            file: Uploaded file from FastAPI
            project_id: Project ID to import data into
            
        Returns:
            UploadResult with counts and status
        """
        result = UploadResult()
        temp_path = None
        
        try:
            # Verify project exists
            project = await self._get_project(project_id)
            if not project:
                result.success = False
                result.errors.append(f"Project {project_id} not found")
                return result
            
            # Save to temp file
            temp_path = await self._save_temp_file(file)
            
            # Process the file
            result = await self.process_file(temp_path, project_id)
            
        except Exception as e:
            logger.exception(f"Error processing upload for project {project_id}")
            result.success = False
            result.errors.append(str(e))
            
        finally:
            # Clean up temp file
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temp file {temp_path}: {e}")
        
        return result
    
    async def process_file(
        self, 
        file_path: str, 
        project_id: int
    ) -> UploadResult:
        """
        Process an Excel file from disk.
        
        Args:
            file_path: Path to Excel file
            project_id: Project ID to import data into
            
        Returns:
            UploadResult with counts and status
        """
        result = UploadResult()
        
        try:
            # Parse Criteria sheet
            criteria_parser = CriteriaSheetParser()
            try:
                parsed_criteria = criteria_parser.parse(file_path)
                
                # Save criteria to database
                await self._save_criteria(project_id, parsed_criteria)
                result.groups_count = len(parsed_criteria.groups)
                result.criteria_count = len(parsed_criteria.criteria)
                
                logger.info(
                    f"Parsed {result.criteria_count} criteria in "
                    f"{result.groups_count} groups for project {project_id}"
                )
                
            except ValueError as e:
                result.warnings.append(f"Criteria sheet: {e}")
                parsed_criteria = ParsedCriteria()
            
            # Load criteria from DB for mapping
            criteria_list = await self._get_project_criteria(project_id)
            
            # Parse AI sheet
            ai_parser = AISheetParser()
            try:
                parsed_calls = ai_parser.parse(file_path, parsed_criteria.criteria)
                
                # Save calls to database
                saved_count = await self._save_calls(project_id, parsed_calls, criteria_list)
                result.calls_count = saved_count
                
                logger.info(f"Saved {saved_count} calls for project {project_id}")
                
            except ValueError as e:
                result.warnings.append(f"AI sheet: {e}")
            
            result.success = True
            
        except Exception as e:
            logger.exception(f"Error processing file {file_path}")
            result.success = False
            result.errors.append(str(e))
        
        return result
    
    async def _save_temp_file(self, file: UploadFile) -> str:
        """Save uploaded file to temp directory."""
        # Generate unique filename
        ext = os.path.splitext(file.filename or "upload.xlsx")[1]
        temp_filename = f"upload_{uuid.uuid4().hex}{ext}"
        temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
        
        # Write file contents
        content = await file.read()
        with open(temp_path, 'wb') as f:
            f.write(content)
        
        return temp_path
    
    async def _get_project(self, project_id: int) -> Optional[Project]:
        """Get project by ID."""
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()
    
    async def _save_criteria(
        self, 
        project_id: int, 
        parsed: ParsedCriteria
    ) -> None:
        """
        Save parsed criteria to database.
        Creates new groups and criteria, updates existing ones.
        """
        # Create/update groups
        group_map: Dict[str, CriteriaGroup] = {}
        
        for group_data in parsed.groups:
            # Check if group exists
            result = await self.db.execute(
                select(CriteriaGroup).where(
                    and_(
                        CriteriaGroup.project_id == project_id,
                        CriteriaGroup.name == group_data.name
                    )
                )
            )
            group = result.scalar_one_or_none()
            
            if group:
                # Update order
                group.order = group_data.order
            else:
                # Create new group
                group = CriteriaGroup(
                    project_id=project_id,
                    name=group_data.name,
                    order=group_data.order,
                )
                self.db.add(group)
            
            group_map[group_data.name] = group
        
        await self.db.flush()
        
        # Create/update criteria
        for criteria_data in parsed.criteria:
            group = group_map.get(criteria_data.group_name)
            if not group:
                # Create default group if not found
                group = CriteriaGroup(
                    project_id=project_id,
                    name=criteria_data.group_name,
                    order=len(group_map),
                )
                self.db.add(group)
                await self.db.flush()
                group_map[criteria_data.group_name] = group
            
            # Check if criteria exists
            result = await self.db.execute(
                select(Criteria).where(
                    and_(
                        Criteria.group_id == group.id,
                        Criteria.number == criteria_data.number
                    )
                )
            )
            criteria = result.scalar_one_or_none()
            
            if criteria:
                # Update existing
                criteria.name = criteria_data.name
                criteria.prompt = criteria_data.prompt
                criteria.in_final_score = criteria_data.in_final_score
                criteria.order = criteria_data.order
            else:
                # Create new
                criteria = Criteria(
                    group_id=group.id,
                    number=criteria_data.number,
                    name=criteria_data.name,
                    prompt=criteria_data.prompt,
                    in_final_score=criteria_data.in_final_score,
                    score_type=ScoreType.NUMERIC,
                    order=criteria_data.order,
                )
                self.db.add(criteria)
        
        await self.db.commit()
    
    async def _get_project_criteria(self, project_id: int) -> List[Criteria]:
        """Get all criteria for a project."""
        result = await self.db.execute(
            select(Criteria)
            .join(CriteriaGroup)
            .where(CriteriaGroup.project_id == project_id)
            .order_by(Criteria.number)
        )
        criteria_list = list(result.scalars().all())
        
        # Cache by number
        self._criteria_cache = {c.number: c for c in criteria_list}
        
        return criteria_list
    
    async def _save_calls(
        self, 
        project_id: int, 
        parsed_calls: List[ParsedCall],
        criteria_list: List[Criteria]
    ) -> int:
        """
        Save parsed calls to database.
        
        Returns:
            Number of calls saved
        """
        saved_count = 0
        
        for parsed_call in parsed_calls:
            try:
                # Create call
                call = Call(
                    project_id=project_id,
                    call_date=self._parse_call_date(parsed_call.metadata),
                    call_week=parsed_call.metadata.get('call_week'),
                    duration_seconds=self._parse_duration(parsed_call.metadata.get('duration')),
                    final_percent=parsed_call.final_percent,
                    metadata=parsed_call.metadata,
                )
                
                # Find/create manager
                manager_name = parsed_call.metadata.get('manager_name')
                if manager_name:
                    manager = await self._get_or_create_manager(project_id, manager_name)
                    call.manager_id = manager.id
                
                self.db.add(call)
                await self.db.flush()
                
                # Add scores
                for score_data in parsed_call.scores:
                    criteria = self._criteria_cache.get(score_data.criteria_number)
                    if criteria:
                        score = CallScore(
                            call_id=call.id,
                            criteria_id=criteria.id,
                            score=score_data.score,
                            reason=score_data.reason,
                            quote=score_data.quote,
                        )
                        self.db.add(score)
                
                saved_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to save call: {e}")
                continue
        
        await self.db.commit()
        return saved_count
    
    async def _get_or_create_manager(
        self, 
        project_id: int, 
        name: str
    ) -> Manager:
        """Get existing manager or create new one."""
        cache_key = f"{project_id}:{name}"
        
        if cache_key in self._manager_cache:
            return self._manager_cache[cache_key]
        
        result = await self.db.execute(
            select(Manager).where(
                and_(
                    Manager.project_id == project_id,
                    Manager.name == name
                )
            )
        )
        manager = result.scalar_one_or_none()
        
        if not manager:
            manager = Manager(
                project_id=project_id,
                external_id=name.lower().replace(" ", "_")[:50],
                name=name,
            )
            self.db.add(manager)
            await self.db.flush()
        
        self._manager_cache[cache_key] = manager
        return manager
    
    def _parse_call_date(self, metadata: Dict[str, Any]) -> Optional[datetime]:
        """Parse call date from metadata."""
        date_value = metadata.get('call_date')
        if not date_value:
            return None
        
        if isinstance(date_value, datetime):
            return date_value
        
        if isinstance(date_value, str):
            # Try common formats
            for fmt in [
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d",
                "%d.%m.%Y",
                "%d/%m/%Y",
            ]:
                try:
                    return datetime.strptime(date_value, fmt)
                except ValueError:
                    continue
        
        return None
    
    def _parse_duration(self, value) -> Optional[int]:
        """Parse duration from various formats."""
        if not value:
            return None
        
        if isinstance(value, (int, float)):
            return int(value)
        
        if isinstance(value, str):
            # Try to parse "HH:MM:SS" or "MM:SS" format
            parts = value.split(':')
            try:
                if len(parts) == 3:
                    hours, minutes, seconds = map(int, parts)
                    return hours * 3600 + minutes * 60 + seconds
                elif len(parts) == 2:
                    minutes, seconds = map(int, parts)
                    return minutes * 60 + seconds
                else:
                    return int(float(value))
            except ValueError:
                pass
        
        return None
