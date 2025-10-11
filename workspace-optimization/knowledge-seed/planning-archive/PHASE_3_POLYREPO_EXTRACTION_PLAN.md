# 🚀 Phase 3: Polyrepo Extraction Plan

**Date:** October 6, 2025  
**Current Size:** 18 GB (clean monolith)  
**Target:** Separate repositories with clear boundaries

---

## 📊 CURRENT STATE ANALYSIS

Based on our Phase 2 completion, here's what remains in the 18GB monolith:

```
src/                               2.5 GB  (main source code)
rust-performance-engine/           2.4 GB  (Rust components)
terrafusion-cos/                   2.0 GB  (Core OS implementation)
packages/                          2.0 GB  (npm packages)
docs/                              627 MB  (documentation)
backend/                           267 MB  (C# backend)
scripts/                           250 MB  (automation scripts)
modules/                           121 MB  (application modules)
data/                              130 MB  (runtime data)
deployment/                        90 MB   (deployment configs)
```

---

## 🎯 POLYREPO ARCHITECTURE DESIGN

### Strategy: CLEAN SEPARATION

We'll create focused repositories based on:
1. **Functional boundaries** (OS vs Marketplace vs Apps)
2. **Team ownership** (who maintains what)
3. **Deployment independence** (can be deployed separately)
4. **Technology stack** (shared tech dependencies)

---

## 📦 REPOSITORY 1: terrafusion-os-core

**Purpose:** Core operating system kernel, APIs, and SDKs  
**Size Estimate:** 3-4 GB  
**Technology:** TypeScript, Rust, C#

### What Goes Here:

```
terrafusion-os-core/
├── kernel/                    # Core OS kernel
│   ├── auth/                 # Authentication service
│   ├── routing/              # Request routing
│   ├── persistence/          # Data persistence
│   └── messaging/            # Event bus
├── apis/                      # Core APIs
│   ├── rest/                 # REST endpoints
│   ├── graphql/              # GraphQL schemas
│   └── grpc/                 # gRPC services
├── sdk/                       # Client SDKs
│   ├── javascript/           # JS/TS SDK
│   ├── python/               # Python SDK
│   └── rust/                 # Rust SDK
├── backend/                   # C# backend services
├── rust-performance-engine/   # Performance-critical Rust code
├── infrastructure/            # Kubernetes/Docker configs
└── docs/                      # API documentation
```

### Extract From Current Repo:
- `terrafusion-cos/` → Core OS implementation
- `backend/` → Backend services
- `rust-performance-engine/` → Rust components
- `packages/core/`, `packages/kernel/` → Core packages
- Parts of `src/` that are OS-level

### Commands to Extract:

```bash
# Create working directory
mkdir -p /tmp/polyrepo-extraction
cd /tmp/polyrepo-extraction

# Clone current repo
git clone /workspaces/terrafusion_os_1.0 terrafusion-os-core
cd terrafusion-os-core

# Install git-filter-repo
pip install git-filter-repo

# Extract only OS-core relevant paths
git filter-repo --path terrafusion-cos/ \
                --path backend/ \
                --path rust-performance-engine/ \
                --path packages/core/ \
                --path packages/kernel/ \
                --path docs/api/ \
                --path infrastructure/

# Restructure to clean layout
# (manual reorganization needed)

# Create new GitHub repo
# gh repo create bsvalues/terrafusion-os-core --private

# Push
git remote add origin git@github.com:bsvalues/terrafusion-os-core.git
git push -u origin main
```

---

## 📦 REPOSITORY 2: terrafusion-marketplace

**Purpose:** Application marketplace platform  
**Size Estimate:** 1-2 GB  
**Technology:** TypeScript/React, Node.js

### What Goes Here:

```
terrafusion-marketplace/
├── services/
│   ├── catalog/              # App catalog service
│   ├── payments/             # Payment processing
│   ├── reviews/              # Ratings and reviews
│   └── analytics/            # App analytics
├── frontend/
│   ├── marketplace-ui/       # Public marketplace
│   ├── developer-portal/     # Dev dashboard
│   └── admin-panel/          # Admin interface
├── apis/
│   └── marketplace-api/      # Marketplace APIs
└── infrastructure/
    └── kubernetes/           # K8s manifests
```

### Extract From Current Repo:
- `packages/marketplace/` → Marketplace services
- `frontend/` → Marketplace UI
- `src/marketplace/` → Marketplace code
- Marketplace-specific APIs

### Commands to Extract:

```bash
cd /tmp/polyrepo-extraction
git clone /workspaces/terrafusion_os_1.0 terrafusion-marketplace
cd terrafusion-marketplace

git filter-repo --path packages/marketplace/ \
                --path frontend/ \
                --path src/marketplace/ \
                --path docs/marketplace/

# Restructure and push
git remote add origin git@github.com:bsvalues/terrafusion-marketplace.git
git push -u origin main
```

---

## 📦 REPOSITORY 3: terrafusion-shared

**Purpose:** Shared libraries and utilities  
**Size Estimate:** 200-300 MB  
**Technology:** TypeScript, utilities

### What Goes Here:

```
terrafusion-shared/
├── packages/
│   ├── common/               # Common utilities
│   ├── types/                # Shared TypeScript types
│   ├── ui-components/        # Shared UI components
│   └── api-client/           # API client library
├── scripts/                   # Shared build scripts
└── configs/                   # Shared configs (ESLint, TS, etc)
```

### Extract From Current Repo:
- `packages/common/`
- `packages/shared/`
- `packages/utils/`
- `scripts/shared/`

### Commands to Extract:

```bash
cd /tmp/polyrepo-extraction
git clone /workspaces/terrafusion_os_1.0 terrafusion-shared
cd terrafusion-shared

git filter-repo --path packages/common/ \
                --path packages/shared/ \
                --path packages/utils/ \
                --path scripts/shared/

# Publish to npm as @terrafusion/shared
git remote add origin git@github.com:bsvalues/terrafusion-shared.git
git push -u origin main
```

---

## 📦 REPOSITORY 4: terrafusion-infrastructure

**Purpose:** Infrastructure as Code, deployment configs  
**Size Estimate:** 100-200 MB  
**Technology:** Kubernetes, Terraform, Ansible

### What Goes Here:

```
terrafusion-infrastructure/
├── terraform/
│   ├── aws/                  # AWS infrastructure
│   ├── azure/                # Azure infrastructure
│   └── kubernetes/           # K8s setup
├── ansible/                   # Configuration management
├── helm-charts/
│   ├── terrafusion-os/      # OS Helm chart
│   ├── terrafusion-marketplace/ # Marketplace chart
│   └── module-template/      # Template for modules
├── ci-cd/
│   └── github-actions/       # Reusable workflows
└── monitoring/
    ├── prometheus/           # Prometheus configs
    └── grafana/              # Grafana dashboards
```

### Extract From Current Repo:
- `infrastructure/`
- `deployment/`
- `.github/workflows/` (CI/CD templates)
- `scripts/deploy/`

---

## 📦 REPOSITORIES 5-N: Individual Modules

### Module Template Structure:

```
terrafusion-module-[name]/
├── src/                       # Source code
├── tests/                     # Tests
├── docs/                      # Module documentation
├── package.json               # Dependencies
├── Dockerfile                 # Container definition
├── k8s/                       # Kubernetes manifests
├── .github/                   # CI/CD
│   └── workflows/
│       ├── ci.yml            # Build and test
│       └── publish.yml        # Publish to marketplace
└── README.md                  # Module info
```

### Modules to Extract:

Based on `modules/` directory analysis:

#### Priority 1 (Core Business Logic):
1. **terrafusion-module-property-valuation**
   - Extract from: `modules/property-valuation/` or `src/property-valuation/`
   - Size: ~100-200 MB
   - Purpose: Property appraisal and valuation tools

2. **terrafusion-module-gis-engine**
   - Extract from: `modules/gis/` or `src/terrafusion-gis/`
   - Size: ~200-300 MB
   - Purpose: GIS and mapping functionality

3. **terrafusion-module-ai-agents**
   - Extract from: `modules/ai-agents/` or `src/ai-agents/`
   - Size: ~150-250 MB
   - Purpose: AI agent swarm system

4. **terrafusion-module-government-compliance**
   - Extract from: `modules/government-core/`
   - Size: ~100-150 MB
   - Purpose: Government compliance and reporting

#### Priority 2 (Partner Integrations):
5. **terrafusion-harris-county**
   - Extract from: `packages/harris-county/`
   - Size: ~50-100 MB
   - Private repo for Harris County partnership

6. **terrafusion-woolpert**
   - Extract from: `packages/woolpert/`
   - Size: ~50-100 MB
   - Private repo for Woolpert partnership

7. **terrafusion-benton-county**
   - Extract from: `packages/benton-county/`
   - Size: ~50-100 MB
   - Private repo for Benton County partnership

#### Priority 3 (Additional Modules):
8. **terrafusion-module-surveying**
9. **terrafusion-module-permit-management**
10. **terrafusion-module-appraisal-tools**

---

## 🔄 EXTRACTION WORKFLOW

### Phase 3a: Preparation (Current)
- [x] Analyze current structure
- [x] Design polyrepo architecture
- [ ] Create extraction scripts
- [ ] Document dependencies between repos

### Phase 3b: Core Platform Extraction
1. **Extract terrafusion-os-core** (Day 1)
   - Run git filter-repo
   - Restructure directories
   - Create GitHub repo
   - Push code
   - Setup CI/CD
   - Publish initial release

2. **Extract terrafusion-marketplace** (Day 2)
   - Same process as above
   - Update dependencies to use @terrafusion/shared

3. **Extract terrafusion-shared** (Day 1, parallel)
   - Extract first (others depend on it)
   - Publish to npm as @terrafusion/shared
   - Version: 1.0.0

4. **Extract terrafusion-infrastructure** (Day 2, parallel)
   - Extract deployment configs
   - Create Helm charts
   - Setup ArgoCD configs

### Phase 3c: Module Extraction
5. **Extract Priority 1 modules** (Days 3-4)
   - Extract property-valuation
   - Extract gis-engine
   - Extract ai-agents
   - Extract government-compliance

6. **Extract Priority 2 modules** (Days 5-6)
   - Extract partner integrations
   - Configure as private repos

7. **Extract Priority 3 modules** (Week 2)
   - Extract remaining modules
   - Setup marketplace publication

---

## 📋 DEPENDENCY MANAGEMENT

### Package Dependencies:

```json
// terrafusion-os-core/package.json
{
  "name": "@terrafusion/os-core",
  "version": "2.0.0",
  "dependencies": {
    "@terrafusion/shared": "^1.0.0"
  }
}

// terrafusion-marketplace/package.json
{
  "name": "@terrafusion/marketplace",
  "version": "1.0.0",
  "dependencies": {
    "@terrafusion/shared": "^1.0.0",
    "@terrafusion/os-sdk": "^2.0.0"
  }
}

// terrafusion-module-property-valuation/package.json
{
  "name": "@terrafusion/module-property-valuation",
  "version": "1.0.0",
  "dependencies": {
    "@terrafusion/shared": "^1.0.0",
    "@terrafusion/os-sdk": "^2.0.0"
  }
}
```

### Dependency Graph:

```
terrafusion-shared (base layer)
    ├── terrafusion-os-core
    │   └── terrafusion-marketplace
    │       └── [all modules depend on marketplace for distribution]
    └── [all modules depend on shared utilities]
```

---

## 🚀 CI/CD SETUP

### Shared Workflow Template:

```yaml
# .github/workflows/ci.yml (template for all repos)
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Publish to marketplace
        if: github.ref == 'refs/heads/main'
        run: npm run publish:marketplace
        env:
          MARKETPLACE_TOKEN: ${{ secrets.MARKETPLACE_TOKEN }}
```

---

## 📝 MIGRATION CHECKLIST

### Before Extraction:
- [ ] Document all dependencies
- [ ] List all import paths
- [ ] Identify shared code
- [ ] Create extraction scripts
- [ ] Setup GitHub repos
- [ ] Configure access permissions

### During Extraction:
- [ ] Run git filter-repo for each repo
- [ ] Verify no code loss
- [ ] Update import paths
- [ ] Update package.json dependencies
- [ ] Add CI/CD workflows
- [ ] Add README.md for each repo

### After Extraction:
- [ ] Test each repo independently
- [ ] Verify builds pass
- [ ] Update documentation
- [ ] Create developer onboarding guide
- [ ] Update Atlas to point to new repos
- [ ] Archive old monorepo

---

## 🎯 SUCCESS CRITERIA

### Technical:
- ✅ Each repo builds independently
- ✅ All tests pass
- ✅ Dependencies resolved via npm
- ✅ CI/CD pipelines functional
- ✅ Documentation complete

### Operational:
- ✅ Teams can work independently
- ✅ Releases are independent
- ✅ Modules can be published to marketplace
- ✅ Third parties can fork modules
- ✅ Clear ownership defined

### Performance:
- ✅ Build time < 10 minutes per repo
- ✅ Clone time < 2 minutes per repo
- ✅ Repository size < 500 MB per module

---

## 📊 ESTIMATED TIMELINE

```
Week 1:
├── Day 1: Extract terrafusion-shared + terrafusion-os-core
├── Day 2: Extract terrafusion-marketplace + infrastructure
├── Day 3: Extract Priority 1 modules (1-2)
├── Day 4: Extract Priority 1 modules (3-4)
└── Day 5: Testing and integration

Week 2:
├── Day 1: Extract Priority 2 modules (partners)
├── Day 2: Extract Priority 3 modules
├── Day 3: Documentation and cleanup
├── Day 4: Migration testing
└── Day 5: Cutover and archive monorepo
```

**Total Time:** 2 weeks for full polyrepo extraction

---

## 🔧 TOOLS NEEDED

- `git-filter-repo` - For extracting subdirectories with history
- `gh` (GitHub CLI) - For creating repos
- `npm` - For publishing shared packages
- `git` - Version control
- `jq` - For JSON manipulation in scripts
- `rsync` - For file operations

---

## 💡 RISK MITIGATION

### Risk 1: Dependency Hell
**Mitigation:** Extract shared libraries first, publish to npm, then extract dependent repos

### Risk 2: Lost Git History
**Mitigation:** Use git-filter-repo (preserves history), verify before deleting monorepo

### Risk 3: Broken References
**Mitigation:** Update all imports systematically, use find/replace with verification

### Risk 4: Team Confusion
**Mitigation:** Document everything, create developer guide, hold training session

---

## 📚 NEXT STEPS

1. **Review this plan** - Get team/stakeholder approval
2. **Install tools** - Setup git-filter-repo, gh CLI
3. **Create GitHub repos** - Create all repos structure
4. **Run extraction** - Start with terrafusion-shared
5. **Verify and test** - Each repo independently
6. **Update documentation** - Complete developer guides
7. **Cutover** - Archive monorepo, switch to polyrepo

---

**Status:** ✅ PLAN COMPLETE - Ready for Execution  
**Next Phase:** 3b - Extract Core Platform repositories  
**Estimated Start:** Ready to begin immediately

