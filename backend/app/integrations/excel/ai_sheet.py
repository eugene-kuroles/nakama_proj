"""
AI Sheet Parser - parses call data and scores from Excel
"""
import re
from typing import Optional, List, Dict, Any
import pandas as pd

from app.integrations.excel.schemas import (
    ParsedCall,
    CallScoreData,
    ColumnMapping,
    CriteriaData,
)


class AISheetParser:
    """
    Parser for AI sheet from Excel files.
    
    Expected sheet structure:
    - Row 0: System keys (number, call_name, transcription, ...)
    - Row 1: Criteria groups (for visual grouping)
    - Row 2: Human-readable column headers
    - Row 3+: Call data
    
    Criteria columns have format:
    - "{N} {Name}" - score column
    - "{N} ... Reason" - reason column  
    - "{N} ... Quote" - quote column
    """
    
    # Meta column keywords mapping
    META_KEYWORDS = {
        'дата звонка': 'call_date',
        'call_date': 'call_date',
        'дата': 'call_date',
        'date': 'call_date',
        'менеджер': 'manager_name',
        'фио менеджера': 'manager_name',
        'manager': 'manager_name',
        'manager_name': 'manager_name',
        'длительность': 'duration',
        'duration': 'duration',
        'id звонка': 'call_id',
        'call_id': 'call_id',
        'неделя': 'call_week',
        'week': 'call_week',
        'клиент': 'client_name',
        'client': 'client_name',
        'номер звонка': 'call_number',
        'number': 'call_number',
        'транскрипция': 'transcription',
        'transcription': 'transcription',
    }
    
    def parse(
        self, 
        file_path: str, 
        criteria: Optional[List[CriteriaData]] = None
    ) -> List[ParsedCall]:
        """
        Parse AI sheet with call data.
        
        Args:
            file_path: Path to Excel file
            criteria: Optional list of criteria for validation
            
        Returns:
            List of parsed calls with scores
        """
        sheet_name = self._find_ai_sheet(file_path)
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        
        # Detect structure
        header_row = self._find_header_row(df)
        headers = df.iloc[header_row].tolist()
        
        # Build column mapping
        column_mapping = self._build_column_mapping(headers, criteria)
        
        # Parse calls
        calls: List[ParsedCall] = []
        data_start_row = header_row + 1
        
        for idx in range(data_start_row, len(df)):
            row = df.iloc[idx]
            
            # Skip empty rows
            if self._is_empty_row(row):
                continue
            
            call = self._parse_call_row(row, column_mapping)
            if call:
                calls.append(call)
        
        return calls
    
    def _find_ai_sheet(self, file_path: str) -> str:
        """Find the AI sheet in Excel file."""
        xlsx = pd.ExcelFile(file_path)
        
        for sheet in xlsx.sheet_names:
            sheet_lower = sheet.lower().strip()
            if sheet_lower == 'ai' or sheet_lower.startswith('ai '):
                return sheet
        
        # If no AI sheet, try to find data sheet
        for sheet in xlsx.sheet_names:
            sheet_lower = sheet.lower().strip()
            if 'data' in sheet_lower or 'звонки' in sheet_lower or 'calls' in sheet_lower:
                return sheet
        
        raise ValueError(
            f"AI/Data sheet not found. Available sheets: {xlsx.sheet_names}"
        )
    
    def _find_header_row(self, df: pd.DataFrame) -> int:
        """
        Find the row with column headers.
        Usually row 2 (0-indexed) in the standard format.
        """
        # Check rows 0-5 for header patterns
        for idx in range(min(6, len(df))):
            row = df.iloc[idx]
            row_text = ' '.join(str(v).lower() for v in row if pd.notna(v))
            
            # Look for keywords that indicate this is a header row
            header_keywords = ['дата', 'менеджер', 'date', 'manager', 'звонок', 'call']
            matches = sum(1 for kw in header_keywords if kw in row_text)
            
            if matches >= 2:
                return idx
        
        # Default to row 2 (standard format)
        return 2
    
    def _build_column_mapping(
        self, 
        headers: List, 
        criteria: Optional[List[CriteriaData]] = None
    ) -> ColumnMapping:
        """
        Build mapping of columns to data fields.
        
        Args:
            headers: List of column headers
            criteria: Optional criteria list for validation
            
        Returns:
            ColumnMapping with meta, criteria, and formula columns
        """
        mapping = ColumnMapping()
        
        for col_idx, header in enumerate(headers):
            if not header or pd.isna(header):
                continue
            
            header_str = str(header).strip()
            header_lower = header_str.lower()
            
            # Check for meta columns
            matched_meta = False
            for keyword, field in self.META_KEYWORDS.items():
                if keyword in header_lower:
                    mapping.meta_columns[col_idx] = field
                    matched_meta = True
                    break
            
            if matched_meta:
                continue
            
            # Check for criteria columns (start with number)
            match = re.match(r'^(\d+)[\s\.\)]', header_str)
            if match:
                criteria_num = int(match.group(1))
                
                # Determine column type: score, reason, or quote
                if 'reason' in header_lower or 'причина' in header_lower or 'обоснование' in header_lower:
                    mapping.add_reason_column(criteria_num, col_idx)
                elif 'quote' in header_lower or 'цитата' in header_lower or 'выдержка' in header_lower:
                    mapping.add_quote_column(criteria_num, col_idx)
                else:
                    mapping.add_score_column(criteria_num, col_idx)
                continue
            
            # Check for formula/final columns
            if 'final' in header_lower or 'итог' in header_lower or 'average' in header_lower or 'среднее' in header_lower:
                mapping.formula_columns[col_idx] = header_str
        
        return mapping
    
    def _parse_call_row(
        self, 
        row: pd.Series, 
        mapping: ColumnMapping
    ) -> Optional[ParsedCall]:
        """
        Parse a single row of call data.
        
        Args:
            row: DataFrame row
            mapping: Column mapping
            
        Returns:
            ParsedCall or None if row is invalid
        """
        # Extract metadata
        metadata: Dict[str, Any] = {}
        for col_idx, field in mapping.meta_columns.items():
            if col_idx < len(row):
                value = row.iloc[col_idx]
                if pd.notna(value):
                    # Convert datetime objects to string
                    if hasattr(value, 'isoformat'):
                        metadata[field] = value.isoformat()
                    else:
                        metadata[field] = value
        
        # Extract criteria scores
        scores: List[CallScoreData] = []
        for criteria_num, columns in sorted(mapping.criteria_columns.items()):
            score_col, reason_col, quote_col = columns
            
            score_value = None
            reason_value = None
            quote_value = None
            
            if score_col is not None and score_col < len(row):
                score_value = self._parse_score(row.iloc[score_col])
            
            if reason_col is not None and reason_col < len(row):
                val = row.iloc[reason_col]
                if pd.notna(val):
                    reason_value = str(val).strip()
            
            if quote_col is not None and quote_col < len(row):
                val = row.iloc[quote_col]
                if pd.notna(val):
                    quote_value = str(val).strip()
            
            # Only add if we have at least a score
            if score_value is not None or reason_value or quote_value:
                scores.append(CallScoreData(
                    criteria_number=criteria_num,
                    score=score_value,
                    reason=reason_value,
                    quote=quote_value
                ))
        
        # Extract final percent
        final_percent = None
        for col_idx, name in mapping.formula_columns.items():
            if 'final' in name.lower() or 'итог' in name.lower():
                if col_idx < len(row):
                    value = row.iloc[col_idx]
                    if pd.notna(value):
                        try:
                            final_percent = float(value)
                            # Convert from 0-1 to 0-100 if needed
                            if final_percent <= 1.0:
                                final_percent *= 100
                        except (ValueError, TypeError):
                            pass
                break
        
        # Validate: must have at least some data
        if not metadata and not scores:
            return None
        
        return ParsedCall(
            metadata=metadata,
            scores=scores,
            final_percent=final_percent
        )
    
    def _parse_score(self, value) -> Optional[str]:
        """
        Parse score value from Excel cell.
        
        Scores can be:
        - Numeric: 0, 1, 2, 3, 4, 5
        - Tags: "Да", "Нет", "N/A"
        - Percentages: 80%, 0.8
        """
        if pd.isna(value):
            return None
        
        # Handle numeric values
        if isinstance(value, (int, float)):
            # Check if it's a percentage (0-1)
            if 0 <= value <= 1 and value != 0 and value != 1:
                return str(int(value * 100))
            return str(int(value)) if value == int(value) else str(value)
        
        # Handle string values
        value_str = str(value).strip()
        if not value_str or value_str.lower() in ['nan', 'none', '']:
            return None
        
        # Handle percentage strings
        if value_str.endswith('%'):
            try:
                num = float(value_str[:-1])
                return str(int(num))
            except ValueError:
                pass
        
        return value_str
    
    def _is_empty_row(self, row: pd.Series) -> bool:
        """Check if a row is empty (all NaN or empty strings)."""
        for val in row:
            if pd.notna(val):
                if isinstance(val, str) and not val.strip():
                    continue
                return False
        return True
