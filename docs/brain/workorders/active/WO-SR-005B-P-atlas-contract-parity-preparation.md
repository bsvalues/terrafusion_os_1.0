# WO-SR-005B-P - Atlas Contract and Parity Gate Preparation

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only source discovery and governance evidence |
| Base | Current `origin/main` after WO-SR-005A closeout |
| Destination | `bsvalues/terrafusion-atlas` |
| Next | `WO-SR-005B` only if a genuine contract and map parity gate are evidenced |

## Objective

Audit live Atlas source and integration truth, identify any genuine suite-consumable contract boundary,
and define the smallest standalone map parity gate without extracting or changing runtime source.

## Required boundaries

- Read `brain/packs/atlas/README.md` and nearer `AGENTS.md` files before inspection.
- Reconcile `packages/gis-pro`, the Atlas suite home, and relevant backend GIS surfaces against live
  tracked source; candidate paths are not authority.
- Classify every proposed contract as existing, missing, OS-owned, suite-owned, or not extractable.
- Do not create a contract merely to unblock extraction.
- Produce an evidence-backed `WO-SR-005B` readiness or blocked verdict.

## Blocked

- Atlas source extraction or destination product writes
- Shared-contract implementation or publication
- Geometry, map behavior, or provider changes
- County/PACS/SQL data, secrets, deployment, production, or external service access
- Source deletion, ownership cutover, or duplicate retirement

```json
{
  "id": "WO-SR-005B-P",
  "task": "Prepare the Atlas contract and standalone map parity gate from live source truth",
  "risk": "R2",
  "suite": "TerraAtlas",
  "allowed_files": [
    "docs/brain/workorders/**"
  ],
  "forbidden_patterns": [
    "packages/gis-pro/**",
    "backend/**/*.cs",
    "frontend/**/*.ts",
    "frontend/**/*.tsx",
    ".github/workflows/**",
    "deployment/**",
    "**/pnpm-lock.yaml",
    "**/ARCHIVE/**"
  ],
  "required_proof": [
    "live tracked Atlas source inventory",
    "contract ownership classification",
    "standalone map parity gate definition",
    "no runtime or destination source change",
    "git diff --check"
  ]
}
```
