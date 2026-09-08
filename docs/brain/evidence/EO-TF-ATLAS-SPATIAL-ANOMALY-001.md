# Atlas spatial anomaly candidate integration evidence

Status: CANDIDATE_PREPARATION; not protected adoption or browser acceptance.

Independent review P1 remediation: the shared panel now sends explicit mode:muse at its one
invokeTool call. The actual bearer API wire regression failed because the serialized request
omitted mode (10 other UI tests passed), then passed after this single-field change (11/11).
An added core regression executes the actual existing ingress functions and ToolRunner with the
real registry: absent mode => MODE_MISMATCH and zero source reads; explicit muse => scoped source
handler reached with the same bearer token. Node handler/process21/21 passed. No registry/global
mode/authentication gate changes. Commands: bundled Node ../node_modules/vitest/vitest.mjs run
apps/os-shell/src/__tests__/atlas/spatialAnomalyPanel.test.tsx --maxWorkers=1 --minWorkers=1 --retry=0
from frontend; bundled Node --test os-platform/core/tests/atlas-spatial-anomaly-handler.test.mjs
os-platform/core/tests/atlas-spatial-anomaly-process.test.mjs from root. Existing Browserslist age,
React act deprecation and Router future-flag warnings remain; no package upgrades were made.

Verification qualification: frontend/tsconfig.json has existing noCheck:true and incremental:true.
Previously reported frontend tsc/build passes prove only successful configured commands/builds,
not semantic type correctness. Configuration is preserved. Before final OS merge, an explicitly
queued diagnostic run with --noCheck false --incremental false must be triaged against Atlas-owned
changed paths; unrelated estate diagnostics are not authority to repair them. This diagnostic has
not run yet and must not become a third simultaneous heavy workload.

## Protected suite adoption preparation

### Actual host bridge RED/GREEN and fresh SQLite prerequisite

The host delta is exactly one added allowlist entry, explain_spatial_anomaly, in
PilotRuntimeProxy.cs; all other forwarding/authentication/metrics logic is unchanged.
Five new cases failed with actual null dispatch before the entry: invoke/validate forwarding,
anonymous/ambiguous-county denial and unavailable transport. Existing proxy28 plus the actual
Forge OLS fixture-design test passed during RED (5 failed,29 passed,total34). After the one-line
entry, the same focused command passed34/34, zero skipped; it passed again after fixture correction.

Commands from this owned checkout:

```text
dotnet restore backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --disable-parallel -m:1 -p:UseSharedCompilation=false -nodeReuse:false --verbosity quiet
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --configuration Release --no-restore --filter "FullyQualifiedName~PilotRuntimeProxyTests|FullyQualifiedName~AtlasSpatialAnomalyBrowserBootstrapTests.SyntheticSourceDesign" -m:1 -p:UseSharedCompilation=false -nodeReuse:false --verbosity quiet
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --configuration Release --no-build --no-restore --filter "FullyQualifiedName~PilotRuntimeProxyTests.Atlas" -m:1 -p:UseSharedCompilation=false -nodeReuse:false --logger "console;verbosity=normal"
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --configuration Release --no-build --no-restore --filter "FullyQualifiedName~BootstrapAtlasSpatialAnomaly_CreatesOnlyFreshOwnedPersistedSource" -m:1 -p:UseSharedCompilation=false -nodeReuse:false --logger "console;verbosity=normal"
```

The Atlas-only no-build command captured all five expected-null failures before the fix.
Bootstrap used child-only ATLAS_BROWSER_DATABASE_PATH pointing to this checkout's fresh
artifacts/atlas-browser/run-8520a85c-fe20-4458-b3b7-f8534e8df2a0/atlas.db. It passed1/1, zero skipped,
and persisted26 synthetic ComparableSales plus Counties/Properties and a seed-receipt.json.
The fixture compares complete persisted sqlite_master DDL with exact EF-generated definitions for
all three used tables and all eight generated indexes (Counties1, Properties2, ComparableSales5),
including columns, primary/foreign keys, uniqueness and filtered predicates. Receipt lists all eight
verified index names. Earlier successful run-93872f41-f6af-48d7-b7f2-997326b1926d remains preserved.
No API or browser was launched, and this is not end-to-end acceptance.

Preparation failures are retained truthfully: initial no-restore attempt had NETSDK1004 missing own
Unit.Tests assets (not RED); coordinator granted a bounded restore, which passed without project
or package changes. First compile found a new fixture ComparableSale namespace ambiguity, fixed
by an explicit entity alias before meaningful RED. Initial opt-in run-ff5266fe-2738-4dae-992f-1d6fa9ef0de2
failed on an unrelated ConversionEra index. SQLite collapses existing PostgreSQL schema names:
imprv_current, land_current, owner_current, sale, wash_prop_owner_val have duplicate table definitions.
The fixture retains all indexes on unambiguous tables (asserting all three input tables are
unambiguous), skips only indexes on those unused colliding tables, and records the names in its
receipt. The failed DB is preserved. This does not certify PACS schema/migrations or alter them.
Successful focused commands emitted no warnings; prior baseline/Snyk limitations below remain.

Normal candidate commit/formatter and independent assurance follow these checks. Real browser
acceptance and the critical repeat after protected OS merge remain outstanding.

Coordinator confirms protected Atlas PR5 merge65f47b97bba93639ffc730662178bee6ec389097.
Fresh local Git objects verify tree43b686480819539cac21fe14136b8e23d831d15d equals reviewed
0aa44618879f57e5d367379e27653ebbd3e84a36. Runtime configuration now binds that actual protected
commit, module7083977211bab354053181402112fa4b304eca1e9596be0d98cd0b571c288fe6 and
specification06b68ac64f159215f2ea620740e3eae9fda58a38604b3ea833a18691adbcfa9f. No suite bytes changed.

The trusted-runtime-configuration test failed while unassigned, then all20 Node handler/process
tests passed after pinning. Stage-AtlasSpatialAnomalyModule.ps1 returned STAGED from protected Git
blobs into the owned slot, manifest SHA2562a2f967eb7c4fafe1d9f6fdb3e08dd85462e9248253fe02e98cf94588f8ec122.
A labeled synthetic six-record transport probe returned OK/two hotspots and whole-result equality
with a direct import of the protected Git module. This is transport proof, not actual backing/browser proof.

Real same-origin inspection found the .NET PilotRuntimeProxy allowlist still omits the anomaly ID.
Coordinator reserved its single entry and focused tests. Observed .NET RED/GREEN is recorded above;
actual browser bridge proof remains outstanding.
The new canonical R2Wave43/AtlasSpatialAnomalyBrowserBootstrapTests.cs seeds only fresh EF/SQLite
Counties, Properties and ComparableSales, not residuals. Existing canonical tests/projects unchanged.

Owned browser harness now lists six actual-process cases: full direct canonical equality/source
inspection/reload; geography switching/restoration; empty year; second authenticated county; stopped
Pilot transport outage/restoration; running Pilot with unreachable loopback regression source/restoration.
The actual API stays up for both outage cases. Test discovery passed; no case has run yet.
Ports5013API and8783Pilot are reserved;3113 unused. Harness requires ATLAS_RUN_BROWSER=1 plus the
coordinator runtime slot, actual own Release DLL/dist and compiled opt-in fixture. It uses real
development-issued tokens with isolated random signing configuration; no credential/handler injection.
DB/levy/logs and Playwright results each use fresh run-* leaves under artifacts/atlas-browser;
Playwright never receives the retained parent directory as a cleanup target.

No build/server/browser launch occurred during this adoption step. Earlier unassigned-pin notes
below are retained as candidate history, superseded by this exact protected pin receipt.

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
- `node node_modules/typescript/bin/tsc --noEmit -p frontend/tsconfig.json --pretty false`: exit 0.
- `node --test os-platform/core/tests/phase83-tools.test.mjs`: 73 passed.
- The panel test plus existing `atlasNeighborhood.contract.test.tsx`, with the same single-worker,
  retry0 command: 24 passed. First combined run had 23 pass and one cold dynamic module import exceed
  the existing five-second timeout. Moving imports to collection (not increasing timeout or dropping
  assertions) yielded 24 pass; implementation unchanged.
- Post-hook raw Git blobs at OS candidate b5ee273741bb241cde19f7e0a21d61e057353f71 and suite
  0aa44618879f57e5d367379e27653ebbd3e84a36 were compared as Buffers: identical 9,109-byte
  specifications with SHA256 06b68ac64f159215f2ea620740e3eae9fda58a38604b3ea833a18691adbcfa9f.
- Own pinned pnpm9 filtered frozen-lockfile install completed exit 0 with normal lifecycle scripts;
  child-only canonical Path corrected initial Windows husky resolution failure. No package/lock edits.

No .NET build, candidate backend launch, browser fixture execution, tool maturity promotion,
protected OS merge or post-merge critical repeat is claimed. The admitted real browser harness
requires explicitly assigned loopback runtime/auth/data/protected identities; it has no mock route
or demo substitution. Those gates and independent OS exact-head review remain outstanding.
