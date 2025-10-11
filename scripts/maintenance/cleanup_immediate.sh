#!/bin/bash
###############################################################################
# TerraFusion OS - Immediate Cleanup Script
# Reduces repository from 133GB to ~10-15GB
# 
# ⚠️  WARNING: This script will DELETE files. Review carefully before running.
# Recommendation: Create a complete backup OUTSIDE of Git before running.
###############################################################################

set -e  # Exit on error

echo "🎯 TerraFusion OS - Immediate Cleanup"
echo "======================================"
echo ""
echo "This script will:"
echo "  1. Remove all backup directories (~129 GB)"
echo "  2. Remove build artifacts (node_modules, dist, build) (~21 GB)"
echo "  3. Remove log files (~773 files)"
echo "  4. Update .gitignore to prevent future bloat"
echo ""
echo "⚠️  WARNING: This will DELETE files. Are you sure?"
read -p "Type 'YES' to continue: " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ Cancelled by user"
    exit 1
fi

# Get initial size
echo ""
echo "📊 Initial repository size:"
du -sh .
echo ""

###############################################################################
# PHASE 1: Remove Backup Directories (129 GB)
###############################################################################
echo "🗑️  Phase 1: Removing backup directories..."

if [ -d "backup" ]; then
    echo "  - Removing backup/ (129 GB)..."
    rm -rf backup/
fi

if [ -d "modules_backup_20250912_093232" ]; then
    echo "  - Removing modules_backup_20250912_093232/ (7 GB)..."
    rm -rf modules_backup_20250912_093232/
fi

# Remove any other backup directories
find . -maxdepth 3 -type d -name "*backup*" -o -name "*BACKUP*" -o -name "archive" | while read dir; do
    if [ "$dir" != "." ] && [ -d "$dir" ]; then
        echo "  - Removing $dir..."
        rm -rf "$dir"
    fi
done

# Remove .backup files
find . -name "*.backup" -type f -delete
echo "  ✅ Backup directories removed"
echo ""

###############################################################################
# PHASE 2: Remove Build Artifacts
###############################################################################
echo "🗑️  Phase 2: Removing build artifacts..."

# Remove node_modules (10 copies)
echo "  - Removing node_modules/ directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove dist folders (5 copies)
echo "  - Removing dist/ directories..."
find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove build folders (3 copies)
echo "  - Removing build/ directories..."
find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove .next folders (Next.js builds)
echo "  - Removing .next/ directories..."
find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove coverage reports
echo "  - Removing coverage/ directories..."
find . -name "coverage" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "  ✅ Build artifacts removed"
echo ""

###############################################################################
# PHASE 3: Remove Log Files
###############################################################################
echo "🗑️  Phase 3: Removing log files..."

# Remove all .log files
find . -name "*.log" -type f -delete 2>/dev/null || true

# Remove log directories
find . -name "logs" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "  ✅ Log files removed"
echo ""

###############################################################################
# PHASE 4: Update .gitignore
###############################################################################
echo "📝 Phase 4: Updating .gitignore..."

cat >> .gitignore << 'EOF'

###############################################################################
# TerraFusion OS - Comprehensive .gitignore
# Updated: October 5, 2025
###############################################################################

# ============================================================================
# Build Artifacts (NEVER commit these!)
# ============================================================================
node_modules/
dist/
build/
.next/
out/
target/
bin/
obj/
*.dll
*.exe
*.so
*.dylib

# ============================================================================
# Package Manager Files
# ============================================================================
package-lock.json
yarn.lock
pnpm-lock.yaml
.pnpm-store/

# ============================================================================
# Logs (NEVER commit these!)
# ============================================================================
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# ============================================================================
# Backups and Archives (NEVER commit these!)
# ============================================================================
backup/
*_backup/
*_backup_*/
*.backup
*.bak
*.old
archive/
archives/
*BACKUP*/
*backup*/

# ============================================================================
# Environment and Secrets (NEVER commit these!)
# ============================================================================
.env
.env.local
.env.*.local
.env.production
*.key
*.pem
*.p12
secrets/
credentials/

# ============================================================================
# IDE and Editor Files
# ============================================================================
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# ============================================================================
# Testing and Coverage
# ============================================================================
coverage/
.nyc_output/
*.lcov
.pytest_cache/
.coverage
htmlcov/

# ============================================================================
# Temporary Files
# ============================================================================
*.tmp
*.temp
.cache/
.temp/
tmp/

# ============================================================================
# Data Files (Use S3/MinIO instead!)
# ============================================================================
*.csv
*.xlsx
*.xls
*.shp
*.shx
*.dbf
*.geojson
data/
datasets/
*.parquet
*.sqlite
*.db

# ============================================================================
# Media Files (Use CDN/S3 instead!)
# ============================================================================
*.mp4
*.avi
*.mov
*.wmv
*.flv
*.webm
*.mkv

# ============================================================================
# Large Binary Files (Use Git LFS or object storage!)
# ============================================================================
*.zip
*.tar.gz
*.tgz
*.rar
*.7z
*.iso
*.dmg

# ============================================================================
# OS-Specific Files
# ============================================================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# ============================================================================
# Docker (Images should be in registry, not Git!)
# ============================================================================
*.tar
docker-compose.override.yml

EOF

echo "  ✅ .gitignore updated"
echo ""

###############################################################################
# PHASE 5: Summary
###############################################################################
echo "📊 Cleanup complete! New repository size:"
du -sh .
echo ""

echo "✅ SUCCESS! Next steps:"
echo ""
echo "1. Review the changes:"
echo "   git status"
echo ""
echo "2. Stage the deletions:"
echo "   git add -A"
echo ""
echo "3. Commit the cleanup:"
echo "   git commit -m 'feat: major cleanup - remove backups, build artifacts, logs'"
echo ""
echo "4. (OPTIONAL) Clean Git history to reclaim space:"
echo "   git reflog expire --expire=now --all"
echo "   git gc --prune=now --aggressive"
echo ""
echo "5. Read ARCHITECTURE_REFACTORING_PLAN.md for next steps"
echo ""
echo "⚠️  WARNING: After this cleanup, you should:"
echo "   - Archive the backup/ directory to S3/Glacier BEFORE pushing"
echo "   - Verify critical files are still present"
echo "   - Run tests to ensure nothing broke"
echo ""
