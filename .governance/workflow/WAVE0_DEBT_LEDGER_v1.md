# Wave 0 Debt Ledger v1

## Date

2026-03-18

## Purpose

This ledger is the measured hygiene baseline for the next Codex-owned cleanup lane. It is inventory only. It does not authorize a blind sweep.

## Scope

- `frontend/apps/os-shell/src/**`
- Current committed + working-tree truth only
- No archive claims
- No backend claims

## Proof Floor

- `pnpm run type-check`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
- `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx`

## Probe Snapshot

The following probes were rerun on 2026-03-18:

- `rg -n 'console\\.' frontend/apps/os-shell/src`
- `rg -n '@ts-ignore' frontend/apps/os-shell/src`
- `rg -n --glob '*.ts' --glob '*.tsx' '\\bany\\b' frontend/apps/os-shell/src`
- `rg -n 'TODO|FIXME|HACK' frontend/apps/os-shell/src`
- `rg -n 'describe\\.skip|it\\.skip|test\\.skip' frontend/apps/os-shell/src`

## Current Counts

| Signal | Count | Interpretation |
|-------|-------|----------------|
| raw `console.` matches | `960` | Zero-console is not the current baseline for active `os-shell`; Wave 0 must inventory before it edits |
| `@ts-ignore` matches | `0` | Preserve this baseline |
| raw `any` matches | `1010` | Still the primary typing debt bucket |
| `TODO` / `FIXME` / `HACK` matches | `37` | Small enough for later bounded review |
| skip markers | `164` | Large enough to require a separate test-truth audit instead of opportunistic cleanup |

## Workbench Host Dependency

- The Workbench real-host gate is green.
- The former Atlas blocker was stale.
- The actual harness defect was Dais lazy hosting in `workbenchRealHosting.gate.test.tsx`.
- Wave 0 is now unblocked and can rely on current host truth.

## Highest-Volume Production `any` Hotspots

These are the highest raw production-path `any` concentrations from the current probe. Test files and declaration support files were excluded from this top-file list.

| Rank | Raw `any` hits | File |
|------|----------------|------|
| 1 | `44` | `frontend/apps/os-shell/src/api/researchServices.ts` |
| 2 | `22` | `frontend/apps/os-shell/src/components/brand/WebGLEffects.tsx` |
| 3 | `18` | `frontend/apps/os-shell/src/services/enhancementCommunicationService.ts` |
| 4 | `16` | `frontend/apps/os-shell/src/applications/terra-levy/hooks/useAIAssistant.ts` |
| 5 | `15` | `frontend/apps/os-shell/src/services/performance.ts` |
| 6 | `13` | `frontend/apps/os-shell/src/components/dashboard/DashboardWidgets.tsx` |
| 7 | `12` | `frontend/apps/os-shell/src/applications/terra-levy/components/ai/AIAssistant.tsx` |
| 8 | `12` | `frontend/apps/os-shell/src/services/gptHub.ts` |
| 9 | `12` | `frontend/apps/os-shell/src/services/QuantumModuleManager.ts` |
| 10 | `11` | `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts` |
| 11 | `11` | `frontend/apps/os-shell/src/applications/terra-levy/hooks/useJupyterLab.ts` |
| 12 | `10` | `frontend/apps/os-shell/src/hooks/useErrorHandler.ts` |

## Triage Buckets

### Bucket A — Production service/API typing

Best bounded Codex lane after approval:

- `frontend/apps/os-shell/src/api/researchServices.ts`
- `frontend/apps/os-shell/src/services/enhancementCommunicationService.ts`
- `frontend/apps/os-shell/src/services/gptHub.ts`
- `frontend/apps/os-shell/src/services/QuantumModuleManager.ts`
- `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`

Why this bucket first:

- High `any` concentration
- Mechanical typing work is more likely than product redesign
- Good fit for Codex bounded sweeps plus proof

### Bucket B — Terra-levy AI hooks and components

Likely second lane:

- `frontend/apps/os-shell/src/applications/terra-levy/hooks/useAIAssistant.ts`
- `frontend/apps/os-shell/src/applications/terra-levy/hooks/useJupyterLab.ts`
- `frontend/apps/os-shell/src/applications/terra-levy/components/ai/AIAssistant.tsx`

Risk:

- Can bleed into Wave 2/GPT scope if not file-fenced

### Bucket C — Render/support surfaces

Needs tighter judgment before edits:

- `frontend/apps/os-shell/src/components/brand/WebGLEffects.tsx`
- `frontend/apps/os-shell/src/components/dashboard/DashboardWidgets.tsx`
- `frontend/apps/os-shell/src/services/performance.ts`
- `frontend/apps/os-shell/src/hooks/useErrorHandler.ts`

Risk:

- These files may use permissive typing around browser APIs or visualization libraries and could need compatibility-specific handling

### Bucket D — Test truth debt

Not a default Codex cleanup sweep:

- skip markers = `164`
- raw test/support `any` debt remains high

This needs its own audit lane so we do not convert quarantined or intentionally skipped tests into false health signals.

## Non-Goals

- No broad repo-wide refactor
- No auth redesign here
- No GPT/RAG architecture decisions here
- No “make counts smaller” edits without file-fenced acceptance criteria
- No claim that console cleanup is already complete

## Recommended Next Bounded Slices

1. Wave 1 auth/context threading on the named surfaces from Slice 25.4.
2. If a Codex-only hygiene slice is opened before Wave 1, start with Bucket A production service/API typing only.
3. Hold skip-marker cleanup and test-wide `any` removal until a dedicated test-truth audit is opened.

## Save State

- Workbench host proof is green.
- Wave 0 inventory exists.
- The next unblocked implementation lane is Wave 1 auth/context threading.
