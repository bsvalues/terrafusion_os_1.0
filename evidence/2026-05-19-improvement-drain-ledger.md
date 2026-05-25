# Improvement Drain Chunk Ledger — 2026-05-19

Per co-founder spec 2026-05-19: stay on improvement lane until ceiling is
proven; capture per-chunk evidence with full vitals; maintain cumulative
counter; do not reframe.

## Atomicity-fix anchor

- Commit: `075c0156d fix(sync): wrap improvement-projector DELETE+INSERT in single EF txn`
- Pre-fix baseline (session start 2026-05-18 evening):
  - `canonical_tf.tf_improvement` = 247
  - `canonical_tf.tf_improvement_feature` = 1,520
- 28 successful chunks committed since fix (v21–v48) before laptop restart
  on 2026-05-19. Post-restart resumes at v49.

## Source-side ceilings as of 2026-05-19T18:25Z

| Layer | Table | Rows |
|---|---|---:|
| Landing | `legacy_pacs_raw.imprv_attr` | 1,181,883 |
| Landing | `legacy_pacs_raw.imprv` | 274,034 |
| Truth | `truth_pacs.imprv_current` | 39,871 |
| Canonical | `canonical_tf.tf_improvement` | 801 |
| Canonical | `canonical_tf.tf_improvement_feature` | **307,080** |

**Reconciliation question (open):** of the 1,181,883 landed `imprv_attr`
rows, how many should become `canonical_tf.tf_improvement_feature` rows?
The 307,080:1,181,883 ratio is ~26%. Need explicit reconciliation logic
to define the expected ceiling. Until then, drain continues with feature
delta as the operational signal.

## Chunk ledger

Format per chunk: id, operator, duration, PACS reads, landing/truth/canonical
deltas, quarantine delta, AuditLogs start/end size, error text if any.

(Entries appended per chunk; pre-v49 chunks logged in prior session summary.)

### v48 (last pre-restart, recovered from DB)
- operator: `claude-strict-serial-improvement-tn500-v48`
- canonical_tf.tf_improvement_feature: ~301,590 → 307,080 (Δ +5,490)
- canonical_tf.tf_improvement: 801 (unchanged)
- truth_pacs.imprv_current: through 39,871
- status: Succeeded

### v49 (failed, MSSQL down)
- operator: `claude-strict-serial-improvement-tn500-v49-post-restart`
- duration: 27.5 sec
- status: Failed at Owner-Seed-S1
- error: SqlException — tf-mssql container had exited after laptop restart
- canonical delta: 0
- recovery: docker start tf-mssql

### v49b (dictionary-empty anomaly)
- operator: `claude-strict-serial-improvement-tn500-v49b-post-mssql`
- duration: 1459 s / 24.3 min
- status: Succeeded
- rowsLanded: 2,299 (75% below normal — pre-dictionary filter)
- rowsPromotedToTruth: 554
- rowsCanonicalized: 307,859
- rowsQuarantinedThisLane: **7,524** (vs normal 2)
- gate: `imprv-attr-dictionary-coverage` WARN — 3,745 codes outside active dictionary
- root cause: `ImprvAttrDictionaryRefreshHostedService` ran at backend startup while tf-mssql was down → dictionary loaded 0 codes (instead of ~193). Service non-fatal-on-PACS-unreachable per design, so backend started successfully with empty landing dictionary. Every PACS attr code subsequently fell to `UNKNOWN_I_ATTR_VAL_CD`.
- canonical_tf.tf_improvement_feature delta: 307,080 → 308,825 (+1,745)
- canonical_tf.tf_improvement delta: 801 (unchanged)
- AuditLogs: 6,923,977 / 1,265 MB → 7,554,564 / 1,363 MB

### attr-drain-1 recovery (post-v49b)
- operator: `claude-attr-drain-1-post-restart-2026-05-19`
- duration: ~30 min (curl timed out; server completed)
- effect: refreshed dictionary, re-landed quarantined tuples, re-projected canonical
- quarantine: 9,704 → 219 (residual: 219 "Heat Pump" rows — possible varchar overflow or single-code dictionary gap)
- canonical_tf.tf_improvement_feature: 308,825 → 319,195 (**+10,370**)
- canonical_tf.tf_improvement: 801 → **1,105** (+304 — first new improvement count this session)
- truth_pacs.imprv_current: 40,425 → 41,268 (+843)

### v50 (clean recovery)
- operator: `claude-strict-serial-improvement-tn500-v50-post-attr-drain`
- duration: 1093 s / 18.2 min (faster than recent avg)
- status: Succeeded
- rowsLanded: 9,821 (normal)
- rowsPromotedToTruth: 554 (normal)
- rowsCanonicalized: 318,814
- rowsQuarantinedThisLane: **2** (normal)
- canonical_tf.tf_improvement_feature: 319,195 → 324,685 (+5,490 — normal increment)
- canonical_tf.tf_improvement: 1,105 (unchanged, idempotent re-project)
- legacy_pacs_raw.imprv_attr: → 1,194,167
- truth_pacs.imprv_current: → 41,822
- AuditLogs: 8,211,801 / 1,502 MB → 8,857,025 / 1,695 MB

## Cumulative since atomicity fix (075c0156d)
- Improvement chunks completed: 30 successful (v21-v48, v49b, v50) + 1 attr-drain-1 release
- canonical_tf.tf_improvement_feature: 1,520 → **324,685** (+323,165 net)
- canonical_tf.tf_improvement: 247 → 1,105 (+858)
- Regression events: 0 (atomicity fix held through v49 failure)

### v51 — clean
- duration: 1280 s / 21.3 min
- features: 324,685 → 330,175 (+5,490)
- truth_imprv: 41,822 → 42,376 (+554)
- quarantine delta: 2

### v52 — clean
- duration: 1177 s / 19.6 min
- features: 330,175 → 335,665 (+5,490)
- truth_imprv: 42,376 → 42,930 (+554)
- quarantine delta: 2

### v53 — clean
- duration: 1378 s / 22.97 min
- features: 335,665 → 341,155 (+5,490)
- truth_imprv: 42,930 → 43,484 (+554)
- quarantine delta: 2

### v54 — clean
- duration: 1418 s / 23.6 min
- features: 341,155 → 346,645 (+5,490)
- truth_imprv: 43,484 → 44,038 (+554)
- quarantine delta: 2

### v55 — clean
- duration: 1346 s / 22.4 min
- features: 346,645 → 352,135 (+5,490)
- truth_imprv: 44,038 → 44,592 (+554)
- quarantine delta: 2

### v56 — clean
- duration: 1230 s / 20.5 min
- features: 352,135 → 357,625 (+5,490)
- truth_imprv: 44,592 → 45,146 (+554)
- quarantine delta: 2

### v57 — clean
- duration: 1600 s / 26.7 min
- features: 357,625 → 363,115 (+5,490)
- truth_imprv: 45,146 → 45,700 (+554)
- quarantine delta: 2

### v58 — clean
- duration: 1970 s / 32.8 min
- features: 363,115 → 368,605 (+5,490)
- truth_imprv: 45,700 → 46,254 (+554)
- quarantine delta: 2

### v59 — clean
- duration: ~22 min
- features: 368,605 → 374,095 (+5,490)
- truth_imprv: 46,254 → 46,808 (+554)
- quarantine delta: 2

### v60 — clean
- duration: 1436 s / 23.95 min
- features: 374,095 → 379,585 (+5,490)
- truth_imprv: 46,808 → 47,362 (+554)
- quarantine delta: 2

## Cumulative through v60 (since atomicity fix 075c0156d)
- Successful chunks: 39 (v21-v48, v49b, v50-v60) + 1 attr-drain-1 release
- canonical_tf.tf_improvement_feature: 1,520 → **379,585** (+378,065 net)
- truth_pacs.imprv_current: 12,725 baseline → **47,362** (+34,637; +554/chunk sustained)
- legacy_pacs_raw.imprv_attr: → 1,269,387
- AuditLogs: 1.27 GB → 2.94 GB / 15.9M rows (one VACUUM FULL cycle done; second cycle approaching)
- Regression events: 0
- Stop-criterion violations: 0
- Source-exhaustion signal (rowsPromotedToTruth < 554): NOT TRIGGERED — still saturating at 554/chunk

## Milestone snapshot — v100 (2026-05-21)
- canonical_tf.tf_improvement_feature: **602,675** (was 1,520 baseline; +601,155 net)
- canonical_tf.tf_improvement: 1,105
- truth_pacs.imprv_current: **70,076** (was 12,725 baseline)
- legacy_pacs_raw.imprv_attr: 1,570,267
- Chunks since atomicity fix: ~80 successful (v21-v100, minus a few rerun-suffixed)
- Per-chunk delta sustained: +5,490 features / +554 truth / quarantine +2
- Regression events: 0 (atomicity fix 075c0156d held through every restart/crash)
- Infrastructure events survived: 3 laptop restarts, 1 PG crash+WAL recovery, 1 Docker engine failure, ~5 AuditLogs VACUUM FULL cycles, multiple backend self-restarts
- Source-exhaustion signal (rowsPromotedToTruth < 554): NOT triggered — still saturating
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 70,076 / ~290,000 ≈ 24%

## Milestone snapshot — v121 (100 chunks since atomicity fix, 2026-05-22)
- canonical_tf.tf_improvement_feature: **717,965** (was 1,520 baseline; +716,445 net)
- canonical_tf.tf_improvement: 1,105
- truth_pacs.imprv_current: **81,710** (was 12,725 baseline)
- legacy_pacs_raw.imprv_attr: 1,728,229
- **~100 successful improvement chunks since fix 075c0156d — zero regressions**
- Per-chunk delta sustained: +5,490 features / +554 truth / quarantine +2 / 52 gates PASS
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 81,710 / ~290,000 ≈ 28%
- Infrastructure events survived since v100: continued through audit-log VACUUM cycles; no new laptop restarts
- Operational lesson reinforced: AuditLogs needs VACUUM FULL (not just DELETE) every ~10-12 chunks; long-held projector txn blocks autovacuum, so dead tuples accumulate until reclaimed. DELETE-only keeps row-count down but not disk size. A scheduled maintenance job is the durable fix (POST-SEAL).

## Milestone snapshot — v174 (1,000,000 canonical features crossed, 2026-05-23)
- canonical_tf.tf_improvement_feature: **1,005,190** (was 1,520 baseline; +1,003,670 net) — **crossed 1,000,000**
- canonical_tf.tf_improvement: 1,105
- truth_pacs.imprv_current: **111,072** (was 12,725 baseline)
- legacy_pacs_raw.imprv_attr: 2,119,373
- **~150 successful improvement chunks since fix 075c0156d — zero regressions**
- v173: 994,210 → 999,700 (+5,490 features / +554 truth / quarantine +2), zombies=0
- v174: 999,700 → **1,005,190** (+5,490 features / 110,518 → 111,072 truth / +554), zombies=0 — the 1M-crossing chunk
- Per-chunk delta still locked at +5,490 features / +554 truth / quarantine +2
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 111,072 / ~290,000 ≈ 38%
- Source-exhaustion signal (rowsPromotedToTruth < 554): NOT triggered — still saturating at 554/chunk
- AuditLogs at 6.98M rows / 1,754 MB — VACUUM FULL cycle approaching (~10-12 chunk cadence)

### v175–v180 — clean run (post-1M, 2026-05-23)
All six chunks: +5,490 features / +554 truth / quarantine +2 / zombies=0 per chunk. No regressions.
- v175: 1,005,190 → 1,010,680 features; truth 111,072 → 111,626
- v176: 1,010,680 → 1,016,170 features; truth 111,626 → 112,180
- v177: 1,016,170 → 1,021,660 features; truth 112,180 → 112,734
- v178: 1,021,660 → 1,027,150 features; truth 112,734 → 113,288
- v179: 1,027,150 → 1,032,640 features; truth 113,288 → 113,842
- v180: 1,032,640 → 1,038,130 features; truth 113,842 → 114,396
- legacy_pacs_raw.imprv_attr: → 2,164,505
- AuditLogs held flat ~1,660 MB under DELETE-only prune (steady state — pages reused; no VACUUM FULL needed this run)
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 114,396 / ~290,000 ≈ 39%
- Source-exhaustion signal (rowsPromotedToTruth < 554): NOT triggered — still saturating at 554/chunk

### v181–v187 — clean run (2026-05-23)
All seven chunks: +5,490 features / +554 truth / quarantine +2 / zombies=0 per chunk. No regressions.
- v181: 1,038,130 → 1,043,620 features; truth 114,396 → 114,950
- v182: 1,043,620 → 1,049,110 features; truth 114,950 → 115,504
- v183: 1,049,110 → 1,054,600 features; truth 115,504 → 116,058
- v184: 1,054,600 → 1,060,090 features; truth 116,058 → 116,612
- v185: 1,060,090 → 1,065,580 features; truth 116,612 → 117,166
- v186: 1,065,580 → 1,071,070 features; truth 117,166 → 117,720
- v187: 1,071,070 → 1,076,560 features; truth 117,720 → 118,274
- legacy_pacs_raw.imprv_attr: → 2,217,159
- AuditLogs held flat ~1,690 MB under DELETE-only prune (steady state, no VACUUM FULL needed)
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 118,274 / ~290,000 ≈ 41%
- Source-exhaustion signal (rowsPromotedToTruth < 554): STILL NOT triggered — saturating at 554/chunk

### v188–v195 — clean run (2026-05-23/24)
All eight chunks: +5,490 features / +554 truth / quarantine +2 / zombies=0 per chunk. No regressions.
- v188: 1,076,560 → 1,082,050 features; truth 118,274 → 118,828
- v189: 1,082,050 → 1,087,540 features; truth 118,828 → 119,382
- v190: 1,087,540 → 1,093,030 features; truth 119,382 → 119,936
- v191: 1,093,030 → 1,098,520 features; truth 119,936 → 120,490 (crossed 120K truth)
- v192: 1,098,520 → 1,104,010 features; truth 120,490 → 121,044
- v193: 1,104,010 → 1,109,500 features; truth 121,044 → 121,598
- v194: 1,109,500 → 1,114,990 features; truth 121,598 → 122,152
- v195: 1,114,990 → 1,120,480 features; truth 122,152 → 122,706
- legacy_pacs_raw.imprv_attr: → 2,277,335
- AuditLogs held flat ~1,720 MB under DELETE-only prune (steady state, no VACUUM FULL needed)
- ~171 successful improvement chunks since atomicity fix 075c0156d — zero regressions
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 122,706 / ~290,000 ≈ 42%
- Source-exhaustion signal (rowsPromotedToTruth < 554): STILL NOT triggered — saturating at 554/chunk

## Milestone snapshot — v200 (operator tag, 2026-05-24)
- canonical_tf.tf_improvement_feature: **1,147,930** (was 1,520 baseline; +1,146,410 net)
- canonical_tf.tf_improvement: 1,105
- truth_pacs.imprv_current: **125,476** (was 12,725 baseline)
- legacy_pacs_raw.imprv_attr: 2,314,945
- **~176 successful improvement chunks since atomicity fix 075c0156d — zero regressions**
- v196: 1,120,480 → 1,125,970; truth 122,706 → 123,260
- v197: 1,125,970 → 1,131,460; truth 123,260 → 123,814
- v198: 1,131,460 → 1,136,950; truth 123,814 → 124,368
- v199: 1,136,950 → 1,142,440; truth 124,368 → 124,922
- v200: 1,142,440 → 1,147,930; truth 124,922 → 125,476
- Per-chunk delta still locked: +5,490 features / +554 truth / quarantine +2 / zombies=0
- AuditLogs steady ~1,740 MB under DELETE-only prune (no VACUUM FULL needed this entire run)
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 125,476 / ~290,000 ≈ 43%
- Source-exhaustion signal (rowsPromotedToTruth < 554): STILL NOT triggered — saturating at 554/chunk

### v201–v205 — clean run (2026-05-24)
All five chunks: +5,490 features / +554 truth / quarantine +2 / zombies=0 per chunk. No regressions.
- v201: 1,147,930 → 1,153,420 features; truth 125,476 → 126,030
- v202: 1,153,420 → 1,158,910 features; truth 126,030 → 126,584
- v203: 1,158,910 → 1,164,400 features; truth 126,584 → 127,138
- v204: 1,164,400 → 1,169,890 features; truth 127,138 → 127,692
- v205: 1,169,890 → 1,175,380 features; truth 127,692 → 128,246
- legacy_pacs_raw.imprv_attr: → 2,352,555
- AuditLogs ~1,757 MB / 7.0M rows under DELETE-only prune (steady state)
- ~181 successful improvement chunks since atomicity fix 075c0156d — zero regressions
- truth_pacs.imprv_current vs legacy_pacs_raw.imprv ceiling: 128,246 / ~290,000 ≈ 44%
- Source-exhaustion signal (rowsPromotedToTruth < 554): STILL NOT triggered — saturating at 554/chunk
