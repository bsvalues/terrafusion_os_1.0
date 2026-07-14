# Work Order / PR Boundary Policy

**Status:** MANDATORY  
**Work Order:** WO-BRAIN-0021  
**Effective:** 2026-06-13

## Principle

Every work order produces exactly one PR. Every PR corresponds to exactly one work order.

## Scheduling

Work orders execute when their declared dependencies are satisfied and their path, contract, and
environment reservations do not conflict with another active lane. Dependency-cleared work orders
may run concurrently in separate isolated worktrees. A blocked lane does not freeze unrelated lanes.

There is no repository-wide `WO-N` / `WO-N+1` serialization rule. Ordering is binding only when an
active Work Order, program graph, or reservation contract records the dependency.

## DB/Sync Gate

DB/data and TerraFusion Sync runtime proof work may proceed only after:

1. **WO-BRAIN-0021** (this work order) is merged — worktree isolation is policy.
2. A fresh isolated worktree is created for each subsequent work order.
3. The shared checkout is not used for agent work.
4. DB work starts with read-only **WO-DATA-000** (DB/Data Runtime Truth Gate).
5. Sync work starts with read-only **WO-SYNC-000** (Sync Runtime Truth Envelope) or follows DB truth if DB dependencies are unresolved.

## Historical Sequencing Queue

The following queue is the point-in-time DB/Sync plan captured by `WO-BRAIN-0021`. It is retained as
historical provenance, not as the active global portfolio queue. The DB and Sync dependency ordering
inside this plan remains binding when these WOs are resumed; it does not block unrelated programs.

```
WO-BRAIN-0021  Agent Worktree Isolation          ← THIS PR
WO-DATA-000    DB/Data Runtime Truth Gate         (read-only audit)
WO-DATA-001    Migration Status Baseline Proof
WO-DATA-002    Domain Coverage + CountyId Proof
WO-DATA-003    Seed/Fixture Provenance Cleanup
WO-DATA-004    CAMA/PACS Import Contract Proof
WO-DATA-005    TerraDais Persistence Completion
WO-DATA-006    TerraTrace Event Persistence Proof
WO-DATA-007    Sync Checkpoint/Job State Proof
WO-DATA-008    DB Runtime Harness
WO-SYNC-000    Sync Runtime Truth Envelope        (planning only)
WO-SYNC-001    Runtime Entrypoint Verification
WO-SYNC-002    Config/Environment Contract
WO-SYNC-003    Health/Status Endpoint Proof
WO-SYNC-004    Data Flow / Persistence Proof
WO-SYNC-005    Error/Retry Semantics
WO-SYNC-006    TerraTrace Integration
WO-SYNC-007    Diagnostic Surface
WO-SYNC-008    Runtime Proof Harness
WO-RUNTIME-000 Combined DB + Sync + LocalOps Proof
```

Within each declared DB or Sync dependency chain, a dependent work order may not skip its predecessor.
`WO-RUNTIME-000` depends on the required DB and Sync proof. Other dependency-cleared work proceeds
under the active Brain queue and reservation model.
