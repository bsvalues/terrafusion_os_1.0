# Phase 3C: Module Extraction Plan

**Date**: October 6, 2025  
**Status**: Planning  
**Previous Phase**: Phase 3B Complete (4 core repos extracted)

---

## 🎯 Objective

Extract large modules and specialized packages into focused repositories to:
- Further reduce monorepo complexity
- Enable independent versioning per module
- Improve CI/CD performance
- Create clearer ownership boundaries
- Make it easier to share/reuse specific modules

---

## 📊 Current Analysis

### Already Extracted (Phase 3B)
- ✅ `rust-performance-engine/` → terrafusion-os-core
- ✅ `terrafusion-cos/` → terrafusion-os-core
- ✅ `backend/` → terrafusion-os-core
- ✅ `infrastructure/`, `scripts/`, `.github/` → terrafusion-infrastructure
- ✅ `packages/commercial/`, `packages/government-edition*/`, `marketplace/`, `frontend/` → terrafusion-marketplace
- ✅ `shared-libraries/`, `SDK/`, `terrafusion-sdk/` → terrafusion-shared

### Remaining Large Directories

| Directory | Size | Status | Notes |
|-----------|------|--------|-------|
| `packages/shock-and-awe/` | **1.76GB** | 🎯 **Priority 1** | Massive package, needs own repo |
| `src/` | 2.02GB | ⚠️ Consider | Core application source |
| `docs/` | 623MB | 📚 Extract | Documentation repository |
| `modules/government-core/` | 36MB | 🎯 **Priority 2** | Government modules |
| `modules/specialized/` | 26MB | 🎯 **Priority 2** | Specialized modules |
| `modules/commercial/` | 14.6MB | 🎯 **Priority 2** | Commercial modules |
| `modules/shock-and-awe/` | 9.2MB | 🎯 **Priority 1** | Related to package |
| `modules/ai-systems/` | 2.6MB | 🎯 **Priority 3** | AI system modules |

---

## 🗂️ Proposed Extraction Strategy

### Priority 1: Large Specialized Packages

#### Repository: `terrafusion-shock-and-awe`
**Size**: ~1.77GB  
**Description**: Shock and Awe framework - advanced UI/UX components and demos

**Paths to Extract**:
```
packages/shock-and-awe/
modules/shock-and-awe/
```

**Rationale**:
- Largest remaining package (1.76GB)
- Self-contained framework
- Can be developed independently
- Used by marketplace applications

---

### Priority 2: Government & Specialized Modules

#### Repository: `terrafusion-government-modules`
**Size**: ~36MB  
**Description**: Government-specific modules and integrations

**Paths to Extract**:
```
modules/government-core/
```

**Rationale**:
- Government-specific functionality
- Clear separation of concerns
- Different compliance requirements

---

#### Repository: `terrafusion-specialized-modules`
**Size**: ~26MB  
**Description**: Specialized industry-specific modules

**Paths to Extract**:
```
modules/specialized/
```

**Rationale**:
- Industry-specific functionality
- Can be licensed separately
- Independent development cycle

---

#### Repository: `terrafusion-commercial-modules`
**Size**: ~14.6MB  
**Description**: Commercial marketplace modules and integrations

**Paths to Extract**:
```
modules/commercial/
```

**Rationale**:
- Commercial-specific features
- Separate licensing/pricing
- Independent release cycle

---

### Priority 3: AI & Intelligence Systems

#### Repository: `terrafusion-ai-modules`
**Size**: ~2.6MB  
**Description**: AI systems, machine learning, and intelligence modules

**Paths to Extract**:
```
modules/ai-systems/
modules/ai-command-brain/
```

**Rationale**:
- AI/ML specific functionality
- Rapid iteration cycle
- Separate dependencies (TensorFlow, PyTorch, etc.)

---

### Priority 4: Documentation

#### Repository: `terrafusion-docs`
**Size**: ~623MB  
**Description**: Complete TerraFusion documentation

**Paths to Extract**:
```
docs/
```

**Rationale**:
- Large documentation set
- Can be updated independently
- Separate CI/CD for docs building
- Can host on GitHub Pages

---

## 📋 Extraction Order

**Recommended order** (largest/most independent first):

1. **terrafusion-shock-and-awe** (~1.77GB)
   - Largest package
   - Self-contained
   - Low dependencies

2. **terrafusion-docs** (~623MB)
   - Large documentation
   - Independent
   - No code dependencies

3. **terrafusion-government-modules** (~36MB)
   - Government-specific
   - Clear boundaries
   - Used by government-edition

4. **terrafusion-specialized-modules** (~26MB)
   - Industry-specific
   - Clear boundaries

5. **terrafusion-commercial-modules** (~14.6MB)
   - Commercial features
   - Clear boundaries

6. **terrafusion-ai-modules** (~2.6MB)
   - AI/ML systems
   - Separate dependencies

---

## 🔧 Technical Approach

### Same Method as Phase 3B

Use the proven PowerShell script with modifications:

```powershell
.\PHASE_3C_MODULE_EXTRACTION.ps1 -AutoConfirm
```

**Key modifications**:
1. Update repository names
2. Update paths to extract
3. Update README templates
4. Use `--no-checkout` flag (proven to work)

### Script Template

```powershell
# Repository 1: terrafusion-shock-and-awe
$repo1Path = Join-Path $OutputBase "terrafusion-shock-and-awe"
$pathsToKeep = @(
    "packages/shock-and-awe/",
    "modules/shock-and-awe/"
)
```

---

## 📊 Expected Results

### Before Phase 3C
- Monorepo: ~18GB
- Extracted repos: 4 core repositories
- Remaining large modules: 6+ packages

### After Phase 3C
- Monorepo: ~15GB (approx)
- Total extracted repos: 10 repositories
- Better separation of concerns

---

## ⚠️ Considerations

### Dependencies
- **Risk**: Modules may have inter-dependencies
- **Mitigation**: Document dependencies, create proper package.json/requirements.txt

### CI/CD
- **Impact**: Need to update workflows for multiple repos
- **Plan**: Create template CI/CD workflows

### Development Workflow
- **Change**: Developers work across multiple repos
- **Solution**: Document development setup, create scripts for multi-repo cloning

---

## 🚫 What NOT to Extract (Yet)

### Keep in Monorepo
- `src/` (2GB) - Core application source, too tightly coupled
- `data/` (129MB) - Shared data files
- `deployment/` - Already extracted to terrafusion-infrastructure
- `tools/` (77MB) - Developer tools, used across repos
- `native-shell/` (28MB) - Core shell components

**Rationale**: These have tight coupling with core functionality and would require significant refactoring to extract cleanly.

---

## 📝 Phase 3D Planning

After Phase 3C, Phase 3D will:
1. Remove extracted code from monorepo
2. Update import paths
3. Configure submodules or npm workspaces
4. Update CI/CD workflows
5. Archive obsolete files

---

## ✅ Success Criteria

- [ ] All 6 modules extracted with full Git history
- [ ] All repositories pushed to GitHub
- [ ] Repository READMEs created
- [ ] Sizes match estimates
- [ ] No Git history corruption
- [ ] Dependencies documented
- [ ] CI/CD workflows planned

---

## 🎯 Next Actions

1. **Review this plan** - Confirm extraction priorities
2. **Modify extraction script** - Update paths and names
3. **Run extraction** - Execute with `--no-checkout` flag
4. **Create GitHub repos** - Push all extracted modules
5. **Document** - Create Phase 3C completion report

---

**Estimated Time**: 1-2 hours  
**Estimated Space Needed**: ~3GB temporary (for cloning)  
**GitHub Repos Created**: 6 new repositories

---

## 🤖 For AI Agents

### Quick Start
```powershell
# Review this plan
code PHASE_3C_MODULE_EXTRACTION_PLAN.md

# Modify extraction script
code PHASE_3C_MODULE_EXTRACTION.ps1

# Run extraction
.\PHASE_3C_MODULE_EXTRACTION.ps1 -AutoConfirm
```

### Critical Reminders
1. Use `--no-checkout` flag (Windows path limits!)
2. Test clone first if uncertain
3. Verify Git history after extraction
4. Push to GitHub immediately after verification

---

**Status**: ⏳ Ready for execution  
**Blocked By**: None  
**Depends On**: Phase 3B ✅ Complete
