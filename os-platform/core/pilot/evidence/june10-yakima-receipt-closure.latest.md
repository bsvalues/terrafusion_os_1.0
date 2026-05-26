# Yakima Receipt Closure

Generated: 2026-05-26T21:47:25.633Z

## Verdict

- Status: blocked_source_canonical_delta
- Receipt converted: no
- Production binding allowed: no
- Certification allowed: no

## Live Canonical Snapshot

| Metric | Value |
| --- | ---: |
| Active rows | 102238 |
| Active distinct parcel numbers | 102238 |
| Identity repair receipt rows | 102238 |
| Superseded rows | 0 |
| Active duplicate groups | 0 |

## Post-Repair Identity Overlap

| Metric | Value |
| --- | ---: |
| Source distinct | 98978 |
| Canonical distinct | 102238 |
| Exact overlap | 98878 |
| Source-only | 100 |
| Canonical-only | 3360 |

## Delta Classification

- Source-only classification: cannot_adjudicate_without_raw_source_artifact
- Canonical-only classification: cannot_adjudicate_without_raw_source_artifact
- Duplicate/null semantics: not_rerunnable_without_raw_source_artifact

## Required Plan

- Recover or recapture Yakima source-native parcel identifier artifact and receipt.
- Recompute source duplicate/null semantics from raw artifact.
- Probe/classify the 3,360 canonical-only identifiers as stale, source-filtered, or import artifacts.
- Classify the 100 source-only identifiers as loadable identity rows, source drift, or capture artifacts.
- Only after classification, create a bounded no-delete correction dry-run if needed.
- Do not convert Yakima to WA_INITIAL_SEED receipt posture until source/canonical parity is proven.

## Blockers

- Yakima source snapshot receipt is missing.
- Yakima raw source artifact is missing; duplicate/null/source semantics cannot be independently rerun.
- 100 source parcel identifiers are not present in canonical after repair.
- 3360 canonical parcel identifiers are not present in source evidence after repair.
