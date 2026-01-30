# TerraFusion OS — Canonical Spec Package (v3.1)

Date: 2026-01-28  
Status: **Implementation‑ready specification bundle** (no feature code).  
This package **merges and supersedes** prior v3 drafts by adding:
- Suite Compass widget spec
- Suite badge contribution API (`BadgeProvider`)
- Mode override rules
- 12‑week migration plan with milestones
- CI/CD gates + contract validation interfaces
- TerraPilot RBAC vs tool allowlist split + RiskPolicy configuration
- PII sanitization + redaction strategy + retention automation
- Ready‑to‑run test examples
- ADRs with consequences matrix + enforcement + supersession process

## Canonical Location in Repo (recommended)
Create a single source of truth folder:

`docs/architecture/specs/terrafusion/`

Suggested layout:
- `property-workbench/`
- `terrapilot/`
- `terratrace/`
- `adr/`
- `contracts/` (TypeScript interfaces)
- `validation/` (CI gates + tests + checklists)

## Contents
- `01_PROPERTY_WORKBENCH_SPEC_v3.1.md`
- `02_TERRAPILOT_SPEC_v3.1.md`
- `03_TERRATRACE_SPEC_v3.1.md`
- `04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md`
- `05_MIGRATION_PLAN_12_WEEK_v1.md`
- `06_CONTRACTS_TYPESCRIPT_INTERFACES_v1.md`
- `07_CI_CD_GATES_v1.md`
- `08_TEST_EXAMPLES_v1.md`
- `09_DEPLOYMENT_CHECKLIST_v1.md`
- `ADR/ADR-0001..0004_*.md`

## Canonical Names (locked)
- TerraFusion (OS / platform)
- TerraForge (Valuation suite)
- TerraAtlas (GIS suite)
- TerraDais (Assessor Admin suite)
- TerraDossier (Evidence suite)
- TerraPilot (OS feature) — modes: Pilot / Muse
- TerraTrace (unified append‑only audit spine)

## Non‑Negotiables
- Property Workbench is Tier‑0 OS surface
- Canonical routes: `/property/:parcelId[/tab]`
- TerraTrace is append‑only + county‑scoped
- Write‑lane matrix: each fact/artifact has exactly one writer
- TerraPilot tools are mode‑locked + risk‑classified + permission‑gated + traced
