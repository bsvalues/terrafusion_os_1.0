# TerraFusion Dev OS Contract (v1)

> **Mission:** Keep TerraFusion development environment fast, stable,
> deterministic, and recoverable.

---

## North Star Metrics

| Metric             | Target       | Current Baseline |
| ------------------ | ------------ | ---------------- |
| RAM Usage (idle)   | < 70%        | 94.6% ⚠️         |
| Docker Containers  | ≤ 30 running | 51 running       |
| VS Code Extensions | ≤ 80 enabled | 196 installed    |
| Clean Build Time   | < 5 min      | TBD              |
| WSL Memory         | 18 GB        | 18 GB ✓          |
| WSL CPUs           | 12           | 12 ✓             |

---

## Hard Limits (Enforced)

### WSL2 Limits (32GB RAM machines)

```ini
[wsl2]
memory=18GB
processors=12
swap=4GB
autoMemoryReclaim=gradual
sparseVhd=true
```

**Rationale:** With 51+ containers + heavy VS Code + AI tools, giving WSL 24
cores caused memory pressure. 12 cores maintains sustainable throughput.

### Docker Limits

| Setting                | Value                   | Location                |
| ---------------------- | ----------------------- | ----------------------- |
| Container log max-size | 10m                     | `~/.docker/daemon.json` |
| Container log max-file | 5                       | `~/.docker/daemon.json` |
| BuildKit               | enabled                 | `~/.docker/daemon.json` |
| Prune policy           | safe daily, deep weekly | `tf clean`              |

### VS Code Limits

| Limit                | Value             | Enforcement             |
| -------------------- | ----------------- | ----------------------- |
| AI assistants active | 1 at a time       | Manual discipline       |
| Extensions enabled   | ≤ 80              | Profile-based           |
| TS server memory     | 8192 MB           | `.vscode/settings.json` |
| File watchers        | Excluded patterns | `.vscode/settings.json` |

---

## Guardrails (Non-negotiable)

### 1. Repo Location

- **Optimal:** `~/dev/terrafusion` inside WSL (ext4)
- **Current:** `C:\Users\bsval\terrafusion_os_1.0` (NTFS) ⚠️
- **Impact:** 10-30% I/O penalty on current setup

### 2. Build Environment

- All builds run in WSL via Remote-WSL
- TypeScript server runs in WSL
- File watchers run in WSL

### 3. Compute Isolation

- Heavy AI inference runs in dedicated "AI Lab" profile
- dGPU reserved for CUDA workloads only
- VS Code/browsers forced to iGPU

---

## Operating Procedures

### Daily Commands

```bash
# Start development stack
tf up

# Check system health
tf doctor

# Safe cleanup (images, build cache)
tf clean --safe

# Stop stack
tf down
```

### Weekly Commands

```bash
# Deep cleanup (dangling volumes, networks)
tf clean --deep

# Compact WSL VHDXs (requires shutdown)
tf compact

# Capture new baseline
Capture-Baseline.ps1 -Label "weekly_$(Get-Date -Format 'yyyyMMdd')"
```

### Emergency Commands

```bash
# Stop everything and prune
tf down --prune

# Nuclear reset (careful!)
tf nuke  # stops all, prunes all, compacts VHDXs
```

---

## Compose Stack Reference

TerraFusion uses a modular compose architecture:

| Stack           | File                                    | Purpose                            |
| --------------- | --------------------------------------- | ---------------------------------- |
| **Core**        | `docker-compose.yml`                    | postgres, redis, backend, ai-agent |
| **Dev**         | `compose/docker-compose.dev.yml`        | hot-reload, watch mode             |
| **AI**          | `compose/docker-compose.ai.yml`         | AI services                        |
| **Monitoring**  | `compose/docker-compose.monitoring.yml` | Grafana, Prometheus                |
| **Benton Demo** | `docker-compose.benton.yml`             | County-specific                    |

### Bring-up Order

1. Core infrastructure (postgres, redis)
2. Backend API
3. AI services
4. Frontend
5. Optional: monitoring

---

## Logging

All `tf` operations write logs to:

```
ops/dev/_logs/
├── tf.log           # Main operations log
├── bring-up/        # Per-session bring-up logs
└── baseline/        # Baseline captures
```

---

## Proof Points

Every optimization change must be validated:

1. **Before:** Run `Capture-Baseline.ps1 -Label "before_<change>"`
2. **Change:** Apply the optimization
3. **After:** Run `Capture-Baseline.ps1 -Label "after_<change>"`
4. **Compare:** Review JSON diffs in `C:\Tools\DevBaseline\baselines\`

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  TerraFusion Dev OS - Quick Commands                        │
├─────────────────────────────────────────────────────────────┤
│  tf up           Start core stack                           │
│  tf up --full    Start all services                         │
│  tf down         Stop stack                                 │
│  tf down --prune Stop + safe prune                          │
│  tf doctor       Health check                               │
│  tf clean        Safe cleanup                               │
│  tf clean --deep Deep cleanup                               │
│  tf compact      Compact VHDXs (requires restart)           │
│  tf logs         Tail service logs                          │
│  tf status       Container status                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Version History

| Version | Date       | Changes          |
| ------- | ---------- | ---------------- |
| v1.0    | 2024-12-16 | Initial contract |
