# WO-WAL-002C — Canonical County-Bound CSV Intake

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_PENDING_PROTECTED_MERGE` |
| Program | Washington Assessor Launch V1 |
| Parent | `WO-WAL-002` |
| Base | `474161f9309145e2341419563de7192dfbded11e` |
| Risk | R5 bounded canonical-authority and in-memory CSV composition |
| Contract reservation | `wal.county-upload.csv-county-bound-intake.v1` |
| Environment reservation | `local-memory-authority-bound-csv-only` |
| Terminal condition | `CSV_INTAKE_ENVELOPE_SAME_COUNTY_OPERATION_BINDING_PROVEN` |

## Objective

Add the smallest county-bound composition above protected-complete
`wal.county-upload.csv-envelope.v1`. The contract requires one canonical same-county
`COUNTY_PROVIDED` + `PROTECTED` + `OPERATE` authority decision before one bounded in-memory CSV
admission, then returns immutable county/dataset binding and the protected receipt. It does not add
authentication, upload transport, persistence, promotion, or runtime activation.

## Exact path reservation

- `docs/brain/workorders/active/WO-WAL-002C-canonical-county-bound-csv-intake.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvCountyBoundIntake.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvCountyBoundIntakeTests.cs`

No other repository path is writable under this child Work Order.

## Frozen dataset vocabulary

The dataset ambiguity in the parent reservation is frozen here as the exact closed set `Parcels`
and `Sales`, matching the program's parcel/sales artifact vocabulary. `Unspecified`, unknown numeric
values, filename inference, header inference, and content inference all fail closed. Supporting any
other dataset requires a later exact contract; this child must not guess or silently widen the set.

## Contract

`wal.county-upload.csv-county-bound-intake.v1` accepts canonical county authority objects, one
explicit dataset, a protected CSV declaration, and supplied in-memory bytes and:

1. observes cancellation before inspecting authority or content;
2. admits only canonical resource and authority counties that produce an `Allowed` decision from
   `CountyDataAuthorityBoundary` under the non-configurable posture `CountyProvided`, `Protected`,
   and `Operate`;
3. collapses absent, malformed/noncanonical, and cross-county authority into one non-disclosing
   `AuthorityDenied` error before declaration validation, byte access, snapshotting, hashing, or
   parsing;
4. admits only the explicit `Parcels` or `Sales` dataset and never infers it from artifact content;
5. invokes one concrete `CountyCsvIntakeEnvelope` exactly once, without an injectable bypass,
   retry, fallback, or replacement of protected parser/envelope failures;
6. binds the returned immutable protected receipt to the canonical registry county, explicit
   dataset, and exact fixed authority posture;
7. preserves the protected envelope's byte/hash evidence, bounds, cancellation behavior, and deeply
   read-only parser document.

An allowed result is only evidence that this narrow local composition passed. It is not
authentication, a role/capability grant, data-mode activation, official county adoption, upload
acceptance, persistence approval, or production readiness.

## Denials

- No raw claim, header, route, body, tenant, or user string may supply county authority.
- No caller-controlled data mode, exposure, or action and no public-read exception.
- No authentication, API/controller, multipart transport, filesystem, database, staging,
  quarantine, lineage store, persistence, promotion, rollback, UI, network, credential, protected
  or live county data, or production behavior.
- No alternate envelope implementation, delegate, public test seam, retry, format guessing,
  unsupported dataset, or unknown-format fallback.
- No completion claim for broad parent `WO-WAL-002`, Counties HUB, TerraForge, or launch acceptance.

## Required proof

- exact contract, canonical county, explicit dataset, and fixed posture binding;
- same-county admission for both `Parcels` and `Sales`;
- fail-before-envelope behavior for null, absent, forged/noncanonical, and cross-county authority;
- uniform non-disclosing authority refusal;
- `Unspecified` and unknown dataset refusal without filename/header/content inference;
- exactly one protected envelope invocation and no input access on authority/dataset denial;
- protected declaration, signature, byte/row/field/character-bound, cancellation, and parser failures
  propagate without retry or replacement;
- caller byte mutation cannot change evidence or the deeply read-only returned document;
- exact three-path diff.

## Validation

```text
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter FullyQualifiedName~CountyCsvCountyBoundIntakeTests
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter "FullyQualifiedName~CountyCsvCountyBoundIntakeTests|FullyQualifiedName~CountyCsvIntakeEnvelopeTests|FullyQualifiedName~CountyCsvStreamParserTests|FullyQualifiedName~CountyDataAuthorityBoundaryTests"
git diff --check
git status --short
```

Local offline validation passed 16/16 focused tests and 120/120 combined protected
parser/envelope/authority regression tests using the .NET 8 SDK container with networking disabled.
The exact three-path audit and `git diff --check` also pass. This is local implementation evidence,
not protected completion or parent completion.

## Continuation

Completion returns to open parent `WO-WAL-002`. Later exact children must still own authentication,
upload transport, provenance/lineage storage, quarantine, atomic promotion, rollback, API, and UI.
