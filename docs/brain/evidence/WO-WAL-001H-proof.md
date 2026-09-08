# WO-WAL-001H — Public-reference consumer isolation proof

Status: DELIVERING, protected delivery pending. Parent WO-WAL-001 / issue #1485 remains ACTIVE. Authority and exact scope are recorded in the corresponding active Work Order; risk remains R5. No production or source-access grant is created here.

## Change and preservation boundary

Three existing consumers now exclude a parcel only when its SourceXref-to-LoadBatch ownership identifies source family/system `SOCRATA_PUBLIC_EXPORT` and profile `wal.public-parcel-reference.socrata.v1`:

- `PacsBaselineReconciler.CountTfCanonicalAsync`.
- `ArcGisCrosswalkService.CloseCrosswalkAsync`.
- `ArcGisCanonicalProjector.ProjectCountyAsync`.

There is no blanket UNDER_REVIEW exclusion, guessed PACS-family whitelist, public-to-PACS reinterpretation or repair of historical closed links. Existing county/APN selection, legitimate duplicates, lineage-free/PACS/PROVAL participation and normal gate/audit behavior remain protected. The selected G profile is a separately delivering contract, not an already-admitted public batch.

## Actual tests

All runs used the existing `backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj`, normal thirteen-project closure, existing dependencies and synthetic fixtures. Times are wrapper completion UTC on2026-09-08.

| Run | Result | Meaning |
| --- | --- | --- |
| RED81446,10:46:54.9782884Z |12 failed/4 passed/0 skipped,EXIT1 | Actual count inflation, false closure/ambiguity and wrong-target assertions against unchanged production after successful compilation. Four legitimate controls already passed. |
| GREEN3772,11:10:07.2268860Z |45 passed/0 failed/0 skipped,EXIT0 | All16 new InMemory cases plus29 existing cases after the three query repairs. |
| SQLite63868,11:41:27.7972264Z |3 passed/0 failed/0 skipped,EXIT0 | Actual application-context SQLite execution of all three consumers with selected generated schema, foreign keys, persisted gates/audits and preservation checks. |
| Full regression29091,11:48:58.3365990Z |48 passed/0 failed/0 skipped,EXIT0 | Separate complete three-class run on those same SQLite-built binaries using `--no-build --no-restore`, not an extrapolated sum. |

SQLite facts use private in-memory connections, unmodified table/index statements from `GenerateCreateScript()`, exact installed-schema comparison and foreign-key checks. The reconciler counts three eligible of four stored parcels without writes. Crosswalk considers six active geometries, preserves one closed link, closes three legitimate targets, leaves one no-match and one genuine ambiguity, and records its normal maintenance gate/audit delta. Projector produces six geometry rows with four resolved/two unresolved targets and five normal canonical gates, preserving foreign and prior state. No source-query call, external source or real county record is used.

The combined run includes19 projector,16 crosswalk and13 reconciler tests. Main verified all26 source/WO/dependency hashes, both DLL hashes and seven-path working scope unchanged. Independent assurance separately inspected the source, actual TRX, pins and scope and returned CLEAR for normal protected delivery.

## Exact evidence identity

Validation source base: `0733406fe9067f5d5e61c4a361951c1c3700a9c8`, branch `codex/wal001h-public-reference-consumer-isolation`. This is the base plus reviewed uncommitted six-file candidate, not a claim that protected073 already contained the repair. Later governance metadata does not change or retroactively retag the validated binaries.

External evidence root: `C:/Users/bsval/.codex/visualizations/2026/09/06/01a07732-71da-73f0-8651-896ec72d5be4`.

| Receipt relative to evidence root | SHA256 |
| --- | --- |
| `wal001h-consumer-red-28b228a4560843cf969495e1beea0dc0/consumer-red.trx` | `210486e34d61d43d8ead7a6b79dd080002fe500dc607f9d3d0b95a8e5a1537e9` |
| `wal001h-consumer-green-1226a28922704e538f5afc48b7ccc4fa/consumer-green.trx` | `61a1cbb70ef1b9a22628abe3b3f87193249a0965652bd0e89b4015d31f75816a` |
| `wal001h-sqlite-consumers-9265c7c96d7f49a89b1c9644e83c43be/sqlite-consumers.trx` | `f895add9fbb9c248c05d9968c8b9e890c9647f9f2099fcb06507c1ea09628aa5` |
| `wal001h-full48-regression-b6b1dd68916e40d48c0ad42ce9a58d3a/full-consumer-regression.trx` | `e0ec587bc5d25e9b9559faab65ee24a984b346ac03d683a0e3612f4db311582f` |
| `wal001h-full48-regression-b6b1dd68916e40d48c0ad42ce9a58d3a/validation.txt` | `79397b60e2e873c40bea4c5392411c5dc86f5a150d2bbefb36ac4945752f5444` |

The full regression receipt contains all26 input pins, including the historical WO hash `07b2d22a2eb1e03d5424df6aeaafb6e750e44b82c6e725be323ceb780eec4a7a`, plus DLL SHA256s: Data `59f1f24c8172698b59e450c6c62ab4ffaf17be2089e396cafe9cf31f3314bd43`, Unit.Tests `1cb49604ab3c0abe5480728798f8bcfdc8515ac4a9f77dfb1da0a8df30df487a`.

## Limits and rollback

- SQLite consumer execution is not PostgreSQL, full-model migration, concurrent isolation or multi-save atomicity proof.
- No G import/persistence, source permission, parcel-baseline landing, publicReady, production deployment or external assessor acceptance is established.
- No runtime, schema, dependency, auth, shared configuration or historical county data was changed by this repair. Generated local test outputs are not a deployed release.
- Protected merge/checks and coordinated G integration remain required. A normal reviewed revert of these three query repairs and their tests is code rollback, not repair of historical data; G activation must remain held if the exclusion is absent.
- Child completion, an empty queue and WACO acceptance cannot close #1485. Its all-county, production and external-assessor terminal predicates remain unsatisfied.
