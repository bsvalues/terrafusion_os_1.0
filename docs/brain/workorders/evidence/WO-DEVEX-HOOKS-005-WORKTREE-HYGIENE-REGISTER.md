# WO-DEVEX-HOOKS-005 - Worktree Hygiene Register

**Program:** DevEx Hook Tooling
**Goal:** `GOAL-DEVEX-HOOK-BOOTSTRAP`
**Loop:** `LOOP-DEVEX-HOOK-BOOTSTRAP`
**Mode:** Read-only classification and evidence register
**Base:** `origin/main` at `6e9833b8f2c79620dbbf667ce0833ec38694f23b`

---

## Objective

Classify registered TerraFusion worktrees and their branch/PR ownership after the deterministic hook
repair. This packet identifies cleanup candidates and quarantine boundaries; it does not remove,
unlock, prune, reset, clean, or delete anything.

---

## Method

The register correlated live evidence from:

- `git worktree list --porcelain`;
- `git status --porcelain --untracked-files=all` for unlocked paths;
- branch ahead/behind counts relative to `origin/main`;
- `gh pr list --state all` for branch-to-PR disposition;
- lock and detached state reported by Git.

Squash-merged branches can retain commits that are not ancestors of `main`. A nonzero ahead count is
therefore not deletion authority. Merged PR state plus a clean worktree makes a path a candidate for
later owner-authorized cleanup, not an automatically disposable path.

---

## Inventory Summary

| Classification | Count | Meaning |
|----------------|------:|---------|
| Active WO | 1 | Current isolated WO-005 worktree |
| Active PR | 3 | Open PR owns branch; preserve |
| Merged clean candidate | 28 | Clean path with merged PR; candidate only |
| Dirty quarantine | 6 | Local changes present; do not clean or remove |
| Locked quarantine | 4 | Git reports locked initialization; do not force-remove |
| Main ownership conflict | 1 | Stale linked worktree owns local `main` branch |
| Closed unmerged review | 2 | Closed PR did not merge; owner disposition required |
| Detached review | 1 | Detached worktree; provenance review required |
| No-PR review | 8 | No matching PR found; branch provenance required |
| **Total** | **54** | Registered worktrees in the live snapshot |

---

## Active Work

| Path | Branch | PR | Disposition |
|------|--------|----|-------------|
| `C:\Users\bsval\.codex-worktrees\devex-hooks-005-worktree-hygiene-register` | `wo/devex-hooks-005-worktree-hygiene-register` | Current WO | Preserve |
| `C:\Users\bsval\terrafusion_os_1.0\.claude\worktrees\atlas-cherry-pick` | `feat/atlas-maplibre-migration` | #1073 open | Preserve |
| `C:\Users\bsval\tf-worktrees\tfos10-support` | `claude/backend-oe-support-packets` | #1238 open | Preserve |
| `C:\Users\bsval\tf-worktrees\tfos10-tilecontract` | `claude/wb-suite-tile-contract` | #1240 open | Preserve |

---

## Hard Quarantine

### Dirty paths

| Path | Branch | Dirty entries | PR |
|------|--------|--------------:|----|
| `C:\Users\bsval\terrafusion_os_1.0` | `claude/forensic-estate-audit-4kzp3e` | 246 | #1081 merged |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\benton-cama-gla-gap` | `loop/benton-cama-gla-gap` | 1 | none found |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\compsforge-prometheus-comp-audit-v2` | `codex/compsforge-prometheus-comp-audit-v2` | 9 | none found |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\june10-operational-calm-polish` | `codex/release-auth-smoke-timeout` | 8 | #870 closed |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\salt-lake-county-pack` | `feat/salt-lake-county-pack` | 1 | none found |
| `C:\Users\bsval\tf-worktrees\wo-ops-clean-main` | `wo/audit-county-filter-001` | 1 | #1187 merged |

No `git clean`, reset, stash, checkout, restore, or removal is authorized for these paths.

### Locked paths

| Path | Branch | PR |
|------|--------|----|
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\dais-queue-500-root-cause` | `codex/dais-queue-500-root-cause` | none found |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\production-provisioned-auth-db-backed` | `codex/production-provisioned-auth-db-backed` | none found |
| `C:\Users\bsval\tf-worktrees\wo-brain-001` | `wo/benton-data-evidence-rollup` | #1152 merged |
| `C:\Users\bsval\tf-worktrees\wo-sales-002b` | `docs/benton-demo-db-completion` | #1092 merged |

These paths require separate forensic confirmation and explicit force-removal authority, if removal
is later selected.

### Main ownership conflict

`C:\Users\bsval\.codex-worktrees\backend-oe-009-release-gate-definition` is clean but owns local
branch `main` at `5585afa8f`, while `origin/main` is `6e9833b8f`. This prevents normal local-main
ownership elsewhere and has already caused post-merge local synchronization friction. It is not safe
to remove under this register; a dedicated branch/worktree repair decision is required.

---

## Provenance Review Required

### Closed but unmerged PRs

| Path | Branch | PR |
|------|--------|----|
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\cuforge-case-state-persistence` | `codex/cuforge-case-state-persistence` | #876 closed |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\intelligence-preview` | `feat/intelligence-preview` | #886 closed |

### Detached worktree

- `C:\Users\bsval\terrafusion_os_1.0\.claude\worktrees\busy-payne-7aefde` at `3d2e7c825`.

### No matching PR found

| Path | Branch | Ahead / behind `origin/main` |
|------|--------|-----------------------------|
| `C:\Users\bsval\.codex-worktrees\backend-oe-007-migration-rollback-proof` | `wo/backend-oe-007-migration-rollback-proof` | 0 / 35 |
| `C:\Users\bsval\.codex-worktrees\devex-hooks-001-reality-audit` | `wo/devex-hooks-001-reality-audit` | 0 / 4 |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\codex-county-studio-context-stabilization` | `codex/county-studio-r1-context-stabilization` | 0 / 353 |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\compsforge-diagnosis` | `feat/compsforge-property-universe-guard` | 259 / 379 |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\compsforge-prometheus-comp-audit` | `codex/compsforge-prometheus-comp-audit` | 0 / 359 |
| `C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\sec-shell-quote` | `fix/sec-shell-quote-override` | 0 / 325 |
| `C:\Users\bsval\terrafusion_os_1.0\.claude\worktrees\atlas-parcel-slice-01` | `worktree-atlas-parcel-slice-01` | 6 / 277 |
| `C:\Users\bsval\terrafusion_os_1.0\.claude\worktrees\feat+terra-atlas-parcel-slice-01` | `worktree-feat+terra-atlas-parcel-slice-01` | 0 / 277 |

No-PR paths need branch provenance and ownership confirmation before cleanup. The two zero-ahead
Codex evidence paths may be low-risk candidates, but this packet does not authorize their removal.

---

## Merged Clean Candidates

Every path below was clean and mapped to a merged PR at discovery time. Cleanup still requires a
separate owner-authorized batch and a fresh pre-removal check.

| Worktree | Branch | PR |
|----------|--------|----|
| `backend-oe-007-migration-rollback-proof-2` | `wo/backend-oe-007-migration-rollback-proof-2` | #1218 |
| `backend-oe-008-dais-e2e-proof-plan` | `wo/backend-oe-008-dais-e2e-proof-plan` | #1220 |
| `backend-oe-010-operational-runbook` | `wo/backend-oe-010-operational-runbook` | #1226 |
| `backend-oe-011-diagnostics-observability-map` | `wo/backend-oe-011-diagnostics-observability-map` | #1232 |
| `backend-oe-012-operational-packet` | `wo/backend-oe-012-operational-packet` | #1233 |
| `backend-oe-013-evidence-rollup-closeout-2` | `wo/backend-oe-013-evidence-rollup-closeout` | #1239 |
| `codex-operator-playbook` | `wo/codex-operator-playbook` | #1241 |
| `devex-hooks-002-bootstrap-contract` | `wo/devex-hooks-002-bootstrap-contract` | #1250 |
| `devex-hooks-003-determinism-design` | `wo/devex-hooks-003-determinism-design` | #1251 |
| `devex-hooks-004-hook-script-repair` | `wo/devex-hooks-004-hook-script-repair` | #1253 |
| `goal-loop-master-playbook` | `wo/goal-loop-master-playbook` | #1202 |
| `op-auto-000-012-operator-autonomy` | `wo/op-auto-000-012-operator-autonomy` | #1244 |
| `rel-002-release-gate-evidence-contract` | `wo/rel-002-release-gate-evidence-contract` | #1243 |
| `rel-003-release-candidate-evidence-template` | `wo/rel-003-release-candidate-evidence-template` | #1246 |
| `rel-004-release-tag-version-evidence-model` | `wo/rel-004-release-tag-version-evidence-model` | #1247 |
| `rel-005-rollback-drill-authorization-packet` | `wo/rel-005-rollback-drill-authorization-packet` | #1248 |
| `rel-006-release-engineering-evidence-rollup` | `wo/rel-006-release-engineering-evidence-rollup` | #1249 |
| `add-uiux-skill` | `chore/ui-ux-pro-max-skill` | #929 |
| `benton-owner-runtime-proof` | `codex/benton-owner-runtime-proof` | #915 |
| `incomeforge-readiness-desk` | `codex/incomeforge-readiness-desk` | #888 |
| `os-canon-bottom-tab-aria` | `chore/os-canon-bottom-tab-aria` | #926 |
| `property-workbench-comps-review-desk` | `codex/compsforge-review-desk` | #890 |
| `property-workbench-production-smoke` | `codex/property-workbench-production-smoke` | #897 |
| `property-workbench-routing-ci-fix` | `codex/property-workbench-comps-review-desk` | #889 |
| `terracanon-ide-package` | `feat/os-canon-diff-risk-viewer` | #932 |
| `workbench-parcel-boot` | `fix/workbench-parcel-boot-auth-gate` | #927 |
| `tfos10-cifix` | `ci/frontend-fast-gate-audit-exclude` | #1245 |
| `tfos10-fastgate` | `ci/fastgate-silent-block-003` | #1252 |

---

## Recommended Cleanup Strategy

1. Keep all active PR, current WO, dirty, locked, detached, closed-unmerged, and no-PR paths intact.
2. Resolve the stale `main` ownership conflict in a dedicated owner-authorized repair WO before any
   broad cleanup batch.
3. If cleanup is selected, start with recent clean merged `.codex-worktrees` entries and verify each
   PR, branch, cleanliness, and unique-commit disposition immediately before removal.
4. Use `git worktree remove` and `git worktree prune`; never use broad filesystem deletion, `git
   clean`, or `git reset --hard`.
5. Delete a branch only after its exact worktree is removed and its merged/squash provenance is
   reconfirmed.

---

## Explicit Non-Actions

- No worktree removed, unlocked, repaired, pruned, moved, or manually deleted.
- No branch deleted, reset, rebased, force-pushed, or checked out.
- No dirty file inspected beyond path/count classification.
- No PR changed.
- No runtime, package, lockfile, CI, deployment, county, PACS, secret, or production resource
  changed.

---

## Verdict

**PASS - worktree hygiene is classified, not cleaned.**

The next routed work order is `WO-DEVEX-HOOKS-006 - Bootstrap Verification Packet`. It requires a
fresh clean-worktree dependency bootstrap and is therefore an install/mutation authority boundary,
not automatic evidence-only continuation.
