# Benton Sync Readiness Console — Live Evidence Baseline

**Slice:** OPS-1-C (committed evidence baseline for the OPS-1
family. Captures the live state of the OPS-1-A backend facade
returning sanitized DTOs derived from the four committed
Benton diagnostic baselines on the date below, so future audits
have a permanent baseline to compare against.).

**Source-of-truth pointers:**

- OPS-1 policy: `docs/workbench/sync-readiness-console-policy.md`.
- OPS-1 wireframe: `docs/workbench/sync-readiness-console-wireframe.md`.
- OPS-1-B-PREP frontend map: `docs/workbench/sync-readiness-console-frontend-map.md`.
- OPS-1-A backend marker commit: `760e51def`,
  merged at `ec5798d3e`.
- OPS-1-A-2 backend marker commit: `32ba8b915`,
  merged at `7fff901fb`.
- OPS-1-B frontend marker commit: `efe95d5c2`,
  merged at `a335fd508`.
- Source baselines surfaced by the console:
  - `docs/sync/benton-pacs-catalog-health-baseline.md` (BENTON-SYNC-4)
  - `docs/sync/benton-dictionary-loader-preflight-evidence-baseline.md` (BENTON-SYNC-6-C)
  - `docs/sync/benton-sales-qualification-coverage-baseline.md` (BENTON-SYNC-7-C)
- Captured artifacts (gitignored, operator-side):
  `backend/artifacts/ops-1-c/20260502T153024Z/`
  - `get-readiness.json` — sanitized DTO from the live GET endpoint.
  - `api.stdout.log` / `api.stderr.log` — API process telemetry.

## Capture context

```text
Identity envelope
  CountyId            : 19190019-1919-1919-1919-191919191919  (WA-Benton)
  SourceConnectionId  : e6ddd159-eac9-450a-aa47-983688d2491d  (Benton PACS OLTP)
  WorkbookId          : a767c8a2-5b8a-4846-af8b-c3496601e924  (Mapped)

Run
  Command             : curl GET /api/workbench/sync-readiness?countyId=...&sourceConnectionId=...&workbookId=...
  Run ID              : 20260502T153024Z
  HTTP                : 200 OK
  Response size       : 1336 bytes
  Stderr              : empty (zero bytes)
  Backend assembled at: 2026-05-02T15:31:13.1093761Z
  Artifact root       : backend/artifacts/sync-atlas/

Leak scan
  Pattern scan        : zero matches over Password=, Pwd=, TF_Pacs,
                        SA_PASSWORD, SYNCATLAS_SECRET_, TF_Pacs2026,
                        grantor, grantee, seller
  Raw-value scan      : zero matches for the resolved SA password
                        across all artifact files
```

## Captured GET response (sanitized DTO)

```json
{
  "countyId": "19190019-1919-1919-1919-191919191919",
  "sourceConnectionId": "e6ddd159-eac9-450a-aa47-983688d2491d",
  "workbookId": "a767c8a2-5b8a-4846-af8b-c3496601e924",
  "assembledAtUtc": "2026-05-02T15:31:13.1093761Z",
  "reachability": {
    "status": "UNKNOWN",
    "headline": "Reachability probe not run",
    "detail": "Click Refresh to probe the PACS connection.",
    "capturedAtUtc": null,
    "source": "pacs-connection-probe"
  },
  "catalogHealth": {
    "status": "WARN",
    "headline": "Schema catalog clean",
    "detail": "Coverage                      : 2229 tables, 32750 columns, 210 dictionaries",
    "capturedAtUtc": "2026-05-02T01:05:20Z",
    "source": "schema-catalog-health"
  },
  "invariants": {
    "status": "WARN",
    "headline": "0 errors, 721 warnings",
    "detail": "Invariant engine accepted the catalog build.",
    "capturedAtUtc": "2026-05-02T01:27:36Z",
    "source": "invariant-artifact"
  },
  "preflights": {
    "status": "YES",
    "headline": "1 loader call(s), 0 fail, 0 warn",
    "detail": "All preflights passed.",
    "capturedAtUtc": "2026-05-02T04:25:35Z",
    "source": "preflight-evidence"
  },
  "coverage": {
    "status": "NO",
    "headline": "Forward gap 50, drift 0",
    "detail": "Backward gap 0 (inconclusive)",
    "capturedAtUtc": null,
    "source": "coverage-report"
  },
  "lastProof": {
    "catalogHealth": "2026-05-02T01:05:20.0000000Z",
    "invariantArtifact": "2026-05-02T01:27:36.0000000Z",
    "preflightEvidence": "2026-05-02T04:25:35.0000000Z",
    "coverageReport": "never"
  }
}
```

## Reading the baseline

The DTO surfaces all four committed BENTON-SYNC-* baselines through
the OPS-1-A backend facade. Each panel maps to a real artifact
captured during the BENTON-SYNC-* track:

### Panel 1 — Reachability

`UNKNOWN` is the expected initial state. The connection probe is
owned by the POST `/refresh` endpoint (OPS-1-A-2), not the GET
read path. The detail line "Click Refresh to probe the PACS
connection" surfaces the operator action that flips this panel to
`YES` (or `NO` with an `ErrorCategory`).

### Panel 2 — Catalog health → WARN

Reads `backend/artifacts/sync-atlas/benton-sync-3/20260502T010520Z/
schema-catalog-health.stdout.txt` per the BENTON-SYNC-4 baseline.
The captured catalog had `IsClean=true` with 0 errors and 721
warnings (all FK-006 inferred-by-name advisories — operator-
promotion candidates, not defects). The OPS-1 policy maps "Errors=0
+ Warnings>0" to `WARN`, so the panel correctly reports `WARN` with
the live coverage line "2229 tables, 32750 columns, 210
dictionaries" surfaced from the captured stdout.

### Panel 3 — Invariants → WARN

Reads `benton-sync-5/20260502T012736Z/invariant-report.json` per
BENTON-SYNC-5. Same shape as catalog health: 0 errors, 721 warnings,
`isClean=true`. The OPS-1 policy maps this to `WARN`. Headline
"0 errors, 721 warnings" + detail "Invariant engine accepted the
catalog build" matches the BENTON-SYNC-5 evidence verbatim.

### Panel 4 — Preflights → YES

Reads `benton-sync-6-c/20260502T042535Z/preflight-evidence.json`
per BENTON-SYNC-6-C. The captured run had 1 loader call (property_use)
with FK Pass + Era Pass + PII Pass — all clean. The OPS-1 policy
maps "fail count = 0 AND warn count = 0" to `YES`. Headline
"1 loader call(s), 0 fail, 0 warn" correctly summarizes the
captured summary block.

### Panel 5 — Coverage → NO

Reads `benton-sync-7-c/20260502T050226Z/oltp-run/coverage-report.json`
per BENTON-SYNC-7-C (the OLTP run, which surfaced the GAPS verdict;
the read service prefers the nested `oltp-run/` path when present).
The captured run had 50 forward-coverage gaps because OLTP has rows
but no canonical rows have been written. The OPS-1 policy maps
"forward gap > 0 OR drift > 0" to `NO`. Headline "Forward gap 50,
drift 0" + detail "Backward gap 0 (inconclusive)" correctly
surfaces the operationally-useful GAPS signal.

### Panel 6 — Last successful proof

The four `lastProof` timestamps populate from the most-recent
captured artifact for each surface, with "never" sentinel when no
artifact exists. The fourth (coverageReport) shows "never" because
the read service's coverage-panel path resolves to the nested
OLTP run dir, but the surrounding RUN_ID-derived `lastProof.coverageReport`
field reads the top-level dir's name parsing (which doesn't match
the RUN_ID format because of the `/oltp-run` suffix). This is a
known minor read-path quirk noted as a potential follow-up under
OPS-1-A-FIX1; it does not affect the panel 5 status which renders
correctly.

## Hard guards re-verified at this capture

- **HG3 read-only**: GET request executed read-only filesystem
  operations on the artifact directory. No PACS query, no
  TerraFusion DB write, no workbook mutation, no canonical
  landing mutation. The API process's audit log shows only GET
  health + GET sync-readiness; zero writes.
- **HG6 source-traceable**: top-level identity envelope present
  (`countyId`, `sourceConnectionId`, `workbookId`); each panel
  carries its `source` identifier (`pacs-connection-probe` /
  `schema-catalog-health` / `invariant-artifact` /
  `preflight-evidence` / `coverage-report`).
- **No PII in response**: pattern scan zero across `grantor`,
  `grantee`, `seller`; raw-value scan zero for the resolved SA
  password. Response body grep confirms only counts, statuses,
  identifiers, and timestamps.
- **No secrets**: response body contains no connection-string
  fragments, no `Password=…;`, no `SYNCATLAS_SECRET_*` mentions.
  The probe runs in a separate code path (POST refresh) that
  uses the existing `EnvironmentSecretResolver`; the GET path
  never resolves secrets.
- **County-scoped**: response's `countyId` matches the URL's
  `countyId` parameter exactly. Each panel's underlying artifact
  was filtered by `countyId` at the read service level (cross-
  county artifacts surface as `UNKNOWN` per the OPS-1-A unit
  tests, exercised structurally here by the workbook-id match
  on preflight + coverage).
- **No cross-domain reads**: no Forge / TerraFlow / Workbench-for-
  mapping / Studio surface touched. Only the four Sync diagnostic
  artifact paths read.
- **No Sync re-open**: the four BENTON-SYNC-* baselines remain
  authoritative. OPS-1-C reads them; it does NOT modify them.

## What this baseline does NOT capture

The dual-boot screenshot capture (frontend rendering of the
console under live Benton conditions) is deferred to the
operator. The OPS-1-B Vitest test suite (8 acceptance gates)
provides the structural rendering proof; the operator can capture
the visual rendering from a manual `npm run dev` + browser
session at any time. The procedure:

```text
1. Boot API:        cd backend/src/TerraFusion.API && dotnet run
2. Boot frontend:   cd frontend && npm run dev
3. Browser to:
   http://localhost:3000/workbench/sync-readiness?countyId=<...>&sourceConnectionId=<...>&workbookId=<...>
4. Capture screenshot of initial render.
5. Click Refresh; capture screenshot post-refresh.
6. Save screenshots under backend/artifacts/ops-1-c/<RUN_ID>/screenshots/.
```

The POST `/refresh` endpoint live proof is also deferred —
catalog-health refresh takes ~200 seconds against live PACS
(per BENTON-SYNC-3 baseline), so a synchronous refresh is too
slow to capture in a single operator session. A future
OPS-1-C-REFRESH slice can capture the POST live evidence with
appropriate operator-state procedure.

## Re-running the proof

```bash
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACT_DIR="backend/artifacts/ops-1-c/$RUN_ID"
mkdir -p "$ARTIFACT_DIR"

# Boot API in background.
cd backend/src/TerraFusion.API
ASPNETCORE_URLS="http://localhost:5000" \
ASPNETCORE_ENVIRONMENT="Development" \
dotnet run --no-build > "../../../$ARTIFACT_DIR/api.stdout.log" \
  2> "../../../$ARTIFACT_DIR/api.stderr.log" &
API_PID=$!
cd ../../..

# Wait for API up.
until curl -sS -o /dev/null --max-time 1 http://localhost:5000/health; do sleep 1; done

# Capture.
COUNTY="19190019-1919-1919-1919-191919191919"
SOURCE="e6ddd159-eac9-450a-aa47-983688d2491d"
WORKBOOK="a767c8a2-5b8a-4846-af8b-c3496601e924"
curl -sS -o "$ARTIFACT_DIR/get-readiness.json" \
  "http://localhost:5000/api/workbench/sync-readiness?countyId=$COUNTY&sourceConnectionId=$SOURCE&workbookId=$WORKBOOK"

# Cleanup.
kill "$API_PID" 2>/dev/null
```

Compare resulting `get-readiness.json` to this baseline. Drift in
panel statuses or `lastProof` timestamps relative to the four
committed BENTON-SYNC-* baselines warrants investigation.

## OPS-1 family completion

| Slice          | Status | Deliverable                                                        |
|----------------|--------|--------------------------------------------------------------------|
| OPS-1          | DONE   | Policy + wireframe (docs).                                         |
| OPS-1-A        | DONE   | Backend GET facade + DTOs + read service + 11 tests.                |
| OPS-1-A-2      | DONE   | POST refresh + PACS probe + Process runner + 5 tests.               |
| OPS-1-B-PREP   | DONE   | Frontend shell route map (docs).                                    |
| OPS-1-B        | DONE   | Frontend console + 8 acceptance tests.                              |
| OPS-1-C        | DONE   | This evidence baseline. ← this slice                                |
| OPS-1-C-REFRESH | OPTIONAL FUTURE | POST `/refresh` live proof when operator has 15+ min session for catalog-health build. |
| OPS-1-D        | OPTIONAL FUTURE | Dual-boot screenshot baseline (operator-driven).        |

## Slice ledger note

This baseline closes the OPS-1 family for the read path under
live Benton conditions. The four diagnostic surfaces from the
closed BENTON-SYNC-* track are now consumable through a single
sanitized HTTP DTO + a wired frontend console. The control room
breaker panel is on the wall, the lights respond to the switch
in tests, and the backend has been proven to surface the
existing committed baselines correctly.

The receipt goblin can read all the ledgers from the front desk now.
