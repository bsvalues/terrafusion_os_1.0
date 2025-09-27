#!/bin/bash

echo "🏛️ TerraFusion OS - System Validation"
echo "===================================="

ERRORS=0

# Test Python kernel
echo "🔋 Testing OS Kernel..."
if pgrep -f "boot.py" > /dev/null; then
    echo "✅ OS Kernel: Running"
else
    echo "❌ OS Kernel: Not running"
    ((ERRORS++))
fi

# Test .NET API
echo "🚀 Testing .NET API Backend..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ .NET API: Responding"
else
    echo "❌ .NET API: Not responding"
    ((ERRORS++))
fi

# Test Web Interface
echo "🌐 Testing Web Interface..."
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Web Interface: Accessible"
else
    echo "❌ Web Interface: Not accessible"
    ((ERRORS++))
fi

# Test Configuration Files
echo "⚙️ Testing Configuration Files..."
if [ -f "configs/ai-swarm-config.json" ]; then
    echo "✅ AI Swarm Config: Found"
else
    echo "❌ AI Swarm Config: Missing"
    ((ERRORS++))
fi

if [ -f "configs/benton-county-config.json" ]; then
    echo "✅ County Config: Found"
else
    echo "❌ County Config: Missing"
    ((ERRORS++))
fi

# Test Dynamic Interfaces
echo "🧠 Testing AI Command Center..."
if curl -s http://localhost:8080/ai-command-center.html | grep -q "Supreme Commander Claude"; then
    echo "✅ AI Command Center: Loading"
else
    echo "❌ AI Command Center: Issues detected"
    ((ERRORS++))
fi

echo "🏛️ Testing County Operations..."
if curl -s http://localhost:8080/county-operations.html | grep -q "County Operations"; then
    echo "✅ County Operations: Loading"
else
    echo "❌ County Operations: Issues detected"
    ((ERRORS++))
fi

# Summary
echo ""
echo "════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo "🎉 System Validation: PASSED"
    echo "✅ All components operational"
    echo "🏛️ Government. Transcended. 🏛️"
else
    echo "⚠️ System Validation: $ERRORS errors detected"
    echo "Please check the failing components above"
fi
echo "════════════════════════"
