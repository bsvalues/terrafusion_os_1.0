# TerraFusion Atlas

**Unified index for the entire TerraFusion ecosystem**

## 📚 What is the Atlas?

The TerraFusion Atlas is a comprehensive cataloging system that tracks **everything** in your ecosystem:

- 🔧 **Services** - Backend APIs, microservices, daemons
- ⚡ **Engines** - High-performance Rust/WASM computation cores
- 🎨 **Frontends** - Web UIs, desktop shells, mobile apps
- 🤖 **Agents** - AI agents, swarms, autonomous systems
- 🧩 **Modules** - Hot-swappable apps and plugins
- 💾 **Datasets** - Databases, data lakes, backups
- 🔄 **Pipelines** - CI/CD workflows, ETL jobs
- 🎨 **Brands** - Brand identities and marketing assets
- 🌍 **Environments** - Dev, staging, production configs
- 🚀 **Deployments** - Helm charts, K8s manifests
- 📋 **Compliance** - Security audits, certifications
- 🤝 **Partners** - Integration docs, vendor SDKs
- 📦 **Releases** - Build artifacts, versioned packages
- 🔩 **Components** - Shared libraries, utilities

## 🚀 Quick Start

### 1. Add an item to a registry

```bash
python3 scripts/atlas_seed.py services \
  --id os.kernel.api \
  --name "OS Kernel API" \
  --owner kernel-team \
  --source_path backend/kernel-api \
  --tags kernel,api,dotnet,k8s
```

### 2. List all items in a registry

```bash
python3 scripts/atlas_seed.py list services
```

### 3. Auto-classify from repo inventory

```bash
# First, run the repo mapper
cd ..
python3 terrafusion-repo-mapper/repo_map.py . --out ./repo-map-out

# Then auto-classify
cd terrafusion-atlas
python3 scripts/atlas_classify.py ../repo-map-out/inventory.json \
  --out atlas-auto-draft.json \
  --seed-script seed-atlas.sh

# Review and run
./seed-atlas.sh
```

## 📖 Structure

```
terrafusion-atlas/
├── ATLAS.json              # Root index
├── registries/             # JSON files for each registry type
│   ├── services.json
│   ├── engines.json
│   ├── frontends.json
│   ├── agents.json
│   ├── modules.json
│   ├── datasets.json
│   ├── pipelines.json
│   ├── brands.json
│   ├── environments.json
│   ├── deployments.json
│   ├── compliance.json
│   ├── partners.json
│   ├── releases.json
│   └── components.json
├── schemas/               # JSON schemas for validation
│   ├── service.schema.json
│   ├── engine.schema.json
│   └── ...
├── scripts/
│   ├── atlas_seed.py      # CLI for adding items
│   └── atlas_classify.py  # Auto-classifier
├── templates/             # README/checklist templates
├── governance/            # CODEOWNERS, RACI
└── README.md             # This file
```

## 🏷️ Tagging System

Use tags to categorize items across multiple dimensions:

**Domains:** `os`, `marketplace`, `ai`, `gis`, `valuation`, `analytics`, `parcel`, `admin`

**Layers:** `kernel`, `api`, `engine`, `ui`, `data`, `infra`, `ops`

**Security:** `public`, `internal`, `confidential`, `restricted`

**Languages:** `rust`, `csharp`, `dotnet`, `typescript`, `javascript`, `python`, `go`

**Platforms:** `k8s`, `docker`, `wasm`, `tauri`, `electron`, `web`

## 🎯 Lifecycle States

- **active** - Currently maintained and in use
- **experimental** - Under development, not production-ready
- **deprecated** - Still exists but being phased out
- **archived** - No longer maintained, kept for reference

## 🔗 Relationships

Items can reference each other:

```json
{
  "id": "os.valuation.api",
  "depends_on": ["engine.costforge.rust", "data.parcels.postgres"],
  "used_by": ["frontend.desktop.shell", "module.valuation.advanced"]
}
```

## 📊 Governance

Each item must have:
- **Owner** - Team or person responsible
- **Lifecycle** - Current state (active/experimental/deprecated/archived)
- **Source Path** - Where to find the code
- **Tags** - Categorization metadata

## 🔍 Searching the Atlas

```bash
# Find all items owned by a team
jq '.items[] | select(.owner == "kernel-team")' registries/services.json

# Find all Rust engines
jq '.items[] | select(.language == "rust")' registries/engines.json

# Find all active modules
jq '.items[] | select(.lifecycle == "active")' registries/modules.json

# Find items with specific tag
jq '.items[] | select(.tags | contains(["k8s"]))' registries/services.json
```

## 🚦 CI Integration

Add validation to your CI pipeline:

```yaml
- name: Validate Atlas
  run: |
    python3 terrafusion-atlas/scripts/atlas_validate.py
```

This ensures:
- All new top-level folders are registered
- All items have required fields
- No orphaned dependencies
- Consistent tagging

## 📝 Best Practices

1. **Register before you code** - Add Atlas entry when creating new services/modules
2. **Update on refactor** - Keep source_path current if you move things
3. **Tag consistently** - Use controlled vocabulary from ATLAS.json
4. **Set lifecycle** - Mark experimental/deprecated appropriately
5. **Link dependencies** - Track what depends on what
6. **Assign owners** - Every item needs a responsible team

## 🆘 Getting Help

- Check `schemas/*.schema.json` for required fields
- Use `atlas_seed.py --help` for CLI options
- Review `templates/` for README/checklist examples
- See `MAPPING_PLAYBOOK.md` for step-by-step guidance

---

**Made with ❤️ for TerraFusion OS**
