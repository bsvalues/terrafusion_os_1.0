# TerraDais Current Use Workflow Boundary

## Purpose

This pack defines Dais-owned workflow handoff for Current Use operations.

## Dais Owns

- task assignment
- review queues
- deadlines
- staff routing
- waiting-on-owner state
- waiting-on-treasurer state
- hearing/appeal task support

## Forge Owns

- classification facts
- valuation facts
- rollback calculations
- calculation versioning
- explanation ledger

## Dossier Owns

- document bodies
- evidence chain
- notice records after issuance

## TerraTrace Owns

- immutable audit spine

## Non-Negotiable Rule

Dais may reference Forge facts but must not mutate Forge valuation artifacts or rollback calculations.

## Frontend Wiring

Add to Current Use tab:

```tsx
<CurrentUseWorkflowPanel parcelId={overview.parcelId} />
```

## Backend Wiring

Register:

```csharp
services.AddTerraCurrentUseWorkflow();
```

## API Routes

```txt
GET   /api/dais/current-use/parcels/{parcelId}/tasks
POST  /api/dais/current-use/tasks
PATCH /api/dais/current-use/tasks/{taskId}/status
```
