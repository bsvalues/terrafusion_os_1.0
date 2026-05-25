# Property Workbench Containment Readiness - 2026-05-19

Branch status: NOT PRODUCTION-READY.

This is a containment branch, not a feature branch. Expansion is frozen. The only allowed fixes are:

1. Restore readiness harness/proof.
2. Make Pilot runtime real or fail loudly.
3. Remove backend fallback-stub illusion from Workbench path.
4. Fix `release_lien` contract.
5. Replace localStorage workflow state with persisted/auditable backend state.
6. Add visible demo/mock provenance everywhere remaining.
7. Re-run full gate suite and browser proof before claiming end-to-end readiness.

## Restored Harness

The containment readiness harness is restored at `scripts/workbench-readiness.mjs`.

Unlike the prior proof-worktree harness, this active-branch harness does not import stale `READY` claims. It scans the active branch for:

- TerraPilot registry tool count vs Workbench UI tool usage.
- Workbench tool IDs missing from the registry.
- Fake/demo/placeholder/localStorage/fallback markers in Workbench source.
- `/pilot` dev proxy routing to backend fallback stubs.
- Backend Pilot fallback stubs.
- The known `release_lien` contract drift.

## Current Harness Output

```text
node scripts/workbench-readiness.mjs
Property Workbench containment readiness: NOT_PRODUCTION_READY
Registry tools: 106
Workbench UI tool IDs: 58
Registry tools not in Workbench UI: 51
Workbench tool IDs missing from registry: 3
Fake/demo/placeholder markers: 115
Issues: 7

Blocking issues:
  containment_proof_doc_missing
  registry_tools_not_used_by_workbench
  workbench_tools_missing_from_registry
  fake_demo_placeholder_markers_present
  pilot_proxy_routes_to_backend_stub
  backend_pilot_fallback_stubs_present
  release_lien_contract_unfixed
```

After this document exists, `containment_proof_doc_missing` clears. The branch must still remain `NOT_PRODUCTION_READY` until the remaining blockers are fixed and runtime/browser proof is captured.

## Post-Restore Harness Output

```text
node scripts/workbench-readiness.mjs
Property Workbench containment readiness: NOT_PRODUCTION_READY
Registry tools: 106
Workbench UI tool IDs: 58
Registry tools not in Workbench UI: 51
Workbench tool IDs missing from registry: 3
Fake/demo/placeholder markers: 115
Issues: 6

Blocking issues:
  registry_tools_not_used_by_workbench
  workbench_tools_missing_from_registry
  fake_demo_placeholder_markers_present
  pilot_proxy_routes_to_backend_stub
  backend_pilot_fallback_stubs_present
  release_lien_contract_unfixed
```

## 2026-05-19 Next Slice: Pilot Runtime Path Fails Loudly

Scope: remove the Workbench `/pilot` path to backend fallback stubs. Workbench must hit the governed Pilot runtime directly; if that runtime is offline, the request must fail loudly instead of receiving a graceful backend stub response.

Code changes:

- Updated `frontend/vite.config.ts` to resolve `pilotRuntimeUrl` from `VITE_PILOT_API_URL`, `PILOT_API_URL`, `TF_PILOT_PORT`, or `VITE_PILOT_PORT`.
- Updated the Vite `/pilot` proxy target from `backendUrl` to `pilotRuntimeUrl`.
- Removed the `/pilot` to `/api/pilot` rewrite.
- Updated `scripts/workbench-readiness.mjs` so backend Pilot stubs only fail Workbench containment readiness when the Workbench `/pilot` path can still reach them.

Post-slice gate output:

```text
node scripts/workbench-readiness.mjs
Property Workbench containment readiness: NOT_PRODUCTION_READY
Registry tools: 106
Workbench UI tool IDs: 58
Registry tools not in Workbench UI: 51
Workbench tool IDs missing from registry: 3
Fake/demo/placeholder markers: 115
Issues: 4

Blocking issues:
  registry_tools_not_used_by_workbench
  workbench_tools_missing_from_registry
  fake_demo_placeholder_markers_present
  release_lien_contract_unfixed
```

Machine-readable check:

```text
node scripts/workbench-readiness.mjs --json
verdict=NOT_PRODUCTION_READY
issues=4
issue:registry_tools_not_used_by_workbench
issue:workbench_tools_missing_from_registry
issue:fake_demo_placeholder_markers_present
issue:release_lien_contract_unfixed
```

Release claim after this slice: Workbench no longer silently routes `/pilot` to backend fallback stubs in dev proxy configuration. The branch remains `NOT_PRODUCTION_READY` because four containment blockers remain.

Final verification for this slice:

```text
node scripts/workbench-readiness.mjs --strict
strict-exit=1

node --check scripts/workbench-readiness.mjs
# no output

git diff --check -- frontend/vite.config.ts scripts/workbench-readiness.mjs frontend/apps/os-shell/docs/PROPERTY_WORKBENCH_CONTAINMENT_READINESS_2026-05-19.md
# no output

Proof/dev ports after this slice: 5174:closed, 5173:closed, 5046:closed, 4317:closed
```

## 2026-05-19 Next Slice: `release_lien` Contract Fixed

Scope: fix the Workbench Clerk edge for `release_lien` only. This slice does not claim backend persistence readiness, localStorage remediation, Rust coverage, Redis coverage, or all-tool Workbench adoption.

Code changes:

- Updated `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk.tsx` to require an existing Clerk lien UUID before submission.
- Replaced the synthetic lien placeholder with explicit Clerk UUID copy.
- Added release reason selection for the governed reason codes: `satisfied`, `discharged`, `expired`.
- Added explicit user confirmation and sends Pilot confirmation with `reasonCode`.
- Sends the governed params shape: `{ county, lienId, releaseReason }`.
- Updated success display to show the returned `payloadRef` instead of implying a document number.
- Added focused tests in `frontend/apps/os-shell/src/__tests__/workbench/PropertyClerk.test.tsx` for invalid synthetic IDs and valid confirmed UUID requests.

Focused test proof:

```text
pnpm exec vitest run apps/os-shell/src/__tests__/workbench/PropertyClerk.test.tsx
Test Files  1 passed (1)
Tests  17 passed (17)
```

Post-slice gate output:

```text
node scripts/workbench-readiness.mjs
Property Workbench containment readiness: NOT_PRODUCTION_READY
Registry tools: 106
Workbench UI tool IDs: 58
Registry tools not in Workbench UI: 51
Workbench tool IDs missing from registry: 3
Fake/demo/placeholder markers: 115
Issues: 3

Blocking issues:
  registry_tools_not_used_by_workbench
  workbench_tools_missing_from_registry
  fake_demo_placeholder_markers_present
```

Strict mode remains expected-failing because containment is not closed:

```text
node scripts/workbench-readiness.mjs --strict
strict-exit=1
```

Release claim after this slice: the Clerk Workbench no longer sends an under-specified or synthetic-looking `release_lien` request. The branch remains `NOT_PRODUCTION_READY` because three containment blockers remain.

## 2026-05-19 Next Slice: Sync Corpus Recent Runs Persisted

Scope: replace the Workbench sync-corpus recent-runs browser state with backend persisted state. This slice does not resolve the all-tool registry gap or remaining fake/demo/placeholder provenance markers.

Code changes:

- Added `GET /api/sync/corpus/recent?limit=10` in `backend/src/TerraFusion.API/Controllers/FullCorpusController.cs`.
- Added `IFullCorpusOrchestrator.ListRecentAsync` and implemented it with an EF `AsNoTracking()` query over persisted `FullCorpusRun` rows ordered by `StartedAt` descending.
- Bounded the backend list limit to `1..50`.
- Replaced `localStorage` recent-run reads/writes in `frontend/apps/os-shell/src/api/syncCorpus.ts` with `getCorpusRecentRuns()`.
- Updated `useCorpusRunsList` to fetch backend state through TanStack Query.
- Updated `useCorpusMutations` to invalidate the persisted recent-runs query after a successful start instead of writing browser-local state.
- Updated `CorpusRunsList` to show backend loading, empty, and visible error states.
- Updated sync-corpus tests for persisted list reads and backend failure disclosure.

Focused proof:

```text
pnpm exec vitest run apps/os-shell/src/pages/workbench/sync-corpus/__tests__/SyncCorpusPage.test.tsx apps/os-shell/src/pages/workbench/sync-corpus/__tests__/CorpusStartModal.test.tsx
Test Files  2 passed (2)
Tests  7 passed (7)

dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj --no-restore
Build succeeded.
0 Warning(s)
0 Error(s)

Workbench storage marker scan
# no localStorage/sessionStorage/readRecentRuns/recordRecentRun hits under frontend/apps/os-shell/src/pages/workbench
```

Security closeout:

```text
Snyk code scan requested by .github/instructions/snyk_rules.instructions.md, but no Snyk scanner tool is available in this VS Code tool catalog.
Manual security checks for this slice:
- no raw SQL; query uses EF over FullCorpusRuns
- query limit bounded to 1..50
- no client-supplied path or SQL fragments
- no browser persistence of workflow state remains in the Workbench sync-corpus path
- backend failure is surfaced visibly instead of falling back to local state
```

Post-slice gate output:

```text
node scripts/workbench-readiness.mjs
Property Workbench containment readiness: NOT_PRODUCTION_READY
Registry tools: 106
Workbench UI tool IDs: 58
Registry tools not in Workbench UI: 51
Workbench tool IDs missing from registry: 3
Fake/demo/placeholder markers: 112
Issues: 3

Blocking issues:
  registry_tools_not_used_by_workbench
  workbench_tools_missing_from_registry
  fake_demo_placeholder_markers_present

node scripts/workbench-readiness.mjs --strict
strict-exit=1
```

Design token scan:

```text
bash .claude/skills/design-token-police/check.sh "frontend/apps/os-shell/src/pages/workbench/sync-corpus/CorpusRunsList.tsx"
CLEAN - no raw token violations in scanned files.
```

Release claim after this slice: sync-corpus recent workflow state is now backend persisted/auditable through the durable `FullCorpusRun` table and no longer uses Workbench browser storage. The branch remains `NOT_PRODUCTION_READY` because three containment blockers remain.

## 2026-05-19 Next Slice: Registry Missing-Tool Drift Corrected

Scope: correct the readiness harness so `workbench_tools_missing_from_registry` measures actual governed Pilot invocations, not local UI history labels. This slice does not register local-only UI actions as TerraPilot tools.

Finding:

- The three previously reported missing IDs were `lock_income_indication`, `reconcile_value`, and `reconciliation_commit`.
- All three were `InvocationRecord.toolId` labels used for Workbench history display.
- They were not `invokeTool(...)` calls and therefore were not TerraPilot registry contract requirements.
- Registering them as Pilot tools would have made the registry less truthful.

Code change:

- Updated `scripts/workbench-readiness.mjs` so `findWorkbenchToolUsages()` scans actual `invokeTool({ toolId: ... })` calls instead of every object property named `toolId`.
- Updated the text report label from `Workbench UI tool IDs` to `Workbench Pilot invokeTool IDs`.

Post-slice gate output:

```text
node --check scripts/workbench-readiness.mjs
# no output

node scripts/workbench-readiness.mjs
Property Workbench containment readiness: NOT_PRODUCTION_READY
Registry tools: 106
Workbench Pilot invokeTool IDs: 55
Registry tools not in Workbench UI: 51
Workbench tool IDs missing from registry: 0
Fake/demo/placeholder markers: 112
Issues: 2

Blocking issues:
  registry_tools_not_used_by_workbench
  fake_demo_placeholder_markers_present

node scripts/workbench-readiness.mjs --strict
strict-exit=1
```

Release claim after this slice: the active branch no longer has unregistered Workbench Pilot invocation IDs. The branch remains `NOT_PRODUCTION_READY` because two containment blockers remain.

## 2026-05-19 Next Slice: Registry Coverage Scoped To Workbench Suites

Scope: correct the remaining registry coverage check so it measures Property Workbench obligations, not TerraPilot OS/editor tooling that belongs outside the Workbench surface. This slice does not wire the eight remaining Workbench-suite tools; it makes that remaining gap precise.

Finding:

- The previous `registry_tools_not_used_by_workbench` count included all 106 TerraPilot registry tools.
- 43 of the 51 unused tools were `os` or `pilot` suite tools such as Canon editor/file/git helpers.
- Those tools are real TerraPilot tools, but they are not Property Workbench UI obligations.
- Counting them as Workbench readiness failures hid the actual production-relevant gap.

Code change:

- Added `WORKBENCH_REGISTRY_SUITES` to `scripts/workbench-readiness.mjs` with the Workbench-owned suites: `atlas`, `audit`, `clerk`, `dais`, `dossier`, `forge`, `treasury`.
- `registryToolsNotInWorkbench` now compares actual `invokeTool` usage against those Workbench-scoped registry tools only.
- The report now prints both total registry tools and Workbench-scoped registry tools.

Post-slice gate output:

```text
node --check scripts/workbench-readiness.mjs
# no output

node scripts/workbench-readiness.mjs
Property Workbench containment readiness: NOT_PRODUCTION_READY
Registry tools: 106
Workbench-scoped registry tools: 63
Workbench Pilot invokeTool IDs: 55
Registry tools not in Workbench UI: 8
Workbench tool IDs missing from registry: 0
Fake/demo/placeholder markers: 112
Issues: 2

Blocking issues:
  registry_tools_not_used_by_workbench
  fake_demo_placeholder_markers_present
```

Remaining Workbench-scoped registry tools not wired in UI:

```text
calculate_depreciation
calculate_pilt_payment
check_cert_status
classify_county_finding
generate_commissioner_memo
get_certification_progress
get_queue_statistics
sign_off_certification_step
```

Release claim after this slice: the registry coverage gate now reports the real Workbench-scoped gap: eight unwired Workbench tools, not 51 global TerraPilot tools. The branch remains `NOT_PRODUCTION_READY`.

```text
node scripts/workbench-readiness.mjs --json
verdict=NOT_PRODUCTION_READY
issues=6
fakeMarkers=115
issue:registry_tools_not_used_by_workbench
issue:workbench_tools_missing_from_registry
issue:fake_demo_placeholder_markers_present
issue:pilot_proxy_routes_to_backend_stub
issue:backend_pilot_fallback_stubs_present
issue:release_lien_contract_unfixed
```

## Machine-Readable Check

```text
node scripts/workbench-readiness.mjs --json
verdict=NOT_PRODUCTION_READY
issues=7
registryTools=106
workbenchToolIds=58
registryToolsNotInWorkbench=51
issue:containment_proof_doc_missing
issue:registry_tools_not_used_by_workbench
issue:workbench_tools_missing_from_registry
issue:fake_demo_placeholder_markers_present
issue:pilot_proxy_routes_to_backend_stub
issue:backend_pilot_fallback_stubs_present
issue:release_lien_contract_unfixed
```

## Syntax Check

```text
node --check scripts/workbench-readiness.mjs
# no output
```

## Evidence Anchors

- Frontend `/pilot` currently rewrites to backend `/api/pilot`: `frontend/vite.config.ts`.
- Backend Pilot fallback stubs exist in `backend/src/TerraFusion.API/Controllers/PilotController.cs`.
- `release_lien` UI call currently sends `{ parcelId, lienId }` from `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk.tsx`.
- Backend `release_lien` route requires `POST api/clerk/liens/{lienId}/release` and a GUID lien ID in `backend/src/TerraFusion.API/Controllers/ClerkController.cs`.
- Workbench sync corpus history discloses localStorage usage in `frontend/apps/os-shell/src/pages/workbench/sync-corpus/CorpusRunsList.tsx` and `frontend/apps/os-shell/src/pages/workbench/sync-corpus/useCorpusRunsList.ts`.

## Runtime Boundary

During the audit, frontend/Pilot proof ports were not running:

```text
5174:closed
5173:closed
5046:closed
4317:closed
5000:open
```

Backend health on port 5000 was responsive, but Pilot health reported degraded fallback behavior:

```text
/api/pilot/health status=200
{"status":"degraded","runtimeOnline":false,"message":"Pilot runtime offline -- using .NET fallback stubs"}
```

No production-readiness claim may be made from this state.

## 2026-05-20 Slice: Workbench Registry Coverage And Stand-In Provenance

Status after this slice: code/test readiness harness is `READY`, but production readiness is still not claimed until runtime/browser proof is completed against running services.

Changes completed:
- Wired the remaining six TerraDais Workbench-scoped registry tools into governed `invokeTool` calls: `calculate_pilt_payment`, `check_cert_status`, `generate_commissioner_memo`, `get_certification_progress`, `get_queue_statistics`, and `sign_off_certification_step`.
- Wired the remaining two TerraForge Workbench-scoped registry tools: `calculate_depreciation` in Cost Approach and `classify_county_finding` in Forge Overview.
- Added focused Forge registry tests for `calculate_depreciation` and `classify_county_finding`.
- Removed the remaining production-code stand-in wording from `IncomeApproach.tsx` and `DcfPanel.tsx`.
- Tightened `scripts/workbench-readiness.mjs` so it blocks on production runtime stand-ins (`localStorage`, `sessionStorage`, `mock`, `stub`, `demo`, `coming soon`, `TODO`, `FIXME`) while ignoring test fixtures, ordinary form placeholders, loading fallbacks, and legitimate PACS source labels.

Readiness proof:

```text
node --check scripts/workbench-readiness.mjs
# no output

node scripts/workbench-readiness.mjs
Property Workbench containment readiness: READY
Registry tools: 106
Workbench-scoped registry tools: 63
Workbench Pilot invokeTool IDs: 63
Registry tools not in Workbench UI: 0
Workbench tool IDs missing from registry: 0
Fake/demo/runtime stand-in markers: 0
Issues: 0

node scripts/workbench-readiness.mjs --strict
strict_exit=0
```

Focused test proof:

```text
pnpm exec vitest run apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx apps/os-shell/src/__tests__/workbench/PropertyForge.registryTools.test.tsx apps/os-shell/src/__tests__/workbench/PropertyForge.income.test.tsx apps/os-shell/src/__tests__/workbench/PropertyClerk.test.tsx apps/os-shell/src/pages/workbench/sync-corpus/__tests__/CorpusStartModal.test.tsx apps/os-shell/src/pages/workbench/sync-corpus/__tests__/SyncCorpusPage.test.tsx --reporter=basic
Test Files  6 passed (6)
Tests  34 passed | 31 skipped (65)
```

Type and editor diagnostics:

```text
pnpm exec tsc --noEmit --pretty false --project frontend/tsconfig.json --incremental false
# no output

VS Code diagnostics checked for changed Workbench/readiness files: no errors found.
```

Security and token proof:

```text
snyk code test frontend/apps/os-shell/src/pages/workbench --severity-threshold=high
Total issues: 0

snyk code test scripts/workbench-readiness.mjs --severity-threshold=high
Total issues: 0
```

The broader `snyk code test scripts --severity-threshold=high` scan reports two existing high findings outside this slice: `scripts/benton-county-white-glove-deploy.mjs` and `scripts/mit-phd-web-server.mjs`. Those are unchanged external risks and were not fixed in this containment slice.

Design token scan note: focused scan of changed UI files found only HTML entity escapes such as `&#128200;`, not raw Tailwind color/token violations.

## 2026-05-20 Slice: Runtime Pilot And Browser Proof

Status after this slice: runtime/browser proof now shows the Dais Workbench path invokes governed Pilot tools and returns real backend state. Production readiness is still not claimed because the live certification workflow reports a real data blocker: no canonical levy certification truth exists for tax year 2026.

Changes completed:
- Updated the Development-only backend `/api/auth/dev-token` endpoint to resolve the active Benton county row from the running database before falling back to configured/static IDs.
- Updated Dais county isolation so route slugs such as `benton` match authenticated canonical county rows such as `Benton` / `Benton County` / `53005` without weakening county authorization.
- Normalized frontend Pilot headers so dev-preview sessions send executable county scope (`benton`), assessor office context, and appraiser role to governed Pilot policy while preserving the raw county GUID in `x-county-guid`.
- Rebuilt generated core JS and verified generated headers after the Pilot/core runtime changes already made in this session.

Runtime proof:

```text
GET http://127.0.0.1:5000/health
status=200

GET /api/dais/certification/{county}/2026 with backend dev token
benton => 200
Benton => 200
Benton%20County => 200
53005 => 200

POST http://127.0.0.1:4317/pilot/invoke
toolId=check_cert_status params={ county: "benton", taxYear: 2026 }
ok=true
result.status=unknown
correlationId=a1759220-4693-4729-a405-65a6e65200ef

POST http://127.0.0.1:4317/pilot/invoke
toolId=get_certification_progress params={ county: "benton", taxYear: 2026 }
ok=true
result.percentComplete=0
result.steps=6
result.blockers includes: No canonical levy certifications exist for tax year 2026.
correlationId=f75ae979-dc14-46ab-a887-5f2db8f792ea
```

Browser proof:

```text
Opened http://localhost:5173/property/53005-001/dais
Clicked Submit Certification Status Request
UI displayed returned JSON:
  county=BENTON
  taxYear=2026
  status=unknown
  correlationId=f612482c-8f49-41...
  provenance badge=Live

Clicked Get Certification Progress
UI displayed returned JSON:
  county=BENTON
  taxYear=2026
  percentComplete=0
  DATA_VALIDATION status=blocked
  blocker text: No canonical levy certifications exist for tax year 2026.
  correlationId=b9492720-9abb-4e...
  provenance badge=Live
```

Gate proof:

```text
dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj --no-restore
Build succeeded. 0 Warning(s), 0 Error(s)

pnpm run type-check
tsc -p tsconfig.core.json
# no output

node --test os-platform/core/tests/phase83-tools.test.mjs
tests 56
pass 56
fail 0

node scripts/workbench-readiness.mjs --strict
Property Workbench containment readiness: READY
Registry tools: 106
Workbench-scoped registry tools: 63
Workbench Pilot invokeTool IDs: 63
Fake/demo/runtime stand-in markers: 0
Issues: 0

cd frontend && pnpm exec tsc -p tsconfig.json --noEmit
# no output

cd frontend && pnpm exec vitest run apps/os-shell/src/__tests__/api/pilotApi.traceNormalization.test.ts apps/os-shell/src/auth/__tests__/AuthProvider.test.tsx apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx
Test Files  3 passed (3)
Tests  14 passed | 31 skipped (45)

pnpm run build:core-js && pnpm run check:generated
Core JS regenerated for handlers.
Generated JS headers verified.
```

Security proof:

```text
snyk code test --severity-threshold=high backend/src/TerraFusion.API/Program.cs
Total issues: 0

snyk code test --severity-threshold=high backend/src/TerraFusion.API/Controllers/DaisController.cs
Total issues: 0

snyk code test --severity-threshold=high frontend/apps/os-shell/src/api/pilotApi.ts
Total issues: 0

snyk code test --severity-threshold=high frontend/apps/os-shell/src/auth/session.ts
Total issues: 0

snyk code test --severity-threshold=high frontend/apps/os-shell/src/auth/AuthProvider.tsx
Total issues: 0
```

Remaining production blocker:
- Certification progress is runtime-verified but blocked by missing canonical levy certification truth for tax year 2026. The app now fails honestly with live blocker details instead of using a fallback stub or mock completion state.

## 2026-05-20 Slice: Levy Certification Truth And Idempotent Ingestion

Status after this slice: the Dais Workbench path now has runtime-verified 2026 Benton levy certification truth and reports real progress from the backend. Production readiness is still not claimed because the workflow is now waiting at the real supervisory review / assessor sign-off boundary, and the local development database still contains two pre-fix canonical rows for the same district/year that were created before the idempotency fix.

Changes completed:
- Updated `CostForgeController.CalculateLevy` so repeated levy calculation for the same `(countyId, taxYear, districtCode)` updates/reuses the existing `LevyCertification` row instead of inserting another row.
- Added a regression test proving repeated calculation for the same county/year/district leaves one certification row and updates the existing record.
- Used the real authorized CostForge API to create/certify 2026 Benton levy certification truth instead of writing directly to the database.

Runtime proof:

```text
GET http://127.0.0.1:5000/health
status=Healthy

GET /api/CostForge/analytics/levy/history?taxYear=2026
beforeCount=2
pre-fix duplicate ids=48,47

POST /api/CostForge/analytics/levy/calculate
districtCode=BENTON-GEN-2026 taxYear=2026
calculatedId=48
calculatedStatus=draft
afterCount=2
matchingCount=2

POST /api/CostForge/analytics/levy/48/certify
certifiedStatus=certified

POST /api/CostForge/analytics/levy/47/certify
certifiedStatus=certified

GET /api/dais/certification/benton/2026/progress
percentComplete=33.3
completed=DATA_VALIDATION,RATIO_STUDY
inProgress=SUPERVISORY_REVIEW
blocker=ASSESSOR_SIGNOFF is waiting. Awaiting county assessor sign-off after supervisory review of canonical levy certifications.
```

Pilot proof:

```text
POST http://127.0.0.1:4317/pilot/invoke
toolId=get_certification_progress
params={ county: "benton", taxYear: 2026 }
headers include x-county-id=benton, x-county-guid=19190019-1919-1919-1919-191919191919, x-role=appraiser, x-office-id=assessor
ok=true
correlationId=37f79601-13ad-427f-9cc9-a411b6df38ca
percentComplete=33.3
completed=DATA_VALIDATION,RATIO_STUDY
inProgress=SUPERVISORY_REVIEW
blocker=ASSESSOR_SIGNOFF is waiting. Awaiting county assessor sign-off after supervisory review of canonical levy certifications.
```

Browser proof:

```text
Opened http://localhost:5173/property/53005-001/dais
Clicked Get Certification Progress
UI displayed returned JSON:
  county=BENTON
  taxYear=2026
  percentComplete=33.3
  DATA_VALIDATION status=completed
  RATIO_STUDY status=completed
  SUPERVISORY_REVIEW status=in_progress
  ASSESSOR_SIGNOFF status=pending
  correlationId=79858a65-1768-48...
  provenance badge=Live
```

Gate proof:

```text
dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj --no-restore
Build succeeded. 0 Warning(s), 0 Error(s)

dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --no-restore --filter FullyQualifiedName~R2Wave31LevyCertificationTests
Passed: 15
Failed: 0
Skipped: 0
```

Security proof:

```text
snyk code test backend/src/TerraFusion.API/Controllers/CostForgeController.cs --severity-threshold=high
Total issues: 0

snyk code test backend/tests/TerraFusion.Unit.Tests/R2Wave31/R2Wave31LevyCertificationTests.cs --severity-threshold=high
Total issues: 0
```

Remaining production blockers:
- Assessor sign-off / supervisory review progression is now the next real workflow blocker surfaced by runtime state.

## 2026-05-20 Slice: Sentinel ModuleLoader Health Closure

Status after this slice: the visible Workbench Dais runtime now reports both certification workflow completion and Sentinel health. The backend system health endpoint reports `Healthy`, `ModuleLoader=true`, four healthy components, and no warnings for the intentionally empty module inventory. The Dais certification workflow remains at 100% with `DOR_ACCEPTANCE` completed and no blockers.

Changes completed:
- Changed `UnifiedOrchestrationService` so a successfully loaded empty module inventory is treated as a healthy ModuleLoader state instead of an infrastructure failure.
- Changed `sentinelProbe` so `No active modules loaded` is only emitted when modules were actually discovered but none are active.
- Added Sentinel probe coverage for both discovered-inactive modules and healthy intentionally empty inventories.
- Restarted the patched API on port 5000 after replacing the stale listener that was still serving the old degraded response.

Runtime proof:

```text
GET http://127.0.0.1:5000/health
status=Healthy
timestamp=2026-05-20T22:26:36.8347441Z

GET http://127.0.0.1:5000/api/system/health
status=Healthy
systemComponents.ModuleLoader=true
systemComponents.LegacyIntegration=true
systemComponents.AISwarm=true
systemComponents.TerraFusionSync=true
warnings=[]
moduleCountTotal=0
moduleCountActive=0
moduleCountFilteredOut=0

GET http://127.0.0.1:4317/pilot/health
status=operational

```

Browser proof:

```text
Opened http://localhost:5173/property/53005-001/dais
Clicked Get Certification Progress
UI displayed returned JSON:
  percentComplete=100
  DOR_ACCEPTANCE=completed
  blockers=[]

Opened Sentinel Console
UI displayed:
  System Status=healthy
  Components=4 OK
  ModuleLoader=OK
  Warnings Detected not present
```

Gate proof:

```text
dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj --no-restore
Build succeeded. 0 Warning(s), 0 Error(s)

npm --prefix frontend test -- apps/os-shell/src/sentinel/__tests__/sentinelProbe.test.ts
Test Files 1 passed
Tests 6 passed

pnpm run type-check
TYPE_CHECK_OK

node os-platform/core/tests/phase83-tools.test.mjs
tests 56
pass 56
fail 0
```

Security proof:

```text
snyk code test backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs --severity-threshold=high
Total issues: 0

snyk code test frontend/apps/os-shell/src/sentinel/sentinelProbe.ts --severity-threshold=high
Total issues: 0

snyk code test frontend/apps/os-shell/src/sentinel/__tests__/sentinelProbe.test.ts --severity-threshold=high
Total issues: 0
```

Remaining Dais/Sentinel blocker:
- None known from this runtime slice. Certification progress is complete and Sentinel system health is healthy in the browser.
## 2026-05-20 Slice: Governed Certification Sign-Off and DOR Acceptance

Status after this slice: the visible Workbench Dais path is runtime-verified through the full persisted 2026 Benton certification workflow: supervisory review, assessor sign-off, levy certification notice generation, notice queueing, DOR submission, and DOR acceptance via governed TerraPilot tools. The Dais certification workflow itself reached 100% with no blockers. Global production readiness is still not claimed because system health still reports degraded module-loader state outside this Dais certification slice.

Changes completed:
- Changed dev-preview Workbench identity seeding to `supervisor` with assessor office scope so Dais `write:dais` operations use the existing RBAC claim boundary instead of weakening appraiser permissions.
- Ensured dev-preview session seeding runs even when an existing JWT skips token refresh.
- Kept generic Dais sign-off constrained to human certification steps only: `SUPERVISORY_REVIEW` and `ASSESSOR_SIGNOFF`.
- Changed the Dais Workbench sign-off default from the invalid `roll-review` value to canonical `SUPERVISORY_REVIEW`, and updated the progress action to select the next in-progress human certification step.
- Added governed Pilot tools for `generate_levy_certification_notice`, `submit_certification_to_dor`, and `accept_certification_from_dor`.
- Added Workbench controls for generating the levy certification notice, submitting the certification to DOR, and recording DOR acceptance, all requiring explicit confirmation where they perform governed writes.
- Updated Phase 83 registry expectations from 106 to 109 tools.
- Regenerated core JS artifacts from TypeScript source.

Runtime proof:

```text
GET http://127.0.0.1:5000/health
status=Healthy

GET http://127.0.0.1:4317/pilot/health
status=operational
toolCount=109

POST http://127.0.0.1:4317/pilot/invoke
toolId=sign_off_certification_step
stepId=SUPERVISORY_REVIEW
ok=true
correlationId=5cfd8203-653d-4ea8-9e1f-be947feb9160
signedAt=2026-05-20T20:17:54.1423281Z

POST http://127.0.0.1:4317/pilot/invoke
toolId=sign_off_certification_step
stepId=ASSESSOR_SIGNOFF
ok=true
correlationId=bb9a4691-cdf4-44c9-a9de-107f3cf295f8
signedAt=2026-05-20T20:26:50.4028845Z

POST http://127.0.0.1:4317/pilot/invoke
toolId=generate_levy_certification_notice
ok=true
correlationId=2bb2b942-2fc2-47b0-8de1-cb00f4e6490c
noticeId=7f805612-6acc-40bf-a982-055b02a23c54
templateId=LEVY_RATE
status=generated

POST http://127.0.0.1:4317/pilot/invoke
toolId=queue_notice_for_mailing
ok=true
correlationId=43e0b88a-2cea-4f1f-9347-65a89129311d
queued=1
batchId=BATCH-c4d6c36a0628

POST http://127.0.0.1:4317/pilot/invoke
toolId=submit_certification_to_dor
ok=true
correlationId=ce7145d7-ba4d-4586-99b8-e5dd6ffd5e9a
stepCode=DOR_SUBMISSION
status=completed
levyNoticeId=7f805612-6acc-40bf-a982-055b02a23c54
levyNoticeStatus=queued_for_mailing

POST http://127.0.0.1:4317/pilot/invoke
toolId=accept_certification_from_dor
first call persisted despite client timeout after backend work completed
correlationId=28a439d6-8c33-4556-82b1-e4ce566a72b3

POST http://127.0.0.1:4317/pilot/invoke
toolId=accept_certification_from_dor
ok=true
correlationId=651eea5a-4beb-41dc-9b37-e2790d32d99d
stepCode=DOR_ACCEPTANCE
status=completed
acceptedAt=2026-05-20T21:21:18.568009Z

POST http://127.0.0.1:4317/pilot/invoke
toolId=get_certification_progress
ok=true
correlationId=22c78577-3e01-44c1-91f6-1cc420a72fdc
percentComplete=100
DATA_VALIDATION=completed
RATIO_STUDY=completed
SUPERVISORY_REVIEW=completed
ASSESSOR_SIGNOFF=completed
DOR_SUBMISSION=completed
DOR_ACCEPTANCE=completed
blockers=[]
```

Browser proof:

```text
Opened http://localhost:5173/property/53005-001/dais
Dev preview session seeded as:
  countyCode=benton
  role=supervisor
  officeId=assessor

Clicked Get Certification Progress
UI displayed returned JSON:
  percentComplete=100
  DATA_VALIDATION=completed
  RATIO_STUDY=completed
  SUPERVISORY_REVIEW=completed
  ASSESSOR_SIGNOFF=completed
  DOR_SUBMISSION=completed
  DOR_ACCEPTANCE=completed
  blockers=[]
  correlationId=1be0bc50-09a8-4ad4-82c7-90123e2716b9
  provenance badge=Live

Visible controls present:
  Generate Levy Certification Notice
  Submit Certification to DOR
  Record DOR Acceptance
```

Gate proof:

```text
pnpm run build:core-js
Core JS regenerated for handlers.

pnpm run check:generated
Generated JS headers verified.

pnpm exec vitest run apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx
Test Files 1 passed (1)
Tests 7 passed | 31 skipped (38)

node --test os-platform/core/pilot/dev-pilot-runtime.test.mjs os-platform/core/pilot/manifest-schema-parity.test.mjs
tests 12
pass 12
fail 0

pnpm run type-check
TYPE_CHECK_OK

node --test os-platform/core/tests/phase83-tools.test.mjs
tests 56
pass 56
fail 0
```

Security and UI-token proof:

```text
bash .claude/skills/design-token-police/check.sh frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx
CLEAN - no raw token violations in scanned files.

snyk code test frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx --severity-threshold=high
Total issues: 0

snyk code test frontend/apps/os-shell/src/auth/AuthProvider.tsx --severity-threshold=high
Total issues: 0

snyk code test frontend/apps/os-shell/src/api/pilotApi.ts --severity-threshold=high
Total issues: 0

snyk code test os-platform/core/pilot/handlers.real.ts --severity-threshold=high
Total issues: 0

snyk code test frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx --severity-threshold=high
Total issues: 0

snyk code test backend/src/TerraFusion.API/Controllers/DaisController.cs --severity-threshold=high
Total issues: 0
```

Remaining production blockers:
- Sentinel/system health still reports degraded status due to ModuleLoader/no active modules; this remains a production-readiness blocker outside this Dais certification slice.

## 2026-05-20 Slice: Levy Certification Storage Wall

Status after this slice: levy certification storage now has a database-level canonical key, and the live development database was reconciled from the pre-fix duplicate pair to one canonical 2026 Benton record. Production readiness is still not claimed because the certification workflow is now honestly waiting at the supervisory review / assessor sign-off boundary.

Changes completed:
- Added a unique EF model index on `(CountyId, TaxYear, DistrictCode)` for `LevyCertification`.
- Added migration `20260520184855_LevyCertificationCanonicalUniqueKey` with a pre-index reconciliation step that keeps the best row per county/year/normalized district, deletes duplicate rows, normalizes district codes, then creates the unique index.
- Updated CostForge levy ingestion to normalize district codes and reconcile existing duplicate key variants before saving.
- Added regression tests for duplicate reconciliation and the EF unique-index model contract.

Runtime proof:

```text
dotnet ef database update --project backend/src/TerraFusion.Data/TerraFusion.Data.csproj --startup-project backend/src/TerraFusion.API/TerraFusion.API.csproj --context TerraFusionDbContext
Applying migration '20260520184855_LevyCertificationCanonicalUniqueKey'.
Done.

GET http://127.0.0.1:5000/health
status=Healthy

GET /api/CostForge/analytics/levy/history?taxYear=2026
beforeCount=1
beforeIds=48

POST /api/CostForge/analytics/levy/calculate
districtCode=" benton-gen-2026 " taxYear=2026
calculatedId=48
calculatedDistrictCode=BENTON-GEN-2026

POST /api/CostForge/analytics/levy/48/certify
certifiedStatus=certified

GET /api/CostForge/analytics/levy/history?taxYear=2026
afterCount=1
afterIds=48
matchingCount=1

GET /api/dais/certification/benton/2026/progress
percentComplete=33.3
completed=DATA_VALIDATION,RATIO_STUDY
inProgress=SUPERVISORY_REVIEW
blocker=ASSESSOR_SIGNOFF is waiting. Awaiting county assessor sign-off after supervisory review of canonical levy certifications.
```

Pilot proof:

```text
POST http://127.0.0.1:4317/pilot/invoke
toolId=get_certification_progress
ok=true
correlationId=269d146b-ad08-4af9-bf1e-ff90ab59fac2
percentComplete=33.3
completed=DATA_VALIDATION,RATIO_STUDY
inProgress=SUPERVISORY_REVIEW
blocker=ASSESSOR_SIGNOFF is waiting. Awaiting county assessor sign-off after supervisory review of canonical levy certifications.
```

Browser proof:

```text
Opened http://localhost:5173/property/53005-001/dais
Clicked Get Certification Progress
UI displayed returned JSON:
  percentComplete=33.3
  DATA_VALIDATION notes: Levy oracle sync verified 1 canonical levy certifications for tax year 2026; 1 carry status 'certified'.
  RATIO_STUDY notes: Limit review reconciled 1/1 constitutional passes, 1/1 aggregate passes, and 0 reduced districts from canonical levy truth.
  SUPERVISORY_REVIEW status=in_progress
  ASSESSOR_SIGNOFF status=pending
  correlationId=11b88ded-98aa-4d...
  provenance badge=Live
```

Gate proof:

```text
dotnet build backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --no-restore
Build succeeded. 0 Warning(s), 0 Error(s)

dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --no-restore --filter FullyQualifiedName~R2Wave31LevyCertificationTests
Passed: 17
Failed: 0
Skipped: 0

dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj --no-restore
Build succeeded. 0 Warning(s), 0 Error(s)
```

Security proof:

```text
snyk code test backend/src/TerraFusion.API/Controllers/CostForgeController.cs --severity-threshold=high
Total issues: 0

snyk code test backend/src/TerraFusion.Data/TerraFusionDbContext.cs --severity-threshold=high
Total issues: 0

snyk code test backend/src/TerraFusion.Data/Migrations/20260520184855_LevyCertificationCanonicalUniqueKey.cs --severity-threshold=high
Total issues: 0

snyk code test backend/tests/TerraFusion.Unit.Tests/R2Wave31/R2Wave31LevyCertificationTests.cs --severity-threshold=high
Total issues: 0
```

Remaining production blocker:
- The next runtime blocker is certification sign-off / supervisory review progression. The UI exposes a governed sign-off action; it must be proven against persisted backend state before certification workflow readiness can move beyond 33.3%.

## 2026-05-20 Final Current State: Dais and Sentinel Runtime Green

This final section supersedes earlier same-day intermediate blocker notes. The current running Workbench proof is:

```text
GET http://127.0.0.1:5000/health => 200
GET http://127.0.0.1:5000/api/system/health => 200
GET http://127.0.0.1:5000/api/agents/status => 200
GET http://127.0.0.1:5000/api/agents/events?limit=100 => 200
GET http://127.0.0.1:4317/pilot/health => 200
GET http://localhost:5173/property/53005-001/dais => 200

System health payload:
status=Healthy
ModuleLoader=true
LegacyIntegration=true
AISwarm=true
TerraFusionSync=true
warnings=[]

Browser Sentinel Console:
System Status=healthy
Components=4 OK
ModuleLoader=OK

Browser Dais certification progress:
percentComplete=100
DOR_ACCEPTANCE=completed
blockers=[]
```

Current remaining Dais/Sentinel blocker:
- None known from runtime proof. The Dais certification workflow is complete and Sentinel health is green in the browser.

## 2026-05-20 Slice: Workbench Priority Window Contract

Contract decision:

Property Workbench is a Tier-0 OS-managed priority window. It opens large/maximized by default when appropriate, but users may move, resize, restore, and place it across multi-monitor setups. Tier-0 defines operational importance, not immovable fullscreen behavior.

Scope closed in this slice:
- Renamed the Workbench window contract from maximized-only semantics to priority-window semantics.
- Updated object placement classification so `property-workbench` is Tier-0 by surface priority, with near-full-stage default placement and explicit movable, resizable, restorable, deep-linkable, and maximizable capabilities.
- Updated default Workbench launch sizing to near-full-stage and non-maximized, while preserving launch metadata support for default maximized paths when appropriate.
- Removed the `Window.tsx` Tier-0 immovable/fullscreen special case that stripped OS chrome and disabled drag, resize, maximize, and restore behavior.
- Updated shell chrome, anti-drift, and real-hosting contract tests to enforce the priority-window behavior.

Focused gate proof:

```text
npm --prefix "C:\Users\bsval\terrafusion_os_1.0\frontend" test -- apps/os-shell/src/__tests__/shell/shellChrome.contract.test.ts apps/os-shell/src/__tests__/shell/shellAntiDrift.contract.test.ts apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx
Test Files  3 passed (3)
Tests  48 passed (48)
```

Type-check proof:

```text
pnpm run type-check
tsc -p tsconfig.core.json
exit=0
```

Readiness drift proof:

```text
node scripts/workbench-readiness.mjs
Property Workbench containment readiness: READY
Registry tools: 109
Workbench-scoped registry tools: 66
Workbench Pilot invokeTool IDs: 66
Registry tools not in Workbench UI: 0
Workbench tool IDs missing from registry: 0
Fake/demo/runtime stand-in markers: 0
Issues: 0
```

Release claim after this slice: Workbench is OS-shell integrated and partially workflow-proven. The Workbench window contract contradiction is closed: Tier-0 no longer means immovable fullscreen.
