# TerraFusion Dev Platform - Certified State
# ═══════════════════════════════════════════════════════════════════════════
# This document defines the "golden" configuration for TerraFusion development.
# Any deviation from this state will be flagged by `tf gate`.
# Re-certify after major changes with `tf certify`.
# ═══════════════════════════════════════════════════════════════════════════

## Certification Info

| Field | Value |
|-------|-------|
| **Certified Date** | 2025-12-16 |
| **Certified By** | tf certify v1.0 |
| **Git SHA** | (generated at certification) |
| **Machine** | HP OMEN (Ryzen 9 8940HX / RTX 5060 Ti / 32GB) |

---

## 1. WSL Configuration

**File:** `C:\Users\{USER}\.wslconfig`

```ini
[wsl2]
memory=8GB
swap=2GB
processors=8
```

**Invariants:**
- ✅ `.wslconfig` MUST exist
- ✅ `memory` MUST be ≤ 8GB (prevents runaway allocation)
- ✅ `processors` SHOULD be ≤ 8 (leaves headroom for Windows)

---

## 2. VS Code Profile

**Profile Name:** `TerraFusion Core`
**Profile ID:** `11a4aa8e`

**Required Association:**
```
Workspace: vscode-remote://wsl+ubuntu/home/bsval/dev/terrafusion_os_1.0
Profile: TerraFusion Core (11a4aa8e)
```

**Extension Budget:** ≤ 20 enabled extensions

**Core Extensions (must be enabled):**
- `ms-vscode-remote.remote-wsl`
- `github.copilot`
- `ms-python.python`
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`

**Banned Extensions (must NOT be enabled):**
- Heavy language servers not actively used
- Duplicate formatters
- Abandoned extensions

---

## 3. Kubernetes Resource Limits

**Namespace:** `terrafusion-staging`

| Pod | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----|-------------|-----------|----------------|--------------|
| api-gateway | 100m | 500m | 128Mi | 512Mi |
| auth-service | 100m | 500m | 128Mi | 512Mi |
| cache-service | 100m | 200m | 64Mi | 256Mi |
| postgres | 100m | 500m | 256Mi | 1Gi |
| redis | 50m | 200m | 64Mi | 256Mi |

**Invariants:**
- ✅ ALL pods MUST have resource limits defined
- ✅ No pod memory limit > 2Gi (prevents single-pod monopoly)
- ✅ Total namespace memory < 4Gi

---

## 4. Standalone Containers

| Container | Memory Limit | Purpose |
|-----------|--------------|---------|
| postgres-dev | 1GB | Local development DB |
| redis-dev | 512MB | Local cache |
| pacs-benton-mssql | 2GB | Harris PACS integration (opt-in) |

**Invariants:**
- ✅ All dev containers MUST have memory limits
- ✅ PACS container requires `TF_PACS_MODE=1` to run without warning

---

## 5. AI Lab Configuration

**Compose File:** `ops/ai/compose.ai.yml`

| Service | Memory Limit | CPU Limit | GPU |
|---------|--------------|-----------|-----|
| tf-ai-ollama | 6GB | 6 cores | RTX 5060 Ti |
| tf-ai-webui | 1GB | 1 core | - |
| tf-ai-chromadb | 2GB | 2 cores | - |

**Port Bindings (MUST be localhost-only):**
- `127.0.0.1:11434` → Ollama API
- `127.0.0.1:3030` → WebUI
- `127.0.0.1:8000` → ChromaDB

**Models Budget:**
- Chat: `llama3.2:3b` (~2GB)
- Code: `codellama:7b` (~4GB)
- Embeddings: `nomic-embed-text` (~300MB)
- **Total:** ≤ 10GB model storage

**Invariants:**
- ✅ All AI ports MUST be `127.0.0.1` bound (security)
- ✅ Model storage ≤ 10GB (prevent sprawl)
- ✅ Ollama memory limit ≤ 6GB

---

## 6. RAG Configuration

**Collections:**

| Collection | Description | File Types |
|------------|-------------|------------|
| `terrafusion_docs` | Docs, runbooks, guides | .md, .yml, .yaml |
| `terrafusion_specs` | SPECLOCKs, configs, ADRs | .md, .yaml, .json |

**Chunking Parameters:**
- Docs: 800 chars, 120 overlap
- Specs: 600 chars, 100 overlap

**Invariants:**
- ✅ RAG manifest exists at `ops/ai/rag/state/manifest.json`
- ✅ Last ingest ≤ 7 days ago
- ✅ ChromaDB volume ≤ 2GB

---

## 7. System Resource Thresholds

| Metric | Warning | Error |
|--------|---------|-------|
| VS Code RAM | > 2GB | > 4GB |
| WSL RAM | > 6GB | > 7GB |
| System RAM % | > 70% | > 85% |
| Docker disk | > 30GB | > 50GB |

---

## Verification Commands

```bash
# Quick gate check (invariants only)
tf gate

# Full gate check (includes builds/tests)
tf gate --full

# Re-certify after changes
tf certify

# Export current state as JSON
tf doctor --json > state.json
```

---

## Recovery Procedures

### VS Code RAM Too High
```bash
# Check enabled extensions
code --list-extensions | wc -l
# Disable heavy extensions, restart VS Code
```

### WSL RAM Too High
```bash
# Check what's using memory
ps aux --sort=-%mem | head -10
# Restart WSL if needed
wsl --shutdown
```

### K8s Pod Without Limits
```bash
# Check which pods lack limits
kubectl get pods -n terrafusion-staging -o json | \
  jq '.items[] | select(.spec.containers[].resources.limits == null) | .metadata.name'
# Patch the deployment
```

### AI Lab Ports Exposed
```bash
# Check port bindings
docker ps --filter "name=tf-ai" --format '{{.Ports}}'
# If exposed to 0.0.0.0, stop and fix compose.ai.yml
tf ai down
# Edit compose.ai.yml to use 127.0.0.1
tf ai up
```

---

## Change Log

| Date | Change | Certified By |
|------|--------|--------------|
| 2025-12-16 | Initial certification | tf certify v1.0 |
