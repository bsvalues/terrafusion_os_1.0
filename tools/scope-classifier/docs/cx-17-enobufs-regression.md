# CX-17: scope-classifier ENOBUFS Regression Test

## What this protects

PR #542 replaced `execSync` with `spawnSync` + 64 MB `maxBuffer` in
`gitTouched.ts` to prevent `ENOBUFS` crashes when `git diff --name-only`
returns large output (common in monorepos with many changed files).

This regression test ensures the fix is never reverted or weakened.

## Test file

`tests/gitTouched-enobufs.test.ts` — 5 cases:

| # | Scenario | Assertion |
|---|----------|-----------|
| 1 | Stdout > 1 MB (~20k lines) | Parses without throw; `maxBuffer` = 64 MB |
| 2 | Non-zero exit + stderr | Throws with stderr message |
| 3 | Non-zero exit + empty stderr | Throws with fallback `git ... exited N` |
| 4 | Spawn error (ENOBUFS) | Surfaces the error |
| 5 | Multi-segment paths | All roots parsed correctly |

## How to run

```bash
pnpm -C tools/scope-classifier test
```

## Evidence

```
 ✓ tests/gitTouched-enobufs.test.ts  (5 tests) 41ms
 Test Files  11 passed (11)
      Tests  19 passed (19)
```
