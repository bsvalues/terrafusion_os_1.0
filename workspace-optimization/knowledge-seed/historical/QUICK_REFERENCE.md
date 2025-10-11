# 🚀 TerraFusion Atlas & Mapper - Quick Reference Card

## 📂 What We Built

**Location:** `/workspaces/terrafusion_os_1.0/`

```
terrafusion_os_1.0/
├── terrafusion-repo-mapper/          🗺️  Repository scanner & cataloger
│   └── repo_map.py                   Scans repo, generates inventory
├── terrafusion-atlas/                🌐 Ecosystem index (14 registries)
│   ├── ATLAS.json                    Root configuration
│   ├── registries/                   14 registry JSON files
│   ├── schemas/                      14 validation schemas
│   ├── scripts/                      CLI tools
│   ├── templates/                    README/checklist templates
│   └── governance/                   CODEOWNERS, RACI
├── repo-map-out/                     📊 Generated inventory (13MB)
│   ├── inventory.json                Machine-readable catalog
│   ├── CATALOG.md                    Human-readable catalog
│   └── graph.dot                     Dependency graph
├── .github/workflows/
│   └── atlas-validation.yml          🔍 CI validation
├── ATLAS_IMPLEMENTATION_COMPLETE.md  📖 Complete guide (START HERE)
└── REPOSITORY_REORGANIZATION_PLAN.md 📋 Optional migration plan
```

---

## ⚡ Quick Commands

### View Atlas
```bash
cd terrafusion-atlas

# List all registries
python3 scripts/atlas_seed.py list

# List specific registry
python3 scripts/atlas_seed.py list services

# Generate summary report
python3 scripts/atlas_summary.py
```

### Add Items
```bash
# Add a service
python3 scripts/atlas_seed.py services \
  --id my.api \
  --name "My API" \
  --owner my-team \
  --source_path path/to/code \
  --tags api,k8s,dotnet

# Add an engine
python3 scripts/atlas_seed.py engines \
  --id engine.my.engine \
  --name "My Engine" \
  --owner engine-team \
  --source_path engines/my-engine \
  --language rust \
  --tags rust,performance

# Add a module
python3 scripts/atlas_seed.py modules \
  --id module.my.plugin \
  --name "My Plugin" \
  --owner plugins-team \
  --source_path modules/my-plugin \
  --module_type core \
  --hot_swap \
  --marketplace
```

### Validate
```bash
# Validate all registries
python3 scripts/atlas_validate.py

# Check for unregistered items
python3 scripts/check_unregistered.py

# Run full classification
python3 scripts/atlas_classify.py ../repo-map-out/inventory.json
```

### Re-scan Repository
```bash
cd ..
python3 terrafusion-repo-mapper/repo_map.py . --out ./repo-map-out --max-depth 5
```

---

## 📊 Current Stats

- **Files Scanned:** 18,583
- **Directories:** 6,049
- **Repository Size:** 133.60 GB
- **Items Classified:** 2,043 (out of 2,496)
- **Registered in Atlas:** 28 core items
- **Registries:** 14 active (13 populated, 1 empty)
- **Health:** 100% ownership, 100% tagged, 100% valid

---

## 🎯 14 Atlas Registries

| # | Registry | Count | Purpose |
|---|----------|-------|---------|
| 1 | **services** | 3 | Backend APIs, microservices, daemons |
| 2 | **engines** | 2 | High-performance Rust/WASM engines |
| 3 | **frontends** | 3 | Web UIs, desktop apps, marketplaces |
| 4 | **agents** | 3 | AI agents, swarms, consciousness |
| 5 | **modules** | 2 | Hot-swappable plugins and apps |
| 6 | **datasets** | 2 | Databases, data lakes, exports |
| 7 | **pipelines** | 2 | CI/CD workflows, ETL jobs |
| 8 | **brands** | 2 | Brand identities, marketing |
| 9 | **environments** | 2 | Dev, staging, production |
| 10 | **deployments** | 2 | Helm charts, Terraform IaC |
| 11 | **compliance** | 2 | Security audits, certs |
| 12 | **partners** | 2 | Partner integrations, SDKs |
| 13 | **releases** | 0 | Build artifacts (ready) |
| 14 | **components** | 1 | Shared libraries, utilities |

---

## 🏷️ Common Tags

**Domain:** `os`, `marketplace`, `ai`, `gis`, `valuation`, `analytics`  
**Layer:** `kernel`, `api`, `engine`, `ui`, `data`, `infra`, `ops`  
**Security:** `public`, `internal`, `confidential`, `restricted`  
**Tech:** `rust`, `csharp`, `dotnet`, `typescript`, `python`, `k8s`, `docker`  
**Features:** `hot-swap`, `ffi`, `wasm`, `critical`, `experimental`

---

## 📖 Key Documents

| File | Purpose |
|------|---------|
| `ATLAS_IMPLEMENTATION_COMPLETE.md` | **START HERE** - Complete overview |
| `terrafusion-atlas/README.md` | Atlas user guide |
| `terrafusion-atlas/MAPPING_PLAYBOOK.md` | Step-by-step mapping guide |
| `terrafusion-atlas/TAGS.md` | Tag vocabulary reference |
| `REPOSITORY_REORGANIZATION_PLAN.md` | Physical reorganization plan |
| `repo-map-out/CATALOG.md` | Repository catalog (491KB) |

---

## 🎓 Workflows

### Onboard New Service
1. Create service code
2. Register in Atlas: `python3 scripts/atlas_seed.py services ...`
3. Add README using template: `templates/ITEM_README.md`
4. Update CODEOWNERS
5. PR auto-validates ownership & tags

### Weekly Maintenance
1. Run: `python3 scripts/check_unregistered.py`
2. Add newly discovered items
3. Review: `python3 scripts/atlas_summary.py`

### Quarterly Audit
1. Re-scan: `python3 terrafusion-repo-mapper/repo_map.py ...`
2. Re-classify: `python3 scripts/atlas_classify.py ...`
3. Update lifecycle states (mark deprecated)
4. Archive old items
5. Update CODEOWNERS

---

## 🔍 Search Patterns

```bash
# Find all items by owner
jq '.items[] | select(.owner == "kernel-team")' registries/services.json

# Find all Rust engines
jq '.items[] | select(.language == "rust")' registries/engines.json

# Find all K8s deployments
jq '.items[] | select(.tags | contains(["k8s"]))' registries/services.json

# Find experimental items
for reg in registries/*.json; do
  jq -r '.items[] | select(.lifecycle == "experimental") | .id' "$reg"
done

# Count by owner
jq -r '.items[].owner' registries/*.json | sort | uniq -c | sort -rn
```

---

## 🚨 Troubleshooting

### "Item already exists"
→ Re-run same command to update the item

### "Missing required field"
→ Check schema: `schemas/<type>.schema.json`

### "Unregistered items found"
→ Run: `python3 scripts/check_unregistered.py` and add them

### "CI validation failing"
→ Run locally: `python3 scripts/atlas_validate.py`

---

## 🎯 Next Actions

1. ✅ **Review** - Read `ATLAS_IMPLEMENTATION_COMPLETE.md`
2. ✅ **Explore** - Browse `repo-map-out/CATALOG.md`
3. ✅ **Add** - Register your team's services/modules
4. ✅ **Validate** - Run `atlas_validate.py`
5. ⚠️ **Optional** - Execute `REPOSITORY_REORGANIZATION_PLAN.md`

---

## 💡 Pro Tips

- **Use tags consistently** - Check `TAGS.md` first
- **Assign owners** - Every item needs a team
- **Set lifecycle** - Mark experimental/deprecated
- **Link dependencies** - Use `depends_on` and `used_by`
- **Update on move** - Keep `source_path` current
- **CI validates** - PR checks run automatically

---

## 📞 Get Help

- **Docs:** `terrafusion-atlas/README.md`
- **Playbook:** `terrafusion-atlas/MAPPING_PLAYBOOK.md`
- **CLI Help:** `python3 scripts/atlas_seed.py --help`
- **Schemas:** `terrafusion-atlas/schemas/*.schema.json`

---

**This is production-ready. Start using it today! 🚀**

*Print this card or save it to your desktop for quick reference.*
