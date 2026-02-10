# Benton County On-Prem Runner Pilot

**Status:** Wiring complete — awaiting runner provisioning  
**PR:** (this PR)  
**Scope:** PR gates only (smallest critical surface)

---

## 1. What This Pilot Proves

A single self-hosted GitHub Actions runner at Benton County can execute the
same PR gates that currently run on GitHub-hosted `ubuntu-latest` runners,
with toolchain parity, artifact retrieval, and zero secrets exposure.

### Success Criteria

| # | Criterion | How We Verify |
|---|-----------|---------------|
| 1 | Runner executes PR gates | All 3 PR-gate workflows route to `[self-hosted, benton, linux-x64]` when `BENTON_RUNNER=true` |
| 2 | Toolchain parity | `benton-runner-smoke.yml` validates dotnet 8.0.x, node 20, pnpm ≥9, git ≥2.30 |
| 3 | Artifacts retrievable | Smoke workflow tests upload → download roundtrip |
| 4 | Secrets strategy | Documented below; PR gates use zero secrets |
| 5 | Network documented | Outbound allowlist in `platform.json` and below |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│  GitHub (cloud)                                 │
│  ┌──────────────────────┐                       │
│  │ Repository           │                       │
│  │  platform.json       │ ◄── single source     │
│  │  .github/workflows/  │     of truth          │
│  └──────┬───────────────┘                       │
│         │ dispatches jobs                       │
│         ▼                                       │
│  ┌──────────────────────┐   ┌─────────────────┐ │
│  │ ubuntu-latest        │   │ Benton runner   │ │
│  │ (GitHub-hosted)      │   │ (self-hosted)   │ │
│  │ fallback when        │   │ labels:         │ │
│  │ BENTON_RUNNER≠true   │   │  self-hosted    │ │
│  │                      │   │  benton         │ │
│  └──────────────────────┘   │  linux-x64      │ │
│                             └─────────────────┘ │
└─────────────────────────────────────────────────┘

Kill switch: Repository variable BENTON_RUNNER
  true  → jobs route to self-hosted runner
  unset → jobs route to ubuntu-latest (default)
```

---

## 3. What Changed

### 3.1 `platform.json` — runners section

New `runners` key declares:
- Runner labels (`self-hosted`, `benton`, `linux-x64`)
- Scope (`prGates` only)
- Kill switch variable (`BENTON_RUNNER`)
- Fallback runner (`ubuntu-latest`)
- Required toolchain versions
- Network outbound allowlist

### 3.2 PR gate routing (conditional `runs-on`)

All compute jobs in the three PR gate workflows now use:

```yaml
runs-on: ${{ vars.BENTON_RUNNER == 'true'
  && fromJSON('["self-hosted", "benton", "linux-x64"]')
  || 'ubuntu-latest' }}
```

**Routed jobs (8 total):**

| Workflow | Jobs routed |
|----------|-------------|
| `seal-gate-fast.yml` | `frontend-fast`, `backend-fast`, `governance-fast` |
| `core-governance-gates.yml` | `governed-spine`, `phase85-tools`, `phase86-toolrunner`, `check-generated-js` |
| `tier1-ui-harness.yml` | `tier1-harness` |

**Not routed (trivial status checks):**
- `classify`, `seal`, `seal-legacy` — pure bash, no toolchain needed
- `changes`, `no-relevant-changes` — path detection only

### 3.3 `benton-runner-smoke.yml` — new workflow

Validates runner health:
- `RunnerLabels_Resolve` — job is picked up by runner with expected labels
- `ToolchainVersions_MatchPlatformJson` — dotnet, node, pnpm, git versions match
- `ArtifactRoundtrip` — upload + download pipeline works
- `NetworkConnectivity` — outbound HTTPS to GitHub, npm, NuGet

Triggers: `workflow_dispatch` (manual provisioning) + `push` to main (continuous verification).

---

## 4. Secrets Strategy

### Current state: Zero secrets needed

The three PR gate workflows do **not** use any secrets:
- No deployments
- No API keys
- No database connections
- No container registry pushes

The only secret-like value is `GITHUB_TOKEN`, which is automatically provided
to all runners (including self-hosted) by the Actions runtime.

### Future expansion

When moving beyond PR gates (e.g., deployment workflows), secrets will need
explicit handling:
- **Option A:** Repository secrets (available to self-hosted runners by default)
- **Option B:** Environment-scoped secrets with manual approval
- **Option C:** HashiCorp Vault or Azure Key Vault on the on-prem network

**Recommendation:** Use environment-scoped secrets (Option B) for any workflow
that deploys to on-prem infrastructure. This adds an approval gate and limits
which workflows can access deployment credentials.

---

## 5. Network Requirements

The self-hosted runner requires **outbound HTTPS (443)** to the following hosts.
No inbound ports are required.

| Host | Purpose |
|------|---------|
| `github.com` | Git operations, API calls |
| `api.github.com` | REST API (token validation, status reporting) |
| `*.actions.githubusercontent.com` | Actions runtime, job dispatch, logging |
| `registry.npmjs.org` | npm package downloads |
| `api.nuget.org` | NuGet package downloads |
| `pipelines.actions.githubusercontent.com` | Artifact upload/download |
| `results-receiver.actions.githubusercontent.com` | Check run results |

### Firewall rule template

```
ALLOW TCP OUT → github.com:443
ALLOW TCP OUT → *.github.com:443
ALLOW TCP OUT → *.githubusercontent.com:443
ALLOW TCP OUT → registry.npmjs.org:443
ALLOW TCP OUT → api.nuget.org:443
```

The `benton-runner-smoke.yml` workflow validates connectivity to the critical
endpoints automatically.

---

## 6. Runner Provisioning Checklist

### Prerequisites

- [ ] Linux host (Ubuntu 22.04+ or RHEL 8+ recommended)
- [ ] x64 architecture
- [ ] 4+ GB RAM, 2+ CPU cores
- [ ] 20+ GB free disk space
- [ ] Outbound HTTPS to hosts listed above

### Software installation

```bash
# .NET SDK 8.0.x
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0

# Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm (>=9.0.0)
npm install -g pnpm@latest

# git (>=2.30.0) — usually already present
git --version
```

### GitHub Actions runner setup

```bash
# Download runner (check for latest version)
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf actions-runner-linux-x64.tar.gz

# Configure with labels
./config.sh --url https://github.com/bsvalues/terrafusion_os_1.0 \
  --labels self-hosted,benton,linux-x64 \
  --token <RUNNER_TOKEN>

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

### Validation

```bash
# 1. Trigger smoke test manually from GitHub Actions UI
#    → Actions → "Benton Runner Smoke" → Run workflow

# 2. Enable for PR gates
#    → Settings → Variables → Actions variables
#    → New variable: BENTON_RUNNER = true

# 3. Open a test PR and verify all gates route to the runner
```

---

## 7. Rollback

Disable the runner instantly without any code changes:

1. **Repository Settings → Variables → Actions variables**
2. **Delete** (or set to any value other than `true`) the `BENTON_RUNNER` variable
3. All subsequent workflow runs fall back to `ubuntu-latest`

No PR required. No deployment. Immediate effect.

---

## 8. Scope Expansion (Deferred)

The following are explicitly out of scope for this pilot:

| Item | Why deferred |
|------|-------------|
| Deep scans (CodeQL, OWASP ZAP) | Slow, require different runner specs |
| Container builds (Docker) | Requires Docker-in-Docker or rootless Docker |
| Deployment workflows | Requires secrets strategy implementation |
| Multi-runner matrix | Prove single runner first |
| Windows/macOS runners | Linux-first, expand later |

---

## 9. Observed Gaps

_(To be updated after first runner execution)_

| Gap | Impact | Mitigation |
|-----|--------|------------|
| TBD | TBD | TBD |

---

## 10. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-10 | PR gates only | Smallest critical surface; prove before expanding |
| 2026-02-10 | Repo variable kill switch | Instant rollback without code changes |
| 2026-02-10 | Trivial jobs stay on ubuntu-latest | No value in routing status-check jobs |
| 2026-02-10 | Zero secrets baseline | PR gates don't use secrets; document future strategy |
