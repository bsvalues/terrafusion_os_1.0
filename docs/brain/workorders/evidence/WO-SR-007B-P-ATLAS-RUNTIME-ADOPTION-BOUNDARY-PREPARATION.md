# WO-SR-007B-P - Atlas Runtime Adoption Boundary Preparation Evidence

## Verdict

`EXACT_R3_PROCESS_HOST_FOUNDATION_AUTHORITY_REQUIRED`

WO-SR-007A proved the exact standalone Atlas projection through a disposable local test path. It did
not create a runtime host or consumer. This audit found no existing Atlas runtime-selection seam, so
runtime adoption cannot be rehearsed honestly without first creating a narrowly bounded, unwired
process-host foundation.

## Exact evidence anchors

| Surface | Current truth |
| --- | --- |
| Sovereign `origin/main` | `fa59ab33d40618334e2d8d8afcd65986c754d6cb` |
| Atlas `origin/main` | `6c530f1b6b77d59225353dede929c0688f1587da` |
| Atlas module | `src/spatial-read/project-atlas-feature.mjs` |
| Atlas module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |
| Sovereign adapter | `backend/src/TerraFusion.API/Adapters/AtlasSpatialReadAdapter.cs` |
| Existing invocation | Focused test helper in `AtlasLocalSovereignShadowProjectionTests.cs` only |
| Runtime consumer or DI registration | None found |
| Registry state | WO-SR-007A complete; no incomplete Five-Suite record |

## Source inspection

`AtlasSpatialReadAdapter` is a static pure mapping boundary. It validates exact county and parcel
identity, active-source status, WGS-84 coordinates, finite nonnegative area, and a single closed
polygon outer ring. Its `Serialize` method emits the frozen contract with absent optional evidence
omitted. It does not invoke Atlas or participate in runtime routing.

`AtlasLocalSovereignShadowProjectionTests` invokes Node directly with a temporary runner, Node
filesystem permissions, network denial, a 30-second timeout, process-tree termination, and exact
module-hash validation. Those mechanics are test-local and cannot be represented as an existing
runtime host.

The only reusable process-host abstraction found in the sovereign API is
`IRustKernelProcessHost`/`RustKernelProcessHost`. It is valuation-kernel specific and targets a
native executable protocol. Reusing it for an ESM spatial projection would conflate suite contracts
and execution protocols.

## Why another R2 or shadow test is insufficient

The contract, pure adapter, standalone projection, hash pin, parity corpus, and local shadow proof
already exist. The missing capability is an explicit sovereign execution boundary. More
documentation or another disposable test invocation would not prove a new dependency. The next
useful change necessarily adds a runtime-capable source abstraction, even though it remains unwired;
that crosses the R3 implementation boundary.

## Proposed protected successor

### Work Order

`WO-SR-007B - Atlas Unwired Projection Process Host Foundation`

### Exact proposed source and test files

1. `backend/src/TerraFusion.API/Services/Atlas/IAtlasProjectionProcessHost.cs`
2. `backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionProcessHost.cs`
3. `backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasProjectionProcessHostTests.cs`
4. `scripts/validation/Invoke-AtlasUnwiredProjectionProcessHostProof.ps1`
5. the exact activation, Work Order, evidence, registry, routing, and closeout governance files

No Atlas repository file needs to change.

### Required implementation boundary

The host must:

- accept an explicit local module path, expected SHA-256, and frozen spatial-read exchange;
- reject missing, non-canonical, or hash-mismatched modules before process start;
- invoke only the exact local ESM module through Node with a bounded timeout;
- deny network access and constrain filesystem access to the disposable invocation directory;
- enforce bounded stdout/stderr and a single JSON result;
- validate the output property allowlist and preserve county/parcel identity;
- distinguish valid Polygon, Point, and unavailable output;
- terminate the full process tree on timeout or cancellation;
- remove all invocation-owned files;
- remain provider-neutral, deterministic, unregistered, and without a runtime consumer.

### Required proof

- exact Atlas commit, module path, and SHA-256;
- accepted Polygon, Point, and unavailable cases;
- identity mismatch, hash mismatch, malformed output, extra properties, nonzero exit, timeout,
  cancellation, and oversized output fail closed;
- repeated accepted inputs normalize identically;
- no network, install, persistence, provider, GIS service, DI, controller, endpoint, or runtime use;
- clean shared Atlas checkout and complete disposable cleanup;
- focused tests, zero-warning backend build, Work Order query/tooling tests, required remote checks,
  exact-head assurance, and zero unresolved substantive threads.

### Rollback

Because the host remains unwired, rollback is removal of the two new source files, focused tests,
validation script, and governance records. No runtime configuration or external system is changed.

### Terminal condition

`ATLAS_UNWIRED_PROJECTION_PROCESS_HOST_FOUNDATION_PROVEN`

This terminal condition does not authorize process-local runtime selection, DI registration,
controller/service adoption, persistent configuration, deployment, production, ownership transfer,
source retirement, or cutover.

## Why standing authority does not cover implementation

The current Work Order is governance-only. The successor creates two new `backend/src/**` files and
an executable process boundary. Root governance classifies backend/runtime-capable implementation
outside the current exact scope as a protected R3 change. One exact bounded authority envelope is
therefore required.

## Explicit denials for the future envelope

- no DI registration, controller, endpoint, service consumer, or persistent runtime selection;
- no Atlas source mutation, extraction, package publication, workflow, or deployment;
- no providers, network calls, GIS services, persistence, database, county, PACS, SQL, credentials,
  secrets, or production resources;
- no ownership transfer, duplicate retirement, or cutover;
- no Forge, Dais, Dossier, or GPT change.

## Safety and non-claims

This audit changes governance and evidence only. It does not implement the proposed host, mutate the
Atlas repository, or alter TerraFusion runtime behavior. The five-suite program remains active at
an exact protected boundary.
