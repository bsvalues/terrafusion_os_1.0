# P1 — Benton Demo / Deployment Readiness

**Program:** P1  
**Status:** ACTIVE  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Turn the proven Benton County demo database into a controlled Azure-ready deployment candidate without authorizing production deployment. Every WO in this program produces a concrete evidence artifact or operational control. No WO authorizes production release.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Local dev API startup | Production deployment |
| Azure demo DB reads | PACS connection |
| Config file changes (appsettings) | Schema changes |
| Evidence doc creation | Data mutation |
| Azure App Service slot config (non-production) | County-facing launch |
| PR/merge to main | ArcGIS mutation |

---

## Work Orders (Ordered)

| WO | Title | Status | Evidence |
|----|-------|--------|---------|
| WO-DEPLOY-BENTON-002E | Evidence closure: Browser → Vite → API → Azure PG16 | **CLOSED** | PR #1109 merged, `docs/data/WO_DEPLOY_BENTON_002_CLOSURE.md` |
| WO-DEPLOY-BENTON-003A | Local demo rehearsal | **CLOSED** | commit `788197238`, `docs/data/WO_DEPLOY_BENTON_003A_LOCAL_DEMO_REHEARSAL.md` |
| WO-CONFIG-BENTON-001 | County config hardening | **IN PR** | PR #1112 auto-merge queued, commit `ec0edb405`, `docs/data/WO_CONFIG_BENTON_001_EVIDENCE.md` |
| WO-DEPLOY-BENTON-003B | Azure App Service Deployment Preflight | **NEXT** — blocked until PR #1112 merges | — |
| WO-DEPLOY-BENTON-003C | Azure App Settings / Secret Requirements Packet | QUEUED | — |
| WO-DEPLOY-BENTON-003D | App Service Startup Smoke (non-production slot) | QUEUED | — |
| WO-DEPLOY-BENTON-003E | Demo Operator Runbook | QUEUED | — |
| WO-DEPLOY-BENTON-003F | Deployment Readiness Evidence Rollup | QUEUED | — |

---

## WO-DEPLOY-BENTON-003B Definition

**Goal:** Establish what Azure App Service requires to run TerraFusion.API with the Benton demo DB — without deploying. Output: a preflight checklist of required settings, missing secrets, open gaps.

**Scope:**
- Read App Service documentation / existing Azure config
- Identify required env vars (`ConnectionStrings__DefaultConnection`, `ASPNETCORE_ENVIRONMENT`, `TF_SKIP_DEV_SEEDERS`)
- Identify secrets that must be in Key Vault or App Settings (never in appsettings.json)
- Identify any IaaS or PaaS dependencies (storage, Redis, Consul)
- Produce preflight checklist document

**Do NOT:**
- Deploy the app
- Create new Azure resources
- Change appsettings.json or runtime code
- Connect PACS

**Outputs:**
- `docs/data/WO_DEPLOY_BENTON_003B_PREFLIGHT.md` — preflight checklist
- Missing secrets inventory
- Required App Service settings list

**Blocked Until:** PR #1112 merges (config must be on main before preflight evaluates it)

---

## WO-DEPLOY-BENTON-003C Definition

**Goal:** Produce the complete App Service app-settings/secrets packet — every key needed for the demo deployment, with values or value sources.

**Outputs:**
- `docs/data/WO_DEPLOY_BENTON_003C_APP_SETTINGS.md`
- Annotated settings template (no actual secrets, only key names + sources)

---

## WO-DEPLOY-BENTON-003D Definition

**Goal:** Deploy to a non-production slot; run startup smoke and health checks; confirm Azure DB connection.

**Blocked Until:** 003B + 003C complete; explicit operator authorization.

---

## WO-DEPLOY-BENTON-003E Definition

**Goal:** Write the demo operator runbook — pre-demo checklist, startup commands, endpoint URLs, fallback language for each gap, post-demo teardown.

---

## WO-DEPLOY-BENTON-003F Definition

**Goal:** Produce the full deployment readiness evidence rollup — all P1 WO results in a single operator decision document. Operator reviews and decides whether to authorize county-facing deployment.

---

## Dependency Chain

```
002E (DONE) → 003A (DONE) → CONFIG-001 (IN PR) → 003B → 003C → 003D → 003E → 003F
```

003D requires operator authorization. 003F triggers the "authorize production?" decision.

---

## Promotion Criteria (for production authorization)

All of the following must be true:
- [ ] 003D smoke passes in non-production slot
- [ ] 003E runbook operator-approved
- [ ] 003F evidence rollup reviewed by operator
- [ ] Operator explicitly authorizes production deployment
- [ ] WO-DATA-BENTON-DUPE-001 resolved OR accepted with documented risk

---

## Known Evidence (2026-06-30)

| Fact | Source |
|------|--------|
| Parcels: 84,388 active distinct (`canonical_tf.tf_parcel`) | WO-DEPLOY-BENTON-002D proof |
| Sales: 90,386 (`canonical_tf.tf_sale`) | WO-DEPLOY-BENTON-003A |
| Azure DB: `terrafusion_benton_demo` on `pg-terrafusion-benton-demo.postgres.database.azure.com` | WO-DEPLOY-BENTON-002A |
| API port: 5000 (default); Vite proxy: 3000 → 5000 | WO-DEPLOY-BENTON-002D |
| `db-content: passed=True` | WO-CONFIG-BENTON-001 |
| `db-identity.database: terrafusion_benton_demo` | WO-CONFIG-BENTON-001 |
| Fixture trap: `/api/properties` returns seed data | WO-DEPLOY-BENTON-003A |
| Address/legal null (not loaded in demo sync) | WO-DEPLOY-BENTON-003A |
| 14 duplicate parcel groups → WO-DATA-BENTON-DUPE-001 | WO-CONFIG-BENTON-001 |

---

## Stop Conditions

Stop P1 WOs and escalate to operator if:
- Azure connectivity fails and cannot be resolved with config changes
- Demo DB content is corrupted or incomplete
- PR #1112 fails CI (investigate before next WO)
- Operator explicitly pauses the program
