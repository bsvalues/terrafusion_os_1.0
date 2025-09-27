#!/usr/bin/env bash
# audit.sh - Complete system inventory before migration

set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "     TerraFusion Complete System Audit v2.0"
echo "═══════════════════════════════════════════════════════════"

AUDIT_DIR="AUDIT_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$AUDIT_DIR"

# 1. Complete File Inventory
echo "📊 Creating complete file inventory..."
find . -type f -name "*" | sort > "$AUDIT_DIR/all_files.txt"
find . -type d | sort > "$AUDIT_DIR/all_directories.txt"

# 2. AI Asset Detection
echo "🤖 Detecting AI/Agent assets..."
find . -type f \( \
    -name "*.agent" -o \
    -name "*.workflow" -o \
    -name "*.prompt" -o \
    -name "*swarm*" -o \
    -name "*orchestr*" -o \
    -name "*automat*" -o \
    -name "*pipeline*" \
\) > "$AUDIT_DIR/ai_assets.txt"

# 3. Configuration Files
echo "⚙️ Cataloging configurations..."
find . -type f \( \
    -name "*.json" -o \
    -name "*.yaml" -o \
    -name "*.yml" -o \
    -name "*.toml" -o \
    -name "*.env*" -o \
    -name "*.config*" \
\) > "$AUDIT_DIR/config_files.txt"

# 4. Code Statistics
echo "📈 Analyzing codebase..."
for ext in js ts tsx jsx py cs java go rs md json yaml; do
    count=$(find . -name "*.$ext" -type f | wc -l)
    echo "$ext: $count files" >> "$AUDIT_DIR/code_stats.txt"
done

# 5. Git Status
echo "📦 Capturing Git state..."
git status --porcelain > "$AUDIT_DIR/git_status.txt"
git log --oneline -50 > "$AUDIT_DIR/recent_commits.txt"
git remote -v > "$AUDIT_DIR/remotes.txt"

# 6. Dependencies
echo "📚 Documenting dependencies..."
[ -f package.json ] && cp package.json "$AUDIT_DIR/"
[ -f pnpm-lock.yaml ] && cp pnpm-lock.yaml "$AUDIT_DIR/"
[ -f yarn.lock ] && cp yarn.lock "$AUDIT_DIR/"
[ -f requirements.txt ] && cp requirements.txt "$AUDIT_DIR/"
[ -f go.mod ] && cp go.mod "$AUDIT_DIR/"

# 7. Environment Variables
echo "🔐 Securing environment variables..."
env | grep -E "^(TERRA|AI_|AGENT_|SWARM_|API_|KEY_|SECRET_)" | \
    sed 's/=.*/=<REDACTED>/' > "$AUDIT_DIR/env_vars_redacted.txt"

# 8. Running Processes
echo "⚡ Checking active processes..."
ps aux | grep -E "(node|python|java|dotnet)" | \
    grep -v grep > "$AUDIT_DIR/active_processes.txt" || true

# 9. Disk Usage
echo "💾 Calculating disk usage..."
du -sh ./* 2>/dev/null | sort -hr > "$AUDIT_DIR/disk_usage.txt"

# 10. Create Checksum
echo "🔒 Creating integrity checksum..."
find . -type f -exec sha256sum {} \; > "$AUDIT_DIR/checksums.sha256"

# Generate Report
cat > "$AUDIT_DIR/AUDIT_REPORT.md" << EOF
# TerraFusion Pre-Migration Audit Report
Generated: $(date)

## System Overview
- Total Files: $(wc -l < "$AUDIT_DIR/all_files.txt")
- Total Directories: $(wc -l < "$AUDIT_DIR/all_directories.txt")
- AI/Agent Assets: $(wc -l < "$AUDIT_DIR/ai_assets.txt")
- Configuration Files: $(wc -l < "$AUDIT_DIR/config_files.txt")

## Code Distribution
$(cat "$AUDIT_DIR/code_stats.txt")

## Critical Paths Detected
$(find . -name "*critical*" -o -name "*important*" -o -name "*production*" | head -20)

## Verification Command
To verify integrity after migration:
\`\`\`bash
sha256sum -c $AUDIT_DIR/checksums.sha256
\`\`\`

## Rollback Point Created
Full audit stored in: $AUDIT_DIR/
EOF

echo ""
echo "✅ Audit Complete! Results in: $AUDIT_DIR/"
echo "📋 Review $AUDIT_DIR/AUDIT_REPORT.md before proceeding"