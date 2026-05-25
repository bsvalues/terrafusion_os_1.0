# Cross-Slice Foreign Key Strategy

## Internal Forge FK

Safe:

- Removal → Classification
- RollbackCalculation → Classification
- RollbackCalculation → Removal
- Notice → RollbackCalculation
- Appeal → Removal
- Inspection → Classification

## External FK

Avoid hard FK initially:

- DossierDocumentId
- WorkflowTaskId
- GeometryId
- TreasurerReferenceNumber

Use reference IDs and validate through service calls until platform domains stabilize.
