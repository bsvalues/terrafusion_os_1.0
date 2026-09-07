# WO-106 — WACO Benton eligible-comps PII consumer

Status: IMPLEMENTED; integration is BLOCKED_RESERVATION for the two additional cache fixtures and independent assurance is pending Kepler. Authority: direct owner instruction on 2026-09-07 to implement the bounded E consumer repair; standing TerraFusion delivery authority applies within this exact reservation. Parent owns PR, integration and deployment. This child does not reopen WO-103 or activate county/PACS resources.

Base: origin/main at e16572b09da89ca9f8e421ffadcb82aa211126e3.
Branch: codex/waco-benton-consumer-repair.
Isolated worktree: C:/Users/bsval/.codex-worktrees/waco-benton-consumer-repair.

## Reservation

- backend/src/TerraFusion.API/Services/Sync/CanonicalLandingPiiBoundary.cs (new)
- backend/src/TerraFusion.API/Program.cs
- backend/src/TerraFusion.API/Controllers/SyncController.cs
- backend/tests/TerraFusion.Unit.Tests/Sync/Comps/Api/SyncControllerCompsPiiBoundaryTests.cs (new)
- backend/tests/TerraFusion.Unit.Tests/Sync/Comps/Api/SyncControllerCompsEligibleTests.cs
- backend/tests/TerraFusion.Unit.Tests/Sync/Comps/Api/SyncControllerHeadMethodTests.cs
- this work order

Only GET/HEAD /api/sync/comps/eligible is gated. Input and county authorization precede the gate; the gate precedes every reader call, ETag/304 and HEAD success. Missing or unverified coverage produces 503 / PII_CANONICAL_LANDING_UNVERIFIED / UNKNOWN_DENY with no-store and no data/ETag disclosure. Reuse the shipped manifest parser and RequirePiiFreeCanonicalLanding preflight. Bind reviewed offline schema, manifest and county explicitly; do not resolve live SQL metadata or fabricate coverage. A reviewed-safe synthetic control must pass.

## Validation and handoff

TDD: consumer negative regression first, observed red before production edits; focused consumer/eligible/HEAD tests after the fix. External artifacts: C:/Users/bsval/waco-omen-runtime/evidence/e-consumer-repair-20260907/. Disable XML documentation and ASP.NET certificate generation. No full-suite build repairs, SDK installation, runtime writes, or shared/accepted checkout edits.

Independent assurance: Kepler. Commit verified changes locally; no PR or deployment from this child.

Known collision reported before implementation: the unreserved SyncHttpCacheHeadersTests.cs and SyncCacheStaleWhileRevalidateTests.cs (same test directory) contain successful eligible-comps calls whose fixtures will require explicit verified coverage. Do not widen silently or relax UNKNOWN_DENY for these callers.

## Offline configuration contract

The scoped CanonicalLandingPiiBoundary reads four required values under
`Sync:CanonicalLandingPii:Counties:<county-guid-D>:`:

- `ManifestPath`: absolute local path to the existing C51-PII-B manifest wire format.
- `ManifestSha256`: SHA256 of those exact bytes, selected by deployment configuration.
- `SchemaPath`: absolute local path to the reviewed metadata envelope below.
- `SchemaSha256`: SHA256 of that envelope's exact bytes.

The envelope has `CountyId`, `Consumer` (exactly `sync.comps.eligible`), `ManifestSha256`,
`Schema` (the existing county-agnostic PacsSchemaSourceData record), and `Projection`.
The county/consumer/hash binding is outside the PACS records; no second authority or review register
is introduced. Hashes bind the selected artifacts; they do not confer review authority on unknown data.
Provisioning reviewed artifacts and runtime configuration remains parent-owned.

Projection maps each of ChgOfOwnerId, WacCdSourceValue, WacCdCanonicalValue,
SlRatioTypeCdSourceValue, SlRatioTypeCdCanonicalValue, SaleDate, SalePrice,
SourceWorkbookId and SourceWorkbookLockedAt to a nonempty list of `{ Table, Column }`
source metadata references. These must describe the full reviewed provenance of this county-wide
consumer contract, including unpinned requests; a single-workbook review must not be packaged as
county-wide coverage. Each reference must exist and pass RequirePiiFreeCanonicalLanding. The code
does not infer lineage or mark a column safe because a record happens to exist.

The schema embeds neither PiiManifest nor invariant suppressions. Its classifications are replaced
from the separately parsed manifest using existing column-over-table precedence. Existing catalog
integrity validation then runs. Missing fields/unknown columns deny, even if a table was marked
exhaustive; Direct/Indirect or non-exhaustive coverage denies. Files are read-only, bounded to 4 MiB
each, and verified on each request with no positive cache. Read-only provisioning is required;
the service never writes files or resolves the live HarrisPacs catalog.

The unchanged Benton step-1 manifest does not provide complete coverage. Do not fill its empty
tableExhaustive/columns lists to make this gate pass. A synthetic reviewed-safe fixture is used only
in tests and is never installed into the product.

## TDD evidence

Before production changes, red.trx recorded 4/4 failures: GET/HEAD (ordinary and conditional)
returned successful responses instead of the required denial. The initial implementation run
recorded 57 passed / 1 failed: the shipped parser's InvalidDataException for malformed JSON was
not yet mapped to UNKNOWN_DENY. That error contract was corrected within the reserved boundary.
Final counts and independent review are recorded in the external evidence handoff.

The collision run recorded 75 passed / 13 failed across 88 tests; all 58 then-current reserved
consumer/eligible/HEAD cases passed. The 13 failures are confined to the two explicitly reported,
unmodified cache-fixture paths. They expect success without supplying verified coverage.
A further malformed-schema regression proved null FK column lists escaped through the existing
invariant engine (1 failed / 15 passed); the boundary now rejects that shape before catalog build.
The final verified.trx run passed 59/59 reserved cases with zero skips (dotnet exit 0,
80.64 seconds); its SHA256 is 981CE69B2E564D26B6181530B167C8EF410DE94E896D6A8D0E020EE28F9CA0EB.

No native subagent/review dispatch tool or existing Kepler task was available in this child's
exposed tool inventory. The named reviewer remains Kepler; no self-review is labeled independent.
The external handoff provides the exact base, branch, diff reservation, commands and evidence for
the parent's review lane. The prescribed sparse cone omits .husky; local hook coverage is not claimed.
