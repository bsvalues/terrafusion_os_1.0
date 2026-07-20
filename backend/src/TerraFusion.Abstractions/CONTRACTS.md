# TerraFusion Shared Contract Freeze

`TerraFusion.Abstractions` is the sovereign source for contracts shared with the five federated
suite repositories. The source assembly remains internal to `terrafusion_os_1.0`; no package is
published by WO-SR-002.

## Frozen groups

| Group | Version | Class | Consumers | Files |
| --- | --- | --- | --- | --- |
| `forge.valuation` | `1.0.0` | Suite | Forge | `CostMatrixDto`, `PropertyValuationInputDto`, `UpdateCostMatrixDto`, `ValuationResultDto` |
| `crosscut.audit` | `1.0.0` | Cross-cutting | Forge, Atlas, Dais, Dossier, GPT | `IAuditLogger` |

The machine source of truth is `contracts.freeze.json`. It pins every frozen file by SHA-256 and
classifies every other C# file in this project as either deferred or OS-internal.

## Compatibility

- Patch changes may alter documentation or annotations only.
- Minor changes must be additive and backward compatible.
- Renames, removals, type changes, semantic changes, or required members require a major version.
- A major replacement must coexist with the prior major for at least one release and use
  `[Obsolete]` before removal.
- Suites pin a major contract line and must not redefine a shared contract.
- A changed frozen hash must increase the group version and add a `transitions` record naming the
  governing Work Order, compatibility classification, and evidence. Major changes also require
  deprecation evidence. Updating a file and its hash in the same change without that record fails.

## Publication boundary

The current implementation uses a project reference to `TerraFusion.Abstractions`. Future package
IDs are reserved as `TerraFusion.Contracts.Forge` and `TerraFusion.Contracts.CrossCutting`, but their
status is `planned_not_published`. Package creation, registry publication, credentials, and source
extraction are separate Work Orders.

## Validation

Run:

```powershell
node scripts/contracts/verify-contract-freeze.mjs
node --test scripts/contracts/verify-contract-freeze.test.mjs
```

The validator fails on a missing or modified frozen file, invalid version, duplicate classification,
unknown suite, unclassified C# file, accidental publication claim, or an ungoverned baseline
transition. Pull requests run the current manifest and its base revision through the required
`governed-spine` context in `core-governance-gates.yml`.
