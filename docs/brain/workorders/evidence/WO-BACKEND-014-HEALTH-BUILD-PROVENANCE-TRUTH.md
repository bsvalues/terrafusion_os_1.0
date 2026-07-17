# WO-BACKEND-014 - Health Build-Provenance Truth Evidence

## Selection Evidence

- Portfolio reconciliation found the Sync workbook chain already complete through `WO-SYNC-155` in
  its canonical repository, so stale `WO-SYNC-132` routing was rejected.
- PR #1153 is a bounded three-file correctness fix but is 142 commits behind current main.
- Its five review threads are marked resolved even though the branch still lacks the requested
  placeholder, trimming, assembly-selection, and visibility corrections.
- This Work Order rebuilds that behavior from current main rather than merging or rebasing the stale
  branch.

## Implemented Proof

- `TF_GIT_SHA` remains first priority when meaningful.
- `unknown`, blank, and whitespace environment values fall through to the assembly stamp.
- The controller reads its declaring assembly, not the ambient executing assembly.
- The resolver is internal and remains unit-testable through the existing friend assembly.
- `GITHUB_SHA` populates `SourceRevisionId` without invoking Git during the build.

## Validation Evidence

- TDD red proof: focused compilation failed because `ResolveGitSha` did not exist.
- Focused tests after implementation: 13 passed, 0 failed.
- Canonical Release solution build: PASS, 0 warnings, 0 errors.
- Build-stamp inspection: PASS; the compiled API assembly contains the supplied 40-character SHA.
- Full `TerraFusion.Unit.Tests` Release suite: 3,480 passed, 0 failed, 0 skipped.
- Registry JSON parse and `wo-query --json`: PASS; WO-BACKEND-014 is terminal and no stale candidate
  is returned.
- Core TypeScript type-check: PASS.
- Phase83 core tool gate: 56 passed, 0 failed.
- Frozen pnpm bootstrap: PASS; `package.json` and `pnpm-lock.yaml` hashes remained unchanged and no
  tracked bootstrap residue was created.
- `git diff --check`: PASS.
- Remote checks and exact-head assurance are required before protected merge.

The optional repository-wide .NET formatter reports the controller's pre-existing four-space
indentation against a two-space preference across the whole file. The Work Order preserves the
established file style rather than introducing an unrelated full-file formatting rewrite; compiler
and test gates are clean.

## Non-Claims

- No deployment was performed.
- No live endpoint was queried.
- No secret, county, PACS, SQL, migration, schema, or production resource was accessed.
- This packet does not claim that every historical artifact was built with a source revision stamp.
