---
name: regression-guard
description: After a patch lands, run the proof wall — type-check, affected tests, architectural smoke suites — and diff-scan for accidental scope creep. Solo-dev anti-regression shield.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git log *), Bash(git status *), Bash(npx *), Bash(pnpm *), Bash(bash .claude/skills/regression-guard/run.sh *)
---

Run regression guard after: $ARGUMENTS

Steps:

1. Run the guard script:
   `bash .claude/skills/regression-guard/run.sh "$ARGUMENTS"`

2. Report in this order:

   **SCOPE CHECK**: files changed vs expected scope
     - List changed files
     - Flag any file outside the expected scope with SCOPE_DRIFT warning

   **TYPE-CHECK**: pass / fail + first error if any

   **AFFECTED TESTS**: test files targeting changed source + results

   **SMOKE SUITES**: always-run architectural gates
     - forgeSuiteSourceHonesty.contract.test.tsx
     - managementDashboard.contract.test.tsx
     - EvidenceRail-lane-i.test.tsx

   **VERDICT**:
     - CLEAN — all gates green, no scope drift
     - SOFT FAIL — scope drift only (describe what drifted)
     - HARD FAIL — type errors or test failures (list them)

Rules:
- A HARD FAIL blocks commit. Fix before sealing.
- SCOPE_DRIFT is informational — confirm with user before proceeding.
- Do not re-run the full suite; run only the targeted + smoke sets.
