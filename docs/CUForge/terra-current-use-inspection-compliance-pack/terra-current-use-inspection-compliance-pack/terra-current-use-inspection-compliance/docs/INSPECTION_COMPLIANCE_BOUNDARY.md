# Current Use Inspection & Compliance Boundary

## Purpose

Track inspections, audit cycles, risk reasons, and compliance status for classified land.

## Forge Owns

- compliance status summary
- inspection review facts
- risk scoring support
- removal-review recommendations

## Dais Owns

- scheduling tasks
- staff assignment workflow
- waiting-on-owner follow-up

## Atlas Owns

- spatial observations and overlays

## Dossier Owns

- inspection photos/documents
- field evidence attachments

## TerraTrace Owns

- inspection scheduled
- inspection completed
- compliance status changed

## Frontend Wiring

Add to Current Use tab:

```tsx
<CurrentUseCompliancePanel parcelId={overview.parcelId} />
```

## Backend Wiring

Register:

```csharp
services.AddTerraCurrentUseCompliance();
```

## Guardrail

Compliance risk does not automatically remove classification.

Human staff must review and initiate removal workflow.
