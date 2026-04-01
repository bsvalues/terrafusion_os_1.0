# TerraFusion OS Full-Ecosystem Design Audit and Realization Plan

**Date**: 2026-03-28  
**Status**: ACTIVE — top-level demo strategy  
**Authority**: Founder request to implement the design-first audit plan  
**Supersedes as master plan**: Phase 34 and Phase 35 as top-level strategy documents

## Purpose

Recast the current execution work into a design-first master plan for the full client demo.

This document is the controlling plan for demo realization. Existing slice plans remain useful execution ledgers, but they now operate under:

- the GUI canon in [2026-03-28-full-ecosystem-demo-gui-canon-design.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\specs\2026-03-28-full-ecosystem-demo-gui-canon-design.md)
- the product inventory in [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)
- the launch registry in [2026-03-28-full-ecosystem-demo-launch-registry.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-launch-registry.md)
- the execution backlog in [2026-03-28-full-ecosystem-demo-tranche-backlog.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-tranche-backlog.md)

## Deliverables

This plan is complete only when these three artifacts stay in sync:

1. GUI canon spec
2. Full-ecosystem surface matrix
3. Launch registry and tranche backlog
4. Execution waves and proof references in this plan

## Operating Rules

- Visual-system decisions lead runtime work.
- No new module implementation starts without a matrix row and planning contract fields.
- Demo breadth is allowed only with truthful state labeling.
- `must-be-live` surfaces cannot close on design-only proof.
- `may-be-queued` surfaces must still be visually intentional and non-misleading.
- Existing Phase 34 and 35 work must be mapped back to matrix rows before closure is claimed.

## Tranche A — Visual System

**Goal:** lock the visual and interaction canon for all visible surface families.

Required outputs:
- shell desktop archetype
- suite-home archetype
- workbench archetype
- standalone-module archetype
- bounded-workspace archetype
- governance-surface archetype

Exit condition:
- every archetype has acceptance language for header, KPI framing, module hierarchy, truth disclosure, and error/loading/empty behavior

## Tranche B — Ecosystem Truth Audit

**Goal:** classify every visible surface in the matrix as aligned, misaligned, misleading, or missing.

Audit procedure per row:
1. Confirm current host and route/window behavior
2. Confirm parcel scope and AI role
3. Confirm real dependency
4. Confirm actual truth state
5. Confirm whether current GUI matches the archetype
6. Confirm demo tier

Required output:
- matrix row filled with current truth state, proof status, and owner wave

Exit condition:
- no visible client-demo surface remains unclassified

## Tranche C — Demo Realization

**Goal:** bring all `must-be-live` rows to canonical demo state and make `may-be-queued` rows intentional.

Priority order:
1. Shell and launch surfaces
2. Suite homes
3. Property Workbench host and tabs
4. Standalone modules surfaced by suite homes
5. GPT bounded workspace
6. Canon and governance/admin/monitoring pages on the demo path

Implementation rule:
- if a surface cannot be made live in time, it must be redesigned as `queued` or `unavailable` or removed from the demo path

## Tranche D — Proof

**Goal:** require the same proof model across all demo-visible surfaces.

Mandatory proof per `must-be-live` row:
- visual screenshot proof
- runtime launch proof
- data-source honesty proof
- design-system compliance proof
- demo-flow proof from shell entry to completed user path

Mandatory proof per `may-be-queued` row:
- visual screenshot proof
- explicit queued or unavailable disclosure proof
- proof that no live claims are overstated

## Phase 34 / 35 Reconciliation

### Phase 34

Phase 34 remains the evidence ledger for:
- Atlas parcel-tab wiring
- Dais management proof
- parcel-count live KPI wiring
- integration gate outputs already sealed

Required reconciliation:
- every sealed Phase 34 card must map to one or more matrix rows
- proof-only seals cannot substitute for missing GUI-canon alignment

### Phase 35

Phase 35 remains the execution wave for:
- stub elimination
- runtime screenshot proof
- live versus unavailable disclosure cleanup

Required reconciliation:
- every lane must reference the matrix rows it advances
- a fixture-removal lane is incomplete if the resulting surface still violates the archetype or truth-state rules

## Acceptance Criteria

- The GUI canon is the explicit source of truth for visible demo surfaces.
- The matrix covers shell, suite homes, workbench tabs, standalone modules, GPT, Canon, and visible governance/admin pages.
- Phase 34 and Phase 35 are formally subordinate execution waves, not competing master strategies.
- Every demo-visible surface has a declared truth state, demo tier, dependency, and proof status.
- No client-demo path depends on implied or unlabeled fake readiness.

## Immediate Next Actions

1. Use the matrix as the backlog spine for remaining frontend realization work.
2. Re-label any visible surface that is currently overstating readiness.
3. Open execution only against rows marked `must-be-live` or intentionally `may-be-queued`.
4. Capture screenshot proof by archetype, not just by isolated page.
