#!/bin/bash

# TerraFusion VS Code Extension - Pre-Flight Check
# Verifies extension structure before testing

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🏛️  TerraFusion Extension - Pre-Flight Check                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

EXTENSION_DIR="/workspaces/terrafusion_os_1.0/tools/vscode-extension"
ERRORS=0
WARNINGS=0

# Check if we're in the right directory
if [ ! -f "$EXTENSION_DIR/package.json" ]; then
  echo "❌ Error: Not in extension directory"
  exit 1
fi

cd "$EXTENSION_DIR"

echo "📦 Checking Extension Structure..."
echo ""

# Check core files
echo "🔍 Core Files:"
if [ -f "package.json" ]; then
  echo "  ✅ package.json"
else
  echo "  ❌ package.json - MISSING"
  ((ERRORS++))
fi

if [ -f "tsconfig.json" ]; then
  echo "  ✅ tsconfig.json"
else
  echo "  ❌ tsconfig.json - MISSING"
  ((ERRORS++))
fi

if [ -f "README.md" ]; then
  echo "  ✅ README.md"
else
  echo "  ⚠️  README.md - Missing"
  ((WARNINGS++))
fi

echo ""

# Check source files
echo "🔍 Source Files:"
if [ -f "src/extension.ts" ]; then
  echo "  ✅ src/extension.ts"
else
  echo "  ❌ src/extension.ts - MISSING"
  ((ERRORS++))
fi

if [ -f "src/providers/WorkspaceExplorerProvider.ts" ]; then
  echo "  ✅ src/providers/WorkspaceExplorerProvider.ts"
else
  echo "  ❌ WorkspaceExplorerProvider.ts - MISSING"
  ((ERRORS++))
fi

if [ -f "src/providers/ServicesProvider.ts" ]; then
  echo "  ✅ src/providers/ServicesProvider.ts"
else
  echo "  ❌ ServicesProvider.ts - MISSING"
  ((ERRORS++))
fi

if [ -f "src/providers/AgentActivityProvider.ts" ]; then
  echo "  ✅ src/providers/AgentActivityProvider.ts"
else
  echo "  ❌ AgentActivityProvider.ts - MISSING"
  ((ERRORS++))
fi

if [ -f "src/providers/PortalWebViewProvider.ts" ]; then
  echo "  ✅ src/providers/PortalWebViewProvider.ts"
else
  echo "  ❌ PortalWebViewProvider.ts - MISSING"
  ((ERRORS++))
fi

echo ""

# Check resources
echo "🔍 Visual Assets:"
if [ -f "resources/terrafusion-icon.svg" ]; then
  echo "  ✅ resources/terrafusion-icon.svg"
else
  echo "  ⚠️  terrafusion-icon.svg - Missing"
  ((WARNINGS++))
fi

if [ -f "resources/services-icon.svg" ]; then
  echo "  ✅ resources/services-icon.svg"
else
  echo "  ⚠️  services-icon.svg - Missing"
  ((WARNINGS++))
fi

if [ -f "resources/agents-icon.svg" ]; then
  echo "  ✅ resources/agents-icon.svg"
else
  echo "  ⚠️  agents-icon.svg - Missing"
  ((WARNINGS++))
fi

echo ""

# Check VS Code config
echo "🔍 VS Code Configuration:"
if [ -f ".vscode/launch.json" ]; then
  echo "  ✅ .vscode/launch.json"
else
  echo "  ⚠️  launch.json - Missing (F5 won't work)"
  ((WARNINGS++))
fi

if [ -f ".vscode/tasks.json" ]; then
  echo "  ✅ .vscode/tasks.json"
else
  echo "  ⚠️  tasks.json - Missing"
  ((WARNINGS++))
fi

echo ""

# Check node_modules
echo "🔍 Dependencies:"
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules installed"

  # Count packages
  PKG_COUNT=$(ls -1 node_modules | wc -l)
  echo "  📦 $PKG_COUNT packages"
else
  echo "  ❌ node_modules - MISSING (run: npm install)"
  ((ERRORS++))
fi

echo ""

# Check compiled output
echo "🔍 Build Output:"
if [ -d "out" ]; then
  echo "  ✅ out/ directory exists"

  if [ -f "out/extension.js" ]; then
    echo "  ✅ out/extension.js compiled"
  else
    echo "  ⚠️  out/extension.js not compiled (run: npm run compile)"
    ((WARNINGS++))
  fi
else
  echo "  ⚠️  out/ directory missing (run: npm run compile)"
  ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All checks passed! Extension ready for testing."
  echo ""
  echo "🚀 Next Steps:"
  echo "   1. Open this directory in VS Code"
  echo "   2. Press F5 to launch Extension Development Host"
  echo "   3. Look for TerraFusion icon in activity bar"
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Pre-flight complete with $WARNINGS warning(s)"
  echo "   Extension should work, but some optional files are missing."
  echo ""
  echo "🚀 You can still test with F5"
else
  echo "❌ Pre-flight FAILED with $ERRORS error(s) and $WARNINGS warning(s)"
  echo ""
  echo "🔧 Fix these issues:"
  [ $ERRORS -gt 0 ] && echo "   - Run: npm install"
  [ ! -f "out/extension.js" ] && echo "   - Run: npm run compile"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $ERRORS
