#!/bin/bash
clear
echo "═══════════════════════════════════════════════════"
echo "     TerraFusion OS Structure Health Dashboard"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📊 Structure Violations:"
bash scripts/organization/monitor-chaos.sh
echo ""
echo "📁 Root Directory Status:"
ls -la | head -20
echo ""
echo "🤖 AI Workspace Usage:"
du -sh workspace/ai-temp 2>/dev/null || echo "Clean"
echo ""
echo "💾 Latest Backups:"
ls -lht backup/*/*.tar.gz 2>/dev/null | head -5
echo ""
echo "⚠️  Recent AI Agent Activity:"
find workspace/ai-quarantine -mtime -1 -type f 2>/dev/null | wc -l
echo "files quarantined in last 24 hours"
echo "═══════════════════════════════════════════════════"