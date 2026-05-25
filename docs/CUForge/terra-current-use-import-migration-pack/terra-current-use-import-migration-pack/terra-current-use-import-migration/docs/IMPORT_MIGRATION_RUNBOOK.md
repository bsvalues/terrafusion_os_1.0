# Current Use Import & Migration Runbook

## Purpose

Safely ingest legacy Current Use data from spreadsheets and historical worksheets.

## Supported Import Types

- Classification inventory
- Rollback worksheet
- Evidence index
- Notice history
- Inspection history
- Treasurer payment history

## Process

1. Upload source file to Dossier.
2. Create import batch.
3. Parse file into rows.
4. Validate rows.
5. Review warnings/errors.
6. Dry-run commit.
7. Commit only validated rows.
8. Emit TerraTrace import event.

## Guardrails

- Never overwrite existing records without mapping.
- Preserve source file.
- Dry-run first.
- Import errors must be downloadable.
- Imported calculations must be marked imported, not system-generated.
