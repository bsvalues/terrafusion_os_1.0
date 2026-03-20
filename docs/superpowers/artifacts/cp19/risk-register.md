# CP-19 Risk Register

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: COMPLETE

## Risk Table

| Risk ID | Description | Severity | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| SEC-005-ROTATE | JWT signing secret prior value exposed in git history — must rotate before opening traffic | CRITICAL | Security / SRE | Generate new `TF_JWT_SECRET` (`openssl rand -base64 64`), set in all environments, invalidate all existing sessions before go-live | ⛔ HARD BLOCKER (pre-launch) |
| SRE-O1-OPS | O1 operational tasks not yet executed: set `TF_JWT_SECRET`, `TF_DB_PASSWORD`, all `TF_*` vars in staging + prod; take DB snapshot; run pager test | HIGH | SRE | Execute in SRE window before production traffic; env var names all documented in `.env.example` | ⛔ REQUIRED (pre-launch) |
| SEC-001 | Cowlitz hardcoded DB credential (carry-forward CP-17 R5) | HIGH | Security | **CLOSED** — remediated in CP-18 sweep | ✅ CLOSED |
| SEC-007 | `TerraFusion.Operations/appsettings.json` hardcoded DB password + JWT secret | CRITICAL | Security | **CLOSED** — O1 sweep, commit `974a1fb34` | ✅ CLOSED |
| SEC-008 | `TerraFusion.StreamingAnalytics/appsettings.json` hardcoded JWT secret | CRITICAL | Security | **CLOSED** — O1 sweep, commit `974a1fb34` | ✅ CLOSED |
| SEC-009 | `TerraFusion.QuantumAnalytics/appsettings.json` hardcoded JWT secret + `Password=postgres` | CRITICAL | Security | **CLOSED** — O1 sweep, commit `974a1fb34` | ✅ CLOSED |
| SEC-010 | `TerraFusion.IDE.Gateway/appsettings.json` hardcoded JWT key | CRITICAL | Security | **CLOSED** — O1 sweep, commit `974a1fb34` | ✅ CLOSED |
| SEC-011 | `TerraFusion.API/appsettings.json` hardcoded JWT SecretKey | CRITICAL | Security | **CLOSED** — O1 sweep, commit `fa0c0cbde` | ✅ CLOSED |
| SEC-012 | `api-unified` + `TerraFusion.Operations` appsettings.Development.json — hardcoded dev DB passwords + JWT secrets | HIGH | Security | **CLOSED** — O1 sweep, commit `273d3834c` | ✅ CLOSED |
| SEC-013 | `backend/tests/appsettings.Testing.json` — hardcoded test DB password + test JWT secret | HIGH | Security | **CLOSED** — O1 sweep, commit `273d3834c` | ✅ CLOSED |
| SEC-014 | `compose.dev.yaml` + `docker-compose.dev.enhanced.yml` — hardcoded dev passwords | HIGH | Security | **CLOSED** — O1 sweep, commit `273d3834c` | ✅ CLOSED |
| SEC-015 | `TerraFusion.Consciousness/appsettings.json` — `terrafusion_consciousness_secure_2025` | CRITICAL | Security | **CLOSED** — O1 final sweep, commit `bdb82ad31` | ✅ CLOSED |
| SEC-016 | `TerraFusion.API/appsettings.Development.json` — `TF_Pacs2026!` (×2) + dev JWT | HIGH | Security | **CLOSED** — O1 final sweep, commit `bdb82ad31` | ✅ CLOSED |
| SEC-017 | `TerraFusion.API/appsettings.BentonCounty.json` — `Password=postgres` | HIGH | Security | **CLOSED** — O1 final sweep, commit `bdb82ad31` | ✅ CLOSED |
| SEC-018 | `backend/publish/appsettings.json` — JWT secret in build artifact | CRITICAL | Security | **CLOSED** — O1 final sweep, commit `bdb82ad31`; `backend/publish/` added to `.gitignore` | ✅ CLOSED |
| SWARM-8A | Swarm load test (1,008 agents) not executed in live staging | MEDIUM | SRE / AI Swarm Lane | Execute before opening production traffic; AI Swarm lane owns | ⏸ DEFERRED (pre-launch) |
| SWARM-8B | Queue depth guard proof not executed in live staging | MEDIUM | SRE / AI Swarm Lane | Execute Phase 8-B in staging before production traffic | ⏸ DEFERRED (pre-launch) |
| SWARM-8C | Break-glass drill with swarm active not executed | MEDIUM | SRE / AI Swarm Lane | Execute Phase 8-C in staging before production traffic | ⏸ DEFERRED (pre-launch) |
| SRE-RESTORE | Live pg_dump/restore rehearsal not completed | MEDIUM | SRE | Execute in SRE window before production traffic; runbook complete in `restore-proof.md` | ⏸ DEFERRED (pre-launch) |
| SRE-DR | Live DR failover rehearsal not completed | MEDIUM | SRE | Execute in SRE window; runbook complete in `dr-proof.md` | ⏸ DEFERRED (pre-launch) |
| PACS-LIVE | PACS integration not live | LOW | Platform Team | Not a launch blocker for pilot counties (Yakima/Cowlitz); deferred post-launch | ⏸ DEFERRED (post-launch) |
| CODEX-PHASE9 | TerraCanon Codex integration not built | LOW | TerraCanon Team | Reserved post-2026-03-25 per roadmap | ⏸ RESERVED |
| SIGN-OFF | Formal signatures not collected | LOW | Founder | Collected at go-live event gate | ⏸ DEFERRED → go-live event |

## Risk Acceptance Policy

Per `sovereign.yaml` Law 6 (zero tolerance for unlogged risk):
- No implicit carry-forward. Every deferred item has an owner and resolution path.
- SWARM-8A/B/C, SRE-RESTORE, SRE-DR: must complete BEFORE production traffic begins.
- **SEC-005-ROTATE + SRE-O1-OPS: hard/required pre-launch gates — JWT key rotation and env var deployment MUST complete before any traffic opens. Prior values are in git history and must be treated as compromised.**
- O1 code sweep COMPLETE (2026-03-19): SEC-001 through SEC-018 all CLOSED. Zero hardcoded credentials remain in any tracked non-QUARANTINE config file.
- PACS-LIVE, CODEX-PHASE9: post-launch accepted risks (not blockers).
