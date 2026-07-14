# WO-AZURE-001 — Azure App Service Current-State Preflight

**Program:** `azure-county-runtime`

**Goal:** `/goal azure-county-runtime`

**Loop:** `/loop evidence`

**Base:** `48b7bc2a97b6222aa5f9901ef3dde6ae1d5067bb`

**Risk:** R1 documentation and evidence reconciliation

**Status:** Active

## Objective

Fulfill the existing WO-AZURE-001 definition in
`docs/brain/workorders/programs/azure-county-runtime.md` without provisioning or modifying Azure.
Reconcile the prospective App Service checklist to the already-merged Benton preflight and deployment
evidence, record settings by key name only, and route remaining identity, slot, observability, and
rollback gaps honestly.

## Allowed Actions

- Read committed source, configuration, and evidence.
- Document runtime, app-setting key names, identity requirements, outbound network and PostgreSQL
  firewall requirements, and slot posture.
- Distinguish prospective requirements from already-evidenced demo state.
- Record unresolved gaps and route them to the existing AZURE-002 through AZURE-006 chain.

## Forbidden Actions

- Azure CLI, portal, API, resource, configuration, slot, DNS, or deployment mutation.
- Live resource inspection requiring credentials or protected access.
- Secret values, connection-string values, tokens, certificates, or credentials.
- Database connection, query, migration, schema change, PACS access, or county-data access.
- Runtime, backend, frontend, package, lockfile, CI, or workflow behavior changes.
- County-production or public-launch claims.

## Reserved Files

- `docs/brain/workorders/active/WO-AZURE-001-app-service-preflight.md`
- `docs/data/WO_AZURE_001_APP_SERVICE_PREFLIGHT.md`

No contract, migration, database, environment, deployment target, or live Azure resource is reserved.

## Required Evidence

- Exact base SHA.
- Source-cited planned-versus-evidenced matrix.
- Key names only; no secret values.
- Explicit no-live-query and no-mutation statement.
- Existing follow-on dependency routing.
- `git diff --check`.
- Markdown formatting check.
- Root required gates.
- Brain `review-diff`, `proof`, and `commit-plan` where supported by the active packet.

## Completion

The evidence packet exists, all references resolve, the diff remains inside the two reserved files,
and required validation passes. Completion does not authorize AZURE-002 or any live Azure operation.

`STOP_TYPE: AZURE_APP_SERVICE_PREFLIGHT_RECONCILED`

<!-- brain-machine-policy: brain review-diff reads the json block below -->

```json
{
  "id": "WO-AZURE-001",
  "task": "Reconcile Azure App Service preflight requirements to committed Benton deployment evidence",
  "risk": "R1",
  "suite": "OS",
  "allowed_files": [
    "docs/brain/workorders/active/WO-AZURE-001-app-service-preflight.md",
    "docs/data/WO_AZURE_001_APP_SERVICE_PREFLIGHT.md"
  ],
  "forbidden_patterns": [
    ".github/workflows/**",
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "package.json",
    "pnpm-lock.yaml"
  ],
  "required_proof": [
    "corepack pnpm exec prettier --check docs/brain/workorders/active/WO-AZURE-001-app-service-preflight.md docs/data/WO_AZURE_001_APP_SERVICE_PREFLIGHT.md",
    "git diff --check",
    "corepack pnpm run type-check",
    "node --test os-platform/core/tests/phase83-tools.test.mjs"
  ]
}
```
