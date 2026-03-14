# Phase 15 Data Quality and Operational Completeness

## Purpose
Measure whether the promoted Benton operational snapshot is clean enough and complete enough to support trustworthy assessor workflows.

## Scope
- comparable-sales structural integrity
- comparable-sales placeholder and normalization debt
- comparable-sales enrichment coverage needed for subject-aware valuation
- valuation-side operational tables required by richer CostForge behavior
- parity of those signals across local canonical runtime, staging, and production

## Canonical boundary
- PACS remains the raw legacy source.
- TerraFusionSync remains the conversion boundary.
- TerraFusion operational tables remain the application truth.
- Phase 15 does not permit PACS-direct shortcuts to hide enrichment gaps.

## Quality rules
- `ComparableSales` must retain explicit qualification labels and verified sale structure.
- Placeholder address debt must stay bounded and visible.
- Subject-aware valuation quality requires enrichment fields beyond price/date/property type alone.
- PACS improvement-level matrices must be converted into TerraFusion `CostMatrices`; this phase does not accept Marshall & Swift substitution or PACS-direct shortcuts.
- Empty valuation tables such as `CamaCharacteristics` and `CostMatrices` are operational completeness gaps, not cosmetic debt.

## Current Benton truth
- `ComparableSales` is structurally valid and now carries enough Benton enrichment coverage for subject-aware valuation quality to clear the Phase 15 gate.
- `CamaCharacteristics` and `CostMatrices` are populated on the canonical Benton runtime from PACS improvement/profile truth.
- The deployed Hostinger snapshot runtimes match the local Benton quality profile; the gap is no longer completeness or environment drift.

## Boundary
- This phase does not expand the PACS-connected runtime role.
- This phase does not change the Hostinger snapshot-only role.
- This phase measures quality and completeness of the already-promoted Benton operational snapshot.

## Completion rule
Phase 15 reaches GO only when the Benton data-quality packet passes without enrichment or completeness blockers.
