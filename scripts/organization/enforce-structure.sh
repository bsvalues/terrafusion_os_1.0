#!/bin/bash

echo "🛡️ ENFORCING TERRAFUSION OS STRUCTURE"
echo "====================================="

# Create backup before changes
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "💾 Creating backup: backup/before-enforcement-${TIMESTAMP}.tar.gz"
tar -czf "backup/before-enforcement-${TIMESTAMP}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backup' \
    . 2>/dev/null || true

# Move files to appropriate locations
echo "📁 Organizing files..."

# Move log files
LOG_COUNT=$(find . -maxdepth 1 -name "*.log" | wc -l)
if [ $LOG_COUNT -gt 0 ]; then
    echo "  Moving $LOG_COUNT log files to logs/"
    find . -maxdepth 1 -name "*.log" -exec mv {} logs/ \; 2>/dev/null || true
fi

# Move documentation files to docs/ (except README.md)
MD_COUNT=$(find . -maxdepth 1 -name "*.md" ! -name "README.md" | wc -l)
if [ $MD_COUNT -gt 0 ]; then
    echo "  Moving $MD_COUNT documentation files to docs/"
    find . -maxdepth 1 -name "*.md" ! -name "README.md" -exec mv {} docs/ \; 2>/dev/null || true
fi

# Move text files
TXT_COUNT=$(find . -maxdepth 1 -name "*.txt" | wc -l)
if [ $TXT_COUNT -gt 0 ]; then
    echo "  Moving $TXT_COUNT text files to docs/"
    find . -maxdepth 1 -name "*.txt" -exec mv {} docs/ \; 2>/dev/null || true
fi

# Clean temporary files
TEMP_COUNT=$(find . -maxdepth 1 -name "*.tmp" -o -name "*~" | wc -l)
if [ $TEMP_COUNT -gt 0 ]; then
    echo "  Removing $TEMP_COUNT temporary files"
    find . -maxdepth 1 -name "*.tmp" -o -name "*~" -delete 2>/dev/null || true
fi

echo "✅ Structure enforcement complete"

# Show results
ROOT_FILES_AFTER=$(find . -maxdepth 1 -type f | wc -l)
echo "📊 Root directory now contains: $ROOT_FILES_AFTER files"

