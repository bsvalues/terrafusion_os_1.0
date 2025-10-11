# 📂 SRC/ FOLDER REORGANIZATION ANALYSIS
## MIT/PhD-Level Classification & Relocation Plan

**Date**: October 10, 2025  
**Analyst**: AI Systems Design Engineer  
**Purpose**: Analyze src/ folders and determine correct location in workspace  
**Methodology**: Classification by function, dependency analysis, architectural fit

---

## 🔍 EXECUTIVE SUMMARY

**Current Issue**: The `src/` directory contains 10 different projects with mixed purposes:
- Some are **government modules** (should be in `modules/`)
- Some are **applications** (should be in `apps/` or stay in `src/`)
- Some are **infrastructure services** (should be in `OPS/` or `INFRASTRUCTURE/`)
- Some are **development tools** (should be in `TOOLS/` or `AI_SWARM/`)
- Some are **deprecated/archived** (should be in `ARCHIVES/`)

**Recommendation**: Reorganize based on clear classification criteria below.

---

## 📊 CLASSIFICATION CRITERIA

### What belongs in `modules/`?
**Government modules** that provide specific county/government functionality:
- Property assessment
- Tax collection
- GIS mapping
- Public records
- Levy calculation
- Revenue management
- Compliance tracking

✅ **Current modules/**: 32+ modules including government-edition, costforge-ai, terra-collections, terra-levy, terra-insight, property-workbench, GIS Pro, public records, etc.

### What belongs in `apps/` or `src/`?
**User-facing applications** that are complete platforms:
- Dashboards
- Web applications
- Mobile apps
- Demo applications
- Enterprise editions

### What belongs in `AI_SWARM/` or `TOOLS/`?
**Development tools and AI configurations**:
- AI system prompts
- Development utilities
- Testing frameworks
- Code generators

### What belongs in `OPS/` or `INFRASTRUCTURE/`?
**Infrastructure services**:
- Sync services
- Backup systems
- Monitoring tools
- Data pipelines

### What belongs in `ARCHIVES/`?
**Deprecated or inactive projects**:
- Old versions
- Unused demos
- Placeholder projects

---

## 📋 DETAILED ANALYSIS OF EACH FOLDER

### 1. ❌ **system-prompts-ai-tools**
```
Current Location: src/system-prompts-ai-tools/
Contents: AI system prompts for Cursor, Devin, Junie, Lovable, Manus, 
          Replit, Same.dev, Trae, v0, VSCode, Windsurf (11 AI tools)
Purpose: Configuration files for AI development tools
```

**Classification**: ⚙️ Development Tools / AI Configuration

**Recommended Location**: `AI_SWARM/system-prompts/` or `TOOLS/ai-prompts/`

**Reasoning**: 
- NOT a module (doesn't provide government functionality)
- NOT an application (just configuration files)
- IS AI-related tooling
- Should be with other AI swarm configuration

**Action**: 
```powershell
Move-Item "src/system-prompts-ai-tools" "AI_SWARM/system-prompts"
```

---

### 2. ✅ **terrafusion-dashboard**
```
Current Location: src/terrafusion-dashboard/
Contents: Full dashboard application with client/server, Benton County 
          deployment, production configs, Docker, K8s, database
Purpose: Main TerraFusion dashboard for county operations
```

**Classification**: 🖥️ Application (Dashboard)

**Recommended Location**: **KEEP in `src/`** OR move to `apps/terrafusion-dashboard/`

**Reasoning**: 
- IS a complete application with client/server architecture
- NOT a module (it's the platform that USES modules)
- Production-ready with deployment configs
- Could be primary application in new `apps/` directory

**Action**: 
```powershell
# Option A: Keep in src/
# (No action needed)

# Option B: Move to new apps/ directory
New-Item -ItemType Directory -Force "apps"
Move-Item "src/terrafusion-dashboard" "apps/terrafusion-dashboard"
```

**Recommendation**: Create `apps/` directory and move there for clarity.

---

### 3. ✅ **terrafusion-enterprise-v2**
```
Current Location: src/terrafusion-enterprise-v2/
Contents: Enterprise version with orchestrator, services, monitoring, 
          deployment (mostly .gitkeep placeholders)
Purpose: Enterprise edition framework (appears to be skeleton/template)
```

**Classification**: 🏢 Application (Enterprise Edition) - SKELETON

**Recommended Location**: **KEEP in `src/`** OR move to `apps/terrafusion-enterprise/`

**Reasoning**: 
- IS an application variant (enterprise version)
- Appears to be early-stage (mostly empty directories with .gitkeep)
- NOT a module
- Could be consolidated with other enterprise features

**Action**: 
```powershell
# Option A: Move to apps/
Move-Item "src/terrafusion-enterprise-v2" "apps/terrafusion-enterprise"

# Option B: Archive if not actively developed
Move-Item "src/terrafusion-enterprise-v2" "ARCHIVES/enterprise-skeleton"
```

**Recommendation**: Check if actively developed. If not, archive. If yes, move to `apps/`.

---

### 4. ❌ **terrafusion-gama**
```
Current Location: src/terrafusion-gama/
Contents: Only placeholder images (placeholder-logo.png, placeholder-user.jpg, etc.)
Purpose: Unknown - appears to be abandoned/deprecated
```

**Classification**: 🗑️ Deprecated/Abandoned

**Recommended Location**: `ARCHIVES/deprecated/terrafusion-gama/`

**Reasoning**: 
- Only contains placeholder images
- No code, no documentation
- Appears to be abandoned project
- Name "GAMA" not referenced in active documentation

**Action**: 
```powershell
Move-Item "src/terrafusion-gama" "ARCHIVES/deprecated/terrafusion-gama"
```

**Recommendation**: Archive immediately. Not actively used.

---

### 5. ✅ **terrafusion-gis** ⭐
```
Current Location: src/terrafusion-gis/
Contents: Full GIS application with Python backend (Flask), React frontend,
          ArcGIS integration, property assessment, market intelligence,
          AI valuation, risk assessment, Benton County profile
Purpose: Geographic Information System for property mapping and assessment
```

**Classification**: 📍 **GOVERNMENT MODULE** (GIS & Property Assessment)

**Recommended Location**: `modules/terrafusion-gis/` ✅

**Reasoning**: 
- IS a government module (property assessment, GIS mapping)
- Provides specific county functionality (Benton County integration)
- Fits perfectly with existing modules like property-workbench, gispro
- Should be in modules/ with other government modules

**Action**: 
```powershell
Move-Item "src/terrafusion-gis" "modules/terrafusion-gis"

# Update module registry
# Add to modules/ACTIVE_MODULES.md:
# 16. **TerraFusion GIS**
#     - **Location**: `modules/terrafusion-gis/`
#     - **Status**: ✅ Production
#     - **Features**: GIS mapping, property assessment, ArcGIS integration
#     - **Integration**: Benton County data, AI valuation, risk assessment
```

**Recommendation**: **MOVE TO MODULES/** - This is clearly a government module.

---

### 6. ❌ **terrafusion-playground-main**
```
Current Location: src/terrafusion-playground-main/
Contents: Testing playground with archive/, test-artifacts/, 
          temp_repo/, debug-files/, unused-scripts/, client/, server/
Purpose: Development/testing playground environment
```

**Classification**: 🧪 Testing/Development Environment

**Recommended Location**: `TESTING/playground/` OR `ARCHIVES/playground/`

**Reasoning**: 
- NOT a module (testing environment)
- NOT a production application
- Contains test artifacts, debug files, unused scripts
- Large archive/ folder suggests historical/deprecated content

**Action**: 
```powershell
# Option A: Move to testing if actively used
Move-Item "src/terrafusion-playground-main" "TESTING/playground"

# Option B: Archive if not actively used
Move-Item "src/terrafusion-playground-main" "ARCHIVES/development/playground"
```

**Recommendation**: Archive unless actively used for testing.

---

### 7. ✅ **terrafusion-prime-view**
```
Current Location: src/terrafusion-prime-view/
Contents: React/Vite application with property search, data import,
          agent dashboard, Benton County data sync, Supabase integration
Purpose: Prime view application for property data visualization
```

**Classification**: 🖥️ Application (Prime View)

**Recommended Location**: `apps/terrafusion-prime-view/`

**Reasoning**: 
- IS a complete application (React + Vite)
- NOT a module (it's a user-facing application)
- Production-ready with Benton County integration
- Similar to dashboard but different UI/UX focus

**Action**: 
```powershell
Move-Item "src/terrafusion-prime-view" "apps/terrafusion-prime-view"
```

**Recommendation**: Move to `apps/` directory.

---

### 8. ✅ **terrafusion-pro-plus**
```
Current Location: src/terrafusion-pro-plus/
Contents: Full-stack application with client/, server/, analytics-service/,
          compliance-service/, document-service/, mcp-server/, Kubernetes,
          Terraform, comprehensive architecture
Purpose: Professional Plus version of TerraFusion platform
```

**Classification**: 🖥️ Application (Pro Plus Edition)

**Recommended Location**: `apps/terrafusion-pro-plus/`

**Reasoning**: 
- IS a complete application platform
- NOT a module (it's a platform edition)
- Production-ready with full deployment infrastructure
- Contains multiple services (analytics, compliance, document)

**Action**: 
```powershell
Move-Item "src/terrafusion-pro-plus" "apps/terrafusion-pro-plus"
```

**Recommendation**: Move to `apps/` directory.

---

### 9. ⚙️ **terrafusion-sync-backup**
```
Current Location: src/terrafusion-sync-backup/
Contents: Sync service with Python backend, extensive archive/ of old scripts,
          exports/, logs/, monitoring/, project_data/, database
Purpose: Data synchronization and backup service
```

**Classification**: 🔄 Infrastructure Service

**Recommended Location**: `OPS/sync-service/` OR `INFRASTRUCTURE/data-sync/`

**Reasoning**: 
- NOT a module (infrastructure service)
- NOT an application (backend service only)
- IS an operational service (sync/backup)
- Large archive/ folder (old scripts should be cleaned)

**Action**: 
```powershell
# Move to OPS
Move-Item "src/terrafusion-sync-backup" "OPS/sync-service"

# Clean up archive (move to ARCHIVES)
Move-Item "OPS/sync-service/archive" "ARCHIVES/sync-service-old-scripts"
```

**Recommendation**: Move to `OPS/` and archive old scripts.

---

### 10. 🎭 **terrafusion-v0-demo**
```
Current Location: src/terrafusion-v0-demo/
Contents: Next.js demo application with 30+ demo pages (quantum computing,
          AI AVM, blockchain, IoT, multi-county, west coast expansion, etc.),
          Kubernetes deployment, monitoring, Terraform
Purpose: Demo/showcase application for TerraFusion capabilities
```

**Classification**: 🎭 Demo/Showcase Application

**Recommended Location**: `apps/demos/terrafusion-v0/` OR `ARCHIVES/demos/v0/`

**Reasoning**: 
- IS a demo application (not production)
- NOT a module
- Extensive feature showcase (30+ demo pages)
- May be used for sales/marketing

**Action**: 
```powershell
# Option A: Keep as active demo
New-Item -ItemType Directory -Force "apps/demos"
Move-Item "src/terrafusion-v0-demo" "apps/demos/terrafusion-v0"

# Option B: Archive if superseded by newer demos
Move-Item "src/terrafusion-v0-demo" "ARCHIVES/demos/v0-showcase"
```

**Recommendation**: Move to `apps/demos/` if actively used for sales, otherwise archive.

---

## 📊 SUMMARY TABLE

| Folder | Current Location | Classification | Recommended Location | Priority |
|--------|-----------------|----------------|---------------------|----------|
| system-prompts-ai-tools | src/ | AI Tools | AI_SWARM/system-prompts/ | Medium |
| terrafusion-dashboard | src/ | Application | apps/terrafusion-dashboard/ | High |
| terrafusion-enterprise-v2 | src/ | Application (Skeleton) | apps/ OR ARCHIVES/ | Low |
| terrafusion-gama | src/ | Deprecated | ARCHIVES/deprecated/ | High |
| **terrafusion-gis** | src/ | **GOVERNMENT MODULE** | **modules/terrafusion-gis/** | **HIGHEST** |
| terrafusion-playground-main | src/ | Testing/Dev | TESTING/ OR ARCHIVES/ | Medium |
| terrafusion-prime-view | src/ | Application | apps/terrafusion-prime-view/ | High |
| terrafusion-pro-plus | src/ | Application | apps/terrafusion-pro-plus/ | High |
| terrafusion-sync-backup | src/ | Infrastructure | OPS/sync-service/ | High |
| terrafusion-v0-demo | src/ | Demo | apps/demos/ OR ARCHIVES/ | Medium |

---

## 🎯 REORGANIZATION PLAN

### Phase 1: Critical Moves (Do First)
**Priority: HIGHEST** - These moves clarify the architecture

1. ✅ **Move terrafusion-gis to modules/**
   ```powershell
   Move-Item "src/terrafusion-gis" "modules/terrafusion-gis"
   ```
   - This is clearly a government module
   - Should be with other modules like property-workbench, gispro

2. 🗑️ **Archive terrafusion-gama**
   ```powershell
   New-Item -ItemType Directory -Force "ARCHIVES/deprecated"
   Move-Item "src/terrafusion-gama" "ARCHIVES/deprecated/terrafusion-gama"
   ```
   - Only placeholder images, no active code

### Phase 2: Application Reorganization (Do Second)
**Priority: HIGH** - Organize applications properly

3. 📁 **Create apps/ directory and move applications**
   ```powershell
   New-Item -ItemType Directory -Force "apps"
   Move-Item "src/terrafusion-dashboard" "apps/terrafusion-dashboard"
   Move-Item "src/terrafusion-prime-view" "apps/terrafusion-prime-view"
   Move-Item "src/terrafusion-pro-plus" "apps/terrafusion-pro-plus"
   ```

4. 🎭 **Move demo to apps/demos/**
   ```powershell
   New-Item -ItemType Directory -Force "apps/demos"
   Move-Item "src/terrafusion-v0-demo" "apps/demos/terrafusion-v0"
   ```

### Phase 3: Infrastructure & Tools (Do Third)
**Priority: MEDIUM** - Organize supporting systems

5. 🔄 **Move sync service to OPS/**
   ```powershell
   Move-Item "src/terrafusion-sync-backup" "OPS/sync-service"
   Move-Item "OPS/sync-service/archive" "ARCHIVES/sync-service-scripts"
   ```

6. ⚙️ **Move AI prompts to AI_SWARM/**
   ```powershell
   New-Item -ItemType Directory -Force "AI_SWARM/system-prompts"
   Move-Item "src/system-prompts-ai-tools" "AI_SWARM/system-prompts"
   ```

7. 🧪 **Archive playground**
   ```powershell
   New-Item -ItemType Directory -Force "ARCHIVES/development"
   Move-Item "src/terrafusion-playground-main" "ARCHIVES/development/playground"
   ```

### Phase 4: Decision on Enterprise-v2 (Do Last)
**Priority: LOW** - Determine if active or archive

8. 🏢 **Handle enterprise-v2** (needs investigation)
   ```powershell
   # If actively developed:
   Move-Item "src/terrafusion-enterprise-v2" "apps/terrafusion-enterprise"
   
   # If abandoned skeleton:
   Move-Item "src/terrafusion-enterprise-v2" "ARCHIVES/enterprise-skeleton"
   ```

---

## ✅ EXPECTED OUTCOMES

### Before (Current State)
```
src/
├── system-prompts-ai-tools/          # AI tools (wrong location)
├── terrafusion-dashboard/            # App (unclear organization)
├── terrafusion-enterprise-v2/        # App skeleton (unclear status)
├── terrafusion-gama/                 # Deprecated (should be archived)
├── terrafusion-gis/                  # MODULE (wrong location!) ⚠️
├── terrafusion-playground-main/      # Testing (wrong location)
├── terrafusion-prime-view/           # App (unclear organization)
├── terrafusion-pro-plus/             # App (unclear organization)
├── terrafusion-sync-backup/          # Service (wrong location)
└── terrafusion-v0-demo/              # Demo (unclear organization)
```

### After (Ideal State)
```
modules/
├── terrafusion-gis/                  # ✅ MOVED FROM src/
├── [32+ other government modules]

apps/
├── terrafusion-dashboard/            # ✅ MOVED FROM src/
├── terrafusion-prime-view/           # ✅ MOVED FROM src/
├── terrafusion-pro-plus/             # ✅ MOVED FROM src/
├── terrafusion-enterprise/           # ✅ MOVED FROM src/ (if active)
└── demos/
    └── terrafusion-v0/               # ✅ MOVED FROM src/

AI_SWARM/
└── system-prompts/                   # ✅ MOVED FROM src/

OPS/
└── sync-service/                     # ✅ MOVED FROM src/

ARCHIVES/
├── deprecated/
│   └── terrafusion-gama/             # ✅ MOVED FROM src/
├── development/
│   └── playground/                   # ✅ MOVED FROM src/
└── sync-service-scripts/             # ✅ MOVED FROM src/sync-backup/archive/

src/
└── [Now empty or contains truly source-level code]
```

---

## 🚀 EXECUTION COMMANDS

### Complete Reorganization Script (PowerShell)
```powershell
# Phase 1: Critical Moves
Write-Host "Phase 1: Critical Moves" -ForegroundColor Green
New-Item -ItemType Directory -Force "ARCHIVES/deprecated"
Move-Item "src/terrafusion-gama" "ARCHIVES/deprecated/terrafusion-gama" -Force
Move-Item "src/terrafusion-gis" "modules/terrafusion-gis" -Force

# Phase 2: Application Reorganization
Write-Host "Phase 2: Application Reorganization" -ForegroundColor Green
New-Item -ItemType Directory -Force "apps"
New-Item -ItemType Directory -Force "apps/demos"
Move-Item "src/terrafusion-dashboard" "apps/terrafusion-dashboard" -Force
Move-Item "src/terrafusion-prime-view" "apps/terrafusion-prime-view" -Force
Move-Item "src/terrafusion-pro-plus" "apps/terrafusion-pro-plus" -Force
Move-Item "src/terrafusion-v0-demo" "apps/demos/terrafusion-v0" -Force

# Phase 3: Infrastructure & Tools
Write-Host "Phase 3: Infrastructure & Tools" -ForegroundColor Green
New-Item -ItemType Directory -Force "AI_SWARM/system-prompts"
New-Item -ItemType Directory -Force "ARCHIVES/development"
New-Item -ItemType Directory -Force "ARCHIVES/sync-service-scripts"
Move-Item "src/system-prompts-ai-tools" "AI_SWARM/system-prompts" -Force
Move-Item "src/terrafusion-playground-main" "ARCHIVES/development/playground" -Force
Move-Item "src/terrafusion-sync-backup" "OPS/sync-service" -Force
Move-Item "OPS/sync-service/archive/*" "ARCHIVES/sync-service-scripts/" -Force

# Phase 4: Enterprise-v2 (Archive for now, can be restored if needed)
Write-Host "Phase 4: Enterprise-v2 Decision" -ForegroundColor Yellow
Move-Item "src/terrafusion-enterprise-v2" "ARCHIVES/enterprise-skeleton" -Force

Write-Host "`nReorganization Complete! ✅" -ForegroundColor Green
Write-Host "src/ directory is now clean and organized" -ForegroundColor Green
```

---

## 📝 POST-REORGANIZATION TASKS

1. **Update module registry**
   - Add terrafusion-gis to `modules/ACTIVE_MODULES.md`
   - Update `modules/module-registry.json`

2. **Update documentation**
   - Update workspace architecture documentation
   - Update developer onboarding guides
   - Update deployment guides

3. **Update build scripts**
   - Update any scripts referencing old `src/` paths
   - Update CI/CD pipelines
   - Update Docker compose files

4. **Validate functionality**
   - Test all moved applications still work
   - Verify module imports/exports
   - Run full test suite

5. **Update README files**
   - Update root README.md with new structure
   - Add README.md to new apps/ directory
   - Update navigation documentation

---

## ✅ CONCLUSION

**Answer to your question**: "i think these are also in the wrong spot and should be in modules?"

**YES! You're partially correct:**

1. ✅ **terrafusion-gis** → Should DEFINITELY be in `modules/` (it's a government module)
2. ❌ **terrafusion-dashboard** → Should be in `apps/` (it's an application, not a module)
3. ❌ **terrafusion-prime-view** → Should be in `apps/` (it's an application, not a module)
4. ❌ **terrafusion-pro-plus** → Should be in `apps/` (it's an application, not a module)
5. ❌ **terrafusion-v0-demo** → Should be in `apps/demos/` (it's a demo, not a module)
6. ❌ **terrafusion-enterprise-v2** → Should be in `apps/` or `ARCHIVES/` (application, not module)
7. ❌ **system-prompts-ai-tools** → Should be in `AI_SWARM/` (AI tools, not a module)
8. ❌ **terrafusion-sync-backup** → Should be in `OPS/` (service, not a module)
9. ❌ **terrafusion-playground-main** → Should be in `ARCHIVES/` (testing, not a module)
10. ❌ **terrafusion-gama** → Should be in `ARCHIVES/` (deprecated, not a module)

**The key distinction**: 
- **Modules** = Government functionality components (property assessment, GIS, tax collection, etc.)
- **Applications** = Complete user-facing platforms (dashboards, web apps, mobile apps)
- **Services** = Infrastructure/backend services (sync, backup, monitoring)
- **Tools** = Development utilities (AI prompts, scripts, generators)

**Only `terrafusion-gis` should go to `modules/`** because it provides specific government functionality (GIS mapping, property assessment). The others are applications or services that USE the modules.

---

**This is THE TERRAFUSION WAY - Proper classification and organization!** 🎯

Ready to execute the reorganization? Let me know and I'll run the PowerShell script!
