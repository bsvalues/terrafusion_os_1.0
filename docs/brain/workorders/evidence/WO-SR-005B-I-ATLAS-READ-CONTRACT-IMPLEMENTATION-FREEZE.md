# WO-SR-005B-I - Atlas Read Contract Implementation and Freeze

## Result

`PASS_CONTRACT_FROZEN_NO_RUNTIME_ADOPTION`

`atlas.spatial-read@1.0.0` is now a hash-pinned sovereign contract group. This Work Order changed
only the bounded Abstractions contract surface, its verifier, synthetic fixtures, and program
governance. It did not adopt the contract in a service, controller, provider, hook, UI, package,
workflow, deployment, or destination runtime.

## Frozen Surface

| Artifact | Purpose |
| --- | --- |
| `DTOs/AtlasSpatialReadDto.cs` | Provider-neutral request, result, boundary, coordinate, dimension, layer, zoning, flood, and closed-state types |
| `contracts/atlas.spatial-read.v1.schema.json` | Fail-closed exchange schema with county, parcel, geometry, evidence, and cross-lane constraints |
| `contracts/fixtures/atlas.spatial-read.v1.*.synthetic.json` | Four positive and three negative synthetic fixtures |
| `contracts.freeze.json` | `atlas.spatial-read@1.0.0`, Atlas-only consumer, nine exact SHA-256 entries |

The complete freeze now contains three groups and fourteen files. Existing `forge.valuation@1.0.0`
and `crosscut.audit@1.0.0` entries remain unchanged.

## Fixture Verdicts

| Fixture | Expected | Proof |
| --- | --- | --- |
| canonical polygon | PASS | Matching county and parcel, closed ring, canonical zoning and flood |
| provider polygon | PASS | Provider evidence remains distinct from canonical evidence |
| fallback centroid | PASS | Centroid-only fallback makes no polygon claim |
| unavailable | PASS | No coordinates, layers, or geometry truth invented |
| county mismatch | REJECT | Request and result county identity differ |
| invalid ring | REJECT | Polygon has fewer than four coordinates |
| cross-lane fields | REJECT | Owner, valuation, document, workflow, and provider-token fields are forbidden |

County and parcel equality and ring closure are semantic verifier assertions layered on the
structural JSON Schema. No fixture contains county, PACS, SQL, provider, credential, or production
data.

## Validation

- `corepack pnpm install --frozen-lockfile`: PASS in isolated worktree.
- `package.json` SHA-256 before/after: unchanged.
- `pnpm-lock.yaml` SHA-256 before/after: unchanged.
- `node scripts/contracts/verify-contract-freeze.mjs`: PASS, 3 groups / 14 frozen / 10 deferred / 5 OS-internal.
- `node --test scripts/contracts/verify-contract-freeze.test.mjs`: PASS, 8/8.
- `dotnet build backend/src/TerraFusion.Abstractions/TerraFusion.Abstractions.csproj -c Release`: PASS, 0 warnings / 0 errors.
- Runtime, API, frontend, package, workflow, deployment, destination, county, PACS, SQL, provider,
  credential, secret, and production changes: none.

## Compatibility And Publication

- Contract version: `1.0.0`.
- Package reservation: `TerraFusion.Contracts.Atlas`.
- Publication state: `planned_not_published`.
- Required-field, enum, coordinate-order, county-semantics, or ownership changes require a major
  transition with deprecation evidence.
- Suites consume this contract; they do not redefine it.

## Next

`WO-SR-005B-A - Atlas Adapter and Standalone Parity Preparation` is dependency-cleared as a
docs/evidence-only inspection. It may map the later adapter and destination parity harness, but it
may not change runtime consumers, call providers, copy source, publish packages, or start extraction.
