# Slice L — OS Shell Identity Spine Panel Contract

**Version**: 1.0  
**Written**: 2026-06-09  
**Branch**: fix/projector-delete-insert-atomicity  
**Status**: CONTRACT — implementation may begin after this is committed

---

## Summary

Port the Identity Spine panel from the local Sync Workbench cockpit
(`tools/sync/workbench/panel/app.js`) to a canonical OS shell route at
`workbench/sync/identity-spine`.

The Identity Spine panel answers:

> **Do all canonical tables point at the live parcel spine?**

It renders the 11-table output of `identity-drift-detector.sql`, making the
F1 class of failure visually impossible to miss. Dangling rows — canonical
rows whose `TfParcelId` resolves to dead or stale identity generations rather
than the live spine — are the alarm signal.

This panel lets the operator inspect **why** Doctor Step #1 (Identity Drift
Detector) passed or failed. It does not re-run the full doctor. It runs the
identity drift detector in isolation.

Read-only. No drains. No schema mutation. No repair button.

---

## Doctrine Callout (Learned Law #2)

This must be rendered at the bottom of the panel in all result states:

> **Never blind-join `canonical_tf.tf_parcel` (3.2M rows including legacy
> generations). Resolve ONLY through `sync_bridge.source_xref` WHERE
> `TfEntityType='parcel' AND IsActive`.**
>
> We do not sub-classify "dangling" into `tf_parcel` debris vs nonexistent —
> that would require joining the 3.1M debris row set. "Not live" is sufficient
> for the alarm.

---

## Route

```
/workbench/sync/identity-spine
```

Registered in `frontend/apps/os-shell/src/Router.tsx` as a lazy-loaded route,
same pattern as `workbench/sync/doctor` and `workbench/sync/source-pack`.

---

## Backend endpoint

### Strategy: child-process spawn (v0.3 bridge)

The .NET API spawns `tools/sync/identity-runner.mjs` via `IProcessRunner`
(already registered as a singleton from Slice J). The existing
`IProcessRunner / SystemProcessRunner` is reused — no new process
infrastructure.

**Rationale**: The identity drift SQL is proven and operates on live data
directly. The child-process bridge is the correct path for v0.3. Label it
`bridge implementation` in code comments.

### Route

```
POST /api/sync/workbench/identity-spine/run
```

**Controller**: `WorkbenchIdentitySpineController`  
**Auth**: `[AllowAnonymous]` (single-county deployment, same as all other
workbench controllers)  
**409 guard**: concurrent run returns `{ "error": "Identity runner already running — please wait." }`

### Request body

Empty body accepted. No parameters. Always runs the full 11-table detector
against the configured database.

### Response schema

```json
{
  "exitCode": 0,
  "stdout": "<raw pipe-delimited output from identity-drift-detector.sql>",
  "stderr": "",
  "durationMs": 45200,
  "timestamp": "2026-06-09T18:00:00.000Z",
  "runningNow": false
}
```

| Field | Type | Description |
|---|---|---|
| `exitCode` | int | 0 = completed · 2 = error (psql not found or query error) |
| `stdout` | string | Raw output: statement 1 rows + statement 2 overall line |
| `stderr` | string | Stderr (normally empty; psql error messages appear here) |
| `durationMs` | int | Wall-clock milliseconds (identity query: ~30–90s on Benton) |
| `timestamp` | string | ISO-8601 UTC start time |
| `runningNow` | bool | Always false in response body; true in status endpoint |

Note: `exitCode=0` does NOT mean PASS. PASS/WARN/FAIL is determined by
parsing stdout. Exit code 2 means the tool itself could not run (psql not
found or DB unreachable).

On 409:
```json
{ "error": "Identity runner already running — please wait." }
```

On 500:
```json
{ "error": "Failed to start identity runner process: <message>", "exitCode": 2 }
```

### Status endpoint

```
GET /api/sync/workbench/identity-spine/status
```

Returns:
```json
{ "running": false }
```

### Process invocation

```csharp
// v0.3 bridge implementation — spawns existing Node.js identity runner tool.
// IProcessRunner is a singleton registered by Slice J — do NOT re-register.
await _runner.RunAsync(
    fileName: "node",
    arguments: ["tools/sync/identity-runner.mjs"],
    workingDirectory: repoRoot,       // repo root resolved at startup
    environmentVars: pgEnvVars,       // PG_HOST, PG_PORT, PG_DB, PG_USER, PGPASSWORD
    cancellationToken: ct);
```

PostgreSQL env vars forwarded from `IConfiguration["Postgres:*"]`, same
as `DoctorRunnerService.BuildPgEnvVars()`. Default fallback:
`127.0.0.1:5432 terrafusion postgres devpassword123`.

---

## New backend files

### `TerraFusion.Core/Sync/Workbench/IIdentityRunnerService.cs`

```csharp
public sealed class IdentityRunResult
{
    public int ExitCode       { get; init; }
    public string Stdout      { get; init; } = string.Empty;
    public string Stderr      { get; init; } = string.Empty;
    public int DurationMs     { get; init; }
    public DateTime Timestamp { get; init; }
    public bool RunningNow    { get; init; }
}

public interface IIdentityRunnerService
{
    bool IsRunning { get; }
    Task<IdentityRunResult> RunAsync(CancellationToken ct = default);
}
```

Placed in `TerraFusion.Core/Sync/Workbench/` alongside
`IDoctorRunnerService.cs` and `IPackValidatorRunnerService.cs`.

### `TerraFusion.API/Services/Workbench/IdentityRunnerService.cs`

Mirror of `PackValidatorRunnerService.cs`:
- Singleton with `Interlocked.CompareExchange(ref _running, 1, 0)` 409 guard
- Production constructor: `(IProcessRunner, IConfiguration, IWebHostEnvironment)`
- Public test constructor: `(IProcessRunner, IConfiguration, string repoRoot)`
- Spawns `tools/sync/identity-runner.mjs` (not the pack validator)
- Forwards same PG env vars via `BuildPgEnvVars()`
- `repoRoot` resolved three levels up from `env.ContentRootPath`

### `TerraFusion.API/Controllers/WorkbenchIdentitySpineController.cs`

```csharp
[ApiController]
[Route("api/sync/workbench/identity-spine")]
[AllowAnonymous]
public sealed class WorkbenchIdentitySpineController : ControllerBase
{
    [HttpPost("run")]    // 200 with IdentityRunResult body · 409 on concurrent run
    [HttpGet("status")] // { running: bool }
}
```

### DI registration in `Program.cs`

```csharp
// After existing Slice K registration:
builder.Services.AddSingleton<IIdentityRunnerService, IdentityRunnerService>();
// IProcessRunner is already registered as a singleton by Slice J — do NOT re-register.
```

---

## Output format

`identity-runner.mjs` runs `identity-drift-detector.sql` via `psql ... -t -A`.
The SQL file has two statements; psql outputs them sequentially with no
separator between them.

### Statement 1 — per-table rows (11 rows, one per canonical parcel-bearing table)

```
lane_table|total|live|dangling|null_ref|verdict
```

| Column | Type | Description |
|---|---|---|
| `lane_table` | string | Fully-qualified table name e.g. `canonical_tf.tf_land` |
| `total` | int | All rows in table |
| `live` | int | Rows resolving to live spine |
| `dangling` | int | Non-null `TfParcelId` NOT on live spine ← **the alarm** |
| `null_ref` | int | NULL `TfParcelId` rows (informational, not alarmed) |
| `verdict` | string | `PASS` or `FAIL` — SQL-computed from `dangling = 0` |

Rows are ordered by `(dangling > 0) DESC, lane_table` — rows with dangling
appear first.

Live Benton example:
```
canonical_tf.tf_parcel_owner_link|2111805|714553|1397252|0|FAIL
canonical_tf.tf_assessment|83326|83326|0|0|PASS
canonical_tf.tf_assessment_bill_current|0|0|0|0|PASS
canonical_tf.tf_assessment_bill_line|0|0|0|0|PASS
canonical_tf.tf_exemption|5643|5643|0|0|PASS
canonical_tf.tf_improvement|99694|99694|0|0|PASS
canonical_tf.tf_land|87767|87767|0|0|PASS
canonical_tf.tf_parcel_tax_area|83326|83326|0|0|PASS
canonical_tf.tf_tax_bill_current|79767|79767|0|0|PASS
canonical_tf.tf_tax_bill_line|990665|990665|0|0|PASS
gis_tf.tf_parcel_geom|80075|79105|0|970|PASS
```

### Statement 2 — overall verdict (single text value, no pipes)

```
OVERALL: PASS — no identity drift
```

or

```
OVERALL: FAIL — identity drift detected
```

**Critical**: The SQL OVERALL is computed from raw `dangling` counts without
knowledge of `KNOWN_DRIFT_DEFERRED`. When the only dangling table is the
deferred `tf_parcel_owner_link`, the SQL emits `OVERALL: FAIL` even though
the effective panel verdict is **WARN**. The frontend parser must compute
its own `overall` from per-row effective verdicts — the SQL OVERALL line is
stored as `sqlOverall` (for debug/raw output) but is NOT used as the panel
verdict.

---

## Output parsing — `parseIdentityDriftOutput.ts`

Located at:
```
frontend/apps/os-shell/src/pages/workbench/identity-spine/parseIdentityDriftOutput.ts
```

### Types

```typescript
export type RowVerdict = 'PASS' | 'WARN' | 'FAIL';
export type PanelVerdict = 'PASS' | 'WARN' | 'FAIL' | null;

export interface IdentityTableRow {
  table: string;         // e.g. 'canonical_tf.tf_land'
  total: number;
  live: number;
  dangling: number;
  nullRef: number;
  sqlVerdict: 'PASS' | 'FAIL';     // SQL-computed
  effectiveVerdict: RowVerdict;     // client-computed (applies deferred override)
  isDeferred: boolean;              // true iff in KNOWN_DRIFT_DEFERRED set
}

export interface IdentityGroup {
  key: string;              // 'f1-family' | 'core' | 'revenue' | 'owner'
  label: string;
  desc: string;
  rows: IdentityTableRow[];
  verdict: RowVerdict;      // worst-of effective verdicts in group
}

export interface ParsedIdentityOutput {
  overall: PanelVerdict;    // client-computed from effective verdicts (NOT sqlOverall)
  sqlOverall: string | null;    // raw text of statement 2 ('OVERALL: PASS ...' or FAIL)
  rows: IdentityTableRow[];     // all 11 rows, SQL output order preserved
  groups: IdentityGroup[];      // 4 groups in canonical order
  failCount: number;            // non-deferred FAIL row count
  warnCount: number;            // deferred-WARN row count
  passCount: number;            // PASS row count
}
```

### Constants

```typescript
// Mirrors KNOWN_DRIFT_DEFERRED in tools/sync/workbench/panel/app.js.
// Update if a new table is granted deferred status.
export const KNOWN_DRIFT_DEFERRED = new Set([
  'canonical_tf.tf_parcel_owner_link',
]);

// Canonical display groups — must match ID_GROUPS in app.js.
export const IDENTITY_GROUPS: Array<{
  key: string; label: string; desc: string; tables: string[];
}> = [
  {
    key: 'f1-family',
    label: 'F1 Family',
    desc: 'Land · Improvement · Geometry — should be clean after F1 drift fix',
    tables: [
      'canonical_tf.tf_land',
      'canonical_tf.tf_improvement',
      'gis_tf.tf_parcel_geom',
    ],
  },
  {
    key: 'core',
    label: 'Valuation · Jurisdiction · Exemption',
    desc: 'Assessment + tax area must equal live spine; exemption partial coverage expected',
    tables: [
      'canonical_tf.tf_assessment',
      'canonical_tf.tf_parcel_tax_area',
      'canonical_tf.tf_exemption',
    ],
  },
  {
    key: 'revenue',
    label: 'Revenue',
    desc: 'Levy + special-assessment bill lines and rollup tables',
    tables: [
      'canonical_tf.tf_tax_bill_line',
      'canonical_tf.tf_tax_bill_current',
      'canonical_tf.tf_assessment_bill_line',
      'canonical_tf.tf_assessment_bill_current',
    ],
  },
  {
    key: 'owner',
    label: 'Owner Link',
    desc: 'Known deferred drift — not a sealed canonical lane',
    tables: ['canonical_tf.tf_parcel_owner_link'],
  },
];
```

### Logic

```typescript
export function parseIdentityDriftOutput(stdout: string): ParsedIdentityOutput
```

1. **Empty / blank stdout** → return `overall: null`, empty rows/groups, zero counts.
2. Split on `\n`. For each trimmed non-empty line:
   - If line starts with `OVERALL:` → store as `sqlOverall`. Do NOT use as `overall`.
   - Otherwise → split by `|`. If < 6 parts, skip (psql noise).
     Parse into `IdentityTableRow`:
     ```
     table    = parts[0].trim()
     total    = parseInt(parts[1]) || 0
     live     = parseInt(parts[2]) || 0
     dangling = parseInt(parts[3]) || 0
     nullRef  = parseInt(parts[4]) || 0
     sqlVerdict = parts[5].trim() as 'PASS' | 'FAIL'
     isDeferred = KNOWN_DRIFT_DEFERRED.has(table)
     effectiveVerdict = computeEffective(dangling, isDeferred)
     ```
3. Compute effective verdict per row:
   ```typescript
   function computeEffective(dangling: number, isDeferred: boolean): RowVerdict {
     if (dangling === 0)    return 'PASS';
     if (isDeferred)        return 'WARN';
     return 'FAIL';
   }
   ```
4. Assign rows to groups in canonical order (`IDENTITY_GROUPS`). Tables not
   in any group go into an "other" group at the end (forward-compatibility).
5. Per group, compute `verdict` = worst-of effective verdicts within the group:
   `FAIL > WARN > PASS`. A group with no rows has verdict `PASS`.
6. Compute panel `overall` = worst-of all row `effectiveVerdict` values.
   If no rows → `overall = null`.
7. Count: `failCount` = rows where effectiveVerdict='FAIL';
          `warnCount` = rows where effectiveVerdict='WARN';
          `passCount` = rows where effectiveVerdict='PASS'.

### Worst-of

```typescript
const VERDICT_RANK: Record<string, number> = { FAIL: 2, WARN: 1, PASS: 0 };
```

`overall` and group `verdict` are the max-rank across their respective rows.

---

## PASS / WARN / FAIL semantics

| Verdict | Meaning | What operator should do |
|---|---|---|
| **PASS** | All 11 tables have 0 dangling rows — spine clean | No action. Doctor Step #1 gate is explained. |
| **WARN** | Only deferred table(s) have dangling rows (e.g. `tf_parcel_owner_link`) | Document the deferred drift; it is expected. No drain blocked. |
| **FAIL** | One or more non-deferred canonical tables have dangling rows | **Do NOT drain.** Identity drift must be resolved before draining. |

**FAIL is a hard gate:** red blocking banner with `⛔ Identity drift detected`.
No dismiss button. No "proceed anyway" affordance.

**Known deferred exception**:
`canonical_tf.tf_parcel_owner_link` is the one currently-deferred drift table.
It is NOT a sealed canonical lane. If it has `dangling > 0`, the row and its
group card show `WARN` (amber) — not `FAIL`. This mirrors `KNOWN_DRIFT_DEFERRED`
in `tools/sync/workbench/panel/app.js` and `tf-sync-doctor.mjs`.

**Live Benton state** (verified 2026-06-09):
- `tf_parcel_owner_link`: 1,397,252 dangling → WARN (deferred, expected)
- All 10 other tables: 0 dangling → PASS
- Panel overall: **WARN** (not FAIL — deferred only)

---

## UI states

### 1. Idle (never run)

```
[ Run Identity Spine ]
"Check that all canonical parcel-bearing tables resolve to the live parcel spine."
```

Single run button. No group cards. Doctrine callout visible.

### 2. Running

```
[ Running… ]
"Identity spine detector is running — this takes 30–90 seconds."
```

Run button disabled. No stale results shown.

### 3. FAIL result (non-deferred drift detected)

```
╔═══════════════════════════════════════════════════════════════╗
║  ✗ FAIL — identity drift detected                             ║
║  ⛔ One or more sealed-lane tables have dangling rows.        ║
║     Do NOT drain until drift is resolved.                     ║
╚═══════════════════════════════════════════════════════════════╝

Group cards: [ ✗ F1 Family | expand ] [ ✓ Valuation... ] [ ✓ Revenue ] [ ⚠ Owner Link ]
```

Red banner. No dismiss. No "proceed anyway". Each failing group card expands
to show per-table rows with dangling count highlighted red.

### 4. WARN result (deferred drift only — Benton steady state)

```
⚠ WARN — known deferred drift present (owner link)
Last run: 2026-06-09 18:00 UTC · 47.3s

Group cards: [ ✓ F1 Family ] [ ✓ Valuation... ] [ ✓ Revenue ] [ ⚠ Owner Link | expand ]
```

Yellow banner. Owner Link card shows WARN badge. All other groups show PASS.

### 5. PASS result

```
✓ PASS — all 11 tables resolve to live spine
Last run: 2026-06-09 18:00 UTC · 47.3s

Group cards: [ ✓ F1 Family ] [ ✓ Valuation... ] [ ✓ Revenue ] [ ✓ Owner Link ]
```

Green banner. All group cards collapsible.

### Common elements (all result states)

- **Re-run button** — re-fires `POST /api/sync/workbench/identity-spine/run`
- **Last-run timestamp** — shown in banner subtitle
- **Duration** — shown alongside the timestamp
- **Doctrine callout** — always visible at bottom: "Never blind-join tf_parcel…"
- **Raw output toggle** — collapsible `<pre>` with full stdout (developer use)

---

## Group cards — display detail when expanded

### F1 Family (3 tables)

```
F1 Family
  ✓  canonical_tf  ·  tf_land           87,767 total  87,767 live  0 dangling   0 null
  ✓  canonical_tf  ·  tf_improvement    99,694 total  99,694 live  0 dangling   0 null
  ✓  gis_tf        ·  tf_parcel_geom    80,075 total  79,105 live  0 dangling  970 null
```

F1 family should always be PASS after the F1 drift fix. Any FAIL here is a
regression and must be treated as a hard FAIL gate.

Note on `gis_tf.tf_parcel_geom` null_ref: 970 rows have `NULL TfParcelId` —
this is documented geometry residual, not an error. Do not fail on `null_ref`.

### Valuation · Jurisdiction · Exemption (3 tables)

```
  ✓  canonical_tf  ·  tf_assessment         83,326 total  83,326 live  0 dangling
  ✓  canonical_tf  ·  tf_parcel_tax_area    83,326 total  83,326 live  0 dangling
  ✓  canonical_tf  ·  tf_exemption           5,643 total   5,643 live  0 dangling
```

### Revenue (4 tables)

```
  ✓  canonical_tf  ·  tf_tax_bill_line         990,665 total  990,665 live  0 dangling
  ✓  canonical_tf  ·  tf_tax_bill_current       79,767 total   79,767 live  0 dangling
  ✓  canonical_tf  ·  tf_assessment_bill_line        0 total        0 live  0 dangling
  ✓  canonical_tf  ·  tf_assessment_bill_current      0 total        0 live  0 dangling
```

Note: `tf_assessment_bill_line` and `tf_assessment_bill_current` have 0 rows —
the assessment-bill lane is not yet populated (connected to Slice K WARN).
Zero rows means zero dangling → PASS on the identity check.

### Owner Link (1 table — known deferred)

```
⚠  canonical_tf  ·  tf_parcel_owner_link  2,111,805 total  714,553 live  1,397,252 dangling  0 null
  (known deferred drift — not a sealed canonical lane)
```

Each row within an expanded card shows:
`sym · schema-label · short-table-name · total · live · dangling · null-ref`

Dangling count is highlighted amber (WARN) or red (FAIL), grayed if zero.
`null_ref` is always shown gray — never alarmed.

---

## data-testid attributes

| Element | testid |
|---|---|
| Page root | `identity-spine-page` |
| Run/re-run button | `run-button` |
| Idle hint text | `idle-hint` |
| Running state div | `running-state` |
| Result state div | `result-state` |
| Overall banner | `overall-banner` |
| Overall verdict text | `overall-verdict` |
| Fail gate notice | `fail-gate-notice` |
| Group cards container | `group-cards` |
| Group card (key) | `group-card-{key}` where key ∈ {f1-family, core, revenue, owner} |
| Group card expand toggle | `group-card-{key}-toggle` |
| Group card table rows | `group-card-{key}-details` |
| Doctrine callout | `doctrine-callout` |
| Raw output toggle | `raw-output-toggle` |
| Raw output pre | `raw-output` |
| Run error message | `run-error` |
| Conflict notice | `conflict-notice` |

---

## Files to create

```
backend/src/TerraFusion.Core/Sync/Workbench/
  IIdentityRunnerService.cs          (interface + IdentityRunResult DTO)

backend/src/TerraFusion.API/Services/Workbench/
  IdentityRunnerService.cs           (child-process spawn, mirrors PackValidatorRunnerService)

backend/src/TerraFusion.API/Controllers/
  WorkbenchIdentitySpineController.cs

backend/TerraFusion.API.Tests/Workbench/
  IdentityRunnerServiceTests.cs

frontend/apps/os-shell/src/api/
  syncIdentitySpine.ts               (API client + DTOs + IdentityConflictError)

frontend/apps/os-shell/src/pages/workbench/identity-spine/
  parseIdentityDriftOutput.ts        (port of parseIdentityDrift() from app.js)
  useIdentitySpineRun.ts             (TanStack Query v5 mutation hook)
  IdentitySpinePage.tsx              (panel component — 5 states)
  __tests__/
    parseIdentityDriftOutput.test.ts
    IdentitySpinePage.test.tsx
```

**Modified**:
- `backend/src/TerraFusion.API/Program.cs` — add `AddSingleton<IIdentityRunnerService, IdentityRunnerService>()`
- `frontend/apps/os-shell/src/Router.tsx` — add lazy import + route `workbench/sync/identity-spine`

**Not modified**:
- `tools/sync/identity-runner.mjs` — unchanged, proof already exists
- `tools/sync/identity-drift-detector.sql` — unchanged
- `tools/sync/workbench/server.mjs` — cockpit stays intact
- `IDoctorRunnerService.cs`, `IPackValidatorRunnerService.cs` — do NOT re-register `IProcessRunner`

---

## Tests

### Backend — `TerraFusion.API.Tests/Workbench/IdentityRunnerServiceTests.cs`

Follow the `FakeProcessRunner` / `ServiceFactory` pattern from
`PackValidatorRunnerServiceTests.cs`. All 6 tests as file-scoped helpers.

1. `IdentityRunnerService_Returns409_WhenAlreadyRunning`
2. `IdentityRunnerService_ReturnsExitCode0_ForPassOutput`
3. `IdentityRunnerService_ReturnsExitCode0_ForWarnOutput` (owner link drift only)
4. `IdentityRunnerService_PropagatesException_WhenPsqlNotFound`
5. `WorkbenchIdentitySpineController_Returns200_WithRunResult`
6. `WorkbenchIdentitySpineController_Returns409_WhenConcurrentRun`

Test stdout fixtures (pipe-delimited, 6 columns):

```csharp
// PASS fixture — all dangling = 0
const string PassStdout =
    "canonical_tf.tf_land|87767|87767|0|0|PASS\n" +
    "canonical_tf.tf_improvement|99694|99694|0|0|PASS\n" +
    "canonical_tf.tf_parcel_owner_link|2111805|714553|0|0|PASS\n" +
    "OVERALL: PASS — no identity drift";

// WARN fixture — only owner link has drift (deferred)
const string WarnStdout =
    "canonical_tf.tf_parcel_owner_link|2111805|714553|1397252|0|FAIL\n" +
    "canonical_tf.tf_land|87767|87767|0|0|PASS\n" +
    "OVERALL: FAIL — identity drift detected";

// FAIL fixture — non-deferred table has drift
const string FailStdout =
    "canonical_tf.tf_land|87767|50000|37767|0|FAIL\n" +
    "OVERALL: FAIL — identity drift detected";
```

### Frontend — `parseIdentityDriftOutput.test.ts`

12 tests minimum:

1. Empty string → no rows, no groups, `overall = null`
2. PASS stdout — all dangling=0 → `overall='PASS'`, all groups PASS
3. WARN stdout — only owner link dangling > 0 → `overall='WARN'`
4. FAIL stdout — non-deferred dangling > 0 → `overall='FAIL'`
5. Row parsing: all 6 columns parsed correctly (table, total, live, dangling, nullRef, sqlVerdict)
6. KNOWN_DRIFT_DEFERRED: owner link dangling > 0 → `effectiveVerdict='WARN'`, `isDeferred=true`
7. Non-deferred dangling > 0 → `effectiveVerdict='FAIL'`
8. dangling = 0 always → `effectiveVerdict='PASS'` regardless of sqlVerdict
9. Group assignment: 11 known tables assigned to correct groups; unknown table goes to "other"
10. Group verdict: worst-of effective verdicts within group (FAIL > WARN > PASS)
11. `sqlOverall` stored raw; NOT used as `overall`
12. null_ref > 0 with dangling = 0 → row is still PASS

### Frontend — `IdentitySpinePage.test.tsx`

8 tests minimum. Use `vi.mock('@/api/syncIdentitySpine', ...)` + `vi.mocked()` pattern:

1. Idle state: run button present, idle hint shown, no group cards
2. Running state shown while mutation pending; run button disabled
3. PASS banner rendered on all-PASS output; no `fail-gate-notice`
4. WARN banner rendered on owner-link-drift output; no `fail-gate-notice`; owner group card shows WARN
5. FAIL banner rendered on non-deferred drift; `fail-gate-notice` visible
6. FAIL hard gate — no dismiss, no "proceed anyway" button (`buttons.filter(b => text.includes('dismiss') || ...`)
7. Re-run button fires mutation again on result state
8. Raw output toggle shows stdout content

All tests use Vitest: `vi.mock()`, `vi.fn()`, `vi.mocked()`, `vi.clearAllMocks()`. NOT Jest.

---

## Non-goals

```
Drain execution                — no drain button anywhere on this panel
Commit approval                — not this slice
Quarantine actions             — separate panel (Slice I)
Owner-link repair              — deferred; known drift; no fix button
F2 cleanup (tf_parcel)         — separate workstream; do NOT open F2 from this panel
Per-row detail on which ParcelNumbers are dangling  — future (too expensive for UI table)
Historical drift comparison    — future
Multi-county selector          — future
Retire local cockpit           — cockpit stays as dev harness; not deleted
```

---

## Acceptance criteria

- [ ] `GET /workbench/sync/identity-spine` loads in OS shell chrome (Taskbar + TopBar mounted)
- [ ] Run button fires `POST /api/sync/workbench/identity-spine/run`
- [ ] Benton steady state: WARN banner (owner link only), F1/core/revenue groups show PASS
- [ ] Owner Link group card shows WARN badge and notes "known deferred drift"
- [ ] FAIL result shows red blocking banner with `⛔` notice; no "proceed anyway" affordance
- [ ] WARN result shows yellow banner; owner link card expands to show 1,397,252 dangling row
- [ ] PASS result shows green banner
- [ ] Each group card expands to show per-table rows with: sym · schema · table · total · live · dangling · null
- [ ] Dangling count 0 is grayed; > 0 is highlighted (amber for deferred, red for non-deferred)
- [ ] `null_ref` is always shown gray — never triggers FAIL or WARN
- [ ] Doctrine callout visible at bottom in all result states
- [ ] Re-run button present and functional
- [ ] 409 shown as inline error, not a crash
- [ ] Raw output toggle shows full stdout
- [ ] Backend tests: 6 green
- [ ] Frontend tests: ≥10 green (parser + component combined)
- [ ] Local cockpit (`http://127.0.0.1:7700`) still works — no cockpit files modified
- [ ] `IProcessRunner` is NOT re-registered (Slice J already registers it as singleton)

---

## Expected Benton state

Based on live run verified 2026-06-09:

| Group | Tables | Dangling | Verdict |
|---|---|---|---|
| F1 Family | tf_land, tf_improvement, gis_tf.tf_parcel_geom | 0 each | ✅ PASS |
| Valuation/Jurisdiction/Exemption | tf_assessment, tf_parcel_tax_area, tf_exemption | 0 each | ✅ PASS |
| Revenue | tf_tax_bill_line, tf_tax_bill_current, tf_assessment_bill_line, tf_assessment_bill_current | 0 each | ✅ PASS |
| Owner Link (deferred) | tf_parcel_owner_link | 1,397,252 | ⚠ WARN |
| **Panel overall** | | | **⚠ WARN** |

The SQL OVERALL line will say `OVERALL: FAIL — identity drift detected` because
the SQL does not know about the deferred override. The frontend parser ignores
the SQL OVERALL and computes WARN from effective verdicts.

---

_This contract governs implementation. Do not add repair buttons, drain
triggers, or canonical mutations to this panel. The identity spine detector
is read-only. Do not open F2. Do not open owner-link repair._
