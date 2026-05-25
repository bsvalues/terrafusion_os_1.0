# Current Use Canonical Entity Relationship Map

## Core Entities

```txt
CurrentUseClassification
  ├── CurrentUseEvidenceItem
  ├── CurrentUseTimelineEvent
  ├── CurrentUseRemoval
  │     ├── RollbackCalculation
  │     ├── CurrentUseIssuedNotice
  │     ├── CurrentUseAppeal
  │     └── CurrentUsePaymentPacket
  ├── CurrentUseInspection
  └── CurrentUseReclassificationOption
```

## Governance Entities

```txt
CurrentUsePolicyPack
CurrentUseInterestRate
CurrentUseTraceEvent
CurrentUseImportBatch
CurrentUseCountyTenant
```

## External References

```txt
DossierDocumentId → TerraDossier
WorkflowTaskId → TerraDais
GeometryId → TerraAtlas
TreasurerReferenceNumber → Treasurer system
```

## Ownership Rule

Forge owns facts and calculations.
Other systems are referenced by ID, not embedded.
