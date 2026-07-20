# WO-SR-005B-C - Atlas Read Contract Decomposition

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R2 read-only design and governance evidence |
| Base | Current `origin/main` after WO-SR-005B-P closeout |
| Destination | `bsvalues/terrafusion-atlas` remains read-only |
| Next | Atlas contract implementation packet only if decomposition proves a stable boundary |

## Objective

Decompose the existing Atlas parcel-boundary and layer read concepts into an exact, provider-neutral,
county-context-aware contract candidate without changing or promoting source.

## Required boundaries

- Start from `IGisDataService.cs`, `useAtlasGis.ts`, `atlasService.ts`, and the frozen-contract policy.
- Separate suite-owned spatial records from PACS persistence, OS integration, Workbench composition,
  valuation, workflow, custody, provider, and county-specific concerns.
- Define exact candidate records, field ownership, county-context semantics, source-honesty states,
  compatibility rules, and synthetic fixtures.
- Identify fields that must be excluded or moved before any contract implementation.
- Produce an evidence-backed implementation-ready or blocked verdict.

## Blocked

- C# or TypeScript contract implementation
- Contract freeze or package publication changes
- Atlas extraction or destination product writes
- Runtime, renderer, provider, geometry, map, or product behavior changes
- County/PACS/SQL data, secrets, deployment, production, or external service access

```json
{
  "id": "WO-SR-005B-C",
  "task": "Decompose the Atlas parcel spatial read contract from live source truth",
  "risk": "R2",
  "suite": "TerraAtlas",
  "allowed_files": [
    "docs/brain/workorders/**"
  ],
  "forbidden_patterns": [
    "backend/**/*.cs",
    "frontend/**/*.ts",
    "frontend/**/*.tsx",
    "packages/gis-pro/**",
    ".github/workflows/**",
    "deployment/**",
    "**/pnpm-lock.yaml",
    "**/ARCHIVE/**"
  ],
  "required_proof": [
    "exact contract candidate records and field ownership",
    "county-context and source-honesty semantics",
    "cross-suite and provider exclusions",
    "synthetic fixture contract",
    "implementation-ready or blocked verdict",
    "git diff --check"
  ]
}
```
