#!/usr/bin/env python3
"""
TerraFusion OS - Workspace Validation Script
Validates all .code-workspace files for JSON syntax and path existence
"""

import json
import os
import sys
from pathlib import Path
from typing import List, Tuple, Dict

def _strip_line_comments_safely(jsonc: str) -> str:
    """Remove // comments only when not inside JSON strings."""
    result = []
    in_string = False
    escape = False
    i = 0
    length = len(jsonc)
    while i < length:
        ch = jsonc[i]
        nxt = jsonc[i + 1] if i + 1 < length else ''

        if in_string:
            result.append(ch)
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_string = False
            i += 1
            continue

        # Not in string: detect // line comment
        if ch == '"':
            in_string = True
            result.append(ch)
            i += 1
            continue
        if ch == '/' and nxt == '/':
            # skip until end of line
            while i < length and jsonc[i] != '\n':
                i += 1
            continue
        result.append(ch)
        i += 1
    return ''.join(result)

def validate_json_syntax(file_path: Path) -> Tuple[bool, str]:
    """Validate JSON syntax of a workspace file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Remove potential UTF-8 BOM and strip line comments safely
            if content and content[0] == '\ufeff':
                content = content.lstrip('\ufeff')
            clean_content = _strip_line_comments_safely(content).strip()

        json.loads(clean_content)
        return True, "✅ Valid JSON"
    except json.JSONDecodeError as e:
        return False, f"❌ JSON Error: {e}"
    except Exception as e:
        return False, f"❌ Read Error: {e}"

def validate_paths(workspace_path: Path) -> List[Tuple[str, bool, str]]:
    """Validate that all folder paths in workspace file exist."""
    try:
        with open(workspace_path, 'r', encoding='utf-8') as f:
            raw = f.read()
            clean = _strip_line_comments_safely(raw)
            data = json.loads(clean)

        folders = data.get('folders', [])
        results = []

        for folder in folders:
            path = folder.get('path', '')
            if path:
                # Resolve relative path from workspace directory
                resolved_path = workspace_path.parent / path
                exists = resolved_path.exists()
                status = "✅ Exists" if exists else "❌ Missing"
                results.append((path, exists, status))

        return results
    except Exception as e:
        return [("ERROR", False, f"❌ Cannot read workspace: {e}")]

def main():
    """Main validation function."""
    workspaces_dir = Path(__file__).parent
    workspace_files = list(workspaces_dir.glob("*.code-workspace"))

    print(f"🔍 TerraFusion Workspace Validation")
    print(f"📁 Found {len(workspace_files)} workspace files")
    print("=" * 80)

    total_files = len(workspace_files)
    valid_files = 0
    issues_found = []

    for workspace_file in sorted(workspace_files):
        print(f"\n🔧 Validating: {workspace_file.name}")

        # Check JSON syntax
        json_valid, json_msg = validate_json_syntax(workspace_file)
        print(f"   JSON Syntax: {json_msg}")

        if json_valid:
            valid_files += 1

            # Check paths
            path_results = validate_paths(workspace_file)
            missing_paths = [p for p, exists, _ in path_results if not exists]

            if missing_paths:
                print(f"   📂 Paths: ❌ {len(missing_paths)} missing paths")
                for path, _, status in path_results:
                    if not path.startswith("ERROR"):
                        print(f"      {path}: {status}")
                issues_found.append(f"{workspace_file.name}: {len(missing_paths)} missing paths")
            else:
                print(f"   📂 Paths: ✅ All paths exist")
        else:
            issues_found.append(f"{workspace_file.name}: JSON syntax error")

    print("\n" + "=" * 80)
    print(f"📊 VALIDATION SUMMARY")
    print(f"✅ Valid JSON files: {valid_files}/{total_files}")
    print(f"❌ Issues found: {len(issues_found)}")

    if issues_found:
        print("\n🚨 ISSUES TO FIX:")
        for issue in issues_found[:10]:  # Limit output
            print(f"   • {issue}")
        if len(issues_found) > 10:
            print(f"   ... and {len(issues_found) - 10} more issues")
        return 1
    else:
        print("\n🎉 ALL WORKSPACE FILES VALID!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
