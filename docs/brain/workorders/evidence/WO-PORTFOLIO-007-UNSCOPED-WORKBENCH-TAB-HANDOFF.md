# WO-PORTFOLIO-007 - Unscoped Workbench Tab Handoff Evidence

## Selection Evidence

- Independent review of PR #1300 proved that `SuiteModuleGrid` sends `openTab` for an unscoped
  Workbench launch but `PropertySearch.openParcel` previously discarded it.
- WO-PORTFOLIO-006 removed the false certification and recorded the behavior gap without changing
  product source.
- After PR #1300 merged, the gap became the highest-value dependency-cleared bounded portfolio
  slice: it is shell-owned routing state and crosses no protected resource boundary.

## Implemented Proof

- Property Search reads the existing `openTab` query.
- The requested value must match `VALID_WORKBENCH_TAB_IDS`; unknown values are ignored.
- Valid non-summary tabs route to `/property/:parcelId/:tab`.
- `summary` and absent or invalid values route to the Workbench index at `/property/:parcelId`.
- No route, tab, registry entry, or suite business behavior was added.

## Validation Evidence

- TDD red proof: the new valid-tab test received `/property/GEO-003` instead of
  `/property/GEO-003/dais`; the summary and invalid-query safety tests already passed.
- Focused Property Search contract after implementation: 9 passed, 0 failed.
- Test-target resolved the additional Property Search page test; the WSL wrapper could not load a
  Linux Rollup optional binary from the Windows dependency tree, so the discovered test was rerun
  with the repository's Windows Corepack runtime: 6 passed, 0 failed.
- Focused E3: 1 passed, 0 failed.
- Full deployment-truth gate: 70 passed, 0 failed.
- Targeted shell routing matrix: 5 files passed, 87 tests passed, 0 failed. The run emitted
  pre-existing React `act(...)` warnings from `AtlasSuiteHome`; they did not fail the suite.
- Regression-guard architectural smoke matrix: 4 files passed, 43 tests passed, 0 failed; only
  pre-existing React test warning noise was emitted.
- Core and frontend TypeScript type-checks: PASS.
- Phase83 core tool gate: 56 passed, 0 failed.
- Canon GateFast passed naming, type-check, and Phase83 checks; its aggregate result remained red
  only because `canon:doctor` requires a clean worktree before the scoped commit exists.
- The estate-wide frontend constitution scan remains red on 113 pre-existing raw-color findings in
  unrelated files. This WO introduces no color value and does not alter any reported file.
- `git diff --check`, exact ten-file scope inspection, and `wo-query --json`: PASS.
- Hook gates and remote checks are required before protected merge.
- Frozen pnpm bootstrap preserved `package.json` and `pnpm-lock.yaml` hashes and created no tracked
  dependency residue.

## Non-Claims

- No new top-level route, Workbench tab, or global routing model was introduced.
- No suite business logic, backend, tools-sync, CI, deployment, package, lockfile, schema, migration,
  or environment changed.
- No secret, county, PACS, SQL, live service, or production resource was accessed.
