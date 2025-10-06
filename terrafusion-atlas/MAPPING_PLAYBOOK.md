# TerraFusion Atlas Mapping Playbook

**Step-by-step guide to indexing your entire ecosystem**

## 🎯 Goal

Create a complete, searchable index of every meaningful component in TerraFusion OS:
services, engines, frontends, agents, modules, datasets, pipelines, and more.

## 📋 Pre-Flight Checklist

- [ ] Both `terrafusion-repo-mapper` and `terrafusion-atlas` are in your repo root
- [ ] Python 3.7+ is installed
- [ ] You have ~90 minutes for initial mapping

## 🚀 Phase 1: Harvest the Repository Tree (15 min)

### Step 1.1: Run the Repo Mapper

```bash
cd /path/to/terrafusion_os_1.0
python3 terrafusion-repo-mapper/repo_map.py . --out ./repo-map-out --max-depth 5
```

**Output:**
- `repo-map-out/inventory.json` - Machine-readable inventory
- `repo-map-out/CATALOG.md` - Human-readable catalog
- `repo-map-out/graph.dot` - Dependency graph

### Step 1.2: Review the Catalog

```bash
# Open in your editor
code repo-map-out/CATALOG.md

# Or view in terminal
less repo-map-out/CATALOG.md
```

**Look for:**
- Top-level folders that contain services, engines, or modules
- Patterns in directory names (e.g., `*-api`, `*-engine`, `*-frontend`)
- Technology indicators (Cargo.toml, package.json, *.csproj)

## 🧠 Phase 2: Auto-Classify Items (10 min)

### Step 2.1: Run the Auto-Classifier

```bash
cd terrafusion-atlas
python3 scripts/atlas_classify.py ../repo-map-out/inventory.json \
  --out atlas-auto-draft.json \
  --seed-script seed-atlas.sh
```

**Output:**
- `atlas-auto-draft.json` - Suggested classifications
- `seed-atlas.sh` - Shell script to populate Atlas

### Step 2.2: Review Classifications

```bash
# View the draft
cat atlas-auto-draft.json | jq '.classifications'

# Check statistics
cat atlas-auto-draft.json | jq '.stats'
```

**Verify:**
- High-confidence items (single category)
- Multi-category items (may need manual decision)
- Unclassified items (edge cases)

### Step 2.3: Edit seed-atlas.sh (optional)

```bash
# Open in editor
code seed-atlas.sh

# Adjust any:
# - IDs (make them more semantic)
# - Owners (assign correct teams)
# - Tags (add domain-specific tags)
```

## 📝 Phase 3: Populate Atlas Registries (30 min)

### Step 3.1: Run Auto-Generated Seeds

```bash
# Make executable if needed
chmod +x seed-atlas.sh

# Run the script
./seed-atlas.sh
```

This populates all 14 registries with discovered items.

### Step 3.2: Manual Additions (High-Priority Items)

Add critical items that need custom metadata:

#### Services

```bash
python3 scripts/atlas_seed.py services \
  --id os.kernel.api \
  --name "OS Kernel API" \
  --owner kernel-team \
  --source_path backend/kernel-api \
  --tags kernel,api,dotnet,k8s,critical \
  --lifecycle active

python3 scripts/atlas_seed.py services \
  --id marketplace.gateway \
  --name "Marketplace Gateway" \
  --owner marketplace-team \
  --source_path marketplace/gateway \
  --tags marketplace,gateway,api,k8s
```

#### Engines

```bash
python3 scripts/atlas_seed.py engines \
  --id engine.costforge.rust \
  --name "CostForge Rust Engine" \
  --owner kernel-team \
  --source_path engines/costforge \
  --tags rust,engine,ffi,wasm,critical \
  --language rust \
  --ffi_bindings dotnet,node,python
```

#### Modules

```bash
python3 scripts/atlas_seed.py modules \
  --id module.gis.parcel-tools \
  --name "GIS Parcel Tools" \
  --owner plugins-team \
  --source_path modules/parcel-tools \
  --tags gis,parcel,plugin,ui \
  --module_type core \
  --hot_swap \
  --marketplace
```

#### Agents

```bash
python3 scripts/atlas_seed.py agents \
  --id agent.valuation.specialist \
  --name "Valuation Specialist Agent" \
  --owner ai-team \
  --source_path agents/valuation-specialist \
  --tags ai,valuation,specialist \
  --agent_type specialist \
  --capabilities valuation,analysis,reporting
```

#### Datasets

```bash
python3 scripts/atlas_seed.py datasets \
  --id data.parcels.postgres \
  --name "Parcel Database" \
  --owner data-team \
  --source_path database/parcels \
  --tags parcels,gis,postgres,primary \
  --data_type database \
  --technology PostgreSQL
```

### Step 3.3: Verify Registries

```bash
# List all registries
python3 scripts/atlas_seed.py list

# List specific registry
python3 scripts/atlas_seed.py list services
python3 scripts/atlas_seed.py list engines
python3 scripts/atlas_seed.py list modules
```

## 🏛️ Phase 4: Governance & Ownership (20 min)

### Step 4.1: Create CODEOWNERS

```bash
cd terrafusion-atlas/governance
cp CODEOWNERS.example ../../.github/CODEOWNERS
```

Edit `.github/CODEOWNERS`:

```
# TerraFusion Atlas-Driven Ownership

# Services
/backend/kernel-api/           @kernel-team
/backend/gateway/              @platform-team
/marketplace/                  @marketplace-team

# Engines
/engines/costforge/            @kernel-team
/engines/valuation/            @valuation-team

# Frontends
/frontend/                     @frontend-team
/marketplace/frontend/         @marketplace-team

# Agents
/agents/                       @ai-team
/.ai/                          @ai-team

# Data
/database/                     @data-team
/data/                         @data-team

# Infrastructure
/helm/                         @ops-team
/terraform/                    @ops-team
/.github/workflows/            @ops-team

# Documentation
/*.md                          @docs-team
/docs/                         @docs-team
```

### Step 4.2: Create RACI Matrix

```bash
cp RACI_TEMPLATE.md ../../RACI.md
```

Fill in who is:
- **R**esponsible (does the work)
- **A**ccountable (owns the outcome)
- **C**onsulted (provides input)
- **I**nformed (kept in the loop)

For each registry type.

## 🎨 Phase 5: Physical Reorganization (Optional, 15 min)

**⚠️ Warning:** This step moves files. Commit current state first!

### Step 5.1: Create Clean Top-Level Structure

```bash
mkdir -p os marketplace agents engines modules datasets deploy docs partners archive
```

### Step 5.2: Move Items Based on Atlas

Use Atlas registries as your guide. Example:

```bash
# Services → /os/
mv backend/kernel-api os/kernel-api
mv backend/gateway os/gateway

# Engines → /engines/
mv rust-performance-engine engines/performance
mv costforge engines/costforge

# Frontends → /marketplace/ or appropriate location
mv frontend-v2 marketplace/frontend
mv terra-desktop frontend/desktop

# Agents → /agents/
mv .ai agents/ai-core
mv ai-swarm-supreme-commander agents/swarm-commander

# Old builds/reports → /archive/
mv FULL_BACKUP_* archive/
mv *_AUDIT_* archive/reports/
```

### Step 5.3: Update Atlas source_path

After moving files, update registries:

```bash
# Edit each registry JSON to reflect new paths
code terrafusion-atlas/registries/services.json
# Update "source_path" fields
```

## 🔄 Phase 6: CI Integration (10 min)

### Step 6.1: Create Validation Workflow

```yaml
# .github/workflows/atlas-validation.yml
name: Atlas Validation

on:
  pull_request:
    paths:
      - 'terrafusion-atlas/**'
      - '*/package.json'
      - '*/Cargo.toml'
      - '*/*.csproj'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Atlas
        run: |
          python3 terrafusion-atlas/scripts/atlas_validate.py
      
      - name: Check for unregistered items
        run: |
          python3 terrafusion-atlas/scripts/check_unregistered.py
      
      - name: Post summary
        run: |
          python3 terrafusion-atlas/scripts/atlas_summary.py >> $GITHUB_STEP_SUMMARY
```

## ✅ Phase 7: Validation & Sign-Off

### Checklist

- [ ] All top-level services registered in `registries/services.json`
- [ ] All Rust engines registered in `registries/engines.json`
- [ ] All frontends registered in `registries/frontends.json`
- [ ] All hot-swap modules registered in `registries/modules.json`
- [ ] All AI agents registered in `registries/agents.json`
- [ ] All datasets registered in `registries/datasets.json`
- [ ] All CI/CD pipelines registered in `registries/pipelines.json`
- [ ] Brand assets registered in `registries/brands.json`
- [ ] Environments registered in `registries/environments.json`
- [ ] Helm charts registered in `registries/deployments.json`
- [ ] Partner integrations registered in `registries/partners.json`
- [ ] Every item has an owner
- [ ] Every item has at least one tag
- [ ] CODEOWNERS file created/updated
- [ ] CI validation workflow added

### Verify Completeness

```bash
# Count items per registry
for reg in terrafusion-atlas/registries/*.json; do
  echo "$(basename $reg): $(jq '.items | length' $reg) items"
done

# Check for missing owners
for reg in terrafusion-atlas/registries/*.json; do
  echo "Checking $(basename $reg)..."
  jq -r '.items[] | select(.owner == null or .owner == "") | .id' $reg
done

# Check for missing tags
for reg in terrafusion-atlas/registries/*.json; do
  echo "Checking $(basename $reg)..."
  jq -r '.items[] | select(.tags == null or .tags == [] or (.tags | length == 0)) | .id' $reg
done
```

## 📊 Success Metrics

After completing this playbook, you should have:

- **100+ items** registered across all registries
- **Zero unowned items** (every item has an owner)
- **Consistent tagging** using controlled vocabulary
- **Dependency tracking** between services, engines, and datasets
- **CI validation** preventing unregistered additions
- **Clear ownership** via CODEOWNERS

## 🆘 Troubleshooting

### "Item already exists"

```bash
# Update existing item by re-running with same ID
python3 scripts/atlas_seed.py services --id existing.id --name "New Name" ...
```

### "Invalid registry"

Check spelling - must be one of the 14 valid registries:
`services`, `engines`, `frontends`, `agents`, `modules`, `datasets`, `pipelines`, `brands`, `environments`, `deployments`, `compliance`, `partners`, `releases`, `components`

### "Cannot find inventory.json"

Make sure you ran `repo_map.py` first and it completed successfully.

---

**Next Steps:** Once Atlas is populated, use it for:
- Architecture diagrams (auto-generated from dependencies)
- Tech debt tracking (by lifecycle state)
- Team workload analysis (by owner)
- Security audits (by tags and dependencies)
