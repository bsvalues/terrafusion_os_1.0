# June 10 Browser Smoke Proof

Status: `PASS_WITH_RUNTIME_WARNING`

Checked at: `2026-04-29T18:04:30Z`

Runtime:

- Frontend: `http://127.0.0.1:5175/forge/county-studio`
- Backend: `http://127.0.0.1:5046`
- Worktree: `C:/Users/bsval/.codex-worktrees/june10-coverage-proof`

## Workflow Proven

- Opened `County Studio`.
- Opened Benton County `2026 MassAppraisal` draft study.
- Verified `ATLAS LIVE`.
- Verified county command strip values: `5,559 sales · 128,784 parcels`.
- Verified `1 cohort · 2 scenarios`.
- Verified health metrics: median ratio `0.927`, COD `41.3`, PRD `1.399`.
- Verified top-risk action items render.
- Verified Neighborhood and Reval remain separate in the UI, including `Neighborhood 16081 · Reval 6`.

## Fixes Proven

- Vite dev proxy now resolves relative `VITE_API_URL=/api` to backend target `http://localhost:5046`.
- Vite dev proxy now forwards `/hubs/*` to backend SignalR.
- County Study SignalR now resolves relative `/api` bases to `/hubs/county-study`, not `/api/hubs/county-study`.

## Runtime Warning

A prior backend run exited after an unrelated AI Assistant dependency-resolution failure: `IComplianceService` could not be resolved for `AIAssistantService`. County Studio smoke passed after backend restart, but this remains a separate backend readiness follow-up.

## Limits

- Benton browser proof only.
- Does not prove statewide geometry coverage.
- Does not prove Statistics Studio parity.
