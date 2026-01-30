# TerraFusion OS — Architectural Consolidation Spec Package (v3)

Date: 2026-01-28
Scope: Specification deliverable (no feature code)
Purpose: lock suite consolidation around Property Workbench as the OS bridge and TerraPilot as the OS copilot with Pilot/Muse modes.

## Package contents
- 01_PROPERTY_WORKBENCH_SPEC_v3.md
- 02_TERRAPILOT_SPEC_v3.md
- 03_SUITE_BOUNDARIES_WRITE_LANES_v3.md
- 04_TERRATRACE_SPEC_v3.md
- 05_MIGRATION_PLAN_v1.md
- 06_NAMESPACE_RESERVATIONS_v1.md
- 07_VALIDATION_CHECKLIST_v1.md
- ADR/ADR-0001..0004 (decisions)

## Canonical suite family (locked)
- TerraFusion — OS / platform
- TerraForge — Valuation suite (build value)
- TerraAtlas — GIS suite (see the county)
- TerraDais — Assessor Admin suite (operate value)
- TerraDossier — Evidence / narratives / packets (prove the decision)
- TerraPilot — OS feature (personal copilot) with Pilot Mode + Muse Mode

## Non‑negotiables
- Property Workbench is Tier‑0 OS (not suite-owned)
- Single parcel URL: /property/:parcelId[/tab]
- Unified TerraTrace: append-only, county-scoped, permission-gated
- Write-lanes: each fact has exactly one writer
