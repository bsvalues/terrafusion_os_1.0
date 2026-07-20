# WO-SR-002 - Shared Contract Freeze

## Result

`TerraFusion.Abstractions` now has a complete, machine-checked classification of its current 20 C#
files. Five files are frozen in two versioned groups; ten remain explicitly deferred; five are
OS-internal. No package was published and no suite implementation moved.

## Current-main truth

The historical forensic branch contains proposed promotions that are absent from current `main`.
WO-SR-002 therefore freezes only files present and supportable on the active base. It does not claim
that CanonicalTf, GIS, Kernel, or Dais readiness contracts are already in Abstractions.

| Group | Version | Files | Suites |
| --- | --- | --- | --- |
| `forge.valuation` | `1.0.0` | 4 | Forge |
| `crosscut.audit` | `1.0.0` | 1 | Forge, Atlas, Dais, Dossier, GPT |

Atlas, Dais, Dossier, and GPT have no domain-specific frozen group yet. Their extraction Work Orders
must promote or define a stable contract before implementation ownership transfers.

## Evidence

- `backend/src/TerraFusion.Abstractions/contracts.freeze.json` is the machine source of truth.
- Every frozen file is pinned by SHA-256.
- Every C# file under the contract root is classified exactly once.
- Compatibility and deprecation rules are recorded in `CONTRACTS.md` and the manifest.
- Future package IDs are reserved but explicitly `planned_not_published`.
- `contract-compat` validates the freeze without dependency installation.
- `WO-SR-003-SUITE-REPOSITORY-CREATION-MANIFEST.json` records five exact creation Work Orders,
  bootstrap inventories, source inventories, contract dependencies, and pre-extraction gates.

## Provenance

The topology and program intent were reconstructed from commits `337ecaca8`, `6fdef4feb`,
`0eaf73a8f`, `82375b638`, and `7f5224aec` on the unmerged forensic branch. Those commits were not
cherry-picked because that branch is materially divergent from current `main`. Only decisions
verified against current paths and source were restated here.

## External boundary

Creation of the five private GitHub repositories remains
`BLOCKED_MISSING_EXECUTION_CREDENTIAL`. That boundary does not block contract governance,
provenance policy, bootstrap inventories, or Work Order preparation in the sovereign base.

## Validation

- `node scripts/contracts/verify-contract-freeze.mjs`
- `node --test scripts/contracts/verify-contract-freeze.test.mjs`
- `dotnet build backend/src/TerraFusion.Abstractions/TerraFusion.Abstractions.csproj --no-restore`
- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`

The Cortex `review-diff` scope check confirms every changed file is inside WO-SR-002. Its global
write-lane check remains red on pre-existing repository manifest state; this Work Order changes no
tool manifest, write lane, runtime handler, or suite-owned implementation.
