# Slice K — OS Shell Source Pack Fit Panel Contract

**Version**: 1.0  
**Written**: 2026-06-09  
**Branch**: fix/projector-delete-insert-atomicity  
**Status**: CONTRACT — implementation may begin after this is committed

---

## Summary

Port the Source Pack Fit panel from the local Sync Workbench cockpit
(`/api/pack-validator/run` at `http://127.0.0.1:7700`) to a canonical OS shell
route at `workbench/sync/source-pack`.

The pack validator checks whether `legacy_pacs_raw` conforms to the Harris PACS
source pack specification. It runs a single SQL query (`harris-pacs-pack-validator.sql`)
via psql and returns pipe-delimited rows across four sections: table_presence,
column_structure, dictionary, and data_content — totalling 66 checks on Benton.

This panel lets the operator inspect **why** Doctor Step #0 passed (or why it did
not). It does not re-run the doctor. It runs the pack validator in isolation.

---

## Route

```
/workbench/sync/source-pack
```

Registered in `frontend/apps/os-shell/src/Router.tsx` as a lazy-loaded route,
same pattern as `workbench/sync/doctor`.

---

## Backend endpoint

### Strategy: child-process spawn (v0.3 bridge)

The .NET API spawns `tools/sync/pack-validator-runner.mjs` via `IProcessRunner`
(already registered as a singleton from Slice J). The existing `IProcessRunner /
SystemProcessRunner` is reused — no new process infrastructure.

**Rationale**: The pack validator SQL is 500 lines of proven PostgreSQL. A C#
port would duplicate logic. The child-process bridge is the correct path for
v0.3. Label it `bridge implementation` in code comments.

### Route

```
POST /api/sync/workbench/source-pack/run
```

**Controller**: `WorkbenchSourcePackController`  
**Auth**: `[AllowAnonymous]` (single-county deployment, same as all other
workbench controllers)  
**409 guard**: concurrent run returns `{ "error": "Pack validator already running — please wait." }`

### Request body

Empty body accepted. No parameters. Always runs full 66-check sequence against
the configured database.

### Response schema

```json
{
  "exitCode": 0,
  "stdout": "<raw pipe-delimited output from harris-pacs-pack-validator.sql>",
  "stderr": "",
  "durationMs": 3400,
  "timestamp": "2026-06-09T18:00:00.000Z",
  "runningNow": false
}
```

| Field | Type | Description |
|---|---|---|
| `exitCode` | int | 0 = completed · 2 = error (psql not found or query error) |
| `stdout` | string | Raw pipe-delimited SQL output (statements 1 + 2) |
| `stderr` | string | Stderr (normally empty; psql error messages appear here) |
| `durationMs` | int | Wall-clock milliseconds |
| `timestamp` | string | ISO-8601 UTC start time |
| `runningNow` | bool | Always false in response body; true in status endpoint |

Note: `exitCode=0` does NOT mean PASS. PASS/WARN/FAIL is determined by parsing
stdout. Exit code 2 means the tool itself could not run (psql not found, DB
unreachable, or query error).

On 409:
```json
{ "error": "Pack validator already running — please wait." }
```

On 500:
```json
{ "error": "Failed to start pack validator process: <message>", "exitCode": 2 }
```

### Status endpoint

```
GET /api/sync/workbench/source-pack/status
```

Returns:
```json
{ "running": false }
```

### Process invocation

```csharp
// v0.3 bridge implementation — spawns existing Node.js pack validator tool.
// IProcessRunner and SystemProcessRunner are singletons registered by Slice J.
await _runner.RunAsync(
    fileName: "node",
    arguments: ["tools/sync/pack-validator-runner.mjs"],
    workingDirectory: repoRoot,       // repo root resolved at startup
    environmentVars: pgEnvVars,       // PG_HOST, PG_PORT, PG_DB, PG_USER, PGPASSWORD
    cancellationToken: ct);
```

PostgreSQL env vars are forwarded from `IConfiguration["Postgres:*"]` — same
logic as `DoctorRunnerService.BuildPgEnvVars()`. Default fallback is
`127.0.0.1:5432 terrafusion postgres devpassword123` (same as cockpit).

---

## New backend files

### `TerraFusion.Core/Sync/Workbench/IPackValidatorRunnerService.cs`

```csharp
public sealed class PackValidatorRunResult
{
    public int ExitCode       { get; init; }
    public string Stdout      { get; init; } = string.Empty;
    public string Stderr      { get; init; } = string.Empty;
    public int DurationMs     { get; init; }
    public DateTime Timestamp { get; init; }
    public bool RunningNow    { get; init; }
}

public interface IPackValidatorRunnerService
{
    bool IsRunning { get; }
    Task<PackValidatorRunResult> RunAsync(CancellationToken ct = default);
}
```

Placed in `TerraFusion.Core/Sync/Workbench/` alongside
`IDoctorRunnerService.cs`. `IProcessRunner` lives in that same file and is
shared — do not duplicate it.

### `TerraFusion.API/Services/Workbench/PackValidatorRunnerService.cs`

Mirror of `DoctorRunnerService.cs`:
- Singleton with `Interlocked.CompareExchange(ref _running, 1, 0)` 409 guard
- Production constructor: `(IProcessRunner, IConfiguration, IWebHostEnvironment)` 
- Public test constructor: `(IProcessRunner, IConfiguration, string repoRoot)`
- Spawns `tools/sync/pack-validator-runner.mjs` (not `tf-sync-doctor.mjs`)
- Forwards same PG env vars via `BuildPgEnvVars()`
- `repoRoot` resolved the same way as `DoctorRunnerService`

### `TerraFusion.API/Controllers/WorkbenchSourcePackController.cs`

```csharp
[ApiController]
[Route("api/sync/workbench/source-pack")]
[AllowAnonymous]
public sealed class WorkbenchSourcePackController : ControllerBase
{
    [HttpPost("run")]    // 200 with PackValidatorRunResult body · 409 on concurrent run
    [HttpGet("status")] // { running: bool }
}
```

### DI registration in `Program.cs`

```csharp
// After existing Slice J registrations:
builder.Services.AddSingleton<IPackValidatorRunnerService, PackValidatorRunnerService>();
// IProcessRunner is already registered as a singleton by Slice J — do NOT re-register.
```

---

## Output format

The pack-validator-runner spawns `harris-pacs-pack-validator.sql` with
`psql ... -t -A` (unaligned tuples, field separator `|`).

**Statement 1 — per-check detail** (one row per check):
```
category|check_name|measured|expected|verdict|severity|notes
```

Where `verdict` ∈ `{PASS, WARN, FAIL, INFO}`, `severity` ∈ `{CRITICAL, WARN, INFO}`.

Rows are sorted: FAIL first, then WARN, PASS, INFO (within each: CRITICAL before WARN).

Examples:
```
table_presence|tbl_property|present|present|PASS|CRITICAL|parcel identity anchor; all lanes join here
column_structure|col_sale__SlCountyRatioCd|present|present|WARN|WARN|county ratio code: 100=qualified...
dictionary|dict_canonical__tf_tax_area|present|present|PASS|WARN|levy tax-area code dictionary...
data_content|levy_bills_L_active_count|1104507|>0|PASS|WARN|active levy bills...
```

**Statement 2 — summary** (one row, 5 pipe-separated columns):
```
OVERALL: PASS|fail=0|warn=3|pass=62|info=1
```

The overall verdict is `PASS` if `fail=0` AND `warn=0`, `WARN` if `fail=0` AND
`warn>0`, `FAIL` if `fail>0`. INFO rows do not affect verdict.

---

## Output parsing — `parsePackValidatorOutput.ts`

Located at:
```
frontend/apps/os-shell/src/pages/workbench/source-pack/parsePackValidatorOutput.ts
```

### Types

```typescript
export type CheckVerdict = 'PASS' | 'WARN' | 'FAIL' | 'INFO';

export interface PackCheck {
  category: string;    // table_presence | column_structure | dictionary | data_content
  checkName: string;
  measured: string;
  expected: string;
  verdict: CheckVerdict;
  severity: string;    // CRITICAL | WARN | INFO
  notes: string;
}

export interface PackSection {
  category: string;
  checks: PackCheck[];
  verdict: 'PASS' | 'WARN' | 'FAIL';  // worst-of across section checks
  failCount: number;
  warnCount: number;
  passCount: number;
  infoCount: number;
}

export interface ParsedPackOutput {
  overall: 'PASS' | 'WARN' | 'FAIL' | null;
  failCount: number;
  warnCount: number;
  passCount: number;
  infoCount: number;
  sections: PackSection[];   // ordered: table_presence, column_structure, dictionary, data_content
  checks: PackCheck[];       // flat list, all checks, preserved SQL order
}
```

### Logic

```typescript
export function parsePackValidatorOutput(stdout: string): ParsedPackOutput
```

1. **Empty / blank stdout** → return null overall, empty sections, zero counts.
2. Split on `\n`. For each trimmed non-empty line:
   - If line starts with `OVERALL:` → parse summary: extract `PASS/WARN/FAIL` from
     position after `OVERALL: `, extract `fail=N`, `warn=N`, `pass=N`, `info=N`
     from remaining pipe-separated parts.
   - Otherwise → split by `|`, expect ≥7 parts → `PackCheck`.
     Skip lines with < 7 parts (psql noise, blank separator lines).
3. Group checks by `category` into sections in canonical order:
   `['table_presence', 'column_structure', 'dictionary', 'data_content']`.
   Unknown categories go to an "other" section.
4. Per section, compute `verdict` = worst-of FAIL>WARN>PASS (INFO ignored in
   verdict but counted). A section with any FAIL check → FAIL. Any WARN → WARN.
   All PASS/INFO → PASS.
5. If summary line was parsed, use those counts. If summary line was absent (e.g.
   psql error before statement 2 ran), derive counts from per-check rows.

### Worst-of for section verdict

```typescript
const rank: Record<string, number> = { FAIL: 2, WARN: 1, PASS: 0, INFO: -1 };
// worst-of: max rank across checks, ignoring INFO
```

A section with only INFO checks has verdict `PASS` (not FAIL or WARN).

---

## PASS / WARN / FAIL semantics

| Verdict | Meaning | What operator should do |
|---|---|---|
| **PASS** | All 66 checks pass — landing layer conforms to Harris PACS spec | No action required. Doctor Step #0 gate is explained. |
| **WARN** | Some checks need county override documentation (e.g. optional columns) | Investigate WARN checks. Safe to continue unless a WARN is unexpectedly present. |
| **FAIL** | One or more CRITICAL checks failed — a required table or column is missing | Do NOT run drains. The landing layer does not conform to spec. Investigate the FAIL checks before proceeding. |

**FAIL is a hard gate:** red blocking banner, no dismiss button, no "proceed
anyway" affordance. Same gate behaviour as the Doctor Panel (Slice J).

Note: `INFO` checks inform but never affect PASS/WARN/FAIL. They are rendered
in section detail but do not count toward the verdict.

---

## UI states

### 1. Idle (never run)

```
[ Run Pack Validator ]
"Check that the Harris PACS landing layer conforms to the source pack spec."
```

Single run button. No section cards.

### 2. Running

```
[ Running… ]
Spinner + "Pack validator is running — this takes 5–30 seconds."
```

Run button disabled. No stale results shown during run.

### 3. FAIL result

```
╔══════════════════════════════════════════════════════╗
║  ✗ FAIL — landing layer does not conform to pack spec ║
║  N check(s) failed. Do NOT drain.                     ║
╚══════════════════════════════════════════════════════╝

Section cards: [ ✗ Table Presence ] [ ✓ Column Structure ] ...
```

Red banner. No dismiss. No proceed. The operator must resolve FAIL checks first.

### 4. WARN result

```
⚠ WARN — N check(s) need county override documentation
Last run: 2026-06-09 18:00 UTC · 3.4s

Section cards: [ ✓ Table Presence ] [ ⚠ Column Structure | expand ] ...
```

Yellow banner. WARN sections expand to show which checks need attention.

### 5. PASS result

```
✓ PASS — 66/66 checks pass · landing layer conforms to Harris PACS spec
Last run: 2026-06-09 18:00 UTC · 3.4s

Section cards: [ ✓ Table Presence (15) ] [ ✓ Column Structure (38) ] ...
```

Green banner. Section cards are collapsible.

### Common elements (all result states)

- **Re-run button** — re-fires `POST /api/sync/workbench/source-pack/run`
- **Last-run timestamp** — shown in banner subtitle
- **Duration** — shown alongside the timestamp
- **Raw output toggle** — collapsible `<pre>` with full stdout (developer use)

---

## Section cards — display detail

Four canonical sections, displayed in this order:

### Table Presence (15 checks)

```
Table Presence
  ✓ 15/15 tables present   OR   ✗ N missing
  Failing: missing_table_name (CRITICAL)
  Warns:   optional_table (WARN — expected absent on some configs)
```

Shows missing tables (FAIL) and absent-but-optional tables (WARN).

### Column Structure (38 checks)

```
Column Structure
  ✓ 38/38 columns present   OR   ✗ N missing
  Failing: table.ColumnName — notes text
  Warns:   table.ColumnName — notes text
```

Shows missing columns (FAIL) and optional/warn columns.

### Dictionary (5 checks)

```
Dictionary (canonical_tf)
  ✓ 5/5 tables present   OR   ⚠ N tables absent
  Note: dictionary tables are seeded by hosted service at startup.
        Absent tables mean the hosted service has not run or the
        EF migration has not been applied.
  Warns: dict_canonical__tf_tax_area (WARN)
```

All dictionary checks are severity WARN (absent = backend seeder not run, not
a data-load failure).

### Data Content (8 checks)

```
Data Content
  ✓ 8/8 content checks pass   OR   ⚠ N content gaps
  Checks:
    levy_bills_L_active_count: 1,104,507 (ref: >0)  ✓
    property_geo_id_population_pct: 99.98% (ref: ≥95.00%)  ✓
    coll_transaction_not_in_landing: absent (ref: absent)  ✓
    ...
```

Shows measured vs expected for each content check. WARN = data gap or
population below threshold.

When a section card is **expanded**, show all checks — not just failing/warning.
This lets the operator verify which specific tables and columns are confirmed
present. Each row: `verdict-sym  check-name  measured  (expected)  notes-short`.

---

## data-testid attributes

| Element | testid |
|---|---|
| Page root | `source-pack-page` |
| Run/re-run button | `run-button` |
| Idle hint text | `idle-hint` |
| Running state div | `running-state` |
| Result state div | `result-state` |
| Overall banner | `overall-banner` |
| Overall symbol | `overall-sym` |
| Overall verdict text | `overall-verdict` |
| Fail gate notice | `fail-gate-notice` |
| Section cards container | `section-cards` |
| Section card (idx=0..3) | `section-card-{idx}` |
| Section card toggle | `section-card-{idx}-toggle` |
| Section card detail rows | `section-card-{idx}-details` |
| Raw output toggle | `raw-output-toggle` |
| Raw output pre | `raw-output` |
| Run error message | `run-error` |
| Conflict notice | `conflict-notice` |

---

## Files to create

```
backend/src/TerraFusion.Core/Sync/Workbench/
  IPackValidatorRunnerService.cs       (interface + PackValidatorRunResult DTO)

backend/src/TerraFusion.API/Services/Workbench/
  PackValidatorRunnerService.cs        (child-process spawn, mirrors DoctorRunnerService)

backend/src/TerraFusion.API/Controllers/
  WorkbenchSourcePackController.cs

frontend/apps/os-shell/src/api/
  syncPackValidator.ts                 (API client + DTOs)

frontend/apps/os-shell/src/pages/workbench/source-pack/
  parsePackValidatorOutput.ts          (pipe-delimited row parser)
  usePackValidatorRun.ts               (TanStack Query mutation)
  SourcePackFitPage.tsx                (panel component)
  __tests__/
    parsePackValidatorOutput.test.ts   (parser unit tests)
    SourcePackFitPage.test.tsx         (panel state / FAIL gate tests)
```

**Modified**:
- `backend/src/TerraFusion.API/Program.cs` — add `AddSingleton<IPackValidatorRunnerService, PackValidatorRunnerService>()`
- `frontend/apps/os-shell/src/Router.tsx` — add lazy import + route `workbench/sync/source-pack`

**Not modified**:
- `tools/sync/pack-validator-runner.mjs` — unchanged, proof already exists
- `tools/sync/harris-pacs-pack-validator.sql` — unchanged
- `tools/sync/workbench/server.mjs` — cockpit stays intact
- `IDoctorRunnerService.cs` — do NOT add `IProcessRunner` duplication

---

## Tests

### Backend — `TerraFusion.API.Tests/Workbench/PackValidatorRunnerServiceTests.cs`

All 6 tests follow the same `FakeProcessRunner` / `ServiceFactory` pattern as
`DoctorRunnerServiceTests.cs`. Use `file sealed class FakePackRunnerService`
or reuse `FakeProcessRunner` (it is `file`-scoped in `DoctorRunnerServiceTests.cs`
so it won't conflict — create a new file).

1. `PackValidatorRunnerService_Returns409_WhenAlreadyRunning`
2. `PackValidatorRunnerService_ReturnsExitCode0_ForPassOutput`
3. `PackValidatorRunnerService_ReturnsExitCode0_ForWarnOutput`
4. `PackValidatorRunnerService_ReturnsExitCode2_WhenPsqlNotFound`
5. `WorkbenchSourcePackController_Returns200_WithRunResult`
6. `WorkbenchSourcePackController_Returns409_WhenConcurrentRun`

### Frontend — `parsePackValidatorOutput.test.ts`

12 tests minimum:

1. Empty string → null overall, empty sections, zero counts
2. PASS stdout → overall=PASS, all sections verdict=PASS
3. WARN stdout → overall=WARN, at least one section verdict=WARN
4. FAIL stdout → overall=FAIL, at least one section verdict=FAIL
5. Section grouping: 4 canonical sections present
6. table_presence section: correct check count (≤15)
7. column_structure section: correct check count (≤38)
8. dictionary section: all checks severity=WARN
9. data_content section: measured/expected values parsed
10. Worst-of section verdict: PASS + WARN checks → section=WARN
11. Worst-of section verdict: WARN + FAIL checks → section=FAIL
12. INFO checks: verdict=INFO does not make section FAIL or WARN

### Frontend — `SourcePackFitPage.test.tsx`

8 tests minimum:

1. Renders run button and idle hint in initial state
2. Shows running state while mutation is pending
3. PASS banner rendered on exitCode=0 all-pass output
4. WARN banner rendered on exitCode=0 warn output
5. FAIL banner rendered on exitCode=2 output (psql not found) OR FAIL stdout
6. FAIL banner has no dismiss or proceed-anyway affordance
7. Re-run button fires mutation on result state
8. Raw output toggle shows stdout content

All tests use `vi.mock()` / `vi.fn()` / `vi.mocked()` — NOT `jest.*`.

---

## Non-goals

```
Drain execution              — no drain button on this panel
Commit approval              — not this slice
Running tf-sync-doctor.mjs  — Doctor is a separate panel (Slice J)
Quarantine actions           — separate panel (Slice I)
Editing pack validator SQL   — read-only; SQL lives in tools/sync/
F2 cleanup                  — separate workstream
Treasurer accounting         — separate mission
Retire local cockpit        — cockpit stays as dev harness; not deleted
Historical comparison        — future
Multi-county selector        — future
```

---

## Acceptance criteria

- [ ] `GET /workbench/sync/source-pack` loads in OS shell chrome (Taskbar + TopBar mounted)
- [ ] Run button fires `POST /api/sync/workbench/source-pack/run`
- [ ] FAIL result shows red blocking banner; no "proceed anyway" affordance
- [ ] WARN result shows yellow banner with warn count
- [ ] PASS result shows green banner with check count (e.g. "66/66 checks pass")
- [ ] Each section card expands to show individual check rows
- [ ] Failing checks shown with their notes text (not just the check name)
- [ ] Re-run button present and functional in result states
- [ ] 409 shown as inline error, not a crash
- [ ] Backend tests: 6 green
- [ ] Frontend tests: ≥10 green (parser + component combined)
- [ ] Local cockpit (`http://127.0.0.1:7700`) still works — no cockpit files modified
- [ ] `IProcessRunner` is NOT re-registered (Slice J already registers it as singleton)

---

_This contract governs implementation. Do not add drain triggers, approval
buttons, or canonical mutations to this panel. The pack validator is read-only._
