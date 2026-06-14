# Work Order / PR Boundary Policy

**Status:** MANDATORY  
**Work Order:** WO-BRAIN-0021  
**Effective:** 2026-06-13

## Principle

Every work order produces exactly one PR. Every PR corresponds to exactly one work order.

## Sequencing

Work orders execute in dependency order. An agent must not start WO-N+1 until WO-N is either merged or explicitly deferred by the human.

## DB/Sync Gate

DB/data and TerraFusion Sync runtime proof work may proceed only after:

1. **WO-BRAIN-0021** (this work order) is merged — worktree isolation is policy.
2. A fresh isolated worktree is created for each subsequent work order.
3. The shared checkout is not used for agent work.
4. DB work starts with read-only **WO-DATA-000** (DB/Data Runtime Truth Gate).
5. Sync work starts with read-only **WO-SYNC-000** (Sync Runtime Truth Envelope) or follows DB truth if DB dependencies are unresolved.

## Sequencing Queue

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

No work order may skip ahead. Each work order's acceptance criteria must be met before the next begins.
