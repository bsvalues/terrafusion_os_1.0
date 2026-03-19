# TerraCanon Bounded Charter (Phase 35-D Recon)

Date: 2026-03-19
Lane: Slice 35 Lane 2 (TerraCanon IDE)
Status: Recon complete, implementation gated
Entry gate consumed: GATE-35-1
Implementation gate: Founder acceptance of this charter before Phase 35-E

---

## 1) Bounded Scope (MVP)

This MVP is not a greenfield IDE. TerraCanon already has substantial shell and editor surfaces.
Phase 35-E must be an integration and hardening slice, bounded to the contract below.

MVP contract:
1. Monaco editing remains the primary editor runtime.
2. File open/save/create/delete/rename flows remain inside Canon API boundaries.
3. TerraPilot explain entry points are available from TerraCanon without widening write authority.
4. TerraTrace emits canonical append-only events for editor actions.
5. No arbitrary code execution is enabled in main thread; sandbox remains a separate gated phase.

Out of scope for MVP:
- New standalone workspace package split (`packages/canon`) in this slice.
- Runtime plugin marketplace for executable extensions.
- Main-thread eval or unrestricted terminal execution.

---

## 2) Recon Findings (TC-A through TC-G)

### TC-A: Monaco integration surface
- `frontend/apps/os-shell/src/canon/CanonEditor.tsx` already uses `@monaco-editor/react` with local `monaco-editor` workers.
- Worker routing exists for editor, TS/JS, JSON, CSS, and HTML workers.
- Canon editor already wires completions, hovers, definitions, references, rename, code actions, inlay hints, document links, and folding ranges through Canon APIs.

Conclusion: Monaco integration exists and is broad. Phase 35-E should avoid replatforming and focus on contract hardening + trace wiring completeness.

### TC-B: AI service wiring points
- Pilot API surface exists at `frontend/apps/os-shell/src/api/pilotApi.ts` with mode-aware invoke/validate flows.
- Explain API exists at `frontend/apps/os-shell/src/api/explainApi.ts` (`/api/gpt/explain`).
- Workbench explain bridge exists at `frontend/apps/os-shell/src/api/workbenchExplainModelInputs.ts` (`/pilot/workbench/explain-model-inputs`).

Conclusion: AI entry points already exist. TerraCanon should consume existing explain contracts, not add a parallel AI channel.

### TC-C: File system/workspace API surface
- Canon filesystem/editor API client exists at `frontend/apps/os-shell/src/api/canonFs.ts`.
- Existing endpoints include `canon/ls`, `read`, `write`, `create`, `delete`, `rename`, `search`, `diff`, `git-status`, diagnostics, outline, and editor-intelligence endpoints.

Conclusion: File API abstraction already exists and is feature-rich. Phase 35-E should standardize and trace these calls rather than introducing a second API layer.

### TC-D: Existing TerraCanon shell and route
- TerraCanon route exists at `frontend/apps/os-shell/src/Router.tsx` path `/canon`.
- `frontend/apps/os-shell/src/pages/CanonHome.tsx` is a large workspace shell with tabs, dialogs, search, command palette, terminal panel, persistence, and cross-tab sync.
- Canon module mapping exists in `frontend/apps/os-shell/src/config/moduleComponents.tsx` via `os-canon` plus aliases (`canon`, `terracanon`).

Conclusion: TerraCanon shell is already first-class. Phase 35-E should tighten governance and event contract, not rebuild shell scaffolding.

### TC-E: Build pipeline integration points
- Root scripts exist in `package.json`: `canon`, `canon:doctor`, `canon:gatefast`, `canon:ping`.
- `pnpm-workspace.yaml` has no dedicated canon package declaration.
- `tsconfig.core.json` is intentionally scoped to core OS/tooling and does not include frontend Canon modules.

Conclusion: Keep TerraCanon implementation in existing os-shell surfaces for this phase; package extraction can be deferred to a later charter.

### TC-F: TerraTrace + TerraPilot contract
- Canonical TerraTrace typed helpers exist in `frontend/apps/os-shell/src/services/terraTrace.ts`, including `emitToolInvoked`, `emitToolSucceeded`, `emitToolFailed`, `emitArtifactCreated`, `emitArtifactPublished`, and correlation ID generation.
- Existing helper set supports append-only event emission and county-scoped context.

Conclusion: TerraCanon must use canonical trace helpers for editor actions; no legacy trace helper usage for new TerraCanon writes.

### TC-G: Security and sandbox posture
- Canon editor already uses Web Workers, which is a good baseline for editor-service isolation.
- Backend `RequestValidationMiddleware` defines strict headers including `Content-Security-Policy: default-src 'self'` and `X-Frame-Options: DENY` (`backend/src/TerraFusion.API/Middleware/RequestValidationMiddleware.cs`).
- Recon did not find evidence that `RequestValidationMiddleware` is registered in startup pipeline.
- Canon API includes a `canon/exec` surface in client code; this must remain behind strict sandbox controls.

Conclusion: Security baseline is partially present but enforcement wiring is uncertain. No execution-surface expansion before explicit sandbox gates pass.

---

## 3) File Map for Phase 35-E (Exact Targets)

### Primary implementation files
- `frontend/apps/os-shell/src/pages/CanonHome.tsx`
- `frontend/apps/os-shell/src/canon/CanonEditor.tsx`
- `frontend/apps/os-shell/src/api/canonFs.ts`
- `frontend/apps/os-shell/src/services/terraTrace.ts`
- `frontend/apps/os-shell/src/api/pilotApi.ts`
- `frontend/apps/os-shell/src/api/explainApi.ts`

### Routing/module registration surfaces (only if needed)
- `frontend/apps/os-shell/src/Router.tsx`
- `frontend/apps/os-shell/src/config/moduleComponents.tsx`

### Tests/proof files (create or extend)
- `frontend/apps/os-shell/src/__tests__/desktop/**` (Canon contract tests)
- `frontend/apps/os-shell/src/__tests__/auth/**` (trace/policy contract checks if touched)

### Security verification surfaces (read/update only if required by scope)
- `backend/src/TerraFusion.API/Program.cs`
- `backend/src/TerraFusion.API/Middleware/RequestValidationMiddleware.cs`

Note: Any backend security changes must remain bounded to header/middleware wiring and cannot open new execution capabilities.

---

## 4) Proof Gates (Phase 35-E Exit)

Required:
1. `pnpm run type-check` passes.
2. `node --test os-platform/core/tests/phase83-tools.test.mjs` passes.
3. TerraCanon route/module smoke proof passes:
   - `/canon` route renders.
   - `os-canon` module alias opens Canon surface.
4. File action proof passes for open/read/save/create/rename/delete paths through Canon API client.
5. TerraTrace proof passes for TerraCanon action events:
   - editor-open event pair
   - save success/failure pair
   - explain request event pair
6. No new hardcoded ports introduced.

Recommended:
- Focused vitest selection for Canon tests under `frontend/apps/os-shell/src/__tests__/desktop/`.

---

## 5) Security Gates (Before Any Code Execution Enablement)

Execution policy gates:
1. No `eval` or `new Function` in TerraCanon runtime path.
2. Any execution endpoint remains deny-by-default without explicit county-scoped allowlist.
3. CSP/headers must be verified as active in effective middleware pipeline, not only defined in source.
4. Worker/iframe isolation required for execution payloads; main thread execution is prohibited.
5. TerraTrace must capture execution intent/result with correlation ID and risk labeling.
6. High/irreversible actions require confirmation and reason code via existing Pilot policy model.

If any gate fails, execution functionality is deferred; non-execution editing features may still ship.

---

## 6) Phase Sequencing for Implementation

### TC Phase 1: Shell and trace hardening
- Normalize TerraCanon action taxonomy (open/read/save/create/rename/delete).
- Wire canonical TerraTrace helper usage for editor and file actions.
- Keep existing route/module mappings stable.

### TC Phase 2: AI integration hardening
- Bind explain actions to existing `pilotApi`/`explainApi` contracts.
- Ensure mode-aware behavior (Pilot vs Muse) remains explicit.
- Add proof tests for explain request trace pair.

### TC Phase 3: Sandbox-execution readiness (gated)
- Recon and enforce execution isolation controls.
- Verify active CSP/header enforcement in runtime pipeline.
- Do not enable broad code execution unless all security gates pass.

---

## 7) Risks and Mitigations

Risk: duplicate IDE authority between existing Canon shell and new abstractions.
Mitigation: keep single-writer edits to existing Canon surfaces only.

Risk: silent drift from canonical TerraTrace helper contract.
Mitigation: add contract tests asserting typed helper usage for new TerraCanon actions.

Risk: execution surface exposure via `canon/exec` without complete sandbox policy.
Mitigation: execution remains gated; no widening until security gate checklist is green.

---

## 8) Acceptance Criteria for Founder Review

This charter is acceptable when:
1. Scope remains bounded to integration/hardening of existing TerraCanon surfaces.
2. File map and gates are explicit and testable.
3. Security posture for execution is treated as gated and conditional, not assumed complete.
4. Phase order is clear and allows Phase 35-E to proceed with one active writer.

Upon acceptance: open Phase 35-E implementation.
