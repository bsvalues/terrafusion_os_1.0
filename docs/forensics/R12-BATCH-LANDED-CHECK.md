# R12 Batch Already-Landed Check — N2 / N3 / N5 / N6

*Read-only decision-layer check. No lock release, no code movement. Method: direct
content-presence (ahead/behind + 2-dot tree delta + branch-only files), not branch status.*

## Reading the signal (two patterns)
- **Recent-base (behind ≈ 3–9, branch-only ≈ 0, PR marker in main):** work **landed via recut**; the small `main↔branch` delta is `main`'s *later* evolution. → already-landed.
- **Old-base (behind ≈ 147–189):** the huge `main↔branch` delta is dominated by `main`'s *subsequent deletions* (~160K− lines, e.g. QUARANTINE cleanup); the "unique" files are the **same 62 stale `E2ETest*.cs`** seen in N1 — **noise, not value**. → already-landed/trivial.

## Result table

| Initiative (representative) | Landed status | Residual unique content? | Regression risk if merged | Next disposition | Conf |
|---|---|---|---|---|---|
| **N2a** os-canon-diff-risk-viewer (#932) | **already-landed** (ahead 14/behind 9, 0 branch-only, PR #932 in main) | none | HIGH (main evolved past it) | **ignore (verify-complete)** | high |
| **N2b/c** canon-cli, canon-gates-enforce | **already-landed/trivial** (ahead=1, behind 147, branch-only = 62 stale-e2e) | none of value | HIGH (old base) | **ignore** | med-high |
| **N3a** atlas-maplibre (**PR #1073 OPEN**) | **NOT landed — residual** (ahead 8/behind 3, recent base, 1 branch-only) | **yes — real, current** | **LOW** (behind=3) | **MERGE via normal PR #1073** — the one genuine actionable needle | high |
| **N3b** atlas-suite-ci-contract-repair | **partially-landed** (ahead 26, behind 147, old base) | maybe (CI-contract subset) | HIGH if bulk-merged | **cherry-pick subset after finer diff** (not bulk-merge) | med |
| **N5a** 927-workbench-recut (#1074) | **already-landed** (ahead 1/behind 8, 0 branch-only, PR #1074) | none | LOW | **ignore (verify-complete)** | high |
| **N5b** property-workbench-prod-closure | **mostly already-landed** (ahead 3, behind 147, 63 stale-e2e) | minimal | HIGH (old base) | **ignore** (finer check optional) | med |
| **N5c** workbench-parcel-boot-auth-gate | **HAZARD — not landed, giant divergence** (ahead 162/behind 189, **622 branch-only, +1.86M insertions**) | bulk = re-adds deleted mass | **EXTREME** (would re-import ~1.86M lines main removed) | **DO NOT MERGE → port-only/archaeology; owner-sensitive (auth)** | high |
| **N6** county-studio-real-dev-readiness (#1075) | **already-landed** (ahead 13/behind 150, chain recut via PR #1075) | stale-e2e + ~70 files (verify) | HIGH (old base, 163K− del) | **ignore (verify-complete)** | med-high |

## Headline: the mergeable pool collapses
Of the four initiatives, the MERGE-CANDIDATE pool resolves to:
- **already-landed (ignore):** N2 (all), N5a, N5b, N6 — the bulk.
- **one genuinely actionable item:** **N3a atlas-maplibre = open PR #1073** (recent, low-risk, real residual) → resolve via the normal PR path, not a forensic salvage.
- **one partial:** N3b atlas-suite-ci-contract-repair → cherry-pick a subset only, after a finer diff.
- **one hazard:** **N5c auth-gate** (+1.86M insertions) → never merge; port-only/archaeology; owner-sensitive.

## Strategic clarification (the point of this batch)
N1 + this batch together prove: **the merge-candidate pool ≠ the real salvage pool.** Almost
all of it is already in `main` (recut), plus one open PR and one hazard. **The near-term
mergeable salvage work is essentially just resolving PR #1073.** The genuine remaining value
therefore concentrates exactly where the forensics predicted — the **PORT-ONLY legacy Tier-1
engines (Sync / Levy / Forge-stats), behind the F14 schema-reconciliation gate** — and is
reachable only by file/hunk port, never merge.

## Fences intact
- Owner-sensitive (N5c auth-gate, phone-redaction, PACS/county/levy) remain fenced.
- Schema-sensitive Tier-1 ports remain behind the F14 gate.
- No lock release; no code moved. This is verification only.

## Recommended next step
Two clean options, both consistent with the ratified order:
1. **Resolve PR #1073 (atlas-maplibre)** via the normal review/merge path — the single
   real near-term mergeable item (would need its own narrow release, not a forensic port).
2. **Pivot salvage focus to the PORT-ONLY Tier-1 engines** — which first requires the
   **F14 schema-reconciliation gate** (the true critical path). Recommend a decision-layer
   **schema-reconciliation plan** next (still no code), since that gate blocks Sync/Levy/Forge.
