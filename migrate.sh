#!/usr/bin/env bash
# migrate.sh - Intelligent, non-destructive migration with AI preservation

set -euo pipefail

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     TerraFusion Intelligent Migration System v2.0${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Safety checks
if [ ! -d "AUDIT_"* ]; then
    echo -e "${RED}❌ ERROR: No audit found. Run audit.sh first!${NC}"
    exit 1
fi

# Configuration
BACKUP_DIR="BACKUP_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="migration_$(date +%Y%m%d_%H%M%S).log"

# Create backup
echo -e "${YELLOW}🔒 Creating complete backup...${NC}"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" 2>/dev/null || true
echo "Backup created at: $BACKUP_DIR" | tee -a "$LOG_FILE"

# Create new structure
echo -e "${GREEN}📁 Creating new repository structure...${NC}"
mkdir -p terrafusion/{apps,services,plugins,libs,tools}
mkdir -p terrafusion-codex/{01_ARCHITECTURE,02_PROCUREMENT,03_MIGRATION,04_MARKETPLACE,05_OS_PITCH,06_PLUGIN_DEV,07_AI_ARSENAL,08_SALES_STRATEGY,99_ADRS}
mkdir -p terrafusion-ops/{scripts,monitoring,pipelines,terraform,k8s,docker}
mkdir -p terrafusion-ai-arsenal/{agents,prompts,workflows,tools,knowledge}
mkdir -p terrafusion-swarm/{orchestration,pipelines,monitoring,experiments}

# Create structure validation
mkdir -p workspace/ai-temp workspace/ai-quarantine
mkdir -p logs/{audit,migration,health}
mkdir -p backup/{before-ai-changes,emergency,before-organization}

# Intelligent file classification and migration
echo -e "${BLUE}🧠 Intelligent file classification in progress...${NC}"

classify_and_move() {
    local file="$1"
    local dest=""
    
    # Skip if file doesn't exist or is in our new directories
    [[ ! -f "$file" ]] && return
    [[ "$file" == "./terrafusion"* ]] && return
    [[ "$file" == "./BACKUP_"* ]] && return
    [[ "$file" == "./AUDIT_"* ]] && return
    [[ "$file" == "./workspace"* ]] && return
    [[ "$file" == "./logs"* ]] && return
    [[ "$file" == "./backup"* ]] && return
    
    # Classification logic for TerraFusion OS specific patterns
    if [[ "$file" == *".md" ]] && [[ "$file" == *"ARCHITECTURE"* ]]; then
        dest="terrafusion-codex/01_ARCHITECTURE/"
    elif [[ "$file" == *".md" ]] && [[ "$file" == *"PROCUREMENT"* ]]; then
        dest="terrafusion-codex/02_PROCUREMENT/"
    elif [[ "$file" == *".md" ]] && [[ "$file" == *"MIGRATION"* ]]; then
        dest="terrafusion-codex/03_MIGRATION/"
    elif [[ "$file" == *".md" ]] && [[ "$file" == *"MARKETPLACE"* ]]; then
        dest="terrafusion-codex/04_MARKETPLACE/"
    elif [[ "$file" == *".md" ]] && [[ "$file" == *"CLAUDE"* ]]; then
        dest="terrafusion-codex/07_AI_ARSENAL/"
    elif [[ "$file" == *"agent"* ]] || [[ "$file" == *".agent" ]]; then
        dest="terrafusion-ai-arsenal/agents/"
    elif [[ "$file" == *"workflow"* ]] || [[ "$file" == *".workflow" ]]; then
        dest="terrafusion-ai-arsenal/workflows/"
    elif [[ "$file" == *"prompt"* ]] || [[ "$file" == *".prompt" ]]; then
        dest="terrafusion-ai-arsenal/prompts/"
    elif [[ "$file" == *"swarm"* ]] || [[ "$file" == *"orchestr"* ]]; then
        dest="terrafusion-swarm/orchestration/"
    elif [[ "$file" == *"pipeline"* ]]; then
        dest="terrafusion-swarm/pipelines/"
    elif [[ "$file" == *"deploy"* ]] || [[ "$file" == *".sh" ]]; then
        dest="terrafusion-ops/scripts/"
    elif [[ "$file" == *"docker"* ]] || [[ "$file" == *"Dockerfile"* ]]; then
        dest="terrafusion-ops/docker/"
    elif [[ "$file" == *".tf" ]] || [[ "$file" == *"terraform"* ]]; then
        dest="terrafusion-ops/terraform/"
    elif [[ "$file" == *"k8s"* ]] || [[ "$file" == *"kubernetes"* ]]; then
        dest="terrafusion-ops/k8s/"
    elif [[ "$file" == *"test"* ]] || [[ "$file" == *"spec"* ]]; then
        dest="terrafusion/tools/testing/"
    elif [[ "$file" == *".ts" ]] || [[ "$file" == *".tsx" ]] || [[ "$file" == *".js" ]] || [[ "$file" == *".jsx" ]]; then
        if [[ "$file" == *"component"* ]] || [[ "$file" == *"ui"* ]] || [[ "$file" == *"design"* ]]; then
            dest="terrafusion/libs/design-system/"
        elif [[ "$file" == *"service"* ]] || [[ "$file" == *"api"* ]] || [[ "$file" == *"backend"* ]]; then
            dest="terrafusion/services/"
        elif [[ "$file" == *"app"* ]] || [[ "$file" == *"frontend"* ]]; then
            dest="terrafusion/apps/"
        elif [[ "$file" == *"lib"* ]] || [[ "$file" == *"util"* ]]; then
            dest="terrafusion/libs/"
        else
            dest="terrafusion/apps/"
        fi
    elif [[ "$file" == *".cs" ]] || [[ "$file" == *".csproj" ]]; then
        dest="terrafusion/services/gateway/"
    elif [[ "$file" == *".py" ]] && [[ "$file" == *"ai"* ]]; then
        dest="terrafusion-ai-arsenal/tools/"
    elif [[ "$file" == *".json" ]] && [[ "$file" == *"package"* ]]; then
        # Keep package.json files in their respective directories
        return
    elif [[ "$file" == *".json" ]] && [[ "$file" == *"config"* ]]; then
        dest="terrafusion/tools/config/"
    fi
    
    if [[ -n "$dest" ]]; then
        mkdir -p "$dest"
        cp "$file" "$dest/" 2>/dev/null
        echo "  Classified: $file → $dest" >> "$LOG_FILE"
    fi
}

# Process files intelligently
echo -e "${BLUE}📊 Processing 6,000+ files intelligently...${NC}"
file_count=0
while IFS= read -r file; do
    classify_and_move "$file"
    ((file_count++))
    if [ $((file_count % 500)) -eq 0 ]; then
        echo -e "${YELLOW}  Processed $file_count files...${NC}"
    fi
done < <(find . -type f -not -path "./terrafusion*" -not -path "./BACKUP_*" -not -path "./AUDIT_*" -not -path "./.git/*" -not -path "./workspace/*" -not -path "./logs/*" -not -path "./backup/*")

echo -e "${GREEN}✅ Migration structure created successfully!${NC}"
echo -e "${GREEN}📊 Processed $file_count files total${NC}"
echo -e "${BLUE}📋 Migration log: $LOG_FILE${NC}"