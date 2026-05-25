# Current Use Appeals and Reclassification Boundary

## Purpose

Track appeal windows, Board of Equalization support, and reclassification option deadlines after removal or pending removal.

## Forge Owns

- removal facts
- rollback calculation references
- reclassification option tracking
- appeal packet calculation context

## Dais Owns

- staff workflow tasks
- scheduling follow-up
- hearing preparation tasks

## Dossier Owns

- appeal evidence packet documents
- notice records
- Board packet documents

## TerraTrace Owns

- appeal window opened
- appeal filed
- reclassification option opened
- application received

## Frontend Wiring

Add to Current Use tab:

```tsx
<CurrentUseAppealsReclassificationPanel parcelId={overview.parcelId} />
```

## Backend Wiring

Register:

```csharp
services.AddTerraCurrentUseAppeals();
```

## Guardrail

This slice tracks deadlines and packets.

It does not decide appeal outcomes or legal eligibility.
