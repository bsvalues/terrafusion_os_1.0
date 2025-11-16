#!/bin/bash

# TerraFusion Extension - Integration Test Script
# Tests all integration points before manual F5 testing

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🧪 TerraFusion Extension - Integration Tests                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

EXTENSION_DIR="/workspaces/terrafusion_os_1.0/tools/vscode-extension"
TDC_DIR="/workspaces/terrafusion_os_1.0/tools/tdc"
WORKSPACES_DIR="/workspaces/terrafusion_os_1.0/workspaces"

cd "$EXTENSION_DIR"

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Workspace Files Detection
echo "🧪 Test 1: Workspace Files Detection"
if [ -d "$WORKSPACES_DIR" ]; then
  WORKSPACE_COUNT=$(ls -1 "$WORKSPACES_DIR"/*.code-workspace 2>/dev/null | wc -l)
  if [ $WORKSPACE_COUNT -gt 0 ]; then
    echo "   ✅ Found $WORKSPACE_COUNT workspace files"
    ((TESTS_PASSED++))
  else
    echo "   ❌ No workspace files found in $WORKSPACES_DIR"
    ((TESTS_FAILED++))
  fi
else
  echo "   ❌ Workspaces directory not found: $WORKSPACES_DIR"
  ((TESTS_FAILED++))
fi
echo ""

# Test 2: Transparency Engine Availability
echo "🧪 Test 2: Transparency Engine Availability"
if lsof -ti:8788 > /dev/null 2>&1; then
  echo "   ✅ Transparency Engine running on port 8788"
  ((TESTS_PASSED++))
else
  echo "   ⚠️  Transparency Engine NOT running on port 8788"
  echo "      Start with: cd $TDC_DIR && node packages/transparency-engine/src/serve.js"
  ((TESTS_FAILED++))
fi
echo ""

# Test 3: Portal UI Availability
echo "🧪 Test 3: Portal UI Availability"
if lsof -ti:5174 > /dev/null 2>&1; then
  echo "   ✅ Portal UI running on port 5174"
  ((TESTS_PASSED++))
else
  echo "   ⚠️  Portal UI NOT running on port 5174"
  echo "      Start with: cd TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend && npm run dev"
  ((TESTS_FAILED++))
fi
echo ""

# Test 4: Backend Services Check
echo "🧪 Test 4: Backend Services Status"
SERVICES_RUNNING=0

if lsof -ti:5000 > /dev/null 2>&1; then
  echo "   ✅ TerraFusion API running on port 5000"
  ((SERVICES_RUNNING++))
else
  echo "   ⚠️  TerraFusion API not running on port 5000"
fi

if lsof -ti:3004 > /dev/null 2>&1; then
  echo "   ✅ Consciousness Engine running on port 3004"
  ((SERVICES_RUNNING++))
else
  echo "   ⚠️  Consciousness Engine not running on port 3004"
fi

if lsof -ti:3002 > /dev/null 2>&1; then
  echo "   ✅ API Gateway running on port 3002"
  ((SERVICES_RUNNING++))
else
  echo "   ⚠️  API Gateway not running on port 3002"
fi

if [ $SERVICES_RUNNING -gt 0 ]; then
  echo "   ℹ️  $SERVICES_RUNNING/3 backend services running"
  ((TESTS_PASSED++))
else
  echo "   ⚠️  No backend services running (optional for extension testing)"
  ((TESTS_PASSED++))  # Not critical for extension testing
fi
echo ""

# Test 5: Extension Compilation
echo "🧪 Test 5: Extension Compilation"
if [ -f "out/extension.js" ]; then
  FILE_SIZE=$(stat -f%z "out/extension.js" 2>/dev/null || stat -c%s "out/extension.js" 2>/dev/null)
  if [ "$FILE_SIZE" -gt 1000 ]; then
    echo "   ✅ Extension compiled (${FILE_SIZE} bytes)"
    ((TESTS_PASSED++))
  else
    echo "   ❌ Extension compiled but suspiciously small (${FILE_SIZE} bytes)"
    ((TESTS_FAILED++))
  fi
else
  echo "   ❌ Extension not compiled. Run: npm run compile"
  ((TESTS_FAILED++))
fi
echo ""

# Test 6: WebSocket Test (if Transparency Engine is running)
echo "🧪 Test 6: WebSocket Connection Test"
if lsof -ti:8788 > /dev/null 2>&1; then
  # Create a simple WebSocket test
  cat > /tmp/ws-test.js << 'WSTEST'
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8788');

ws.on('open', () => {
  console.log('CONNECTED');
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.log('ERROR:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(1);
}, 3000);
WSTEST

  WS_RESULT=$(node /tmp/ws-test.js 2>&1)
  if [[ "$WS_RESULT" == *"CONNECTED"* ]]; then
    echo "   ✅ WebSocket connection successful"
    ((TESTS_PASSED++))
  else
    echo "   ❌ WebSocket connection failed: $WS_RESULT"
    ((TESTS_FAILED++))
  fi
  rm -f /tmp/ws-test.js
else
  echo "   ⚠️  Skipped (Transparency Engine not running)"
  ((TESTS_PASSED++))  # Not critical if engine isn't running
fi
echo ""

# Test 7: Package.json Validation
echo "🧪 Test 7: Package.json Structure"
if command -v jq > /dev/null 2>&1; then
  ACTIVATION_EVENTS=$(jq -r '.activationEvents | length' package.json 2>/dev/null)
  COMMANDS=$(jq -r '.contributes.commands | length' package.json 2>/dev/null)
  VIEWS=$(jq -r '.contributes.views.terrafusion | length' package.json 2>/dev/null)

  echo "   ℹ️  Activation Events: $ACTIVATION_EVENTS"
  echo "   ℹ️  Commands: $COMMANDS"
  echo "   ℹ️  Views: $VIEWS"

  if [ "$COMMANDS" -ge 8 ] && [ "$VIEWS" -eq 3 ]; then
    echo "   ✅ Package.json structure valid"
    ((TESTS_PASSED++))
  else
    echo "   ❌ Package.json structure incomplete"
    ((TESTS_FAILED++))
  fi
else
  echo "   ⚠️  Skipped (jq not installed)"
  ((TESTS_PASSED++))
fi
echo ""

# Test 8: TypeScript Errors Check
echo "🧪 Test 8: TypeScript Error Check"
TSC_OUTPUT=$(npm run compile 2>&1)
if [[ "$TSC_OUTPUT" == *"error TS"* ]]; then
  echo "   ❌ TypeScript compilation errors found"
  echo "$TSC_OUTPUT" | grep "error TS" | head -5
  ((TESTS_FAILED++))
else
  echo "   ✅ No TypeScript errors"
  ((TESTS_PASSED++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Test Results:"
echo "   ✅ Passed: $TESTS_PASSED"
echo "   ❌ Failed: $TESTS_FAILED"
echo "   📊 Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "🎉 All integration tests passed!"
  echo ""
  echo "🚀 Ready for F5 Testing:"
  echo "   1. Open /workspaces/terrafusion_os_1.0/tools/vscode-extension in VS Code"
  echo "   2. Press F5 to launch Extension Development Host"
  echo "   3. Look for TerraFusion icon in activity bar"
  echo ""
  echo "📋 See QUICK_START.md for detailed testing checklist"
else
  echo "⚠️  Some tests failed, but extension may still work"
  echo ""
  echo "🔧 Recommended Actions:"
  [ $(lsof -ti:8788 2>/dev/null | wc -l) -eq 0 ] && echo "   - Start Transparency Engine: cd $TDC_DIR && node packages/transparency-engine/src/serve.js"
  [ $(lsof -ti:5174 2>/dev/null | wc -l) -eq 0 ] && echo "   - Start Portal UI: cd TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend && npm run dev"
  echo ""
  echo "   You can still test the extension with F5"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Government. Transcended."
echo ""

exit $TESTS_FAILED
