# CP-19 Proof Results

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: blocked

## Command Results

| Command | Result (pass/fail) | Evidence Link | Notes |
|---|---|---|---|
| pnpm run governance:check | pass | terminal rerun 2026-03-19 | Phase83 56/56, Phase85 22/22, Phase86 9/9, generated JS headers verified |
| pnpm run ci:governance-proof | pass | terminal rerun 2026-03-19 | Scope proof + governance sentinel completed, snapshot generated |
| pwsh -File ops/dev/tf.ps1 status | fail | terminal rerun 2026-03-19 | WSL/Docker connection error `Wsl/Service/0x8007274c` (exit code 0 but status retrieval failed) |

## Decision Summary

- Gate outcome: blocked
- Blocking issues: local Docker/WSL environment unavailable for `tf.ps1 status`; upstream gates G3–G9 still open
- Next action: start Docker Desktop + WSL2, rerun `tf.ps1 status`, and continue closing upstream phase seals
