# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
import glob
import os

# Find Excel file
excel_files = glob.glob('../Docs/*.xlsx')
print(f"Found Excel files: {excel_files}")

# Use first xlsx file that contains 'Госники'
excel_path = None
for f in excel_files:
    if 'Госники' in f or 'госники' in f.lower():
        excel_path = f
        break

if not excel_path:
    excel_path = excel_files[0] if excel_files else None

print(f"\nUsing: {excel_path}")

# Load Excel
df = pd.read_excel(excel_path, sheet_name='AI', header=None)

print(f"\nTotal columns: {df.shape[1]}")
print(f"Total rows: {df.shape[0]}")

# Show last 20 columns (for FINAL percent)
print("\n=== Last 20 columns structure ===")
for col_idx in range(max(0, df.shape[1] - 20), df.shape[1]):
    # Calculate Excel column letter
    if col_idx < 26:
        col_letter = chr(65 + col_idx)
    else:
        col_letter = chr(64 + col_idx // 26) + chr(65 + col_idx % 26)
    
    key = df.iloc[0, col_idx]
    group = df.iloc[1, col_idx]
    header = df.iloc[2, col_idx]
    sample = df.iloc[4, col_idx] if df.shape[0] > 4 else None  # Row 4 = first data row
    
    if 'final' in str(key).lower() or 'final' in str(header).lower() or 'average' in str(header).lower():
        print(f"*** FINAL/AVERAGE FOUND ***")
    
    print(f"Col {col_idx} ({col_letter}): key='{key}' | header='{header}' | sample='{sample}'")

# Show sample data from manager columns and final percent
print("\n=== Sample data (rows 4-8) ===")
manager_id_col = 32  # AG - user_id
manager_name_col = 33  # AH - user_name

print("Row | user_id | user_name")
for row_idx in range(4, min(9, df.shape[0])):
    user_id = df.iloc[row_idx, manager_id_col]
    user_name = df.iloc[row_idx, manager_name_col]
    print(f"{row_idx} | {user_id} | {user_name}")
