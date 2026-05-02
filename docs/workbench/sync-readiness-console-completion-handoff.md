# OPS-1-CLOSE — Sync Readiness Console Completion Handoff

**Slice:** OPS-2 (docs-only — closeout handoff for the OPS-1
family. Marks the Sync Readiness Console read path as complete
and parks remaining work behind explicit operator-state /
operational-reality gates.).

**Status:** OPS-1 read path closed. New OPS-1-* entries land
only when a concrete re-open condition (named below) opens or
the operator promotes a parked follow-up via a fresh policy
slice.

**Authoritative cross-references:**

- `docs/workbench/sync-readiness-console-policy.md` — OPS-1
  policy (six pinned questions, hard guards, test matrix).
- `docs/workbench/sync-readiness-console-wireframe.md` — OPS-1
  wireframe (panel layout, status colors, interaction model).
- `docs/workbench/sync-readiness-console-frontend-map.md` —
  OPS-1-B-PREP frontend shell route map.
- `docs/workbench/benton-sync-readiness-console-baseline.md` —
  OPS-1-C live evidence baseline.
- `docs/sync/benton-sync-diagnostic-track-completion-handoff.md`
  — BENTON-SYNC-CLOSE precedent. Same closeout shape applied
  to the upstream diagnostic track this console consumes.

## Why this slice

OPS-1 (commit `f935500e2`) opened the OPS-* track to address
the founder bottleneck after the BENTON-SYNC-* diagnostic
closeout: four working diagnostic surfaces existed, but no
control surface let the operator see them at a glance. Slices
OPS-1-A through OPS-1-C delivered a complete read-path control
surface against live Benton conditions:

| Slice          | Deliverable                                                                                   |
|----------------|-----------------------------------------------------------------------------------------------|
| OPS-1          | Policy + wireframe (docs).                                                                    |
| OPS-1-A        | Backend GET facade + DTOs + read service + 11 tests. Merge `ec5798d3e`.                       |
| OPS-1-A-2      | POST refresh + PACS probe + Process runner + 5 tests. Merge `7fff901fb`.                      |
| OPS-1-B-PREP   | Frontend shell route map (docs). Merge `e9cf7fea0`.                                            |
| OPS-1-B        | Frontend console (page + 4 components + hook + API client) + 8 acceptance tests. Merge `a335fd508`. |
| OPS-1-C        | Live HTTP evidence baseline against running TerraFusion.API. Merge `aa6e41c81`.                |

The **read path is complete**. The operator can:

1. Navigate to `/workbench/sync-readiness?countyId=…&sourceConnectionId=…&workbookId=…`.
2. See six pinned-question panels populated from the four
   committed BENTON-SYNC-* baselines.
3. Click Refresh to invoke the SyncAtlas diagnostic chain
   (POST `/api/workbench/sync-readiness/refresh`).
4. Compare against the committed Benton baseline at
   `docs/workbench/benton-sync-readiness-console-baseline.md`
   for diff-against-future audits.

After OPS-1-C landed, the remaining follow-ups split into two
classes that are NOT engineering-sequence defaults:

- **Operator-state proofs** (OPS-1-C-REFRESH, OPS-1-D) — gated
  on an operator-driven capture session (catalog-build wait,
  manual screenshot capture).
- **Cross-domain extensions** — gated on operational signal
  (multi-county view, multi-source aggregation, push-driven
  updates, manifest authoring tools, Forge / TerraFlow surfaces).

Without explicit operator priority or new operational reality,
auto-promoting either class would be the same speculative-
product-expansion drift the BENTON-SYNC-CLOSE handoff was
written to prevent. The principled move is to close the OPS-1
family formally.

This slice is docs-only. It pins:

- Trusted state at closeout.
- The completed deliverables.
- Per-deliverable re-open conditions.
- The parked follow-ups, each with its named gate.
- The boundary contract: Workbench owns the control surface;
  Sync owns the diagnostics; Forge / TerraFlow remain separate
  tracks.

It does NOT change any code, test, or non-doc artifact. It does
NOT decide the order in which gated items would land if their
gates open. It does NOT pre-authorize follow-up frontend or
backend work.

## Trusted state at closeout

```text
main commit                         : aa6e41c81
latest completed slice              : OPS-1-C
backend facade                      : OPS-1-A + OPS-1-A-2 — operational
  GET  /api/workbench/sync-readiness         : live, returns sanitized DTO
  POST /api/workbench/sync-readiness/refresh : live, runs probe + 3 SyncAtlas modes
frontend console                    : OPS-1-B — operational at /workbench/sync-readiness
  6 pinned-question panels                  : YES / WARN / NO / UNKNOWN per OPS-1 policy
  Refresh button                            : explicit-click only; no auto-refresh / no polling
unit tests
  Backend readiness service tests           : 11 / 11
  Backend refresh runner sanitization tests :  5 /  5
  Frontend Vitest acceptance tests          :  8 /  8
live evidence
  Captured DTO                              : OPS-1-C, run 20260502T153024Z
  Backend audit log                         : zero writes (read-only confirmed)
  Leak scan                                 : zero matches (pattern + raw-value)
upstream diagnostic surfaces consumed       : BENTON-SYNC-2 / 5 / 6-C / 7-C
OPS-1 family read path                       : COMPLETE
```

## What "closed" means here

- The console route remains at `/workbench/sync-readiness`. It
  is not removed; it continues to serve the operator's
  readiness workflow on demand.
- The two backend endpoints remain in
  `WorkbenchSyncReadinessController`. They are not removed.
- The 24 acceptance tests across OPS-1-A / 1-A-2 / 1-B remain
  in the test suites and run as part of normal regression.
- The OPS-1-C live evidence baseline at
  `docs/workbench/benton-sync-readiness-console-baseline.md`
  remains the binding diff target for future operational
  re-runs.
- OPS-1-* as a track stops accepting new entries except via a
  re-open condition below.

## Per-deliverable re-open conditions (binding)

Each deliverable stays closed unless one of these conditions
holds verbatim. Each is named so a future agent encountering
the OPS-1 family does not silently re-promote a parked item.

### Re-open OPS-1 policy / wireframe only on:

- A seventh question added to the console. Adding a question
  is NOT an OPS-1 amendment; it is a fresh OPS-2-Q* policy
  slice with its own test matrix and live proof.
- A change to the YES / WARN / NO / UNKNOWN status semantics.
  Same reasoning — a fresh policy slice.

### Re-open OPS-1-A / OPS-1-A-2 (backend) only on:

- A new diagnostic surface added to the BENTON-SYNC-* family
  (currently CLOSED). The OPS-1-A read service would need a
  new panel-builder method.
- A change to one of the four upstream artifact JSON shapes
  (preflight evidence, coverage report, etc.) that breaks the
  read service's `JsonDocument`-based parsing.
- A security / audit finding that the sanitization layer is
  insufficient.

### Re-open OPS-1-B (frontend) only on:

- A backend DTO change that breaks the frontend's TypeScript
  contract.
- A new design-token requirement that the existing
  `tf-status-*` family cannot satisfy.
- A11y finding (WCAG 2.1 AA) on the rendered console.

### Re-open OPS-1-C (baseline) only on:

- The committed evidence baseline diverges from a fresh live
  capture in a way that warrants a new committed snapshot.
  The procedure for a new baseline is in the existing baseline's
  "Re-running the proof" section — operator runs it; result
  becomes a new OPS-1-C-{run-id} baseline doc, not a re-open
  of OPS-1-C itself.

## Parked follow-ups (each with its gate)

These are real OPS-1-family follow-ups that exist in the
deferred-scope index. They are NOT authorized by this handoff.
Each parks until its named gate opens.

### Operator-state proofs — operator-session gate

| Parked item                                      | Gate to promote                                                                                      |
|--------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| OPS-1-C-REFRESH (POST `/refresh` live proof)     | Operator schedules a 15+ minute session to wait for the catalog-health subprocess (~200s per BENTON-SYNC-3) plus the preflight + coverage runs. The proof captures the per-surface refresh outcomes against live Benton OLTP under the bounded scan. |
| OPS-1-D (dual-boot screenshot baseline)          | Operator boots both the API and the frontend dev server, navigates the browser to the console route with a Benton scope, captures initial-render + post-refresh screenshots, leak-scans, commits to `docs/workbench/screenshots/` mirroring `docs/proof/screenshots/` precedent. |

Neither is auto-promotable. Each requires an operator session.

### Cross-domain extensions — operational-signal gate

| Parked item                                                | Gate to promote                                                                                           |
|-----------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Multi-county aggregation view                              | 3+ operationally-active counties (per BENTON-SYNC-CLOSE multi-county gate; OPS surface inherits).         |
| Multi-source-connection view (e.g. Training + OLTP same screen) | A workflow demand for inspecting both PACS connections side-by-side. Today the console scopes to one.   |
| Push-driven updates (SignalR)                              | Operator workflow demand for live readiness without explicit Refresh. Today: explicit-click-only is the disciplined posture. |
| Sample drilldown (forward-gap rows in coverage panel)      | Operator forensic-need demand. The OPS-1 wireframe pinned the disclosure shape; landing it is a fresh OPS-2-DRILL slice. |

None are auto-promotable. Each waits for actual operational
need.

### Adjacent control surfaces — fresh-track gate

| Parked item                                | Gate to promote                                                                                          |
|-------------------------------------------|---------------------------------------------------------------------------------------------------------|
| TerraFlow workflow control surface         | Outside this track's boundary; would land under TerraFlow's own track (e.g. OPS-TerraFlow-1 or new family). |
| Forge consumer-behavior control surface    | Outside this track's boundary; would land under Forge's own track.                                       |
| Studio mapping-authoring control surface   | Outside this track's boundary; would land under Workbench-for-mapping's own track.                       |
| Manifest authoring tools (C50/C51/C52)     | Sync-track parked items per BENTON-SYNC-CLOSE; not under OPS-*.                                          |

These items DO have value and DO need to land. They simply do
not land under the OPS-1-* family. Each has its own track that
this closeout does not touch.

## Boundary contract (binding)

The OPS-1 family established the following boundary that this
closeout pins:

- **Workbench owns the control surface.** OPS-* slices add /
  modify operator-facing control screens that READ from other
  domains.
- **Sync owns diagnostics.** The four diagnostic surfaces
  (catalog health / invariant artifact / preflight evidence /
  coverage continuity) are owned by the closed BENTON-SYNC-*
  track. The OPS-1 console READS them; it does NOT modify them.
- **Forge / TerraFlow / Studio remain separate.** Their own
  tracks land their own surfaces. No OPS-1 component touches
  Forge / TerraFlow / Studio internals.

Future OPS-* slices respect the same boundary by default. A
slice that wants to cross it MUST first land a fresh policy
slice opening the gate (per the BENTON-SYNC-CLOSE precedent).

## Hard guards (binding even at closeout)

- This handoff does NOT authorize any code change. It
  documents state.
- This handoff does NOT reopen BENTON-SYNC-CLOSE,
  BENTON-SYNC-* family closures, or any C-family closure.
  Re-open conditions for those handoffs are authoritative
  in those documents verbatim.
- This handoff respects the Workbench / Sync / Forge /
  TerraFlow / Studio boundary contract above. Items that
  cross are listed only to mark them as parked-out-of-track,
  never as candidates for OPS-1.
- The "current operational reality" framing is operator-
  supplied. If reality changes, a new OPS-* slice lands; the
  closeout itself is not silently reinterpreted.
- The six pinned questions are the binding deliverable set.
  Adding a seventh is NOT a future OPS-1 slice; it would be a
  new family prefix authorized by a fresh policy slice.

## Default decision after this closeout

There is no engineering-sequence default after this handoff
within the OPS-1 family. The next move is operator-driven,
gated on one of:

```text
Operator-session demand for live refresh proof  → OPS-1-C-REFRESH
Operator-session demand for screenshot baseline → OPS-1-D
3+ operational counties                          → multi-county view
Forensic drilldown demand                        → OPS-2-DRILL
Forge consumer behavior demand                   → Forge track
TerraFlow workflow demand                        → TerraFlow track
Studio authoring UI demand                       → Studio track
Manifest authoring demand                        → Sync track parked items
New control surface idea                         → fresh OPS-N policy slice
```

Default-promotion-rule output for any agent reading this
handoff after OPS-2 lands: there is no auto-promotable slice
within OPS-1-*. The agent's correct response to "what's next?"
is "OPS-1 is closed; awaiting operator priority on a gated
follow-up or a concrete operational signal that opens a
re-open condition or a new track." This matches the
BENTON-SYNC-CLOSE posture.

## Acceptance for OPS-2

- [x] One file added at
  `docs/workbench/sync-readiness-console-completion-handoff.md`.
- [x] Six OPS-1 family deliverables enumerated with merge
  commit hashes.
- [x] Per-deliverable re-open conditions named.
- [x] Parked follow-ups enumerated with gates (operator-state
  proofs + cross-domain extensions + adjacent control
  surfaces).
- [x] Boundary contract pinned (Workbench / Sync / Forge /
  TerraFlow / Studio).
- [x] Hard guards re-stated.
- [x] Default-promotion-rule note: no auto-promotable slice
  within OPS-1-* after this handoff.
- [x] No code changes. No test changes. No non-doc artifact
  changes.

## Non-goals (explicit)

- OPS-2 does not promote any parked follow-up.
- OPS-2 does not run the deferred refresh proof or capture
  screenshots.
- OPS-2 does not amend the OPS-1 policy or wireframe; both
  remain authoritative.
- OPS-2 does not delete or modify the console route, the
  backend endpoints, or the committed Benton baseline; they
  remain operational.
- OPS-2 does not pre-rank the order in which gated items would
  land if their gates open. The operator decides at the time
  the gate opens.
- OPS-2 does not amend BENTON-SYNC-CLOSE or any C-family
  closure handoff.

## Slice ledger note

This handoff caps the OPS-1 read-path family. Track entries:

- OPS-1          : DONE — policy + wireframe.
- OPS-1-A        : DONE — backend GET facade + read service + 11 tests.
- OPS-1-A-2      : DONE — POST refresh + PACS probe + Process runner + 5 tests.
- OPS-1-B-PREP   : DONE — frontend shell route map.
- OPS-1-B        : DONE — frontend console + 8 acceptance tests.
- OPS-1-C        : DONE — live evidence baseline.
- OPS-2          : DONE — this closeout. ← this slice
- OPS-1-C-REFRESH: PARKED — operator-session gate.
- OPS-1-D        : PARKED — operator-session gate.
- OPS-2-N+       : NO AUTOMATIC NEXT within OPS-1-*. Requires a
                   re-open condition or a fresh operator-priority
                   decision.

The OPS-1 family is operationally-driven from this point.
New entries land only when a concrete operational signal
surfaces, not as architectural completeness goals.
