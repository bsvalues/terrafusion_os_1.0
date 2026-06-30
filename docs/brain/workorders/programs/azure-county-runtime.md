# P8 — Azure / DevOps / County Runtime

**Program:** P8  
**Status:** ACTIVE  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Keep GitHub, Azure, Azure DevOps, TerraFusion Azure, and county Azure from becoming competing control planes. This program establishes a single runtime deployment boundary, defines the slot strategy, captures the observability contract, and produces the rollback/restart runbook. No county-owned production boundary is established without explicit operator authorization.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Azure App Service config read/plan | Production deployment without operator auth |
| App settings inventory | New Azure resource creation without operator auth |
| Deployment slot strategy doc | Schema changes |
| Observability/log capture plan | PACS connection |
| Rollback runbook | County-facing release |
| CI/CD pipeline review | Bypassing PR gates |

---

## Key Known Facts (as of 2026-06-30)

| Fact | Source |
|------|--------|
| Azure PG16 server: `pg-terrafusion-benton-demo.postgres.database.azure.com` | WO-DEPLOY-BENTON-002A |
| DB: `terrafusion_benton_demo` | WO-DEPLOY-BENTON-002A |
| Admin user: `tfadmin` (local env only, never Git) | Security constraint |
| Connection requires SSL + Trust Server Certificate | WO-DEPLOY-BENTON-002B |
| 94 EF migrations applied, 0 pending | WO-DEPLOY-BENTON-002D |
| No Azure App Service yet provisioned | — |
| Redis: not connected (NoOp cache in dev) | WO-DEPLOY-BENTON-002D |

---

## Work Orders (Ordered)

| WO | Title | Status | Blocker |
|----|-------|--------|---------|
| WO-AZURE-001 | Azure App Service preflight, Benton demo | **NEXT** | Runs parallel to / enables P1/WO-DEPLOY-BENTON-003B |
| WO-AZURE-002 | App settings and secret inventory | QUEUED | Parallel to 003C |
| WO-AZURE-003 | Deployment slot strategy | QUEUED | After 001+002 |
| WO-AZURE-004 | Observability and log capture | QUEUED | After 003D smoke |
| WO-AZURE-005 | Rollback and restart runbook | QUEUED | After 003D smoke |
| WO-AZURE-006 | County-owned production boundary packet | QUEUED | **Requires explicit operator authorization** |

---

## WO-AZURE-001 Definition

**Goal:** Enumerate what an Azure App Service deployment of TerraFusion.API needs. Do not provision any resources. Produce a requirements checklist: runtime stack, required App Settings, identity/MSI, outbound network rules, PostgreSQL firewall rules, estimated slot config.

**Outputs:**
- `docs/data/WO_AZURE_001_APP_SERVICE_PREFLIGHT.md`
- Required App Settings list (key names only, no values)
- PostgreSQL firewall rule requirements

**Do NOT:**
- Create App Service
- Create deployment slot
- Provision any Azure resources

---

## WO-AZURE-002 Definition

**Goal:** Produce the complete app settings and secrets inventory for the Benton demo deployment. For each required key: what is it, where does the value come from, how is it stored (Key Vault reference, App Setting, connection string), and who owns the secret.

---

## WO-AZURE-003 Definition

**Goal:** Define the slot strategy: production slot (never for demo), staging slot (non-production smoke target), blue/green vs. rolling deployment decision.

---

## WO-AZURE-006 Definition

**Goal:** Produce the county-owned production boundary packet — the formal document the operator reviews before authorizing any county-facing deployment. Requires all previous Azure WOs and P1/003F complete.

**Authorization gate:** This WO exists to make the production decision explicit. The Brain does not initiate county-facing release. The operator reads 003F + AZURE-006 and explicitly authorizes.

---

## Dependency Chain (P8 internal)

```
001 → 002 → 003 → 004, 005 (parallel) → 006
```

## Dependency Chain (cross-program)

```
P8/AZURE-001 enables P1/003B (App Service preflight docs feed the deployment preflight)
P8/AZURE-002 enables P1/003C (secrets inventory feeds app settings packet)
P8/AZURE-003 enables P1/003D (slot strategy must be defined before smoke deployment)
P1/003D enables P8/AZURE-004, 005 (observability and rollback need a live slot)
P1/003F + P8/AZURE-006 → operator production decision
```

---

## Stop Conditions

- WO-AZURE-006 is a decision gate, not an execution step — stop and present to operator
- Do not provision Azure resources without explicit operator instruction
- Do not connect the Benton demo DB to county network until P2 data quality issues are resolved
