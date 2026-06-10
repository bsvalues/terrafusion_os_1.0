# Slice J — OS Shell Doctor Panel Contract

**Version**: 1.0  
**Written**: 2026-06-09  
**Branch**: fix/projector-delete-insert-atomicity  
**Status**: CONTRACT — implementation may begin after this is committed

---

## Summary

Port the Doctor Panel from the local Sync Workbench cockpit
(`tools/sync/workbench/`) to a canonical OS shell route at
`workbench/sync/doctor`.

This is not a rewrite. The doctor logic, the four tools, the PASS/WARN/FAIL
semantics, and the output parsing are all proven and unchanged. This slice
builds a thin .NET bridge endpoint and a React panel that renders the same
result the cockpit renders — inside the OS shell.

---

## Route

```
/workbench/sync/doctor
```

Registered in `frontend/apps/os-shell/src/Router.tsx` as a lazy-loaded route
nested under the `App` layout (same pattern as all other `workbench/sync/*`
routes).

---

## Backend endpoint

### Strategy: child-process spawn (v0.3 bridge)

The .NET API spawns `tools/sync/tf-sync-doctor.mjs` via
`System.Diagnostics.Process` and captures stdout + stderr. It does NOT
re-implement the doctor logic in C#.

**Rationale:** The doctor is 300+ lines of proven psql + SQL parsing. A C# port
would duplicate logic, create a maintenance surface, and risk drift from the
proven tool. The child-process bridge is the fastest path and the correct one
for v0.3. Label it `bridge implementation` in code comments.
Future hardening (C# port or dedicated service) is deferred to v0.4+.

### Route

```
POST /api/sync/workbench/doctor/run
```

**Controller**: `WorkbenchDoctorController`  
**Auth**: `[AllowAnonymous]` (single-county deployment, same as other workbench controllers)  
**409 guard**: concurrent run returns `{ "error": "Doctor is already running — please wait." }`

### Request body

Empty body accepted. No parameters. The doctor always runs the full 4-step
sequence against the configured database.

### Response schema

```json
{
  "exitCode": 0,
  "stdout": "<raw doctor stdout>",
  "stderr": "<raw doctor stderr, may be empty>",
  "durationMs": 14300,
  "timestamp": "2026-06-09T18:00:00.000Z",
  "runningNow": false
}
```

| Field | Type | Description |
|---|---|---|
| `exitCode` | int | 0 = PASS/WARN · 1 = FAIL · 2 = error |
| `stdout` | string | Full stdout from `tf-sync-doctor.mjs` |
| `stderr` | string | Stderr (normally empty; non-empty = unexpected) |
| `durationMs` | int | Wall-clock milliseconds |
| `timestamp` | string | ISO-8601 UTC start time |
| `runningNow` | bool | Always false in response body; true in status endpoint |

On 409 (concurrent run):
```json
{ "error": "Doctor is already running — please wait." }
```

On 500 (spawn failure):
```json
{ "error": "Failed to start doctor process: <message>", "exitCode": 2 }
```

### Status endpoint

```
GET /api/sync/workbench/doctor/status
```

Returns:
```json
{ "running": false }
```

Allows the frontend to check run state without triggering a run.

### Process invocation

```csharp
// v0.3 bridge implementation — spawns existing Node.js doctor tool.
// Future hardening may port runner to a C# service.
var psi = new ProcessStartInfo
{
    FileName  = "node",
    Arguments = "tools/sync/tf-sync-doctor.mjs",
    WorkingDirectory = repoRoot,       // repo root resolved at startup
    RedirectStandardOutput = true,
    RedirectStandardError  = true,
    UseShellExecute = false,
    CreateNoWindow  = true,
};
// Forward PostgreSQL env vars from configuration
foreach (var (key, value) in pgEnvVars) psi.Environment[key] = value;
```

PostgreSQL env vars (`PG_HOST`, `PG_PORT`, `PG_DB`, `PG_USER`, `PGPASSWORD`)
must be forwarded from `IConfiguration` — read from `appsettings.json` or
environment overrides. The doctor defaults to `127.0.0.1:5432 terrafusion
postgres devpassword123` when env vars are absent (same as cockpit).

---

## Output parsing

The .NET endpoint returns raw stdout. The React component parses it using
TypeScript logic ported from `tools/sync/workbench/panel/app.js`.

**Reason for client-side parse:** The stdout format is the contract of the
doctor tool, already documented and proven. Parsing in the frontend avoids
creating a second layer of output interpretation in C#. If the doctor tool
format changes, one parse location changes instead of two.

### Parser inputs (step stdout sections)

The doctor stdout contains four sections delimited by banner lines. Each
section corresponds to one tool run:

```
Step 0: harris-pacs-pack-validator.sql
  Per check: category|check_name|measured|expected|verdict|severity|notes
  Summary:   OVERALL: PASS/WARN/FAIL|fail=N|warn=N|pass=N|info=N

Step 1: identity-drift-detector.sql
  Per table: lane_table|total|live|dangling|null_ref|PASS/FAIL
  Summary:   OVERALL: ... (free text, used only for logging)

Step 2: seal-check-runner.sql
  Per gate:  lane|check_name|measured|expected|PASS/WARN-*/FAIL
  Summary:   OVERALL: PASS/FAIL ...|fail_count|reasons

Step 3: domain-coverage-audit.sql
  Per domain: domain_family|status|note
  Summary:    OVERALL: N_SEALED sealed|...
```

### Step verdict derivation

| Step | PASS | WARN | FAIL |
|---|---|---|---|
| #0 Pack Validator | overallVerdict=PASS | overallVerdict=WARN | overallVerdict=FAIL |
| #1 Identity Drift | failTables=[] | failTables=[] AND deferredFails>0 | failTables.length>0 |
| #2 Seal Check | overallVerdict=PASS, warnCount=0 | overallVerdict=PASS, warnCount>0 | overallVerdict=FAIL |
| #3 Domain Coverage | sealedCount≥SEALED_BASELINE | sealedCount<SEALED_BASELINE | cannot FAIL (informational) |

### Overall verdict

```
Any step is FAIL  →  overall FAIL
No FAIL, any WARN →  overall WARN
All PASS          →  overall PASS
exitCode=2        →  overall ERROR (cannot connect or tool not found)
```

---

## PASS / WARN / FAIL semantics

These are displayed on the panel and never softened:

| Verdict | Meaning | What operator should do |
|---|---|---|
| **PASS** | All checks clean | Safe to drain. Substrate verified. |
| **WARN** | Known deferred items present; no structural breaks | Safe to work. Note the deferred boundaries. |
| **FAIL** | Identity break, seal regression, or pack mismatch | Do NOT drain. Diagnose the failing step before proceeding. |
| **ERROR** | Doctor could not run (Node not found, DB unreachable) | Check Node.js install and PostgreSQL connection. |

**FAIL is a hard gate:** the panel shows a red blocking banner. The operator
cannot dismiss it or proceed past it. This is the same gate behaviour as the
cockpit.

---

## UI states

The panel has five states:

### 1. Idle (never run)

```
[ Run Doctor ]
"Run the doctor to check substrate health before working."
```

No cards shown. Single run button.

### 2. Running

```
[ Running… ]
Spinner + "Doctor is running — this takes 10–60 seconds."
```

Run button disabled. No stale results shown during run.

### 3. FAIL result

```
╔════════════════════════════════════════════╗
║  ✗ FAIL — do not drain                     ║
║  One or more checks require attention.      ║
╚════════════════════════════════════════════╝

Step cards: [ ✗ step name | expand for detail ]
```

Red banner. Each failing step card expands to show the failing checks.

### 4. WARN result

```
⚠ WARN — safe to work, known deferred boundaries
Last run: 2026-06-09 18:00 UTC · 14.3s

Step cards: [ ✓ step name ] [ ⚠ step name | expand for detail ] ...
```

Yellow banner. WARN cards expand to show the deferred items.

### 5. PASS result

```
✓ PASS — substrate clean
Last run: 2026-06-09 18:00 UTC · 14.3s

Step cards: [ ✓ #0 Pack Validator ] [ ✓ #1 Identity Drift ] ...
```

Green banner. Step cards collapsible. Expand shows check counts.

### Common elements (all result states)

- **Re-run button** — re-fires `POST /api/sync/workbench/doctor/run`
- **Last-run timestamp** — shown in the banner subtitle
- **Duration** — shown alongside the timestamp
- **Raw output toggle** — collapsible `<pre>` with full stdout (developer use)

---

## Step cards — detail content when expanded

### #0 Pack Validator

```
Harris PACS Pack Validator
  ✓ pass=62 · ⚠ warn=3 · ✗ fail=0 · ℹ info=1
  Failing checks: (list, if any)
```

### #1 Identity Drift

```
Identity Drift Detector
  ✓ 10 tables clean
  ⚠ Known deferred: canonical_tf.tf_parcel_owner_link (1.4M rows — separate triage)
  ✗ Unexpected failures: (list, if any)
```

### #2 Seal Check

```
Seal Check Runner
  ✓ 22/22 gates pass  OR  ✗ N gates failing
  Failing lanes: (list)
  Warn lanes: (list, if any)
```

### #3 Domain Coverage

```
Domain Coverage Audit
  ✓ 12 SEALED  ·  ⚠ 3 LANDED_ONLY  ·  — 3 DEFERRED / EMPTY
```

---

## Files to create

```
backend/src/TerraFusion.API/Controllers/
  WorkbenchDoctorController.cs

backend/src/TerraFusion.Core/Sync/Workbench/
  IDoctorRunnerService.cs           (interface + DTOs)

backend/src/TerraFusion.Data/Services/Workbench/
  DoctorRunnerService.cs            (child-process spawn)

frontend/apps/os-shell/src/api/
  syncDoctor.ts                     (API client + DTOs)

frontend/apps/os-shell/src/pages/workbench/sync-doctor/
  useDoctorRun.ts                   (TanStack Query mutation)
  parseDoctorOutput.ts              (port of app.js parsers)
  SyncDoctorPage.tsx                (panel component)
  __tests__/
    SyncDoctorPage.test.tsx         (panel renders / states / FAIL gate)
    parseDoctorOutput.test.ts       (parser unit tests)
```

`Router.tsx`: add lazy import + route `workbench/sync/doctor`.

---

## Tests

### Backend (TerraFusion.API.Tests)

1. `DoctorRunnerService_Returns409_WhenAlreadyRunning`
2. `DoctorRunnerService_ReturnsExitCode0_ForPassOutput`
3. `DoctorRunnerService_ReturnsExitCode1_ForFailOutput`
4. `DoctorRunnerService_ReturnsExitCode2_WhenNodeNotFound`
5. `WorkbenchDoctorController_Returns200_WithRunResult`
6. `WorkbenchDoctorController_Returns409_WhenConcurrentRun`

### Frontend

1. Panel renders with run button in idle state
2. Loading spinner shown during run
3. PASS banner rendered on exitCode=0 all-pass stdout
4. WARN banner rendered on exitCode=0 warn stdout
5. FAIL banner rendered on exitCode=1 stdout
6. FAIL banner is not dismissible (no close button, no "proceed anyway")
7. Re-run button fires mutation on result state
8. Raw output toggle shows stdout content
9. `parseDoctorOutput.ts`: Step #0 PASS/WARN/FAIL derived correctly
10. `parseDoctorOutput.ts`: Step #1 known-deferred → WARN, unexpected fail → FAIL
11. `parseDoctorOutput.ts`: Step #2 seal fail → FAIL, warn count > 0 → WARN
12. `parseDoctorOutput.ts`: Step #3 domain counts parsed correctly

---

## Non-goals

```
Drain execution            — no drain button anywhere on this panel
Commit approval            — not this slice
Quarantine actions         — separate panel (Slice I, already complete)
Mapping editor             — future
Multi-county selector      — future
Historical comparison      — future
F2 cleanup                 — separate workstream
Treasurer accounting       — separate mission
Retire local cockpit       — cockpit stays as dev harness; not deleted in this slice
```

---

## Acceptance criteria

- [ ] `GET /workbench/sync/doctor` loads the panel in the OS shell chrome
      (Taskbar and TopBar remain mounted)
- [ ] Run button fires `POST /api/sync/workbench/doctor/run`
- [ ] FAIL result shows a red blocking banner; no "proceed anyway" affordance
- [ ] WARN result shows a yellow banner with the deferred item listed
- [ ] PASS result shows a green banner
- [ ] Each step card expands to show check counts / failing items
- [ ] Re-run button is present and functional in result states
- [ ] 409 shown as an inline error, not a crash
- [ ] Backend tests: 6 green
- [ ] Frontend tests: ≥10 green
- [ ] Local cockpit (`http://127.0.0.1:7700`) still works after this slice —
      no cockpit files modified

---

_This contract governs implementation. Do not add approval buttons, drain
triggers, or canonical mutations to this panel. The doctor is read-only._
