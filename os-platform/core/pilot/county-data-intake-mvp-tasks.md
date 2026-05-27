# County Data Intake MVP Task Breakdown

Generated: 2026-05-27

## Goal

Document a separate governed county data intake lane for assessor-provided exports, proving upload provenance and validation readiness before any canonical import. The first production slice must stop at dry-run and approval evidence; it must not mutate the DB or alter production binding.

## Boundary Rules

- Do not touch current June 10 39-county repair scripts or evidence.
- Do not touch TerraFusion Sync or Benton DB drain work.
- Do not write canonical runtime tables.
- Do not change production DB binding.
- Keep implementation under the core governance surface unless explicitly authorized.
- Add tests before implementation.

## Proposed Future Design-Gated Slices

### Slice 1: Receipt Schema Contract

Files:

- Keep: `os-platform/core/pilot/county-data-intake-receipt.schema.json`
- Specify future test: `os-platform/core/pilot/county-data-intake-receipt-schema.test.mjs`
- Specify future validator: `os-platform/core/pilot/county-data-intake-receipt-validator.mjs`

Deliverables:

- Specify a good receipt validation case.
- Specify rejection for missing county/FIPS binding.
- Specify rejection for non-SHA-256 hashes.
- Specify rejection for secret-like values.
- Specify rejection for `canonicalImportAllowed: true`.

Verification:

```bash
node --test os-platform/core/pilot/county-data-intake-receipt-schema.test.mjs
```

### Slice 2: Upload Manifest And Hash Proof

Files:

- Specify future file: `os-platform/core/pilot/county-data-intake-artifact-manifest.mjs`
- Specify future test: `os-platform/core/pilot/county-data-intake-artifact-manifest.test.mjs`

Deliverables:

- Define SHA-256 proof for an original upload fixture.
- Define safe ZIP entry enumeration.
- Specify rejection for path traversal and unsupported executable entries.
- Document deterministic artifact manifest output.

Verification:

```bash
node --test os-platform/core/pilot/county-data-intake-artifact-manifest.test.mjs
```

### Slice 3: CSV/TXT Schema And Row Validation

Files:

- Specify future file: `os-platform/core/pilot/county-data-intake-tabular-validator.mjs`
- Specify future test: `os-platform/core/pilot/county-data-intake-tabular-validator.test.mjs`

Deliverables:

- Define required headers by data domain.
- Specify row count accounting.
- Specify detection of missing parcel ID candidates.
- Specify detection of duplicate parcel identifiers.
- Document rejected-row report rows in deterministic order.

Verification:

```bash
node --test os-platform/core/pilot/county-data-intake-tabular-validator.test.mjs
```

### Slice 4: County/FIPS Binding Guard

Files:

- Specify future file: `os-platform/core/pilot/county-data-intake-county-binding.mjs`
- Specify future test: `os-platform/core/pilot/county-data-intake-county-binding.test.mjs`

Deliverables:

- Specify `WA` state requirement.
- Specify FIPS pattern `53xxx`.
- Define uploader authorized-FIPS matching against declared FIPS.
- Specify rejection for data-domain county/FIPS conflicts.
- Specify rejection for multi-county source payloads for MVP.

Verification:

```bash
node --test os-platform/core/pilot/county-data-intake-county-binding.test.mjs
```

### Slice 5: Dry-Run Import Report

Files:

- Specify future file: `os-platform/core/pilot/county-data-intake-dry-run-report.mjs`
- Specify future test: `os-platform/core/pilot/county-data-intake-dry-run-report.test.mjs`

Deliverables:

- Define candidate, insert, update, unchanged, duplicate, rejected, and unresolved row summary fields.
- Specify county/FIPS and source receipt ID echo.
- Specify `canonicalImportAllowed: false`.
- Document report artifact hash.
- Specify no DB connections and no DB writes.

Verification:

```bash
node --test os-platform/core/pilot/county-data-intake-dry-run-report.test.mjs
```

### Slice 6: Evidence Packet Builder

Files:

- Specify future file: `os-platform/core/pilot/county-data-intake-evidence-packet.mjs`
- Specify future test: `os-platform/core/pilot/county-data-intake-evidence-packet.test.mjs`

Deliverables:

- Define evidence artifacts under `os-platform/core/pilot/evidence/county-data-intake/<intakeId>/`.
- Document receipt, validation checklist result, rejected rows, dry-run report, approval-decision stub, and artifact manifest.
- Specify deterministic and receipt-bound evidence paths.
- Specify approval status `not_requested` or `pending`; never auto-approve.

Verification:

```bash
node --test os-platform/core/pilot/county-data-intake-evidence-packet.test.mjs
```

### Slice 7: Approval Boundary

Files:

- Specify future file: `os-platform/core/pilot/county-data-intake-approval-gate.mjs`
- Specify future test: `os-platform/core/pilot/county-data-intake-approval-gate.test.mjs`

Deliverables:

- Define `PENDING_APPROVAL` only when receipt, hashes, secret scan, binding, validation, rejected-row report, and dry-run report all exist.
- Define blockers for each missing requirement.
- Specify reviewer identity before `APPROVED_FOR_IMPORT`.
- Document that approval artifact authorizes a later lane only; it does not execute import.

Verification:

```bash
node --test os-platform/core/pilot/county-data-intake-approval-gate.test.mjs
```

## Production Proof Gates

Use these gates in a future implementation phase before claiming the lane production-proven:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
node --test os-platform/core/pilot/county-data-intake-*.test.mjs
```

Optional in a future implementation phase after TypeScript sources are added:

```bash
pnpm run build:core-js
pnpm run check:generated
```

## First Slice Recommendation

Start future execution with Slice 1 only. It is small, isolated, and specifies the governance contract all later intake work must satisfy.
