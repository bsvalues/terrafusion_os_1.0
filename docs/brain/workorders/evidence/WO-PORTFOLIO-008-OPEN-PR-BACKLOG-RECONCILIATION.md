# WO-PORTFOLIO-008 - Open PR Backlog Reconciliation Evidence

## Live Baseline

- Base and initial `origin/main`: `848024f31255306892c0c3f3dfd27bbfcf2a7c4d`.
- Initial open pull requests: #1271, #1238, #1102, #1082, #1080, and #1073.
- The isolated worktree began clean on `codex/portfolio-008-open-pr-reconciliation`.
- The shared checkout and unrelated worktrees were not modified or cleaned.

## Disposition Matrix

| PR | Disposition | Evidence |
|----|-------------|----------|
| #1271 | Closed as superseded | Current main contains the merged BRAIN-008 canon (#1270), BRAIN-009 closeout (#1272), MAO reconciliation (#1273), canonical R0-R5 semantics, standing merge authority, and portfolio routing. The stale PR was `DIRTY`; its branch remains preserved. |
| #1238 | Closed as superseded | The draft explicitly said it was held until Backend OE closeout. Backend OE and its support/review findings are now closed and represented in canonical evidence. Its branch remains preserved. |
| #1102 | Closed as superseded | The operator doctrine is superseded by the merged Codex Operator Playbook (#1241), operator-autonomy baseline, MAO governance, and standing operator authority (#1297). Its branch remains preserved. |
| #1080 | Closed as unsafe to merge as presented | The body claimed `docs/forensics/**` only, but the live PR contained 144 files and 54 commits, including broad backend surfaces; 99 listed files are absent from current main. Unique evidence remains on the preserved branch and requires fresh bounded extraction. |
| #1082 | Preserved open | This is explicitly a classification-ratification checkpoint. It grants no recovery and represents a genuine owner/canon boundary rather than routine engineering. |
| #1073 | Preserved open; not merge-ready | This is a stale product candidate with frontend source, package, and lockfile changes. Current main still uses Mapbox in `PropertyAtlas`, so the product question is real, but the old branch must not be merged or wholesale rebased. |

## Resulting Backlog

- Open pull requests after reconciliation: #1082 and #1073.
- Closed PR branches and commits were not deleted.
- No PR was merged, rebased, force-pushed, or cherry-picked.
- #1082 does not freeze unrelated work because its ratification boundary is independent.

## Next Slice Selection

`WO-ATLAS-001 - MapLibre Migration Reality Audit` is admitted as the next bounded R0 slice.

The audit will compare PR #1073's claims and exact head with current main, current Atlas canon, current
dependencies, test contracts, and any intervening Workbench changes. It may produce a fresh
implementation plan, but it may not modify product source, packages, lockfiles, CI, deployment, or
protected resources. This avoids both abandoning a real candidate and treating a June branch as
merge-ready in July.

## Validation Evidence

- Live open-PR inventory reduced from six to two.
- Current-main supersession checks and exact PR file inventories were inspected before closure.
- `git diff --check`, exact eight-file governance scope, and `wo-query --json` are required before
  protected merge.

## Non-Claims

- This Work Order does not ratify #1082 or authorize recovery.
- This Work Order does not approve, reject, rebase, merge, or implement #1073.
- Closing #1080 does not declare its unique forensic evidence false or disposable.
- No runtime, product, backend, tools-sync, CI, deployment, package, lockfile, schema, migration,
  county, PACS, SQL, secret, live-service, or production resource changed.
