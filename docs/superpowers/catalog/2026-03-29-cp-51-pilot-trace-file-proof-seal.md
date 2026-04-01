# CP-51 Pilot And Trace File-Proof Seal

**Date**: 2026-03-29  
**Purpose**: seal the exact host files and bounded scope for `45C` so it can move from `HOLD-CARD` to an issuable Copilot card  
**Lane**:
- Codex: docs/control-plane only
- Copilot: runtime execution only after promotion lands in the packet chain

## Exact File Proof

- Pilot host file: `frontend/apps/os-shell/src/pages/PilotHome.tsx`
- Trace host file: `frontend/apps/os-shell/src/pages/TraceHome.tsx`

## Scope Read

- A bounded two-file card is plausible.
- Current launcher and registry wiring already points at these hosts.
- Visible posture alignment does not appear to require `moduleComponents.tsx`, `suiteRegistry.ts`, desktop manifest files, or route rewrites.

## Promotion Recommendation

Promote `45C` from `HOLD-CARD` to `PARALLEL-CLEAR`.

### Allowed Files

- `frontend/apps/os-shell/src/pages/PilotHome.tsx`
- `frontend/apps/os-shell/src/pages/TraceHome.tsx`

### Why promotion is safe

1. exact host files are now proven
2. current routing and activation look sufficient already
3. no shared hot-file dependency is required for visible posture work

## Follow-On Control-Plane Changes

1. update the hold-card unlock ledger
2. add `45C` to the execution scoreboard
3. add `45C` to the parallel pool in the master plan
4. add `45C` to the collision matrix with `NONE` overlap against the current Wave 2 pool
