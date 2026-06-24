# F15 — Configuration / Env / Secrets Surface Audit

*Loop 2 deliverable.* Status: **complete**. Confidence: **high**.
Goal: map runtime-control truth; find fracture and dangerous assumptions.

> **Redaction note (chain-of-custody):** secret *values* are NOT reproduced here — only
> `file:line` + type. Raw values remain in the repo's git history and must be rotated.

## 🔴 Critical findings

| # | Finding | Location | Type | Cross-ref |
|---|---|---|---|---|
| 1 | Hardcoded JWT secret in committed base config | `backend/src/TerraFusion.API/appsettings.json:16` | JWT signing key (dev value) | baseline SC-12 "hardcoded JWT prefix" |
| 2 | Plaintext DB password in committed config | `config/database.dev.json:3` | DB password (literal) | baseline SC-12 "secrets in config" |
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

## Verdict & required follow-up (NOT actioned under recovery lock)
Runtime config truth is **fractured** with **real exposed secrets**. These are recorded as
**high-priority security leads**: rotate the exposed JWT key + DB password (git history),
externalize them to `${TF_*}`, fix dev-compose port substitution, and resolve the
`config/`↔`configs/` and `appsettings`↔`api-unified` duplications. Flag for owner decision.
