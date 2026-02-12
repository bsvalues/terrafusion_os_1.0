# 🚀 TerraFusion OS Polyrepo Migration Guide

**Version:** 1.0  
**Date:** October 6, 2025  
**Status:** Production Ready  
**Target Audience:** Developers, DevOps Engineers, Team Leads

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What Changed](#what-changed)
3. [Why Polyrepo](#why-polyrepo)
4. [Getting Started](#getting-started)
5. [Working with Multiple Repositories](#working-with-multiple-repositories)
6. [Development Workflows](#development-workflows)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [FAQ](#faq)

---

## 🎯 Overview

### What is This Guide?

This guide helps developers transition from the **monorepo architecture** (where all code lived in one repository) to the new **polyrepo architecture** (where code is split across 12 independent repositories organized by domain).

### Who Should Read This?

- **Developers** working on TerraFusion OS code
- **DevOps Engineers** managing CI/CD and deployments
- **Team Leads** coordinating multi-repo development
- **Contributors** new to the TerraFusion ecosystem

### Timeline

- **Phase 3B** (September 2025): Core repositories extracted (4 repos)
- **Phase 3C** (October 2025): Domain repositories extracted (8 repos)
- **Phase 3D** (October 2025): Monorepo cleanup and migration (current)

---

## 🔄 What Changed

### Before: Monorepo Architecture

```
terrafusion_os_1.0/
├── core/                 # OS kernel
├── shared/               # Shared utilities
├── packages/             # Reusable packages
├── modules/              # All modules
│   ├── government/       # Government domain
│   ├── commercial/       # Commercial domain
│   ├── ai/              # AI domain
│   └── ...              # All other domains
└── README.md            # Single README
```

**Characteristics:**
- ✅ One repository to clone
- ✅ Easy to search across all code
- ❌ Slow CI/CD (entire system rebuilt on every change)
- ❌ Unclear domain boundaries
- ❌ Difficult to scale teams
- ❌ Tight coupling between unrelated modules

### After: Polyrepo Architecture

```
GitHub Organization: bsvalues
├── terrafusion-core                      # Core OS kernel
├── terrafusion-shared                    # Shared utilities
├── terrafusion-packages                  # Reusable packages
├── terrafusion-modules                   # Core modules
├── terrafusion-government-platform       # Government domain
├── terrafusion-commercial-platform       # Commercial domain
├── terrafusion-ai-platform              # AI domain
├── terrafusion-infrastructure-platform   # Infrastructure
├── terrafusion-specialized-modules       # Specialized tools
├── terrafusion-developer-tools          # Dev tools
├── terrafusion-docs                     # Documentation
├── terrafusion-ui-components            # UI components
└── terrafusion_os_1.0                   # Coordination repo (this one)
```

**Characteristics:**
- ✅ Clear domain boundaries
- ✅ Fast, independent CI/CD per repo
- ✅ Teams work independently
- ✅ Flexible technology choices
- ✅ Better security (granular access)
- ❌ More repos to manage
- ❌ Need to clone multiple repos

---

## 💡 Why Polyrepo?

### Strategic Benefits

1. **Team Scalability**
   - Teams own specific domains
   - Independent release cycles
   - Parallel development without conflicts

2. **CI/CD Performance**
   - Government platform: 2 min build (vs 45 min monorepo)
   - AI platform: 1 min build
   - Deploy one domain without affecting others

3. **Clear Ownership**
   - Each repo has a dedicated team
   - Clear responsibility boundaries
   - Easier to track issues and features

4. **Technology Flexibility**
   - Government platform: C# .NET focus
   - AI platform: Python + Rust focus
   - Infrastructure: Python + monitoring tools
   - Each team chooses optimal tech

5. **Security & Access Control**
   - Grant access per domain
   - Sensitive government code separate from public APIs
   - Audit access more granularly

6. **Reduced Complexity**
   - Government devs don't need AI code
   - Commercial team focused on their domain
   - Smaller, more understandable codebases

---

## 🚀 Getting Started

### Step 1: Understand the Repository Structure

**Core Repositories (Infrastructure Layer)**
- `terrafusion-core`: OS kernel, base services
- `terrafusion-shared`: Common utilities, types
- `terrafusion-packages`: Reusable components
- `terrafusion-modules`: Core module implementations

**Domain Repositories (Business Layer)**
- `terrafusion-government-platform`: County operations
- `terrafusion-commercial-platform`: Commercial real estate
- `terrafusion-ai-platform`: AI swarm, neural systems
- `terrafusion-infrastructure-platform`: Monitoring, health
- `terrafusion-specialized-modules`: GIS, analytics, compliance
- `terrafusion-developer-tools`: Testing, dev utilities
- `terrafusion-docs`: Architecture documentation
- `terrafusion-ui-components`: UI/UX components

**Coordination Repository**
- `terrafusion_os_1.0`: This monorepo (deployment configs, orchestration)

### Step 2: Determine What You Need

**Scenario 1: Working on Government Features**
```bash
# Clone only what you need
git clone https://github.com/bsvalues/terrafusion-government-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-shared.git
```

**Scenario 2: Working on AI Systems**
```bash
git clone https://github.com/bsvalues/terrafusion-ai-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-infrastructure-platform.git
```

**Scenario 3: Full System Development**
```bash
# Use the helper script (see Common Tasks section)
# This clones all 12 repos into organized structure
./scripts/clone-all-repos.sh
```

**Scenario 4: Just Looking Around**
```bash
# Clone the coordination repo for documentation
git clone https://github.com/bsvalues/terrafusion_os_1.0.git
```

### Step 3: Set Up Your Workspace

**Option A: Side-by-Side Directories (Recommended)**
```
~/terrafusion/
├── terrafusion-core/
├── terrafusion-government-platform/
├── terrafusion-ai-platform/
└── terrafusion_os_1.0/  # Coordination repo
```

**Option B: Nested Structure**
```
~/terrafusion_os_1.0/     # Main coordination repo
└── repos/                # Subdir for other repos
    ├── terrafusion-core/
    ├── terrafusion-government-platform/
    └── terrafusion-ai-platform/
```

**Option C: VS Code Multi-Root Workspace**
```json
{
  "folders": [
    { "path": "../terrafusion-core" },
    { "path": "../terrafusion-government-platform" },
    { "path": "../terrafusion-ai-platform" },
    { "path": "." }
  ]
}
```

---

## 🔨 Working with Multiple Repositories

### Managing Dependencies

**Direct Dependencies (via Package Manager)**
```json
// package.json in terrafusion-government-platform
{
  "dependencies": {
    "@terrafusion/core": "^1.0.0",
    "@terrafusion/shared": "^1.0.0"
  }
}
```

**Local Development (npm link)**
```bash
# In terrafusion-shared
npm link

# In terrafusion-government-platform
npm link @terrafusion/shared

# Now changes in shared are immediately reflected
```

**Local Development (Python)**
```bash
# In terrafusion-shared
pip install -e .

# In terrafusion-government-platform
pip install -e ../terrafusion-shared
```

### Cross-Repository Changes

**Scenario: Feature spans multiple repos**

```bash
# 1. Create feature branch in each repo
cd terrafusion-core
git checkout -b feature/new-authentication

cd ../terrafusion-government-platform
git checkout -b feature/new-authentication

# 2. Make changes in dependency first (core)
cd ../terrafusion-core
# ... make changes ...
git commit -m "Add new authentication interface"

# 3. Make changes in dependent repo (government)
cd ../terrafusion-government-platform
# ... make changes ...
git commit -m "Implement new authentication in government platform"

# 4. Create PRs for each repo
# Link PRs together in description: "Depends on bsvalues/terrafusion-core#123"
```

### Testing Across Repositories

**Integration Testing**
```bash
# Use the coordination repo for integration tests
cd terrafusion_os_1.0
npm run test:integration

# This tests interactions between repos
```

**Local Development Testing**
```bash
# Run tests in each repo
cd terrafusion-core
npm test

cd ../terrafusion-government-platform
npm test
```

---

## 🔄 Development Workflows

### Workflow 1: Single Domain Feature

```bash
# 1. Clone your domain repo
git clone https://github.com/bsvalues/terrafusion-government-platform.git
cd terrafusion-government-platform

# 2. Create feature branch
git checkout -b feature/property-search-enhancement

# 3. Develop and test
# ... make changes ...
npm test

# 4. Commit and push
git commit -m "Enhance property search with fuzzy matching"
git push origin feature/property-search-enhancement

# 5. Create PR on GitHub
# PR builds and tests run automatically

# 6. Merge when approved
# Deployment happens automatically for this domain only
```

### Workflow 2: Cross-Domain Feature

```bash
# 1. Identify affected repos
# Example: New valuation API affects core, shared, and government

# 2. Clone all affected repos
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-shared.git
git clone https://github.com/bsvalues/terrafusion-government-platform.git

# 3. Create feature branch in each
cd terrafusion-core && git checkout -b feature/valuation-api-v2
cd ../terrafusion-shared && git checkout -b feature/valuation-api-v2
cd ../terrafusion-government-platform && git checkout -b feature/valuation-api-v2

# 4. Implement in order (dependency first)
cd terrafusion-core
# Add new API interface
git commit -m "Add Valuation API v2 interface"

cd ../terrafusion-shared
# Add shared types and utilities
git commit -m "Add Valuation API v2 types"

cd ../terrafusion-government-platform
# Implement in government platform
git commit -m "Implement Valuation API v2"

# 5. Create linked PRs
# PR 1 (core): "Add Valuation API v2 interface"
# PR 2 (shared): "Add Valuation API v2 types (depends on core#123)"
# PR 3 (government): "Implement Valuation API v2 (depends on shared#456)"

# 6. Merge in order (dependency first)
# Merge core PR → merge shared PR → merge government PR
```

### Workflow 3: Hotfix

```bash
# 1. Identify the affected repo
# Example: Government platform has a critical bug

# 2. Clone and create hotfix branch
git clone https://github.com/bsvalues/terrafusion-government-platform.git
cd terrafusion-government-platform
git checkout -b hotfix/property-assessment-crash

# 3. Fix and test thoroughly
# ... fix bug ...
npm test
npm run test:integration

# 4. Commit, push, and PR
git commit -m "Fix: Prevent crash when property has null assessment"
git push origin hotfix/property-assessment-crash

# 5. Fast-track PR review
# Tag as "hotfix" and "high-priority"

# 6. Deploy immediately after merge
# Only government platform redeploys (fast!)
```

---

## 🛠️ Common Tasks

### Clone All Repositories

**PowerShell Script (Windows)**
```powershell
# Save as clone-all-repos.ps1
$repos = @(
    "terrafusion-core",
    "terrafusion-shared",
    "terrafusion-packages",
    "terrafusion-modules",
    "terrafusion-government-platform",
    "terrafusion-commercial-platform",
    "terrafusion-ai-platform",
    "terrafusion-infrastructure-platform",
    "terrafusion-specialized-modules",
    "terrafusion-developer-tools",
    "terrafusion-docs",
    "terrafusion-ui-components"
)

$baseDir = "C:\terrafusion"
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
Set-Location $baseDir

foreach ($repo in $repos) {
    Write-Host "Cloning $repo..." -ForegroundColor Cyan
    git clone "https://github.com/bsvalues/$repo.git"
}

Write-Host "`n✅ All repositories cloned to $baseDir" -ForegroundColor Green
```

**Bash Script (Linux/macOS)**
```bash
#!/bin/bash
# Save as clone-all-repos.sh

REPOS=(
    "terrafusion-core"
    "terrafusion-shared"
    "terrafusion-packages"
    "terrafusion-modules"
    "terrafusion-government-platform"
    "terrafusion-commercial-platform"
    "terrafusion-ai-platform"
    "terrafusion-infrastructure-platform"
    "terrafusion-specialized-modules"
    "terrafusion-developer-tools"
    "terrafusion-docs"
    "terrafusion-ui-components"
)

BASE_DIR="$HOME/terrafusion"
mkdir -p "$BASE_DIR"
cd "$BASE_DIR" || exit

for repo in "${REPOS[@]}"; do
    echo "Cloning $repo..."
    git clone "https://github.com/bsvalues/$repo.git"
done

echo "✅ All repositories cloned to $BASE_DIR"
```

### Update All Repositories

```bash
# Update all repos to latest main
for dir in terrafusion-*; do
    echo "Updating $dir..."
    cd "$dir" && git checkout main && git pull && cd ..
done
```

### Search Across All Repositories

```bash
# Search for a term across all repos
for dir in terrafusion-*; do
    echo "Searching $dir..."
    cd "$dir" && git grep "propertyAssessment" && cd ..
done
```

### Check Status of All Repositories

```bash
# Check git status across all repos
for dir in terrafusion-*; do
    echo "Status of $dir:"
    cd "$dir" && git status --short && cd ..
done
```

---

## 🔍 Troubleshooting

### Issue 1: "Can't find module from another repo"

**Problem:**
```
Error: Cannot find module '@terrafusion/shared'
```

**Solution:**
1. Ensure dependency is published to npm (for production)
2. For local development, use `npm link`:
   ```bash
   cd terrafusion-shared && npm link
   cd ../your-repo && npm link @terrafusion/shared
   ```
3. Verify package name matches in package.json

### Issue 2: "Changes in shared library not reflected"

**Problem:**
You changed code in `terrafusion-shared` but dependent repo doesn't see changes.

**Solution:**
1. If using published packages: publish new version and update dependency
2. If using `npm link`: restart your dev server
3. If using local path: ensure build step ran in shared repo

### Issue 3: "Which repo has the code I need?"

**Problem:**
Can't find where specific code lives now.

**Solution:**
1. Check [POLYREPO_QUICK_REFERENCE.md](./POLYREPO_QUICK_REFERENCE.md) for domain mapping
2. Search the coordination repo documentation
3. Use GitHub organization search: https://github.com/bsvalues?q=terrafusion
4. Check [REPOSITORY_DEPENDENCIES.md](./REPOSITORY_DEPENDENCIES.md)

### Issue 4: "Integration tests fail but unit tests pass"

**Problem:**
All repos pass their own tests but fail when integrated.

**Solution:**
1. Run integration tests in coordination repo: `npm run test:integration`
2. Check version compatibility between repos
3. Verify all repos on compatible branches
4. Use local development setup with `npm link` for testing

### Issue 5: "Too many repos to manage"

**Problem:**
Overwhelmed by 12+ repositories.

**Solution:**
1. **Most developers only need 2-3 repos** for their work
2. Use VS Code multi-root workspaces to group repos
3. Use the `clone-all-repos` script for full system work
4. Focus on your domain (e.g., government team only needs government + core + shared)

---

## ✅ Best Practices

### 1. Repository Ownership

- **Each repo has a primary team** (e.g., Government Team owns terrafusion-government-platform)
- **Cross-team changes** require collaboration and approval from owning team
- **Document owners** in each repo's README.md

### 2. Versioning & Dependencies

- **Semantic versioning** (semver) for all published packages
- **Lock dependency versions** in package.json (avoid `*` or `latest`)
- **Update dependencies regularly** but test thoroughly

### 3. Branch Strategy

- **Main branch is protected** and always deployable
- **Feature branches** for all changes
- **Hotfix branches** for critical production fixes
- **Tag releases** with semantic versions (v1.0.0, v1.1.0, etc.)

### 4. Pull Requests

- **Link related PRs** across repos in PR description
- **Test thoroughly** including integration tests
- **Merge dependencies first** before dependent repos
- **Small, focused PRs** are easier to review

### 5. Communication

- **Use PR comments** to coordinate cross-repo changes
- **Link GitHub issues** across repos when relevant
- **Update POLYREPO_STATUS.md** after major changes
- **Announce breaking changes** to all teams

### 6. Local Development

- **Use npm/pip local linking** for active development
- **Keep local repos in sync** (pull regularly)
- **Run integration tests** before pushing
- **Use consistent directory structure** across team

### 7. Documentation

- **Each repo has its own README.md** with setup instructions
- **Central docs in terrafusion-docs** repo
- **Keep POLYREPO_STATUS.md updated** in coordination repo
- **Document breaking changes** in CHANGELOG.md

---

## ❓ FAQ

### Q1: Do I need to clone all 12 repositories?

**A:** No! Most developers only need 2-4 repositories:
- Your domain repo (e.g., `terrafusion-government-platform`)
- `terrafusion-core` (base functionality)
- `terrafusion-shared` (common utilities)
- Optionally: repos you depend on

### Q2: How do I know which repos I need?

**A:** Check [REPOSITORY_DEPENDENCIES.md](./REPOSITORY_DEPENDENCIES.md) for dependency mapping. Generally:
- **Government features**: government-platform + core + shared
- **Commercial features**: commercial-platform + core + shared
- **AI features**: ai-platform + core + infrastructure-platform
- **Infrastructure**: infrastructure-platform + core + shared

### Q3: What happened to the original monorepo?

**A:** The `terrafusion_os_1.0` monorepo still exists as the **coordination repository**. It contains:
- Deployment configurations
- Integration tests
- Documentation and guides
- CI/CD orchestration
- This migration guide

### Q4: Can I still access old code from the monorepo?

**A:** Yes! The git history was preserved during extraction:
- Each new repo has its relevant commit history
- Original monorepo is still accessible
- Git history shows full lineage

### Q5: How do CI/CD pipelines work now?

**A:** Each repo has its own CI/CD pipeline:
- **Push to repo** → Run that repo's tests and build
- **Merge to main** → Deploy that repo only
- **Much faster** than rebuilding entire system
- See [CI_CD_IMPLEMENTATION_PLAN.md](./CI_CD_IMPLEMENTATION_PLAN.md)

### Q6: What if I need to make changes across multiple repos?

**A:** Follow the **Cross-Domain Feature** workflow:
1. Clone all affected repos
2. Create feature branches in each
3. Implement changes (dependencies first)
4. Create linked PRs
5. Merge in dependency order

### Q7: How do I run the full system locally?

**A:** Use the coordination repo:
```bash
cd terrafusion_os_1.0
npm run dev:full-system
# This orchestrates all repos together
```

### Q8: What about shared UI components?

**A:** They're in `terrafusion-ui-components`:
- Published as npm package: `@terrafusion/ui-components`
- All apps import from this package
- Centralized design system

### Q9: How do I report bugs now?

**A:** Report in the specific repo:
- Government bug → `terrafusion-government-platform` issues
- Core bug → `terrafusion-core` issues
- Not sure? → `terrafusion_os_1.0` issues (we'll route it)

### Q10: Is the polyrepo structure permanent?

**A:** Yes, this is the long-term architecture. Benefits:
- ✅ Faster development and deployment
- ✅ Better team scalability
- ✅ Clearer ownership and boundaries
- ✅ Improved security and access control

---

## 🎯 Next Steps

### For New Developers

1. ✅ Read this guide thoroughly
2. ✅ Review [POLYREPO_QUICK_REFERENCE.md](./POLYREPO_QUICK_REFERENCE.md)
3. ✅ Clone your domain's repos
4. ✅ Set up local development environment
5. ✅ Run tests to verify setup
6. ✅ Check [POLYREPO_STATUS.md](./POLYREPO_STATUS.md) for current state

### For Existing Team Members

1. ✅ Understand what changed (read "What Changed" section)
2. ✅ Identify which repos you need
3. ✅ Update local development setup
4. ✅ Test your workflow with a small change
5. ✅ Share feedback with team leads

### For Team Leads

1. ✅ Review [REPOSITORY_DEPENDENCIES.md](./REPOSITORY_DEPENDENCIES.md)
2. ✅ Plan team assignments per repository
3. ✅ Update team documentation
4. ✅ Schedule team training sessions
5. ✅ Monitor [POLYREPO_STATUS.md](./POLYREPO_STATUS.md)

---

## 📚 Additional Resources

- **[POLYREPO_QUICK_REFERENCE.md](./POLYREPO_QUICK_REFERENCE.md)** - One-page command cheat sheet
- **[POLYREPO_STATUS.md](./POLYREPO_STATUS.md)** - Live status of all repositories
- **[REPOSITORY_DEPENDENCIES.md](./REPOSITORY_DEPENDENCIES.md)** - Dependency mapping
- **[PHASE_3C_EXTRACTION_COMPLETE.md](./PHASE_3C_EXTRACTION_COMPLETE.md)** - Extraction technical details
- **[GitHub Organization](https://github.com/bsvalues?tab=repositories&q=terrafusion)** - All TerraFusion repos

---

## 🙋 Getting Help

**Have questions?**
- **Documentation**: Start with this guide
- **Quick answers**: Check [FAQ](#faq) above
- **Technical issues**: Create issue in specific repo
- **General questions**: Create issue in `terrafusion_os_1.0`
- **Urgent issues**: Contact your team lead

---

**🎉 Welcome to the TerraFusion Polyrepo Architecture!**

This migration represents a major improvement in development velocity, team scalability, and system maintainability. Take your time learning the new structure - you'll soon appreciate the benefits!

---

**Document Status:** ✅ Complete  
**Last Updated:** October 6, 2025  
**Maintainer:** TerraFusion Platform Team  
**Feedback:** Open an issue in `terrafusion_os_1.0` with suggestions
