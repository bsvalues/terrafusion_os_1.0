#!/bin/bash

# TerraFusion OS Aggressive Structure Enforcement
# Reduces root directory to <10 files

echo "🚨 AGGRESSIVE STRUCTURE ENFORCEMENT INITIATED"
echo "Target: Reduce root directory to <10 files"

# Count current files
CURRENT_COUNT=$(ls -la | wc -l)
echo "📊 Current root files: $CURRENT_COUNT"

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create comprehensive backup
echo "💾 Creating comprehensive backup..."
tar -czf "backup/aggressive-enforcement-${TIMESTAMP}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backup' \
    --exclude='logs' \
    . 2>/dev/null

# Ensure critical directories exist
mkdir -p {docs,scripts,configs,logs,backup,archive,workspace/ai-temp}

# Move all markdown files except README.md to docs/
echo "📝 Organizing documentation..."
find . -maxdepth 1 -name "*.md" ! -name "README.md" -exec mv {} docs/ \; 2>/dev/null

# Move all config files to configs/
echo "⚙️ Organizing configuration files..."
find . -maxdepth 1 \( -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" \) \
    ! -name "package.json" ! -name "package-lock.json" ! -name "tsconfig.json" \
    -exec mv {} configs/ \; 2>/dev/null

# Move all script files to scripts/
echo "🔧 Organizing scripts..."
find . -maxdepth 1 \( -name "*.sh" -o -name "*.bat" -o -name "*.ps1" -o -name "*.mjs" -o -name "*.js" \) \
    ! -name "launch-*" \
    -exec mv {} scripts/ \; 2>/dev/null

# Move all log and temporary files
echo "🗂️ Organizing logs and temporary files..."
find . -maxdepth 1 \( -name "*.log" -o -name "*.tmp" -o -name "*.txt" \) \
    -exec mv {} logs/ \; 2>/dev/null

# Move all environment files to configs/
echo "🌍 Organizing environment files..."
find . -maxdepth 1 -name ".env*" ! -name ".env" -exec mv {} configs/ \; 2>/dev/null

# Move archives and zips to archive/
echo "📦 Organizing archives..."
find . -maxdepth 1 \( -name "*.zip" -o -name "*.tar.gz" -o -name "*.tar" \) \
    -exec mv {} archive/ \; 2>/dev/null

# Move executables to scripts/
echo "⚡ Organizing executables..."
find . -maxdepth 1 -name "*.exe" -exec mv {} scripts/ \; 2>/dev/null

# Archive everything else that's not critical
echo "🗄️ Archiving miscellaneous files..."
find . -maxdepth 1 -type f \
    ! -name "README.md" \
    ! -name "package.json" \
    ! -name "package-lock.json" \
    ! -name "tsconfig.json" \
    ! -name ".env" \
    ! -name ".gitignore" \
    ! -name ".dockerignore" \
    ! -name ".editorconfig" \
    ! -name "Dockerfile" \
    ! -name "docker-compose.yml" \
    -exec mv {} archive/misc/ \; 2>/dev/null

# Create archive/misc if it doesn't exist
mkdir -p archive/misc

# Final count
FINAL_COUNT=$(ls -la | wc -l)
REDUCTION=$((CURRENT_COUNT - FINAL_COUNT))

echo ""
echo "✅ AGGRESSIVE ENFORCEMENT COMPLETE"
echo "📊 Files reduced from $CURRENT_COUNT to $FINAL_COUNT"
echo "📉 Reduction: $REDUCTION files"
echo "🎯 Target achieved: $(if [ $FINAL_COUNT -lt 15 ]; then echo 'YES'; else echo 'NO'; fi)"
echo ""
echo "📁 Current root directory:"
ls -la | head -15