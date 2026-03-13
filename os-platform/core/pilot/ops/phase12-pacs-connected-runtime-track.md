# Phase 12 PACS-Connected Runtime Track

## Purpose
Define and prove the separate PACS-connected runtime role so it does not drift back into the Hostinger snapshot runtime.

## Canonical PACS-connected runtime
- Local/canonical Benton runtime is the PACS-connected sync and conversion host.
- It reads parcel and assessment truth from `pacs_oltp`.
- It reads sales-history truth from `pacs_golive`.
- It runs TerraFusionSync conversion into the TerraFusion operational store.
- It is the source runtime for Benton snapshot generation and later promotion work.

## Hostinger snapshot runtime
- Hostinger staging serves Benton operational snapshots only.
- Hostinger production serves Benton operational snapshots only.
- Neither Hostinger environment is expected to reach PACS directly.
- Neither Hostinger environment is expected to advertise active sync systems or active counties.

## Runtime responsibilities
### PACS-connected runtime
- PACS SQL connectivity
- TerraFusionSync conversion
- Benton sync proof
- Benton operational snapshot source generation

### Hostinger snapshot runtime
- Remote operator-facing Benton runtime
- Deployed parity validation
- Public DNS, health, and release identity truth
- No direct PACS connectivity

## Proof requirements
- Local Benton sync proof passes on the PACS-connected runtime.
- Local `/api/TerraFusionSync/status` reports at least one system and one county.
- Hostinger staging `/api/TerraFusionSync/status` reports `TotalSystems = 0`, `ActiveCounties = 0`.
- Hostinger production `/api/TerraFusionSync/status` reports `TotalSystems = 0`, `ActiveCounties = 0`.
- Hostinger `/systems` and `/counties` remain empty arrays.

## Boundary
This phase does not make Hostinger PACS-connected.
This phase establishes the PACS-connected runtime as a separate role and proves the split.

## Next phase handoff
Phase 13 defines the promoted snapshot artifact and the promotion contract from the PACS-connected runtime to the Hostinger snapshot runtimes.
