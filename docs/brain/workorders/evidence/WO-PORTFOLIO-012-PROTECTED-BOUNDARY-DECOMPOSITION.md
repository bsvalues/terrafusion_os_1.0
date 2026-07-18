# WO-PORTFOLIO-012 - Protected Boundary Decomposition Evidence

## Verdict

**TRUE_PORTFOLIO_BOUNDARY CONFIRMED AFTER CORRECTION.** WO-PORTFOLIO-011 reached the right broad
conclusion, but its runtime and promotion categories were not precise enough and its Management
Dashboard row was stale. This packet supplies the exact lane-by-lane evidence required before the
portfolio stop is accepted.

## Corrected Live Facts

- `origin/main` at audit start: `416942e43cc272e7bbc2ed6c667b2ff6ca2e4278`.
- PR #1157 merged MGMT-005 at `f93d9da6f0c5b5fda81f61bdd9fec6224a03eb55` and deployed the
  os-shell SPA to `app-terrafusion-benton-demo`.
- PR #1158 merged MGMT-006 at `d3cfc9c72315f34fabbe88b1999897f1f7f79f5a` and made only the SPA
  fallback anonymous while preserving deny-by-default API authorization.
- Sovereign PR #133 remains open, draft, and explicitly `DO NOT MERGE` at
  `2df8735acff7f115d0c5019d5423c770641aa655`.
- No active owner decision names Local OMEN, WO-LOCAL-093, TerraPilot P16, or WO-CORE-1.
- `OWNER-TF-STANDING-OPERATOR-AUTHORITY` covers delivery inside separately ratified scope; it does
  not create a new protected program objective or protected-resource authority.

## Lane-by-Lane Boundary Table

### Lane 1 - Management Dashboard

| Field | Evidence-backed value |
| --- | --- |
| LANE | P8 Management Dashboard |
| CURRENT_STATE | MGMT-001 through MGMT-004 complete; MGMT-005 deployed in PR #1157; MGMT-006 repaired the SPA auth boundary in PR #1158. The old MGMT-005 deployment wall is stale. |
| REMAINING_OUTCOME | Optional authenticated `/dais` and Workbench data verification, or a later county-facing release. No unfinished frontend deployment WO remains. |
| EXACT_MISSING_AUTHORITY | For authenticated verification: a bounded non-production credential/token-use envelope naming the token source, routes, non-mutation guarantee, log handling, and expiry. For county release: a separate production/go-live envelope. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | Standing authority cannot supply credentials or county-production authority. |
| PROTECTED_BOUNDARY | SW-03 for credentialed verification; SW-04/SW-10 for county release or auth-policy change. |
| RECOMMENDED_OWNER_DECISION | Mark the deployment baseline complete. Do not authorize county release. Consider authenticated verification only as part of a later bounded security/readiness packet. |
| FIRST_WO_AFTER_AUTHORIZATION | A new `WO-P8-MGMT-007 - Authenticated Surface Verification` packet would be required; no such WO is currently admitted. |

### Lane 2 - Benton Demo

| Field | Evidence-backed value |
| --- | --- |
| LANE | Benton Demo / Deployment Readiness |
| CURRENT_STATE | The existing demo App Service `app-terrafusion-benton-demo` is deployed and health-proven. No staging-slot proof exists. |
| REMAINING_OUTCOME | Create or select a non-production staging slot, deploy an exact artifact, run startup/health smoke, and bind evidence to its SHA without promoting county production. |
| EXACT_MISSING_AUTHORITY | One non-production Azure envelope naming `app-terrafusion-benton-demo`, the staging slot, exact artifact SHA, permitted setting names, credential owners, smoke routes, rollback target, and no-swap/no-production limits. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | The action mutates a live Azure resource and uses protected App Service/database configuration. |
| PROTECTED_BOUNDARY | SW-01 and SW-03; SW-04 remains explicitly denied. |
| RECOMMENDED_OWNER_DECISION | Defer until a releasable SHA and secret-remediation posture are explicit. If selected, authorize one non-production smoke envelope, not production launch. |
| FIRST_WO_AFTER_AUTHORIZATION | `WO-DEPLOY-BENTON-003D - App Service Startup Smoke (non-production slot)`. |

### Lane 3 - Azure / County Runtime

| Field | Evidence-backed value |
| --- | --- |
| LANE | Azure / DevOps / County Runtime |
| CURRENT_STATE | AZURE-001 through AZURE-003 are complete from committed evidence. AZURE-004/005 depend on authorized live-slot smoke; AZURE-006 is the county-production boundary packet. |
| REMAINING_OUTCOME | Capture live staging-slot observability, prove restart/rollback behavior, then define county ownership only if a county deployment is actually proposed. |
| EXACT_MISSING_AUTHORITY | The same exact non-production slot-smoke envelope required by Benton 003D. AZURE-006 additionally needs a named county, production owner, credential custody, data boundary, rollback owner, and go-live decision. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | Live log access, restart/rollback execution, credentials, and county production exceed docs/evidence authority. |
| PROTECTED_BOUNDARY | SW-01/SW-03 for AZURE-004/005; SW-04 and county authority for AZURE-006. |
| RECOMMENDED_OWNER_DECISION | Do not authorize county production. If deployment evidence becomes the priority, authorize Benton 003D first and let AZURE-004/005 consume that proof. |
| FIRST_WO_AFTER_AUTHORIZATION | `WO-DEPLOY-BENTON-003D`, then `WO-AZURE-004`. |

### Lane 4 - Benton Data Quality

| Field | Evidence-backed value |
| --- | --- |
| LANE | Benton Data Quality |
| CURRENT_STATE | Audits, rollup, credentialed verification, and the authorized 30-row duplicate cleanup are complete. The safe audit queue is exhausted. |
| REMAINING_OUTCOME | Any future address/legal backfill, entitlement change, geometry/owner/improvement remediation, sync pass, or PACS follow-up. No exact protected mutation is currently selected. |
| EXACT_MISSING_AUTHORITY | A new packet must name one target dataset/table, source system, operation, expected row set, credentials, dry-run proof, rollback, and county-data custodian. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | Prior credential and mutation grants were consumed; no current WO names a protected operation. |
| PROTECTED_BOUNDARY | SW-02, SW-03, and/or SW-08 depending on the selected remediation. |
| RECOMMENDED_OWNER_DECISION | Defer. Do not grant generic data authority; require an evidence-backed exact remediation proposal first. |
| FIRST_WO_AFTER_AUTHORIZATION | A new bounded remediation WO; no canonical successor exists and none should be invented without a selected data outcome. |

### Lane 5 - Local OMEN Runtime Repair

| Field | Evidence-backed value |
| --- | --- |
| LANE | Local OMEN Runtime Repair |
| CURRENT_STATE | Docker Desktop recovered; local `williamos-postgres-proof` on `127.0.0.1:15432` is unhealthy; the app proof container is absent; ports 3100/3101 are clear; no active authority names WO-LOCAL-093. |
| REMAINING_OUTCOME | Diagnose why the existing local proof database is unhealthy and why the app proof container is absent before any repair. |
| EXACT_MISSING_AUTHORITY | A bounded local-only diagnosis envelope allowing read-only Docker metadata, health, inspect, and log commands for the named proof containers and ports. It must deny start/restart/recreate/remove/prune, network changes, persistence, LAN exposure, services/schedules, TerraFusion Postgres, and external resources. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | The program records WO-LOCAL-093 but does not contain an active exact command/environment packet; standing authority cannot create Docker mutation authority. |
| PROTECTED_BOUNDARY | Program activation and local environment scope. Read-only diagnosis is not itself SW-09 runtime expansion; any repair or container mutation after diagnosis would require a separately bounded implementation packet. |
| RECOMMENDED_OWNER_DECISION | **Authorize the read-only WO-LOCAL-093 diagnosis envelope as the lowest-risk, highest-information next strategic grant.** Do not authorize repair yet. |
| FIRST_WO_AFTER_AUTHORIZATION | `WO-LOCAL-093 - Docker Runtime Start Timeout Diagnosis Gate`. |

### Lane 6 - Runtime Import Disposition

| Field | Evidence-backed value |
| --- | --- |
| LANE | Sovereign Runtime Import Disposition |
| CURRENT_STATE | Sovereign PR #133 is a draft `DO NOT MERGE` candidate based on older history. It imports a broad `backend/**` core host, is build-proven only, and explicitly lacks executable shell and sovereignty proof. |
| REMAINING_OUTCOME | Decide whether any current-main contract or built-fresh scaffold should cross into `bsvalues/terrafusion-os`; do not treat PR #133 as merge-ready. |
| EXACT_MISSING_AUTHORITY | A read-only WO-CORE-1 disposition envelope over the exact current sovereign base and candidate provenance. Import authority would later need an exact file allowlist, source provenance, behavioral contract, security proof, and rollback. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | Cross-repository runtime import is an explicit sovereign boundary and PR #133 is intentionally non-canonical. |
| PROTECTED_BOUNDARY | Sovereign import disposition; any actual `backend/**`, `frontend/**`, or `os-platform/**` import is protected runtime/product scope. |
| RECOMMENDED_OWNER_DECISION | Do not authorize merge or import. If revisited, authorize only a fresh current-base disposition audit; default recommendation is `no import` unless a specific contract gap is proven. |
| FIRST_WO_AFTER_AUTHORIZATION | `WO-CORE-1 - Runtime Import Disposition`. |

### Lane 7 - TerraPilot Tool Maturity

| Field | Evidence-backed value |
| --- | --- |
| LANE | TerraPilot Tool Maturity |
| CURRENT_STATE | P1-P15 complete. `summarize_levy_rate_components` is L2/contract-covered with `liveIntegration: false`, not backend-integrated, live, or promoted. |
| REMAINING_OUTCOME | First decide the design for a possible backing-service integration; only later, if separately authorized and proven, implement L3 and consider L4 promotion. |
| EXACT_MISSING_AUTHORITY | For P16: authorize a design-only packet for the named tool and require backing service, endpoint/handler boundary, auth, synthetic test data, trace, disclosure, rollback, and county-isolation plan. L3/L4 later require separate exact runtime and promotion authority. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | P15 explicitly selected hold-at-L2 unless the owner opens P16; no active decision grants that program direction. |
| PROTECTED_BOUNDARY | P16 is a strategic program-direction gate, not runtime mutation. L3 crosses SW-09/SW-10; L4 changes maturity/promotion status and operator-visible capability claims. |
| RECOMMENDED_OWNER_DECISION | Keep L2 parked for now. If TerraPilot becomes the chosen strategic lane, authorize P16 design-only for `summarize_levy_rate_components`; do not grant cohort-wide promotion. |
| FIRST_WO_AFTER_AUTHORIZATION | `WO-TERRAPILOT-P16 - Live Integration Design Packet`. |

### Lane 8 - Property Workbench

| Field | Evidence-backed value |
| --- | --- |
| LANE | Property Workbench |
| CURRENT_STATE | WO-WORKBENCH-001 through 011 closed the evidence baseline. No named successor objective exists. |
| REMAINING_OUTCOME | None inside the closed program. Any future behavior change must begin with a named product objective and bounded phase. |
| EXACT_MISSING_AUTHORITY | New program ratification naming the user outcome, exact surfaces, risk, files, tests, and non-goals. |
| WHY_STANDING_AUTHORITY_DOES_NOT_COVER IT | Standing authority cannot create a new product objective or material scope. |
| PROTECTED_BOUNDARY | New product phase and product behavior. |
| RECOMMENDED_OWNER_DECISION | Do not restart Workbench generically. Defer until a concrete product outcome is proposed and ranked. |
| FIRST_WO_AFTER_AUTHORIZATION | A newly ratified phase-specific WO; do not reuse WO-WORKBENCH-001. |

## Consolidated Strategic Recommendation

Authorize only one next envelope if strategic work is to resume now:

```text
PROGRAM: local-omen-runtime-repair
WORK_ORDER: WO-LOCAL-093 - Docker Runtime Start Timeout Diagnosis Gate
ALLOW: read-only Docker metadata, inspect, health, logs, and port/process observations for
       williamos-postgres-proof and the missing app proof container
DENY: start, restart, recreate, remove, prune, reset, network mutation, persistence, LAN exposure,
      service/schedule changes, TerraFusion Postgres, external resources, secrets, and production
NEXT: return an evidence-backed repair recommendation; do not repair without a separate bounded packet
```

This is a strategic program-activation decision, not a request for the owner to choose Docker
commands. All technical choices inside the resulting read-only packet belong to the operator.

## Final Classification

- Every ratified incomplete program is listed above.
- Completed programs and the closed Workbench baseline are not treated as executable.
- No safe, already-authorized implementation or evidence WO remains.
- Runtime diagnosis, runtime import, P16 design, and actual promotion are no longer conflated.
- `TRUE_PORTFOLIO_BOUNDARY` is valid after this correction.

## Validation

- `git diff --check`: PASS.
- Work Order query tests: PASS, 12/12.
- Wave planner tests: PASS, 29/29.
- Work Order query JSON: PASS; 33 records, no active executable lane, and no next
  recommended Work Order.
- R3 wave plan JSON: PASS; no executable set or wave and `WO-PORTFOLIO-012` is terminal.
- Core type-check: PASS.
- Phase 8.3 core tools: PASS, 56/56.
- Brain scope review: all 10 changed files are within `WO-PORTFOLIO-012` scope. The aggregate
  command remains red only because unchanged `tools/registry/terrapilot.tools.json` has the known
  21-item reserved-suite Gate 4 baseline; this Work Order neither changes nor suppresses it.
- Frozen bootstrap: `corepack pnpm install --frozen-lockfile --ignore-scripts` changed no tracked
  file; `package.json` and `pnpm-lock.yaml` hashes were unchanged.
- Runtime/backend/frontend/tools-sync/CI/deployment changes: none.
- County/PACS/SQL/secrets/live-resource access: none.
