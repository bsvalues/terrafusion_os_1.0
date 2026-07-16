# WO-AZURE-003 - Benton Demo Deployment Slot Strategy

**Program:** P8 - Azure / DevOps / County Runtime

**Base:** `5f7ffb764daf20c341ab415e47fd3228b66ab5cd`

**Mode:** R1 committed-evidence strategy only

**Status:** COMPLETE WITH LIVE EXECUTION BLOCKED

**Boundary:** No Azure query, slot inspection or mutation, secret access, resource change,
deployment, swap, restart, database connection, PACS access, or county-production action was
performed.

## Decision

Use a **blue/green App Service slot model** for future Benton demo promotion. A separately authorized
non-production staging slot is the candidate environment; the existing default App Service slot
remains the active Benton demo environment. Rolling or in-place mutation of the active demo is not
the selected promotion model because it does not preserve an independently validated candidate or a
clean swap-back target.

This is a strategy decision, not proof that a staging slot exists. Committed evidence records the
existing demo App Service directly, with no staging-slot proof. Nothing here authorizes creating a
slot, deploying to it, changing configuration, swapping traffic, or calling the demo county
production.

## Evidence Basis

| Evidence | What it proves | What it does not prove |
|---|---|---|
| `WO_AZURE_001_APP_SERVICE_PREFLIGHT.md` | Existing App Service is a Benton demo; no staging-slot proof exists; future slot needs sticky settings, health proof, database compatibility, and rollback planning | Slot existence, current slot configuration, or swap readiness |
| `WO_AZURE_002_APP_SETTINGS_SECRET_INVENTORY.md` | Configuration key names, storage gaps, and accountable roles are inventoried without values | Effective slot settings, Key Vault use, managed identity, rotation, or secret safety |
| `WO_DEPLOY_BENTON_003C_APP_SERVICE_DEPLOYMENT.md` | The default demo app was deployed and `/health` returned 200 against the demo database | A second slot, blue/green promotion, swap-back, or county-production readiness |
| `WO_P8_MGMT_005_AZURE_FRONTEND_REACHABILITY_DEPLOYMENT.md` | The same-origin UI is present on the current demo App Service; the configured health path remains shallow | Candidate-slot parity, deep readiness, authenticated workflow readiness, or rollback proof |

## Slot Roles

| Role | Purpose | Current truth | Traffic rule |
|---|---|---|---|
| Existing default slot | Active Benton demonstration surface only | EVIDENCED | Preserve until a separately authorized candidate passes all gates |
| Future staging slot | Isolated candidate deployment and non-production smoke target | NOT PROVEN TO EXIST | No production or county traffic; no swap during `WO-DEPLOY-BENTON-003D` |
| Previous release target | Warm rollback target after an authorized swap | NOT PROVEN | Retain only when exact artifact/config evidence supports swap-back |
| County production | County-owned operational boundary | NOT ESTABLISHED | Requires WO-AZURE-006 and explicit protected-boundary authority |

The Azure platform label `production` for the default slot must not be interpreted as TerraFusion
county-production authorization. The current default slot is a demonstration environment.

## Configuration Classes

These are target classifications. They do not claim the live resource currently marks any setting as
slot-sticky.

| Class | Examples | Strategy |
|---|---|---|
| Environment-bound / slot-sticky | Database connection, signing material, county identity, runtime-truth expectations, CORS origin, external dependency endpoints | Review and bind per slot; never copy or swap values blindly |
| Release-bound / swappable | Exact release SHA and candidate artifact identity | Travel with the candidate so health and evidence identify the promoted revision |
| Shared runtime posture | Listener/runtime settings and same-origin artifact location | Keep consistent only after explicit parity review |
| Protected remediation | Key Vault references, managed identity, least-privilege database identity, secret rotation | Separate authorized security/runtime work; not solved by slot strategy |

Any live classification, value comparison, or sticky-setting change requires a separately authorized
Azure operation. Secret values must never enter the evidence packet.

## Candidate Flow

1. Bind the candidate to one exact source SHA and immutable deployment artifact.
2. Create or select a non-production staging slot only under explicit live-Azure authority.
3. Configure the candidate using approved value sources without copying values into evidence.
4. Prove startup, `/health`, release SHA, database compatibility, same-origin UI, authentication, and
   required logs in the staging slot.
5. Record the candidate evidence without swapping traffic. This is the maximum scope of
   `WO-DEPLOY-BENTON-003D` unless a later packet explicitly grants swap authority.
6. If a later demo promotion is authorized, revalidate exact head, configuration classes, health,
   logs, and rollback target immediately before swap.
7. Swap only within the Benton demo boundary. County production remains a different authority plane.

## Promotion Gate

A future swap is `HOLD` unless every item is proven at the exact candidate revision:

- staging slot exists and is identified without ambiguity;
- candidate artifact and `TF_GIT_SHA` match the approved source revision;
- environment-bound settings are reviewed without exposing values;
- database connectivity and migration compatibility are proven without mutation;
- `/health` succeeds and any deeper readiness/authentication limitations are explicitly classified;
- same-origin UI and required authenticated flows are exercised;
- startup, application, security, and failure logs are captured;
- a warm, identified rollback target exists;
- swap and swap-back authority is recorded for the demo boundary;
- no county-production claim or protected-resource expansion is introduced.

Failure of any gate means **no swap**. A healthy shallow endpoint alone is insufficient promotion
evidence.

## Rollback Strategy

| Failure point | Default response | Evidence required |
|---|---|---|
| Candidate fails before swap | Leave active demo unchanged; repair or discard candidate under separate authority | Failure logs, exact candidate SHA, no-swap record |
| Validation becomes stale before swap | Re-run the complete candidate gate | New timestamps and exact-head evidence |
| Authorized swap fails | Swap back only if the prior target remains warm and configuration-compatible | Swap event, health/log evidence, prior target identity |
| Swap-back is unsafe or unavailable | HOLD and use a separately authorized artifact redeploy/recovery packet | Recovery authority and immutable artifact evidence |

No rollback or swap-back has been executed or proven by this work order. WO-AZURE-005 remains blocked
until authorized live-slot evidence exists.

## Authority And Routing

- `WO-AZURE-003` completes the safe committed-evidence Azure lane.
- `WO-DEPLOY-BENTON-003D` remains a live deployment/smoke authority wall.
- `WO-AZURE-004` and `WO-AZURE-005` remain dependency-blocked until authorized live-slot evidence
  exists.
- `WO-AZURE-006` remains the county-production boundary decision packet.
- Portfolio reconciliation should select another dependency-cleared lane after this packet merges;
  it must not represent a blocked Azure node as executable.

`STOP_TYPE: AZURE_DEPLOYMENT_SLOT_STRATEGY_COMPLETE`
