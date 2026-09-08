# Atlas spatial anomaly candidate integration evidence

Status: CANDIDATE_PREPARATION; not protected adoption or browser acceptance.

Authority: original direct owner EO-TF-ATLAS-SPATIAL-ANOMALY-001, September 7, 2026,
coordinator task 01a07cd1-5e6f-7a72-9294-9ba4cb975fe9. The exact exchange is recorded in
docs/brain/workorders/active/WO-EO-TF-ATLAS-SPATIAL-ANOMALY-001.md. Its 9,109 bytes match
the suite specification SHA-256 06b68ac64f159215f2ea620740e3eae9fda58a38604b3ea833a18691adbcfa9f.
This OS branch is an unprotected candidate receipt, not prior protected OS contract authority.
The owner requires suite protection first, then exact OS adoption on this same companion branch/PR.

## Implemented preparation

- Actual ingress caller token is bound outside serializable tool context. The existing loopback
  backend client reads authorized /api/terraforge/regression with exact selected county/year and
  optional neighborhood. No service-token fallback or regression/ratio formula duplication.
- Source response bytes, digest, query and model identity accompany unchanged materialized
  residuals. Missing authorization, bad accounting, scope drift and unavailable backing fail closed.
- Only the anomaly legacy stub is retired. Real registration preserves other handlers and receives
  artifact configuration solely from OS registration, not tool parameters.
- The constrained Node child verifies manifest, module and specification identities and has bounded
  input/output/diagnostics/time plus a stripped credential environment. Portable runtime inventory
  contains the module and its complete empty transitive-dependency set.
- The PowerShell stager reads exact Git blobs, verifies inventory, rejects escaped/reparse paths,
  and retains recoverable previous content. Injected publication failure restores verified bytes.
- The existing Atlas suite and parcel Workbench mount the same source-backed panel. County comes
  from the authenticated context; assessment year and neighborhood are explicit. Scope changes
  discard pending/old evidence. Unsupported metrics are unavailable; no success fallback exists.
- .gitignore adds only the three assigned Atlas artifact/invocation/staging slots.

ATLAS_SPATIAL_ANOMALY_PIN deliberately remains null pending actual protected suite identity from
the coordinator. Neither candidate suite head nor synthetic fixture commit is a protected pin.
The production stager/runtime therefore fail closed while unconfigured. Synthetic process/stager
tests create their own temporary Git blobs and explicitly label those inputs as test fixtures.

## Focused verification

Bundled Node 24.19.0, own os-atlas dependencies. No foreign dependency tree or runtime reused.

- `node --test os-platform/core/tests/atlas-spatial-anomaly-process.test.mjs os-platform/core/tests/atlas-spatial-anomaly-handler.test.mjs`: 20 passed, zero failed/skipped.
- From frontend: `node ../node_modules/vitest/vitest.mjs run apps/os-shell/src/__tests__/atlas/spatialAnomalyPanel.test.tsx --maxWorkers=1 --minWorkers=1 --retry=0`: 10 passed. Initial missing panel import was RED; separate mount tests then failed on missing year/neighborhood controls (2 failed, 8 passed), followed by 10 GREEN. Existing React Testing Library act/Router future warnings and stale Browserslist database warnings remain visible, not suppressed.
- `node node_modules/typescript/bin/tsc -p tsconfig.core.json --pretty false`: exit 0.
- Own pinned pnpm9 filtered frozen-lockfile install completed exit 0 with normal lifecycle scripts;
  child-only canonical Path corrected initial Windows husky resolution failure. No package/lock edits.

No .NET build, candidate backend launch, browser fixture execution, tool maturity promotion,
protected OS merge or post-merge critical repeat is claimed. The admitted real browser harness
requires explicitly assigned loopback runtime/auth/data/protected identities; it has no mock route
or demo substitution. Those gates and independent OS exact-head review remain outstanding.
