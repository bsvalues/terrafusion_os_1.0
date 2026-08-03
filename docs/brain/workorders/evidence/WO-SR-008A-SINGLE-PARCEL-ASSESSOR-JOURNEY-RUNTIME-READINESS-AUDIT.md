# WO-SR-008A - Single-Parcel Assessor Journey Runtime Readiness Audit

## Result

`SINGLE_PARCEL_JOURNEY_EXACT_PROTECTED_BOUNDARY_IDENTIFIED`

The existing single-parcel journey is structurally composed and its bounded synthetic contracts pass,
but a user-completable journey is not proven. The first real-world dependency is authorized parcel
evidence acquisition: Property Search and parcel-context loading require authenticated,
county-governed backend data. This Work Order did not access that protected boundary.

## Evidence base

- Sovereign base: `b85e1c92db4fcf0b7aa5eb1ee98c44e998866854`.
- Reconciliation merge: PR #1397 / `b85e1c92db4fcf0b7aa5eb1ee98c44e998866854`.
- Worktree: isolated `codex/sr-008a-single-parcel-journey-audit`.
- Product, runtime, test source, workflow, deployment, package, and protected-resource mutation: none.
- Four independent read-only lanes inspected routing, suite consumers, protected boundaries, and
  successor ranking.

## Journey matrix

| Leg | State | Exact source truth |
| --- | --- | --- |
| Property Search UI | `PROVEN` | `PropertySearch.tsx:42-97` loads search state and routes a selected result. |
| Real parcel acquisition | `RESOURCE_BLOCKED` | `assessmentSourceService.ts:159-198` calls backend assessment endpoints; existing tests mock this boundary. |
| Result to parcel route | `PROVEN` | `PropertySearch.tsx:89-97` navigates to `/property/:parcelId`; `Router.tsx:213-225` registers the route and tab children. |
| Parcel-context load | `RESOURCE_BLOCKED` | `PropertyWorkbench.tsx:172-190`, `propertyStore.ts:169-205`, and `LiveDataProvider.ts:383-407` require live authenticated parcel evidence and fail closed when it is unavailable. |
| Workbench composition | `PROVEN` | `Router.tsx:217-225` mounts Summary, Forge, Atlas, Dais, Dossier, and Pilot beneath the parcel route. |
| Canonical tab order | `PROVEN` | `PropertyWorkbench.tsx:98-145` preserves the constitutional ordering and keeps Dossier and Pilot last. |
| Summary | `PARTIAL` | The surface exists but depends on successfully loaded parcel context. |
| Forge | `PARTIAL` | `useForgeValuation.ts:165-189` consumes `/api/forge`; `ForgeController.cs:22-46` uses the registered DB-backed valuation service, not the canonical kernel endpoint registered at `Program.cs:1598`. |
| Atlas | `PARTIAL / UNWIRED` | `PropertyAtlas.tsx:286-305` consumes `/api/atlas/gis`; the canonical `AtlasProjectionProcessHost.cs:13-46` remains manually instantiated with no DI or runtime consumer. |
| Dais | `PARTIAL / UNWIRED` | Durable Dais APIs are registered at `Program.cs:1657`, but `PropertyDais.tsx:249-286` invokes the Pilot path, whose fallback returns `PILOT_RUNTIME_OFFLINE` at `PilotController.cs:143-199`. |
| Dossier | `PARTIAL` | `PropertyDossier.tsx:335-374` uses the authenticated county-scoped Dossier details endpoint; real proof still requires protected parcel data. |
| Pilot | `UNWIRED` | `useToolInvocation.ts:169-228` calls Pilot validation/invocation endpoints; `PilotController.cs:143-199` exposes explicit offline stubs and an empty trace feed. |
| GPT | `SIMULATED / UNWIRED` | GPT is not a Workbench tab; `GPTOrchestrationService.cs:331-352` simulates provider invocation and the frozen projection/adapter remain pure and unwired. |
| Trace/evidence | `PARTIAL / UNWIRED` | `TraceIngestionService.cs:19-80` is an in-memory buffer and is not an operational durable Pilot evidence rail. |
| Return navigation | `PARTIAL` | `PropertyWorkbench.tsx:485-507` wires return navigation; preservation evidence remains synthetic. |
| Complete journey | `SIMULATED` | Current journey tests mock external services. The two dedicated contracts selected for successor restoration are stale/skipped. |

## Test evidence

A frozen bootstrap ran with `corepack pnpm install --frozen-lockfile --ignore-scripts` in the isolated
worktree. Before and after:

- `package.json`: `7E66C03C93D600643D91D700CCA841D9F460C3F29295FD511153EDC6C3CBE741`.
- `pnpm-lock.yaml`: `F39F76092F1F44D5A86678CFCD0CBB2E8C9F290DC6887E41016C510A1C1B3D4D`.
- tracked bootstrap mutation: none.

The first test invocation exposed only a sparse-checkout omission of tracked `tests/setupTests.ts`.
After adding that read-only directory to the sparse checkout, the unchanged targeted command passed:

```text
Test files: 5 passed
Tests: 46 passed
```

The passing files were the Property Search contract, Workbench production smoke contract, route
contract, back/forward parcel-preservation contract, and mocked Property Journey contract. React
`act` warnings and jsdom canvas warnings remain test-harness debt; they did not fail the run and do
not establish live readiness.

## First failing link

The first real-world failure is authorized parcel evidence acquisition, before any suite tab. A live
proof would require authenticated backend and county-scoped data authority not granted to this R2
audit. That protected boundary is distinct from later engineering gaps in Forge canonical-kernel
consumption, Atlas process-host adoption, Dais/Pilot invocation, and durable trace evidence.

## Ranked bounded successors

1. `WO-SR-008E - Forge Canonical Kernel Consumer Boundary Preparation` (`R2`). Define the exact
   Workbench-to-canonical-kernel adoption boundary without implementation or protected-path writes.
2. `WO-SR-008B - Atlas Runtime Consumer Boundary Preparation` (`R2`, proposed). Define the exact
   later R3 adoption packet for the proven but unwired Atlas process host.
3. `WO-SR-008D - Synthetic Single-Parcel Journey Proof Restoration` (`R2`, authority-gated). Restore
   two stale/skipped tests only after an exact protected frontend-test path grant exists.

## Selected successor

`WO-SR-008E` is the highest-value same-risk slice that remains entirely inside existing docs and
evidence authority. It becomes dependency-cleared after this audit PR merges and defines the first
suite-level canonical-consumer gap without implementing it. WO-SR-008D remains useful but is not
admitted because its exact frontend test paths require a separate protected-path grant.

## Non-claims

- No live county parcel was retrieved.
- No PACS, SQL, credential, secret, migration, or production resource was accessed.
- No suite consumer, provider, persistence, runtime registration, or deployment was changed.
- Passing synthetic tests do not prove a user-completable, production-ready journey.
- No batch-first direction, Atlas/GPT adoption, TerraPilot promotion, or Sync continuation was selected.

## Rollback

Revert this evidence and its governance/routing updates. There is no product, runtime, data, or
external-resource state to roll back.
