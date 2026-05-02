# Sync Readiness Console Policy

**Slice:** OPS-1 (docs-only — opens the OPS-* track and pins the
read-only operator control surface that surfaces Sync bridge
readiness without re-opening the closed BENTON-SYNC-* track or
crossing into Forge / TerraFlow / canonical-write product
domains.).

**Status:** policy-only. Wireframe lands in the same slice at
`docs/workbench/sync-readiness-console-wireframe.md`. Implementation
lands separately under OPS-1-B (frontend) and OPS-1-A (backend
read endpoints, if needed).

**Authoritative cross-references:**

- `docs/sync/sync-boundary-policy.md` — SCOPE-1. The bridge
  boundary the console READS but does not cross.
- `docs/sync/benton-sync-diagnostic-track-completion-handoff.md`
  — BENTON-SYNC-8 closeout. The four diagnostic surfaces the
  console reads.
- `docs/sync/benton-pacs-catalog-health-baseline.md` — schema
  catalog health baseline.
- `docs/sync/benton-dictionary-loader-preflight-evidence-baseline.md`
  — preflight evidence baseline.
- `docs/sync/benton-sales-qualification-coverage-baseline.md` —
  coverage continuity baseline.

## Why this slice

The Benton Sync diagnostic track is functionally complete at
BENTON-SYNC-8. Four major diagnostic surfaces are live:

1. Schema catalog health command.
2. Invariant report artifact.
3. Dictionary-loader preflight evidence artifact.
4. Sales qualification coverage-continuity smoke.

Each is a SyncAtlas CLI mode emitting structured stdout +
optional JSON evidence artifact. Each has a committed Benton
baseline as the diff target.

The bridge is powerful, but the operator's cognitive load is now
the founder bottleneck. To inspect "is the bridge healthy
today?" the operator currently has to:

- Run four CLI commands against tf-mssql + Postgres
- Set the right `SYNCATLAS_SECRET_*` env vars
- Read four pieces of stdout
- Compare each against the relevant committed baseline by hand
- Hold the result in working memory

That is what the Sync Readiness Console eliminates. One screen,
six questions, six visible answers, no machine-state-juggling.

This slice opens the OPS-* track. It is policy-only. It does
NOT add product behavior. It does NOT cross into Forge /
TerraFlow / Workbench-for-mapping / Studio territory. It does
NOT mutate anything. It pins the contract that an OPS-1-B
implementation slice will satisfy.

## Scope

### In scope

- A single read-only screen surfaced under
  `/workbench/sync-readiness` in the operator-facing TerraFusion
  shell (Studio / Workbench app — owner already pinned).
- Six pinned questions with bounded YES / WARN / NO / UNKNOWN
  status per question (definitions below).
- A "last successful proof" display per diagnostic surface
  reading from the committed Benton baselines as the source of
  truth.
- A refresh button that re-runs each diagnostic against the
  live PACS connection AND the live TerraFusion DB, capturing
  fresh artifacts.
- Hard guards (HG3 read-only at the page level, county-scoped,
  no PII rendered, no secrets stored).
- The OPS-1-B / OPS-1-C implementation contract.

### Out of scope

- Mutating any Sync surface.
- Cross-domain consumption (Forge valuation, TerraFlow workflows,
  Workbench-for-mapping editing, Studio for mapping authoring).
- Multi-county aggregation. The console scopes to ONE
  `(CountyId, WorkbookId, SourceConnectionId)` triple per
  view.
- Persisting console state outside of the operator's session.
  Refresh state lives in-memory; the only persistence is the
  underlying SyncAtlas artifact files (already operator-state).
- Authoring or modifying the four diagnostic surfaces. The
  console is purely a viewer over what those surfaces produce.

## The six pinned questions

The console answers exactly six questions, in this order, in
this layout. Adding a seventh question is NOT an OPS-1-B-FOLLOWUP
slice; it is a fresh policy slice (OPS-2 or higher).

| # | Question                                       | Source surface                                | Status semantics |
|--:|-----------------------------------------------|-----------------------------------------------|-------|
| 1 | Is Harris PACS reachable?                      | tf-mssql connection probe                    | YES on successful connection; NO on connection refused / timeout / auth error; UNKNOWN before first probe runs. |
| 2 | Is the schema catalog healthy?                  | BENTON-SYNC-2 schema-catalog-health output    | YES on `IsClean=true`; WARN on Warnings>0 (FK-006 inferred-by-name advisories are operator-promotion candidates, not defects); NO on Errors>0; UNKNOWN before first run. |
| 3 | Are invariants clean?                            | BENTON-SYNC-5 invariant artifact              | YES on `IsClean=true` AND `Errors=0`; WARN on `Warnings>0`; NO on `Errors>0`. |
| 4 | Are dictionary preflights clean?                 | BENTON-SYNC-6-B preflight evidence            | YES on `Summary.{Fk,Era,Pii}FailCount=0`; WARN on `Summary.{Fk,Era,Pii}WarnCount>0`; NO on any Fail; UNKNOWN before first run. |
| 5 | Are canonical rows stale or missing?             | BENTON-SYNC-7-B coverage report               | YES on `Verdict.IsClean=true`; WARN on backward-gap inconclusive but forward+drift==0; NO on any forward-gap or drift; UNKNOWN before first run. |
| 6 | What was the last successful proof?              | All four committed Benton baselines + most-recent operator artifact | Renders the timestamp of the most-recent run for each surface; "never" if no run has been captured. |

Status colors (see wireframe doc): YES=terra-green, WARN=terra-amber,
NO=terra-red, UNKNOWN=terra-grey. Terracotta brand palette per
the existing TerraFusion design tokens (no new tokens introduced
by this slice).

## Data sources

The console READS from these sources and ONLY these sources:

- **Live PACS connection probe** (question 1): a thin wrapper
  over the existing SqlServerMetadataReader connection-open path,
  exposed by a new read-only API endpoint. NO query is run; the
  probe opens the connection and immediately closes it.
- **SyncAtlas captured artifacts** under
  `backend/artifacts/sync-atlas/<diagnostic>/<RUN_ID>/` for
  questions 2-5: the four JSON evidence artifacts (catalog
  health stdout + invariant + preflight + coverage). These are
  operator-state files; the console reads them via a new
  read-only API endpoint that knows the artifact directory
  layout.
- **Committed Benton baselines** for question 6: the four
  baseline doc paths are static. The console either renders
  the `RunId` field from the latest captured artifact OR falls
  back to the baseline doc's "Capture context" section.

The console does NOT:

- Query `CanonicalSaleQualifications` directly. Coverage status
  is read from the captured coverage report, not from a fresh
  EF query at console-render time.
- Build the schema catalog directly. Catalog health is read
  from the captured health-stdout artifact.
- Run the SyncAtlas binary inline. The "Refresh" button shells
  out to SyncAtlas as a backgrounded process; the console
  observes the artifact directory for new files and updates
  state when they appear.

## CLI engagement model (what Refresh does)

The Refresh button on the console maps to four sequential
SyncAtlas invocations:

```text
sync-atlas --schema-catalog-health \
  --invariant-artifact-path <ops1-ephemeral-dir>/invariant.json

sync-atlas --load-pacs-dictionary --table property_use \
  --workbook-id <id> \
  --preflight-evidence-path <ops1-ephemeral-dir>/preflight.json

sync-atlas --qualify-sales-coverage \
  --workbook-id <id> --max-sales 200 \
  --coverage-evidence-path <ops1-ephemeral-dir>/coverage.json
```

(Question 1's probe is its own thin call; it is not a SyncAtlas
mode.)

Engagement rules — binding:

- **Refresh writes ONLY to an ephemeral artifact dir** (e.g.
  `backend/artifacts/sync-atlas/ops-1-readiness/<session-id>/`),
  never to the canonical baseline directories or any data
  store. The Benton committed baselines are the diff target,
  not the write target.
- **Refresh is bounded.** Each SyncAtlas invocation has a
  hard timeout (default 600s for catalog health to
  accommodate live introspection time; 60s for the others).
  Timeout surfaces as UNKNOWN status with a stderr-summary
  tooltip.
- **Refresh requires explicit operator click.** No auto-refresh
  on page load, no polling. Page load shows the most-recent
  captured-artifact state OR the baseline state if no live
  capture exists.
- **Refresh failure is non-fatal.** If question 3's invariant
  artifact write fails but question 2's stdout succeeds,
  question 2 shows YES/WARN/NO and question 3 shows UNKNOWN.
  The console never blanks on partial failures.

## Hard guards (binding for any implementation)

- **HG3 read-only at the page level.** No console interaction
  produces a write to PACS, TerraFusion DB, the workbook, or
  the canonical landing. Refresh writes ONLY to the ephemeral
  artifact directory; tests pin pre/post DB row count
  equivalence on `CanonicalSaleQualifications` and the
  workbook tables.
- **No PII rendered.** The console renders question status,
  RunIds, counts, and high-level verdicts. It does NOT render
  PACS row data, party identifiers, sale prices, addresses, or
  any field outside the artifact's permitted-field set (per
  the BENTON-SYNC-6-A and BENTON-SYNC-7-A no-PII guards).
  Sample-row drilldowns from the coverage report show only
  `(ChgOfOwnerId, canonicalStatus, freshStatus)` — already
  PII-safe by upstream construction.
- **No secrets stored.** The console NEVER stores PACS sa
  passwords or `SYNCATLAS_SECRET_*` values. The Refresh button
  invokes SyncAtlas via a server-side handler that uses the
  existing `EnvironmentSecretResolver` pipeline; secrets stay
  in the operator's process environment exactly as they do for
  CLI invocations today.
- **County-scoped.** The console accepts a
  `(CountyId, WorkbookId, SourceConnectionId)` triple from
  URL parameters; no implicit defaults. If the triple is not
  supplied, the console renders an empty selector page, NOT a
  fabricated default scope.
- **No cross-domain reads.** The console reads only from the
  four Sync diagnostic surfaces and the connection probe. It
  does NOT read Forge valuations, TerraFlow workflow state,
  Studio mapping authoring state, or any non-Sync surface.
  Cross-domain consoles land under their own track (OPS-2+,
  OPS-Forge-1, OPS-TerraFlow-1, etc.).
- **No re-open of BENTON-SYNC-***. The closeout handoff's
  re-open conditions remain authoritative. OPS-1 reads the
  diagnostic artifacts; it does NOT modify the underlying
  diagnostic surfaces. If a diagnostic surface needs a change,
  it lands under its own re-open condition, not under OPS-*.

## Test matrix (binding for OPS-1-B / OPS-1-C)

The implementation slices MUST include tests pinning the
following acceptance gates.

### OPS-1-A — backend read endpoints (if needed)

If the console requires a new read endpoint to surface
artifact contents to the frontend, it lands as OPS-1-A:

- `GET_SyncReadinessOps_Returns_200_WithLatestArtifactSummaries`
- `GET_SyncReadinessOps_Returns_404_OnUnknownCounty`
- `GET_SyncReadinessOps_NeverWritesToPacsOrCanonical` (pre/post snapshot)
- `GET_SyncReadinessOps_RedactsAnyFieldOutsidePermittedSet`
  (forensic test: synthetic artifact with PII-shaped row data
  is filtered before serving)

### OPS-1-B — frontend console

- `Render_AllUnknown_ShowsGreyStateBeforeFirstRefresh`
- `Render_PartialArtifactsPresent_ShowsMixedStateNotBlank`
- `Render_NeverFetches_OnPageLoadAutomatically` (no auto-refresh)
- `Render_StatusColorsMatch_TerracottaBrandTokens`
- `Refresh_TriggersFourSyncAtlasInvocations_OnExplicitClick`
- `Refresh_PartialFailure_ShowsPerQuestionState`
- `Refresh_NeverPersistsBeyondEphemeralDir`
- `Render_NoPiiInDom` (DOM scan grep over rendered output)

### OPS-1-C — committed Benton evidence baseline (optional future)

- Live capture of the console's rendered state under live
  Benton conditions, screenshot + JSON snapshot of the rendered
  status, mirroring BENTON-SYNC-4 / 6-C / 7-C.

## Slice ledger

- OPS-1   : DONE — this policy + the wireframe doc at
            `docs/workbench/sync-readiness-console-wireframe.md`.
            ← this slice
- OPS-1-A : OPTIONAL — backend read endpoints if frontend
            cannot read the artifact directory directly. Land
            only if OPS-1-B's design surfaces a real need.
- OPS-1-B : NEXT — frontend console implementation under
            `frontend/apps/os-shell/src/routes/workbench/sync-readiness/`
            (or the equivalent route in the established
            shell-app structure). React component + state
            management + refresh wiring + the test matrix above.
- OPS-1-C : OPTIONAL FUTURE — committed Benton evidence
            baseline once OPS-1-B's first live render is
            captured.

## Acceptance for OPS-1

- [x] Two files added at
  `docs/workbench/sync-readiness-console-policy.md` (this) and
  `docs/workbench/sync-readiness-console-wireframe.md` (companion).
- [x] Six pinned questions enumerated with status semantics.
- [x] Data sources pinned (live probe + four artifact paths +
  baselines as fallback).
- [x] CLI engagement model pinned (Refresh maps to four
  SyncAtlas invocations against an ephemeral artifact dir).
- [x] Hard guards enumerated (HG3 read-only, no PII, no secrets,
  county-scoped, no cross-domain, no Sync re-open).
- [x] Test matrix enumerated for OPS-1-A / OPS-1-B / OPS-1-C.
- [x] No code changes. No test changes. No mutation of any
  Sync diagnostic surface.

## Non-goals (explicit)

- OPS-1 does not implement any frontend code, any backend
  endpoint, or any test. OPS-1-A and OPS-1-B do.
- OPS-1 does not amend the BENTON-SYNC-8 closeout. The four
  diagnostic surfaces remain the binding deliverable set;
  this slice consumes them, never modifies them.
- OPS-1 does not authorize a multi-county view, a multi-source
  aggregation view, or a non-Sync console surface. Those need
  their own policy slices.
- OPS-1 does not introduce new design tokens. The status colors
  reuse the existing terracotta brand palette (terra-green /
  terra-amber / terra-red / terra-grey).
- OPS-1 does not define how the console is surfaced in the
  TerraFusion shell's navigation (route registration,
  permissions, auth gating). That is the OPS-1-B implementation
  slice's choice within the established shell pattern.
- OPS-1 does not commit to a backend-driven vs. file-system-
  driven artifact-read path. OPS-1-B picks one based on the
  shell-app's actual filesystem-access posture; OPS-1-A lands
  only if the file-system path is rejected.
