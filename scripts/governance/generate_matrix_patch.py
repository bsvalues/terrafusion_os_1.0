import json
import os
import re
from datetime import datetime, timezone

# Configuration
SOURCE_DOC = "docs/reports/Benton_County_2026_Residential_Market_Calibration.md"
PATCH_DIR = "patches/res_depre_matrix/2026"
JSON_OUT = os.path.join(PATCH_DIR, "benton.table2.patch.json")
SQL_OUT = os.path.join(PATCH_DIR, "benton.table2.patch.sql")
DIFF_OUT = os.path.join(PATCH_DIR, "benton.table2.patch.diff.md")

os.makedirs(PATCH_DIR, exist_ok=True)

def parse_markdown_table(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find Table 2 using headers
    lines = content.split('\n')
    start_idx = -1
    for i, line in enumerate(lines):
        if "| matrix | segment | axis | cell | current | suggested | delta |" in line:
            start_idx = i
            break
            
    if start_idx == -1:
         # Fallback search without pipes at ends if typical markdown formatter stripped them
         for i, line in enumerate(lines):
            if "matrix" in line and "segment" in line and "current" in line and "suggested" in line:
                start_idx = i
                break

    if start_idx == -1:
        raise ValueError("Table 2 headers not found in source document")

    changes = []
    
    # Iterate from header
    for i in range(start_idx + 1, len(lines)):
        row = lines[i].strip()
        if not row:
            break # End of table
            
        if "---" in row:
            continue
            
        parts = [p.strip() for p in row.split('|') if p.strip()]
        
        # Ensure we have enough columns (7)
        if len(parts) < 7:
            continue
            
        # Parse row
        # matrix | segment | axis | cell | current | suggested | delta
        try:
            current_val = float(parts[4])
            suggested_val = float(parts[5])
            delta_val = float(parts[6])
        except ValueError:
            continue # parsing error

        change = {
            "key": {
                "matrix": parts[0],
                "segment": parts[1],
                "axis": parts[2],
                "cell": parts[3] # age
            },
            "old": { "depr_factor": current_val },
            "new": { "depr_factor": suggested_val },
            "metrics": {
                "divergence": delta_val,
                "flag_reason": "MAP_Flags_Top divergence"
            }
        }
        changes.append(change)
        
    return changes

def generate_json_patch(changes):
    patch = {
        "matrix": "RES_depre_matrix",
        "county": "Benton",
        "taxYear": 2026,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "doc": SOURCE_DOC,
            "table": "Table 2"
        },
        "changes": changes
    }
    
    with open(JSON_OUT, 'w', encoding='utf-8') as f:
        json.dump(patch, f, indent=2)
    print(f"Generated JSON patch: {JSON_OUT}")

def generate_sql_patch(changes):
    sql_lines = []
    sql_lines.append(f"-- Patch generated from {SOURCE_DOC}")
    sql_lines.append(f"-- Generated at: {datetime.now(timezone.utc).isoformat()}")
    sql_lines.append("BEGIN TRANSACTION;")
    sql_lines.append("")
    
    update_count = 0
    
    for change in changes:
        key = change['key']
        old_val = change['old']['depr_factor']
        new_val = change['new']['depr_factor']
        
        sql = f"""
UPDATE RES_depre_matrix 
SET factor = {new_val}, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = '{key['segment']}' 
  AND axis_type = '{key['axis']}' 
  AND axis_value = '{key['cell']}'
  AND factor = {old_val}; -- Optimistic concurrency check
"""
        sql_lines.append(sql.strip())
        update_count += 1

    sql_lines.append("")
    # SQL logic for counting rows depends on Dialect, here assuming standard/Postgres-like structure for now
    # Note: If multiple updates run, getting total row count might need accumulation. 
    # For a patch script, simple individual updates are often safer.
    
    sql_lines.append("COMMIT;")
    
    with open(SQL_OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    print(f"Generated SQL patch: {SQL_OUT}")

def generate_diff_md(changes):
    lines = []
    lines.append("# Matrix Patch Review: RES_depre_matrix (2026)")
    lines.append(f"**Source:** `{SOURCE_DOC}`")
    lines.append(f"**Generated:** {datetime.now(timezone.utc).isoformat()}")
    lines.append("")
    lines.append("| Segment | Age | Current | Suggested | Change |")
    lines.append("| :--- | :--- | :--- | :--- | :--- |")
    
    for change in changes:
        key = change['key']
        old_v = change['old']['depr_factor']
        new_v = change['new']['depr_factor']
        delta = change['metrics']['divergence']
        
        lines.append(f"| {key['segment']} | {key['cell']} | {old_v} | {new_v} | {delta} |")
        
    with open(DIFF_OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Generated Diff markdown: {DIFF_OUT}")

def main():
    try:
        changes = parse_markdown_table(SOURCE_DOC)
        generate_json_patch(changes)
        generate_sql_patch(changes)
        generate_diff_md(changes)
        print("Patch generation complete.")
    except Exception as e:
        print(f"Error: {e}")
        exit(1)

if __name__ == "__main__":
    main()
