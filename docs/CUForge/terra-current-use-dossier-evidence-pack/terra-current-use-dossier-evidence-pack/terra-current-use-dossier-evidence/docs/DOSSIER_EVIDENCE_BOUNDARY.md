# TerraDossier Current Use Evidence Boundary

## Purpose

This slice gives Current Use an evidence packet without violating domain boundaries.

## Dossier Owns

- document bodies
- uploaded files
- evidence chain
- document review status
- issued notices after finalization

## Forge Owns

- classification facts
- rollback calculations
- calculation explanations
- evidence requirements metadata

## Dais Owns

- follow-up tasks
- deadlines
- waiting-on-owner status

## TerraTrace Owns

- immutable audit events

## Frontend Wiring

Add to `CurrentUseWorkbenchTab`:

```tsx
<CurrentUseDossierEvidencePanel parcelId={overview.parcelId} />
```

## Backend Wiring

Register:

```csharp
services.AddTerraCurrentUseDossier();
```

## API Routes

```txt
GET   /api/dossier/current-use/parcels/{parcelId}/evidence-packet
POST  /api/dossier/current-use/documents/link
PATCH /api/dossier/current-use/documents/{documentId}/status
```

## Guardrail

Forge must never store document blobs. Use `DocumentId` references only.
