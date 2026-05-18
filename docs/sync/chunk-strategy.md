# Chunked Drain Strategy (post-2026-05-13 ATTEMPT)

After the 2026-05-13 ATTEMPT exposed the corpus-scale hang in the improvement
lane (see [evidence/2026-05-13-benton-full-corpus-ATTEMPT.md](../../evidence/2026-05-13-benton-full-corpus-ATTEMPT.md)),
the team locked the following chunked-drain strategy. This is operational
playbook, not aspiration: every clause below is enforced by a real script in
`scripts/truth/`.

## Doctrine

`POST /api/sync/corpus/start` (orchestrator entry) is **NOT** used until
`HttpCorpusLaneRunner` gains a per-call timeout. The orchestrator path proved
to hold a stuck PACS query indefinitely with no error markers.

`POST /api/sync/doctrine/drain/{lane}` with `FullCorpus=true` is **NOT** used
on the current backend either. The improvement lane proved to hang at corpus
scale.

The supported path is `POST /api/sync/doctrine/drain/{lane}` with
`FullCorpus=false` and `TopN<=20000`. Repeat until each lane's source rows are
exhausted (detected by `RowsPromoted < TopN` on a chunk).

## Operator naming convention

Every chunk MUST tag its `Operator` field with a versioned identifier that
includes:

- the human/agent (e.g. `claude`, `bsvalues`)
- the lane being driven
- a monotonically increasing slice version

Example: `claude-chunk-parcel-v3`.

The `fire-next-chunk.mjs` script's pre-flight check refuses to fire a new chunk
when any IN_PROGRESS batch exists with the same operator-family prefix (before
the `-vN` digit). Use `--force` to override, but the override is a doctrine
violation if there's a real stuck batch (sign it in the controlled-abort artifact
first).

## Per-chunk evidence (durable JSONL)

`chunk-watcher.mjs` writes one JSONL snapshot per poll cycle (default 30s) to:

```
evidence/runs/<operator>-<sinceIso>.jsonl
```

Each line includes: batch states for the operator, current PG row counts across
the legacy_pacs_raw / truth_pacs / canonical_tf / sync_bridge surfaces, and
promotion-gate totals since the `sinceIso` window-start. The final line in the
file is either:

- `{ "terminalExit": true, "opCompleted": N, "opFailed": M, "deltas": {...} }` — clean exit, deltas show what the chunk actually wrote.
- `{ "deadlineExit": true, "elapsedMin": X }` — chunk did not transition within `maxElapsedMin` (default 180). Operator decides next.

## Safety circuit-breakers (do not remove without explicit doctrine pass)

The fire script's pre-flight refuses to fire if:

1. `/health` is unreachable.
2. Any `IN_PROGRESS` batch already exists with the same operator-family prefix.

The watcher exits if:

3. The named operator has at least one terminal batch (Completed or Failed) and
   no IN_PROGRESS batches remain.
4. The `maxElapsedMin` deadline passes without terminal status.

If the watcher hits its deadline (4), DO NOT auto-fire the next chunk. Treat
this as a partial-stall — capture the state, then either kill the stuck batch
(mark FAILED in DB with explicit `OperatorAborted` reason) or extend the deadline
deliberately. The 2026-05-13 ATTEMPT was filed for exactly this failure mode.

## Lane sequence (current strategy)

Drain the parcel lane to exhaustion via TopN=20000 chunks first. Parcel is the
proven path (see commit `6df11c25c` ATTEMPT artifact, plus the bsvalues operator
batches that landed 83K parcels cleanly). Once parcel is exhausted, move to:

- owner-wsdor
- improvement
- land
- sales
- geometry

Each in turn, same TopN=20000 chunking. Exhaustion detected by `RowsPromoted <
TopN` (or zero growth on the lane's downstream tables).

## Backend-restart policy

If backend private memory exceeds 4 GB during a chunk, restart the backend
between chunks. Pattern is the same as the controlled-abort sequence: kill PID,
relaunch from `.tmp/api-head-publish` with `TERRAFUSION_API_CONTENT_ROOT` set to
the source tree. The HEAD backend was bound at 2026-05-15T00:59:44Z; verify
contentRootPath via `GET /api/runtime/truth/db-identity` after each restart.

## What this is not

This document is not a seal. The seal is `evidence/<date>-benton-full-corpus-verification.md`,
which only exists once all six lanes' truth + canonical surfaces are populated
to PACS-equivalent totals AND the 7-clause anti-cheat seal in
[project_benton_truth_singular_gate.md](../../.claude/projects/C--Users-bsval-terrafusion-os-1-0/memory/project_benton_truth_singular_gate.md)
passes end to end. Until then, every chunk is ATTEMPT data, not seal.
