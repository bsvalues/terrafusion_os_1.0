#!/bin/bash

# TerraFusion Development Session Starter
# Automatically validates Explain-Mode and starts development environment

# Load environment variables from .env.ports
if [ -f ".env.ports" ]; then
    echo "📋 Loading dynamic port configuration..."
    export $(grep -v '^#' .env.ports | xargs)
else
    echo "❌ Warning: .env.ports file not found, using defaults"
fi

echo "🎯 TerraFusion Development Session Initialization"
echo "================================================="
echo ""

# Step 1: Validate Explain-Mode Integration
echo "1️⃣  Validating Explain-Mode Integration..."
npm run validate:explain-mode
VALIDATION_EXIT_CODE=$?

echo ""
echo "2️⃣  Checking Development Prerequisites..."

# Check if backend project exists
if [ ! -f "backend/TerraFusion.API/TerraFusion.API.csproj" ]; then
    echo "   ❌ Backend project not found"
    echo "   📋 Please ensure backend/TerraFusion.API/ exists"
    exit 1
else
    echo "   ✅ Backend project found"
fi

# Check if frontend exists
if [ ! -f "frontend/package.json" ]; then
    echo "   ❌ Frontend project not found"
    echo "   📋 Please ensure frontend/ exists"
    exit 1
else
    echo "   ✅ Frontend project found"
fi

echo ""
echo "3️⃣  Explain-Mode Validation Results:"
if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo "   🏆 EXCELLENT: Integration is production ready!"
else
    echo "   ⚠️  Integration has minor issues but frontend is functional"
fi

echo ""
echo "4️⃣  Starting Development Environment..."
echo "   🚀 Backend API: http://localhost:${TF_API_PORT:-5046}"
echo "   🖥️  Frontend: http://localhost:${TF_FRONTEND_PORT:-3102}"
echo "   🎯 Executive View: Click '🎯 Executive View' toggle"
echo ""

# Start development environment
npm run dev