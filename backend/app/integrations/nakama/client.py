"""
Nakama API Client - async HTTP client for nakama_api service
"""
import httpx
from typing import Optional, List, Dict, Any
from datetime import date, datetime

from app.config import settings
from app.integrations.nakama.schemas import (
    NakamaProject,
    NakamaItemSet,
    NakamaInsight,
    NakamaInsightsResponse,
    NakamaTranscription,
    NakamaCRMData,
)


class NakamaAPIError(Exception):
    """Exception for Nakama API errors"""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"Nakama API error {status_code}: {message}")


class NakamaAPIClient:
    """
    Async client for nakama_api REST API.
    
    Provides methods to:
    - Get projects and item sets (calls)
    - Get insights (criteria analysis results)
    - Get transcriptions
    - Get CRM data
    
    Usage:
        async with NakamaAPIClient() as client:
            projects = await client.get_projects()
            insights = await client.get_insights(project_id=1, item_set_id=50)
    """
    
    def __init__(
        self, 
        base_url: Optional[str] = None, 
        api_key: Optional[str] = None,
        timeout: float = 30.0
    ):
        """
        Initialize Nakama API client.
        
        Args:
            base_url: API base URL (defaults to settings.nakama_api_url)
            api_key: API key (defaults to settings.nakama_api_key)
            timeout: Request timeout in seconds
        """
        self.base_url = (base_url or settings.nakama_api_url).rstrip('/')
        self.api_key = api_key or settings.nakama_api_key
        self.headers = {"API-Access-Key": self.api_key}
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self) -> "NakamaAPIClient":
        """Context manager entry - create HTTP client."""
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.headers,
            timeout=self.timeout,
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit - close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    @property
    def client(self) -> httpx.AsyncClient:
        """Get the HTTP client, creating one if needed."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=self.headers,
                timeout=self.timeout,
            )
        return self._client
    
    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def _request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request to Nakama API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            params: Query parameters
            json: JSON body for POST/PATCH requests
            
        Returns:
            Response JSON data
            
        Raises:
            NakamaAPIError: If request fails
        """
        # Filter out None values from params
        if params:
            params = {k: v for k, v in params.items() if v is not None}
        
        response = await self.client.request(
            method=method,
            url=endpoint,
            params=params,
            json=json,
        )
        
        if response.status_code == 204:
            return {}
        
        if response.status_code >= 400:
            detail = "Unknown error"
            try:
                error_data = response.json()
                detail = error_data.get("detail", str(error_data))
            except Exception:
                detail = response.text or f"HTTP {response.status_code}"
            
            raise NakamaAPIError(response.status_code, detail)
        
        return response.json()
    
    # ==================== Projects ====================
    
    async def get_projects(
        self,
        limit: int = 100,
        offset: int = 0,
        status_filter: Optional[List[str]] = None,
        search: Optional[str] = None,
    ) -> List[NakamaProject]:
        """
        Get list of projects for current user.
        
        Args:
            limit: Max number of projects to return
            offset: Pagination offset
            status_filter: Filter by status (e.g., ["active"])
            search: Search by name
            
        Returns:
            List of NakamaProject objects
        """
        params = {
            "limit": limit,
            "offset": offset,
        }
        if status_filter:
            params["status_filter"] = status_filter
        if search:
            params["search"] = search
        
        data = await self._request("GET", "/api/projects", params=params)
        
        projects = []
        for p in data.get("projects", []):
            projects.append(NakamaProject(
                id=p["id"],
                name=p["name"],
                created_at=self._parse_datetime(p.get("created_at")),
                updated_at=self._parse_datetime(p.get("updated_at")),
                active_status=p.get("active_status", "active"),
                analyzed_calls_count=p.get("analyzed_calls_count", 0),
                analyzed_minutes=p.get("analyzed_minutes", 0.0),
            ))
        
        return projects
    
    # ==================== Item Sets (Calls) ====================
    
    async def get_item_sets(
        self, 
        project_id: int,
    ) -> List[NakamaItemSet]:
        """
        Get list of item sets (calls) for a project.
        
        Args:
            project_id: Nakama project ID
            
        Returns:
            List of NakamaItemSet objects
        """
        data = await self._request(
            "GET", 
            f"/api/client/project/{project_id}/item-sets"
        )
        
        return self._parse_item_sets(data.get("item_sets", []))
    
    async def get_item_sets_by_date(
        self, 
        project_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> List[NakamaItemSet]:
        """
        Get item sets (calls) filtered by date range.
        
        Args:
            project_id: Nakama project ID
            date_from: Start date (YYYY-MM-DD)
            date_to: End date (YYYY-MM-DD)
            page: Page number (starting from 1)
            per_page: Items per page (1-100)
            
        Returns:
            List of NakamaItemSet objects
        """
        params = {}
        if date_from:
            params["date_from"] = date_from.isoformat()
        if date_to:
            params["date_to"] = date_to.isoformat()
        if page is not None and per_page is not None:
            params["page"] = page
            params["per_page"] = per_page
        
        data = await self._request(
            "GET",
            f"/api/client/project/{project_id}/item-sets/by-date",
            params=params,
        )
        
        return self._parse_item_sets(data.get("item_sets", []))
    
    async def get_item_set(self, item_set_id: int) -> NakamaItemSet:
        """
        Get details of a specific item set (call).
        
        Args:
            item_set_id: Nakama item set ID
            
        Returns:
            NakamaItemSet object
        """
        data = await self._request(
            "GET",
            f"/api/client/item-set/{item_set_id}"
        )
        
        return NakamaItemSet(
            id=data["id"],
            name=data["name"],
            created_at=self._parse_datetime(data.get("created_at")),
            status=data.get("status", "added"),
            status_within_project=data.get("status_within_project", "added"),
            id_project=data.get("id_project"),
        )
    
    # ==================== Insights ====================
    
    async def get_insights(
        self, 
        project_id: int, 
        item_set_id: int
    ) -> NakamaInsightsResponse:
        """
        Get criteria analysis results for a call.
        
        This is the main endpoint for getting evaluation scores.
        
        Args:
            project_id: Nakama project ID
            item_set_id: Nakama item set (call) ID
            
        Returns:
            NakamaInsightsResponse with list of criteria insights
        """
        data = await self._request(
            "GET",
            "/api/insights",
            params={
                "id_project": project_id,
                "id_item_set": item_set_id,
            }
        )
        
        insights = []
        for i in data.get("insights", []):
            insights.append(NakamaInsight(
                criterion_name=i.get("criterion_name", ""),
                score=i.get("score"),
                reasons=i.get("reasons", ""),
                quotes=i.get("quotes", ""),
            ))
        
        return NakamaInsightsResponse(
            project_id=data.get("project_id", project_id),
            item_set_id=data.get("item_set_id", item_set_id),
            created_at=self._parse_datetime(data.get("created_at")),
            insights=insights,
        )
    
    # ==================== Transcription ====================
    
    async def get_transcription(
        self, 
        project_id: int, 
        item_set_id: int
    ) -> NakamaTranscription:
        """
        Get transcription for a call.
        
        Args:
            project_id: Nakama project ID
            item_set_id: Nakama item set (call) ID
            
        Returns:
            NakamaTranscription object
        """
        data = await self._request(
            "GET",
            "/api/transcription",
            params={
                "id_project": project_id,
                "id_item_set": item_set_id,
            }
        )
        
        transcription_data = data.get("transcription", {})
        return NakamaTranscription(
            output=transcription_data.get("output", ""),
            google_doc=transcription_data.get("google_doc"),
            statistics=transcription_data.get("statistics", {}),
            status=transcription_data.get("status", "completed"),
            generated_at=self._parse_datetime(transcription_data.get("generated_at")),
        )
    
    # ==================== CRM Data ====================
    
    async def get_crm_data(self, item_set_id: int) -> NakamaCRMData:
        """
        Get CRM data for a call.
        
        Args:
            item_set_id: Nakama item set (call) ID
            
        Returns:
            NakamaCRMData object
        """
        data = await self._request(
            "GET",
            f"/api/client/item-set/{item_set_id}/crm-data"
        )
        
        return NakamaCRMData(
            id_item_set=data.get("id_item_set", item_set_id),
            name=data.get("name", ""),
            crm_data=data.get("crm_data", {}),
            week_of_the_call=data.get("week_of_the_call"),
            file_duration=data.get("file_duration", 0.0),
            created_at=self._parse_datetime(data.get("created_at")),
        )
    
    # ==================== Formula Results ====================
    
    async def get_formula_results(
        self, 
        project_id: int, 
        item_set_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get formula calculation results for a call.
        
        Args:
            project_id: Nakama project ID
            item_set_id: Nakama item set (call) ID
            
        Returns:
            List of formula result dictionaries
        """
        data = await self._request(
            "GET",
            f"/api/admin/output/formulas/project/{project_id}/item-set/{item_set_id}"
        )
        
        return data if isinstance(data, list) else []
    
    # ==================== Helpers ====================
    
    def _parse_item_sets(self, items: List[Dict]) -> List[NakamaItemSet]:
        """Parse list of item set dictionaries."""
        return [
            NakamaItemSet(
                id=item["id"],
                name=item["name"],
                created_at=self._parse_datetime(item.get("created_at")),
                status=item.get("status", "added"),
                status_within_project=item.get("status_within_project", "added"),
                id_project=item.get("id_project"),
            )
            for item in items
        ]
    
    def _parse_datetime(self, value: Optional[str]) -> Optional[datetime]:
        """Parse datetime string from API."""
        if not value:
            return None
        
        try:
            # Try ISO format
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None
