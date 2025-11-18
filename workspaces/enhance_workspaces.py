#!/usr/bin/env python3
"""
Batch enhance workspace files with launch configs and tasks
"""
import json
import sys
from pathlib import Path

# Workspaces that need enhancement
WORKSPACES_TO_ENHANCE = [
    "TFMarket.code-workspace",
    "TerraFusion-OS-Platform-2.0.code-workspace",
    "adk.code-workspace",
    "agent-interfaces.code-workspace",
    "dashboards.code-workspace",
    "design-system.code-workspace",
    "development.code-workspace",
    "government-apps.code-workspace",
    "government-core.code-workspace",
    "government-edition.code-workspace",
    "infrastructure.code-workspace",
    "monitoring.code-workspace",
    "native-shell.code-workspace",
    "pacs-server-benton.code-workspace",
    "performance.code-workspace",
    "portal.code-workspace",
    "research-development.code-workspace",
    "security.code-workspace",
    "terra-fusion-sync.code-workspace",
    "terra-levy.code-workspace",
    "terrafusion-browser.code-workspace"
]

def strip_comments(jsonc):
    """Remove // comments safely (preserve in URLs)"""
    result = []
    in_string = False
    escape_next = False
    i = 0

    while i < len(jsonc):
        char = jsonc[i]

        if escape_next:
            result.append(char)
            escape_next = False
            i += 1
            continue

        if char == '\\' and in_string:
            result.append(char)
            escape_next = True
            i += 1
            continue

        if char == '"':
            in_string = not in_string
            result.append(char)
            i += 1
            continue

        if not in_string and char == '/' and i + 1 < len(jsonc) and jsonc[i + 1] == '/':
            # Skip to end of line
            while i < len(jsonc) and jsonc[i] not in '\r\n':
                i += 1
            continue

        result.append(char)
        i += 1

    return ''.join(result)

def load_workspace(path):
    """Load workspace JSON, handling comments and BOM"""
    content = path.read_text(encoding='utf-8')
    content = content.lstrip('\ufeff').strip()
    content = strip_comments(content)
    return json.loads(content)

def has_launch_and_tasks(ws):
    """Check if workspace already has launch configs and tasks"""
    return 'launch' in ws and 'tasks' in ws

def add_generic_launch_tasks(ws, workspace_name):
    """Add generic launch configs and tasks based on workspace folders"""

    # Add launch configs if missing
    if 'launch' not in ws:
        ws['launch'] = {
            "version": "0.2.0",
            "configurations": [
                {
                    "name": f"Debug {workspace_name}",
                    "type": "node",
                    "request": "launch",
                    "program": "${file}",
                    "console": "integratedTerminal"
                }
            ]
        }

    # Add tasks if missing
    if 'tasks' not in ws:
        ws['tasks'] = {
            "version": "2.0.0",
            "tasks": [
                {
                    "label": f"Build {workspace_name}",
                    "type": "shell",
                    "command": "echo 'Build task for ${workspaceFolder}'",
                    "problemMatcher": [],
                    "group": {
                        "kind": "build",
                        "isDefault": True
                    }
                },
                {
                    "label": f"Test {workspace_name}",
                    "type": "shell",
                    "command": "echo 'Test task for ${workspaceFolder}'",
                    "problemMatcher": [],
                    "group": {
                        "kind": "test",
                        "isDefault": True
                    }
                }
            ]
        }

    return ws

def enhance_workspace(workspace_file):
    """Enhance a single workspace file"""
    workspace_path = Path(__file__).parent / workspace_file

    if not workspace_path.exists():
        print(f"❌ {workspace_file} - NOT FOUND")
        return False

    try:
        ws = load_workspace(workspace_path)

        if has_launch_and_tasks(ws):
            print(f"✅ {workspace_file} - Already has launch & tasks")
            return True

        # Enhance workspace
        workspace_name = workspace_file.replace('.code-workspace', '').replace('-', ' ').title()
        ws = add_generic_launch_tasks(ws, workspace_name)

        # Write back (pretty formatted)
        workspace_path.write_text(json.dumps(ws, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

        print(f"✅ {workspace_file} - Enhanced with launch & tasks")
        return True

    except Exception as e:
        print(f"❌ {workspace_file} - ERROR: {e}")
        return False

def main():
    """Main enhancement routine"""
    print("=" * 80)
    print("TerraFusion Workspace Enhancement - Batch Processing")
    print("=" * 80)

    enhanced = 0
    failed = 0
    skipped = 0

    for workspace_file in WORKSPACES_TO_ENHANCE:
        result = enhance_workspace(workspace_file)
        if result is True:
            enhanced += 1
        elif result is False:
            failed += 1

    print("=" * 80)
    print(f"📊 ENHANCEMENT SUMMARY")
    print(f"✅ Enhanced: {enhanced}")
    print(f"❌ Failed: {failed}")
    print(f"📝 Total: {len(WORKSPACES_TO_ENHANCE)}")
    print("=" * 80)

    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
