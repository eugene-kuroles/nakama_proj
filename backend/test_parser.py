# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.integrations.excel.parser import parse_excel_file

excel_path = "../Docs/TEST ПРОМТ 3 Spellit Отчет 4_ Госники (от 26.09.25).xlsx"

print("Parsing Excel file...")
groups, criteria, calls, managers = parse_excel_file(excel_path)

print(f"\n=== GROUPS ({len(groups)}) ===")
for g in groups[:5]:
    print(f"  {g.order}: {g.name}")

print(f"\n=== CRITERIA ({len(criteria)}) ===")
for c in criteria[:5]:
    print(f"  {c.number}. {c.name} (group: {c.group_name})")

print(f"\n=== MANAGERS ({len(managers)}) ===")
for m in managers:
    print(f"  ID: {m.external_id} | Name: {m.name}")

print(f"\n=== CALLS ({len(calls)}) ===")
for call in calls[:3]:
    print(f"  ID: {call.external_id}")
    print(f"    Manager: {call.manager_name} (ID: {call.manager_external_id})")
    print(f"    Date: {call.call_date}")
    print(f"    Duration: {call.duration_seconds}s")
    print(f"    Final %: {call.final_percent}")
    print(f"    Scores: {len(call.scores)}")
    print()
