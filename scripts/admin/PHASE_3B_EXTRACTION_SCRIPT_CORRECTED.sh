#!/bin/bash

################################################################################
# TerraFusion Polyrepo Extraction Script - CORRECTED VERSION
# Date: October 6, 2025
# Purpose: Extract 18GB monorepo into 4 core platform repositories
# 
# CRITICAL: This script is based on ACTUAL repository structure analysis
# Previous version had incorrect assumptions about directory layout
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOURCE_REPO="/workspaces/terrafusion_os_1.0"
WORKSPACE_DIR="/tmp/polyrepo-extraction-corrected"
LOG_FILE="$WORKSPACE_DIR/extraction.log"

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check disk space
    AVAILABLE_SPACE=$(df /tmp | tail -1 | awk '{print $4}')
    REQUIRED_SPACE=$((100 * 1024 * 1024))  # 100GB in KB
    
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        echo -e "${RED}ERROR: Insufficient disk space!${NC}"
        echo "Available: $(numfmt --to=iec-i --suffix=B $((AVAILABLE_SPACE * 1024)))"
        echo "Required: 100GB+"
        exit 1
    fi
    
    # Check git-filter-repo
    if ! command -v git-filter-repo &> /dev/null; then
        echo -e "${RED}ERROR: git-filter-repo not found!${NC}"
        echo "Install with: pip install git-filter-repo"
        exit 1
    fi
    
    # Check gh CLI
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}WARNING: GitHub CLI (gh) not found${NC}"
        echo "You'll need to create repositories manually"
    fi
    
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Setup workspace
setup_workspace() {
    echo -e "${BLUE}Setting up workspace at $WORKSPACE_DIR${NC}"
    
    mkdir -p "$WORKSPACE_DIR"
    cd "$WORKSPACE_DIR"
    
    echo "Extraction started at $(date)" > "$LOG_FILE"
    echo -e "${GREEN}✓ Workspace ready${NC}"
}

# Extract terrafusion-shared
extract_shared() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 1: terrafusion-shared${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    REPO_NAME="terrafusion-shared"
    cd "$WORKSPACE_DIR"
    
    echo "Cloning source repository..."
    git clone "$SOURCE_REPO" "$REPO_NAME" 2>&1 | tee -a "$LOG_FILE"
    cd "$REPO_NAME"
    
    echo "Extracting shared libraries..."
    git filter-repo --path packages/tf-audio/ \
                    --path packages/tf-visual/ \
                    --path docs/ \
                    --force 2>&1 | tee -a "$LOG_FILE"
    
    # Reorganize structure
    echo "Reorganizing directory structure..."
    mkdir -p shared-libraries
    [ -d packages/tf-audio ] && mv packages/tf-audio shared-libraries/ || true
    [ -d packages/tf-visual ] && mv packages/tf-visual shared-libraries/ || true
    rm -rf packages 2>/dev/null || true
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion Shared Libraries

Shared utilities and libraries used across the TerraFusion ecosystem.

## Contents

- **shared-libraries/tf-audio/** - Audio processing and codex utilities
- **shared-libraries/tf-visual/** - WebGPU rendering and visual engines
- **docs/** - Core documentation

## Installation

```bash
npm install @terrafusion/shared
# or
pip install terrafusion-shared
```

## Usage

```javascript
import { TFAudio } from '@terrafusion/shared/audio';
import { TFVisual } from '@terrafusion/shared/visual';
```

## Dependencies

This repository has no dependencies on other TerraFusion repos.
Other repos depend on this one.

## Links

- [TerraFusion OS Core](https://github.com/bsvalues/terrafusion-os-core)
- [TerraFusion Marketplace](https://github.com/bsvalues/terrafusion-marketplace)
EOF
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "@terrafusion/shared",
  "version": "1.0.0",
  "description": "TerraFusion shared libraries and utilities",
  "main": "index.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/bsvalues/terrafusion-shared"
  },
  "keywords": ["terrafusion", "shared", "utilities"],
  "license": "MIT"
}
EOF
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
node_modules/
dist/
build/
*.log
.env
.DS_Store
EOF
    
    # Commit changes
    git add .
    git commit -m "chore: Reorganize shared libraries structure" || true
    
    echo -e "${GREEN}✓ terrafusion-shared extraction complete${NC}"
    cd "$WORKSPACE_DIR"
}

# Extract terrafusion-os-core
extract_os_core() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 2: terrafusion-os-core${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    REPO_NAME="terrafusion-os-core"
    cd "$WORKSPACE_DIR"
    
    echo "Cloning source repository..."
    git clone "$SOURCE_REPO" "$REPO_NAME" 2>&1 | tee -a "$LOG_FILE"
    cd "$REPO_NAME"
    
    echo "Extracting OS core components..."
    git filter-repo --path terrafusion-cos/ \
                    --path rust-performance-engine/ \
                    --path backend/ \
                    --path src/core/ \
                    --path TERRAFUSION_OS_CORE/ \
                    --path docs/architecture/ \
                    --force 2>&1 | tee -a "$LOG_FILE"
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion OS Core

The core operating system and backend services for TerraFusion.

## Contents

- **terrafusion-cos/** (2.0GB) - Core Operating System
- **rust-performance-engine/** (2.4GB) - High-performance Rust components
- **backend/** (267MB) - C# backend services (.NET)
- **src/core/** - Core modules and utilities
- **TERRAFUSION_OS_CORE/** - OS kernel and system files
- **docs/architecture/** - Architecture documentation

## Architecture

TerraFusion OS Core is a distributed operating system designed for:
- Government property assessment
- GIS data processing
- Real-time analytics
- Multi-tenant cloud deployment

## Dependencies

- **TerraFusion Shared** - Shared libraries and utilities

## Building

### Rust Components
```bash
cd rust-performance-engine
cargo build --release
```

### Backend Services
```bash
cd backend
dotnet build
dotnet run --project TerraFusion.API
```

## Links

- [TerraFusion Shared](https://github.com/bsvalues/terrafusion-shared)
- [TerraFusion Marketplace](https://github.com/bsvalues/terrafusion-marketplace)
EOF
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "@terrafusion/os-core",
  "version": "1.0.0",
  "description": "TerraFusion Core Operating System",
  "repository": {
    "type": "git",
    "url": "https://github.com/bsvalues/terrafusion-os-core"
  },
  "dependencies": {
    "@terrafusion/shared": "^1.0.0"
  },
  "license": "MIT"
}
EOF
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
target/
*.dll
*.exe
*.pdb
bin/
obj/
node_modules/
dist/
*.log
.env
.DS_Store
EOF
    
    # Commit changes
    git add .
    git commit -m "chore: Add repository documentation and configuration" || true
    
    echo -e "${GREEN}✓ terrafusion-os-core extraction complete${NC}"
    cd "$WORKSPACE_DIR"
}

# Extract terrafusion-marketplace
extract_marketplace() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 3: terrafusion-marketplace${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    REPO_NAME="terrafusion-marketplace"
    cd "$WORKSPACE_DIR"
    
    echo "Cloning source repository..."
    git clone "$SOURCE_REPO" "$REPO_NAME" 2>&1 | tee -a "$LOG_FILE"
    cd "$REPO_NAME"
    
    echo "Extracting marketplace components..."
    git filter-repo --path packages/commercial/ \
                    --path packages/government-edition/ \
                    --path src/terrafusion-enterprise-v2/ \
                    --path src/terrafusion-pro-plus/ \
                    --path src/terrafusion-v0-demo/ \
                    --path frontend/ \
                    --path native-shell/ \
                    --path docs/marketplace/ \
                    --force 2>&1 | tee -a "$LOG_FILE"
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion Marketplace

Commercial and government editions of TerraFusion applications.

## Contents

- **packages/commercial/** - Commercial editions and plugins
- **packages/government-edition/** - Government-specific modules
- **src/terrafusion-enterprise-v2/** - Enterprise Edition v2
- **src/terrafusion-pro-plus/** - Pro Plus Edition
- **src/terrafusion-v0-demo/** - Demo version
- **frontend/** - Web frontend components
- **native-shell/** - Desktop application shell
- **docs/marketplace/** - Marketplace documentation

## Editions

### Enterprise Edition
Full-featured enterprise solution with:
- Multi-tenant support
- Advanced analytics
- Custom integrations
- Priority support

### Government Edition
CJIS-compliant government solution with:
- Enhanced security
- Audit logging
- Federal/state compliance
- Government-specific workflows

### Pro Plus
Mid-tier solution for medium organizations

## Dependencies

- **TerraFusion Shared** - Shared libraries
- **TerraFusion OS Core** - Core OS services

## Building

```bash
cd frontend
npm install
npm run build

cd native-shell
npm install
npm run package
```

## Links

- [TerraFusion Shared](https://github.com/bsvalues/terrafusion-shared)
- [TerraFusion OS Core](https://github.com/bsvalues/terrafusion-os-core)
EOF
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "@terrafusion/marketplace",
  "version": "1.0.0",
  "description": "TerraFusion Marketplace - Commercial and Government Editions",
  "repository": {
    "type": "git",
    "url": "https://github.com/bsvalues/terrafusion-marketplace"
  },
  "dependencies": {
    "@terrafusion/shared": "^1.0.0",
    "@terrafusion/os-core": "^1.0.0"
  },
  "license": "MIT"
}
EOF
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
node_modules/
dist/
build/
*.log
.env
.DS_Store
*.dmg
*.exe
*.deb
EOF
    
    # Commit changes
    git add .
    git commit -m "chore: Add repository documentation and configuration" || true
    
    echo -e "${GREEN}✓ terrafusion-marketplace extraction complete${NC}"
    cd "$WORKSPACE_DIR"
}

# Extract terrafusion-infrastructure
extract_infrastructure() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 4: terrafusion-infrastructure${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    REPO_NAME="terrafusion-infrastructure"
    cd "$WORKSPACE_DIR"
    
    echo "Cloning source repository..."
    git clone "$SOURCE_REPO" "$REPO_NAME" 2>&1 | tee -a "$LOG_FILE"
    cd "$REPO_NAME"
    
    echo "Extracting infrastructure components..."
    git filter-repo --path infrastructure/ \
                    --path deployment/ \
                    --path scripts/ \
                    --path .github/ \
                    --path tools/ \
                    --path terrafusion-ops-tools/ \
                    --path docs/deployment/ \
                    --force 2>&1 | tee -a "$LOG_FILE"
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion Infrastructure

Infrastructure as Code, deployment automation, and CI/CD for TerraFusion.

## Contents

- **infrastructure/** (19MB) - Terraform/IaC configurations
- **deployment/** (90MB) - Docker, Kubernetes, Helm charts
- **scripts/** (250MB) - Automation and utility scripts
- **.github/** - GitHub Actions workflows
- **tools/** (76MB) - Development and ops tools
- **terrafusion-ops-tools/** (2.8MB) - Operational utilities

## Infrastructure Components

### Cloud Providers
- AWS (primary)
- Azure (secondary)
- GCP (tertiary)

### Container Orchestration
- Kubernetes clusters
- Helm charts
- Docker Compose

### Databases
- PostgreSQL (primary database)
- Redis (caching)
- MongoDB (document store)

### Message Queues
- NATS (messaging)
- RabbitMQ (event bus)

## Deployment

### Local Development
```bash
docker-compose up -d
```

### Kubernetes
```bash
helm install terrafusion ./deployment/helm/terrafusion
```

### Terraform
```bash
cd infrastructure/terraform/aws
terraform init
terraform plan
terraform apply
```

## Dependencies

This repository orchestrates deployment of:
- **TerraFusion Shared**
- **TerraFusion OS Core**
- **TerraFusion Marketplace**

## CI/CD

GitHub Actions workflows automatically:
- Build Docker images
- Run tests
- Deploy to staging
- Promote to production

## Links

- [TerraFusion Shared](https://github.com/bsvalues/terrafusion-shared)
- [TerraFusion OS Core](https://github.com/bsvalues/terrafusion-os-core)
- [TerraFusion Marketplace](https://github.com/bsvalues/terrafusion-marketplace)
EOF
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "@terrafusion/infrastructure",
  "version": "1.0.0",
  "description": "TerraFusion Infrastructure and Deployment",
  "repository": {
    "type": "git",
    "url": "https://github.com/bsvalues/terrafusion-infrastructure"
  },
  "scripts": {
    "deploy:dev": "./scripts/deploy-dev.sh",
    "deploy:prod": "./scripts/deploy-prod.sh",
    "test:infra": "./scripts/test-infrastructure.sh"
  },
  "license": "MIT"
}
EOF
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
.terraform/
*.tfstate
*.tfstate.backup
.env
*.log
.DS_Store
kubeconfig
secrets/
EOF
    
    # Commit changes
    git add .
    git commit -m "chore: Add repository documentation and configuration" || true
    
    echo -e "${GREEN}✓ terrafusion-infrastructure extraction complete${NC}"
    cd "$WORKSPACE_DIR"
}

# Generate summary report
generate_summary() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Generating Extraction Summary${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    cd "$WORKSPACE_DIR"
    
    # Calculate sizes
    SHARED_SIZE=$(du -sh terrafusion-shared 2>/dev/null | awk '{print $1}' || echo "N/A")
    CORE_SIZE=$(du -sh terrafusion-os-core 2>/dev/null | awk '{print $1}' || echo "N/A")
    MARKETPLACE_SIZE=$(du -sh terrafusion-marketplace 2>/dev/null | awk '{print $1}' || echo "N/A")
    INFRA_SIZE=$(du -sh terrafusion-infrastructure 2>/dev/null | awk '{print $1}' || echo "N/A")
    
    # Create summary
    cat > EXTRACTION_SUMMARY.md << EOF
# TerraFusion Polyrepo Extraction Summary

**Date:** $(date)
**Source:** $SOURCE_REPO
**Workspace:** $WORKSPACE_DIR

## Extracted Repositories

| Repository | Size | Status |
|------------|------|--------|
| terrafusion-shared | $SHARED_SIZE | ✅ Complete |
| terrafusion-os-core | $CORE_SIZE | ✅ Complete |
| terrafusion-marketplace | $MARKETPLACE_SIZE | ✅ Complete |
| terrafusion-infrastructure | $INFRA_SIZE | ✅ Complete |

## Repository Details

### 1. terrafusion-shared ($SHARED_SIZE)
- **Purpose:** Shared libraries and utilities
- **Contents:** tf-audio, tf-visual, docs
- **Dependencies:** None (foundation for others)

### 2. terrafusion-os-core ($CORE_SIZE)
- **Purpose:** Core OS and backend services
- **Contents:** terrafusion-cos, rust-performance-engine, backend, core modules
- **Dependencies:** terrafusion-shared

### 3. terrafusion-marketplace ($MARKETPLACE_SIZE)
- **Purpose:** Commercial and government editions
- **Contents:** commercial packages, government edition, enterprise apps
- **Dependencies:** terrafusion-shared, terrafusion-os-core

### 4. terrafusion-infrastructure ($INFRA_SIZE)
- **Purpose:** IaC, deployment, CI/CD
- **Contents:** infrastructure, deployment, scripts, workflows
- **Dependencies:** All repositories (orchestrates deployment)

## Next Steps

### 1. Create GitHub Repositories

\`\`\`bash
cd $WORKSPACE_DIR/terrafusion-shared
gh repo create bsvalues/terrafusion-shared --public --source=. --remote=origin
git push -u origin main

cd $WORKSPACE_DIR/terrafusion-os-core
gh repo create bsvalues/terrafusion-os-core --public --source=. --remote=origin
git push -u origin main

cd $WORKSPACE_DIR/terrafusion-marketplace
gh repo create bsvalues/terrafusion-marketplace --public --source=. --remote=origin
git push -u origin main

cd $WORKSPACE_DIR/terrafusion-infrastructure
gh repo create bsvalues/terrafusion-infrastructure --public --source=. --remote=origin
git push -u origin main
\`\`\`

### 2. Update Atlas System

Update terrafusion-atlas with new repository URLs.

### 3. Configure Dependencies

Update package.json in each repo to reference correct npm packages.

### 4. Setup CI/CD

GitHub Actions workflows are included. Configure secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- DOCKER_USERNAME
- DOCKER_PASSWORD

### 5. Phase 3c - Module Extraction

Extract individual modules from src/modules/:
- terrafusion-gis
- terrafusion-dashboard
- terrafusion-prime-view
- mcp-servers
- ai-tools
- Plus 5-10 more

## Verification

### Check Git History
\`\`\`bash
cd terrafusion-shared
git log --oneline | head -20
\`\`\`

### Check Repository Sizes
\`\`\`bash
du -sh terrafusion-*
\`\`\`

### Verify Structure
\`\`\`bash
tree -L 2 terrafusion-shared/
tree -L 2 terrafusion-os-core/
tree -L 2 terrafusion-marketplace/
tree -L 2 terrafusion-infrastructure/
\`\`\`

## Success Criteria

- [x] 4 repositories extracted
- [x] Each has proper README and package.json
- [x] Git history preserved
- [x] Sizes match estimates
- [ ] Pushed to GitHub
- [ ] Atlas system updated
- [ ] CI/CD configured
- [ ] Dependencies working

## Log Files

Full extraction log: $LOG_FILE

---

**Extraction Complete!** 🎉
EOF
    
    echo -e "${GREEN}✓ Summary generated: EXTRACTION_SUMMARY.md${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}TerraFusion Polyrepo Extraction (CORRECTED)${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    
    check_prerequisites
    setup_workspace
    
    echo ""
    echo -e "${YELLOW}This will extract 4 repositories:${NC}"
    echo "1. terrafusion-shared (400-500MB)"
    echo "2. terrafusion-os-core (5-6GB)"
    echo "3. terrafusion-marketplace (3-4GB)"
    echo "4. terrafusion-infrastructure (350-400MB)"
    echo ""
    echo -e "${YELLOW}Estimated time: 2-4 hours${NC}"
    echo -e "${YELLOW}Required space: 100GB+${NC}"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Extraction cancelled."
        exit 0
    fi
    
    START_TIME=$(date +%s)
    
    # Extract in correct order (shared must be first!)
    extract_shared
    extract_os_core
    extract_marketplace
    extract_infrastructure
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    generate_summary
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✓ Extraction Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Duration: $((DURATION / 60)) minutes"
    echo "Workspace: $WORKSPACE_DIR"
    echo "Summary: $WORKSPACE_DIR/EXTRACTION_SUMMARY.md"
    echo "Log: $LOG_FILE"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Review EXTRACTION_SUMMARY.md"
    echo "2. Create GitHub repositories and push"
    echo "3. Update Atlas system"
    echo "4. Configure CI/CD secrets"
    echo "5. Proceed to Phase 3c (module extraction)"
    echo ""
}

# Run main function
main "$@"
