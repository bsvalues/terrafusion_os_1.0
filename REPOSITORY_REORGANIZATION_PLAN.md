# TerraFusion OS Repository Reorganization Plan

**Status:** Ready for Review  
**Date:** October 5, 2025  
**Owner:** Platform Team

## 🎯 Executive Summary

This plan outlines how to reorganize the TerraFusion OS repository from its current mixed structure into a clean, Atlas-driven architecture with clear top-level categories.

## 📊 Current State

**Repository Statistics:**
- **Total Files:** 18,583
- **Total Directories:** 6,049
- **Total Size:** 133.60 GB
- **Atlas Items Registered:** 28 (core items)
- **Auto-Classified Items:** 2,043 items across 14 categories

**Current Structure:** Mixed code, ops, reports, archives, and experiments in flat structure

## 🎯 Target State

**Proposed Top-Level Structure:**

```
terrafusion_os_1.0/
├── os/                      # Core operating system
│   ├── kernel/              # Kernel services
│   ├── api/                 # API services
│   └── sync/                # Sync services
├── marketplace/             # Marketplace platform
│   ├── frontend/            # Marketplace UI
│   ├── backend/             # Marketplace services
│   └── modules/             # Available modules
├── engines/                 # High-performance engines
│   ├── costforge/           # CostForge engine
│   ├── valuation/           # Valuation engine
│   └── performance/         # Performance utilities
├── frontends/               # User interfaces
│   ├── desktop/             # Tauri desktop app
│   ├── web/                 # Web frontend
│   └── mobile/              # Mobile apps (future)
├── agents/                  # AI agents and swarms
│   ├── swarm-commander/     # Swarm coordination
│   ├── specialists/         # Specialist agents
│   └── consciousness/       # Consciousness layer
├── modules/                 # Hot-swappable modules
│   ├── gis/                 # GIS modules
│   ├── valuation/           # Valuation modules
│   └── analytics/           # Analytics modules
├── data/                    # Datasets and databases
│   ├── schemas/             # Database schemas
│   ├── migrations/          # DB migrations
│   └── exports/             # Data exports
├── infra/                   # Infrastructure as Code
│   ├── helm/                # Helm charts
│   ├── terraform/           # Terraform configs
│   ├── docker/              # Docker configs
│   └── k8s/                 # Kubernetes manifests
├── pipelines/               # CI/CD and automation
│   ├── ci/                  # Continuous integration
│   ├── cd/                  # Continuous deployment
│   └── etl/                 # Data pipelines
├── brands/                  # Brand assets
│   ├── terrafusion/         # TerraFusion brand
│   └── partners/            # Partner brands
├── partners/                # Partner integrations
│   ├── harris/              # Harris County
│   ├── woolpert/            # Woolpert
│   └── federal/             # Federal integrations
├── docs/                    # Documentation
│   ├── architecture/        # Architecture docs
│   ├── api/                 # API documentation
│   └── guides/              # User guides
├── compliance/              # Security & compliance
│   ├── audits/              # Audit reports
│   ├── certifications/      # Certifications
│   └── policies/            # Policies
├── archive/                 # Historical artifacts
│   ├── reports/             # Old reports
│   ├── backups/             # Backups
│   └── experiments/         # Experiments
├── tools/                   # Development tools
│   ├── terrafusion-atlas/   # Atlas system
│   └── terrafusion-repo-mapper/  # Repo mapper
└── scripts/                 # Utility scripts
```

## 📋 Migration Phases

### Phase 1: Preparation (Week 1)
- [ ] Review and approve this plan
- [ ] Create feature branch: `refactor/atlas-reorganization`
- [ ] Backup current state
- [ ] Communicate to all teams
- [ ] Freeze new top-level folder creation

### Phase 2: Create Structure (Week 1)
- [ ] Create all new top-level directories
- [ ] Add README.md to each top-level directory
- [ ] Update .gitignore for new structure
- [ ] Create redirect/symlink plan for critical paths

### Phase 3: Move Core OS (Week 2)
- [ ] Move `backend/` → `os/`
- [ ] Move `core-os/` → `os/kernel/`
- [ ] Move `consciousness-service/` → `os/consciousness/`
- [ ] Update all import paths
- [ ] Run tests
- [ ] Update Atlas registry paths

### Phase 4: Move Engines (Week 2)
- [ ] Move `rust-performance-engine/` → `engines/performance/`
- [ ] Move `costforge/` → `engines/costforge/`
- [ ] Move `valuation-engine/` → `engines/valuation/`
- [ ] Update FFI bindings
- [ ] Run performance tests
- [ ] Update Atlas registry paths

### Phase 5: Move Frontends (Week 3)
- [ ] Move `src-tauri/` → `frontends/desktop/`
- [ ] Move `frontend/` → `frontends/web/`
- [ ] Move `frontend-v2/` → `frontends/web-v2/`
- [ ] Move `marketplace/frontend/` → `marketplace/frontend/`
- [ ] Update build configs
- [ ] Run UI tests
- [ ] Update Atlas registry paths

### Phase 6: Move Agents (Week 3)
- [ ] Move `.ai/` → `agents/core/`
- [ ] Move `ai-swarm-supreme-commander/` → `agents/swarm-commander/`
- [ ] Move agent subdirectories → `agents/specialists/`
- [ ] Update agent configs
- [ ] Run agent tests
- [ ] Update Atlas registry paths

### Phase 7: Move Modules (Week 4)
- [ ] Move `modules/` → `modules/` (already good)
- [ ] Move `plugins/` → `modules/plugins/`
- [ ] Move `parcel-tools/` → `modules/gis/parcel-tools/`
- [ ] Move `shock-and-awe-2.0/` → `modules/showcase/shock-and-awe/`
- [ ] Update module registry
- [ ] Test hot-swapping
- [ ] Update Atlas registry paths

### Phase 8: Move Infrastructure (Week 4)
- [ ] Move `helm/`, `helmfile/` → `infra/helm/`
- [ ] Move `terraform-*/` → `infra/terraform/`
- [ ] Move `docker/` → `infra/docker/`
- [ ] Move `deployment-package/` → `infra/deployments/`
- [ ] Move `.devcontainer/` → `infra/devcontainer/`
- [ ] Update CI/CD references
- [ ] Test deployments
- [ ] Update Atlas registry paths

### Phase 9: Move Data (Week 5)
- [ ] Move `database/` → `data/schemas/`
- [ ] Move `county-data/` → `data/county/`
- [ ] Move `data/` → `data/exports/`
- [ ] Move `*.db` files → `data/databases/`
- [ ] Update connection strings
- [ ] Run data tests
- [ ] Update Atlas registry paths

### Phase 10: Move Pipelines (Week 5)
- [ ] Keep `.github/workflows/` → `pipelines/ci/` (symlink)
- [ ] Move `scripts/deploy*/` → `pipelines/cd/`
- [ ] Move ETL scripts → `pipelines/etl/`
- [ ] Update workflow references
- [ ] Test CI/CD
- [ ] Update Atlas registry paths

### Phase 11: Move Brands & Partners (Week 6)
- [ ] Move `Brand_Assets/` → `brands/terrafusion/`
- [ ] Move `harris_brand/` → `brands/partners/harris/`
- [ ] Move `harris_*/` → `partners/harris/`
- [ ] Move `woolpert/` → `partners/woolpert/`
- [ ] Move `federal*/` → `partners/federal/`
- [ ] Update brand references
- [ ] Update Atlas registry paths

### Phase 12: Move Docs & Compliance (Week 6)
- [ ] Move `docs/` → `docs/` (consolidate)
- [ ] Move `*.md` files → `docs/`
- [ ] Move `compliance/` → `compliance/`
- [ ] Move audit reports → `compliance/audits/`
- [ ] Move `trust-fabric/` → `compliance/trust-fabric/`
- [ ] Update doc links
- [ ] Update Atlas registry paths

### Phase 13: Archive & Cleanup (Week 7)
- [ ] Move `FULL_BACKUP_*/` → `archive/backups/`
- [ ] Move `*_AUDIT_*` reports → `archive/reports/`
- [ ] Move old experiments → `archive/experiments/`
- [ ] Move deprecated code → `archive/deprecated/`
- [ ] Delete empty directories
- [ ] Update .gitignore
- [ ] Update Atlas to mark archived items

### Phase 14: Validation & Testing (Week 7)
- [ ] Run full test suite
- [ ] Run Atlas validation: `python3 tools/terrafusion-atlas/scripts/atlas_validate.py`
- [ ] Verify all builds pass
- [ ] Check all deployments work
- [ ] Verify CI/CD pipelines
- [ ] Load test critical paths
- [ ] Security scan

### Phase 15: Documentation & Rollout (Week 8)
- [ ] Update all README files
- [ ] Update developer onboarding docs
- [ ] Update architecture diagrams
- [ ] Create migration guide for teams
- [ ] Record video walkthrough
- [ ] Announce changes
- [ ] Merge to main
- [ ] Tag release: `v2.0-atlas-reorganization`

## 🔧 Migration Tools

### Automated Move Script

```bash
#!/bin/bash
# migrate.sh - Automated repository reorganization

set -e

# Backup
echo "Creating backup..."
tar -czf terrafusion-backup-$(date +%Y%m%d).tar.gz .

# Move core OS
echo "Moving core OS..."
mkdir -p os/kernel os/api
git mv backend os/api
git mv core-os os/kernel

# Move engines
echo "Moving engines..."
mkdir -p engines
git mv rust-performance-engine engines/performance
git mv costforge engines/costforge

# ... (continue for each category)

# Update Atlas
echo "Updating Atlas..."
cd tools/terrafusion-atlas
python3 scripts/update_paths.py

# Commit
git commit -m "refactor: Reorganize repository with Atlas structure"
```

### Path Update Script

```python
# update_imports.py - Update import paths across codebase

import os
import re
from pathlib import Path

MOVES = {
    'backend': 'os/api',
    'rust-performance-engine': 'engines/performance',
    'frontend': 'frontends/web',
    # ... etc
}

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in MOVES.items():
        content = content.replace(f'from {old}', f'from {new}')
        content = content.replace(f'import {old}', f'import {new}')
        content = content.replace(f'"{old}', f'"{new}')
    
    with open(filepath, 'w') as f:
        f.write(content)

# Run on all source files
for ext in ['.py', '.ts', '.js', '.cs', '.rs']:
    for filepath in Path('.').rglob(f'*{ext}'):
        update_file(filepath)
```

## 🚨 Risk Mitigation

### High-Risk Areas

1. **Build Pipelines** - Hardcoded paths in CI/CD
   - *Mitigation:* Update all workflow files, test in staging
   
2. **Import Paths** - Code references to moved modules
   - *Mitigation:* Automated search/replace, comprehensive testing
   
3. **Container Images** - Docker COPY commands
   - *Mitigation:* Update Dockerfiles, rebuild all images
   
4. **Database Connections** - Hardcoded DB paths
   - *Mitigation:* Use environment variables, connection pooling
   
5. **Team Disruption** - Developer workflow interruption
   - *Mitigation:* Clear communication, migration guide, support hours

### Rollback Plan

If major issues occur:

1. **Stop migration** at current phase
2. **Restore from backup:** `tar -xzf terrafusion-backup-YYYYMMDD.tar.gz`
3. **Reset branch:** `git reset --hard origin/main`
4. **Investigate root cause**
5. **Fix issues in plan**
6. **Retry migration**

## 📞 Communication Plan

### Week Before Migration
- Email all teams with plan
- Demo session showing new structure
- Q&A session
- Post in Slack/Teams

### During Migration
- Daily standup updates
- #atlas-migration Slack channel
- Blocker escalation process
- Support hours (9am-5pm)

### After Migration
- Success announcement
- Updated onboarding docs
- Retrospective meeting
- Celebration 🎉

## ✅ Success Criteria

- [ ] All 28+ Atlas items have correct `source_path`
- [ ] All tests pass (unit, integration, E2E)
- [ ] All builds succeed
- [ ] All deployments work
- [ ] CI/CD pipelines operational
- [ ] Zero production incidents
- [ ] Developer feedback positive (>80%)
- [ ] Documentation complete

## 📊 Progress Tracking

Use this command to track progress:

```bash
python3 tools/terrafusion-atlas/scripts/migration_progress.py
```

## 🎓 Training Materials

- **Video Walkthrough:** [Recording link]
- **Migration Guide:** `docs/guides/atlas-migration.md`
- **FAQ:** `docs/guides/atlas-faq.md`
- **Office Hours:** Tuesdays 2-3pm, Thursdays 10-11am

## 🏆 Post-Migration Benefits

1. **Clarity:** Clear separation of concerns
2. **Onboarding:** New developers find code faster
3. **Scalability:** Easier to add new services/modules
4. **Governance:** Atlas enforces structure
5. **CI Performance:** Faster builds with scoped paths
6. **Code Reviews:** Easier to identify affected areas
7. **Deployments:** Clearer deployment units
8. **Security:** Better audit trail and ownership

---

**Approved By:**  
- [ ] CTO
- [ ] VP Engineering
- [ ] Platform Team Lead
- [ ] Security Team Lead

**Questions?** Contact platform-team or #atlas-migration
