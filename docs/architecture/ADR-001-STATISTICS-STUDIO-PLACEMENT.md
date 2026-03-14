# ADR-001: Statistics Studio is a TerraForge Suite Module

**Status:** Accepted (2026-03-14)

## Context

- Statistics Studio provides IAAO-compliant ratio studies: COD, PRD, PRB, weighted mean ratios, VEI (Valuation Equity Index).
- Polyrepo audit found working implementations in: Bsbcintelligentvalues (COD/PRD/PRB/VIF diagnostics), mass-valuation-showcase (IAAO ratio study engine with PDF export), terra-forge-rebuild (VEI dashboard with tier plots, outlier detection).
- These are cross-parcel, county-wide analytical tools -- they operate on entire neighborhoods, areas, or the full roll.
- They cannot be parcel-scoped (a ratio study requires many parcels).
- They fall within Forge's constitutional write-lane: valuation models, calibration, ratio analysis (TF-052).
- The plan's open question was: "Is Statistics Studio a TerraForge module or a new OS workspace?" (ADR-TBD-1).

## Decision

- Statistics Studio is a **TerraForge standalone suite module**.
- It opens inside the TerraForge suite workspace (near-full-stage window), NOT inside the Property Workbench.
- It is NOT a new OS workspace -- it belongs to Forge's valuation domain.
- Module ID: `statistics-studio` (already registered in moduleComponents.tsx).
- Launch surface: TerraForge suite home -> Statistics Studio panel.
- Write-lane: Forge (ratio study results, compliance reports).
- Constitutional basis: TF-052 section Forge owns "valuation models, calibration, ratio analysis".

## Consequences

- The `statistics-studio` module in generatedModules.ts keeps `intent: "future-module"` until implementation begins.
- ForgeSuiteHome.tsx will add a Statistics Studio launch card.
- Backend: `TerraFusion.Core` needs ratio study calculation services (port from Bsbcintelligentvalues mass-appraisal.service.ts and mass-valuation-showcase ratioStudiesRouter.ts).
- No new OS-level surface registration needed.
- Mass Appraisal Analyst role's primary entry point is "TerraForge standalone -> Statistics/Regression Studio" (confirmed by Doc 0A).
