# WO-SR-005A - Forge Bounded Extraction and Provenance

| Field       | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| Status      | ACTIVE AFTER WO-SR-003/004 CLOSEOUT MERGES                          |
| Program     | Five-Suite Federated Repository Buildout                            |
| Risk        | R3 bounded cross-repository extraction                              |
| Base        | Current `origin/main` after WO-SR-003/004 closeout                  |
| Destination | `bsvalues/terrafusion-forge`                                        |
| Next        | Forge parity proof, then evidence-backed ownership cutover decision |

## Objective

Audit the live Forge source inventory, select the smallest contract-backed valuation slice, copy it
to the protected Forge repository with exact provenance, and prove standalone parity without deleting
or transferring sovereign-base ownership.

## Required boundaries

- Read `brain/packs/forge/README.md` and all nearer `AGENTS.md` files before source writes.
- Reconcile the creation manifest's candidate paths against live source truth; do not invent paths.
- Use only frozen `forge.valuation` and `crosscut.audit` contracts.
- Copy first; deletion and canonical ownership transfer are separate Work Orders.
- Record source SHA, source path, destination path, dependency inventory, tests, rollback, and duplicate-retirement plan.

## Blocked

- Deleting or moving sovereign-base implementation
- Package publication
- Cutover or duplicate mutable ownership retirement
- Atlas, Dais, Dossier, or GPT extraction before domain-contract gates
- County/PACS/SQL data, secrets, deployment, production, or destructive action

<!-- brain-machine-policy: brain review-diff reads the json block below -->

```json
{
  "id": "WO-SR-005A",
  "task": "Extract the smallest contract-backed Forge valuation slice with provenance and parity proof",
  "risk": "R3",
  "suite": "TerraForge",
  "allowed_files": [
    "docs/brain/workorders/**",
    "backend/src/TerraFusion.CostForge/**",
    "backend/src/TerraFusion.CurrentUse/**",
    "frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx",
    "packages/terrabuild/**"
  ],
  "forbidden_patterns": [
    "backend/src/TerraFusion.Abstractions/**/*.cs",
    "frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx",
    "frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx",
    "frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx",
    "frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx",
    "deployment/**",
    "**/pnpm-lock.yaml",
    "**/ARCHIVE/**"
  ],
  "required_proof": [
    "exact source and destination provenance",
    "frozen contract compatibility",
    "standalone valuation parity",
    "no source deletion or ownership cutover",
    "git diff --check"
  ]
}
```
