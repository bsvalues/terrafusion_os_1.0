# CP-19 Codex Integration Proof

## Run Metadata
- Date: 2026-03-26
- Commit: PENDING
- Environment: local developer workstation
- Base URL: `http://localhost:5000`
- Correlation ID: populated per smoke run

## Preflight
- Working tree clean: pending proof run
- `backend/service-registry.json` disposition: generated local runtime artifact; removed before proof work
- Source discovery completed: yes
- Source-derived controller: `backend/src/TerraFusion.AI/Controllers/Codex369Controller.cs`
- Source-derived hub mapping: `backend/src/TerraFusion.API/Program.cs` -> `/hubs/codex369`
- Dashboard request path: `frontend/apps/os-shell/src/components/CodexDashboard.tsx`

## Source-Derived REST Coverage
The live source does not expose `/api/codex/*`. The active controller is `Codex369Controller` under `/api/codex369`.

| Name | Method | Path | Expected | Actual | Pass/Fail |
|------|--------|------|----------|--------|-----------|
| realtime | GET | `/api/codex369/realtime` | `200` | pending run | pending |
| foundation | GET | `/api/codex369/foundation` | `200` | pending run | pending |
| amplification | GET | `/api/codex369/amplification` | `200` | pending run | pending |
| ultimate-power | GET | `/api/codex369/ultimate-power` | `200` | pending run | pending |
| health-summary | GET | `/api/codex369/health-summary` | `200` | pending run | pending |

Excluded from this proof:
- `POST /api/codex369/status` (request body contract path, not needed for minimal live proof)
- `GET /api/codex369/validate-safeguard` (single-parameter utility endpoint)

## Hub Coverage
- Hub path: `/hubs/codex369`
- Negotiate: pending run
- Connect: pending run
- Join session: `SubscribeToFrameworkUpdates(<session>)`
- Round-trip event: `FrameworkStatusUpdate` or another server event after subscribe/recalculation
- Disconnect: pending run

## Correlation ID Propagation
- Dashboard source path: `CodexDashboard.tsx`
- Header injected: `X-Correlation-ID`
- Dashboard route corrected from stale `/api/codex/system-wide` to live `/api/codex369/realtime`
- Server-side evidence: pending proof run
- Notes: if the server does not echo the header, capture request-side evidence plus any server log or trace evidence available

## Files Changed
- `frontend/apps/os-shell/src/components/CodexDashboard.tsx`
- `os-platform/development/testing-suite/phase32-codex-routes.json`
- `os-platform/development/testing-suite/phase32-codex-live-smoke.mjs`
- `os-platform/development/testing-suite/phase32-codex-collab-smoke.mjs`
- `docs/superpowers/artifacts/cp19/codex-integration-proof.md`

## Commands Run
```bash
git status --porcelain
rg -n "class Codex369Controller|\\[Http(Get|Post)|Route\\(\"api/\\[controller\\]\"\\)" backend/src/TerraFusion.AI/Controllers/Codex369Controller.cs
rg -n "MapHub<|/hubs/codex369|Codex369Hub" backend/src/TerraFusion.API/Program.cs backend/src/TerraFusion.AI
rg -n "CodexDashboard|X-Correlation-ID|/api/codex" frontend/apps/os-shell/src/components/CodexDashboard.tsx
node os-platform/development/testing-suite/phase32-codex-live-smoke.mjs
node os-platform/development/testing-suite/phase32-codex-collab-smoke.mjs
```

## Outcome

- C1 pass/fail: pending runtime proof
- Current bounded defect already corrected: dashboard was pointed at stale `/api/codex/system-wide` with no `X-Correlation-ID` header
- Recommended next card:
  - if both smoke scripts pass: `CARD-CODEX-02 — Phase C2 contract closure`
  - if a tiny local wiring issue remains: `CARD-CODEX-03 — bounded Codex hardening`
