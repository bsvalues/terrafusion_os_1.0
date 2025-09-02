#!/bin/bash
COUNTY=$1
echo "🎯 Launching $COUNTY County Demo"
echo "================================"
echo ""
echo "Loading intelligence dossier..."
cat INTELLIGENCE/${COUNTY}_extraction.json
echo ""
echo "Sample valuations ready..."
cat INTELLIGENCE/${COUNTY}_valuations.json
echo ""
echo "Shock-and-awe script loaded..."
cat DEMO_SCRIPTS/${COUNTY}_demo.md
echo ""
echo "DEMO READY - The prospect won't know what hit them."
