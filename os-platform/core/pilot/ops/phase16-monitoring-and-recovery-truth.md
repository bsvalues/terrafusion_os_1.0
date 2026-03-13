# Phase 16 Monitoring, Backup, and Recovery Truth

## Purpose
Phase 16 hardens the Benton operational-snapshot runtime by proving three things at the same time:
- public health is truthful on staging and production
- snapshot freshness is bounded against the canonical local Benton sync runtime
- backup and restore preserve the promoted Benton operator contract

## Canonical Monitoring Truth
Snapshot freshness is measured from the latest completed full Benton sync marker (`CamaCharacteristics,Sales,CostMatrices`).

Public health is truthful only when:
- staging `/health` returns HTTP `200` and reports `"environment":"Staging"`
- production `/health` returns HTTP `200` and reports `"environment":"Production"`
- both surfaces emit a release header (`X-Release-Sha`)

## Recovery Truth
Hostinger staging and production must each support a backup-and-restore drill against the promoted Benton snapshot contract.

The Phase 16 backup-and-restore drill is successful only when:
- the source Benton snapshot contract matches the canonical local stable snapshot
- the copied backup preserves that same stable snapshot contract
- the restored copy preserves that same stable snapshot contract
- the latest completed full Benton sync marker is preserved across source, backup, and restore

## Decision Rule
Phase 16 reaches GO only when public health is truthful, snapshot freshness is bounded, and backup/restore preserves the Benton operator contract.
