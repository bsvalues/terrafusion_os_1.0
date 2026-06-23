# WO-LOCALOPS-006 — TerraPilot In-Shell LocalOps UI

- **Risk:** R4 (shell wiring) · **Suite:** OS shell / TerraPilot · **Agent:** Claude Code
- **ESCALATION:** E3/E4 per `brain classify` — explicit architect approval required AT DISPATCH even though the LocalOps direction is operator-approved. Confirm before executing this WO.
- **Surface:** extend the existing TerraPilot panel surface (`frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx` + siblings) with a LocalOps surface; launch through the canonical pathway (`orchestration/moduleActivation.ts` + `config/moduleComponents.tsx`). In-shell window only — dock/top bar stay visible, no full-page route escape.
- **Goal:** LocalOps surface with sections: Ask, Explain, Diagnose, Runbook, Sources, Trace. Header shows active AI profile/provider and "external calls disabled" status under localops. Wires WO-002 provider, WO-004 KB, WO-005 diagnostics, WO-003 trace feed.

## Files likely touched
- `frontend/apps/os-shell/src/components/pilot/LocalOpsSurface.tsx` (new) + section components
- `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx` (extend — minimal diff)
- `frontend/apps/os-shell/src/config/moduleComponents.tsx` (register render mapping IF a new module id is needed; prefer extending the existing TerraPilot module to avoid registry churn — `generatedModules.ts` is AUTO-GENERATED, do NOT hand-edit it)
- `frontend/apps/os-shell/src/__tests__/pilot/localOpsSurface.test.tsx` (new)
- `docs/localops/LOCALOPS_IMPLEMENTATION_LOG.md` (append)

## Allowed files
- `frontend/apps/os-shell/src/components/pilot/**`
- `frontend/apps/os-shell/src/config/moduleComponents.tsx`
- `frontend/apps/os-shell/src/__tests__/pilot/**`
- `docs/localops/**`
- `docs/brain/memory/**`

## Acceptance criteria
- [ ] Opens as in-shell OS feature window via the canonical activation pathway; no new top-level route
- [ ] Shows profile/provider + external-call status truthfully (ui-honesty-pass clean — no aspirational claims)
- [ ] design-token-police CLEAN on new/changed files; TDC ratchet not exceeded
- [ ] frontend type-check clean; new component tests green; existing pilot + workbench gating tests intact
- [ ] No write/mutation affordances anywhere in v1 UI (approval-gate UI is a later, separate decision)

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-LOCALOPS-006`
- `npm run type-check` (frontend) + vitest for pilot components
- design-token-police + ui-honesty-pass on changed files
- browser proof: screenshot of LocalOps window inside shell with dock visible

## Rollback
- Remove LocalOpsSurface + revert the small TerraPilotPanel/moduleComponents hunks (path-limited revert).

## Stop conditions
- requires editing `generatedModules.ts` by hand or resurrecting `applications/` generation (D-010 TOLERATE state) → operator
- requires shell routing changes beyond module registration → operator (R4→R5)
- window contract (frozen route table / window contract memory) would change

## Non-goals
- No standalone app, no new route table entries, no mutation UI, no approval-workflow build-out.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-LOCALOPS-006",
  "task": "TerraPilot in-shell LocalOps UI: Ask/Explain/Diagnose/Runbook/Sources/Trace inside the OS shell window contract",
  "risk": "R4",
  "suite": "OS shell / TerraPilot",
  "allowed_files": [
    "frontend/apps/os-shell/src/components/pilot/**",
    "frontend/apps/os-shell/src/config/moduleComponents.tsx",
    "frontend/apps/os-shell/src/__tests__/pilot/**",
    "docs/localops/**",
    "docs/brain/memory/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/ai-systems/ai-systems/ai-swarm/**",
    "frontend/src/**",
    "frontend/components/**",
    "frontend/apps/os-shell/src/config/generatedModules.ts",
    "frontend/apps/os-shell/src/pages/workbench/**",
    "backend/**",
    "os-platform/core/trace/**",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md",
    "tools/registry/terrapilot.tools.json"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-LOCALOPS-006"
  ]
}
```
