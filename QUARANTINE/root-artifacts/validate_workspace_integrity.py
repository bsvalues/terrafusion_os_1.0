#!/usr/bin/env python3
"""
TerraFusion OS - Workspace Integrity Validator
Validates that all workspace configurations point to existing directories.
"""

import json
import os
import glob
from pathlib import Path
import sys

def validate_workspace_file(workspace_path):
    """Validate a single workspace file."""
    print(f"\n🔍 Validating: {workspace_path}")

    try:
        with open(workspace_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Remove comments from JSON
            lines = content.split('\n')
            clean_lines = []
            for line in lines:
                if '//' in line:
                    line = line[:line.index('//')]
                clean_lines.append(line)
            clean_content = '\n'.join(clean_lines)

        workspace_data = json.loads(clean_content)

        if 'folders' not in workspace_data:
            print(f"  ❌ No 'folders' section found")
            return False

        workspace_dir = Path(workspace_path).parent
        all_valid = True

        for folder in workspace_data['folders']:
            if 'path' not in folder:
                print(f"  ❌ Folder missing 'path': {folder}")
                all_valid = False
                continue

            folder_path = folder['path']
            folder_name = folder.get('name', 'Unnamed')

            # Resolve relative path
            if folder_path.startswith('../'):
                resolved_path = workspace_dir / folder_path
            elif folder_path.startswith('./'):
                resolved_path = workspace_dir / folder_path[2:]
            else:
                resolved_path = workspace_dir / folder_path

            resolved_path = resolved_path.resolve()

            if resolved_path.exists():
                print(f"  ✅ {folder_name}: {folder_path}")
            else:
                print(f"  ❌ {folder_name}: {folder_path} -> {resolved_path} (NOT FOUND)")
                all_valid = False

        return all_valid

    except json.JSONDecodeError as e:
        print(f"  ❌ JSON Parse Error: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Main validation function."""
    print("🏛️ TerraFusion OS - Workspace Integrity Validator")
    print("=" * 50)

    # Find all workspace files
    workspace_pattern = "/workspaces/terrafusion_os_1.0/workspaces/*.code-workspace"
    workspace_files = glob.glob(workspace_pattern)

    if not workspace_files:
        print("❌ No workspace files found!")
        return 1

    print(f"📁 Found {len(workspace_files)} workspace files")

    valid_count = 0
    invalid_count = 0

    for workspace_file in sorted(workspace_files):
        if validate_workspace_file(workspace_file):
            valid_count += 1
        else:
            invalid_count += 1

    print("\n" + "=" * 50)
    print(f"📊 SUMMARY:")
    print(f"  ✅ Valid workspaces: {valid_count}")
    print(f"  ❌ Invalid workspaces: {invalid_count}")
    print(f"  📈 Success rate: {valid_count/(valid_count+invalid_count)*100:.1f}%")

    if invalid_count == 0:
        print("\n🎉 ALL WORKSPACES ARE VALID!")
        print("Government. Transcended.")
        return 0
    else:
        print(f"\n⚠️  {invalid_count} workspaces need fixing")
        return 1

if __name__ == "__main__":
    sys.exit(main())
