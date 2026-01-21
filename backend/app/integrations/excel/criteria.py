"""
Criteria Sheet Parser - parses criteria definitions from Excel
"""
import re
from typing import Optional, List
import pandas as pd

from app.integrations.excel.schemas import (
    CriteriaGroupData,
    CriteriaData,
    ParsedCriteria,
)


class CriteriaSheetParser:
    """
    Parser for Criteria sheet from Excel files.
    
    Expected sheet structure:
    | Этап | Номер | Название критерия | Prompt | Оценка 100% |
    
    - First column (Этап) contains group names (e.g., "Установление контакта")
    - Second column (Номер) contains criteria number (1, 2, 3, ...)
    - Third column (Название) contains criteria name
    - Fourth column (Prompt) contains AI prompt for evaluation
    - Fifth column (Оценка 100%) contains "Да" if criteria counts in final score
    """
    
    def parse(self, file_path: str) -> ParsedCriteria:
        """
        Parse Criteria sheet from Excel file.
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            ParsedCriteria with groups and criteria list
            
        Raises:
            ValueError: If Criteria sheet is not found
        """
        sheet_name = self._find_criteria_sheet(file_path)
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        
        groups: List[CriteriaGroupData] = []
        criteria: List[CriteriaData] = []
        current_group: Optional[CriteriaGroupData] = None
        criteria_order = 0
        
        # Skip header rows (find first row with data)
        start_row = self._find_data_start_row(df)
        
        for idx in range(start_row, len(df)):
            row = df.iloc[idx]
            
            # Check if this row defines a group (first column has value, second is empty)
            first_col = self._clean_value(row.iloc[0]) if len(row) > 0 else None
            second_col = row.iloc[1] if len(row) > 1 else None
            
            if first_col and pd.isna(second_col):
                # This is a group row
                current_group = CriteriaGroupData(
                    name=first_col,
                    order=len(groups)
                )
                groups.append(current_group)
                continue
            
            # Check if this row defines a criteria (has number in second column)
            if pd.notna(second_col):
                try:
                    criteria_number = int(second_col)
                except (ValueError, TypeError):
                    continue
                
                # Extract criteria data
                name = self._clean_value(row.iloc[2]) if len(row) > 2 else ""
                prompt = self._clean_value(row.iloc[3]) if len(row) > 3 else None
                in_final = self._parse_in_final_score(row.iloc[4]) if len(row) > 4 else True
                
                if not name:
                    continue
                
                criteria.append(CriteriaData(
                    group_name=current_group.name if current_group else "Без группы",
                    number=criteria_number,
                    name=name,
                    prompt=prompt,
                    in_final_score=in_final,
                    order=criteria_order
                ))
                criteria_order += 1
        
        return ParsedCriteria(groups=groups, criteria=criteria)
    
    def _find_criteria_sheet(self, file_path: str) -> str:
        """
        Find the Criteria sheet in Excel file.
        Sheet name can vary: "Criteria", "Criteria 10.12", "Критерии", etc.
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            Name of the Criteria sheet
            
        Raises:
            ValueError: If no Criteria sheet is found
        """
        xlsx = pd.ExcelFile(file_path)
        
        # Try to find by common names
        for sheet in xlsx.sheet_names:
            sheet_lower = sheet.lower().strip()
            if 'criteria' in sheet_lower or 'критери' in sheet_lower:
                return sheet
        
        raise ValueError(
            f"Criteria sheet not found. Available sheets: {xlsx.sheet_names}"
        )
    
    def _find_data_start_row(self, df: pd.DataFrame) -> int:
        """
        Find the row where actual data starts (skip headers).
        
        Args:
            df: DataFrame to analyze
            
        Returns:
            Index of first data row
        """
        for idx in range(min(10, len(df))):  # Check first 10 rows
            row = df.iloc[idx]
            
            # Check if second column has a number (criteria number)
            if len(row) > 1 and pd.notna(row.iloc[1]):
                try:
                    int(row.iloc[1])
                    return idx
                except (ValueError, TypeError):
                    pass
            
            # Check if first column has text that looks like a group name
            if len(row) > 0 and pd.notna(row.iloc[0]):
                val = str(row.iloc[0]).strip().lower()
                # Skip header keywords
                if val not in ['этап', 'группа', 'номер', 'название', 'prompt', 'stage', 'group']:
                    return idx
        
        return 0
    
    def _clean_value(self, value) -> Optional[str]:
        """Clean and normalize a cell value."""
        if pd.isna(value):
            return None
        
        cleaned = str(value).strip()
        if not cleaned:
            return None
        
        return cleaned
    
    def _parse_in_final_score(self, value) -> bool:
        """Parse the 'in final score' column value."""
        if pd.isna(value):
            return True  # Default to included
        
        val_str = str(value).strip().lower()
        
        # Check for explicit "yes" values
        yes_values = ['да', 'yes', 'true', '1', '+', 'включено', 'включить']
        if val_str in yes_values:
            return True
        
        # Check for explicit "no" values
        no_values = ['нет', 'no', 'false', '0', '-', 'исключено', 'исключить']
        if val_str in no_values:
            return False
        
        # Default to included
        return True
