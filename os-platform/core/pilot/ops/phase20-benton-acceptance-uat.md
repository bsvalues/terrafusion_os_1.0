# Phase 20 Benton Acceptance / UAT Packet

## Purpose
Prove that the Benton operational-snapshot runtime on Hostinger staging and production is technically ready for assessor acceptance testing, and define the boundary between technical UAT readiness and actual operator signoff.

## Two-layer decision model

### Layer 1: Technical UAT Readiness (automated)
The Phase 20 proof packet verifies:
- Phase 17 go-live baseline remains GO
- Phase 19 promoted snapshot contract remains GO
- Benton operator workbench slice tests pass (Forge, Atlas, Dais, Dossier, Pilot tabs)
- Public health endpoints are truthful and release-labeled on staging and production
- The Benton data quality fingerprint (Properties, Assessments, ComparableSales, CamaCharacteristics, CostMatrices) is preserved on both runtimes
- The promoted snapshot promotion receipt is present and valid on both environments

When Layer 1 is green, the packet reports `READY_FOR_SIGNOFF`.

### Layer 2: Assessor/Operator Signoff (manual, not automated)
Final Phase 20 `GO` requires an explicit Benton assessor/operator signoff artifact.

The signoff artifact must contain:
- who signed off (name and role)
- which Benton scenarios were tested
- which known limitations were accepted
- date of signoff

Until that artifact exists, Phase 20 remains `READY_FOR_SIGNOFF` even when the technical UAT matrix is fully green.

## Known limitations (to be disclosed to assessor during UAT)
- ComparableSales.Bedrooms is null on most rows (76,773 of 76,775); this is a PACS source data characteristic, not a TerraFusion defect
- ComparableSales.Bathrooms is populated on 42,012 rows after Phase 15 PACS improvement-level correction
- GrossLivingArea is null on 3,068 comparable sales rows
- LotSizeSqft is null on 12,461 comparable sales rows
- YearBuilt is null on 8,636 comparable sales rows
- Placeholder addresses (PACS prefix) exist on 1,022 comparable sales rows
- Hostinger runtimes are snapshot-only; live PACS sync is not available on the deployed surface

## UAT scenario matrix (assessor-facing)

| Scenario | Surface | Expected Result |
|----------|---------|-----------------|
| Search parcel by ID | Property Workbench | Parcel loads with Summary tab |
| View assessed value | Summary tab | Current assessment displayed |
| View valuation explanation | Forge tab | AI explanation renders with confidence score |
| View GIS layers | Atlas tab | Layer query returns results |
| View workflow status | Dais tab | Certification status check works |
| View evidence chain | Dossier tab | Evidence snapshot loads with hash |
| Use AI copilot | Pilot tab | Tool invocation succeeds |
| Verify data freshness | Summary/Forge | Row counts match promoted snapshot |
| Navigate all 9 tabs | Workbench tab bar | All tabs render without error |

## Completion rule
Phase 20 Technical UAT Readiness is complete when the automated proof packet reports all checks green.
Phase 20 Final GO is complete only when the assessor signoff artifact is committed.
