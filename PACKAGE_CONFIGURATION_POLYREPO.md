# 📦 TerraFusion OS Package Configuration - Polyrepo Update

**Version:** 1.0  
**Date:** October 6, 2025  
**Purpose:** Document package configuration changes after polyrepo extraction

---

## 🎯 Overview

With the transition to **polyrepo architecture**, package dependencies have been distributed across 12 independent repositories. This document explains what changed and where dependencies now live.

---

## 📋 Coordination Repository (terrafusion_os_1.0)

### package.json Updates

**Status:** ✅ Updated

**Changes Made:**
```json
{
  "name": "terrafusion-os",
  "version": "1.0.0",
  "description": "Government AI Operating System - Coordination Repository (Polyrepo Architecture)",
  "repository": {
    "type": "git",
    "url": "https://github.com/bsvalues/terrafusion_os_1.0.git"
  },
  "polyrepo": {
    "architecture": "Domain-Driven Design (DDD)",
    "totalRepositories": 12,
    "extractionPhase": "Phase 3C (October 2025)",
    "repositories": {
      "core": [
        "@terrafusion/core",
        "@terrafusion/shared",
        "@terrafusion/packages",
        "@terrafusion/modules"
      ],
      "domains": [
        "terrafusion-government-platform",
        "terrafusion-commercial-platform",
        "terrafusion-ai-platform",
        "terrafusion-infrastructure-platform"
      ],
      "specialized": [
        "terrafusion-specialized-modules",
        "terrafusion-developer-tools",
        "terrafusion-docs",
        "terrafusion-ui-components"
      ]
    },
    "documentation": [
      "POLYREPO_MIGRATION_GUIDE.md",
      "POLYREPO_QUICK_REFERENCE.md",
      "POLYREPO_STATUS.md",
      "REPOSITORY_DEPENDENCIES.md"
    ]
  }
}
```

**Key Updates:**
- ✅ Updated description to reflect coordination role
- ✅ Added `polyrepo` metadata section documenting architecture
- ✅ Added repository URLs
- ✅ Note in dependencies explaining extraction

---

## 📦 Individual Repository Packages

### Core Infrastructure Repositories

#### 1. terrafusion-core

**Package Name:** `@terrafusion/core`  
**Registry:** npm, PyPI  
**Version:** 1.0.0

**package.json** (Expected):
```json
{
  "name": "@terrafusion/core",
  "version": "1.0.0",
  "description": "TerraFusion OS Core - Kernel and base services",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": "https://github.com/bsvalues/terrafusion-core",
  "dependencies": {
    "note": "Minimal dependencies - foundation layer"
  },
  "peerDependencies": {},
  "publishConfig": {
    "access": "public"
  }
}
```

**requirements.txt** (Expected):
```txt
# TerraFusion Core - Python packages
# Minimal dependencies for foundation layer
```

---

#### 2. terrafusion-shared

**Package Name:** `@terrafusion/shared`  
**Registry:** npm, PyPI  
**Version:** 1.0.0

**package.json** (Expected):
```json
{
  "name": "@terrafusion/shared",
  "version": "1.0.0",
  "description": "TerraFusion OS Shared - Common utilities and types",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": "https://github.com/bsvalues/terrafusion-shared",
  "dependencies": {
    "note": "Minimal dependencies - foundation layer"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

---

#### 3. terrafusion-packages

**Package Name:** `@terrafusion/packages`  
**Registry:** npm, PyPI  
**Version:** 1.0.0

**Dependencies:**
```json
{
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0"
  }
}
```

---

#### 4. terrafusion-modules

**Package Name:** `@terrafusion/modules`  
**Registry:** npm  
**Version:** 1.0.0

**Dependencies:**
```json
{
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0",
    "@terrafusion/packages": "^1.0.0"
  }
}
```

---

### Domain Platform Repositories

#### 5. terrafusion-government-platform

**Package Name:** `@terrafusion/government` (optional - if published)  
**Type:** Application (not published as library)

**package.json** (Expected):
```json
{
  "name": "terrafusion-government-platform",
  "version": "1.0.0",
  "description": "TerraFusion Government Platform - County operations and property assessment",
  "private": true,
  "repository": "https://github.com/bsvalues/terrafusion-government-platform",
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0",
    "@terrafusion/packages": "^1.0.0",
    "note": "Other dependencies specific to government platform"
  }
}
```

**requirements.txt** (Expected):
```txt
# TerraFusion Government Platform - Python dependencies
terrafusion-core>=1.0.0
terrafusion-shared>=1.0.0
# Other Python dependencies for government operations
```

---

#### 6. terrafusion-commercial-platform

**Dependencies:**
```json
{
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0",
    "@terrafusion/packages": "^1.0.0"
  }
}
```

---

#### 7. terrafusion-ai-platform

**Package Name:** `terrafusion-ai` (PyPI)  
**Primary Language:** Python + Rust

**requirements.txt** (Expected):
```txt
# TerraFusion AI Platform - Python dependencies
terrafusion-core>=1.0.0
terrafusion-shared>=1.0.0
terrafusion-infrastructure>=1.0.0

# AI/ML specific dependencies
tensorflow>=2.13.0
torch>=2.0.0
transformers>=4.30.0
# ... other AI dependencies
```

---

#### 8. terrafusion-infrastructure-platform

**Dependencies:**
```json
{
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0"
  }
}
```

**requirements.txt** (Expected):
```txt
# TerraFusion Infrastructure Platform
terrafusion-core>=1.0.0
terrafusion-shared>=1.0.0

# Monitoring and observability
prometheus-client>=0.17.0
azure-monitor-opentelemetry>=1.0.0
# ... other infrastructure dependencies
```

---

### Specialized & Tools Repositories

#### 9. terrafusion-specialized-modules

**Dependencies:**
```json
{
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0",
    "@terrafusion/packages": "^1.0.0"
  }
}
```

---

#### 10. terrafusion-developer-tools

**Dependencies:**
```json
{
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0"
  },
  "devDependencies": {
    "note": "Testing frameworks and dev utilities"
  }
}
```

---

#### 11. terrafusion-docs

**Type:** Documentation (static site)

**package.json** (Expected):
```json
{
  "name": "terrafusion-docs",
  "version": "1.0.0",
  "description": "TerraFusion Documentation Site",
  "private": true,
  "dependencies": {
    "vitepress": "^1.0.0",
    "note": "or Docusaurus for static site generation"
  }
}
```

---

#### 12. terrafusion-ui-components

**Package Name:** `@terrafusion/ui-components`  
**Registry:** npm  
**Version:** 1.0.0

**package.json** (Expected):
```json
{
  "name": "@terrafusion/ui-components",
  "version": "1.0.0",
  "description": "TerraFusion UI Components - Design system and shared components",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": "https://github.com/bsvalues/terrafusion-ui-components",
  "dependencies": {
    "@terrafusion/shared": "^1.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

---

## 🔄 Dependency Management Strategy

### Published Packages (Libraries)

**Repositories that will be published:**
- ✅ `@terrafusion/core` (npm + PyPI)
- ✅ `@terrafusion/shared` (npm + PyPI)
- ✅ `@terrafusion/packages` (npm + PyPI)
- ✅ `@terrafusion/modules` (npm)
- ✅ `@terrafusion/ui-components` (npm)
- ✅ `terrafusion-ai` (PyPI)
- ✅ `terrafusion-infrastructure` (PyPI)

**Publishing Strategy:**
- Automatic publishing on merge to main (Phase 4 - CI/CD)
- Semantic versioning (semver)
- GitHub Releases with changelogs

---

### Application Repositories (Not Published)

**Repositories that are applications (not libraries):**
- `terrafusion-government-platform` (deployed, not published)
- `terrafusion-commercial-platform` (deployed, not published)
- `terrafusion-specialized-modules` (application code)
- `terrafusion-developer-tools` (internal tools)
- `terrafusion-docs` (static site)

These consume published packages but don't publish themselves.

---

## 📋 Migration Checklist

### For Each Repository (Phase 4)

- [ ] Create/update `package.json` with proper metadata
- [ ] Add repository URL
- [ ] Configure dependencies on core/shared packages
- [ ] Set up semantic versioning
- [ ] Configure npm/PyPI publishing (if library)
- [ ] Set up CI/CD for automated publishing
- [ ] Add `CHANGELOG.md` for version tracking
- [ ] Configure branch protection requiring version bumps

---

## 🚀 Version Management

### Semantic Versioning Strategy

**Major Version (1.0.0 → 2.0.0):**
- Breaking API changes
- Requires coordinated updates across all repos

**Minor Version (1.0.0 → 1.1.0):**
- New features (backward compatible)
- Optional for dependent repos to upgrade

**Patch Version (1.0.0 → 1.0.1):**
- Bug fixes
- Security patches
- Recommended to upgrade immediately

---

### Version Compatibility Matrix

| Core Version | Shared Version | Compatible Platforms |
|-------------|----------------|---------------------|
| 1.0.x       | 1.0.x          | All 1.0.x platforms |
| 1.1.x       | 1.1.x          | All 1.1.x platforms |
| 2.0.x       | 2.0.x          | All 2.0.x platforms |

**Rule:** All repos should stay on the same major version of core/shared packages.

---

## 🔧 Local Development

### Using npm link (JavaScript/TypeScript)

```bash
# In terrafusion-shared (dependency)
cd terrafusion-shared
npm link

# In terrafusion-government-platform (consumer)
cd ../terrafusion-government-platform
npm link @terrafusion/shared

# Now changes in shared are immediately reflected
```

### Using pip install -e (Python)

```bash
# In terrafusion-shared (dependency)
cd terrafusion-shared
pip install -e .

# In terrafusion-ai-platform (consumer)
cd ../terrafusion-ai-platform
pip install -e ../terrafusion-shared

# Now changes in shared are immediately reflected
```

---

## 📚 Additional Resources

- **[POLYREPO_MIGRATION_GUIDE.md](./POLYREPO_MIGRATION_GUIDE.md)** - Full migration guide
- **[REPOSITORY_DEPENDENCIES.md](./REPOSITORY_DEPENDENCIES.md)** - Detailed dependency mapping
- **[CI_CD_POLYREPO_IMPLEMENTATION_PLAN.md](./CI_CD_POLYREPO_IMPLEMENTATION_PLAN.md)** - CI/CD and publishing strategy
- **[POLYREPO_STATUS.md](./POLYREPO_STATUS.md)** - Current status of all repos

---

## 📝 Next Steps

### Phase 4A: Set Up Package Publishing (November 2025)

1. Configure npm organization: `@terrafusion`
2. Set up PyPI publishing credentials
3. Create publish workflows in GitHub Actions
4. Test publishing pipeline in staging
5. Publish initial 1.0.0 versions

### Phase 4B: Configure Dependencies (November 2025)

1. Update all repos to consume published packages
2. Configure Dependabot for automated updates
3. Set up security scanning
4. Test dependency update workflow

---

**Document Status:** ✅ Complete  
**Last Updated:** October 6, 2025  
**Next Update:** After Phase 4A package publishing setup  
**Maintainer:** TerraFusion Platform Team
