# WO-BRAIN-0023 — MERGE-BACK-PLAN (loop/benton-cama-gla-gap → integration branch)

- **Risk:** R3 (branch/merge strategy — operator approval class) · **Suite:** OS governance / Brain · **Agent:** Claude Code (plan) + operator (approval)
- **Separation:** merge-back is NOT part of Phase 3 verification (operator directive 2026-06-10). This WO produces the PLAN; execution requires explicit operator approval.

## What must merge
`loop/benton-cama-gla-gap` @ `f32863883` is the ONLY ref containing all six Phase-3 commits. The current integration branch (`feat/june10-dev39-runtime-truth`, rebuilt 2026-06-10) contains NONE of them by SHA:
- `79d801eec` — GLA "Proof pending", never false 0 (frontend)
- `f32863883` — auth token on all `/api/forge/*` calls (frontend)
- `61c3f5ea9` — owner binding to canonical owner spine (frontend)
- `0d7785644` — LAST SALE bound to real ComparableSales history (frontend)
- `aae00fda9` — CompsForge lookback window taxYear−3 (backend, ADR-0019)
- `9dc2ff5cb` — IncomeForge runtime path (backend)
(Verify-by-content first: the rebuilt branch may have absorbed equivalents of some via ports — diff before cherry-picking to avoid double-application.)

## Acceptance criteria (operator's six, verbatim)
1. Branch is clean.
2. All required commits are present.
3. Runtime proof passes after checkout.
4. No fleet reorg conflict touches the same files.
5. Merge plan lists exact commits/files.
6. Rollback path is documented.

## Plan skeleton (to finalize at execution)
1. `git -C <loop-worktree> status --short` must be empty (criterion 1).
2. Per-commit `git diff <integration>..<sha> -- <files>` to classify: missing / already-equivalent / conflicting (criteria 2+4). File manifest goes in the plan.
3. Land as either (a) merge `loop/benton-cama-gla-gap` into integration (preserves history, brings any other loop commits — enumerate them first), or (b) cherry-pick the six (surgical). Decision = operator (history vs surgery).
4. Post-land runtime proof: re-run the Phase-3 browser checklist from the INTEGRATION branch runtime (criterion 3) — evidence: `docs/brain/evidence/PHASE3-runtime-verification-2026-06-10.md` is the template.
5. Rollback: integration branch pre-merge SHA recorded in the execution log; revert = `git reset` of the agent branch BEFORE sync-merge, or `git revert -m 1 <merge-sha>` after (criterion 6). No history rewrite on shared branches.

## Stop conditions
- any file-level conflict with in-flight fleet work → enumerate, operator decides ordering
- runtime proof fails post-checkout → halt, do not force

## Required proof
- `node scripts/brain/brain.mjs check` · review-diff · post-merge runtime checklist re-run

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-BRAIN-0023",
  "task": "MERGE-BACK-PLAN: bring six Phase-3 commits from loop/benton-cama-gla-gap into the integration branch with runtime re-proof + rollback path",
  "risk": "R3",
  "suite": "OS governance / Brain",
  "allowed_files": [
    "docs/brain/**",
    "docs/branching/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "frontend/**",
    "backend/**",
    "os-platform/**",
    "scripts/**",
    ".github/AGENT_ENTRYPOINT.md"
  ],
  "required_proof": [
    "node scripts/brain/brain.mjs check",
    "node scripts/brain/brain.mjs review-diff --workorder WO-BRAIN-0023"
  ]
}
```
