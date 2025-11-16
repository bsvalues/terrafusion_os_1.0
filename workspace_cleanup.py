#!/usr/bin/env python3
"""
TerraFusion Workspace Cleanup Script
Implements workspace-specific cleanup actions for development hygiene
"""

import os
import subprocess
import shutil
from pathlib import Path
import json

def main():
    workspace_root = Path("/workspaces/terrafusion_os_1.0")

    print("🧹 TerraFusion Workspace Cleanup")
    print("=" * 40)
    print("Focus: Development artifacts, cache patterns, workspace hygiene")
    print("")

    cleanup_stats = {
        "cache_cleaned": 0,
        "temp_removed": 0,
        "size_freed_mb": 0,
        "gitignore_updated": False
    }

    # 1. Update .gitignore with Python/Node cache patterns
    print("📝 Step 1: Update .gitignore patterns")
    print("-" * 30)

    gitignore_path = workspace_root / ".gitignore"

    # Essential workspace patterns to ignore
    workspace_patterns = [
        "# Workspace cleanup patterns",
        "__pycache__/",
        "*.py[cod]",
        "*$py.class",
        "*.so",
        ".coverage",
        ".pytest_cache/",
        ".cache/",
        "node_modules/",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        ".npm",
        ".yarn/cache",
        ".yarn/unplugged",
        ".yarn/build-state.yml",
        ".yarn/install-state.gz",
        ".next/",
        "out/",
        "dist/",
        "build/",
        ".vscode/settings.json",
        ".DS_Store",
        "Thumbs.db",
        "*.tmp",
        "*.temp",
        "*.log",
        ".env.local",
        ".env.*.local"
    ]

    if gitignore_path.exists():
        with open(gitignore_path, 'r') as f:
            current_content = f.read()

        # Check which patterns are missing
        missing_patterns = []
        for pattern in workspace_patterns:
            if pattern not in current_content:
                missing_patterns.append(pattern)

        if missing_patterns:
            with open(gitignore_path, 'a') as f:
                f.write(f"\n\n{missing_patterns[0]}\n")  # Header comment
                for pattern in missing_patterns[1:]:
                    f.write(f"{pattern}\n")

            print(f"✅ Added {len(missing_patterns)} new patterns to .gitignore")
            cleanup_stats["gitignore_updated"] = True
        else:
            print("✅ .gitignore already has workspace patterns")
    else:
        # Create new .gitignore
        with open(gitignore_path, 'w') as f:
            for pattern in workspace_patterns:
                f.write(f"{pattern}\n")
        print("✅ Created new .gitignore with workspace patterns")
        cleanup_stats["gitignore_updated"] = True

    # 2. Clean Python cache files
    print(f"\n🐍 Step 2: Clean Python cache files")
    print("-" * 30)

    python_patterns = [
        "**/__pycache__",
        "**/*.pyc",
        "**/*.pyo",
        "**/.pytest_cache"
    ]

    for pattern in python_patterns:
        for item in workspace_root.glob(pattern):
            if item.is_dir():
                try:
                    size_mb = sum(f.stat().st_size for f in item.rglob('*') if f.is_file()) / (1024*1024)
                    shutil.rmtree(item)
                    print(f"   🗑️ Removed: {item.relative_to(workspace_root)} ({size_mb:.1f} MB)")
                    cleanup_stats["cache_cleaned"] += 1
                    cleanup_stats["size_freed_mb"] += size_mb
                except Exception as e:
                    print(f"   ⚠️ Could not remove {item}: {e}")
            elif item.is_file():
                try:
                    size_mb = item.stat().st_size / (1024*1024)
                    item.unlink()
                    print(f"   🗑️ Removed: {item.relative_to(workspace_root)} ({size_mb:.3f} MB)")
                    cleanup_stats["cache_cleaned"] += 1
                    cleanup_stats["size_freed_mb"] += size_mb
                except Exception as e:
                    print(f"   ⚠️ Could not remove {item}: {e}")

    # 3. Clean Node.js cache files
    print(f"\n📦 Step 3: Clean Node.js cache files")
    print("-" * 30)

    node_patterns = [
        "**/node_modules/.cache",
        "**/.npm",
        "**/npm-debug.log*",
        "**/yarn-debug.log*",
        "**/yarn-error.log*"
    ]

    for pattern in node_patterns:
        for item in workspace_root.glob(pattern):
            try:
                if item.is_dir():
                    size_mb = sum(f.stat().st_size for f in item.rglob('*') if f.is_file()) / (1024*1024)
                    shutil.rmtree(item)
                else:
                    size_mb = item.stat().st_size / (1024*1024)
                    item.unlink()

                print(f"   🗑️ Removed: {item.relative_to(workspace_root)} ({size_mb:.1f} MB)")
                cleanup_stats["cache_cleaned"] += 1
                cleanup_stats["size_freed_mb"] += size_mb
            except Exception as e:
                print(f"   ⚠️ Could not remove {item}: {e}")

    # 4. Clean temporary development files
    print(f"\n🗑️ Step 4: Clean temporary development files")
    print("-" * 30)

    temp_patterns = [
        "**/*.tmp",
        "**/*.temp",
        "**/*.log",
        "**/dist",
        "**/out",
        "**/.next"
    ]

    for pattern in temp_patterns:
        for item in workspace_root.glob(pattern):
            # Skip if it's in node_modules or other important directories
            if "node_modules" in str(item) or "backend/bin" in str(item):
                continue

            try:
                if item.is_dir():
                    size_mb = sum(f.stat().st_size for f in item.rglob('*') if f.is_file()) / (1024*1024)
                    shutil.rmtree(item)
                else:
                    size_mb = item.stat().st_size / (1024*1024)
                    item.unlink()

                print(f"   🗑️ Removed: {item.relative_to(workspace_root)} ({size_mb:.1f} MB)")
                cleanup_stats["temp_removed"] += 1
                cleanup_stats["size_freed_mb"] += size_mb
            except Exception as e:
                print(f"   ⚠️ Could not remove {item}: {e}")

    # 5. Summary and commit changes
    print(f"\n📊 Cleanup Summary")
    print("-" * 20)
    print(f"✅ Cache files cleaned: {cleanup_stats['cache_cleaned']}")
    print(f"✅ Temp files removed: {cleanup_stats['temp_removed']}")
    print(f"✅ Space freed: {cleanup_stats['size_freed_mb']:.1f} MB")
    print(f"✅ .gitignore updated: {'Yes' if cleanup_stats['gitignore_updated'] else 'No'}")

    # Commit the .gitignore changes if any
    if cleanup_stats["gitignore_updated"]:
        try:
            subprocess.run(["git", "add", ".gitignore"], cwd=workspace_root, check=True)
            subprocess.run([
                "git", "commit", "-m",
                "chore: update .gitignore with workspace cleanup patterns\n\nAdded Python/Node cache patterns for better workspace hygiene"
            ], cwd=workspace_root, check=True)
            print("✅ Committed .gitignore updates")
        except subprocess.CalledProcessError:
            print("⚠️ Could not commit .gitignore changes (may need manual commit)")

    print(f"\n🎉 Workspace cleanup complete!")
    print(f"   💡 Run this script monthly to maintain workspace hygiene")
    print(f"   💡 Add to WORKSPACES.md: 'npm run workspace:cleanup' or 'python workspace_cleanup.py'")

if __name__ == "__main__":
    main()
