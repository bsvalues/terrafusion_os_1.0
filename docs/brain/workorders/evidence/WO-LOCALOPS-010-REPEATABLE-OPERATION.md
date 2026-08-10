# WO-LOCALOPS-010 — Repeatable LocalOps Operation Evidence

## Implementation

- `os-platform/core/pilot/localops-hermes-lifecycle.mjs` owns the fixed loopback SSH child, Ollama
  health/model gate, existing LocalOps proof use, exact-child termination, and listener-release check.
- `pnpm run localops:hermes` is the routine operator entrypoint.
- The inference environment explicitly sets external calls, web, shell, and mutation to `false`.
- A pre-existing loopback listener is refused and never killed or reused.

## Automated proof

- Lifecycle suite: 15 passed. Covers positive lifecycle, missing model, provider failure, unexpected
  use failure, interruption, listener cleanup failure, early SSH exit, occupied-port refusal, fixed
  boundary enforcement, exact SSH arguments, and inherited-forward refusal.
- LocalOps journey plus Ollama/lifecycle regressions: 57 passed after the final remediation.
- Phase 8.3 core gate: 56 passed.
- Core TypeScript check: passed.
- Generated JavaScript header check: passed.
- `git diff --check`: passed.

## Live positive proof

- Listener count on `127.0.0.1:11455` before start: `0`.
- Boundary: `hermes-ssh-tunnel`; provider: `ollama`; model: `llama3.2:3b`; health: `ready`.
- Response retained only as SHA-256
  `8aad3b556ecc6debc9b870aa7a8859fafc21a4f25a200790b241c550913700b1` and UTF-8 length `145`.
- Lifecycle exit: `0`; cleanup: `released`; listener count after cleanup: `0`.

## Live negative proof

- The lifecycle was pointed at an operator-owned loopback fixture listener.
- Result: `LOCALOPS_LOCAL_PORT_IN_USE`, cleanup `not-started`, exit `1`.
- The fixture remained bound and owned after refusal, proving the lifecycle did not touch an unknown
  listener; the fixture was then closed by its creator.

## Safety posture

No Hermes/Forge/Atlas configuration changed. No external AI provider, web, model shell capability,
database query, migration, county data, secret, or production cutover was used.
