#!/bin/bash
# Phase 3b: Polyrepo Extraction Automation Script
# TerraFusion OS Architectural Transformation

set -e  # Exit on error

echo "============================================"
echo "TerraFusion Polyrepo Extraction - Phase 3b"
echo "============================================"
echo ""

# Configuration
EXTRACTION_WORKSPACE="/tmp/polyrepo-extraction"
SOURCE_REPO="/workspaces/terrafusion_os_1.0"
GITHUB_ORG="bsvalues"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Setup workspace
setup_workspace() {
    echo -e "${BLUE}Setting up extraction workspace...${NC}"
    rm -rf "$EXTRACTION_WORKSPACE"
    mkdir -p "$EXTRACTION_WORKSPACE"
    cd "$EXTRACTION_WORKSPACE"
    echo -e "${GREEN}✓ Workspace ready${NC}"
}

# Extract Repository 1: terrafusion-os-core
extract_os_core() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 1: terrafusion-os-core${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    cd "$EXTRACTION_WORKSPACE"
    
    # Use cp instead of clone to avoid permissions issues
    echo "Copying source repository..."
    cp -r "$SOURCE_REPO" terrafusion-os-core
    cd terrafusion-os-core
    
    # Remove .git to start fresh
    rm -rf .git
    
    # Initialize new git repo
    git init
    git config user.email "copilot@terrafusion.io"
    git config user.name "TerraFusion Copilot"
    
    echo "Cleaning up non-core files..."
    
    # Keep only OS core files
    find . -maxdepth 1 -type d ! -name '.' ! -name '.git' \
        ! -name 'terrafusion-cos' \
        ! -name 'backend' \
        ! -name 'rust-performance-engine' \
        ! -name 'infrastructure' \
        ! -name 'docs' \
        -exec rm -rf {} + 2>/dev/null || true
    
    # Keep only relevant top-level files
    find . -maxdepth 1 -type f ! -name 'README.md' ! -name 'LICENSE' \
        ! -name '.gitignore' ! -name 'docker-compose.yml' \
        -exec rm -f {} + 2>/dev/null || true
    
    # Create proper structure
    mkdir -p src/{kernel,apis,sdk}
    
    # Move content to proper structure
    if [ -d "terrafusion-cos" ]; then
        mv terrafusion-cos/* src/kernel/ 2>/dev/null || true
        rmdir terrafusion-cos
    fi
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion OS Core

The core operating system kernel, APIs, and SDKs for the TerraFusion platform.

## Components

- **Kernel**: Core OS services (auth, routing, persistence, messaging)
- **APIs**: REST, GraphQL, and gRPC endpoints
- **SDK**: Client libraries (JavaScript, Python, Rust)
- **Backend**: C# microservices
- **Performance Engine**: Rust performance-critical code

## Architecture

TerraFusion OS Core provides the foundational platform that powers the TerraFusion ecosystem. It handles:

- Authentication and authorization
- Request routing and load balancing
- Data persistence and caching
- Event-driven messaging
- Service orchestration

## Getting Started

```bash
# Install dependencies
npm install

# Start development environment
docker-compose up -d

# Run tests
npm test
```

## Documentation

See `/docs` for detailed API documentation and architecture guides.

## License

Proprietary - TerraFusion by BSValues LLC
EOF

    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "@terrafusion/os-core",
  "version": "1.0.0",
  "description": "TerraFusion Operating System Core",
  "main": "dist/index.js",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/bsvalues/terrafusion-os-core.git"
  },
  "keywords": [
    "terrafusion",
    "operating-system",
    "microservices",
    "api"
  ],
  "author": "BSValues LLC",
  "license": "PROPRIETARY"
}
EOF

    # Create .gitignore
    cat > .gitignore << 'EOF'
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
target/
Cargo.lock
*.swp
.data/
EOF

    # Initial commit
    git add .
    git commit -m "Initial commit: TerraFusion OS Core extraction from monorepo"
    
    echo -e "${GREEN}✓ terrafusion-os-core extracted successfully${NC}"
    echo "Size: $(du -sh . | cut -f1)"
}

# Extract Repository 2: terrafusion-marketplace
extract_marketplace() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 2: terrafusion-marketplace${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    cd "$EXTRACTION_WORKSPACE"
    
    echo "Copying source repository..."
    cp -r "$SOURCE_REPO" terrafusion-marketplace
    cd terrafusion-marketplace
    
    rm -rf .git
    git init
    git config user.email "copilot@terrafusion.io"
    git config user.name "TerraFusion Copilot"
    
    echo "Cleaning up non-marketplace files..."
    
    # Keep only marketplace files
    find . -maxdepth 1 -type d ! -name '.' ! -name '.git' \
        ! -name 'packages' \
        ! -name 'frontend' \
        ! -name 'docs' \
        -exec rm -rf {} + 2>/dev/null || true
    
    # Within packages, keep only marketplace-related
    if [ -d "packages" ]; then
        cd packages
        find . -maxdepth 1 -type d ! -name '.' \
            ! -name 'commercial' \
            ! -name 'government-edition' \
            -exec rm -rf {} + 2>/dev/null || true
        cd ..
    fi
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion Marketplace

The application marketplace platform for TerraFusion OS.

## Features

- **App Catalog**: Browse and discover TerraFusion applications
- **Developer Portal**: Publish and manage your applications
- **Payment Processing**: Integrated billing and subscriptions
- **Reviews & Ratings**: Community feedback system
- **Analytics**: Usage metrics and insights

## Architecture

Built as a microservices platform with:
- React/TypeScript frontend
- Node.js backend services
- PostgreSQL database
- Redis caching
- Kubernetes deployment

## Getting Started

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test
```

## License

Proprietary - TerraFusion by BSValues LLC
EOF

    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "@terrafusion/marketplace",
  "version": "1.0.0",
  "description": "TerraFusion Application Marketplace",
  "main": "dist/index.js",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/bsvalues/terrafusion-marketplace.git"
  },
  "keywords": [
    "terrafusion",
    "marketplace",
    "app-store"
  ],
  "author": "BSValues LLC",
  "license": "PROPRIETARY"
}
EOF

    cat > .gitignore << 'EOF'
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
.next/
EOF

    git add .
    git commit -m "Initial commit: TerraFusion Marketplace extraction from monorepo"
    
    echo -e "${GREEN}✓ terrafusion-marketplace extracted successfully${NC}"
    echo "Size: $(du -sh . | cut -f1)"
}

# Extract Repository 3: terrafusion-shared
extract_shared() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 3: terrafusion-shared${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    cd "$EXTRACTION_WORKSPACE"
    
    echo "Copying source repository..."
    cp -r "$SOURCE_REPO" terrafusion-shared
    cd terrafusion-shared
    
    rm -rf .git
    git init
    git config user.email "copilot@terrafusion.io"
    git config user.name "TerraFusion Copilot"
    
    echo "Cleaning up non-shared files..."
    
    # Keep only shared utilities and common code
    find . -maxdepth 1 -type d ! -name '.' ! -name '.git' \
        ! -name 'packages' \
        ! -name 'src' \
        -exec rm -rf {} + 2>/dev/null || true
    
    # Create proper structure
    mkdir -p {lib,types,utils,config}
    
    # Extract shared utilities from src
    if [ -d "src" ]; then
        [ -d "src/core" ] && cp -r src/core/* lib/ 2>/dev/null || true
        rm -rf src
    fi
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion Shared Libraries

Common utilities, types, and configurations shared across TerraFusion platform.

## Packages

- **@terrafusion/types**: TypeScript type definitions
- **@terrafusion/utils**: Common utility functions
- **@terrafusion/config**: Shared configuration
- **@terrafusion/logger**: Logging utilities

## Usage

```typescript
import { TerraFusionClient } from '@terrafusion/shared';

const client = new TerraFusionClient({
  apiKey: process.env.TERRAFUSION_API_KEY
});
```

## Installation

```bash
npm install @terrafusion/shared
```

## License

Proprietary - TerraFusion by BSValues LLC
EOF

    cat > package.json << 'EOF'
{
  "name": "@terrafusion/shared",
  "version": "1.0.0",
  "description": "Shared libraries for TerraFusion platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/bsvalues/terrafusion-shared.git"
  },
  "keywords": [
    "terrafusion",
    "shared",
    "utilities"
  ],
  "author": "BSValues LLC",
  "license": "PROPRIETARY",
  "publishConfig": {
    "access": "restricted"
  }
}
EOF

    cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
EOF

    git add .
    git commit -m "Initial commit: TerraFusion Shared Libraries extraction from monorepo"
    
    echo -e "${GREEN}✓ terrafusion-shared extracted successfully${NC}"
    echo "Size: $(du -sh . | cut -f1)"
}

# Extract Repository 4: terrafusion-infrastructure
extract_infrastructure() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}Extracting Repository 4: terrafusion-infrastructure${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    cd "$EXTRACTION_WORKSPACE"
    
    echo "Copying source repository..."
    cp -r "$SOURCE_REPO" terrafusion-infrastructure
    cd terrafusion-infrastructure
    
    rm -rf .git
    git init
    git config user.email "copilot@terrafusion.io"
    git config user.name "TerraFusion Copilot"
    
    echo "Cleaning up non-infrastructure files..."
    
    # Keep only infrastructure files
    find . -maxdepth 1 -type d ! -name '.' ! -name '.git' \
        ! -name 'infrastructure' \
        ! -name 'deployment' \
        ! -name 'scripts' \
        -exec rm -rf {} + 2>/dev/null || true
    
    # Keep only infrastructure scripts
    if [ -d "scripts" ]; then
        cd scripts
        find . -type f ! -name '*deploy*' ! -name '*infra*' ! -name '*k8s*' \
            -exec rm -f {} + 2>/dev/null || true
        cd ..
    fi
    
    # Create README
    cat > README.md << 'EOF'
# TerraFusion Infrastructure

Infrastructure as Code (IaC) for TerraFusion platform deployment.

## Contents

- **Kubernetes**: K8s manifests and Helm charts
- **Terraform**: Infrastructure provisioning
- **Docker**: Container configurations
- **CI/CD**: GitHub Actions workflows
- **Scripts**: Deployment automation

## Environments

- **Development**: Local Docker Compose
- **Staging**: Azure Kubernetes Service
- **Production**: Multi-region AKS deployment

## Getting Started

```bash
# Deploy to local development
./scripts/deploy-local.sh

# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production (requires approval)
./scripts/deploy-production.sh
```

## License

Proprietary - TerraFusion by BSValues LLC
EOF

    cat > .gitignore << 'EOF'
*.tfstate
*.tfstate.backup
.terraform/
.env
*.log
.DS_Store
kubeconfig
*.pem
*.key
EOF

    git add .
    git commit -m "Initial commit: TerraFusion Infrastructure extraction from monorepo"
    
    echo -e "${GREEN}✓ terrafusion-infrastructure extracted successfully${NC}"
    echo "Size: $(du -sh . | cut -f1)"
}

# Summary report
generate_summary() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}Extraction Complete - Summary${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    
    cd "$EXTRACTION_WORKSPACE"
    
    for repo in terrafusion-*; do
        if [ -d "$repo" ]; then
            size=$(du -sh "$repo" | cut -f1)
            commits=$(cd "$repo" && git log --oneline | wc -l)
            echo -e "${GREEN}✓${NC} $repo"
            echo "  Size: $size"
            echo "  Commits: $commits"
            echo "  Location: $EXTRACTION_WORKSPACE/$repo"
            echo ""
        fi
    done
    
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Review each extracted repository"
    echo "2. Create GitHub repositories:"
    echo "   gh repo create bsvalues/terrafusion-os-core --private"
    echo "   gh repo create bsvalues/terrafusion-marketplace --private"
    echo "   gh repo create bsvalues/terrafusion-shared --private"
    echo "   gh repo create bsvalues/terrafusion-infrastructure --private"
    echo ""
    echo "3. Push to GitHub:"
    echo "   cd $EXTRACTION_WORKSPACE/terrafusion-os-core"
    echo "   git remote add origin git@github.com:bsvalues/terrafusion-os-core.git"
    echo "   git push -u origin main"
    echo "   (repeat for each repository)"
    echo ""
    echo "4. Update Atlas system with new repository URLs"
    echo "5. Archive original monorepo"
}

# Main execution
main() {
    echo "Starting TerraFusion polyrepo extraction..."
    echo ""
    
    # Check if git-filter-repo is installed
    if ! command -v git-filter-repo &> /dev/null; then
        echo "Installing git-filter-repo..."
        pip install git-filter-repo
    fi
    
    setup_workspace
    
    # Extract repositories
    extract_shared          # Extract shared first (others depend on it)
    extract_os_core
    extract_marketplace
    extract_infrastructure
    
    generate_summary
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}Phase 3b Extraction Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
}

# Run main function
main
