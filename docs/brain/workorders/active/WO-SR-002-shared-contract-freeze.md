# WO-SR-002 - Shared Contract Freeze

| Field | Value |
| --- | --- |
| Status | COMPLETE ON MERGE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 contract and gate governance |
| Base | `origin/main` at `129640429e4c86c71c162521553139adc61bb2e7` |
| Next | WO-SR-003A through WO-SR-003E, blocked only on repository-creation credential |

## Objective

Freeze the current genuine suite-consumable contract boundary, classify every remaining abstraction,
define compatibility/publication rules, add deterministic validation, and prepare the extraction and
suite-bootstrap packets without publishing packages or creating repositories.

## Authorized files

- `backend/src/TerraFusion.Abstractions/CONTRACTS.md`
- `backend/src/TerraFusion.Abstractions/contracts.freeze.json`
- `scripts/contracts/verify-contract-freeze.mjs`
- `scripts/contracts/verify-contract-freeze.test.mjs`
- `.github/workflows/core-governance-gates.yml` (contract verification wiring only)
- `docs/brain/workorders/**` files required for this program and routing

## Blocked

- Editing contract C# source or runtime/backend behavior
- Publishing packages
- Creating repositories without the execution credential
- Extracting or deleting implementation
- Secrets, county/PACS/SQL data, deployment, production, or destructive action

## Required proof

- Contract manifest and tests pass.
- Abstractions project builds without source changes.
- Every abstraction C# file is classified exactly once.
- No package is published or claimed as published.
- Work Order query and governance validation pass.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-SR-002",
  "task": "Freeze and validate the shared contract boundary for the five federated suites",
  "risk": "R3",
  "suite": "Portfolio Operator",
  "allowed_files": [
    ".github/workflows/core-governance-gates.yml",
    "backend/src/TerraFusion.Abstractions/CONTRACTS.md",
    "backend/src/TerraFusion.Abstractions/contracts.freeze.json",
    "scripts/contracts/verify-contract-freeze.mjs",
    "scripts/contracts/verify-contract-freeze.test.mjs",
    "docs/brain/workorders/**"
  ],
  "forbidden_patterns": [
    "backend/src/TerraFusion.Abstractions/**/*.cs",
    "frontend/**",
    "os-platform/**",
    "tools/sync/**",
    "packages/**",
    "deployment/**",
    "package.json",
    "**/pnpm-lock.yaml",
    "**/ARCHIVE/**"
  ],
  "required_proof": [
    "node scripts/contracts/verify-contract-freeze.mjs",
    "node --test scripts/contracts/verify-contract-freeze.test.mjs",
    "dotnet build backend/src/TerraFusion.Abstractions/TerraFusion.Abstractions.csproj --no-restore",
    "git diff --check",
    "node docs/brain/workorders/tools/wo-query.mjs --json"
  ]
}
```
