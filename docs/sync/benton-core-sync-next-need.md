# Benton / Core Sync — Next-Need Inventory

**Slice:** BENTON-SYNC-1 (docs-only — single-page inventory of the
current Benton Core Sync state with one named default next
implementation slice. Replaces the post-close drift toward
speculative product expansion with one concrete, operationally
useful Benton bridge need.).
**Status:** living inventory; refreshed when the named default
slice lands.

**Authoritative cross-references:**

- `docs/sync/sync-boundary-policy.md` — SCOPE-1. The bridge
  boundary this inventory stays inside.
- `docs/sync/sync-surface-inventory.md` — SCOPE-3. Per-surface
  classification of every Sync artifact.
- `docs/sync/pacs-schema-catalog-completion-handoff.md` —
  C48-CLOSE master handoff and deferred-scope index.
- `docs/sync/pacs-schema-multi-county-catalog-completion-handoff.md`
  — C54-MULTI-CLOSE. Confirms multi-county is parked until
  operational reality demands it.
- `docs/sync/README.md` — Sync doc family index.

## Why this slice

C54-MULTI-CLOSE landed at commit `761721800`. The multi-county
foundation is functionally complete for Benton-only operating
reality and intentionally parked until a real second / third
county arrives. Without explicit direction, the natural agent
behavior is to expand the next-deferred slot (C54-MULTI-E
cross-county aggregation) — speculative product surface that
drifts before it ever runs in anger.

The operator's standing direction is the opposite: return to
**concrete Benton/Core Sync work** grounded in the existing
bridge surfaces. This inventory enumerates those surfaces,
filters to ones that already exist on disk, and names exactly
one default next implementation slice.

No option buffet. No menu. One named default with rationale.

## Trusted state at this inventory

```text
main commit                            : 761721800
latest completed slice                 : C54-MULTI-CLOSE
Sync unit regression                   : 389 / 389
catalog metadata-honesty pipeline      : C48 → C53 + C54 family complete
single-county runtime                  : Benton Harris PACS, operational
multi-county foundation                : staged, awaiting 2nd county
SyncAtlas                              : operational
canonical landing                      : operational
comp eligibility read surfaces         : operational
mapping workbook surfaces              : operational
dictionary loaders (10 configKeys)     : operational; FK + era + PII preflights wired
```

## Bridge boundary (binding for this inventory)

This inventory considers ONLY work that is:

- Inside the Sync boundary (legacy source → TerraFusion DB
  bridge — Harris PACS metadata / extraction / canonical landing
  / read surfaces / preflights / catalog).

It explicitly EXCLUDES:

- TerraFlow workflow product
- Forge valuation / comp behavior beyond what already lives in
  the Sync read surface
- Workbench / Studio operator UI
- Frontend, marketplace, suites
- Multi-county expansion past what C54-MULTI-CLOSE already
  preserves
- Speculative future families with no current operational
  trigger (e.g., dynamic catalog reload)

## Concrete Benton Core Sync needs (current)

Items here exist as gaps in the current Sync surface that have
real operational value to Benton today. Each is gated to its own
slice if and when promoted; no implementation is authorized by
this inventory itself.

### Operational diagnostic surfaces

1. **SyncAtlas schema-catalog health command.** The catalog is
   built at startup; today the only way to inspect its state is
   to read logs or shell into the running process. A SyncAtlas
   subcommand that prints catalog identity, coverage counts,
   manifest engagement, invariant report summary, and FK
   confidence breakdown gives the operator one-shot health
   verification before running loaders.
   *Gate: BENTON-SYNC-2 (next default).*

2. **Invariant report artifact wiring.** `PacsSchemaInvariantReport
   Artifact.WriteAsync` exists (C53-CONS-D) but no caller invokes
   it. SyncAtlas catalog-build runners could opt to write the
   report next to existing evidence artifacts so audits see the
   same byte-stable JSON the engine produced. Future slice once
   the health command lands.

3. **Per-loader preflight evidence.** SyncAtlas dictionary loaders
   currently log preflight outcomes to stdout (FK / era / PII).
   The operator wants those rolled up into the existing evidence
   artifact pattern (`backend/artifacts/sync-atlas/...`) for the
   record. Future slice.

### Catalog-driven loader gaps

4. **Operator manifest authoring tool (PII).** The C51-PII-B
   manifest exists but has no authoring tool. C51-PII-E was named
   in policy as deferred. An MVP — a SyncAtlas command that lists
   PACS columns matching operator-supplied sensitive-name
   patterns and lets the operator commit / skip per column —
   gives Benton the practical path to first-PII-tagging without
   hand-editing JSON.
   *Future slice; not the next default — needs a fresh policy
   slice (C51-PII-E-A) first.*

5. **Conversion-era manifest authoring tool.** Same shape as
   above for C50-CONV-D. Deferred under the same gate as
   C51-PII-E.

6. **Exported FK manifest authoring helper.** Same shape for
   C52-OVR-E. Deferred until operator workflow demands it.

### Read-surface gaps

7. **Comp eligibility read surface schema-pin.** The
   `/api/sync/comps/...` endpoints exist but don't pin to a
   specific catalog version. With multi-county foundation
   staged, future canonical-landing readers SHOULD pin
   `PacsSchemaVersion` for HG4 traceability. Future slice; not
   the next default — single-county runtime today doesn't fail
   from this absence.

### Canonical landing gaps

8. **Sales qualification transform — coverage continuity proof.**
   The transform exists (C19-A through C28); no slice yet
   demonstrates end-to-end "every PACS sales row that should
   land lands, and every land-row traces to its source." A
   coverage-continuity smoke would prove the bridge holds. Real
   operational value but lower priority than diagnostics.
   Future slice.

## Default next implementation slice

```text
BENTON-SYNC-7-B — sales qualification coverage-continuity smoke implementation
```

Slice promotion path so far:

- BENTON-SYNC-2 (catalog-health command) landed at `commit be308ff28`.
- BENTON-SYNC-5 (invariant report artifact) landed at `commit d753c61af`.
- BENTON-SYNC-6-A / 6-B / 6-C (per-loader preflight evidence policy +
  impl + live proof + baseline) landed in order, last at merge `7f95f06ee`.
- BENTON-SYNC-7-A (this slice) pins the policy for the next parked
  item — sales qualification coverage-continuity smoke. BENTON-SYNC-7-B
  is the implementation half.

The earlier BENTON-SYNC-2 / 6-B rationale blocks below are retained
as the historical record of why each diagnostic was the right next
move; the BENTON-SYNC-7-B rationale appears under "Why BENTON-SYNC-7-B
is next" below them.

### Why BENTON-SYNC-7-B is next

- **Inside the bridge boundary.** Read-only smoke over canonical
  landing + live PACS + workbook. No mutation of any of the three.
- **Promotes the inventory's parked item #8.** Sales qualification
  coverage-continuity proof was named in BENTON-SYNC-1 as gated
  on diagnostic surfaces being in place. The diagnostic surfaces
  are now in place: BENTON-SYNC-2 (catalog health), BENTON-SYNC-5
  (invariant artifact), BENTON-SYNC-6 (preflight evidence). The
  gate is satisfied.
- **Reuses the BENTON-SYNC-6 precedent.** Same `--qualify-sales-coverage`
  mode + `--coverage-evidence-path` artifact engagement model as
  the BENTON-SYNC-6-A / 6-B family. Policy-then-impl-then-live-proof
  cadence stays consistent.
- **Operationally useful for Benton today.** The C36 canonical
  runner has been writing rows; no slice yet proves "every PACS
  row that should land lands and every land-row traces to its
  source." The smoke produces that verdict on demand.
- **Single-county shape.** Records carry the
  `(CountyId, WorkbookId, SourceConnectionId)` triple; multi-county
  aggregation stays parked.
- **Policy-then-implementation cadence.** BENTON-SYNC-7-A pinned
  the schema; BENTON-SYNC-7-B writes the code. No blank-page
  ambiguity.

### Why BENTON-SYNC-2 was next (historical)

- **Inside the bridge boundary.** Pure Sync diagnostic; no
  workflow / Forge / UI / frontend involvement.
- **Uses what already exists.** The C48-C53 catalog metadata-
  honesty pipeline is complete. Adding a one-shot health
  command surfaces what's already there; it doesn't ask the
  catalog to do anything new.
- **Non-blocking, additive.** A new SyncAtlas subcommand that
  builds the catalog (or accepts an already-built one) and
  prints state. Doesn't mutate workbook, doesn't mutate PACS,
  doesn't change any existing path.
- **Operationally useful for Benton today.** Before running
  dictionary loaders, the operator currently has no way to ask
  "is the catalog healthy?" without reading logs. The health
  command makes that one-shot.
- **Builds toward later evidence-artifact wiring.** The same
  data the health command prints will later be persisted via
  C53-CONS-D's `PacsSchemaInvariantReportArtifact` writer when
  a future slice wires it.
- **Single-county shape.** No multi-county machinery is needed;
  the command takes one source-connection identifier and
  produces one health report. C54-MULTI stays parked.
- **No new policy required.** This slice can land as combined
  doc + impl + tests because it's a pure diagnostic over
  existing surfaces.

### Why BENTON-SYNC-6-B is next

- **Inside the bridge boundary.** SyncAtlas-only artifact write;
  no PACS mutation, no TerraFusion DB mutation, no UI surface.
- **Promotes the inventory's parked item #3.** Per-loader preflight
  evidence rollup was named in BENTON-SYNC-1 as gated on
  BENTON-SYNC-2 landing. BENTON-SYNC-2 landed at `be308ff28`,
  so the gate is satisfied.
- **Reuses the BENTON-SYNC-5 precedent.** The
  `--invariant-artifact-path` engagement model is byte-for-byte
  the same as the new `--preflight-evidence-path` flag. Operator-
  chosen path, opt-in only, fail-fast on write failure.
- **Operationally useful for Benton today.** Preflight outcomes
  currently scroll past in stdout. Capturing them in a byte-stable
  artifact lets BENTON-SYNC-4 / future BENTON-SYNC-6-C-style
  baselines diff loader behavior over time, and lets audits see
  exactly which preflights ran and what they returned.
- **Single-county shape.** Records carry the catalog identity
  envelope. Multi-county aggregation stays parked.
- **Policy-then-implementation cadence.** BENTON-SYNC-6-A pinned
  the schema; BENTON-SYNC-6-B writes the code. No blank-page
  ambiguity.

### What BENTON-SYNC-2 produced (historical, for reference)

A `sync-atlas schema-catalog-health --connection-id <id>`
subcommand that emits structured output like:

```text
[sync-atlas] Schema catalog health
  CountyId / SourceConnectionId : (operator-supplied)
  PacsRelease                    : Harris PACS 9.0.4.x
  Coverage                       : 2229 tables, 32750 columns, 210 dictionaries
  IngestedAtUtc                  : 2026-04-30T17:12:34Z

[sync-atlas] Invariant report
  Set version                    : 1.1.0
  Errors                         : 0
  Warnings                       : 14   (DICT-005 × 9, FK-006 × 5)
  Advisories                     : 0
  IsClean                        : true

[sync-atlas] FK confidence breakdown
  Declared                       : 1633
  Exported                       : 0    (no exported FK manifest engaged)
  InferredByName                 : 47

[sync-atlas] Manifest engagement
  Conversion manifest            : not engaged
  PII manifest                   : not engaged
  Exported FK manifest           : not engaged
```

The exact format is the implementation slice's choice; this is
the conceptual shape.

## Parked items (not the next default)

These are real Sync needs that exist on disk or in the deferred-
scope index. They are NOT authorized by this inventory. Each
parks until either operational reality demands it or the operator
explicitly elevates it.

| Parked item                                                          | Gate                                                                |
|----------------------------------------------------------------------|---------------------------------------------------------------------|
| Invariant report artifact wiring                                     | DONE — BENTON-SYNC-5 (`commit d753c61af`)                            |
| Per-loader preflight evidence rollup                                 | DONE — BENTON-SYNC-6-A policy + 6-B impl + 6-C live proof + baseline |
| C51-PII-E manifest authoring tool                                    | Needs fresh policy slice; operator-priority decision                |
| C50-CONV-D manifest authoring tool                                   | Needs fresh policy slice; operator-priority decision                |
| C52-OVR-E manifest authoring tool                                    | Needs fresh policy slice; operator-priority decision                |
| Comp eligibility read-surface schema-pin                             | When multi-county or HG4 audit posture demands it                   |
| Sales qualification coverage-continuity smoke                        | IN PROGRESS — BENTON-SYNC-7-A policy DONE; BENTON-SYNC-7-B impl NEXT |
| C54-MULTI-E cross-county aggregation                                 | 3+ operational counties (per C54-MULTI-CLOSE)                       |
| C54-MULTI-PROMOTE-* per-consumer migration                           | Real consumer needing set-resolution (per C54-MULTI-CLOSE)          |
| C54-MULTI-RELOAD-* runtime hot-reload                                | Operator workflow demand (per C54-MULTI-CLOSE)                      |
| TerraFlow / Forge / UI / Frontend work                               | Outside this inventory's bridge boundary                            |

## Hard guards (binding even for inventory)

- This inventory does NOT authorize any code change. It picks
  one default; the implementation slice owns its own gates.
- This inventory does NOT reopen C48-CLOSE, C49-FK-CLOSE-equivalent
  family completions, or C54-MULTI-CLOSE. Re-open conditions are
  in those handoffs verbatim.
- This inventory respects the Sync boundary. Items that cross
  into TerraFlow / Forge / UI / Frontend are listed only to mark
  them as parked-out-of-scope, never as candidates.
- The "current operational reality" framing is operator-supplied.
  If reality changes (a second county lands, a new PACS source
  enters scope, an audit demand appears) this inventory is
  refreshed in a future BENTON-SYNC-N slice — not silently
  reinterpreted.

## Acceptance for BENTON-SYNC-1

Docs-only slice. Acceptance criteria:

- [x] One file added at
  `docs/sync/benton-core-sync-next-need.md`.
- [x] Trusted state captured (main, regression count, family
  completion status).
- [x] Concrete Benton needs enumerated (8 items).
- [x] Speculative items explicitly excluded (multi-county
  expansion, Forge, TerraFlow, UI / frontend).
- [x] One default next implementation slice named
  (BENTON-SYNC-2) with rationale and shape.
- [x] Parked items listed with explicit gates.
- [x] No code changes; no test changes; no policy doc changes
  beyond the README family-index update.

## Non-goals (explicit)

- BENTON-SYNC-1 is not the SyncAtlas health command. The next
  slice (BENTON-SYNC-2) is.
- BENTON-SYNC-1 does not endorse the Anticipated Output format
  for BENTON-SYNC-2. The implementation slice picks its own
  format; the example here is illustrative.
- BENTON-SYNC-1 does not authorize manifest authoring tooling,
  multi-county expansion, or any UI work. Those need their own
  slices and policy authorization.
- BENTON-SYNC-1 does not commit to BENTON-SYNC-3 or beyond.
  After BENTON-SYNC-2 lands, this inventory is refreshed; the
  next-need is reselected from the parked list against then-
  current operational reality.

## Slice ledger note

This inventory marks the start of a new BENTON-SYNC-* track
focused on concrete bridge work for the current operational
reality. Track entries:

- BENTON-SYNC-1   : DONE — inventory + default next.
- BENTON-SYNC-2   : DONE — SyncAtlas `--schema-catalog-health`
                    command landed. PacsSchemaCatalogHealthReporter
                    + PacsSchemaCatalogHealthReport record + Run
                    method in SyncAtlas Program.cs + 12 unit tests.
- BENTON-SYNC-2-FIX1 : DONE — parser corrigendum. The
                    `--schema-catalog-health` flag was missing its
                    mode-validation branch in `CliArgsParser.Parse`,
                    causing fall-through to the load-pacs-dictionary
                    `else` and a wrong-mode error message. Surfaced
                    by BENTON-SYNC-3's first attempt; fixed in
                    `commit 55a1d82c2` with a regression-pinning
                    integration test.
- BENTON-SYNC-3   : DONE — live-PACS proof against Benton OLTP
                    (Run ID 20260502T010520Z). Exit 0; clean
                    invariant report (0 Errors, 721 FK-006
                    Warnings); coverage 2229 / 32750 / 210; leak
                    scan zero-match. Marker `commit be308ff28`.
- BENTON-SYNC-4   : DONE — committed evidence baseline at
                    `docs/sync/benton-pacs-catalog-health-baseline.md`.
                    Pins the live state so future catalog builds
                    can be diffed against it.
- BENTON-SYNC-5   : DONE — invariant report artifact wired into
                    `--schema-catalog-health` via the new
                    `--invariant-artifact-path` flag. Live proof
                    Run ID 20260502T012736Z produced a 400 KB
                    byte-stable invariant-report.json with all 721
                    FK-006 rows. Merge `commit d753c61af`. Sync
                    regression 401/401.
- BENTON-SYNC-6-A : DONE — per-loader preflight evidence policy at
                    `docs/sync/dictionary-loader-preflight-evidence-policy.md`.
                    Pins artifact shape, CLI engagement model
                    (`--preflight-evidence-path`), hard guards, and
                    BENTON-SYNC-6-B test matrix.
- BENTON-SYNC-6-B : DONE — implementation slice. Adds the parser
                    case, the `DictionaryLoaderPreflightEvidence`
                    record + writer, dictionary-loader
                    instrumentation, and 12 acceptance tests
                    (4 parser + 8 writer/builder). Merge
                    `commit 0d8a02d57`. Schema unit 239/239,
                    parser 194/194, sync integration 899/899.
- BENTON-SYNC-6-C : DONE — live PACS proof at Run ID
                    20260502T042535Z against Benton PACS
                    Training. Exit 0; clean preflight evidence
                    artifact (FK / era / PII all Pass; manifests
                    honestly not-engaged; 1/1/1 summary counts;
                    leak scan zero-match including raw-value
                    grep). Committed evidence baseline at
                    `docs/sync/benton-dictionary-loader-preflight-evidence-baseline.md`.
                    Reconciled BENTON-SYNC-6-A failure-semantics
                    wording in the policy doc to match the
                    BENTON-SYNC-5 best-effort artifact write
                    precedent.
- BENTON-SYNC-7-A : DONE — sales qualification coverage-continuity
                    smoke policy at
                    `docs/sync/sales-qualification-coverage-continuity-smoke-policy.md`.
                    Pins smoke definition (forward / backward /
                    drift gaps), report shape, CLI engagement model
                    (`--qualify-sales-coverage` mode-mutex member +
                    `--coverage-evidence-path` opt-in artifact),
                    hard guards (HG3 / HG6 / HG7 / no-PII / county-
                    scoped / no-autoremediation), and BENTON-SYNC-7-B
                    test matrix. ← this slice
- BENTON-SYNC-7-B : NEXT — implementation slice. Adds parser case +
                    mode-mutex update + report record types +
                    `ISalesQualificationCoverageRunner` interface +
                    SQL implementation + writer + test matrix from
                    the policy doc.
- BENTON-SYNC-7-C : OPTIONAL FUTURE — committed Benton evidence
                    baseline once BENTON-SYNC-7-B's first live run
                    produces a clean (or forensically-useful)
                    report (mirrors BENTON-SYNC-6-C's role for the
                    preflight evidence baseline).
- BENTON-SYNC-8+  : reselected from parked list. This inventory
                    is refreshed when the next-need is picked.

The track is operationally-driven. New entries land as concrete
bridge needs surface, not as architectural completeness goals.
