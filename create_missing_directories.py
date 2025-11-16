#!/usr/bin/env python3
"""
Create missing directories referenced by workspace files.
Only creates directories within the current workspace structure.
"""

import os
import json
from pathlib import Path

def main():
    workspace_root = Path("/workspaces/terrafusion_os_1.0")
    workspaces_dir = workspace_root / "workspaces"

    missing_dirs = set()
    created_dirs = []

    print("🔍 Analyzing workspace files for missing directories...")

    # Scan all workspace files
    for workspace_file in workspaces_dir.glob("*.code-workspace"):
        try:
            with open(workspace_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            folders = data.get("folders", [])
            for folder in folders:
                path = folder.get("path", "")
                if path.startswith("../"):
                    # Convert relative path to absolute
                    abs_path = (workspaces_dir / path).resolve()

                    # Only consider paths within our workspace
                    try:
                        abs_path.relative_to(workspace_root)
                        if not abs_path.exists():
                            missing_dirs.add(abs_path)
                    except ValueError:
                        # Path is outside workspace, skip
                        continue

        except (json.JSONDecodeError, FileNotFoundError, Exception) as e:
            print(f"❌ Error processing {workspace_file.name}: {e}")
            continue

    print(f"📊 Found {len(missing_dirs)} missing directories within workspace")

    # Create directories
    for dir_path in sorted(missing_dirs):
        try:
            dir_path.mkdir(parents=True, exist_ok=True)
            created_dirs.append(dir_path)
            rel_path = dir_path.relative_to(workspace_root)
            print(f"✅ Created: {rel_path}")
        except Exception as e:
            rel_path = dir_path.relative_to(workspace_root)
            print(f"❌ Failed to create {rel_path}: {e}")

    print(f"\n📈 Summary:")
    print(f"   Created {len(created_dirs)} directories")

    # Create basic README files for key directories
    key_dirs = [
        "os-platform/ai-systems",
        "os-platform/specialized",
        "os-platform/auth",
        "os-platform/services",
        "os-platform/engines",
        "os-platform/trust",
        "marketplace/government-edition",
        "marketplace/property-workbench",
        "marketplace/LeafScope",
        "docs/ai-systems",
        "docs/specialized"
    ]

    print(f"\n📝 Creating README files for key directories...")
    readme_count = 0

    for dir_rel in key_dirs:
        dir_path = workspace_root / dir_rel
        readme_path = dir_path / "README.md"

        if dir_path.exists() and not readme_path.exists():
            try:
                dir_name = dir_path.name.replace("-", " ").title()
                readme_content = f"""# {dir_name}

This directory is part of the TerraFusion OS platform structure.

## Status
Directory created by workspace configuration setup.

## Purpose
{dir_rel.split('/')[-1].replace('-', ' ').title()} module/component for TerraFusion OS.

## Next Steps
- Add module-specific documentation
- Implement core functionality
- Add tests and validation

**Government. Transcended.**
"""
                readme_path.write_text(readme_content)
                rel_readme = readme_path.relative_to(workspace_root)
                print(f"✅ Created README: {rel_readme}")
                readme_count += 1
            except Exception as e:
                print(f"❌ Failed to create README for {dir_rel}: {e}")

    print(f"   Created {readme_count} README files")
    print(f"\n🎉 Workspace directory structure setup complete!")

if __name__ == "__main__":
    main()
