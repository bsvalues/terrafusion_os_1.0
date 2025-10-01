#!/usr/bin/env bash
# clean-migration.sh - Consolidate scattered work and perform clean migration
# This handles the Sept 13 partial migration + Sept 15 new work situation

set -euo pipefail

# Color codes for visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     TerraFusion Clean Migration - Consolidation Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="FULL_BACKUP_${TIMESTAMP}"
CONSOLIDATION_DIR="CONSOLIDATED_${TIMESTAMP}"
LOG_FILE="clean_migration_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Phase 1: Complete Inventory
log "${YELLOW}Phase 1: Creating Complete Inventory${NC}"

log "  Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup EVERYTHING first
log "  Backing up entire current state..."
cp -r . "$BACKUP_DIR/" 2>/dev/null || true

# Create inventory of all locations
cat > "$BACKUP_DIR/inventory.txt" << EOF
INVENTORY OF SCATTERED FILES
Generated: $(date)

ROOT LEVEL:
$(find . -maxdepth 1 -type f -name "*.md" -o -name "*.sh" -o -name "*.py" 2>/dev/null | sort)

OPS (NEW - Sept 15):
$(find ./ops -type f 2>/dev/null | sort || echo "  Directory not found")

TERRAFUSION (Sept 13 Migration):
$(find ./terrafusion -type f 2>/dev/null | head -20 | sort || echo "  Directory not found")

TERRAFUSION-OPS (Sept 13 Migration):
$(find ./terrafusion-ops -type f 2>/dev/null | head -20 | sort || echo "  Directory not found")

TERRAFUSION-CODEX (Sept 13 Migration):
$(find ./terrafusion-codex -type f 2>/dev/null | head -20 | sort || echo "  Directory not found")

CHAMPIONSHIP/SCRIPTS (Original):
$(find ./championship/scripts -type f 2>/dev/null | head -20 | sort || echo "  Directory not found")

AI/AGENT FILES:
$(find . -name "*.agent" -o -name "*.workflow" -o -name "*swarm*" 2>/dev/null | sort)
EOF

log "  Inventory saved to $BACKUP_DIR/inventory.txt"

# Phase 2: Consolidation Strategy
log "${YELLOW}Phase 2: Creating Consolidation Plan${NC}"

mkdir -p "$CONSOLIDATION_DIR"

# Determine what needs consolidation
NEEDS_CONSOLIDATION=""

# Check for duplicate ops directories
if [[ -d "./ops" ]] && [[ -d "./terrafusion-ops" ]]; then
    log "  ⚠️  Found duplicate ops directories - will consolidate"
    NEEDS_CONSOLIDATION="ops"
fi

# Check for scattered documentation
DOC_COUNT=$(find . -maxdepth 1 -name "*.md" | wc -l)
if [[ $DOC_COUNT -gt 3 ]]; then
    log "  ⚠️  Found $DOC_COUNT markdown files in root - will organize"
fi

# Phase 3: Smart Consolidation
log "${YELLOW}Phase 3: Performing Smart Consolidation${NC}"

# Create the proper structure
log "  Creating clean structure in $CONSOLIDATION_DIR"

mkdir -p "$CONSOLIDATION_DIR"/{terrafusion,terrafusion-codex,terrafusion-ops,terrafusion-ai-arsenal,terrafusion-swarm}

# 3.1: Consolidate Ops (merge new ops/ with terrafusion-ops/)
if [[ -d "./ops" ]]; then
    log "  Consolidating ops directories..."
    
    # Copy new ops framework (Sept 15) as base
    cp -r ./ops/* "$CONSOLIDATION_DIR/terrafusion-ops/" 2>/dev/null || true
    
    # Merge in old terrafusion-ops content (Sept 13)
    if [[ -d "./terrafusion-ops" ]]; then
        # Copy non-duplicate files from old ops
        for file in $(find ./terrafusion-ops -type f); do
            rel_path=${file#./terrafusion-ops/}
            if [[ ! -f "$CONSOLIDATION_DIR/terrafusion-ops/$rel_path" ]]; then
                mkdir -p "$(dirname "$CONSOLIDATION_DIR/terrafusion-ops/$rel_path")"
                cp "$file" "$CONSOLIDATION_DIR/terrafusion-ops/$rel_path"
                log "    Merged: $rel_path"
            fi
        done
    fi
    
    # Add championship scripts if they exist
    if [[ -d "./championship/scripts" ]]; then
        log "  Integrating championship scripts..."
        mkdir -p "$CONSOLIDATION_DIR/terrafusion-ops/championship"
        cp -r ./championship/scripts "$CONSOLIDATION_DIR/terrafusion-ops/championship/"
    fi
fi

# 3.2: Consolidate Core Code
log "  Consolidating core application code..."

# If terrafusion directory exists from Sept 13 migration, use it
if [[ -d "./terrafusion" ]]; then
    cp -r ./terrafusion/* "$CONSOLIDATION_DIR/terrafusion/" 2>/dev/null || true
fi

# Look for app code in root that should be in core
for dir in apps services libs plugins tools; do
    if [[ -d "./$dir" ]]; then
        log "    Moving $dir to terrafusion/"
        cp -r "./$dir" "$CONSOLIDATION_DIR/terrafusion/"
    fi
done

# 3.3: Consolidate Documentation
log "  Consolidating documentation..."

# Create codex structure
mkdir -p "$CONSOLIDATION_DIR/terrafusion-codex"/{01_ARCHITECTURE,02_PROCUREMENT,03_MIGRATION,04_MARKETPLACE,05_OS_PITCH,06_PLUGIN_DEV,07_AI_ARSENAL,08_SALES_STRATEGY,99_ADRS}

# Use existing terrafusion-codex if it exists
if [[ -d "./terrafusion-codex" ]]; then
    cp -r ./terrafusion-codex/* "$CONSOLIDATION_DIR/terrafusion-codex/" 2>/dev/null || true
fi

# Move root-level docs to appropriate codex folders
for doc in *.md; do
    if [[ -f "$doc" ]]; then
        case "$doc" in
            *ARCHITECTURE*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/01_ARCHITECTURE/"
                log "    Moved $doc to ARCHITECTURE"
                ;;
            *PROCUREMENT*|*WASHINGTON*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/02_PROCUREMENT/"
                log "    Moved $doc to PROCUREMENT"
                ;;
            *MIGRATION*|*CAMA*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/03_MIGRATION/"
                log "    Moved $doc to MIGRATION"
                ;;
            *MARKETPLACE*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/04_MARKETPLACE/"
                log "    Moved $doc to MARKETPLACE"
                ;;
            *OS*|*PRESENTATION*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/05_OS_PITCH/"
                log "    Moved $doc to OS_PITCH"
                ;;
            *PLUGIN*|*DEVELOPER*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/06_PLUGIN_DEV/"
                log "    Moved $doc to PLUGIN_DEV"
                ;;
            *AI*|*ARSENAL*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/07_AI_ARSENAL/"
                log "    Moved $doc to AI_ARSENAL"
                ;;
            *COUNTY*|*ATTACK*)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/08_SALES_STRATEGY/"
                log "    Moved $doc to SALES_STRATEGY"
                ;;
            README.md)
                # Keep README in root
                ;;
            *)
                cp "$doc" "$CONSOLIDATION_DIR/terrafusion-codex/99_ADRS/"
                log "    Moved $doc to ADRS"
                ;;
        esac
    fi
done

# 3.4: Consolidate AI/Agent Assets
log "  Consolidating AI and Agent assets..."

mkdir -p "$CONSOLIDATION_DIR/terrafusion-ai-arsenal"/{agents,workflows,prompts,tools}
mkdir -p "$CONSOLIDATION_DIR/terrafusion-swarm"/{orchestration,pipelines,monitoring}

# Find and move all AI-related files
find . -type f \( -name "*.agent" -o -name "*.workflow" -o -name "*.prompt" \) 2>/dev/null | while read -r file; do
    filename=$(basename "$file")
    case "$filename" in
        *.agent)
            cp "$file" "$CONSOLIDATION_DIR/terrafusion-ai-arsenal/agents/"
            log "    Moved agent: $filename"
            ;;
        *.workflow)
            cp "$file" "$CONSOLIDATION_DIR/terrafusion-ai-arsenal/workflows/"
            log "    Moved workflow: $filename"
            ;;
        *.prompt)
            cp "$file" "$CONSOLIDATION_DIR/terrafusion-ai-arsenal/prompts/"
            log "    Moved prompt: $filename"
            ;;
    esac
done

# Find and move swarm-related files
find . -type f -name "*swarm*" -o -name "*orchestr*" 2>/dev/null | while read -r file; do
    if [[ ! "$file" =~ BACKUP|CONSOLIDATED ]]; then
        cp "$file" "$CONSOLIDATION_DIR/terrafusion-swarm/orchestration/" 2>/dev/null || true
        log "    Moved swarm file: $(basename "$file")"
    fi
done

# Phase 4: Create Clean Workspace Configuration
log "${YELLOW}Phase 4: Creating Clean Workspace Configuration${NC}"

cat > "$CONSOLIDATION_DIR/TerraFusion_OS_Clean.code-workspace" << 'WORKSPACE_EOF'
{
  "folders": [
    {
      "name": "🏛️ TerraFusion Core",
      "path": "terrafusion"
    },
    {
      "name": "📚 TerraFusion Codex",
      "path": "terrafusion-codex"
    },
    {
      "name": "⚙️ TerraFusion Ops",
      "path": "terrafusion-ops"
    },
    {
      "name": "🤖 TerraFusion AI Arsenal",
      "path": "terrafusion-ai-arsenal"
    },
    {
      "name": "🐝 TerraFusion Swarm",
      "path": "terrafusion-swarm"
    }
  ],
  "settings": {
    "workbench.colorTheme": "Default Dark+",
    "editor.formatOnSave": true,
    "files.trimTrailingWhitespace": true,
    "files.insertFinalNewline": true,
    "TerraFusion.Status": "CLEAN_MIGRATION_COMPLETE"
  }
}
WORKSPACE_EOF

# Phase 5: Validation
log "${YELLOW}Phase 5: Validating Consolidation${NC}"

# Count files in each section
log "  File counts in consolidated structure:"
log "    Core: $(find "$CONSOLIDATION_DIR/terrafusion" -type f 2>/dev/null | wc -l) files"
log "    Codex: $(find "$CONSOLIDATION_DIR/terrafusion-codex" -type f 2>/dev/null | wc -l) files"
log "    Ops: $(find "$CONSOLIDATION_DIR/terrafusion-ops" -type f 2>/dev/null | wc -l) files"
log "    AI Arsenal: $(find "$CONSOLIDATION_DIR/terrafusion-ai-arsenal" -type f 2>/dev/null | wc -l) files"
log "    Swarm: $(find "$CONSOLIDATION_DIR/terrafusion-swarm" -type f 2>/dev/null | wc -l) files"

# Check for critical files
log "  Checking for critical assets:"

CRITICAL_FILES=(
    "terrafusion-ops/shims/safe-run.sh"
    "terrafusion-ops/inventory.yaml"
    "terrafusion-ops/championship/scripts/demo/demo_benton.sh"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [[ -f "$CONSOLIDATION_DIR/$file" ]]; then
        log "    ✅ Found: $file"
    else
        log "    ⚠️  Missing: $file"
    fi
done

# Phase 6: Create Migration Report
log "${YELLOW}Phase 6: Generating Migration Report${NC}"

cat > "$CONSOLIDATION_DIR/MIGRATION_REPORT.md" << EOF
# TerraFusion Clean Migration Report
Generated: $(date)

## Summary
- **Backup Location**: $BACKUP_DIR/
- **Consolidated Location**: $CONSOLIDATION_DIR/
- **Log File**: $LOG_FILE

## Statistics
- Core Files: $(find "$CONSOLIDATION_DIR/terrafusion" -type f 2>/dev/null | wc -l)
- Documentation: $(find "$CONSOLIDATION_DIR/terrafusion-codex" -type f 2>/dev/null | wc -l)
- Ops Scripts: $(find "$CONSOLIDATION_DIR/terrafusion-ops" -type f 2>/dev/null | wc -l)
- AI Assets: $(find "$CONSOLIDATION_DIR/terrafusion-ai-arsenal" -type f 2>/dev/null | wc -l)
- Swarm Files: $(find "$CONSOLIDATION_DIR/terrafusion-swarm" -type f 2>/dev/null | wc -l)

## Consolidation Actions
- Merged ./ops (Sept 15) with ./terrafusion-ops (Sept 13)
- Organized scattered documentation into codex structure
- Preserved all AI/agent workflows
- Integrated championship scripts

## Next Steps
1. Review consolidated structure in $CONSOLIDATION_DIR/
2. If satisfied, run: ./apply-clean-migration.sh
3. Open new workspace: code $CONSOLIDATION_DIR/TerraFusion_OS_Clean.code-workspace
4. Delete old scattered directories

## Validation Checklist
- [ ] All county demo scripts present
- [ ] Safe-run wrapper functional
- [ ] AI agent files preserved
- [ ] Documentation organized
- [ ] No duplicate files
EOF

# Phase 7: Create Apply Script
log "${YELLOW}Phase 7: Creating Apply Script${NC}"

cat > "./apply-clean-migration.sh" << 'APPLY_EOF'
#!/usr/bin/env bash
# apply-clean-migration.sh - Apply the consolidated structure

set -euo pipefail

CONSOLIDATION_DIR=$(ls -dt CONSOLIDATED_* | head -1)

if [[ -z "$CONSOLIDATION_DIR" ]]; then
    echo "❌ No consolidation directory found!"
    exit 1
fi

echo "This will replace the current scattered structure with: $CONSOLIDATION_DIR"
echo "The current state is backed up in FULL_BACKUP_*"
echo ""
read -p "Apply clean migration? (yes/no): " response

if [[ "$response" != "yes" ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo "Applying clean migration..."

# Remove old scattered directories
rm -rf terrafusion terrafusion-ops terrafusion-codex terrafusion-ai-arsenal terrafusion-swarm 2>/dev/null || true
rm -rf ops 2>/dev/null || true  # Remove duplicate ops

# Move consolidated structure to root
cp -r "$CONSOLIDATION_DIR"/* ./

echo "✅ Clean migration applied!"
echo ""
echo "Next steps:"
echo "1. git add -A"
echo "2. git commit -m 'Clean migration: consolidated scattered work'"
echo "3. git push"
echo "4. code TerraFusion_OS_Clean.code-workspace"
APPLY_EOF

chmod +x ./apply-clean-migration.sh

# Final Summary
echo ""
log "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
log "${GREEN}✅ CONSOLIDATION COMPLETE!${NC}"
log "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
log "📁 Backup saved to: ${BLUE}$BACKUP_DIR/${NC}"
log "📁 Consolidated structure in: ${BLUE}$CONSOLIDATION_DIR/${NC}"
log "📄 Report available at: ${BLUE}$CONSOLIDATION_DIR/MIGRATION_REPORT.md${NC}"
echo ""
log "${YELLOW}Review the consolidated structure, then run:${NC}"
log "  ${GREEN}./apply-clean-migration.sh${NC}"
echo ""
log "To rollback if needed:"
log "  ${RED}cp -r $BACKUP_DIR/* ./${NC}"