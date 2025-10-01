#!/bin/bash
# Simple file organization script for TerraFusion OS
# This will move files to their proper locations

echo "🛡️ Starting file organization..."

# Create backup first
mkdir -p backup/before-organization
echo "Creating backup..."
tar -czf "backup/before-organization/backup-$(date +%Y%m%d-%H%M%S).tar.gz" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=backup \
    --exclude=dist \
    --exclude=build \
    . 2>/dev/null

echo "✅ Backup created"

# Move log files
echo "Moving log files..."
for file in *.log; do
    if [[ -f "$file" ]]; then
        echo "  Moving $file → logs/current/"
        mv "$file" logs/current/ 2>/dev/null || echo "    Failed to move $file"
    fi
done

# Move markdown documentation files (except core ones)
echo "Moving documentation files..."
for file in *.md; do
    if [[ -f "$file" && "$file" != "README.md" && "$file" != "CHANGELOG.md" && "$file" != "CONTRIBUTING.md" ]]; then
        echo "  Moving $file → docs/operations/"
        mv "$file" docs/operations/ 2>/dev/null || echo "    Failed to move $file"
    fi
done

# Move text files
echo "Moving text files..."
for file in *.txt; do
    if [[ -f "$file" ]]; then
        echo "  Moving $file → docs/operations/"
        mv "$file" docs/operations/ 2>/dev/null || echo "    Failed to move $file"
    fi
done

# Move batch files and scripts
echo "Moving batch files..."
for file in *.bat *.ps1; do
    if [[ -f "$file" ]]; then
        echo "  Moving $file → scripts/deployment/"
        mkdir -p scripts/deployment
        mv "$file" scripts/deployment/ 2>/dev/null || echo "    Failed to move $file"
    fi
done

# Move config files
echo "Moving configuration files..."
for file in *.json; do
    if [[ -f "$file" && "$file" != "package.json" && "$file" != "package-lock.json" && "$file" != "tsconfig.json" ]]; then
        echo "  Moving $file → config/development/"
        mv "$file" config/development/ 2>/dev/null || echo "    Failed to move $file"
    fi
done

# Move database files
echo "Moving database files..."
for file in *.db *.sqlite; do
    if [[ -f "$file" ]]; then
        echo "  Moving $file → data/"
        mkdir -p data
        mv "$file" data/ 2>/dev/null || echo "    Failed to move $file"
    fi
done

# Move backup files
echo "Moving backup files..."
for file in *.backup *.bak; do
    if [[ -f "$file" ]]; then
        echo "  Moving $file → backup/legacy/"
        mkdir -p backup/legacy
        mv "$file" backup/legacy/ 2>/dev/null || echo "    Failed to move $file"
    fi
done

# Count remaining root files
remaining=$(ls -1 | grep -v -E '^(README|CHANGELOG|CONTRIBUTING|package|tsconfig|\.git|\.env|node_modules|src|docs|config|logs|workspace|backup|scripts|tests|dist|build|temp|apps|backend|frontend|modules|LICENSE)' | wc -l)

echo ""
echo "🎯 Organization Summary:"
echo "  - Log files moved to logs/current/"
echo "  - Documentation moved to docs/operations/"
echo "  - Scripts moved to scripts/deployment/"
echo "  - Configs moved to config/development/"
echo "  - Databases moved to data/"
echo "  - Backups moved to backup/legacy/"
echo ""
echo "📊 Remaining files in root: $remaining"
echo ""

if [[ $remaining -lt 20 ]]; then
    echo "✅ SUCCESS: Root directory significantly cleaned!"
else
    echo "⚠️  Still need more organization - $remaining files remain"
fi

echo "🏁 File organization complete!"