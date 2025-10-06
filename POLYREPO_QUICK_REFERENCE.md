# 📦 TerraFusion OS Polyrepo Quick Reference

**Version:** 1.0  
**Date:** October 6, 2025  
**Purpose:** One-page cheat sheet for polyrepo development

---

## 🚀 Quick Links

| Resource | URL |
|----------|-----|
| **All Repositories** | https://github.com/bsvalues?tab=repositories&q=terrafusion |
| **Migration Guide** | [POLYREPO_MIGRATION_GUIDE.md](./POLYREPO_MIGRATION_GUIDE.md) |
| **Status Dashboard** | [POLYREPO_STATUS.md](./POLYREPO_STATUS.md) |
| **Dependencies** | [REPOSITORY_DEPENDENCIES.md](./REPOSITORY_DEPENDENCIES.md) |
| **Extraction Details** | [PHASE_3C_EXTRACTION_COMPLETE.md](./PHASE_3C_EXTRACTION_COMPLETE.md) |

---

## 📦 Repository Directory

### Core Repositories

```bash
# OS Kernel & Base Services
https://github.com/bsvalues/terrafusion-core

# Shared Utilities & Types
https://github.com/bsvalues/terrafusion-shared

# Reusable Packages
https://github.com/bsvalues/terrafusion-packages

# Core Module Implementations
https://github.com/bsvalues/terrafusion-modules
```

### Domain Repositories

```bash
# Government Operations (County, Assessment, PACS)
https://github.com/bsvalues/terrafusion-government-platform

# Commercial Real Estate (Market Analysis, Portfolio)
https://github.com/bsvalues/terrafusion-commercial-platform

# AI Systems (Swarm, Neural, Cognitive, Supreme Commander)
https://github.com/bsvalues/terrafusion-ai-platform

# Infrastructure (Monitoring, Health, Logging)
https://github.com/bsvalues/terrafusion-infrastructure-platform

# Specialized Tools (GIS, Analytics, Compliance)
https://github.com/bsvalues/terrafusion-specialized-modules

# Developer Tools (Testing, Dev Utilities)
https://github.com/bsvalues/terrafusion-developer-tools

# Documentation (Architecture, Guides, APIs)
https://github.com/bsvalues/terrafusion-docs

# UI Components (Design System, Shared Components)
https://github.com/bsvalues/terrafusion-ui-components
```

### Coordination Repository

```bash
# Central Coordination (Deployment, Orchestration, Docs)
https://github.com/bsvalues/terrafusion_os_1.0
```

---

## ⚡ Common Commands

### Clone All Repositories

**PowerShell (Windows)**
```powershell
# Clone all 12 repos
$repos = @("terrafusion-core", "terrafusion-shared", "terrafusion-packages", 
           "terrafusion-modules", "terrafusion-government-platform", 
           "terrafusion-commercial-platform", "terrafusion-ai-platform",
           "terrafusion-infrastructure-platform", "terrafusion-specialized-modules",
           "terrafusion-developer-tools", "terrafusion-docs", "terrafusion-ui-components")
$repos | ForEach-Object { git clone "https://github.com/bsvalues/$_.git" }
```

**Bash (Linux/macOS)**
```bash
# Clone all 12 repos
for repo in terrafusion-{core,shared,packages,modules,government-platform,commercial-platform,ai-platform,infrastructure-platform,specialized-modules,developer-tools,docs,ui-components}; do
  git clone "https://github.com/bsvalues/$repo.git"
done
```

### Update All Repositories

```bash
# Pull latest from all repos
for dir in terrafusion-*; do
  (cd "$dir" && git checkout main && git pull)
done
```

### Check Status All Repositories

```bash
# See status of all repos
for dir in terrafusion-*; do
  echo "=== $dir ===" && (cd "$dir" && git status --short)
done
```

### Search Across All Repositories

```bash
# Search for term across all repos
for dir in terrafusion-*; do
  echo "=== $dir ===" && (cd "$dir" && git grep "searchTerm")
done
```

---

## 🎯 Common Workflows

### Government Feature Development

```bash
# Clone what you need
git clone https://github.com/bsvalues/terrafusion-government-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-shared.git

# Create feature branch
cd terrafusion-government-platform
git checkout -b feature/my-feature

# Develop, test, commit
npm test
git commit -m "Add my feature"
git push origin feature/my-feature

# Create PR on GitHub
```

### AI Feature Development

```bash
# Clone AI dependencies
git clone https://github.com/bsvalues/terrafusion-ai-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-infrastructure-platform.git

# Same workflow as above
```

### Cross-Repo Feature

```bash
# 1. Clone affected repos
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-government-platform.git

# 2. Create feature branch in each
cd terrafusion-core && git checkout -b feature/my-feature
cd ../terrafusion-government-platform && git checkout -b feature/my-feature

# 3. Implement in dependency first (core), then dependent (government)
# 4. Create PRs and link them
# 5. Merge core PR first, then government PR
```

### Hotfix

```bash
# 1. Clone affected repo
git clone https://github.com/bsvalues/terrafusion-government-platform.git
cd terrafusion-government-platform

# 2. Create hotfix branch from main
git checkout -b hotfix/critical-bug

# 3. Fix, test thoroughly
npm test
npm run test:integration

# 4. Push and create PR tagged "hotfix"
git push origin hotfix/critical-bug
```

---

## 🔗 Local Development Linking

### npm Link (JavaScript/TypeScript)

```bash
# In dependency repo (e.g., terrafusion-shared)
cd terrafusion-shared
npm link

# In dependent repo (e.g., terrafusion-government-platform)
cd ../terrafusion-government-platform
npm link @terrafusion/shared

# Now changes in shared are immediately reflected
# Restart dev server after changes
```

### pip Install Editable (Python)

```bash
# In dependency repo
cd terrafusion-shared
pip install -e .

# In dependent repo
cd ../terrafusion-government-platform
pip install -e ../terrafusion-shared

# Changes immediately reflected
```

---

## 🏗️ Repository Dependencies

### Typical Dependency Patterns

**Government Platform**
```
terrafusion-government-platform
├── depends on: terrafusion-core
├── depends on: terrafusion-shared
└── depends on: terrafusion-packages
```

**Commercial Platform**
```
terrafusion-commercial-platform
├── depends on: terrafusion-core
├── depends on: terrafusion-shared
└── depends on: terrafusion-packages
```

**AI Platform**
```
terrafusion-ai-platform
├── depends on: terrafusion-core
├── depends on: terrafusion-infrastructure-platform
└── depends on: terrafusion-shared
```

**Infrastructure Platform**
```
terrafusion-infrastructure-platform
├── depends on: terrafusion-core
└── depends on: terrafusion-shared
```

**UI Components**
```
terrafusion-ui-components
├── depends on: terrafusion-shared (types)
└── no other dependencies (standalone design system)
```

---

## 📊 Repository Metrics

| Repository | Size | Files | Commits | Primary Language |
|------------|------|-------|---------|------------------|
| **terrafusion-government-platform** | 15.88 MB | 1,381 | 3 | C#, Python |
| **terrafusion-commercial-platform** | 29.32 MB | 905 | 4 | C#, Python, TypeScript |
| **terrafusion-ai-platform** | 1.38 MB | 226 | 5 | Python, Rust |
| **terrafusion-infrastructure-platform** | 5.05 MB | 408 | 4 | Python, TypeScript |
| **terrafusion-specialized-modules** | 1.26 MB | 214 | 4 | Python, C# |
| **terrafusion-developer-tools** | 0.00 MB | 4 | 2 | Shell Scripts |
| **terrafusion-docs** | 5.16 MB | 307 | 9 | Markdown |
| **terrafusion-ui-components** | 0.02 MB | 14 | 5 | TypeScript, CSS |

---

## 🛠️ Useful Git Aliases

Add to `~/.gitconfig`:

```ini
[alias]
    # Pull all terrafusion repos
    tf-pull-all = "!f() { for dir in terrafusion-*; do (cd \"$dir\" && echo \"Pulling $dir...\" && git pull); done; }; f"
    
    # Status of all terrafusion repos
    tf-status-all = "!f() { for dir in terrafusion-*; do (cd \"$dir\" && echo \"=== $dir ===\" && git status --short); done; }; f"
    
    # Search across all repos
    tf-grep = "!f() { for dir in terrafusion-*; do (cd \"$dir\" && echo \"=== $dir ===\" && git grep \"$1\"); done; }; f"
```

Usage:
```bash
git tf-pull-all      # Pull all repos
git tf-status-all    # Status of all repos
git tf-grep "term"   # Search all repos
```

---

## 🚨 Troubleshooting Quick Fixes

### "Can't find module @terrafusion/shared"

```bash
# Solution: Link it locally
cd terrafusion-shared && npm link
cd ../your-repo && npm link @terrafusion/shared
```

### "Changes not reflected"

```bash
# Solution: Restart dev server
# Ctrl+C to stop
npm run dev  # or yarn dev
```

### "Which repo has this code?"

1. Check [REPOSITORY_DEPENDENCIES.md](./REPOSITORY_DEPENDENCIES.md)
2. Search GitHub org: https://github.com/bsvalues?q=terrafusion
3. Ask in team chat

### "Too many repos to manage"

**You only need 2-4 repos!**
- Your domain repo
- `terrafusion-core`
- `terrafusion-shared`
- Maybe one more dependency

---

## 📞 Getting Help

| Issue Type | Where to Ask |
|------------|--------------|
| **Documentation** | Read [POLYREPO_MIGRATION_GUIDE.md](./POLYREPO_MIGRATION_GUIDE.md) |
| **Bug in specific repo** | Create issue in that repo |
| **General question** | Create issue in `terrafusion_os_1.0` |
| **Urgent** | Contact team lead |

---

## 🎯 What You Need for Your Work

### Government Team
```bash
git clone https://github.com/bsvalues/terrafusion-government-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-shared.git
```

### Commercial Team
```bash
git clone https://github.com/bsvalues/terrafusion-commercial-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-shared.git
```

### AI Team
```bash
git clone https://github.com/bsvalues/terrafusion-ai-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-infrastructure-platform.git
```

### Infrastructure Team
```bash
git clone https://github.com/bsvalues/terrafusion-infrastructure-platform.git
git clone https://github.com/bsvalues/terrafusion-core.git
git clone https://github.com/bsvalues/terrafusion-shared.git
```

### UI/UX Team
```bash
git clone https://github.com/bsvalues/terrafusion-ui-components.git
git clone https://github.com/bsvalues/terrafusion-shared.git  # For types
```

### Full-Stack / Platform Team
```bash
# Clone all 12 repos (see "Clone All Repositories" section above)
```

---

## ✅ Daily Workflow Checklist

- [ ] Pull latest changes: `git pull` in each repo you're working on
- [ ] Create feature branch: `git checkout -b feature/my-feature`
- [ ] Make changes and test: `npm test` or `pytest`
- [ ] Commit frequently: `git commit -m "Clear message"`
- [ ] Push to GitHub: `git push origin feature/my-feature`
- [ ] Create PR and request review
- [ ] Link related PRs if cross-repo
- [ ] Update [POLYREPO_STATUS.md](./POLYREPO_STATUS.md) after major changes

---

**🎉 You're ready to work with the TerraFusion Polyrepo!**

For detailed explanations, see [POLYREPO_MIGRATION_GUIDE.md](./POLYREPO_MIGRATION_GUIDE.md)

---

**Document Status:** ✅ Complete  
**Last Updated:** October 6, 2025  
**Print-Friendly:** ✅ (designed to fit on 2-3 pages)
