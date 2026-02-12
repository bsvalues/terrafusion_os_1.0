#!/usr/bin/env python3
"""
TerraFusion OS - JSON Syntax Fixer for Workspace Files
Automatically fixes common JSON syntax issues in .code-workspace files
"""

import json
import re
import os
from pathlib import Path
from typing import List

def fix_json_syntax(content: str) -> str:
    """Fix common JSON syntax issues in workspace files."""
    # Remove trailing commas before closing braces or brackets
    content = re.sub(r',(\s*[}\]])', r'\1', content)

    # Fix invalid control characters by replacing them with spaces
    content = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', content)

    # Remove any double commas
    content = re.sub(r',,+', ',', content)

    return content

def fix_workspace_file(file_path: Path) -> bool:
    """Fix a single workspace file and return success status."""
    try:
        print(f"Fixing: {file_path.name}")

        # Read the original file
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # Apply fixes
        fixed_content = fix_json_syntax(original_content)

        # Validate the result
        try:
            json.loads(fixed_content)

            # Write the fixed content back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)

            print(f"  ✅ Fixed successfully")
            return True

        except json.JSONDecodeError as e:
            print(f"  ❌ Still invalid after fixes: {e}")
            return False

    except Exception as e:
        print(f"  ❌ Error processing file: {e}")
        return False

def main():
    """Main function to fix all workspace files."""
    workspaces_dir = Path(__file__).parent
    workspace_files = list(workspaces_dir.glob("*.code-workspace"))

    print("🔧 TerraFusion Workspace JSON Syntax Fixer")
    print(f"📁 Found {len(workspace_files)} workspace files")
    print("=" * 60)

    fixed_count = 0
    failed_files = []

    for workspace_file in sorted(workspace_files):
        success = fix_workspace_file(workspace_file)
        if success:
            fixed_count += 1
        else:
            failed_files.append(workspace_file.name)

    print("\n" + "=" * 60)
    print(f"📊 FIXING SUMMARY")
    print(f"✅ Successfully fixed: {fixed_count}/{len(workspace_files)}")

    if failed_files:
        print(f"❌ Failed to fix: {len(failed_files)}")
        for file in failed_files[:5]:  # Limit output
            print(f"   • {file}")
        if len(failed_files) > 5:
            print(f"   ... and {len(failed_files) - 5} more")
    else:
        print("🎉 ALL WORKSPACE FILES FIXED!")

    return len(failed_files)

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
