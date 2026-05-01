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
BENTON-SYNC-2 — SyncAtlas schema-catalog health command
```

### Why BENTON-SYNC-2 is next

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

### What BENTON-SYNC-2 produces (anticipated, not binding)

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
| Invariant report artifact wiring                                     | After BENTON-SYNC-2 lands                                           |
| Per-loader preflight evidence rollup                                 | After BENTON-SYNC-2 lands                                           |
| C51-PII-E manifest authoring tool                                    | Needs fresh policy slice; operator-priority decision                |
| C50-CONV-D manifest authoring tool                                   | Needs fresh policy slice; operator-priority decision                |
| C52-OVR-E manifest authoring tool                                    | Needs fresh policy slice; operator-priority decision                |
| Comp eligibility read-surface schema-pin                             | When multi-county or HG4 audit posture demands it                   |
| Sales qualification coverage-continuity smoke                        | After diagnostic surfaces are in place                              |
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
- BENTON-SYNC-3+  : reselected from parked list. This inventory
                    is refreshed when the next-need is picked.

The track is operationally-driven. New entries land as concrete
bridge needs surface, not as architectural completeness goals.
