#!/bin/bash

ROOT_FILE_COUNT=$(find . -maxdepth 1 -type f | wc -l)
CHAOS_LEVEL="LOW"

echo "🔍 STRUCTURE ANALYSIS REPORT"
echo "================================"

if [ $ROOT_FILE_COUNT -gt 50 ]; then
    CHAOS_LEVEL="EXTREME"
    echo "🚨 CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
elif [ $ROOT_FILE_COUNT -gt 20 ]; then
    CHAOS_LEVEL="HIGH"
    echo "⚠️  CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
elif [ $ROOT_FILE_COUNT -gt 10 ]; then
    CHAOS_LEVEL="MEDIUM"
    echo "⚠️  CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
else
    echo "✅ CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
fi

echo ""
echo "📋 VIOLATIONS DETECTED:"
echo "• Log files in root:" $(find . -maxdepth 1 -name "*.log" | wc -l)
echo "• Text files in root:" $(find . -maxdepth 1 -name "*.txt" | wc -l)  
echo "• Temp files in root:" $(find . -maxdepth 1 -name "*.tmp" -o -name "*~" | wc -l)
echo "• MD files in root:" $(find . -maxdepth 1 -name "*.md" | wc -l)

echo ""
echo "🤖 AI AGENT ACTIVITY:"
if [ -d "workspace/ai-temp" ]; then
    AI_FILES=$(find workspace/ai-temp -type f 2>/dev/null | wc -l)
    echo "• Files in AI workspace: $AI_FILES"
else
    echo "• AI workspace: NOT CONFIGURED"
fi

if [ -d "workspace/ai-quarantine" ]; then
    QUARANTINE_FILES=$(find workspace/ai-quarantine -type f 2>/dev/null | wc -l)
    echo "• Files in quarantine: $QUARANTINE_FILES"
else
    echo "• AI quarantine: NOT CONFIGURED"
fi

