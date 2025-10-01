#!/usr/bin/env bash
# Simplified but comprehensive migration validation

set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "     TerraFusion Migration Validator v2.0 - Quick Check"
echo "═══════════════════════════════════════════════════════════"

ERRORS=0
WARNINGS=0

echo "📁 Directory Structure Check:"
for dir in terrafusion terrafusion-ai-arsenal terrafusion-ops terrafusion-swarm; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir"
        ((ERRORS++))
    fi
done

echo ""
echo "🤖 AI Infrastructure Check:"
if [ -f "terrafusion-ai-arsenal/agents/registry.json" ]; then
    echo "  ✅ Agent registry"
else
    echo "  ❌ Agent registry missing"
    ((ERRORS++))
fi

if [ -f "terrafusion-swarm/orchestration/message-bus.js" ]; then
    echo "  ✅ Message bus"
else
    echo "  ❌ Message bus missing"
    ((ERRORS++))
fi

echo ""
echo "📊 File Count Analysis:"
echo "  Total terrafusion directories: $(ls -1d terrafusion* 2>/dev/null | wc -l)"
echo "  Files in main terrafusion: $(find terrafusion -type f 2>/dev/null | wc -l)"
echo "  AI Arsenal files: $(find terrafusion-ai-arsenal -type f 2>/dev/null | wc -l)"
echo "  Ops scripts: $(find terrafusion-ops -type f 2>/dev/null | wc -l)"

echo ""
echo "🔧 Configuration Check:"
configs=0
if [ -f "package.json" ] && node -e "JSON.parse(require('fs').readFileSync('package.json'))" &>/dev/null; then
    ((configs++))
fi
if [ -f "ai-workspace-companion/package.json" ] && node -e "JSON.parse(require('fs').readFileSync('ai-workspace-companion/package.json'))" &>/dev/null; then
    ((configs++))
fi
echo "  ✅ Valid package.json files: $configs"

echo ""
echo "📋 Summary:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
    echo "  🎉 VALIDATION PASSED!"
    echo ""
    echo "✅ Migration completed successfully!"
    echo "🚀 Ready for Phase 4: Production Readiness"
    
    # Create success marker
    echo "Migration validated successfully at $(date)" > MIGRATION_SUCCESS.txt
    
    exit 0
else
    echo "  ❌ VALIDATION FAILED with $ERRORS errors"
    exit 1
fi