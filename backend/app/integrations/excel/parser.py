"""
Excel Parser for Spellit Analytics

Parses Excel files with Criteria and AI sheets.

Structure:
- Row 0: System keys (score_0, reason_0, user_name, etc.)
- Row 1: Criteria group headers
- Row 2: Human-readable column names
- Row 3: Duplicate of headers (skip)
- Row 4+: Call data
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import pandas as pd


@dataclass
class ParsedCriteriaGroup:
    """Parsed criteria group"""
    name: str
    order: int


@dataclass
class ParsedCriteria:
    """Parsed criteria item"""
    group_name: str
    number: int
    name: str
    prompt: Optional[str] = None
    in_final_score: bool = True
    score_type: str = "numeric"  # numeric, tag, recommendation


@dataclass
class ParsedCallScore:
    """Parsed score for a criteria"""
    criteria_number: int
    score: Optional[str] = None
    reason: Optional[str] = None
    quote: Optional[str] = None


@dataclass
class ParsedManager:
    """Parsed manager info"""
    external_id: str
    name: str


@dataclass
class ParsedCall:
    """Parsed call data"""
    external_id: str
    manager_external_id: str
    manager_name: str
    call_date: Optional[datetime] = None
    call_week: Optional[str] = None
    duration_seconds: int = 0
    final_percent: float = 0.0
    scores: List[ParsedCallScore] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class ExcelParser:
    """Parser for Spellit Excel reports"""
    
    # Known system keys for meta fields
    META_KEYS = {
        'id_item_set': 'external_id',
        'call_id': 'external_id',
        'user_name': 'manager_name',
        'user_id': 'manager_id',
        'call_date': 'call_date',
        'call_duration': 'duration',
        'real_file_duration': 'duration',
        'call_week': 'call_week',
        'default_call_week': 'call_week',
    }
    
    # Additional fields to store in extra_data
    EXTRA_DATA_KEYS = {
        'lead_url': 'crm_url',           # Ссылка на сделку в CRM
        'lead_id': 'lead_id',             # ID сделки
        'lead_name': 'lead_name',         # Название сделки
        'lead_status': 'lead_status',     # Статус сделки
        'lead_pipeline': 'lead_pipeline', # Воронка
        'contact_name': 'contact_name',   # ФИО контакта
        'contact_id': 'contact_id',       # ID контакта
        'call_phone': 'phone',            # Телефон
        'call_source': 'source',          # Источник
        'call_type': 'call_type',         # Тип звонка
        'call_time': 'call_time',         # Время звонка
    }
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.xlsx = pd.ExcelFile(file_path)
        
    def find_sheet(self, name_pattern: str) -> Optional[str]:
        """Find sheet by name pattern"""
        for sheet in self.xlsx.sheet_names:
            if name_pattern.lower() in sheet.lower():
                return sheet
        return None
    
    def parse_criteria_sheet(self) -> Tuple[List[ParsedCriteriaGroup], List[ParsedCriteria]]:
        """
        Parse Criteria sheet.
        
        Expected structure:
        | Этап | № | Название критерия | Prompt | Критерии входят в оценку 100% |
        """
        sheet_name = self.find_sheet("criteria")
        if not sheet_name:
            raise ValueError("Criteria sheet not found")
        
        df = pd.read_excel(self.xlsx, sheet_name=sheet_name)
        
        groups: List[ParsedCriteriaGroup] = []
        criteria: List[ParsedCriteria] = []
        current_group: Optional[str] = None
        group_order = 0
        
        # Find column indices
        cols = df.columns.tolist()
        stage_col = 0  # Этап
        number_col = 1  # №
        name_col = 2  # Название критерия
        prompt_col = 3 if len(cols) > 3 else None  # Prompt
        in_score_col = None
        
        # Find "Оценка 100%" column
        for i, col in enumerate(cols):
            col_str = str(col).lower()
            if '100%' in col_str or 'оценк' in col_str:
                in_score_col = i
                break
        
        for idx, row in df.iterrows():
            # Check for group header (non-empty first column)
            stage_val = row.iloc[stage_col]
            if pd.notna(stage_val) and str(stage_val).strip():
                stage_str = str(stage_val).strip()
                # Check if this is a group header (not a number)
                if not re.match(r'^\d+$', stage_str):
                    current_group = stage_str
                    groups.append(ParsedCriteriaGroup(name=current_group, order=group_order))
                    group_order += 1
                    continue
            
            # Check for criteria (has a number)
            number_val = row.iloc[number_col]
            if pd.notna(number_val):
                try:
                    number = int(float(number_val))
                except (ValueError, TypeError):
                    continue
                
                name = str(row.iloc[name_col]).strip() if pd.notna(row.iloc[name_col]) else ""
                prompt = str(row.iloc[prompt_col]).strip() if prompt_col and pd.notna(row.iloc[prompt_col]) else None
                
                # Check if in final score
                in_final = True
                if in_score_col and pd.notna(row.iloc[in_score_col]):
                    in_score_val = str(row.iloc[in_score_col]).lower().strip()
                    in_final = in_score_val in ('да', 'yes', '1', 'true')
                
                # Determine score type from prompt/name
                score_type = "numeric"
                name_lower = name.lower()
                if 'рекоменд' in name_lower:
                    score_type = "recommendation"
                elif any(tag in name_lower for tag in ['тег', 'tag', '[', ']']):
                    score_type = "tag"
                
                criteria.append(ParsedCriteria(
                    group_name=current_group or "Без группы",
                    number=number,
                    name=name,
                    prompt=prompt,
                    in_final_score=in_final,
                    score_type=score_type,
                ))
        
        return groups, criteria
    
    def parse_ai_sheet(self, criteria: List[ParsedCriteria]) -> Tuple[List[ParsedCall], List[ParsedManager]]:
        """
        Parse AI sheet with call data.
        
        Structure:
        - Row 0: System keys (score_0, reason_0, user_name, etc.)
        - Row 1: Criteria group headers
        - Row 2: Human-readable column names
        - Row 3: Duplicate headers (skip)
        - Row 4+: Call data
        """
        df = pd.read_excel(self.xlsx, sheet_name='AI', header=None)
        
        # Row 0 contains system keys
        system_keys = df.iloc[0].tolist()
        # Row 2 contains human headers
        human_headers = df.iloc[2].tolist()
        
        # Build column mapping from system keys
        column_map = self._build_column_mapping_from_keys(system_keys, human_headers)
        
        # Parse calls starting from row 4
        calls: List[ParsedCall] = []
        managers_dict: Dict[str, str] = {}  # {external_id: name}
        
        for idx in range(4, len(df)):
            row = df.iloc[idx]
            call = self._parse_call_row(row, column_map)
            if call:
                calls.append(call)
                # Track managers
                if call.manager_external_id and call.manager_name:
                    managers_dict[call.manager_external_id] = call.manager_name
        
        # Create managers list
        managers = [
            ParsedManager(external_id=ext_id, name=name)
            for ext_id, name in managers_dict.items()
        ]
        
        return calls, managers
    
    def _build_column_mapping_from_keys(
        self, 
        system_keys: List,
        human_headers: List,
    ) -> Dict[str, Any]:
        """Build column index mapping from system keys (row 0)"""
        mapping = {
            'meta': {},
            'criteria': {},
            'final_percent': None,
            'extra_data': {},  # Additional fields for CRM data
        }
        
        for col_idx, key in enumerate(system_keys):
            if pd.isna(key):
                continue
            
            key_str = str(key).lower().strip()
            
            # Check meta fields by system key
            if key_str in self.META_KEYS:
                field_name = self.META_KEYS[key_str]
                mapping['meta'][field_name] = col_idx
            
            # Check extra data fields (CRM data, contact info, etc.)
            if key_str in self.EXTRA_DATA_KEYS:
                field_name = self.EXTRA_DATA_KEYS[key_str]
                mapping['extra_data'][field_name] = col_idx
            
            # Check for score/reason/quote columns
            # Format: score_0, reason_0, quote_0, score_1, etc.
            score_match = re.match(r'^score_(\d+)$', key_str)
            if score_match:
                criteria_idx = int(score_match.group(1))
                if criteria_idx not in mapping['criteria']:
                    mapping['criteria'][criteria_idx] = {'score': None, 'reason': None, 'quote': None}
                mapping['criteria'][criteria_idx]['score'] = col_idx
            
            reason_match = re.match(r'^reason_(\d+)$', key_str)
            if reason_match:
                criteria_idx = int(reason_match.group(1))
                if criteria_idx not in mapping['criteria']:
                    mapping['criteria'][criteria_idx] = {'score': None, 'reason': None, 'quote': None}
                mapping['criteria'][criteria_idx]['reason'] = col_idx
            
            quote_match = re.match(r'^quote_(\d+)$', key_str)
            if quote_match:
                criteria_idx = int(quote_match.group(1))
                if criteria_idx not in mapping['criteria']:
                    mapping['criteria'][criteria_idx] = {'score': None, 'reason': None, 'quote': None}
                mapping['criteria'][criteria_idx]['quote'] = col_idx
            
            # Check for final percent (key_13 or similar)
            if key_str == 'key_13':
                mapping['final_percent'] = col_idx
        
        # Also check human headers for final percent if not found
        if mapping['final_percent'] is None:
            for col_idx, header in enumerate(human_headers):
                if pd.isna(header):
                    continue
                header_str = str(header).lower()
                # Check multiple possible names for final percent column
                if any(x in header_str for x in ['итоговый процент', 'final average', 'final percent', 'итоговый балл']):
                    mapping['final_percent'] = col_idx
                    break
        
        return mapping
    
    def _parse_call_row(
        self, 
        row: pd.Series, 
        column_map: Dict,
    ) -> Optional[ParsedCall]:
        """Parse a single call row"""
        meta = column_map['meta']
        
        # External ID (required)
        external_id = None
        if 'external_id' in meta:
            val = row.iloc[meta['external_id']]
            if pd.notna(val):
                external_id = str(val).strip()
        
        if not external_id:
            return None  # Skip rows without ID
        
        # Manager ID
        manager_external_id = ""
        if 'manager_id' in meta:
            val = row.iloc[meta['manager_id']]
            if pd.notna(val):
                manager_external_id = str(int(float(val)) if isinstance(val, (int, float)) else val).strip()
        
        # Manager name
        manager_name = "Unknown"
        if 'manager_name' in meta:
            val = row.iloc[meta['manager_name']]
            if pd.notna(val):
                manager_name = str(val).strip()
        
        # Use manager name as ID if no ID provided
        if not manager_external_id:
            manager_external_id = manager_name
        
        # Call date
        call_date = None
        if 'call_date' in meta:
            val = row.iloc[meta['call_date']]
            if pd.notna(val):
                if isinstance(val, datetime):
                    call_date = val
                else:
                    try:
                        call_date = pd.to_datetime(val)
                    except:
                        pass
        
        # Call week
        call_week = None
        if 'call_week' in meta:
            val = row.iloc[meta['call_week']]
            if pd.notna(val):
                call_week = str(val).strip()
        
        # Duration (convert to seconds if in minutes)
        duration_seconds = 0
        if 'duration' in meta:
            val = row.iloc[meta['duration']]
            if pd.notna(val):
                try:
                    duration_val = float(val)
                    # If duration is in minutes (typical), convert to seconds
                    if duration_val < 1000:  # Assume minutes if < 1000
                        duration_seconds = int(duration_val * 60)
                    else:
                        duration_seconds = int(duration_val)
                except:
                    pass
        
        # Final percent
        final_percent = 0.0
        if column_map['final_percent'] is not None:
            val = row.iloc[column_map['final_percent']]
            if pd.notna(val):
                try:
                    if isinstance(val, str) and '%' in val:
                        final_percent = float(val.replace('%', '').strip())
                    else:
                        final_percent = float(val)
                        # If value is between 0 and 1, convert to percentage
                        if 0 <= final_percent <= 1:
                            final_percent *= 100
                except:
                    pass
        
        # Parse scores
        scores: List[ParsedCallScore] = []
        for criteria_idx, cols in column_map['criteria'].items():
            score_val = None
            reason_val = None
            quote_val = None
            
            if cols['score'] is not None:
                val = row.iloc[cols['score']]
                if pd.notna(val):
                    score_val = str(val).strip()
            
            if cols['reason'] is not None:
                val = row.iloc[cols['reason']]
                if pd.notna(val):
                    reason_val = str(val).strip()
            
            if cols['quote'] is not None:
                val = row.iloc[cols['quote']]
                if pd.notna(val):
                    quote_val = str(val).strip()
            
            if score_val or reason_val or quote_val:
                # criteria_idx is 0-based from score_0, but criteria numbers start from 1
                scores.append(ParsedCallScore(
                    criteria_number=criteria_idx + 1,
                    score=score_val,
                    reason=reason_val,
                    quote=quote_val,
                ))
        
        # Extract extra data (CRM info, contact info, etc.)
        extra_data = {}
        for field_name, col_idx in column_map.get('extra_data', {}).items():
            val = row.iloc[col_idx]
            if pd.notna(val):
                # Convert value to appropriate type
                if isinstance(val, datetime):
                    extra_data[field_name] = val.isoformat()
                elif isinstance(val, (int, float)):
                    extra_data[field_name] = val
                else:
                    extra_data[field_name] = str(val).strip()
        
        return ParsedCall(
            external_id=external_id,
            manager_external_id=manager_external_id,
            manager_name=manager_name,
            call_date=call_date,
            call_week=call_week,
            duration_seconds=duration_seconds,
            final_percent=final_percent,
            scores=scores,
            metadata=extra_data,  # Store extra data in metadata field
        )
    
    def parse(self) -> Tuple[List[ParsedCriteriaGroup], List[ParsedCriteria], List[ParsedCall], List[ParsedManager]]:
        """Parse entire Excel file"""
        groups, criteria = self.parse_criteria_sheet()
        calls, managers = self.parse_ai_sheet(criteria)
        return groups, criteria, calls, managers


# Utility function
def parse_excel_file(file_path: str) -> Tuple[List[ParsedCriteriaGroup], List[ParsedCriteria], List[ParsedCall], List[ParsedManager]]:
    """Parse Excel file and return parsed data"""
    parser = ExcelParser(file_path)
    return parser.parse()
