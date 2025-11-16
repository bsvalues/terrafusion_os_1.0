#!/bin/bash
# vs-code-workspace-doctor.sh - Fix VS Code workspace issues for TerraFusion OS

set -e

echo "🩺 TerraFusion OS Workspace Doctor - Fixing VS Code Issues..."

# Clear all VS Code caches and temporary files
echo "🧹 Clearing VS Code caches..."
rm -rf ~/.vscode-server-insiders/*/logs/* 2>/dev/null || true
rm -rf ~/.vscode-server-insiders/*/User/logs/* 2>/dev/null || true
rm -rf ~/.vscode-server-insiders/*/CachedExtensions/* 2>/dev/null || true

# Clear C# Dev Kit caches specifically
echo "🧹 Clearing C# Dev Kit caches..."
rm -rf ~/.vscode-server-insiders/*/User/workspaceStorage/*/ms-dotnettools.csdevkit 2>/dev/null || true
rm -rf ~/.vscode-server-insiders/*/User/globalStorage/ms-dotnettools.csdevkit 2>/dev/null || true

# Clear .NET Core caches
echo "🧹 Clearing .NET caches..."
dotnet nuget locals all --clear 2>/dev/null || true
rm -rf ~/.dotnet/toolResolverCache/* 2>/dev/null || true

# Clear VS Code workspace-specific caches
echo "🧹 Clearing workspace caches..."
rm -rf /workspaces/terrafusion_os_1.0/.vscode/extensions.json.backup 2>/dev/null || true
rm -rf /workspaces/terrafusion_os_1.0/.vscode/*.bak 2>/dev/null || true

# Rebuild solution to ensure no build artifacts conflicts
echo "🔨 Rebuilding backend solution..."
cd /workspaces/terrafusion_os_1.0/backend
dotnet clean TerraFusion.sln --verbosity minimal
dotnet restore TerraFusion.sln --verbosity minimal
dotnet build TerraFusion.sln --verbosity minimal --no-restore

# Verify project references
echo "📋 Verifying solution structure..."
dotnet sln list | grep "TerraFusion.Operations" && echo "✅ TerraFusion.Operations found in solution" || echo "❌ TerraFusion.Operations missing"

# Test TDC status after fixes
echo "🧪 Testing TDC after fixes..."
cd /workspaces/terrafusion_os_1.0/tools/tdc
npm run tdc status 2>/dev/null && echo "✅ TDC operational after fixes" || echo "⚠️ TDC needs attention"

echo "✅ VS Code Workspace Doctor completed!"
echo "📝 Recommendations:"
echo "   1. Restart VS Code to clear remaining cache"
echo "   2. Reload window (Ctrl+Shift+P > Developer: Reload Window)"
echo "   3. Check Problems panel should be clear of duplicate project errors"
