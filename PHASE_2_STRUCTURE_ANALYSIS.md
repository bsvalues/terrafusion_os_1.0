# 🔍 Phase 2: Structure Analysis & Consolidation Plan

**Date:** October 6, 2025  
**Status:** Analysis Complete, Ready for Execution  
**Current Size:** 26 GB → **Target:** 8-11 GB

---

## 📊 ANALYSIS RESULTS

### 1. Core OS Directories

```
DECISION: Keep terrafusion-cos/, Remove core-os/

terrafusion-cos/ (2.0 GB)                    core-os/ (1.5 GB)
├─ ✅ Has package.json                       ├─ ❌ No package.json
├─ ✅ Name: "terrafusion-cos-desktop"       ├─ ❓ Unclear purpose
├─ ✅ Version: 1.0.0                         └─ ⚠️  Likely outdated
├─ ✅ Recently modified (Oct 6)
└─ ✅ CURRENT VERSION

ACTION: Remove core-os/ (saves 1.5 GB)
REASON: terrafusion-cos is the active, maintained version
```

---

### 2. Frontend Directories

```
DECISION: Keep frontend/, Archive frontend-v2 & terrafusion-frontend

frontend/ (4.4 MB)                          
├─ ✅ Has package.json
├─ ✅ Name: "terrafusion-frontend"
├─ ✅ Version: 0.1.0
├─ ✅ Recently modified (Oct 6)
└─ ✅ CURRENT VERSION

frontend-v2/ (1.1 MB)
├─ ❌ No package.json in root
├─ ⚠️  Modified Sep 11
└─ ❓ Unclear purpose

terrafusion-frontend/ (780 KB)
├─ ❌ No package.json in root
├─ ⚠️  Modified Sep 4
└─ ❓ Unclear purpose

ACTION: Remove frontend-v2/ and terrafusion-frontend/ (saves ~2 MB)
REASON: frontend/ is the current active version
```

---

### 3. Src Directories

```
DECISION: Keep src-enhanced/ (no regular src/ exists)

src-enhanced/ (2.5 GB)
├─ ✅ Contains core/, modules/, mcp-servers-production/
├─ ✅ Has comprehensive README.md
├─ ✅ Recently modified (Oct 6)
└─ ✅ This IS the source directory

src/
└─ ❌ Does NOT exist

ACTION: Rename src-enhanced/ → src/ (clarity, no size change)
REASON: "enhanced" is confusing when it's the only src
```

---

### 4. Docs Directory (5.9 GB) - MAJOR OPPORTUNITY

```
PROBLEM: docs/ contains 5.9 GB, mostly build artifacts and archives

Large files found:
├─ old_builds.zip                           2.1 GB  ❌ BUILD ARCHIVE
├─ BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK.zip  66 MB   ⚠️  SHOULD BE S3
├─ src-tauri/target/debug/                  ~2 GB   ❌ BUILD ARTIFACTS
└─ Various .rmeta, .rlib, .so files         ~1 GB   ❌ BUILD ARTIFACTS

BREAKDOWN:
├─ Build artifacts (target/, *.rmeta, etc)  ~3 GB   ❌ REMOVE
├─ Zip archives (old_builds.zip, etc)       ~2.2 GB ❌ REMOVE
├─ Legitimate documentation                 ~400 MB ✅ KEEP
└─ Media that should be in CDN              ~300 MB ⚠️  MOVE TO S3

ACTION: Clean docs/ directory (saves ~5.5 GB, keep ~400 MB)
TARGET: 5.9 GB → 400 MB
```

---

### 5. Other Directories to Evaluate

```
TerraFusionDevelopment/ (976 MB)
├─ ⚠️  Likely development sandbox
└─ ❓ May be outdated

ACTION: Investigate, likely remove (saves ~1 GB)

rust-performance-engine/ (2.4 GB)
├─ ✅ Legitimate code
└─ ✅ KEEP (may need optimization later)

packages/ (2.4 GB)
├─ ✅ Legitimate code
└─ ✅ KEEP

deployment/ (90 MB)
├─ ✅ Deployment configs
└─ ✅ KEEP
```

---

## 🎯 PHASE 2 EXECUTION PLAN

### Phase 2a: Remove Obvious Duplicates (Saves ~1.5 GB)

```bash
# Remove outdated core-os
rm -rf core-os/                              # -1.5 GB

# Remove old frontend versions
rm -rf frontend-v2/                          # -1.1 MB
rm -rf terrafusion-frontend/                 # -780 KB
```

**Expected: 26 GB → 24.5 GB**

---

### Phase 2b: Clean Docs Directory (Saves ~5.5 GB)

```bash
# Remove build artifacts from docs
rm -rf docs/src-tauri/src-tauri/target/      # -2 GB
rm -f docs/old_builds.zip                    # -2.1 GB
rm -f docs/*.zip                             # -66 MB+ (various zips)

# Archive large playbooks to S3 (before removing)
aws s3 cp docs/BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK.zip \
  s3://terrafusion-docs-archive/
```

**Expected: 24.5 GB → 19 GB**

---

### Phase 2c: Rename and Organize (No size change)

```bash
# Rename src-enhanced to src for clarity
mv src-enhanced src

# Update references in code
grep -r "src-enhanced" . --include="*.json" --include="*.ts" --include="*.js"
# (Update found references)
```

**Expected: 19 GB (same size, better structure)**

---

### Phase 2d: Evaluate TerraFusionDevelopment (Saves ~1 GB)

```bash
# Check if it's current or development sandbox
ls -la TerraFusionDevelopment/
# If outdated development sandbox:
rm -rf TerraFusionDevelopment/               # -976 MB
```

**Expected: 19 GB → 18 GB**

---

## 📈 PHASE 2 SIZE PROJECTIONS

```
STEP-BY-STEP:
├─ Start:                          26.0 GB
├─ After Phase 2a (duplicates):    24.5 GB  (-1.5 GB)
├─ After Phase 2b (docs clean):    19.0 GB  (-5.5 GB)
├─ After Phase 2c (rename):        19.0 GB  (no change)
└─ After Phase 2d (TFDev):         18.0 GB  (-1.0 GB)

TOTAL REDUCTION: 8 GB (31% additional reduction)
FINAL SIZE: 18 GB (clean, organized)
```

---

## 🏗️ PHASE 3: POLYREPO STRUCTURE DESIGN

Based on actual current structure, here's the extraction plan:

### Repository 1: `terrafusion-os-core` (Target: 2-3 GB)

**Extract from:**
```
terrafusion-cos/                    2.0 GB
  ├─ kernel/
  ├─ core/
  ├─ apis/
  └─ sdk/

src/ (after rename from src-enhanced)
  ├─ core/
  └─ system-level modules
```

**What it includes:**
- Core OS kernel
- Authentication/authorization
- API gateway
- SDK (JavaScript, Python, Rust)
- System services
- Health monitoring

---

### Repository 2: `terrafusion-marketplace` (Target: 1-2 GB)

**Extract from:**
```
packages/marketplace/               (if exists)
frontend/                           4.4 MB
  └─ marketplace-ui components

backend/marketplace/                (if exists)
```

**What it includes:**
- Marketplace platform
- App catalog
- Developer portal
- Payment processing
- User reviews/ratings

---

### Repository 3: `terrafusion-shared` (Target: 100-200 MB)

**Extract from:**
```
packages/shared/                    (if exists)
src/shared/                         (if exists)
  ├─ common utilities
  ├─ types
  └─ helpers
```

**What it includes:**
- Shared libraries
- Common utilities
- Type definitions
- Helper functions
- Published to npm as `@terrafusion/shared`

---

### Repository 4: `terrafusion-infrastructure` (Target: 200-300 MB)

**Extract from:**
```
deployment/                         90 MB
infrastructure/                     (if exists)
.github/                            (CI/CD templates)
docker-compose.yml
kubernetes/
terraform/
```

**What it includes:**
- Kubernetes manifests
- Terraform configs
- Docker configs
- CI/CD templates
- Deployment scripts

---

### Module Repositories (5-10 separate repos, 200-500 MB each)

**From `modules/` directory:**

1. **terrafusion-module-property-valuation**
   ```
   modules/government-core/property-valuation/
   ```

2. **terrafusion-module-gis-engine**
   ```
   modules/specialized/gis-engine/
   ```

3. **terrafusion-module-ai-agents**
   ```
   src/mcp-servers-production/
   modules/ai-agents/
   ```

4. **terrafusion-module-government-compliance**
   ```
   modules/government-core/compliance/
   modules/government-core/terra-flow/
   ```

5. **terrafusion-harris-county**
   ```
   modules/government-core/*harris*/
   ```

6. **terrafusion-woolpert**
   ```
   modules/partners/woolpert/
   ```

7. **terrafusion-benton-county**
   ```
   modules/government-core/*benton*/
   ```

---

## 🔧 PHASE 3 EXTRACTION TOOLS

### Tool: git-filter-repo

```bash
# Install git-filter-repo
pip3 install git-filter-repo

# Example extraction for os-core
git clone /workspaces/terrafusion_os_1.0 terrafusion-os-core
cd terrafusion-os-core
git filter-repo --path terrafusion-cos/ --path src/core/ --force
# Restructure directories
# Push to new repo
```

### Tool: Git Submodules (Optional)

After extraction, can link repos back as submodules if needed.

---

## 📊 PHASE 4: DATA INFRASTRUCTURE

### S3/MinIO Setup

```bash
# Install MinIO locally (self-hosted S3)
docker run -d \
  -p 9000:9000 -p 9001:9001 \
  -v /data/minio:/data \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=terrafusion2025" \
  minio/minio server /data --console-address ":9001"

# Create buckets
mc alias set tf http://localhost:9000 admin terrafusion2025
mc mb tf/terrafusion-datasets
mc mb tf/terrafusion-media
mc mb tf/terrafusion-docs-archive
```

### Migrate Data

```bash
# Move docs archives
aws s3 sync docs/*.zip s3://terrafusion-docs-archive/

# Move datasets (if any in data/)
aws s3 sync data/ s3://terrafusion-datasets/ \
  --exclude "postgres*" --exclude "redis*"

# Update code to fetch from S3
# Example:
# const data = await s3.getObject({
#   Bucket: 'terrafusion-datasets',
#   Key: 'parcels.geojson'
# }).promise();
```

---

## ✅ EXECUTION CHECKLIST

### Phase 2: Optimization (This Session)
- [ ] Remove core-os/ (1.5 GB)
- [ ] Remove old frontend dirs (2 MB)
- [ ] Clean docs/ directory (5.5 GB)
- [ ] Rename src-enhanced → src
- [ ] Remove TerraFusionDevelopment (1 GB)
- [ ] Commit changes
- [ ] Verify: 26 GB → 18 GB

### Phase 3: Polyrepo Extraction (Next)
- [ ] Create GitHub org structure
- [ ] Extract terrafusion-os-core
- [ ] Extract terrafusion-marketplace
- [ ] Extract terrafusion-shared
- [ ] Extract terrafusion-infrastructure
- [ ] Extract top 5 modules
- [ ] Setup CI/CD per repo
- [ ] Update dependencies

### Phase 4: Data Infrastructure (Parallel)
- [ ] Setup MinIO/S3
- [ ] Create buckets
- [ ] Migrate docs archives
- [ ] Migrate datasets
- [ ] Update code references
- [ ] Test data access

---

## 🎯 EXPECTED FINAL STATE

```
AFTER ALL PHASES:

Main Monorepo (Archive):
└─ 18 GB (historical reference only)

Polyrepo Structure:
├─ terrafusion-os-core           2-3 GB
├─ terrafusion-marketplace       1-2 GB
├─ terrafusion-shared            100 MB
├─ terrafusion-infrastructure    200 MB
├─ terrafusion-module-* (×7)     ~3 GB total
└─ Total in Git:                 ~7-9 GB

Data Storage (NOT in Git):
├─ S3/MinIO                      ~10 GB (datasets, media)
├─ AWS Glacier                   ~139 GB (archived backups)
└─ Docker Registry               ~2 GB (container images)

BENEFITS:
✅ 95% reduction from original 189 GB
✅ Clear architectural boundaries
✅ Independent deployment
✅ Marketplace-ready
✅ Third-party development enabled
```

---

**Ready to execute! Next step: Phase 2a - Remove duplicates**

