# CP-18 Proof Results

Date: 2026-03-19
Phase: CP-18
Gate: G9
Status: blocked

## Command Results

| Command | Result (pass/fail) | Evidence Link | Notes |
|---|---|---|---|
| pnpm run security:scan | pass | terminal run 2026-03-19 | Optional scanner config missing, command exits 0 with skip notice |
| pnpm run validate:compliance | fail | terminal run 2026-03-19 | mcp:validate fails: missing module `mcp-init-validation.cjs` |
| pnpm run ci:dependency-scope-quarantine:gate | pass | terminal run 2026-03-19 | Quarantine gate succeeded (14 current vs 141 baseline) |

## Decision Summary

- Gate outcome: blocked
- Blocking issues: missing `mcp-init-validation.cjs` blocks compliance validation
- Next action: restore or repoint `mcp:validate` entrypoint, rerun full CP-18 command wall
