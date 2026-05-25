# Improvement Drain Chunk Ledger — 2026-05-19 (reconstructed 2026-05-25)

Per co-founder spec 2026-05-19: stay on improvement lane until ceiling is
proven; capture per-chunk evidence with full vitals; maintain cumulative
counter; do not reframe.

> **RECONSTRUCTION NOTE (2026-05-25):** The original working-tree copy of this
> ledger was never git-committed and was lost when the laptop hard-restarted on
> 2026-05-25. This file is rebuilt from the session transcript and the
> persisted DB ground-truth (`canonical_tf.tf_improvement_feature`,
> `truth_pacs.imprv_current`). All numbers below are reconciled against live DB
> reads. **This file is now committed to git so a restart cannot lose it again.**

## Atomicity-fix anchor

- Commit: `075c0156d fix(sync): wrap improvement-projector DELETE+INSERT in single EF txn`
- Pre-fix baseline (session start 2026-05-18 evening):
  - `canonical_tf.tf_improvement` = 247
  - `canonical_tf.tf_improvement_feature` = 1,520
- The atomicity fix wraps the projector DELETE phase and INSERT phase in a
  single EF transaction. A failed/cancelled/severed chunk rolls back the DELETE
  too, preserving prior chunks' canonical work. Verified live; see
  `evidence/2026-05-18-projector-atomicity-fix-verified.md`.

## Steady-state per-chunk signature (TopN=500, FullCorpus=false)
- rowsLanded ≈ 9,821
- rowsPromotedToTruth = 554
- canonical_tf.tf_improvement_feature delta = +5,490
- canonical_tf.tf_improvement = 1,105 (stable; idempotent re-project)
- quarantine delta = +2 (3 PACS-native dup tuples → imprv-attr-key-uniqueness)
- 52 gates PASS / 1 known FAIL (dup tuples, not a regression)
- features ÷ truth ≈ 9.19

## Stop-criteria (none triggered to date)
- rowsPromotedToTruth < 554 (source exhaustion) — NOT triggered
- quarantine delta > 100 — NOT triggered
- wall-time > 45 min with no writes — only ever tripped by laptop-sleep socket death (see v211 incident), never by code
- feature delta < 5,000 — NOT triggered
- dictionary-coverage WARN returns — NOT triggered since v49b recovery

## Milestone snapshots (DB ground-truth)
| Tag | Date | features | truth | imprv | notes |
|---|---|---:|---:|---:|---|
| baseline | 2026-05-18 | 1,520 | 12,725 | 247 | pre-fix |
| v48 | 2026-05-19 | 307,080 | 39,871 | 801 | last pre-restart |
| v100 | 2026-05-21 | 602,675 | 70,076 | 1,105 | |
| v121 | 2026-05-22 | 717,965 | 81,710 | 1,105 | 100 chunks since fix |
| v174 | 2026-05-23 | 1,005,190 | 111,072 | 1,105 | **crossed 1,000,000 features** |
| v200 | 2026-05-24 | 1,147,930 | 125,476 | 1,105 | |
| v212 | 2026-05-25 | 1,219,300 | 132,678 | 1,105 | post-restart backlog catch-up |

## Recent run detail (v206 → v212)
- v206: 1,175,380 → 1,180,870 features; truth 128,800
- v207: 1,180,870 → 1,186,360 features; truth 129,354
- v208: 1,186,360 → 1,191,850 features; truth 129,908
- v209: 1,191,850 → 1,197,340 features; truth 130,462 (crossed 130K truth)
- v210: 1,197,340 → 1,202,830 features; truth 131,016

### v211 / v211-rerun — SLEEP-STALL incident + atomicity proof (2026-05-24/25)
- v211 promoter committed (truth → 131,570) but projector hung at age=363min:
  **laptop slept overnight**, projector DB socket died, async task hung on the
  dead connection, batch left IN_PROGRESS. No feature movement.
- v211-rerun: promoter committed (truth → 132,124) but projector again killed —
  second sleep, then a hard laptop restart.
- **Atomicity fix held through BOTH stalls + the hard restart:**
  `tf_improvement_feature` never moved off 1,202,830; zero half-committed rows;
  zero corruption. Truth ran ahead by 2 un-projected chunks; features stayed
  internally consistent.
- Recovery: cleared 2 stale zombies; restarted `tf-mssql` (had exited during
  sleep) BEFORE backend → dictionary loaded 193 codes (avoided the v49b
  empty-dictionary anomaly); restarted backend on :5000; the hard restart also
  auto-cleared AuditLogs bloat → 1,183 MB / 15K rows.

### v212 — backlog catch-up (post-restart 2026-05-25)
- features 1,202,830 → **1,219,300 (+16,470 = exactly 3× normal)** — projected
  the v211 + v211-rerun backlog PLUS its own chunk in one atomic projection.
- truth 132,124 → 132,678 (+554 normal). zombies=0. features ÷ truth ≈ 9.19.
- **Result: features and truth fully reconciled, zero data loss across 2
  overnight sleeps + 1 hard restart.**

## Cumulative since atomicity fix (075c0156d)
- ~187 successful improvement chunks since fix — **zero regressions.**
- canonical_tf.tf_improvement_feature: 1,520 → **1,219,300** (+1,217,780 net)
- truth_pacs.imprv_current: 12,725 → **132,678** (+119,953)
- legacy_pacs_raw.imprv_attr: → 2,412,731
- Infrastructure events survived: 6+ laptop restarts, 1 PG crash + WAL recovery,
  1 Docker engine failure, multiple overnight laptop sleeps, ~8 AuditLogs
  VACUUM/prune cycles. The atomicity fix held through every one.
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 132,678 / ~290,000 ≈ 46%
- Source-exhaustion signal (rowsPromotedToTruth < 554): STILL NOT triggered.

## Operational lessons
- AuditLogs needs periodic prune; the long-held projector txn blocks autovacuum.
  A hard restart fully reclaims it. Scheduled maintenance job is the durable fix (POST-SEAL).
- Laptop sleep severs the projector's PG socket; the async task can hang on the
  dead connection, leaving an IN_PROGRESS zombie. Recovery is: clear zombie →
  ensure tf-mssql is up → restart backend → re-fire (projector catches up the
  backlog in the next chunk). The atomicity fix guarantees no corruption.
- **Evidence durability: this ledger must be git-committed, not left untracked —
  an untracked working-tree file does not survive a hard restart.**
