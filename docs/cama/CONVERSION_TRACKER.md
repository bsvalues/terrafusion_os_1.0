# CAMA Legacy Conversion Tracker

Purpose: Track each county's legacy CAMA system and conversion status into Terrafusion OS.

- IMPORTANT: Each county is deployed, validated, and operated independently. No combined or parallel deployments.
- Integration target for this client: Harris PACS (not Tyler).

## Benton County, WA
- Legacy CAMA: PACS 9.0 (Harris)
- Conversion Target: Terrafusion OS 1.0
- Integration Scope:
  - Real-time bi-directional sync with Harris PACS
  - Property/Tax roll ingestion and reconciliation
  - Audit logging and compliance (FISMA, NIST 800-53)
- Status: In Progress
- Notes:
  - Keep all county resources isolated
  - Use production-grade validation (see `tests/`, `scripts/`, `championship/`)

## Template for New Counties
- County: <Name, State>
- Legacy CAMA: <Vendor + Version>
- Conversion Target: Terrafusion OS 1.x
- Integration Scope:
  - <Bullets>
- Status: <Planned | In Progress | Validated | Live>
- Notes:
  - <Per-county isolation requirements>
