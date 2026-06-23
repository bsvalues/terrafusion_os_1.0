# June 10 Rehearsal Proof Capture Notes

Status: READY_FOR_DEMO after J10-UI-ALIGN
Captured: 2026-06-07

## Scope

This proof capture verifies the June 10 launch posture only:

- Statewide county operating model
- Benton Runtime Pilot
- 38 counties Onboarding / Provenance / Intake
- TerraFusion DB -> TerraFusion API -> TerraFusion apps runtime path
- Non-Benton runtime actions blocked until county-specific DB/API proof exists

It does not claim production readiness, full statewide certification, full TerraFusion Sync product readiness, or official AI valuation readiness.

## Live Rehearsal Result

Result: PASS

Runtime used for local proof capture:

- Frontend: http://localhost:${TF_FRONTEND_PORT:-3102}/
- Backend: http://localhost:${TF_API_PORT:-5046}/
- Note: if the default frontend port is occupied, set TF_FRONTEND_PORT (or use Vite’s chosen port) and capture that value in the run log.

Verified:

- Top bar shows `Statewide county operating model | Benton County | Assessor's Office | Runtime Pilot`.
- Shell home shows Benton as `Benton Runtime Pilot`.
- Shell home shows the statewide posture as `38 counties Onboarding / Provenance / Intake`.
- Yakima switch path shows `Onboarding / Provenance Inventory`.
- Yakima switch path shows `Not Runtime Enabled`.
- Yakima switch path references `County Data Intake` and `canonical import disabled`.
- Benton Workbench parcel `101040000000000` loads real parcel fields.
- Workbench source disclosure shows `TerraFusion DB/API-backed`.
- Workbench does not show `Non-live data` for the verified Benton parcel path.
- Local backend `/health` returned HTTP 200.
- UI health probe returned HTTP 200.

## Captured Screenshots

- `screenshots/j10-ui-align-01-shell-benton-runtime-pilot.png`
- `screenshots/j10-ui-align-02-non-benton-onboarding.png`
- `screenshots/j10-ui-align-03-benton-workbench-parcel.png`

## API Evidence

Observed during proof capture:

- `GET /health` -> 200
- `GET /api/properties/parcel/101040000000000` -> 200
- `GET /api/properties?search=101040000000000&pageSize=15&page=1` -> 200

Observed but not a demo blocker:

- `GET /api/properties/parcel/101040000000000/activity` -> 401

The activity endpoint is not part of the June 10 proof claim. The Benton parcel summary path remains DB/API-backed and live.

## Posture

- Controlled Statewide Runtime Preview wording removed from demo-visible path.
- `Benton absent by design` wording removed from demo-visible path.
- Runtime pilot language is Benton-specific.
- Non-Benton counties remain onboarding/provenance/intake only.
- Production binding remains blocked.
- Full statewide certification remains blocked.
