# Migration Provenance Ledger

## Ledger Rule

Every promoted, imported, rewritten, or built-fresh artifact must record:

- Work Order ID
- Loop
- Source
- Target
- Intake type
- Authorization
- Validation
- Rollback
- Owner
- Date

## Initial Entry

Work Order: WO-LOOP-44
Loop: 44
Artifact: TerraFusionOS receiving scaffold
Source: built-fresh from Loop 43 handoff and Master Playbook doctrine
Target: TerraFusionOS
Intake type: built-fresh governance scaffold
Runtime code imported: no
WO-CORE-1 released: no
Rollback: delete/revert scaffold commit before runtime intake begins
