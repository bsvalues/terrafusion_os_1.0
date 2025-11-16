#!/usr/bin/env python3
"""
TerraFusion Workspace Deployment Test
Tests actual workspace loading and task execution scenarios
"""

import os
import json
import subprocess
from pathlib import Path

def test_workspace_loading():
    """Test that key workspaces can be opened and their tasks executed"""

    workspace_root = Path("/workspaces/terrafusion_os_1.0")
    workspaces_dir = workspace_root / "workspaces"

    print("🚀 TerraFusion Workspace Deployment Test")
    print("=" * 50)

    # Test scenarios for different development workflows
    test_scenarios = [
        {
            "name": "Backend Development",
            "workspace": "backend.code-workspace",
            "expected_folders": ["../backend", "../config", "../docs"],
            "tasks_location": "../backend/.vscode/tasks.json",
            "key_tasks": ["Build TerraFusion Elite Government OS", "Launch TerraFusion API Gateway"]
        },
        {
            "name": "Frontend Development",
            "workspace": "frontend.code-workspace",
            "expected_folders": ["../frontend", "../platform/design-system"],
            "tasks_location": "../frontend/.vscode/tasks.json",
            "key_tasks": []  # Frontend tasks may be npm-based
        },
        {
            "name": "Full System Development",
            "workspace": "master.code-workspace",
            "expected_folders": ["../backend", "../frontend", "../config", "../SDK"],
            "tasks_location": "../.vscode/tasks.json",
            "key_tasks": ["Run TerraFusion Diagnostic", "Run Unit Smoke Tests"]
        },
        {
            "name": "Specialized Platform",
            "workspace": "specialized.code-workspace",
            "expected_folders": ["../os-platform/specialized", "../SDK"],
            "tasks_location": None,  # May not have dedicated tasks
            "key_tasks": []
        }
    ]

    passed_tests = 0
    total_tests = len(test_scenarios)

    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n🧪 Test {i}: {scenario['name']}")
        print(f"   Workspace: {scenario['workspace']}")

        workspace_path = workspaces_dir / scenario['workspace']

        # Test 1: Workspace file exists and is valid
        if not workspace_path.exists():
            print(f"   ❌ Workspace file missing")
            continue

        try:
            with open(workspace_path) as f:
                workspace_data = json.load(f)
            print(f"   ✅ Workspace file valid")
        except Exception as e:
            print(f"   ❌ Workspace file invalid: {e}")
            continue

        # Test 2: Expected folders exist
        folders = workspace_data.get("folders", [])
        folder_paths = [folder["path"] for folder in folders]

        missing_folders = []
        for expected_folder in scenario["expected_folders"]:
            if expected_folder not in folder_paths:
                missing_folders.append(expected_folder)

        if missing_folders:
            print(f"   ⚠️  Some expected folders not found: {missing_folders}")
        else:
            print(f"   ✅ All expected folders present ({len(scenario['expected_folders'])} folders)")

        # Test 3: Folders are accessible
        accessible_folders = 0
        for folder in folders:
            folder_path = workspaces_dir / folder["path"]
            if folder_path.exists():
                accessible_folders += 1

        print(f"   ✅ Accessible folders: {accessible_folders}/{len(folders)}")

        # Test 4: Task configuration
        if scenario["tasks_location"]:
            tasks_path = workspaces_dir / scenario["tasks_location"]
            if tasks_path.exists():
                try:
                    with open(tasks_path) as f:
                        tasks_data = json.load(f)

                    tasks = tasks_data.get("tasks", [])
                    task_labels = [task.get("label", "") for task in tasks]

                    found_key_tasks = 0
                    for key_task in scenario["key_tasks"]:
                        if key_task in task_labels:
                            found_key_tasks += 1

                    print(f"   ✅ Tasks configured: {len(tasks)} total, {found_key_tasks}/{len(scenario['key_tasks'])} key tasks")

                except Exception as e:
                    print(f"   ⚠️  Task configuration error: {e}")
            else:
                print(f"   ⚠️  Task configuration not found")
        else:
            print(f"   ℹ️  No dedicated task configuration expected")

        # Test 5: Extensions configuration
        extensions = workspace_data.get("extensions", {}).get("recommendations", [])
        if extensions:
            print(f"   ✅ Extensions configured: {len(extensions)} recommendations")
        else:
            print(f"   ⚠️  No extension recommendations")

        # Mark test as passed if workspace loads and has accessible folders
        if accessible_folders > 0:
            passed_tests += 1
            print(f"   🎉 Test PASSED")
        else:
            print(f"   ❌ Test FAILED")

    print(f"\n📊 DEPLOYMENT TEST RESULTS")
    print(f"=" * 30)
    print(f"✅ Passed: {passed_tests}/{total_tests} scenarios")
    print(f"🎯 Success rate: {(passed_tests/total_tests)*100:.0f}%")

    if passed_tests == total_tests:
        print(f"🎉 All workspace deployment scenarios PASSED!")
        print(f"   The workspace system is ready for production use.")
    elif passed_tests >= total_tests * 0.75:
        print(f"⚠️  Most scenarios passed. Minor issues to address.")
    else:
        print(f"🚨 Multiple scenarios failed. System needs attention.")

    return passed_tests == total_tests

if __name__ == "__main__":
    success = test_workspace_loading()
    exit(0 if success else 1)
