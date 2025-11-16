#!/usr/bin/env python3
"""
Test TerraFusion OS workspace functionality and VS Code integration.
Validates multi-root workspace configurations and task coordination.
"""

import os
import json
import subprocess
from pathlib import Path

def main():
    workspace_root = Path("/workspaces/terrafusion_os_1.0")
    workspaces_dir = workspace_root / "workspaces"

    print("🧪 TerraFusion OS Workspace Integration Test")
    print("=" * 60)

    # Test 1: Core workspace files exist and are valid
    print("\n📋 Test 1: Core Workspace Validation")
    core_workspaces = [
        "master.code-workspace",
        "backend.code-workspace",
        "frontend.code-workspace",
        "government-core.code-workspace",
        "development.code-workspace"
    ]

    core_valid = 0
    for workspace in core_workspaces:
        workspace_path = workspaces_dir / workspace
        if workspace_path.exists():
            try:
                with open(workspace_path) as f:
                    data = json.load(f)
                print(f"✅ {workspace}: Valid JSON, {len(data.get('folders', []))} folders")
                core_valid += 1
            except Exception as e:
                print(f"❌ {workspace}: Error - {e}")
        else:
            print(f"❌ {workspace}: File not found")

    print(f"   Core workspaces valid: {core_valid}/{len(core_workspaces)}")

    # Test 2: Task definitions in key workspaces
    print(f"\n⚙️ Test 2: VS Code Task Integration")
    task_workspaces = ["backend.code-workspace", "development.code-workspace"]
    tasks_found = 0

    for workspace in task_workspaces:
        workspace_path = workspaces_dir / workspace
        try:
            with open(workspace_path) as f:
                data = json.load(f)

            tasks = data.get("tasks", {}).get("tasks", [])
            if tasks:
                print(f"✅ {workspace}: {len(tasks)} tasks defined")
                tasks_found += 1
                # Show sample task
                if tasks:
                    sample_task = tasks[0]
                    print(f"   Sample: '{sample_task.get('label', 'N/A')}'")
            else:
                print(f"⚠️  {workspace}: No tasks defined")

        except Exception as e:
            print(f"❌ {workspace}: Error reading tasks - {e}")

    # Test 3: Extension recommendations
    print(f"\n🔌 Test 3: VS Code Extension Recommendations")
    extension_workspaces = ["backend.code-workspace", "frontend.code-workspace"]
    extensions_found = 0

    for workspace in extension_workspaces:
        workspace_path = workspaces_dir / workspace
        try:
            with open(workspace_path) as f:
                data = json.load(f)

            extensions = data.get("extensions", {}).get("recommendations", [])
            if extensions:
                print(f"✅ {workspace}: {len(extensions)} extensions recommended")
                extensions_found += 1
            else:
                print(f"⚠️  {workspace}: No extension recommendations")

        except Exception as e:
            print(f"❌ {workspace}: Error reading extensions - {e}")

    # Test 4: Folder path validation for core workspaces
    print(f"\n📁 Test 4: Core Workspace Folder Access")
    folder_access = 0

    for workspace in core_workspaces[:3]:  # Test top 3
        workspace_path = workspaces_dir / workspace
        try:
            with open(workspace_path) as f:
                data = json.load(f)

            folders = data.get("folders", [])
            valid_folders = 0

            for folder in folders:
                folder_path = workspaces_dir / folder["path"]
                if folder_path.exists():
                    valid_folders += 1

            if valid_folders > 0:
                print(f"✅ {workspace}: {valid_folders}/{len(folders)} folders accessible")
                folder_access += 1
            else:
                print(f"❌ {workspace}: No accessible folders")

        except Exception as e:
            print(f"❌ {workspace}: Error - {e}")

    # Test 5: Backend task availability
    print(f"\n🔧 Test 5: Backend Service Task Validation")
    try:
        # Check if we can find the backend tasks
        backend_workspace_path = workspaces_dir / "backend.code-workspace"
        if backend_workspace_path.exists():
            with open(backend_workspace_path) as f:
                backend_data = json.load(f)

            # Check for TerraFusion build tasks
            tasks = backend_data.get("tasks", {}).get("tasks", [])
            build_tasks = [t for t in tasks if "build" in t.get("label", "").lower()]
            api_tasks = [t for t in tasks if "api" in t.get("label", "").lower()]

            print(f"✅ Backend workspace: {len(build_tasks)} build tasks, {len(api_tasks)} API tasks")
        else:
            print(f"❌ Backend workspace not found")

    except Exception as e:
        print(f"❌ Backend task validation error: {e}")

    # Summary
    print(f"\n📊 WORKSPACE INTEGRATION SUMMARY")
    print(f"=" * 40)
    print(f"✅ Core workspaces valid: {core_valid}/{len(core_workspaces)}")
    print(f"⚙️  Workspaces with tasks: {tasks_found}")
    print(f"🔌 Workspaces with extensions: {extensions_found}")
    print(f"📁 Workspaces with accessible folders: {folder_access}")

    overall_score = (core_valid + tasks_found + extensions_found + folder_access) / 10 * 100
    print(f"🎯 Overall workspace health: {overall_score:.0f}%")

    if overall_score >= 80:
        print(f"🎉 Workspace system is ready for development!")
    elif overall_score >= 60:
        print(f"⚠️  Workspace system needs minor improvements")
    else:
        print(f"🚨 Workspace system needs significant work")

    print(f"\n💡 Next Steps:")
    print(f"   • Test workspace loading in VS Code")
    print(f"   • Validate task execution")
    print(f"   • Test multi-root folder coordination")
    print(f"   • Verify extension loading")

if __name__ == "__main__":
    main()
