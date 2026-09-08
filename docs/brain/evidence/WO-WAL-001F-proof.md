# Proof Bundle — WO-WAL-001F

- Generated: 2026-09-08T04:54:30.124Z
- Work order: WO-WAL-001F

## Commands run
- `brain check` → PASS (✅ all checks passed)
- `wiki --check` → PASS (✅ wiki current (15 pages match canon))

## Negative tests
(record per slice — e.g. drift→fail→restore. See the slice ADR for evidence; `proof` runs positive checks.)

## Working tree
- changed (tracked) files: 4
- staged files at proof time: 0 (commit-race hazard if > 0 — WO-0011)

## Known risks (open drift)
- P0=0 P1=0 P2=2 P3=0

## Result
✅ PASS

## Acceptance scope (coordinator-authorized clarification)

Generated PASS and P0/P1 counts apply only to the Brain/wiki checks and the existing Brain drift ledger, not WAL product or statewide acceptance. Main reports backend attempt 2 (session 71495) exited 0 on integrated base 0733406fe9067f5d5e61c4a361951c1c3700a9c8: focused PASS, 12 passed and 1 opt-in browser-bootstrap skip; normal empty/populated SQLite cases ran. Attempt 1 remains a preserved test-compilation failure with zero tests executed, not behavioral RED. The later test-only companion-table fixture delta still requires a fresh backend run.

Actual frontend session 38553 exited 0: 2 focused Vitest files, 80 passed (7 DOM and 73 client), one worker, zero retries. Normal formatting followed; independent AST review found no frontend semantic change. A final candidate rerun remains required. The normal frozen dependency install passed with lifecycle scripts enabled and dependency-contract hashes unchanged. Six supported canonical runtime stagers passed exact artifact/provenance checks in this isolated worktree; staging is not runtime activation or proof that every consumer was invoked. HTTP and actual browser acceptance remain pending. Parent issue #1485 remains ACTIVE / NOT_PROVEN.

## Actual candidate acceptance — 2026-09-08 superseding update

The preceding pending statements are historical, not current acceptance status. Actual helper session95740 exited0 against source/UI commit `e195bc9c1d5baab1e5487a6b6b43308f278a1357`, including integrated base0733406. Result: `BOUNDED_HTTP_BROWSER_ACCEPTANCE_PASSED`. This proof/WO/registry continuation changes documentation only; it does not pretend the resulting documentation commit was the executed runtime SHA.

- Retained result: `artifacts/wal001f-browser/run-b9dea5a88bfe4c36b631148a0c14deac/acceptance-result.json`, SHA256 `134bf385fac7b3250a91279dc4fd40bde689b32098430c1a03024cdb1909e254`.
- Exact input manifest SHA256: `c5434fece3250d661dcdcf8c6928a58b8090d0c21e4e41e51158b06dc9a502be`; executed helper SHA256: `7234fdc42bba5cb24c690422d265e4c358d9bd4cc4b3b02fc8445becae8516c4`.
- The real API and browser exercised authenticated populated Spokane, authorized-empty Benton, anonymous/invalid-token401, bilateral cross-county403, actual runtime restart with retained token scope, stopped-host unavailable state and successful recovery/retry. All39 selector identities were exposed; only two synthetic county fixtures were exercised as runtime data. Direct HTTP denied bodies were inspected empty; browser403 bodies remain explicitly NOT_INSPECTED.
- Three actual owned API generations6636/33264/7040 exited after supported owned stop. Their intentional-stop exit codes were1, not zero; the acceptance helper exited0. Browser closed, remaining owned children0, cleanup errors0, observed faults0. Source, schema, business hashes and five audit inputs remained unchanged through cleanup.
- Main's separate fresh check at2026-09-08T10:53:12.7578502Z found zero owned F processes, zero port5207 listeners and all three recorded API PIDs absent. Independent assurance separately reviewed source identity, receipt/events, snapshots, screenshots and cleanup evidence: CLEAR for bounded F delivery.
- Actual focused frontend session41700 passed81 tests (73 client +8 DOM), zero failed/skipped, one worker/no retry. Heading regression first failed on actual computed color, then passed; the retained browser screenshots visibly confirm the repaired heading. Duplicate Node execution is not counted as additional distinct tests.
- Normal frontend build7514 exited0 at e195,16571 modules. Full build log SHA256 `d0cc6d8408f25f6f31ada822451475a60e3515c72e49a5184ab498a8aa6fc953`. Existing noCheck configuration means this is not a new full semantic typecheck PASS.
- Backend remains the unchanged build at `4c93141bc7460d8034b6928df297baf09906c5c0`: focused12 PASS/1 opt-in skip plus actual fresh bootstrap26835 PASS. The backend tree and810 API outputs were verified unchanged while302 UI files were rebuilt. Original PDB verification remains a92-attributed (24 assemblies/4664 document entries), not a fresh C# build at e195. Carryforward receipt SHA256 `f5afecf5eaf3bd08132be2e88d5b7b66dd3ab7ad7bbc5d80dfa95f7607f68648`.

Failed browser attempts30014 and65815 remain archived failures, not retrospectively passing evidence. Separate issue#1572 means the historical hook invocation is NOT ESLint proof. Issue#1574 records the existing background cross-instance local self-probe; no whole-host isolation or unrelated-runtime nonmutation claim follows from this child.

Remaining: normal final Brain scope/delivery checks, exact-head independent review, protected PR checks/merge and post-merge verification. The child remains in progress until delivery completes. This is not real public parcel landing,39-county runtime acceptance, production authentication/deployment, external assessor acceptance, WACO reacceptance or WAL002 completion. Parent#1485 remains ACTIVE; statewide completion is false.
