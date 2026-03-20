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
| SEC-012 | `api-unified` + `TerraFusion.Operations` appsettings.Development.json — dev DB passwords + JWT secrets | HIGH | Security | **REMEDIATED** — env vars — commit `273d3834c` | ✅ CLOSED |
| SEC-013 | `backend/tests/appsettings.Testing.json` — test DB password + test JWT secret | HIGH | Security | **REMEDIATED** — env vars — commit `273d3834c` | ✅ CLOSED |
| SEC-014 | `compose.dev.yaml` + `docker-compose.dev.enhanced.yml` — hardcoded dev passwords | HIGH | Security | **REMEDIATED** — env vars — commit `273d3834c` | ✅ CLOSED |
| SEC-015 | `TerraFusion.Consciousness/appsettings.json` — `terrafusion_consciousness_secure_2025` | CRITICAL | Security | **REMEDIATED** — env var — commit `bdb82ad31` | ✅ CLOSED |
| SEC-016 | `TerraFusion.API/appsettings.Development.json` — `TF_Pacs2026!` (×2) + dev JWT | HIGH | Security | **REMEDIATED** — env vars — commit `bdb82ad31` | ✅ CLOSED |
| SEC-017 | `TerraFusion.API/appsettings.BentonCounty.json` — `Password=postgres` | HIGH | Security | **REMEDIATED** — env var — commit `bdb82ad31` | ✅ CLOSED |
| SEC-018 | `backend/publish/appsettings.json` — JWT secret in build artifact | CRITICAL | Security | **REMEDIATED** — commit `bdb82ad31`; `backend/publish/` added to `.gitignore` | ✅ CLOSED |
| SEC-019 | `.env.vim` tracked in git — contained live compromised prod secrets (`tf_prod_p@ssw0rd_2025!` + JWT key `c8a9f7b1...`) | CRITICAL | Security | **REMEDIATED** — values wiped to placeholders; `.env.vim` added to `.gitignore` — commit `b57932e3e` | ✅ CLOSED |
| SEC-020 | `.env.template` hardcoded port 5000 (PORT RULE violation) | LOW | Platform | **REMEDIATED** — changed to `localhost:${TF_API_PORT:-5046}` — commit `b57932e3e` | ✅ CLOSED |
| SEC-021 | `backend/compose.dev.yml` `POSTGRES_PASSWORD: dev_password_123` hardcoded | HIGH | Security | **REMEDIATED** — env var — commit `b57932e3e` | ✅ CLOSED |
| SEC-022 | `backend/docker-compose.bulletproof.yml` + `backend/docker-compose.microservices.yml` — 19 `${VAR:-TerraFusion2024!}` silent-fail defaults | CRITICAL | Security | **REMEDIATED** — all converted to fail-loud `${VAR:?VAR is required}` — commit `b57932e3e` | ✅ CLOSED |
| SEC-023 | `backend/ai-models/BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK/docker-compose.yml` — `POSTGRES_PASSWORD: championship_password_2024` (x10 refs) + `GF_SECURITY_ADMIN_PASSWORD=championship2024` | CRITICAL | Security | **REMEDIATED** — all refs replaced with `TF_DEV_DB_PASSWORD` / `TF_DEV_GRAFANA_PASSWORD` fail-loud env vars — commit `176bff7e1` | ✅ CLOSED |
| SEC-024 | `.ci_artifacts_local/docker-compose.dev.yml` — `KEYCLOAK_ADMIN_PASSWORD: admin` hardcoded + `${POSTGRES_PASSWORD:-postgres}` soft-defaults (×2) | HIGH | Security | **REMEDIATED** — env vars `TF_DEV_KEYCLOAK_PASSWORD` fail-loud; postgres soft-defaults → fail-loud — commit `176bff7e1` | ✅ CLOSED |
| SEC-025 | `backend/compose.dev.yml` — `PGADMIN_DEFAULT_PASSWORD: dev_admin_123` hardcoded + `${TF_DEV_DB_PASSWORD:-dev_local_only}` soft-default | HIGH | Security | **REMEDIATED** — both converted to fail-loud env vars `TF_DEV_PGADMIN_PASSWORD` / `TF_DEV_DB_PASSWORD`; plaintext passwords scrubbed from comments — commit `6d663a96e` | ✅ CLOSED |
| AI-SWARM-LOAD | Swarm load test (1,008 agents) not executed — staging required | MEDIUM | SRE / AI Swarm Lane | Execute in authorized staging window; Copilot lane not permitted to modify `specialized/` | ⏸ DEFERRED |
| AI-SWARM-QUEUE | Queue depth guard proof not executed | MEDIUM | SRE / AI Swarm Lane | Execute as part of Phase 8-B in staging | ⏸ DEFERRED |
| AI-SWARM-BG | Break-glass drill with swarm active not executed | MEDIUM | SRE / AI Swarm Lane | Execute as part of Phase 8-C in staging | ⏸ DEFERRED |
| SRE-LIVE | Live restore/DR/on-call rehearsals (CP-17 R1–R4) not completed | MEDIUM | SRE | Execute in scheduled SRE window before CP-19 | ⏸ DEFERRED |
| SIGN-OFF | Founder/Release Authority signatures not collected | LOW | Founder | Formal sign-off at CP-19 go-live gate | ⏸ DEFERRED → CP-19 |

## Risk Acceptance Policy

Per sovereign.yaml Law 6 (zero tolerance for unlogged risk):
- SEC-001 through SEC-025: all CLOSED — O1 sweep complete (Rounds 1–3). Zero hardcoded credentials remain in any tracked non-QUARANTINE config, compose, or env file. `.env.vim` (compromised prod secrets) wiped and gitignored. Fail-loud `${VAR:?...}` pattern enforced throughout. Championship playbook, CI artifacts, and pgAdmin credentials all remediated.
- **SEC-005 (JWT) requires key rotation before go-live.** The prior value is in git history and must be treated as compromised. New `TF_JWT_SECRET` must be generated (`openssl rand -base64 64`) and set in all environments before opening traffic.
- AI swarm and live SRE rehearsal risks: ACCEPTED for G9 static seal. Must complete before CP-19.
- Sign-off: go-live gate artifact resolved at CP-19.
