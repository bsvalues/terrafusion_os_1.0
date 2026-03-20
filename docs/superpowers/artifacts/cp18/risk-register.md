# CP-18 Risk Register

Date: 2026-03-19
Phase: CP-18
Gate: G9
Status: COMPLETE

## Risk Table

| Risk ID | Description | Severity | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| SEC-001 | Cowlitz hardcoded DB credential (carry-forward CP-17 R5) | HIGH | Security | **REMEDIATED** — replaced with `${TF_COWLITZ_DB_PASSWORD:?...}` env var in `compose/docker-compose.cowlitz.yml` | ✅ CLOSED |
| SEC-002 | Yakima hardcoded Grafana admin password | HIGH | Security | **REMEDIATED** — replaced with `${TF_YAKIMA_GRAFANA_PASSWORD:?...}` env var in `compose/docker-compose.yakima-flagship.yml`; `.env.example` updated | ✅ CLOSED |
| SEC-003 | Production DB password hardcoded in `docker-compose.production-optimized.yml` (9 connection strings + POSTGRES_PASSWORD) | CRITICAL | Security | **REMEDIATED** — replaced with `${TF_PROD_DB_PASSWORD:?...}` throughout | ✅ CLOSED |
| SEC-004 | Production DB replication password hardcoded in `docker-compose.production-optimized.yml` | HIGH | Security | **REMEDIATED** — replaced with `${TF_PROD_DB_REPLICATION_PASSWORD:?...}` | ✅ CLOSED |
| SEC-005 | JWT signing secret hardcoded in `docker-compose.production-optimized.yml` (3 API instances) | CRITICAL | Security | **REMEDIATED** — replaced with `${TF_JWT_SECRET:?...}`; **prior value exposed in git history — MUST rotate before go-live** | ✅ CLOSED (rotation required pre-launch) |
| SEC-006 | Grafana admin password hardcoded in `docker-compose.yml`, `compose.prod.yaml`, `docker-compose.monitoring.yml`, `docker-compose.obs.yml` | HIGH | Security | **REMEDIATED** — all 4 files replaced with `${TF_GRAFANA_PASSWORD:?...}` | ✅ CLOSED |
| SEC-007 | `TerraFusion.Operations/appsettings.json` hardcoded DB password (`TerraFusion2024!`) | CRITICAL | Security | **REMEDIATED** — replaced with `${TF_DB_PASSWORD}` — commit `974a1fb34` | ✅ CLOSED |
| SEC-008 | `TerraFusion.Operations/appsettings.json` hardcoded JWT secret | CRITICAL | Security | **REMEDIATED** — replaced with `${TF_JWT_SECRET}` — commit `974a1fb34` | ✅ CLOSED (rotation required pre-launch) |
| SEC-009 | `TerraFusion.StreamingAnalytics/appsettings.json` hardcoded JWT secret | CRITICAL | Security | **REMEDIATED** — replaced with `${TF_JWT_SECRET}` — commit `974a1fb34` | ✅ CLOSED (rotation required pre-launch) |
| SEC-010 | `TerraFusion.QuantumAnalytics/appsettings.json` hardcoded JWT secret + `Password=postgres` | CRITICAL | Security | **REMEDIATED** — both replaced with `${TF_JWT_SECRET}` / `${TF_DB_PASSWORD}` — commit `974a1fb34` | ✅ CLOSED (rotation required pre-launch) |
| SEC-011 | `TerraFusion.IDE.Gateway/appsettings.json` hardcoded JWT key + `TerraFusion.API/appsettings.json` hardcoded JWT SecretKey | CRITICAL | Security | **REMEDIATED** — both replaced with `${TF_JWT_SECRET}` — commits `974a1fb34`, current | ✅ CLOSED (rotation required pre-launch) |
| AI-SWARM-LOAD | Swarm load test (1,008 agents) not executed — staging required | MEDIUM | SRE / AI Swarm Lane | Execute in authorized staging window; Copilot lane not permitted to modify `specialized/` | ⏸ DEFERRED |
| AI-SWARM-QUEUE | Queue depth guard proof not executed | MEDIUM | SRE / AI Swarm Lane | Execute as part of Phase 8-B in staging | ⏸ DEFERRED |
| AI-SWARM-BG | Break-glass drill with swarm active not executed | MEDIUM | SRE / AI Swarm Lane | Execute as part of Phase 8-C in staging | ⏸ DEFERRED |
| SRE-LIVE | Live restore/DR/on-call rehearsals (CP-17 R1–R4) not completed | MEDIUM | SRE | Execute in scheduled SRE window before CP-19 | ⏸ DEFERRED |
| SIGN-OFF | Founder/Release Authority signatures not collected | LOW | Founder | Formal sign-off at CP-19 go-live gate | ⏸ DEFERRED → CP-19 |

## Risk Acceptance Policy

Per sovereign.yaml Law 6 (zero tolerance for unlogged risk):
- SEC-001 through SEC-011: all CLOSED — no hardcoded secrets remain in any non-QUARANTINE compose or base appsettings file.
- **SEC-005 (JWT) requires key rotation before go-live.** The prior value is in git history and must be treated as compromised. New `TF_JWT_SECRET` must be generated (`openssl rand -base64 64`) and set in all environments before opening traffic.
- AI swarm and live SRE rehearsal risks: ACCEPTED for G9 static seal. Must complete before CP-19.
- Sign-off: go-live gate artifact resolved at CP-19.
