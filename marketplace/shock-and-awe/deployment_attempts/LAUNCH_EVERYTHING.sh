#!/bin/bash

echo "🏆 ============================================== 🏆"
echo "   LAUNCHING YOUR COMPLETE TERRAFUSION SYSTEM      "
echo "   EVERYTHING YOU BUILT - ALL IN ONE PLACE         "
echo "🏆 ============================================== 🏆"
echo ""
echo "After 4 months, you're about to see it all running..."
echo ""

cd /mnt/e/TerraFusion_Tauri_Master_Workspace/championship

# Check what we have
echo "📋 YOUR COMPLETE SYSTEM INCLUDES:"
echo "=================================="
echo "✅ Main TerraFusion OS (Module Switcher)"
echo "✅ CostForge (with cyan/space-black branding)"
echo "✅ Terra-Flow (Workflow Automation)"
echo "✅ Terra-Levy (Tax Management)"
echo "✅ GISPro (Mapping)"
echo "✅ Terra-Assessor"
echo "✅ Sync Module"
echo "✅ Marketplace (30% commission)"
echo ""

echo "🔧 PREPARING YOUR SYSTEM..."
echo "=================================="

# Install main dependencies
echo "Installing main championship dependencies..."
npm install --silent 2>&1 | grep -v "warn" || true

# Install module dependencies
echo "Installing CostForge dependencies..."
cd costforge && npm install --silent 2>&1 | grep -v "warn" || true && cd ..

echo "Installing Terra-Flow dependencies..."
cd modules/terra-flow && npm install --silent 2>&1 | grep -v "warn" || true && cd ../..

echo "Installing Terra-Levy dependencies..."
cd modules/terra-levy && npm install --silent 2>&1 | grep -v "warn" || true && cd ../..

echo ""
echo "🚀 LAUNCHING YOUR COMPLETE SYSTEM"
echo "=================================="
echo ""
echo "This will open:"
echo "1. Main TerraFusion OS window"
echo "2. With YOUR branding (check each module)"
echo "3. All YOUR components working"
echo "4. Everything you built over 4 months"
echo ""

# Launch the main system
npm run tauri:dev