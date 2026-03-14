# ADR-002: Regression Studio is a TerraForge Suite Module

**Status:** Accepted (2026-03-14)

## Context

- Regression Studio provides MRA (Multiple Regression Analysis) model building, calibration, and diagnostics.
- Polyrepo audit found working implementations in: Bsbcintelligentvalues (1,005-line mass appraisal regression engine with additive/multiplicative/hybrid/nonlinear models, R-squared, adjusted R-squared, F-statistic, t-stats, VIF), terra-forge-rebuild (server-side OLS solver with Gauss-Jordan inversion), TerraFusionTheory (GWR -- Geographically Weighted Regression with spatial feature engineering, viewshed, R-tree indexing), mass-valuation-showcase (Python scikit-learn RandomForest/GradientBoosting with cross-validation).
- These are cross-parcel, model-level batch operations -- they train models across hundreds or thousands of parcels.
- They cannot be parcel-scoped (regression requires a training set).
- They fall within Forge's constitutional write-lane: valuation models, calibration (TF-052).
- The plan's open question was: "Is Regression Studio a TerraForge module or a new OS workspace?" (ADR-TBD-2).
- GWR (spatial regression) is co-owned: Atlas provides spatial features (neighborhood definitions, location factors), Forge consumes them as model inputs. The regression model itself is Forge-domain.

## Decision

- Regression Studio is a **TerraForge standalone suite module**.
- It opens inside the TerraForge suite workspace (near-full-stage window), NOT inside the Property Workbench.
- It is NOT a new OS workspace -- it belongs to Forge's valuation domain.
- Module ID: `regression-studio` (already registered in moduleComponents.tsx).
- Launch surface: TerraForge suite home -> Regression Studio panel.
- Write-lane: Forge (model coefficients, calibration runs, predicted values).
- Read-lane from Atlas: spatial features, neighborhood codes, location factors (Atlas writes these; Forge reads them).
- Constitutional basis: TF-052 section Forge owns "valuation models, calibration".
- GWR specifically: the spatial weighting matrix comes from Atlas data, but the regression computation and model storage are Forge-domain.

## Consequences

- The `regression-studio` module in generatedModules.ts keeps `intent: "future-module"` until implementation begins.
- ForgeSuiteHome.tsx will add a Regression Studio launch card.
- Backend: `TerraFusion.AI` or new `TerraFusion.Valuation` project needs regression engine (port OLS from terra-forge-rebuild, MRA framework from Bsbcintelligentvalues, GWR concepts from TerraFusionTheory).
- Python ML microservice may be needed for scikit-learn/XGBoost models (from mass-valuation-showcase ml/train_model.py) -- or reimplement in ML.NET.
- Atlas to Forge data flow for spatial features is a projection, not a write-lane violation (Doc 0D section 4: "Atlas writes spatial data; Forge reads it").
- No new OS-level surface registration needed.
