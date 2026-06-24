# Forensic Coverage Matrix

*Deliverable #2. Living document — updated each loop.* Last update: Loop 1, 2026-06-24.

Status values: `not started` · `partial` · `broad but shallow` · `deep and incomplete` · `complete` · `complete with cross-check`
Confidence: `low` · `medium-low` · `medium` · `medium-high` · `high`

| Lane | Objective | Method used | Evidence | Status | Confidence | Major findings | Unresolved | Next action |
|---|---|---|---|---|---|---|---|---|
| **1 Git graph** | Historical shape + **root-history class + physical mergeability** (updated criterion) | `git ls-remote`, `for-each-ref`, `rev-list --max-parents=0`, `merge-base`, left/right counts; GitHub API cross-check | `evidence/branch-census.csv` (Schema Addendum), `branch-roots.txt`, `branch-divergence-vs-main.txt`, `03-…` | **complete w/ cross-check** | high | 742 branches; **3 disjoint roots**; per-branch lineage+mergeability fields populated → PORT-ONLY 653 / MERGE-CANDIDATE 80 / CONTAINED 8 | per-branch value/feasibility scoring | Lane 11 (gated) |
| **2 Commit content** | What moved on critical surfaces | (deferred) — partially covered via family map + duplication audit | `03-…`, `06-…` | **partial** | medium-low | recut/`-v2..v9` patterns visible in family names | per-surface touch heatmap not yet built | run commit-diff heatmap on shell/workbench/Dais/registry next loop |
| **3 PR & merge-path** | Review history, dangerous/misleading PRs | GitHub `list_pull_requests` (recent 40) parsed | `04-…` | **partial** | medium | 38/40 recent closed-unmerged; merge via recut; stacked PR chains | full closed-unmerged inventory across all 1000+ PRs | paginate PR history; flag closed-unmerged on legacy lineage |
| **4 Root topology** | Physical root shape / containment failure | `ls`, `du`; agent inventory | `05-…` | **complete** | high | 86 root files; 25 root dirs; QUARANTINE 2.3G; loose phase4*.json manifests | none material | feed into Lane 13 (gated) |
| **5 System duplication** | Multiple-systems hypothesis | Explore agent: entrypoint/shell/workbench/Dais/registry/workspace inventory | `06-…` | **complete** | high | 1 live system + ghosts; QUARANTINE has near-complete replicas | exact native-shell status (experiment vs parallel) | confirm native-shell intent with owner |
| **6 Canon-vs-actual** | Declared canon vs code | Explore agent: read 7 canon docs + code | `02-…` | **complete w/ cross-check** | high | 1,008-agent fabrication; FISMA gaps; audit interceptor missing | none material | feed Lane 14 (gated) |
| **7 Runtime truth** | Live spine vs residue | Explore agent: traced Program.cs / DI / launcher | `07-…` | **complete w/ cross-check** | high | spine real; consciousness = stubs; islands/vapor identified | none material | — |
| **8 Artifact & residue** | Non-source pollution | Explore agent: root manifests, QUARANTINE, logs | `08-…` | **complete** | high | only `_validator_proof.log.err` is live-tree residue; 2.3G quarantined | future-dated session logs anomaly | verify timestamps |
| **9 Agent drift** | Agent-created work, false finishes | Explore agent: agent dirs + completion-claim scan | `09-…` | **complete** | high | false-finish register; 1,008 claim; future-dated SEALED.md | session-log dates | reconcile dates |
| **10 Structural risk** | What could mislead recovery | Synthesis across lanes 1/3/5 | `10-…` | **complete** | medium-high | disjoint-root merge hazard; confusion aliases; giant branches | — | — |
| **F11 Workspace/code-space** | workspace/IDE/launcher truth | Explore agent | `F11-…` | **complete** | high | `.workspace-map.json` MISLEADING (Windows root, ghost dirs); dev-os.mjs scans missing `applications/`; 92+ dead QUARANTINE workspaces | native-shell intent | owner ruling |
| **F12 Dependency** | package-manager truth | Explore agent | `F12-…` | **complete** | high | CLEAN: pnpm+NuGet authoritative, single lockfiles, no vendored deps | — | — |
| **F13 Build/CI/release** | build/CI/release truth | Explore agent | `F13-…` | **complete** | high | ~91 workflows; 1 real merge gate; **Seal Gate cancelled-as-failed foot-gun**; gov soft-fail expires 2026-06-30 | which ~44 dormant are safe to retire | Lane 13 (gated) |
| **F14 Data/schema/migration** | schema lineage truth | Explore agent | `F14-…` | **complete** | high | **MULTIPLE lineages**: 3 DbContexts; **LevyCertification defined twice incompatibly**; CurrentUse breaks on SQLite | persistence runtime test | R-lane lead |
| **F15 Config/env/secrets** | runtime-control truth | Explore agent | `F15-…` | **complete** | high | 🔴 **committed JWT secret + plaintext DB password**; port contract broken in dev-compose; `config/`↔`configs/` + appsettings duplication | rotate secrets (owner) | escalate |
| **F16 Ownership/false-completion** | accountability truth | Explore agent | `F16-…` | **complete** | high | recovery-spine surfaces **UNOWNED**; ~412 COMPLETE docs, ~2 evidence-backed; 50,000-agent fiction | assign stewards | Gate E precondition |

## Loop control read-out (updated after Loop 2)

- **Are new categories of disorder still appearing?** **YES — Loop 2 re-opened discovery.**
  The six new lanes (F11–F16) surfaced *new* categories not seen in Loop 1: conflicting DB
  migration lineages (F14), committed secrets + fractured config (F15), and an ownership
  vacuum over the recovery spine (F16). Per the /loop rule, frequent new categories ⇒
  **remain in discovery**; Gate A's provisional pass is **withdrawn** (see GATES-STATUS).
- **Lanes still shallow:** Lane 2 (commit-content heatmap) and Lane 3 (full PR history)
  remain partial and are now joined by *verification* follow-ups for F14/F15 (runtime proof
  of the LevyCertification conflict; confirm secret exposure in current HEAD vs history).
- **Recommendation:** Hold recovery lock. Run **Loop 3** to (a) deepen Lanes 2 & 3, (b)
  verify the F14/F15 criticals, (c) escalate the F15 secret exposure to the owner. Recovery
  lanes stay gated.
