# Forensic Coverage Matrix

*Deliverable #2. Living document — updated each loop.* Last update: Loop 1, 2026-06-24.

Status values: `not started` · `partial` · `broad but shallow` · `deep and incomplete` · `complete` · `complete with cross-check`
Confidence: `low` · `medium-low` · `medium` · `medium-high` · `high`

| Lane | Objective | Method used | Evidence | Status | Confidence | Major findings | Unresolved | Next action |
|---|---|---|---|---|---|---|---|---|
| **1 Git graph** | Historical shape at ref/branch level | `git ls-remote`, `for-each-ref`, `rev-list --max-parents=0`, `merge-base`, left/right counts; GitHub API cross-check | `evidence/branch-roots.txt`, `branch-divergence-vs-main.txt`, `03-…` | **complete w/ cross-check** | high | 742 branches; **3 disjoint roots**; 580 legacy unmergeable | per-branch age/value scoring | Lane 11 (gated) |
| **2 Commit content** | What moved on critical surfaces | (deferred) — partially covered via family map + duplication audit | `03-…`, `06-…` | **partial** | medium-low | recut/`-v2..v9` patterns visible in family names | per-surface touch heatmap not yet built | run commit-diff heatmap on shell/workbench/Dais/registry next loop |
| **3 PR & merge-path** | Review history, dangerous/misleading PRs | GitHub `list_pull_requests` (recent 40) parsed | `04-…` | **partial** | medium | 38/40 recent closed-unmerged; merge via recut; stacked PR chains | full closed-unmerged inventory across all 1000+ PRs | paginate PR history; flag closed-unmerged on legacy lineage |
| **4 Root topology** | Physical root shape / containment failure | `ls`, `du`; agent inventory | `05-…` | **complete** | high | 86 root files; 25 root dirs; QUARANTINE 2.3G; loose phase4*.json manifests | none material | feed into Lane 13 (gated) |
| **5 System duplication** | Multiple-systems hypothesis | Explore agent: entrypoint/shell/workbench/Dais/registry/workspace inventory | `06-…` | **complete** | high | 1 live system + ghosts; QUARANTINE has near-complete replicas | exact native-shell status (experiment vs parallel) | confirm native-shell intent with owner |
| **6 Canon-vs-actual** | Declared canon vs code | Explore agent: read 7 canon docs + code | `02-…` | **complete w/ cross-check** | high | 1,008-agent fabrication; FISMA gaps; audit interceptor missing | none material | feed Lane 14 (gated) |
| **7 Runtime truth** | Live spine vs residue | Explore agent: traced Program.cs / DI / launcher | `07-…` | **complete w/ cross-check** | high | spine real; consciousness = stubs; islands/vapor identified | none material | — |
| **8 Artifact & residue** | Non-source pollution | Explore agent: root manifests, QUARANTINE, logs | `08-…` | **complete** | high | only `_validator_proof.log.err` is live-tree residue; 2.3G quarantined | future-dated session logs anomaly | verify timestamps |
| **9 Agent drift** | Agent-created work, false finishes | Explore agent: agent dirs + completion-claim scan | `09-…` | **complete** | high | false-finish register; 1,008 claim; future-dated SEALED.md | session-log dates | reconcile dates |
| **10 Structural risk** | What could mislead recovery | Synthesis across lanes 1/3/5 | `10-…` | **complete** | medium-high | disjoint-root merge hazard; confusion aliases; giant branches | — | — |

## Loop control read-out

- **Are new categories of disorder still appearing?** No. Loop 1 surfaced one dominant
  structural category (disjoint histories) plus confirmation of previously-documented
  honesty debt. Findings are now mostly confirming, not expanding.
- **Lanes still shallow:** Lane 2 (commit content heatmap) and Lane 3 (full PR history).
  These are the priority for **Loop 2** before Gate B is claimed with full confidence.
- **Recommendation:** Hold recovery lock. Advance to Loop 2 to deepen Lanes 2 & 3, then
  re-evaluate Gates A–C.
