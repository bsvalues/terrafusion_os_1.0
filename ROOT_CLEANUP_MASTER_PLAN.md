# 🧹 ROOT CLEANUP MASTER PLAN

## TerraFusion OS 1.0 - Post Three Pillars Cleanup

**Date**: October 15, 2025  
**Status**: Planning Phase  
**Goal**: Clean, professional workspace root aligned with THREE PILLARS
architecture

---

## 🎯 CLEANUP OBJECTIVES

1. **Maintain THREE PILLARS Integrity**: Keep core kernel/runtime in root
2. **Consolidate Documentation**: Move 50+ status docs to organized structure
3. **Remove Redundancy**: Eliminate duplicate directories and files
4. **Archive Legacy**: Properly archive old code and reports
5. **Clean Build Artifacts**: Remove temp files and caches
6. **Professional Appearance**: Root should reflect world-class architecture

---

## 📋 THREE PILLARS BASELINE (DO NOT MOVE)

### ✅ Core Kernel/Runtime (MUST STAY IN ROOT)

```
/backend/               # .NET 8.0 API server
/frontend/              # React/TypeScript UI
/terrafusion-cos/       # Python Core OS
/data/                  # Data storage
/scripts/               # Core scripts
/config/                # Core configuration
```

### ✅ Platform & Marketplace (ALREADY ORGANIZED)

```
/os-platform/           # 11 capability domains, 21,191 folders
/marketplace/           # 32 applications, 4,690 folders
```

### ✅ Essential Infrastructure (KEEP IN ROOT)

```
/.github/               # GitHub Actions, workflows
/.vscode/               # VS Code settings
/.husky/                # Git hooks
/.githooks/             # Additional git hooks
/.devcontainer/         # Dev container config
/node_modules/          # NPM dependencies
/.venv/                 # Python virtual environment
/docker/                # Docker configurations
/kubernetes/            # K8s manifests
/terraform/             # Infrastructure as code
```

### ✅ Essential Config Files (KEEP IN ROOT)

```
package.json, package-lock.json
.gitignore, .gitattributes, .gitmodules
.env, .env.example, .env.template
docker-compose.yml
Dockerfile.frontend
tsconfig.json, jest.integration.config.ts
playwright.config.ts, vitest.config.ts
webpack.production.config.js
nodemon.json, .npmrc, .nvmrc
.eslintrc.json, .prettierrc, .editorconfig
.dockerignore, .eslintignore
LICENSE, README.md
Makefile, global.json
```

---

## 🗂️ PHASE 1: DOCUMENTATION CONSOLIDATION

### Action: Create `docs/` Structure

```
/docs/
├─ reports/
│  ├─ sessions/           # All SESSION_X_COMPLETE.md files
│  ├─ weeks/              # All WEEK_X files
│  ├─ operations/         # OPERATION_THREE_PILLARS files
│  ├─ phases/             # PHASE_X files
│  ├─ gold-standard/      # All GOLD_STANDARD files
│  └─ status/             # STATUS, EXECUTION_LOG, etc.
├─ architecture/          # Architecture analysis docs
├─ planning/              # Master plans, strategies
├─ audits/                # Gap analyses, forensic audits
└─ workspace/             # Workspace history
   └─ TerraFusion_OS_1.0.code-workspace
```

### Files to Move (50+ files):

**Session Reports** → `docs/reports/sessions/`:

- SESSION_3_COMPLETE_GOLD_STANDARD_ACHIEVED.md
- SESSION_4_COMPLETE_GOLD_STANDARD_ACHIEVED.md
- SESSION_5_COMPLETE_GOLD_STANDARD_ACHIEVED.md
- SESSION_6_COMPLETE_GOLD_STANDARD_ACHIEVED.md
- SESSION_7_COMPLETE_100_PERCENT_GOLD_STANDARD_ACHIEVED.md

**Week Reports** → `docs/reports/weeks/`:

- WEEK_2_CELEBRATION.md
- WEEK_2_COMPLETE_SUMMARY.md
- WEEK_2_DAY_2_COMPLETE.md through WEEK_2_DAY_16_COMPLETE.md (11 files)

**Operation Reports** → `docs/reports/operations/`:

- OPERATION_THREE_PILLARS_MASTER_PLAN.md
- OPERATION_THREE_PILLARS_STATUS.md
- OPERATION_THREE_PILLARS_ROLLBACK.md
- OPERATION_THREE_PILLARS_VICTORY_REPORT.md

**Phase Reports** → `docs/reports/phases/`:

- PHASE_1_3_AUTOMATED_REFACTORING_COMPLETE.md
- PHASE_1_3_EXECUTION_PLAYBOOK.md
- PHASE_2_ARIA_ACCESSIBILITY_COMPLETE.md
- PHASE_2_ARIA_ACCESSIBILITY_PLAN.md

**Gold Standard Reports** → `docs/reports/gold-standard/`:

- GOLD_STANDARD_EXECUTION_COMPLETE.md
- GOLD_STANDARD_EXECUTION_SESSION_SUMMARY.md
- GOLD_STANDARD_SESSION_2_COMPLETE.md

**Status Reports** → `docs/reports/status/`:

- EXECUTION_LOG.md
- STATUS_AND_RECOMMENDATIONS.md
- ACTUAL_STATUS_NO_BULLSHIT.md
- PRODUCTION_READINESS_DASHBOARD.md

**Architecture Docs** → `docs/architecture/`:

- OS_PLATFORM_ARCHITECTURE_ANALYSIS.md
- OS_PLATFORM_CORRECTED_SEPARATION.md
- COMPLETE_OS_PLATFORM_SEPARATION_ANALYSIS.md
- FINAL_OS_PLATFORM_SEPARATION_COMPLETE_PLAN.md
- TERRAFUSION_OS_ARCHITECTURE_ANALYSIS.md

**Planning Docs** → `docs/planning/`:

- MIT_PHD_SYSTEMS_EXCELLENCE_PLAN.md
- FRONTEND_EXCELLENCE_MASTER_PLAN.md
- TERRAFUSION_INTEGRATION_PLAN.md
- SYSTEMS_ENGINEERING_EXCELLENCE.md
- SYSTEMS_ENGINEERING_SOLUTION.md
- DOCUMENTATION_INDEX.md

**Audit/Analysis Docs** → `docs/audits/`:

- 🎓_MIT_PHD_STRATEGIC_GAP_ANALYSIS.md
- 📊_EXECUTIVE_SUMMARY_AI_GAP.md
- ANSWERS_TO_QUESTIONS.md

**Old Backups** → `docs/archive/`:

- README_OLD_BACKUP.md

---

## 🗂️ PHASE 2: DIRECTORY CONSOLIDATION

### Action: Archive Legacy/Old Directories → `data/archives/`

**Legacy Code Archives** (consolidate):

```
Move to: /data/archives/legacy/
- /LEGACY_CODE_ARCHIVE/
- /archive/
```

**Recovery & Audit Reports** (consolidate):

```
Move to: /data/archives/reports/
- /AUDIT_REPORTS/
- /FORENSIC_REPORTS/
- /VALIDATION_REPORTS/
- /RECOVERY_OPERATION/
- /reports/
```

**Backups** (consolidate):

```
Move to: /data/archives/backups/
- /backups/
```

**Planning Archives** (consolidate):

```
Move to: /data/archives/planning/
- /PLATFORM_EMPIRE_PLANNING/
- /plans/
```

### Action: Consolidate Development Tools → `development/`

**Module Analysis Tools** (one-time use, archive):

```
Move to: /data/archives/tools/
- /module-analysis/
- /workspace-optimization/
- /workspace-explorer/
- /terrafusion-repo-mapper/
```

**Design Tools** (consolidate):

```
Move to: /development/design/
- /design/
- /design-sync/
- /architecture-diagrams/
```

### Action: Consolidate Testing Directories → `testing/`

**Current Structure** (MESSY):

```
/testing/
/tests/
/COMPLETE_TEST_SUITE/
/testing-coordination/
/generated_tests/
```

**New Structure** (CLEAN):

```
/testing/
├─ unit/                # Unit tests
├─ integration/         # Integration tests
├─ e2e/                 # End-to-end tests
├─ coordination/        # Test coordination (from testing-coordination/)
├─ generated/           # Generated tests
└─ complete-suite/      # Complete test suite
```

### Action: Consolidate Deployment/Ops → `operations/`

**Current Structure** (scattered):

```
/deployment/
/ops/
/operations/
```

**Action**: Keep `/operations/` as primary, move others inside:

```
/operations/
├─ deployment/          # Deployment configs
├─ monitoring/          # Ops monitoring
└─ kubernetes/          # K8s operations (if not infrastructure)
```

---

## 🗂️ PHASE 3: CLEAN BUILD ARTIFACTS & TEMP FILES

### Action: Clean or Move Build Outputs

**Temp Build Directories** (can be deleted if not active):

```
DELETE (regenerated by builds):
- /obj/                 # .NET build artifacts
- /out/                 # Output directory
- /dist/                # Frontend build output
- /cache/               # Cache directory
- /.ci_artifacts_local/ # CI artifacts
- /.ci_test_results/    # CI test results
```

**Note**: Only delete if NOT currently in use. Check with `git status` first.

### Action: Move Temp/Work Directories → `data/temp/`

```
Move to: /data/temp/
- /_CLEAN_BUILD_ZONE/
- /CURRENT_STATUS/
```

---

## 🗂️ PHASE 4: SDK & TOOLS CONSOLIDATION

### Action: Consolidate SDKs

**Current Structure**:

```
/SDK/
/terrafusion-sdk/
/terrafusion-shared/
```

**Decision**: Keep `/SDK/` as primary or merge into one location

### Action: Evaluate Tool Directories

**Tool Directories**:

```
/tools/                     # Generic tools
/terrafusion-ops-tools/     # Ops-specific tools
/terrafusion-ide-electron/  # IDE (might belong in marketplace?)
/terrafusion-swarm/         # Swarm tools (might belong in os-platform?)
```

**Recommendations**:

- `/tools/` - keep in root for general utilities
- `/terrafusion-ops-tools/` - move to `/operations/tools/`
- `/terrafusion-ide-electron/` - evaluate if belongs in `/marketplace/` or
  `/development/`
- `/terrafusion-swarm/` - evaluate if belongs in `/os-platform/ai-systems/`

---

## 🗂️ PHASE 5: SPECIALIZED DIRECTORIES EVALUATION

### Action: Evaluate & Relocate

**Standalone Applications** (might belong in marketplace):

```
Evaluate for /marketplace/:
- /ai-workspace-companion/
- /explain-mode-api/
- /message-coordinator/
- /progress-monitor/
- /native-shell/
- /shock-and-awe-2.0/
- /terrafusion-atlas/
```

**Specialized Systems** (might belong in os-platform):

```
Evaluate for /os-platform/:
- /intelligence/           → /os-platform/ai-systems/?
- /monitoring/             → /os-platform/monitoring/?
- /automation/             → /os-platform/infrastructure/?
```

**Data/Configuration Directories** (organize):

```
Keep in root or /data/:
- /assets/                 # Static assets (keep in root)
- /Brand_Assets/           # Brand assets (move to /assets/brand/)
- /county-data/            # Data files (move to /data/county/)
- /atlas-exports/          # Exports (move to /data/exports/)
- /database/               # Database files (keep in root or /data/)
- /certs/                  # Certificates (keep in root for security)
- /keys/                   # Keys (keep in root for security)
```

**Government/Partners** (organize):

```
Move to /data/ or appropriate location:
- /federal/                → /data/government/federal/
- /gov_deploy_packages/    → /data/government/packages/
- /partners/               → /data/partners/
- /partner-deliverables/   → /data/partners/deliverables/
```

**Sales/Business** (organize):

```
Move to /data/business/:
- /sales/                  → /data/business/sales/
- /grants/                 → /data/business/grants/
```

**Misc Directories**:

```
- /bench/                  → /testing/benchmarks/ or delete
- /badges/                 → /docs/badges/
- /championship/           → /docs/achievements/ or delete
- /compose/                → merge with /docker/ or delete
- /configs/                → merge with /config/
- /expansion/              → /data/planning/expansion/ or delete
- /experience-suite/       → evaluate for /marketplace/
- /governance/             → /data/governance/
- /compliance/             → /data/compliance/
- /hostinger/              → /data/hosting/ or /deployment/hosting/
- /installers/             → /deployment/installers/
- /logs/                   → /data/logs/ (if not active)
- /migration/              → /data/archives/migrations/
- /migrations/             → keep if active database migrations
- /packages/               → evaluate (might be build output)
- /pact/                   → /testing/pact/ or delete
- /performance/            → /testing/performance/ or /monitoring/
- /phase1-audit/           → /data/archives/audits/
- /policies/               → /data/governance/policies/
- /research/               → /data/research/
- /services/               → evaluate (might be microservices, keep in root?)
- /shaders/                → /assets/shaders/ (if graphics-related)
- /technology/             → /docs/technology/ or /data/research/
- /validation/             → /testing/validation/ or /data/archives/
```

**Special Packages**:

```
- /TERRAFUSION_OS_CORE/                    # Evaluate: distribution package?
- /TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE/ # Evaluate: distribution package?
- /AI_AGENT_DEVELOPMENT_ENVIRONMENT/       # Evaluate: keep or move to /development/?
```

---

## 🗂️ PHASE 6: REMOVE DUPLICATE CONFIG FILES

### Action: Consolidate Configuration

**Multiple .env files** (keep necessary ones):

```
KEEP:
- .env                    # Main environment
- .env.example            # Example for developers
- .env.template           # Template for setup

EVALUATE/REMOVE:
- .env.development        # Might be redundant with .env
- .env.production         # Might be redundant or move to /deployment/
- .env.vim                # Editor-specific (unusual)
- .workspace.env          # Workspace-specific (evaluate need)
```

**Multiple test configs** (keep necessary ones):

```
KEEP:
- jest.integration.config.ts
- playwright.config.ts
- vitest.config.ts

ARCHIVE:
- jest.integration.config.ts.EXAMPLE  → /docs/examples/
- vitest.config.ts.EXAMPLE            → /docs/examples/
```

**Other Configs**:

```
KEEP:
- service-registry.json   # If actively used
- performance-budget.json # If actively used
- lighthouserc.json       # If actively used
- stryker.conf.json       # If actively used

REMOVE:
- sig.bin                 # Binary signature file (evaluate need)
- terrafusion-os.pid      # Process ID file (temporary, can delete)
- .session_history        # Session history (temporary, can delete)
- .workspace-map.json     # Workspace map (might be outdated)
```

---

## 🗂️ PHASE 7: FINAL ROOT STRUCTURE (GOAL)

### 🎯 Clean Root Directory Structure

```
/terrafusion_os_1.0/
├─ 📦 PILLAR 1: KERNEL/RUNTIME
│  ├─ backend/                    # .NET 8.0 API
│  ├─ frontend/                   # React/TypeScript UI
│  ├─ terrafusion-cos/            # Python Core OS
│  ├─ data/                       # Data storage (expanded)
│  │  ├─ archives/                # All archives consolidated
│  │  ├─ temp/                    # Temporary files
│  │  ├─ logs/                    # Log files
│  │  ├─ county/                  # County data
│  │  ├─ exports/                 # Exports
│  │  ├─ government/              # Government data
│  │  ├─ partners/                # Partner data
│  │  ├─ business/                # Business data
│  │  ├─ governance/              # Governance & compliance
│  │  └─ research/                # Research data
│  ├─ scripts/                    # Core scripts
│  ├─ config/                     # Core configuration
│  │
├─ 🏛️ PILLAR 2: OS PLATFORM
│  └─ os-platform/                # 11 domains, 21,191 folders
│
├─ 🏪 PILLAR 3: MARKETPLACE
│  └─ marketplace/                # 32 apps, 4,690 folders
│
├─ 🛠️ DEVELOPMENT & INFRASTRUCTURE
│  ├─ .github/                    # GitHub workflows
│  ├─ .vscode/                    # VS Code settings
│  ├─ .husky/                     # Git hooks
│  ├─ .githooks/                  # Additional hooks
│  ├─ .devcontainer/              # Dev container
│  ├─ docker/                     # Docker configs
│  ├─ kubernetes/                 # K8s manifests
│  ├─ terraform/                  # Infrastructure as code
│  ├─ development/                # Development tools
│  │  ├─ design/                  # Design tools
│  │  └─ ide/                     # IDE tools
│  ├─ testing/                    # All testing consolidated
│  │  ├─ unit/
│  │  ├─ integration/
│  │  ├─ e2e/
│  │  ├─ coordination/
│  │  ├─ generated/
│  │  ├─ benchmarks/
│  │  ├─ performance/
│  │  └─ complete-suite/
│  ├─ operations/                 # Operations & deployment
│  │  ├─ deployment/
│  │  ├─ monitoring/
│  │  └─ tools/
│  ├─ tools/                      # General utilities
│  ├─ SDK/                        # TerraFusion SDK
│  ├─ services/                   # Microservices (if applicable)
│  │
├─ 📚 DOCUMENTATION
│  └─ docs/                       # All documentation
│     ├─ reports/                 # Historical reports
│     │  ├─ sessions/
│     │  ├─ weeks/
│     │  ├─ operations/
│     │  ├─ phases/
│     │  ├─ gold-standard/
│     │  └─ status/
│     ├─ architecture/            # Architecture docs
│     ├─ planning/                # Planning docs
│     ├─ audits/                  # Audit reports
│     ├─ examples/                # Example configs
│     ├─ badges/                  # Achievement badges
│     └─ workspace/               # Workspace files
│
├─ 🎨 ASSETS
│  └─ assets/                     # Static assets
│     ├─ brand/                   # Brand assets
│     └─ shaders/                 # Shaders (if applicable)
│
├─ 🔐 SECURITY
│  ├─ certs/                      # Certificates
│  └─ keys/                       # Keys
│
├─ 📦 DEPENDENCIES
│  ├─ node_modules/               # NPM packages
│  └─ .venv/                      # Python virtualenv
│
├─ 🗄️ DATABASE
│  ├─ database/                   # Database files
│  └─ migrations/                 # Active migrations
│
└─ 📄 CONFIG FILES (root level)
   ├─ package.json, package-lock.json
   ├─ .gitignore, .gitattributes, .gitmodules
   ├─ .env, .env.example, .env.template
   ├─ docker-compose.yml
   ├─ Dockerfile.frontend
   ├─ tsconfig.json
   ├─ jest.integration.config.ts
   ├─ playwright.config.ts
   ├─ vitest.config.ts
   ├─ webpack.production.config.js
   ├─ nodemon.json
   ├─ .eslintrc.json, .prettierrc
   ├─ LICENSE
   ├─ README.md
   ├─ Makefile
   └─ global.json
```

---

## 🚀 EXECUTION STRATEGY

### Pre-Execution Checklist

- [ ] **Backup Created**: Full backup before any moves
- [ ] **Git Status Clean**: Commit all pending changes
- [ ] **Git Tag Created**: Tag current state as `pre-root-cleanup`
- [ ] **Build Passing**: Verify build works before cleanup
- [ ] **Documentation Read**: Review this entire plan

### Execution Order (THE TERRAFUSION WAY)

**Phase 1**: Documentation Consolidation (50+ files)

- Create `docs/` structure
- Move all markdown documentation files
- Commit: "Phase 1: Documentation consolidation"
- Tag: `root-cleanup-phase-1`

**Phase 2**: Directory Archives (legacy, reports, backups)

- Create `data/archives/` structure
- Move archive directories
- Commit: "Phase 2: Archive consolidation"
- Tag: `root-cleanup-phase-2`

**Phase 3**: Testing Consolidation

- Create unified `testing/` structure
- Move all test directories
- Update test configs
- Commit: "Phase 3: Testing consolidation"
- Tag: `root-cleanup-phase-3`

**Phase 4**: Development Tools

- Create `development/` structure
- Move design, IDE, and dev tools
- Commit: "Phase 4: Development tools consolidation"
- Tag: `root-cleanup-phase-4`

**Phase 5**: Operations & Deployment

- Organize `operations/` structure
- Move deployment and ops directories
- Commit: "Phase 5: Operations consolidation"
- Tag: `root-cleanup-phase-5`

**Phase 6**: Data Consolidation

- Expand `data/` structure
- Move data, government, partners, business directories
- Commit: "Phase 6: Data consolidation"
- Tag: `root-cleanup-phase-6`

**Phase 7**: Specialized Evaluations

- Evaluate marketplace candidates
- Evaluate os-platform candidates
- Move or keep appropriately
- Commit: "Phase 7: Specialized relocations"
- Tag: `root-cleanup-phase-7`

**Phase 8**: Config & Temp Cleanup

- Remove duplicate configs
- Delete temp files
- Clean build artifacts
- Commit: "Phase 8: Config and temp cleanup"
- Tag: `root-cleanup-phase-8`

**Phase 9**: Final Verification

- Build verification
- Test suite verification
- Documentation update (README.md)
- Commit: "Phase 9: Root cleanup complete - final verification"
- Tag: `root-cleanup-complete`

### Import/Reference Verification Strategy

After each phase:

1. **Search for hardcoded paths**: grep for moved directory names
2. **Check configs**: Review all config files for path references
3. **Test builds**: Run build to catch any broken references
4. **Test scripts**: Run test suite to verify no breaks

---

## 📊 SUCCESS METRICS

- [ ] Root directory has < 30 folders (down from 120+)
- [ ] Root directory has < 30 files (down from 100+)
- [ ] All documentation organized in `docs/`
- [ ] All archives organized in `data/archives/`
- [ ] All testing organized in `testing/`
- [ ] All operations organized in `operations/`
- [ ] Build passing (0 errors)
- [ ] Test suite passing
- [ ] No broken references
- [ ] THREE PILLARS architecture maintained
- [ ] Professional, clean workspace root

---

## ⚠️ RISK MITIGATION

### High-Risk Items (DO NOT MOVE)

- `node_modules/` - Never move, will break everything
- `.venv/` - Python virtual environment, never move
- `.git/` - Git repository, NEVER TOUCH
- `backend/`, `frontend/`, `terrafusion-cos/` - Core pillars
- `os-platform/`, `marketplace/` - Already organized pillars

### Medium-Risk Items (Verify Before Moving)

- `services/` - Might be active microservices
- `migrations/` - Might be active database migrations
- `database/` - Might have hardcoded paths
- Any directory with `node_modules` subdirectories

### Low-Risk Items (Safe to Move)

- Documentation markdown files
- Archive directories
- Report directories
- Planning directories
- Old backup files

---

## 🎯 THE TERRAFUSION WAY PRINCIPLES

1. **Nothing Left Undone**: Complete all 9 phases
2. **Test Everything**: Verify after each phase
3. **Git Discipline**: Commit and tag each phase
4. **Stay on Track**: Follow the plan sequentially
5. **Clear Communication**: Document all changes

---

## 📝 NOTES

- This cleanup maintains THREE PILLARS architecture
- This cleanup organizes the workspace for professional presentation
- This cleanup makes the codebase easier to navigate
- This cleanup consolidates scattered functionality
- This cleanup eliminates redundancy and duplication

**Estimated Time**: 2-3 hours (with verification) **Complexity**: Medium (many
moves, but low risk if done carefully) **Impact**: High (much cleaner, more
professional workspace)

---

## 🏆 FINAL GOAL

**A world-class workspace root that reflects the THREE PILLARS architecture:**

- Clean and professional
- Easy to navigate
- Well-organized
- Properly documented
- Build-passing
- Ready for production

**THE TERRAFUSION WAY: NOTHING LEFT UNDONE** ✨

---

_Generated: October 15, 2025_  
_Status: READY FOR EXECUTION_
