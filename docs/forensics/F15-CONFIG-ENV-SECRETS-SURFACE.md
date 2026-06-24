# F15 — Configuration / Env / Secrets Surface Audit

*Loop 2 deliverable.* Status: **complete**. Confidence: **high**.
Goal: map runtime-control truth; find fracture and dangerous assumptions.

> **Redaction note (chain-of-custody):** secret *values* are NOT reproduced here — only
> `file:line` + type.
>
> **RESOLUTION UPDATE (2026-06-24, per owner):** the exposed JWT key and DB password have
> been **rotated**. The committed values are now **stale/invalid**, so live operational
> exposure is **MITIGATED**. Residual items are *config hygiene* (below), not an active
> secret leak — downgraded from CRITICAL to MEDIUM.

### F15 has two truths (do not let one erase the other)
- **Historical exposure truth:** a committed JWT signing key + plaintext DB password
  **did exist** in the repo (and remain in git history). This forensic fact stands.
- **Current operational truth:** those credentials are **rotated** → no live exposure.
- **Still open (topology, not credentials):** rotation changes posture, not config topology.
  F15 is **not closed** until config is singular and runtime contracts validated (Hard Rule 3).

## 🟡 Findings (was 🔴; secrets rotated — residual = hygiene)

| # | Finding | Location | Type | Status |
|---|---|---|---|---|
| 1 | Hardcoded JWT secret in committed base config | `backend/src/TerraFusion.API/appsettings.json:16` | JWT signing key (dev value) | **rotated → stale value still committed**; externalize to `${JWT_SECRET}` to prevent recurrence/audit confusion |
| 2 | Plaintext DB password in committed config | `config/database.dev.json:3` | DB password (literal) | **rotated → stale value still committed**; externalize to `${TF_DEV_DB_PASSWORD}` |
| 3 | Port contract broken in dev compose | `docker-compose.dev.enhanced.yml` (API `5000`, FE `3000` hardcoded) vs `platform.json` (`TF_API_PORT=5046`, `TF_FRONTEND_PORT=3102`) | port mismatch | — |
| 4 | Duplicate appsettings trees | `backend/src/TerraFusion.API/appsettings.*` **and** `backend/api-unified/appsettings.*` | config SSOT loss | — |

## Config surface map (condensed)

| File | Controls | Assessment |
|---|---|---|
| `platform.json` | ports/SDK/CI (SSOT) | ✅ clean, schema-enforced |
| `.ports.config` | shell view of platform.json | ⚠️ derived/duplicate |
| `sovereign.yaml` | AI governance laws | ✅ constitution, not runtime |
| `config/` (~90 JSON) | brand/AI/roles/RAG — **not** secrets/ports | ⚠️ name collides with `configs/`; misleading |
| `configs/` | (separate root) | ⚠️ confusion pair with `config/` |
| `.env.example` + `.env.template` | templates | 🟡 duplicate masters |
| `appsettings.json` | base | 🔴 hardcoded JWT (L16) |
| `appsettings.Development.json` | dev overrides | ⚠️ localhost hardcoded |
| `appsettings.Production.json` | externalized `${TF_*}` | ✅ clean |
| `config/database.dev.json` | dev DB conn | 🔴 plaintext password (L3) |

## Port truth table (declared vs actual)

| Service | platform.json | compose.yml | compose.dev.enhanced.yml | Mismatch |
|---|---|---|---|---|
| API/Kernel | 5046 | `${TF_API_PORT:-5046}` | **5000 hardcoded** | 🔴 |
| Frontend | 3102 | `${TF_FRONTEND_PORT:-3102}` | **3000 hardcoded** | 🔴 |
| Postgres | 5432 | 5432 | 5432 | ✅ |
| Redis | 6379 | 6379 | 6379 | ✅ |

> Note: canon (`CLAUDE.md`) says API :5000; `platform.json` says :5046. The port-config
> system is partly **theater** in dev (env vars ignored by `dev-compose.enhanced`).

## Hardcoded runtime-assumption register
JWT key (appsettings.json:16); DB password (config/database.dev.json:3); dev-compose
hardcoded API/FE ports; localhost connection string (appsettings.Development.json); CORS
pinned to localhost:3102/3103.

## Environment-model fragmentation
Backend has Dev / Dev-Enhanced / Production / Staging / BentonCounty / HarrisPACS appsettings
with **no documented override hierarchy**; JWT source and DB host differ per file. Docker
`compose.yml` honors env vars; `dev.enhanced` ignores them.

## Verdict & follow-up
Runtime config truth is **fractured**. The **secret exposure is now mitigated** (keys
rotated 2026-06-24). Remaining items are config hygiene, recorded for a later loop (NOT
actioned under recovery lock):
- Externalize the now-stale hardcoded JWT key + DB password to `${TF_*}` so the pattern
  doesn't recur and stale-but-real-looking values don't mislead future audits.
- Fix dev-compose port substitution (env vars ignored → real ports diverge from `platform.json`).
- Resolve `config/`↔`configs/` and `appsettings`↔`api-unified` duplication.
