#!/bin/bash

# PACS Module Import Script Runner
# This script runs either the API-based or direct import script for PACS modules
# Usage: bash run-import.sh [direct]
# If "direct" is specified, it will use direct database import, otherwise it will use the API

echo "PACS Module Import Script Runner"
echo "================================"

# Check if direct import is requested
if [ "$1" == "direct" ]; then
  echo "Using direct database import method..."
  node scripts/direct-import-pacs-modules.js
else
  echo "Using API-based import method..."
  node scripts/import-pacs-modules.js
fi

echo "Import script completed."