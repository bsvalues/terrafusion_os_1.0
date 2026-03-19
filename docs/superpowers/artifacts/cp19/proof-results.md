# CP-19 Proof Results

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: blocked

## Command Results

| Command | Result (pass/fail) | Evidence Link | Notes |
|---|---|---|---|
| pnpm run governance:check | fail | terminal run 2026-03-19 | Fails at `tools/registry/check-generated-js.mjs`: missing generated header `os-platform/core/pilot/swarmTraceAdapter.js` |
| pnpm run ci:governance-proof | pass | terminal run 2026-03-19 | Scope proof, renovate scope log, and governance sentinel completed |
| pwsh -File ops/dev/tf.ps1 status | fail | terminal run 2026-03-19 | Access denied writing `C:\tf.log`; WSL service connection error `0x8007274c` |

## Decision Summary

- Gate outcome: blocked
- Blocking issues: missing generated header for governance check; local environment/logging issue for `tf.ps1 status`
- Next action: regenerate expected core js headers and fix tf logging path/permissions, then rerun CP-19 command wall
