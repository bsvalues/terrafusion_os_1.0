# WO-106 — WACO Benton eligible-comps PII consumer

Status: IMPLEMENTED; expanded cache-fixture remediation VERIFIED (89/89), prior reservation blocker resolved; independent design assurance is proceeding in parallel with Kepler through the parent. Authority: direct owner instruction on 2026-09-07 to implement the bounded E consumer repair and expand the two cache-fixture paths; standing TerraFusion delivery authority applies within this exact reservation. Parent owns PR, integration and deployment. This child does not reopen WO-103 or activate county/PACS resources.

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
- backend/tests/TerraFusion.Unit.Tests/Sync/Comps/Api/SyncHttpCacheHeadersTests.cs (explicit reservation expansion)
- backend/tests/TerraFusion.Unit.Tests/Sync/Comps/Api/SyncCacheStaleWhileRevalidateTests.cs (explicit reservation expansion)
- this work order

Only GET/HEAD /api/sync/comps/eligible is gated. Input and county authorization precede the gate; the gate precedes every reader call, ETag/304 and HEAD success. Missing or unverified coverage produces 503 / PII_CANONICAL_LANDING_UNVERIFIED / UNKNOWN_DENY with no-store and no data/ETag disclosure. Reuse the shipped manifest parser and RequirePiiFreeCanonicalLanding preflight. Bind reviewed offline schema, manifest and county explicitly; do not resolve live SQL metadata or fabricate coverage. A reviewed-safe synthetic control must pass.

## Validation and handoff

TDD: consumer negative regression first, observed red before production edits; focused consumer/eligible/HEAD tests after the fix. External artifacts: C:/Users/bsval/waco-omen-runtime/evidence/e-consumer-repair-20260907/. Disable XML documentation and ASP.NET certificate generation. No full-suite build repairs, SDK installation, runtime writes, or shared/accepted checkout edits.

Independent assurance: Kepler. Commit verified changes locally; no PR or deployment from this child.

The two cache-fixture collisions were reported before widening. The owner then explicitly expanded the reservation to those exact paths. Their controller helpers now supply the same real ReviewedPiiFixture, with deterministic disposal, preserving all existing cache assertions. No production gate changes or unconditional positive decisions are authorized by this fixture remediation. Read-only constructor/caller inspection is included for integration effects.

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

The initial collision run recorded 75 passed / 13 failed across 88 tests; all 58 then-current
reserved consumer/eligible/HEAD cases passed. The 13 failures were confined to the two explicitly
reported cache-fixture paths, then unmodified. They expected success without supplying verified
coverage; this is the red evidence for the subsequently authorized fixture-only remediation.
A further malformed-schema regression proved null FK column lists escaped through the existing
invariant engine (1 failed / 15 passed); the boundary now rejects that shape before catalog build.
The final verified.trx run passed 59/59 reserved cases with zero skips (dotnet exit 0,
80.64 seconds); its SHA256 is 981CE69B2E564D26B6181530B167C8EF410DE94E896D6A8D0E020EE28F9CA0EB.

No native subagent/review dispatch tool or existing Kepler task was available in this child's
exposed tool inventory. The named reviewer remains Kepler; no self-review is labeled independent.
The external handoff provides the exact base, branch, diff reservation, commands and evidence for
the parent's review lane. The prescribed sparse cone omits .husky; local hook coverage is not claimed.

## Expanded cache-fixture remediation

Authority now covers exactly nine paths (the original seven plus the two named cache tests).
Only those two test files and this work order change in the remediation commit. Test method
bodies from the first Fact through EOF compare unchanged to the preceding commit after CRLF
normalization. Both helpers use real ReviewedPiiFixture metadata and IDisposable cleanup.

Read-only tracked-source scans found 13 C# files constructing SyncController; eligible-comps
calls/route references in test files occur only in the five covered classes. Other constructor
callers exercise stale/summary, active-workbook, schema-summary, or R2Wave44 qualification routes,
not this gate. R2Wave38 contains only a comment reference. No additional missing positive fixture
was identified. Constructor signatures and production code are unchanged in this remediation;
this source scan is not a full-suite or all-reader enforcement proof.

Kepler design review begins in parallel via the parent per the latest instruction. Its result is
not yet known to this builder; parent retains PR, push, integration and deployment ownership.

Broader verification: cache-remediation timed out after 240.50 seconds during dependency build,
without a compiler diagnostic or test execution. One bounded reuse run rebuilt the changed test
project with --no-restore and BuildProjectReferences=false against the lane's existing verified
dependency outputs (production source unchanged). cache-remediation-reuse.trx records 89 passed,
zero failed/skipped; dotnet exit 0, 51.067475 seconds. All five reserved test classes were included;
the 13 formerly failing cache cases now pass with unchanged assertions. Both transcripts remain
external and distinct. No SDK repair, full suite, runtime mutation, PR or push was performed.

## PR 1568 independent F review — null manifest entries

The owner relayed REQUESTCHANGES P2: correctly pinned tables:[null] and columns:[null]
escape UNKNOWN_DENY through the shared parser's entry dereferences. The nine-path reservation
is unchanged. Regressions mutate the synthetic manifest before computing its hash, schema pairing
and schema hash; both reproduced NullReferenceException at parser lines 90/114 (2 failed, 0 passed)
before any production remediation. They require 503, the exact public denial code/disposition,
no-store, no ETag, and zero canonical reader calls.

The owned boundary now preprocesses the held, bounded manifest stream to reject null entries
before the existing parser runs. It matches the parser's BOM handling, comments, trailing commas
and case-insensitive property names, inspecting all tables/columns property occurrences. Existing
classification and strict preflight remain authoritative. No shared-parser edit, NullReferenceException
catch, bypass or unconditional positive gate was introduced. API and tests are rebuilt against
unchanged external dependency artifacts with XML docs and certificate generation disabled.

Fresh red/green results are retained as null-entry-* in the external evidence reservation.
Green API build: exit 0, zero warnings/errors, 41.7071785 seconds. The broader five-class run
passed 91/91, zero skips, exit 0, 31.5280166 seconds, including both new regressions and the
reviewed-safe controls. This remediates the reported P2; it does not claim independent approval.
Independent re-review and parent PR/push/deployment ownership remain unchanged.
