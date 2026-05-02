# BENTON-SYNC-CLOSE — Benton Sync Diagnostic Track Completion Handoff

**Slice:** BENTON-SYNC-8 (docs-only — closeout handoff for the
BENTON-SYNC-* diagnostic track. Marks the four major Benton Sync
diagnostic surfaces as complete and parks remaining work behind
explicit operator-priority / operational-reality gates.).

**Status:** track closed. New BENTON-SYNC-* entries land only when
a concrete operational gate (named below) opens.

**Authoritative cross-references:**

- `docs/sync/sync-boundary-policy.md` — SCOPE-1. The bridge
  boundary this track stayed inside.
- `docs/sync/sync-surface-inventory.md` — SCOPE-3. Per-surface
  classification of every Sync artifact.
- `docs/sync/benton-core-sync-next-need.md` — BENTON-SYNC-1
  inventory. Living document this handoff caps until a new
  parked item promotes.
- `docs/sync/pacs-schema-catalog-completion-handoff.md` —
  C48-CLOSE precedent. Same closeout shape applied to the C48
  catalog metadata-honesty arc.
- `docs/sync/pacs-schema-multi-county-catalog-completion-handoff.md`
  — C54-MULTI-CLOSE precedent. Same closeout shape applied to
  the multi-county foundation slice.

## Why this slice

BENTON-SYNC-1 (commit during the cohort) opened a track focused
on concrete Benton/Core Sync diagnostic work, with the explicit
discipline that the inventory would be refreshed when each
slice landed and the next-need would be reselected from a
parked list against then-current operational reality. Slices
2 through 7 delivered four major diagnostic surfaces against
the live Benton Harris PACS install:

1. Schema catalog health command.
2. Invariant report artifact.
3. Dictionary-loader preflight evidence artifact.
4. Sales qualification coverage-continuity smoke.

After BENTON-SYNC-7-C landed, the remaining parked items in the
inventory split into three classes that are NOT engineering-
sequence defaults:

- **Manifest authoring tools** (C50-CONV-D, C51-PII-E, C52-OVR-E)
  — gated on a fresh policy slice + operator-priority decision.
- **Multi-county / hot-reload / consumer-migration items**
  (C54-MULTI-E, C54-MULTI-PROMOTE-*, C54-MULTI-RELOAD-*) — gated
  on real operational reality (a second county, a real
  consumer, a workflow demand).
- **Cross-domain work** (TerraFlow / Forge / UI / Frontend) —
  outside this inventory's bridge boundary.

Without explicit operator priority or new operational reality,
auto-promoting any of these would be the same speculative-product-
expansion drift BENTON-SYNC-1 was opened to avoid. The principled
move is to close the track formally, just as C48-CLOSE closed
the C48 catalog arc and C54-MULTI-CLOSE closed the multi-county
foundation.

This slice is docs-only. It pins:

- Trusted state at closeout.
- The four completed diagnostic surfaces.
- Per-surface re-open conditions (analog of C48-CLOSE's
  "Reopen C48 only on hard-guard violation").
- The parked items, each with its named gate and what would
  trigger promotion.
- The boundary contract: TerraFlow / Forge / UI / Frontend
  remain outside this track's scope.

It does NOT change any code, test, or non-doc artifact. It does
NOT decide the order in which gated items would land if their
gates open. It does NOT pre-authorize any manifest engagement
or multi-county work.

## Trusted state at closeout

```text
main commit                       : 18377c105
latest completed slice            : BENTON-SYNC-7-C
Sync unit regression              : 244 / 244  (Schema + Sales)
Sync integration regression       : 915 / 915
catalog metadata-honesty pipeline : C48 → C53 + C54 family complete
single-county runtime             : Benton Harris PACS, operational
multi-county foundation           : staged, awaiting 2nd county
SyncAtlas modes                   : 10-way mutex (the four diagnostic
                                    modes plus six pre-existing modes)
canonical landing                 : operational
comp eligibility read surfaces    : operational
mapping workbook surfaces         : operational
dictionary loaders (10 configKeys): operational; FK + era + PII
                                    preflights wired with evidence
                                    capture
sales qualification               : transform + sample runner +
                                    canonical runner + coverage
                                    smoke; all four surfaces live
diagnostic-first Benton Sync track: COMPLETE
```

## The four completed diagnostic surfaces

| Diagnostic Surface     | Slice                  | Live proof Run ID    | Baseline doc                                                           | Purpose                                                                                       |
|------------------------|------------------------|----------------------|------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Schema catalog health  | BENTON-SYNC-2 / 3 / 4  | 20260502T010520Z     | `docs/sync/benton-pacs-catalog-health-baseline.md`                     | Operator one-shot pre-loader health check over the live PACS catalog (coverage / invariants). |
| Invariant artifact     | BENTON-SYNC-5          | 20260502T012736Z     | (recorded in `benton-pacs-catalog-health-baseline.md` slice ledger)    | Byte-stable JSON capture of the catalog's invariant report next to the captured stdout.       |
| Preflight evidence     | BENTON-SYNC-6-A/B/C    | 20260502T042535Z     | `docs/sync/benton-dictionary-loader-preflight-evidence-baseline.md`    | FK / era / PII preflight outcomes per dictionary-loader call rolled into byte-stable JSON.    |
| Coverage continuity    | BENTON-SYNC-7-A/B/C    | 20260502T050226Z     | `docs/sync/benton-sales-qualification-coverage-baseline.md`            | Forward / backward / drift gap report between PACS sale rows and `CanonicalSaleQualifications`. |

Each surface satisfies the same shape:

- A read-only SyncAtlas mode (CLI flag).
- An optional opt-in JSON evidence artifact (mirrors the
  BENTON-SYNC-5 `--invariant-artifact-path` / BENTON-SYNC-6-B
  `--preflight-evidence-path` / BENTON-SYNC-7-B
  `--coverage-evidence-path` engagement model).
- A live-PACS proof against Benton (Training and/or OLTP).
- A committed Benton evidence baseline for diff-against-future
  audits.
- Hard guards re-verified at the live proof: HG3 read-only,
  HG6 source-traceable, HG7 fail-closed, no-PII-in-artifact,
  county-scoped envelope.
- Leak scan zero-match across the standard pattern set AND a
  raw-value scan for the resolved SA password.

The four surfaces together give the Benton operator one-shot
diagnostic verdicts on the four state surfaces that matter
between Harris PACS and TerraFusion DB:

- **Catalog**: is the metadata pipeline honest about what
  Harris PACS exposes?
- **Invariants**: did the catalog's consistency engine accept
  the build?
- **Preflights**: did each dictionary loader's FK / era / PII
  preflight pass under live conditions?
- **Coverage**: does the canonical landing actually match the
  PACS source it was built from?

## Re-open conditions (binding)

The diagnostic track stays closed unless one of these
conditions holds verbatim. Each is named so an agent encountering
the inventory does not silently re-promote a parked item.

### Re-open BENTON-SYNC-2 (catalog health) only on:

- Catalog metadata pipeline drift surfaced by a future C48
  family slice.
- New invariant codes introduced and not reflected in the
  health command's breakdown.

### Re-open BENTON-SYNC-5 (invariant artifact) only on:

- C53-CONS-D writer drift (artifact format change).
- New consumer requiring a different artifact path / shape
  (would land as a new slice, not a 5 re-open).

### Re-open BENTON-SYNC-6 (preflight evidence) only on:

- New dictionary-loader configKey added without preflight
  stance migration (HG-FK-3 / HG-CONV-3 / HG-PII-3 violation).
- Stance enum extended with new values (Skipped factory
  semantics drift).

### Re-open BENTON-SYNC-7 (coverage continuity) only on:

- C8-A transform contract change that affects the canonical
  decision mapping.
- C35-B canonical landing schema change that affects the
  smoke's read shape.
- New gap class identified by an operator audit (e.g. a third
  axis added to the qualification transform).

## Parked items (each with its gate)

These are real Sync needs that exist on disk or in the
deferred-scope index. They are NOT authorized by this handoff.
Each parks until its named gate opens.

### Manifest authoring tools — operator-priority gate

| Parked item                        | Gate to promote                                                       |
|-----------------------------------|----------------------------------------------------------------------|
| C50-CONV-D conversion-era manifest | Operator decides Benton needs the post-2017 / pre-2017 era boundary  |
|   authoring tool                   |   pinned in code, AND a fresh C50-CONV-D-A policy slice lands.       |
| C51-PII-E PII classification       | Operator decides Benton needs PII columns hand-flagged for canonical-|
|   manifest authoring tool          |   landing reader gates, AND a fresh C51-PII-E-A policy slice lands.   |
| C52-OVR-E exported-FK manifest     | Operator decides Benton needs an FK that's InferredByName today      |
|   authoring tool                   |   promoted to Exported, AND a fresh C52-OVR-E-A policy slice lands.   |

None of the three are auto-promotable. Each requires both:

1. An operator-priority decision that the manifest itself is
   needed (not just "the tool would be nice to have").
2. A fresh policy slice opening the implementation gate.

### Multi-county / hot-reload / consumer items — operational-reality gate

| Parked item                                        | Gate to promote                                                              |
|---------------------------------------------------|------------------------------------------------------------------------------|
| C54-MULTI-E cross-county aggregation               | 3+ operationally-active counties (per C54-MULTI-CLOSE).                      |
| C54-MULTI-PROMOTE-* per-consumer migration         | A real consumer requesting set-resolution (per C54-MULTI-CLOSE).             |
| C54-MULTI-RELOAD-* runtime hot-reload              | Operator workflow demand for catalog hot-reload (per C54-MULTI-CLOSE).        |
| Comp eligibility read-surface schema-pin           | Multi-county or HG4 audit posture demands `PacsSchemaVersion` on read paths. |

None of the four are auto-promotable. Each waits for actual
operational reality to surface the need.

### Cross-domain items — outside this track's boundary

| Parked item                            | Gate to promote                                                          |
|---------------------------------------|--------------------------------------------------------------------------|
| TerraFlow workflow product             | Outside SCOPE-1 bridge boundary; would land under TerraFlow's own track. |
| Forge valuation / comp behavior        | Outside SCOPE-1 bridge boundary; would land under Forge's own track.      |
| Workbench / Studio operator UI         | Outside SCOPE-1 bridge boundary; would land under Workbench's own track. |
| Frontend / marketplace / suites        | Outside SCOPE-1 bridge boundary; would land under Frontend's own track.   |

These items DO have value and DO need to land. They simply do
not land under the BENTON-SYNC-* track. Each has its own track
that this closeout does not touch.

## Hard guards (binding even at closeout)

- This handoff does NOT authorize any code change. It
  documents state.
- This handoff does NOT reopen C48-CLOSE, C54-MULTI-CLOSE, or
  any C49-FK / C50-CONV / C51-PII / C52-OVR / C53-CONS family
  closure. Re-open conditions for those handoffs are
  authoritative in those documents verbatim.
- This handoff respects the Sync boundary. Items that cross
  into TerraFlow / Forge / UI / Frontend are listed only to
  mark them as parked-out-of-track, never as candidates.
- The "current operational reality" framing is operator-
  supplied. If reality changes, the BENTON-SYNC-1 inventory
  is refreshed and a new slice lands; the closeout itself is
  not silently reinterpreted.
- The four diagnostic surfaces are the binding deliverable
  set. Adding a fifth diagnostic surface to the closed track
  is NOT a future BENTON-SYNC slice; it would be a new family
  prefix authorized by a fresh policy slice.

## What "closed" means here

- The four diagnostic baselines remain valid evidence. They
  are the diff target for any future operational re-run.
- The four CLI modes remain in SyncAtlas. They are not
  removed; they continue to serve the operator's diagnostic
  workflow.
- The four artifact writers remain in the codebase. They are
  not removed; they continue to support opt-in evidence
  capture.
- BENTON-SYNC-* as a track stops accepting new entries except
  via a re-open condition above.
- The BENTON-SYNC-1 living inventory is capped at this point.
  When operational reality next surfaces a concrete bridge
  need, a new BENTON-SYNC-N entry lands; the inventory's
  parked-items table grows again at that point, not before.

## Default decision after this closeout

There is no engineering-sequence default after this handoff.
The next move is operator-driven, gated on one of:

```text
Manifest authoring needed       → C50/C51/C52 authoring tools (per gates above)
Second/third county arrives     → C54 multi-county reopen
Forge needs consumer behavior   → Forge track (outside this handoff)
Workflow needed                 → TerraFlow track (outside this handoff)
Operator UI needed              → Workbench/Studio track (outside this handoff)
Schema/catalog issue found      → Core Sync repair under appropriate family
```

Default-promotion-rule output for any agent reading this
inventory after BENTON-SYNC-8 lands: there is no auto-promotable
slice. The agent must surface "no engineering-sequence default
remains; awaiting operator priority on a gated item or a
concrete operational signal that opens a re-open condition."
This is the correct posture, not a loop violation.

## Acceptance for BENTON-SYNC-8

- [x] One file added at
  `docs/sync/benton-sync-diagnostic-track-completion-handoff.md`.
- [x] Four diagnostic surfaces enumerated with slice / run id /
  baseline doc / purpose.
- [x] Per-surface re-open conditions named.
- [x] Parked items enumerated with gates (manifest authoring +
  multi-county / hot-reload + cross-domain).
- [x] Hard guards re-stated.
- [x] BENTON-SYNC-1 inventory marked as capped at this slice
  with track-completion note.
- [x] README family-index entry added pointing here.
- [x] No code changes. No test changes. No non-doc artifact
  changes.

## Non-goals (explicit)

- BENTON-SYNC-8 does not promote any parked item.
- BENTON-SYNC-8 does not author any manifest.
- BENTON-SYNC-8 does not pre-rank the order in which gated
  items would land if their gates open. The operator decides
  that at the time the gate opens.
- BENTON-SYNC-8 does not delete or modify the four diagnostic
  CLI modes; they remain operational.
- BENTON-SYNC-8 does not delete or modify the four committed
  Benton baseline docs; they remain the binding evidence.
- BENTON-SYNC-8 does not amend any existing closed-handoff
  document (C48-CLOSE / C54-MULTI-CLOSE / family closures).

## Slice ledger note

This handoff caps the BENTON-SYNC-* track. Track entries:

- BENTON-SYNC-1   : DONE — inventory + default next.
- BENTON-SYNC-2   : DONE — schema-catalog health command.
- BENTON-SYNC-2-FIX1 : DONE — parser corrigendum.
- BENTON-SYNC-3   : DONE — live-PACS proof.
- BENTON-SYNC-4   : DONE — committed evidence baseline.
- BENTON-SYNC-5   : DONE — invariant artifact wiring + live proof.
- BENTON-SYNC-6-A : DONE — preflight evidence policy.
- BENTON-SYNC-6-B : DONE — preflight evidence implementation.
- BENTON-SYNC-6-C : DONE — preflight evidence live proof + baseline.
- BENTON-SYNC-7-A : DONE — coverage smoke policy.
- BENTON-SYNC-7-B : DONE — coverage smoke implementation.
- BENTON-SYNC-7-C : DONE — coverage smoke live proof + baseline.
- BENTON-SYNC-8   : DONE — this closeout. ← this slice
- BENTON-SYNC-9+  : NO AUTOMATIC NEXT. Requires a re-open
                    condition or a fresh operator-priority
                    decision. The agent's correct response to
                    "what's next?" after BENTON-SYNC-8 is
                    "no engineering-sequence default remains;
                    awaiting operator priority or a concrete
                    operational signal."
