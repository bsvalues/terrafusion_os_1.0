# Wave 2 Governed Backend Truth Ledger

Date: 2026-03-18
Status: Closed for the governed core pilot boundary

## Scope Boundary

- Allowed write surface only:
  - `os-platform/core/pilot/**`
  - `os-platform/core/types/**`
  - `tools/registry/**`
- This closure covers governed manifest/schema truth, pilot ingress truth, real-handler reachability truth, and trace/export/auth proof inside the core pilot boundary.
- Frontend GPT/RAG wiring remains out of scope for this phase and requires explicit authorization outside the core-governance surface.

## Repo-Reality Corrections

- The current governed truth is manifest version `2.0.0`, not the older `1.3.0` anchor still referenced in frozen collateral.
- The canonical manifest currently carries `93` tools, not the older `24`-tool R1 snapshot.
- `tools/registry/INVOKE_CONTRACT.md` is therefore classified as frozen documentation drift:
  - stale manifest version
  - stale tool count
  - stale `/pilot/validate` response shape
- That drift is recorded here, not silently rewritten during this governed-core closure.

## Must-Fix-Now Drift Closed

| Surface | Drift | Closure |
| --- | --- | --- |
| `tools/registry/terrapilot.tools.schema.json` | Schema lagged the live manifest on version anchor, suite enums, touch targets, payload stores, office scope, and params schema support. | Schema now pins `2.0.0` and accepts the live manifest surface. |
| `os-platform/core/types/index.ts` | Runtime type surface lagged the live manifest on touch targets, nullable payload store, governance metadata, and params schema. | Types now mirror the live manifest/schema boundary. |
| `os-platform/core/pilot/ToolRegistry.ts` | Registry still accepted the obsolete manifest version anchor. | Registry now rejects non-`2.0.0` manifests. |
| `os-platform/core/pilot/dev-pilot-runtime.mjs` | `/pilot/validate` used a smaller sidecar rule set instead of the canonical `ToolRunner.validate()` path. | `/pilot/validate` now delegates to `ToolRunner.validate()` with the same header/body-derived execution context used by invoke. |
| `os-platform/core/pilot/dev-pilot-runtime.mjs` | `/pilot/invoke` assembled context inline, creating ingress drift risk. | Invoke now uses the shared `buildPilotExecutionContext()` helper. |

## Current Canonical Truth

### Manifest / Registry Truth

- Manifest version: `2.0.0`
- Handler coverage proof: `93/93`
- Live suite surface exercised by the manifest:
  - `atlas`
  - `audit`
  - `clerk`
  - `dais`
  - `dossier`
  - `forge`
  - `gpt`
  - `os`
  - `pilot`
  - `treasury`
- Live touch targets exercised by the manifest include:
  - `canon`
  - `canon_file`
  - `compliance`
  - `exemption`
  - `levy`
  - `recording`
  - `tax`
- Live payload stores exercised by the manifest include:
  - `audit`
  - `clerk`
  - `dossier`
  - `secure-blob`
  - `treasury`
- Schema now explicitly supports:
  - `officeScope`
  - `governance`
  - `paramsSchema`

### Pilot Ingress Truth

- `POST /pilot/invoke`
  - canonical execution path
  - uses `buildPilotExecutionContext()`
  - executes through `ToolRunner.execute()`
- `POST /pilot/validate`
  - canonical validation path
  - uses `buildPilotExecutionContext()`
  - validates through `ToolRunner.validate()`
- Validation behavior proven in runtime tests:
  - mode mismatch is a canonical early stop
  - when mode passes, risk-policy and RBAC violations are returned from the shared runner logic
  - irreversible and county-isolation behavior stay aligned between validate and invoke

### Real Handler / Backend / Auth / Trace Truth

- `registerPhase84Handlers()` is always active in the dev pilot runtime.
- `registerR1Handlers()` activates only when `TF_API_BASE_URL` or `TF_API_PORT` is present.
- `r1-boot-wiring` proof is green for the real handler registration seam.
- `pilotAuth.ts` remains the canonical service-auth seam:
  - calls `POST /api/auth/login`
  - caches the token in-process
  - refreshes five minutes before expiry
- `backendClient.ts` remains the canonical backend reachability seam:
  - `TF_API_BASE_URL` full override
  - otherwise `TF_API_PORT`
  - default port `5046`
- Trace evidence and export integrity are proven green through the governed wall below.
- Live auth smoke was not executed in this closure because backend health at `http://localhost:5046/health` was unavailable.

## Verification Wall

- `node --test os-platform/core/pilot/manifest-schema-parity.test.mjs`
  - PASS `2/2`
- `node --test os-platform/core/pilot/dev-pilot-runtime.test.mjs`
  - PASS `5/5`
- `pnpm run build:core-js`
  - PASS
- `pnpm run check:generated`
  - PASS
- `pnpm run type-check`
  - PASS
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
  - PASS `56/56`
- `node --test os-platform/core/tests/c2-write-lane-governance.test.mjs`
  - PASS `27/27`
- `node --test os-platform/core/tests/c3-golden-fixture-contracts.test.mjs`
  - PASS `11/11`
- `node --test os-platform/core/tests/d1-trace-evidence-export.test.mjs`
  - PASS `10/10`
- `node --test os-platform/core/tests/r1-boot-wiring.test.mjs`
  - PASS `4/4`
- `node --test os-platform/core/tests/lane-k-trace-export-endpoint.test.mjs`
  - PASS `13/13`
- `node --test os-platform/core/tests/lane-t-export-contract-freeze.test.mjs`
  - PASS `7/7`
- `node --test os-platform/core/tests/r1-auth-smoke.test.mjs`
  - NOT RUN
  - blocker: backend `http://localhost:5046/health` unavailable

## Next Lawful Step

- Governed core backend truth is closed.
- The next implementation phase in the original roadmap is frontend GPT/RAG wiring, which is outside the current `AGENTS.md` write boundary.
- If that phase is opened, it should be done under explicit authorization for `frontend/apps/os-shell/**`.
