# June 10 Post-Drain Ship-Blocker Queue

Date: 2026-05-14
Mode: launch-control queue for the moment TerraFusion Sync reaches terminal state
Scope: execution order, blocker classification, and stop rules only

## Purpose

This queue prevents post-drain drift. When the active TerraFusion Sync lane finishes, the next move is not feature work, UI polish, or county expansion. The next move is to prove whether TerraFusion DB can support the June 10 Benton runtime pilot.

## Runtime Doctrine

TerraFusion DB is product runtime truth.

Product runtime path:

```text
TerraFusion DB -> TerraFusion API -> TerraFusion applications
```

Upstream acquisition path:

```text
Legacy/public systems -> TerraFusion Sync -> TerraFusion DB
```

Forbidden product runtime path:

```text
TerraFusion applications -> direct upstream/source-system dependency
```

## Terminal-State Trigger

Start this queue only after the active Sync process is terminal:

- `Completed`
- `Failed`
- `Interrupted`

Do not run this queue while the Sync drain is still writing.

Read-only process check:

```powershell
Get-Process -Id 56564 -ErrorAction SilentlyContinue |
  Select-Object Id,ProcessName,StartTime,Responding,CPU
```

## Execution Order

### 1. Capture Final Sync Evidence

Required before backend restart or readiness claims:

```powershell
node scripts/truth/generate-corpus-evidence.mjs
```

If the approved generator path differs, record the exact command used in the evidence packet.

Expected result:

- verification artifact if all clauses pass;
- ATTEMPT artifact if any clause fails.

Stop if:

- no final evidence artifact is produced;
- artifact status is ambiguous;
- artifact is stale relative to the terminal drain.

Classification: `SHIP_BLOCKER`.

### 2. Restart Runtime Cleanly

Use only the launch command documented in the health-probe runbook:

```powershell
pnpm run dev:backend:api
```

Do not use a seeder-enabled command unless a separate controlled reseed slice is explicitly authorized.

Stop if:

- startup mutates DB unexpectedly;
- backend cannot bind to the expected port;
- backend logs show source-system runtime coupling;
- backend starts from an unexpected build output.

Classification: `SHIP_BLOCKER`.

### 3. Prove Health Surface

Run:

```powershell
$base = "http://localhost:5046"
$paths = @("/health", "/health/ready", "/health/live", "/healthz", "/healthz/ready", "/api/test")
foreach ($path in $paths) {
  try {
    $response = Invoke-WebRequest -Uri "$base$path" -UseBasicParsing -TimeoutSec 10
    [pscustomobject]@{ Path = $path; Status = $response.StatusCode; Length = $response.Content.Length }
  } catch {
    [pscustomobject]@{ Path = $path; Status = "ERROR"; Error = $_.Exception.Message }
  }
}
```

Stop if:

- `/health` fails;
- `/healthz/ready` fails;
- expected runtime port is wrong and undocumented.

Classification: `SHIP_BLOCKER`.

### 4. Prove TerraFusion DB Identity

Run:

```powershell
pnpm run truth:runtime-db-identity
```

Pass condition:

- API reports the intended TerraFusion DB identity;
- environment and connection metadata are redacted but specific enough to audit;
- generated artifact is current.

Stop if:

- DB identity is unknown;
- DB identity does not match June 10 expectation;
- artifact reports stale or provisional identity.

Classification: `SHIP_BLOCKER`.

### 5. Prove TerraFusion DB Content Shape

Run:

```powershell
pnpm run truth:runtime-db-content
pnpm run truth:benton-parcel-count-sanity
```

Pass condition:

- product tables are readable through TerraFusion API proof;
- Benton parcel count is sane by active/current/distinct rules;
- raw high row counts are not treated as active parcel truth unless sanity proof agrees.

Stop if:

- Benton parcel count remains implausible;
- endpoint counts raw/historical/duplicate records as active parcels;
- county identity is wrong or ambiguous.

Classification: `SHIP_BLOCKER`.

### 6. Prove Product Load Lineage

Run:

```powershell
pnpm run truth:terrafusion-db-product-load-ledger
pnpm run truth:runtime-source-lineage
```

Pass condition:

- TerraFusion DB rows have product-load lineage evidence;
- source lineage is represented as provenance, not product runtime dependency;
- no proof depends on direct upstream/source-system access.

Stop if:

- rows exist but no load receipt or lineage can be shown;
- product runtime reads upstream/source data directly;
- lineage proof confuses Sync/admin with application runtime.

Classification: `SHIP_BLOCKER`.

### 7. Prove Benton Sales And Qualification Lane

Run:

```powershell
pnpm run truth:runtime-sale-qualification
```

Pass condition:

- Benton sales/qualified-sales lineage is green or explicitly scoped red;
- canonical qualified pool status is clear;
- C37/live comp eligibility proof is not inferred from unrelated rows.

Stop if:

- canonical sales qualification is empty and the pilot claims depend on it;
- sales qualification proof depends on source credentials;
- generated artifact marks a blocker but readiness ignores it.

Classification: `SHIP_BLOCKER`.

### 8. Prove Benton Runtime Pilot Closure

Run:

```powershell
pnpm run truth:benton-runtime-pilot-closure
```

Pass condition:

- Benton runtime pilot can be evaluated end to end from TerraFusion DB-backed runtime truth;
- known red gates are surfaced as blockers, not hidden as warnings.

Stop if:

- pilot closure passes while any required truth artifact is red;
- pilot closure omits DB identity, content, parcel sanity, or sales qualification.

Classification: `SHIP_BLOCKER`.

### 9. Produce June 10 Readiness Packet

Run:

```powershell
pnpm run truth:june10-readiness-packet
pnpm run readiness:june10
```

Pass condition:

- readiness says Benton runtime pilot only;
- 38 counties are represented as provenance inventory, not full runtime workflow;
- no 39-county runtime readiness claim appears;
- every blocker has a current artifact.

Stop if:

- readiness output overclaims;
- generated packet is stale;
- 38 counties are promoted without runtime evidence;
- any failed proof is treated as launch-ready.

Classification: `GOVERNANCE_CRITICAL`.

### 10. Start Browser UAT

Only after the readiness packet is current:

```text
http://localhost:5173/forge/county-studio
```

Use:

```text
os-platform/core/pilot/ops/june10-benton-uat-screenshot-checklist-2026-05-13.md
```

Stop if:

- runtime proof is missing;
- UI screenshots contradict the readiness packet;
- UAT shows direct source-system labels on active product surfaces;
- the operator workflow dead-ends on a primary Benton pilot path.

Classification: `UAT_CRITICAL` or `SHIP_BLOCKER`, depending on workflow impact.

## Ship-Blocker Register

| Blocker ID | Gate | What blocks launch | Required proof to clear |
|---|---|---|---|
| `J10-BLOCK-001` | Sync final evidence | Terminal drain lacks verification or ATTEMPT artifact | Final evidence artifact with clear status |
| `J10-BLOCK-002` | Runtime startup | Backend cannot restart cleanly without seeders | Health probes pass after clean launch |
| `J10-BLOCK-003` | DB identity | API DB identity is unknown or wrong | `truth:runtime-db-identity` green |
| `J10-BLOCK-004` | DB content | Product table shape/counts are stale or implausible | `truth:runtime-db-content` green |
| `J10-BLOCK-005` | Parcel sanity | Benton count is raw/historical/duplicate or wrong-county | `truth:benton-parcel-count-sanity` green |
| `J10-BLOCK-006` | Load lineage | Rows exist without product-load receipt/provenance | `truth:terrafusion-db-product-load-ledger` green or explicit blocker |
| `J10-BLOCK-007` | Sales qualification | Qualified-sales/C37 proof is empty or unsupported | `truth:runtime-sale-qualification` green or launch claim reduced |
| `J10-BLOCK-008` | Runtime boundary | Product endpoint reads upstream/source system directly | `truth:runtime-data-boundary-audit` green |
| `J10-BLOCK-009` | Pilot closure | Benton pilot closure ignores red truth gates | `truth:benton-runtime-pilot-closure` green |
| `J10-BLOCK-010` | Readiness claim | Readiness claims 39-county runtime workflow | `readiness:june10` blocks overclaim |
| `J10-BLOCK-011` | UAT evidence | Browser UAT lacks screenshot/evidence packet | Accepted UAT screenshot packet |

## Cut-Line Rules

Cut before June 10 unless explicitly promoted by proof:

- county expansion beyond Benton runtime pilot;
- CostForge official/certified claims without calibration proof;
- feature work that does not unblock one of the blocker IDs above;
- UI polish that hides red runtime truth;
- source-system runtime reads from product surfaces;
- generalized 39-county workflow claims.

## Current Waiting State

As of this queue, the only allowed active work before terminal Sync state is:

- docs/proof prep under `os-platform/core/pilot/**`;
- route-contract test planning;
- launch-command hygiene;
- UAT evidence planning;
- read-only process observation.

Everything else waits for final DB proof.
