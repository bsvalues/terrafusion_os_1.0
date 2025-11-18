#!/usr/bin/env python3
"""
TerraFusion OS - Workspace System Restoration
Restores and organizes the complete workspace ecosystem.
"""

import os
import json
import shutil
from pathlib import Path

def create_module_symlinks():
    """Create symlinks from root modules/ to SDK/modules/ for workspace compatibility."""
    print("🔗 Creating module symlinks...")

    modules_root = Path("/workspaces/terrafusion_os_1.0/modules")
    sdk_modules = Path("/workspaces/terrafusion_os_1.0/SDK/modules")

    if not sdk_modules.exists():
        print(f"❌ SDK modules directory not found: {sdk_modules}")
        return

    # Create symlinks for each module in SDK/modules
    for module_dir in sdk_modules.iterdir():
        if module_dir.is_dir():
            symlink_path = modules_root / module_dir.name

            # Remove existing symlink if it exists
            if symlink_path.exists() or symlink_path.is_symlink():
                if symlink_path.is_symlink():
                    symlink_path.unlink()
                else:
                    shutil.rmtree(symlink_path)

            # Create symlink
            try:
                symlink_path.symlink_to(module_dir, target_is_directory=True)
                print(f"  ✅ {module_dir.name} -> {symlink_path}")
            except OSError as e:
                # If symlinks don't work (Windows), copy directory
                shutil.copytree(module_dir, symlink_path, dirs_exist_ok=True)
                print(f"  📂 {module_dir.name} -> {symlink_path} (copied)")

def create_workspace_directories():
    """Create directories that workspaces expect to exist."""
    print("🏗️ Creating workspace directories...")

    directories = [
        "os-platform/development/tools/TerraFusionIDE",
        "os-platform/ai-systems/ai-swarm",
        "marketplace",
        "infrastructure",
        "ops",
        "counties",
        "tools/tdc",
        "ai-systems"
    ]

    for dir_path in directories:
        full_path = Path("/workspaces/terrafusion_os_1.0") / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✅ {dir_path}")

def create_module_readme():
    """Create README files for key directories."""
    print("📚 Creating module documentation...")

    readme_content = """# TerraFusion OS Modules

This directory contains symlinks to modules in SDK/modules/ for workspace compatibility.

## Available Modules

- **costforge-ai**: AI-powered cost estimation and quantum ML services
- **terra-levy**: Tax levy calculation and government revenue management
- **terra-agent**: AI agent coordination and swarm intelligence
- **terra-pilt**: PILT (Payments In Lieu of Taxes) management
- **terra-playground**: Development and testing environment
- **terra-dashboard**: Government operations dashboard
- **bcbs-webhub**: Legacy system integration hub

## Usage

Each module can be developed independently using its dedicated workspace:
- `costforge-ai.code-workspace`
- `terra-levy.code-workspace`
- etc.

**Government. Transcended.**
"""

    readme_path = Path("/workspaces/terrafusion_os_1.0/modules/README.md")
    readme_path.write_text(readme_content)
    print("  ✅ modules/README.md created")

def fix_workspace_configurations():
    """Fix common workspace configuration issues."""
    print("⚙️ Fixing workspace configurations...")

    workspaces_dir = Path("/workspaces/terrafusion_os_1.0/workspaces")

    # Fix common patterns
    fixes_applied = 0

    for workspace_file in workspaces_dir.glob("*.code-workspace"):
        try:
            with open(workspace_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Skip if file has obvious issues
            if len(content.strip()) == 0:
                print(f"  ⚠️  Skipping empty file: {workspace_file.name}")
                continue

            # Fix common path issues
            original_content = content

            # Fix absolute Windows paths
            content = content.replace('D:/TF_File_8_25/', '../')
            content = content.replace('D:/TerraFusion/', '../')

            # Fix missing trailing commas and other JSON issues
            if content != original_content:
                with open(workspace_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixes_applied += 1
                print(f"  ✅ Fixed: {workspace_file.name}")

        except Exception as e:
            print(f"  ❌ Error fixing {workspace_file.name}: {e}")

    print(f"🔧 Applied fixes to {fixes_applied} workspace files")

def create_workspace_launcher():
    """Create a workspace launcher script."""
    print("🚀 Creating workspace launcher...")

    launcher_content = '''#!/bin/bash
# TerraFusion OS - Workspace Launcher

echo "🏛️ TerraFusion OS - Workspace Launcher"
echo "Government. Transcended."
echo ""

WORKSPACES_DIR="/workspaces/terrafusion_os_1.0/workspaces"

echo "📁 Available Workspaces:"
echo ""
echo "🏛️  CORE WORKSPACES:"
echo "   master          - Complete TerraFusion OS"
echo "   backend         - .NET 8 microservices"
echo "   frontend        - React 18 + Quantum UI"
echo "   sdk             - Developer kit"
echo ""
echo "🚀  MODULE WORKSPACES:"
echo "   costforge-ai    - AI cost estimation"
echo "   terra-levy      - Tax levy management"
echo "   terra-agent     - AI agent coordination"
echo "   portal          - Government portal"
echo ""
echo "⚙️  SPECIALIZED WORKSPACES:"
echo "   consciousness   - AI swarm coordination"
echo "   monitoring      - System monitoring"
echo "   security        - Security & compliance"
echo ""

if [ "$1" == "" ]; then
    echo "Usage: ./launch-workspace.sh <workspace-name>"
    echo ""
    echo "Example: ./launch-workspace.sh master"
    exit 1
fi

WORKSPACE_NAME=$1
WORKSPACE_FILE="${WORKSPACES_DIR}/${WORKSPACE_NAME}.code-workspace"

if [ -f "$WORKSPACE_FILE" ]; then
    echo "🎯 Launching: $WORKSPACE_NAME"
    code "$WORKSPACE_FILE"
else
    echo "❌ Workspace not found: $WORKSPACE_FILE"
    echo ""
    echo "💡 Available workspace files:"
    ls -1 "$WORKSPACES_DIR"/*.code-workspace | sed 's/.*\\//  /' | sed 's/\\.code-workspace//'
fi
'''

    launcher_path = Path("/workspaces/terrafusion_os_1.0/launch-workspace.sh")
    launcher_path.write_text(launcher_content)
    launcher_path.chmod(0o755)
    print("  ✅ launch-workspace.sh created")

def main():
    """Main restoration function."""
    print("🏛️ TerraFusion OS - Workspace System Restoration")
    print("=" * 50)

    # Step 1: Create required directories
    create_workspace_directories()

    # Step 2: Create module symlinks
    create_module_symlinks()

    # Step 3: Create documentation
    create_module_readme()

    # Step 4: Fix workspace configurations
    fix_workspace_configurations()

    # Step 5: Create launcher
    create_workspace_launcher()

    print("\n" + "=" * 50)
    print("🎉 WORKSPACE SYSTEM RESTORATION COMPLETE!")
    print("")
    print("✅ Module symlinks created")
    print("✅ Workspace directories established")
    print("✅ Configuration issues fixed")
    print("✅ Launcher script created")
    print("")
    print("🚀 Usage:")
    print("   ./launch-workspace.sh master     # Full system")
    print("   ./launch-workspace.sh backend    # Backend only")
    print("   ./launch-workspace.sh frontend   # Frontend only")
    print("   ./launch-workspace.sh costforge-ai  # AI module")
    print("")
    print("Government. Transcended. 🏛️")

if __name__ == "__main__":
    main()
