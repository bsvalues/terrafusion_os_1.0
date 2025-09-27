#!/bin/bash
clear
echo "═══════════════════════════════════════════════════"
echo "     TerraFusion OS Structure Health Dashboard"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📊 Structure Violations:"
bash scripts/organization/monitor-chaos.sh
echo ""
echo "📁 Root Directory Status (showing 15 files):"
ls -la | head -15
echo ""
echo "🤖 AI Workspace Usage:"
du -sh workspace/ai-temp 2>/dev/null || echo "Clean"
echo ""
echo "💾 Latest Backups:"
ls -lht backup/*/*.tar.gz 2>/dev/null | head -5 || echo "No backups found"
echo ""
echo "⚠️  Recent AI Agent Activity:"
find workspace/ai-quarantine -mtime -1 -type f 2>/dev/null | wc -l
echo "files quarantined in last 24 hours"
echo ""
echo "🎯 Structure Health Score:"
ROOT_FILES=$(ls -1 | wc -l)
if [ $ROOT_FILES -lt 10 ]; then
    echo "✅ EXCELLENT (${ROOT_FILES} files)"
elif [ $ROOT_FILES -lt 20 ]; then
    echo "🟡 GOOD (${ROOT_FILES} files)"
elif [ $ROOT_FILES -lt 50 ]; then
    echo "🟠 MODERATE (${ROOT_FILES} files)"
else
    echo "🔴 NEEDS ATTENTION (${ROOT_FILES} files)"
fi
echo "═══════════════════════════════════════════════════"