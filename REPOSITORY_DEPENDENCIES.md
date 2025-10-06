# 🔗 TerraFusion OS Repository Dependencies

**Version:** 1.0  
**Date:** October 6, 2025  
**Purpose:** Document inter-repository relationships, shared dependencies, and integration points

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Dependency Graph](#dependency-graph)
3. [Repository Details](#repository-details)
4. [Shared Dependencies](#shared-dependencies)
5. [Integration Points](#integration-points)
6. [Development Guidelines](#development-guidelines)
7. [Update Protocol](#update-protocol)

---

## 🎯 Overview

TerraFusion OS uses a **polyrepo architecture** with 12 independent repositories. This document maps dependencies between repositories to help developers understand:

- **Which repos depend on which**
- **How changes propagate across repos**
- **What to test when making changes**
- **Development and deployment order**

---

## 📊 Dependency Graph

### Visual Dependency Tree

```
┌─────────────────────────────────────────────────────────┐
│                  terrafusion_os_1.0                     │
│              (Coordination Repository)                   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ orchestrates
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
   ┌────▼─────┐                         ┌────▼────┐
   │ Core     │                         │ Shared  │
   │ Layer    │                         │ Layer   │
   └────┬─────┘                         └────┬────┘
        │                                     │
        ├─────────────────────────────────────┤
        │                                     │
   ┌────▼──────────────────────────────────┬─▼─────┐
   │ terrafusion-core                      │ terrafusion-shared │
   │ (OS kernel, base services)            │ (utilities, types) │
   └────┬──────────────────────────────────┴─┬─────┘
        │                                     │
        │ dependencies                        │
        │                                     │
   ┌────▼─────────────────────────────────────▼────┐
   │ terrafusion-packages                          │
   │ (reusable components)                         │
   └────┬──────────────────────────────────────────┘
        │
        │ used by
        │
   ┌────▼──────────────────────────────────────────┐
   │ terrafusion-modules                           │
   │ (core module implementations)                 │
   └────┬──────────────────────────────────────────┘
        │
        │ extended by
        │
   ┌────┴────────────────────────────────────────────┐
   │                                                   │
   │          Domain-Specific Repositories            │
   │                                                   │
   ├───────────────┬───────────────┬──────────────────┤
   │               │               │                  │
┌──▼───────┐  ┌───▼────────┐  ┌──▼────────┐  ┌──────▼─────┐
│Government│  │Commercial  │  │AI Platform│  │Infrastructure│
│Platform  │  │Platform    │  │           │  │Platform     │
└──────────┘  └────────────┘  └───────────┘  └─────────────┘
   │               │               │                  │
   │               │               └──────────────────┤
   │               │                                  │
┌──▼────────┐  ┌──▼──────┐              ┌────────────▼──────┐
│Specialized│  │Developer│              │UI Components      │
│Modules    │  │Tools    │              │                   │
└───────────┘  └─────────┘              └───────────────────┘
```

### Dependency Levels

**Level 0: Coordination**
- `terrafusion_os_1.0` (orchestration, deployment configs)

**Level 1: Foundation (No dependencies)**
- `terrafusion-core` (OS kernel)
- `terrafusion-shared` (utilities)

**Level 2: Infrastructure (Depends on Level 1)**
- `terrafusion-packages` (depends on: core, shared)
- `terrafusion-modules` (depends on: core, shared, packages)
- `terrafusion-infrastructure-platform` (depends on: core, shared)

**Level 3: Domain Platforms (Depends on Level 1-2)**
- `terrafusion-government-platform` (depends on: core, shared, packages)
- `terrafusion-commercial-platform` (depends on: core, shared, packages)
- `terrafusion-ai-platform` (depends on: core, shared, infrastructure-platform)

**Level 4: Specialized & Tools (Depends on Level 1-3)**
- `terrafusion-specialized-modules` (depends on: core, shared, packages)
- `terrafusion-developer-tools` (depends on: core, shared)
- `terrafusion-ui-components` (depends on: shared [types only])
- `terrafusion-docs` (documentation only, no code dependencies)

---

## 📦 Repository Details

### terrafusion-core

**Purpose:** OS kernel, base services, runtime engine  
**GitHub:** https://github.com/bsvalues/terrafusion-core  
**Language:** C#, Python  
**Dependencies:** None (foundation layer)

**Dependents:**
- ALL other repositories depend on this

**Published Packages:**
- `@terrafusion/core` (npm)
- `terrafusion-core` (PyPI)

**Breaking Change Impact:** 🔴 CRITICAL - affects all repos

---

### terrafusion-shared

**Purpose:** Shared utilities, common types, helpers  
**GitHub:** https://github.com/bsvalues/terrafusion-shared  
**Language:** TypeScript, Python  
**Dependencies:** None (foundation layer)

**Dependents:**
- ALL other repositories depend on this

**Published Packages:**
- `@terrafusion/shared` (npm)
- `terrafusion-shared` (PyPI)

**Breaking Change Impact:** 🔴 CRITICAL - affects all repos

---

### terrafusion-packages

**Purpose:** Reusable components and packages  
**GitHub:** https://github.com/bsvalues/terrafusion-packages  
**Language:** TypeScript, C#, Python  

**Dependencies:**
- `terrafusion-core`
- `terrafusion-shared`

**Dependents:**
- `terrafusion-government-platform`
- `terrafusion-commercial-platform`
- `terrafusion-specialized-modules`

**Published Packages:**
- `@terrafusion/packages` (npm)
- `terrafusion-packages` (PyPI)

**Breaking Change Impact:** 🟡 MODERATE - affects 3+ domain repos

---

### terrafusion-modules

**Purpose:** Core module implementations  
**GitHub:** https://github.com/bsvalues/terrafusion-modules  
**Language:** TypeScript, C#, Python  

**Dependencies:**
- `terrafusion-core`
- `terrafusion-shared`
- `terrafusion-packages`

**Dependents:**
- Domain platforms may import specific modules

**Published Packages:**
- `@terrafusion/modules` (npm)

**Breaking Change Impact:** 🟡 MODERATE - affects domain repos using specific modules

---

### terrafusion-government-platform

**Purpose:** Government operations, property assessment, PACS integration  
**GitHub:** https://github.com/bsvalues/terrafusion-government-platform  
**Language:** C#, Python, TypeScript  
**Size:** 15.88 MB, 1,381 files

**Dependencies:**
- `terrafusion-core` (required)
- `terrafusion-shared` (required)
- `terrafusion-packages` (required)
- `terrafusion-infrastructure-platform` (optional - for monitoring)

**Dependents:**
- None (leaf node - application layer)

**Published Packages:**
- `@terrafusion/government` (npm)

**Breaking Change Impact:** 🟢 LOW - isolated to government domain

---

### terrafusion-commercial-platform

**Purpose:** Commercial real estate, market analysis, portfolio management  
**GitHub:** https://github.com/bsvalues/terrafusion-commercial-platform  
**Language:** C#, Python, TypeScript  
**Size:** 29.32 MB, 905 files

**Dependencies:**
- `terrafusion-core` (required)
- `terrafusion-shared` (required)
- `terrafusion-packages` (required)
- `terrafusion-infrastructure-platform` (optional - for monitoring)

**Dependents:**
- None (leaf node - application layer)

**Published Packages:**
- `@terrafusion/commercial` (npm)

**Breaking Change Impact:** 🟢 LOW - isolated to commercial domain

---

### terrafusion-ai-platform

**Purpose:** AI swarm (50,000+ agents), neural systems, Supreme Commander Claude  
**GitHub:** https://github.com/bsvalues/terrafusion-ai-platform  
**Language:** Python, Rust  
**Size:** 1.38 MB, 226 files

**Dependencies:**
- `terrafusion-core` (required)
- `terrafusion-shared` (required)
- `terrafusion-infrastructure-platform` (required - for health checks)

**Dependents:**
- `terrafusion-government-platform` (uses AI services)
- `terrafusion-commercial-platform` (uses AI services)

**Published Packages:**
- `terrafusion-ai` (PyPI)

**Breaking Change Impact:** 🟡 MODERATE - government and commercial platforms consume AI services

---

### terrafusion-infrastructure-platform

**Purpose:** Infrastructure services, monitoring, logging, health checks  
**GitHub:** https://github.com/bsvalues/terrafusion-infrastructure-platform  
**Language:** Python, TypeScript  
**Size:** 5.05 MB, 408 files

**Dependencies:**
- `terrafusion-core` (required)
- `terrafusion-shared` (required)

**Dependents:**
- `terrafusion-government-platform` (monitoring integration)
- `terrafusion-commercial-platform` (monitoring integration)
- `terrafusion-ai-platform` (health reporting)

**Published Packages:**
- `@terrafusion/infrastructure` (npm)
- `terrafusion-infrastructure` (PyPI)

**Breaking Change Impact:** 🟡 MODERATE - affects all platforms using monitoring

---

### terrafusion-specialized-modules

**Purpose:** Domain-specific tools (GIS, analytics, compliance)  
**GitHub:** https://github.com/bsvalues/terrafusion-specialized-modules  
**Language:** Python, C#  
**Size:** 1.26 MB, 214 files

**Dependencies:**
- `terrafusion-core` (required)
- `terrafusion-shared` (required)
- `terrafusion-packages` (required)

**Dependents:**
- `terrafusion-government-platform` (GIS, compliance tools)
- `terrafusion-commercial-platform` (analytics tools)

**Published Packages:**
- `@terrafusion/specialized` (npm)

**Breaking Change Impact:** 🟡 MODERATE - affects platforms using specialized tools

---

### terrafusion-developer-tools

**Purpose:** Testing frameworks, development utilities  
**GitHub:** https://github.com/bsvalues/terrafusion-developer-tools  
**Language:** Shell Scripts, Python  
**Size:** 0.00 MB, 4 files

**Dependencies:**
- `terrafusion-core` (for integration testing)
- `terrafusion-shared` (test utilities)

**Dependents:**
- ALL repositories (dev dependency only)

**Published Packages:**
- `@terrafusion/dev-tools` (npm)

**Breaking Change Impact:** 🟢 LOW - dev-only dependency

---

### terrafusion-docs

**Purpose:** Architecture documentation, guides, API references  
**GitHub:** https://github.com/bsvalues/terrafusion-docs  
**Language:** Markdown  
**Size:** 5.16 MB, 307 files

**Dependencies:**
- None (documentation only)

**Dependents:**
- None (referenced by all repos but not code dependency)

**Breaking Change Impact:** 🟢 NONE - documentation only

---

### terrafusion-ui-components

**Purpose:** Shared UI components, design system  
**GitHub:** https://github.com/bsvalues/terrafusion-ui-components  
**Language:** TypeScript, CSS  
**Size:** 0.02 MB, 14 files

**Dependencies:**
- `terrafusion-shared` (TypeScript types only)

**Dependents:**
- `terrafusion-government-platform` (UI components)
- `terrafusion-commercial-platform` (UI components)

**Published Packages:**
- `@terrafusion/ui-components` (npm)

**Breaking Change Impact:** 🟡 MODERATE - affects platform UIs

---

## 🔄 Shared Dependencies

### External Package Dependencies

**All Repositories Share:**

**npm packages:**
- `typescript` (v5.x)
- `eslint` (v8.x)
- `prettier` (v3.x)
- `jest` (v29.x) or `vitest` (v1.x)

**Python packages:**
- `pytest` (v8.x)
- `black` (formatter)
- `flake8` (linter)
- `mypy` (type checking)

### Database Dependencies

**PostgreSQL** (shared across platforms):
- `terrafusion-government-platform` (property data)
- `terrafusion-commercial-platform` (market data)
- `terrafusion-ai-platform` (training data)

**Redis** (caching):
- `terrafusion-infrastructure-platform` (cache layer)
- `terrafusion-ai-platform` (session storage)

---

## 🔌 Integration Points

### API Contracts

**terrafusion-core REST API** (consumed by all platforms)
- Endpoint: `/api/v1/core/*`
- Authentication: JWT tokens
- Rate limit: 1000 req/min per platform

**terrafusion-ai-platform API** (consumed by government, commercial)
- Endpoint: `/api/v1/ai/*`
- Services: Valuation, prediction, swarm coordination
- Authentication: API keys

**terrafusion-infrastructure-platform Monitoring** (used by all)
- Endpoint: `/api/v1/metrics/*`
- Metrics: Health, performance, errors
- Push-based (platforms report to infrastructure)

### Message Queues

**RabbitMQ** (async communication)
- `terrafusion-government-platform` → `terrafusion-ai-platform` (valuation requests)
- `terrafusion-commercial-platform` → `terrafusion-ai-platform` (market predictions)
- `terrafusion-ai-platform` → All platforms (swarm notifications)

### Event Bus

**Azure Event Grid** (domain events)
- Property updated → triggers revaluation
- Market data changed → triggers analysis
- AI model updated → triggers re-prediction

---

## 🛠️ Development Guidelines

### When Making Changes

**1. Core or Shared Library Changes**
- ⚠️ CRITICAL: Test in ALL dependent repos
- Update version (semantic versioning)
- Publish to npm/PyPI
- Update all repos to new version
- Coordinate deployment across all platforms

**2. Infrastructure Platform Changes**
- Test in government, commercial, and AI platforms
- Check monitoring integrations
- Verify health check endpoints
- Update all platforms after deployment

**3. AI Platform Changes**
- Test government and commercial integrations
- Verify API contract compatibility
- Check message queue consumers
- Deploy during low-traffic window

**4. Domain Platform Changes**
- Test only that platform
- No cross-platform coordination needed
- Deploy independently

### Testing Strategy

**Unit Tests** (in each repo)
```bash
cd terrafusion-government-platform
npm test  # or pytest
```

**Integration Tests** (in coordination repo)
```bash
cd terrafusion_os_1.0
npm run test:integration
# Tests interactions between repos
```

**E2E Tests** (in coordination repo)
```bash
cd terrafusion_os_1.0
npm run test:e2e
# Tests full user workflows across repos
```

---

## 🔄 Update Protocol

### Dependency Update Flow

**Step 1: Foundation Changes (core, shared)**
```
1. Make changes in terrafusion-core or terrafusion-shared
2. Bump version (e.g., 1.0.0 → 1.1.0)
3. Run tests locally
4. Create PR and get approval
5. Merge to main
6. CI/CD publishes to npm/PyPI
7. Update all dependent repos:
   - terrafusion-packages
   - terrafusion-modules
   - terrafusion-infrastructure-platform
   - All domain platforms
```

**Step 2: Infrastructure Changes**
```
1. Make changes in terrafusion-infrastructure-platform
2. Bump version
3. Test with government, commercial, AI platforms
4. Create PR and merge
5. Deploy infrastructure first
6. Update platforms to new version
7. Deploy platforms
```

**Step 3: Domain Platform Changes**
```
1. Make changes in specific platform
2. Test locally and with integration tests
3. Create PR and merge
4. Deploy independently (no coordination needed)
```

### Version Compatibility Matrix

| Core Version | Shared Version | Package Version | Compatible Platforms |
|-------------|----------------|-----------------|---------------------|
| 1.0.x       | 1.0.x          | 1.0.x           | All v1.0.x          |
| 1.1.x       | 1.1.x          | 1.1.x           | All v1.1.x          |
| 2.0.x       | 2.0.x          | 2.0.x           | All v2.0.x          |

**Rule:** Major version changes require coordinated updates across all repos.

---

## 📈 Dependency Health Dashboard

### Current Status (October 6, 2025)

| Repository | Version | Core Dep | Shared Dep | Status |
|------------|---------|----------|------------|--------|
| **terrafusion-core** | 1.0.0 | - | - | ✅ Healthy |
| **terrafusion-shared** | 1.0.0 | - | - | ✅ Healthy |
| **terrafusion-packages** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-modules** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-government-platform** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-commercial-platform** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-ai-platform** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-infrastructure-platform** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-specialized-modules** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-developer-tools** | 1.0.0 | 1.0.0 | 1.0.0 | ✅ Healthy |
| **terrafusion-ui-components** | 1.0.0 | - | 1.0.0 | ✅ Healthy |
| **terrafusion-docs** | 1.0.0 | - | - | ✅ Healthy |

**All repositories are on compatible versions.** ✅

---

## 🚨 Breaking Change Checklist

When making breaking changes in foundation repos (core, shared):

- [ ] Document breaking changes in CHANGELOG.md
- [ ] Update version (major bump: 1.0.0 → 2.0.0)
- [ ] Test in ALL dependent repositories
- [ ] Create migration guide for developers
- [ ] Notify all team leads
- [ ] Schedule coordinated deployment
- [ ] Update this dependency document
- [ ] Update POLYREPO_STATUS.md

---

## 📚 Additional Resources

- **[POLYREPO_MIGRATION_GUIDE.md](./POLYREPO_MIGRATION_GUIDE.md)** - Developer migration guide
- **[POLYREPO_QUICK_REFERENCE.md](./POLYREPO_QUICK_REFERENCE.md)** - Quick command reference
- **[POLYREPO_STATUS.md](./POLYREPO_STATUS.md)** - Live repository status
- **[PHASE_3C_EXTRACTION_COMPLETE.md](./PHASE_3C_EXTRACTION_COMPLETE.md)** - Extraction details

---

**Document Status:** ✅ Complete  
**Last Updated:** October 6, 2025  
**Maintainer:** TerraFusion Platform Team  
**Review Frequency:** Monthly or after major dependency changes
