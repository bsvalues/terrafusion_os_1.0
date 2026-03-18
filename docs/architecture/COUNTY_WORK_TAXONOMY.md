# TerraFusion OS — County Work Taxonomy (Role Matrix)

> **Document A** · Phase 0 Architecture · v2.0
> **Status**: CANONICAL — all code must conform to this document
> **Locked decisions respected**: TF-050, TF-051, TF-052, ADR-0001, ADR-0002, ADR-0003
> **Last updated**: 2026-03-14

---

## Purpose

This document maps every county role to their daily reality in TerraFusion OS. It defines who uses what, when, and why — driving tab visibility defaults (Phase 2), capability placement (Document C), and suite design priorities.

---

## 1. Residential Appraiser

| Field | Content |
|-------|---------|
| **Role** | Residential Appraiser |
| **Core goals** | Develop defensible market values for residential parcels using cost, sales comparison, and (rarely) income approaches. Meet cycle deadlines. Survive BOE hearings. |
| **Daily loop** | Open assigned work queue → pick next parcel → review characteristics → run/review cost model → pull comps → reconcile value → attach notes/photos → mark complete → next parcel |
| **Seasonal loop** | **Jan–Mar**: New construction permits, physical inspections. **Apr–Jun**: Mass appraisal model calibration, ratio studies review. **Jul–Sep**: Notice period, taxpayer inquiries, informal reviews. **Oct–Dec**: BOE hearings, appeal defense, certification prep. |
| **Primary entry point** | Work queue (TerraDais) → Property Workbench → Forge tab |
| **Workbench tabs used** | Summary, Forge (Cost + Sales sub-tabs), Atlas (verify location/neighborhood), Dossier (attach evidence), Pilot (AI assistance) |
| **Workbench tabs hidden** | Clerk, Treasury, Audit (future office tabs — noise for this role) |
| **Suite workspaces used** | TerraForge standalone (batch model runs, appeal defense prep), TerraAtlas standalone (neighborhood review) |
| **Cross-parcel tools needed** | Batch cost model runs, ratio study review (Statistics Studio), comp database search, neighborhood delineation, work queue management |
| **Proof obligation** | Must defend every value at BOE: cost approach documentation, comp selection rationale with adjustments, reconciliation narrative |
| **Data they write** | Valuation artifacts (cost model results, comp selections, reconciled values, appraiser notes, field photos) — **Write Lane: Forge** |
| **Data they read** | Parcel characteristics, sales history, permits, exemptions, prior values, GIS layers, owner info |
| **Key pain points** | Too many clicks to pull comps. Income approach buried in same screen as cost. No batch workflow. No appeal-prep workspace. Comp map disconnected from comp grid. |

---

## 2. Commercial Appraiser

| Field | Content |
|-------|---------|
| **Role** | Commercial Appraiser |
| **Core goals** | Value commercial, industrial, and multi-family properties using all three approaches (cost, sales comparison, income). Defend complex valuations at BOE. |
| **Daily loop** | Review assigned commercial parcels → gather income/expense data → run income capitalization → pull commercial comps → run cost model → reconcile all three approaches → document rationale → mark complete |
| **Seasonal loop** | **Jan–Mar**: Income/expense surveys, market rent analysis, cap rate research. **Apr–Jun**: Model calibration, IAAO compliance review. **Jul–Sep**: Taxpayer meetings (often attorney-represented), informal reviews. **Oct–Dec**: Formal appeals (higher stakes, larger values). |
| **Primary entry point** | Work queue → Property Workbench → Forge tab (Income sub-tab is critical) |
| **Workbench tabs used** | Summary, Forge (all three sub-tabs — Income is primary), Atlas (commercial district context), Dossier (lease abstracts, income docs), Pilot |
| **Workbench tabs hidden** | Clerk, Treasury, Audit |
| **Suite workspaces used** | TerraForge standalone (market data management — cap rates, rent comps, sales DB), TerraAtlas standalone (commercial district mapping) |
| **Cross-parcel tools needed** | Cap rate database, rent comparable database, commercial sales search, income/expense ratio analysis, batch income model runs |
| **Proof obligation** | Three-approach reconciliation with income weighting. Must justify cap rate selection, expense ratios, and vacancy assumptions. Attorney-level scrutiny. |
| **Data they write** | Valuation artifacts (income analysis, cap rate selections, commercial comp adjustments, three-approach reconciliation) — **Write Lane: Forge** |
| **Data they read** | Income/expense data, lease terms, market rents, commercial sales, cap rate surveys, construction costs, property characteristics |
| **Key pain points** | Income approach panel needs more depth (lease-by-lease input, expense breakdown). No cap rate database. No market rent survey tool. Reconciliation of 3 approaches is manual. |

---

## 3. Mass Appraisal Analyst

| Field | Content |
|-------|---------|
| **Role** | Mass Appraisal Analyst |
| **Core goals** | Build, calibrate, and validate statistical models that value thousands of parcels simultaneously. Ensure IAAO compliance (COD < 15, PRD 0.98–1.03). |
| **Daily loop** | Review model diagnostics → adjust variables → re-run regression → check ratio studies → identify outliers → document model changes → coordinate with field staff on data corrections |
| **Seasonal loop** | **Jan–Mar**: Model specification and variable selection. **Apr–Jun**: Model calibration and testing. **Jul–Sep**: Production runs, ratio study certification. **Oct–Dec**: Post-certification analysis, model documentation for next cycle. |
| **Primary entry point** | TerraForge standalone home → Statistics Studio / Regression Studio |
| **Workbench tabs used** | Summary (spot-check individual parcels), Forge (verify model output on specific parcels), Atlas (spatial patterns in residuals) |
| **Workbench tabs hidden** | Clerk, Treasury, Audit, Dais (rarely parcel-level workflow) |
| **Suite workspaces used** | TerraForge standalone (primary — model management), Statistics Studio (ratio studies), Regression Studio (model building), TerraAtlas standalone (spatial analysis of model residuals) |
| **Cross-parcel tools needed** | Regression model builder, ratio study calculator (COD/COV/PRD/PRB), stratification tools, outlier detection, model comparison (side-by-side), coefficient application with impact preview, spatial autocorrelation analysis |
| **Proof obligation** | IAAO Standard on Ratio Studies compliance. Model documentation sufficient for peer review. Statistical validity of every model deployed. |
| **Data they write** | Valuation artifacts (model specifications, coefficient sets, ratio study results, model version history) — **Write Lane: Forge** |
| **Data they read** | All property characteristics, all sales, all prior values, GIS data, market indicators, permit data |
| **Key pain points** | No integrated regression tool. Ratio studies done in Excel. No model versioning. No side-by-side model comparison. Can't visualize residuals on a map. Statistics Studio and Regression Studio don't exist yet. |

---

## 4. GIS Technician

| Field | Content |
|-------|---------|
| **Role** | GIS Technician |
| **Core goals** | Maintain parcel boundaries, produce maps, process plats, and ensure parcel fabric integrity. Does NOT perform valuation analysis. |
| **Daily loop** | Process boundary changes (splits, merges, BLAs) → update parcel fabric → generate maps for appraisers → respond to map requests → maintain layer data → process plat recordings |
| **Seasonal loop** | **Jan–Mar**: Plat processing from prior year recordings. **Apr–Jun**: Aerial imagery integration, orthophoto updates. **Jul–Sep**: Map production for notices and hearings. **Oct–Dec**: Year-end boundary reconciliation, annexation processing. |
| **Primary entry point** | TerraAtlas standalone (full-screen map workspace) |
| **Workbench tabs used** | Atlas (primary — editing single-parcel boundaries), Summary (verify parcel identity) |
| **Workbench tabs hidden** | Forge, Dais, Clerk, Treasury, Audit, Pilot (not their domain) |
| **Suite workspaces used** | TerraAtlas standalone (primary — boundary editing, layer management, map production, plat processing) |
| **Cross-parcel tools needed** | Boundary editing tools, parcel split/merge, layer management, batch geocoding, map export/print, plat processing workflow |
| **Proof obligation** | Parcel boundary accuracy. Legal description consistency. Spatial data integrity for all downstream consumers. |
| **Data they write** | GIS artifacts (boundaries, annotations, layers, plat geometry) — **Write Lane: Atlas** |
| **Data they read** | Parcel identities, legal descriptions, plat maps, aerial imagery, survey data, address points |
| **Key pain points** | Need full-screen map, not a tab. Boundary editing tools not built. Layer management not built. No plat processing workflow. |

---

## 5. Spatial Analyst

| Field | Content |
|-------|---------|
| **Role** | Spatial Analyst |
| **Core goals** | Perform cross-parcel spatial analysis: neighborhood delineation, location factor analysis, model residual mapping, spatial autocorrelation (Moran's I / LISA). Feeds spatial insights TO Forge as projection truth. |
| **Daily loop** | Run spatial queries → analyze neighborhood boundaries → compute location factors → map model residuals → identify spatial clusters/outliers → deliver spatial layers to appraisers and analysts |
| **Seasonal loop** | **Jan–Mar**: Neighborhood boundary review and update proposals. **Apr–Jun**: Location factor recalculation, model residual spatial analysis. **Jul–Sep**: Spatial support for appeal defense (neighborhood context). **Oct–Dec**: Annual spatial analysis report, delineation documentation. |
| **Primary entry point** | TerraAtlas standalone (spatial analysis workspace) |
| **Workbench tabs used** | Atlas (primary — spatial analysis on single parcel context), Summary (verify parcel identity), Forge (read-only — check how spatial inputs affect values) |
| **Workbench tabs hidden** | Dais, Clerk, Treasury, Audit |
| **Suite workspaces used** | TerraAtlas standalone (primary — spatial analysis, neighborhood delineation, autocorrelation tools), TerraForge standalone (consumer — view how spatial factors feed into models) |
| **Cross-parcel tools needed** | Neighborhood delineation workflow, spatial autocorrelation (Moran's I, LISA), location factor calculator, model residual heatmaps, spatial query builder, cluster detection, spatial regression diagnostics |
| **Proof obligation** | Neighborhood boundary defensibility. Location factor methodology documentation. Spatial model assumptions and diagnostics. |
| **Data they write** | Spatial analysis artifacts (neighborhood codes, location factors, spatial analysis results, delineation boundaries) — **Write Lane: Atlas** |
| **Data they read** | All property characteristics, all sales, assessed values, model residuals, GIS layers, aerial imagery |
| **Key pain points** | No spatial autocorrelation tools built. Neighborhood delineation is manual in external GIS. No residual mapping integration. Location factors maintained in spreadsheets. |

---

## 6. Clerk (Recording / Ownership)

| Field | Content |
|-------|---------|
| **Role** | Clerk (Recording / Ownership) — future TerraClerk office |
| **Core goals** | Record documents, maintain chain of title, process ownership changes, ensure recording integrity. |
| **Daily loop** | Process recorded documents → update ownership records → verify legal descriptions → index documents → respond to title inquiries |
| **Seasonal loop** | Relatively steady throughout year. Spikes around tax sale periods and large subdivision recordings. |
| **Primary entry point** | Property Workbench → Clerk tab (future), or TerraClerk standalone (future office) |
| **Workbench tabs used** | Summary, Clerk (ownership/title view), Dossier (recorded documents) |
| **Workbench tabs hidden** | Forge, Atlas (not their domain), Dais (assessor workflows), Treasury, Audit |
| **Suite workspaces used** | TerraClerk standalone (FUTURE — not built) |
| **Cross-parcel tools needed** | Document recording queue, ownership search, grantor/grantee index, batch recording |
| **Proof obligation** | Chain of title accuracy. Recording completeness. Document indexing correctness. |
| **Data they write** | Ownership records, recorded documents, title chain entries — **Write Lane: future TerraClerk** |
| **Data they read** | Parcel identities, legal descriptions, existing ownership, recorded documents |
| **Key pain points** | Clerk tab is a placeholder. TerraClerk not built. Currently using external systems. |

---

## 7. Exemption Clerk

| Field | Content |
|-------|---------|
| **Role** | Exemption Clerk |
| **Core goals** | Process exemption applications, verify eligibility, track renewals, maintain compliance with state exemption laws. |
| **Daily loop** | Review new applications → verify eligibility documents → process approvals/denials → send correspondence → track renewal deadlines → update exemption records |
| **Seasonal loop** | **Jan–Mar**: Heavy application period (senior/disabled exemptions). **Apr–Jun**: Renewal processing. **Jul–Sep**: Notice corrections for exemption-related value changes. **Oct–Dec**: Year-end reconciliation, reporting to state. |
| **Primary entry point** | TerraDais standalone → terra-exempt module (planned), or Property Workbench → Dais tab for single-parcel exemption review |
| **Workbench tabs used** | Summary, Dais (exemption status + processing), Dossier (supporting documents), Clerk (ownership verification) |
| **Workbench tabs hidden** | Forge, Atlas, Treasury, Audit, Pilot |
| **Suite workspaces used** | TerraDais standalone (exemption queue management, batch processing) |
| **Cross-parcel tools needed** | Exemption processing queue, batch renewal notices, eligibility calculator, income verification workflow, state reporting generator |
| **Proof obligation** | Eligibility documentation. Income verification. Timely renewal processing. State reporting accuracy. |
| **Data they write** | Exemption records (applications, approvals, denials, renewals) — **Write Lane: Dais (terra-exempt module)** |
| **Data they read** | Owner info, assessed values, income data, prior exemption history, recorded documents |
| **Key pain points** | terra-exempt module not built. No batch renewal workflow. No eligibility calculator. No integration with state income verification. |

---

## 8. Assessor (Elected Official)

| Field | Content |
|-------|---------|
| **Role** | Assessor (Elected Official) |
| **Core goals** | Oversee fair and equitable assessment of all property. Ensure IAAO compliance. Manage staff and budget. Survive elections. Defend the office at BOE. |
| **Daily loop** | Review management dashboard → check reval progress → review compliance metrics → handle escalated taxpayer issues → attend meetings → sign certifications |
| **Seasonal loop** | **Jan–Mar**: Budget planning, staff allocation. **Apr–Jun**: Model review, compliance monitoring. **Jul–Sep**: Public-facing — notices, hearings, media. **Oct–Dec**: Certification, legislative session prep, annual report. |
| **Primary entry point** | Management Dashboard (county-wide view) → Property Workbench (for specific escalations) |
| **Workbench tabs used** | ALL TABS (needs complete picture for any escalated parcel) |
| **Workbench tabs hidden** | None — full visibility |
| **Suite workspaces used** | Management Dashboard (primary — morning view), TerraDais standalone (certification, staff oversight), TerraForge standalone (model review), Statistics Studio (compliance) |
| **Cross-parcel tools needed** | County-wide compliance dashboard, reval progress tracker, staff workload view, appeal exposure summary, statistical compliance trending, budget tracking |
| **Proof obligation** | Overall assessment equity. IAAO compliance. Certification accuracy. Public accountability. |
| **Data they write** | Certification sign-offs, policy decisions — **Write Lane: Dais (terra-cert module)** |
| **Data they read** | Everything — complete read access across all domains |
| **Key pain points** | No management dashboard. No morning briefing view. Can't see reval progress at a glance. No appeal exposure tracking. Statistical compliance is in spreadsheets. |

---

## 9. Deputy / Chief Appraiser

| Field | Content |
|-------|---------|
| **Role** | Deputy Assessor / Chief Appraiser |
| **Core goals** | Manage day-to-day appraisal operations. Assign work. Monitor quality. Review complex valuations. Train staff. Backstop the Assessor. |
| **Daily loop** | Review work queue → assign parcels → review completed work → handle exceptions → approve complex valuations → monitor area progress → staff coordination |
| **Seasonal loop** | Mirrors Assessor but more operational. Heavy on staff management during reval crunch (Apr–Jun). |
| **Primary entry point** | TerraDais standalone → Work Queue Dashboard, or Management Dashboard |
| **Workbench tabs used** | ALL TABS (supervisory access) |
| **Workbench tabs hidden** | None — full visibility |
| **Suite workspaces used** | TerraDais standalone (work queue, staff assignment), TerraForge standalone (quality review), Management Dashboard, Statistics Studio (area compliance) |
| **Cross-parcel tools needed** | Work queue management with assignment, area progress tracking, quality review workflow, staff workload balancing, exception queue |
| **Proof obligation** | Work distribution fairness. Quality consistency across staff. Timely completion of assigned areas. |
| **Data they write** | Work assignments, review approvals, quality flags — **Write Lane: Dais (terra-queue module)** |
| **Data they read** | Everything — complete read access |
| **Key pain points** | No work queue management tool. No staff assignment board. No quality review workflow. No area progress visualization. |

---

## 10. Business Personal Property Specialist

| Field | Content |
|-------|---------|
| **Role** | Business Personal Property (BPP) Specialist |
| **Core goals** | Value business personal property (equipment, fixtures, inventory). Process renditions. Discover non-filers. Maintain depreciation schedules. |
| **Daily loop** | Process renditions → compare to prior year → verify asset lists → apply depreciation → value accounts → follow up on non-filers → field audits |
| **Seasonal loop** | **Jan–Apr**: Rendition season (heavy intake). **May–Jul**: Non-filer discovery, field audits. **Aug–Sep**: Value finalization. **Oct–Dec**: Appeals, corrections, next-year planning. |
| **Primary entry point** | Business Account Workbench (NEW — not parcel-scoped, account-scoped) |
| **Workbench tabs used** | NOT primary user of Property Workbench (BPP is account-based, not parcel-based). May use Summary tab to see what's at a physical location. |
| **Workbench tabs hidden** | Most tabs irrelevant — BPP workflow is fundamentally different |
| **Suite workspaces used** | Business Account Workbench (FUTURE — new workspace needed), TerraDais standalone (work queue for renditions) |
| **Cross-parcel tools needed** | Rendition processing queue, depreciation schedule manager, non-filer discovery, asset inventory management, business account search (NOT parcel search) |
| **Proof obligation** | Depreciation schedule defensibility. Asset discovery completeness. Rendition processing timeliness. |
| **Data they write** | BPP valuations, asset inventories, depreciation records — **Write Lane: Forge (BPP valuation) or new BPP domain** |
| **Data they read** | Business accounts, prior renditions, asset schedules, business license data, building permits (for discovery) |
| **Key pain points** | Property Workbench is parcel-centric — BPP is account-centric. Need entirely different primary workspace. No rendition processing tool. No depreciation schedule manager. No non-filer discovery workflow. |

---

## 11. IT Director

| Field | Content |
|-------|---------|
| **Role** | IT Director |
| **Core goals** | Keep TerraFusion running. Manage infrastructure. Ensure security and compliance. Plan capacity. Vendor management. |
| **Daily loop** | Check system health → review alerts → manage user issues → coordinate with vendors → plan upgrades → security review |
| **Seasonal loop** | **Jan–Mar**: Budget planning, contract renewals. **Apr–Jun**: Infrastructure scaling for reval load. **Jul–Sep**: Performance monitoring during notice/hearing peak. **Oct–Dec**: Year-end reporting, security audits, disaster recovery testing. |
| **Primary entry point** | TerraCanon (system administration), Management Dashboard (system health) |
| **Workbench tabs used** | Rarely uses Property Workbench directly |
| **Workbench tabs hidden** | N/A — system-level user |
| **Suite workspaces used** | TerraCanon (system config, user management), TerraTrace (audit logs, security events), Management Dashboard (system metrics) |
| **Cross-parcel tools needed** | System health dashboard, user management, security audit logs, performance metrics, backup/recovery controls, integration monitoring |
| **Proof obligation** | System uptime. Security compliance (FISMA). Data integrity. Disaster recovery readiness. |
| **Data they write** | System configuration, user accounts, security policies — **Write Lane: OS Core** |
| **Data they read** | System logs, performance metrics, audit trails, user activity |
| **Key pain points** | TerraCanon not built. No integrated system health dashboard. Security audit requires manual log review. |

---

## 12. DevOps / Systems Admin

| Field | Content |
|-------|---------|
| **Role** | DevOps / Systems Admin |
| **Core goals** | Maintain CI/CD pipelines. Deploy updates. Monitor infrastructure. Ensure zero-downtime deployments. Enforce FISMA deployment compliance. Automate security and operations. |
| **Daily loop** | Monitor build pipelines → deploy approved changes → investigate failures → optimize performance → maintain infrastructure-as-code → respond to alerts → review security scan results |
| **Seasonal loop** | Heavy deployment periods before notice/hearing season. Infrastructure scaling during peak loads. Year-end stability freezes. Security audit preparation cycles. |
| **Primary entry point** | TerraCanon (deployment controls), CI/CD dashboards (external) |
| **Workbench tabs used** | Does not use Property Workbench |
| **Workbench tabs hidden** | N/A — system-level user |
| **Suite workspaces used** | TerraCanon (primary — deploy, monitor, configure), TerraTrace (deployment audit trail, security events) |
| **Cross-parcel tools needed** | Deployment pipeline dashboard, infrastructure monitoring, log aggregation, alert management, feature flag management, security compliance scanning |
| **Proof obligation** | Deployment integrity. Zero data loss. Audit trail for all deployments. FISMA deployment compliance. Zero-downtime SLA adherence. |
| **Data they write** | Deployment artifacts, infrastructure config, security policies — **Write Lane: OS Core (infrastructure)** |
| **Data they read** | System logs, deployment history, performance metrics, error rates, security scan results |
| **Key pain points** | TerraCanon not built as a full deployment console. Need integrated deployment dashboard. Alert management is manual. No FISMA compliance dashboard for deployments. |

---

## Role → Tab Visibility Summary

This table drives the default tab visibility configuration (Phase 2):

| # | Role | Summary | Forge | Atlas | Dais | Clerk | Treasury | Audit | Dossier | Pilot |
|---|------|---------|-------|-------|------|-------|----------|-------|---------|-------|
| 1 | Residential Appraiser | ✅ | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| 2 | Commercial Appraiser | ✅ | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| 3 | Mass Appraisal Analyst | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| 4 | GIS Technician | ✅ | — | ✅ | — | — | — | — | ✅ | — |
| 5 | Spatial Analyst | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| 6 | Clerk | ✅ | — | — | — | ✅ | — | — | ✅ | — |
| 7 | Exemption Clerk | ✅ | — | — | ✅ | ✅ | — | — | ✅ | — |
| 8 | Assessor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | Deputy / Chief | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | BPP Specialist | ✅ | — | — | — | — | — | — | — | — |
| 11 | IT Director | — | — | — | — | — | — | — | — | — |
| 12 | DevOps / Systems Admin | — | — | — | — | — | — | — | — | — |

> **Note**: All tabs accessible via settings override — visibility is a default, not a lock (per TF-050).

---

## Role → Primary Workspace Summary

| # | Role | Primary Workspace | Secondary |
|---|------|-------------------|-----------|
| 1 | Residential Appraiser | Property Workbench | TerraForge standalone |
| 2 | Commercial Appraiser | Property Workbench | TerraForge standalone |
| 3 | Mass Appraisal Analyst | TerraForge standalone (Statistics/Regression) | Property Workbench (spot-check) |
| 4 | GIS Technician | TerraAtlas standalone | Property Workbench (single parcel) |
| 5 | Spatial Analyst | TerraAtlas standalone | TerraForge standalone (consumer) |
| 6 | Clerk | Property Workbench | TerraClerk standalone (FUTURE) |
| 7 | Exemption Clerk | TerraDais standalone (terra-exempt) | Property Workbench |
| 8 | Assessor | Management Dashboard | Property Workbench (escalations) |
| 9 | Deputy / Chief | TerraDais standalone (work queue) | Management Dashboard |
| 10 | BPP Specialist | Business Account Workbench (FUTURE) | — |
| 11 | IT Director | TerraCanon | — |
| 12 | DevOps / Systems Admin | TerraCanon / CI dashboards | TerraTrace |

---

## Suite Workspace Matrix

Rows = roles. Columns = suite workspaces used standalone (not as a Workbench tab). **P** = primary, **S** = secondary/consumer, **—** = not used.

| # | Role | TerraForge | TerraAtlas | TerraDais | TerraDossier | TerraGPT |
|---|------|------------|------------|-----------|--------------|----------|
| 1 | Residential Appraiser | S | S | S | — | — |
| 2 | Commercial Appraiser | S | S | S | — | — |
| 3 | Mass Appraisal Analyst | P | S | — | — | — |
| 4 | GIS Technician | — | P | — | — | — |
| 5 | Spatial Analyst | S | P | — | — | — |
| 6 | Clerk | — | — | — | S | — |
| 7 | Exemption Clerk | — | — | P | S | — |
| 8 | Assessor | S | — | S | — | S |
| 9 | Deputy / Chief | S | — | P | — | — |
| 10 | BPP Specialist | — | — | S | — | — |
| 11 | IT Director | — | — | — | — | — |
| 12 | DevOps / Systems Admin | — | — | — | — | — |

---

## Cross-Parcel Tool Requirements by Role

| Tool Name | Suite Home | Consuming Roles |
|-----------|-----------|-----------------|
| Batch cost model runs | TerraForge | 1 (Residential), 2 (Commercial), 3 (Mass Appraisal), 8 (Assessor), 9 (Deputy) |
| Ratio study calculator (COD/COV/PRD/PRB) | TerraForge — Statistics Studio | 3 (Mass Appraisal), 8 (Assessor), 9 (Deputy) |
| Regression model builder | TerraForge — Regression Studio | 3 (Mass Appraisal) |
| Comp database search | TerraForge | 1 (Residential), 2 (Commercial) |
| Cap rate database | TerraForge | 2 (Commercial) |
| Market rent survey tool | TerraForge | 2 (Commercial) |
| Outlier detection | TerraForge | 3 (Mass Appraisal), 5 (Spatial Analyst) |
| Neighborhood delineation | TerraAtlas | 1 (Residential), 5 (Spatial Analyst) |
| Spatial autocorrelation (Moran's I / LISA) | TerraAtlas | 3 (Mass Appraisal), 5 (Spatial Analyst) |
| Model residual mapping | TerraAtlas | 3 (Mass Appraisal), 5 (Spatial Analyst) |
| Work queue management | TerraDais | 1 (Residential), 2 (Commercial), 9 (Deputy) |
| Batch notices | TerraDais | 7 (Exemption Clerk), 8 (Assessor), 9 (Deputy) |
| Exemption renewal processing | TerraDais — terra-exempt | 7 (Exemption Clerk) |
| Appeal calendar / tracking | TerraDais | 1 (Residential), 2 (Commercial), 8 (Assessor), 9 (Deputy) |
| Certification workflow | TerraDais — terra-cert | 8 (Assessor), 9 (Deputy) |
| Rendition processing queue | TerraDais (BPP) | 10 (BPP Specialist) |
| Depreciation schedule manager | TerraForge (BPP) | 10 (BPP Specialist) |
| Non-filer discovery | TerraDais (BPP) | 10 (BPP Specialist) |
| Income/expense ratio analysis | TerraForge | 2 (Commercial), 3 (Mass Appraisal) |
| Batch income model runs | TerraForge | 2 (Commercial) |

---

## Proof Obligation Matrix

| # | Role | What They Defend | To Whom | When |
|---|------|-----------------|---------|------|
| 1 | Residential Appraiser | Individual parcel values: cost approach, comp selection, adjustment rationale, reconciliation | BOE panel, taxpayers, attorneys | Jul–Dec (notice through hearing season) |
| 2 | Commercial Appraiser | Three-approach reconciliation: cap rate selection, expense ratios, vacancy assumptions, income weighting | BOE panel, taxpayer attorneys, commercial property owners | Jul–Dec (often formal hearings with legal counsel) |
| 3 | Mass Appraisal Analyst | Model statistical validity: IAAO ratio compliance, coefficient defensibility, variable selection rationale | IAAO peer reviewers, state DOR, Assessor | Apr–Sep (calibration through certification) |
| 4 | GIS Technician | Parcel boundary accuracy, legal description consistency, spatial data integrity | Appraisers, Clerk, surveyors, title companies | Year-round (every boundary change) |
| 5 | Spatial Analyst | Neighborhood boundary rationale, location factor methodology, spatial model assumptions | Mass Appraisal Analyst, Assessor, BOE (indirectly via model defense) | Jan–Jun (delineation through model calibration) |
| 6 | Clerk | Chain of title accuracy, recording completeness, document indexing | Title companies, courts, property owners | Year-round (every recording) |
| 7 | Exemption Clerk | Eligibility documentation, income verification, timely renewal processing, state reporting | State DOR, auditors, applicants | Jan–Jun (application through renewal season) |
| 8 | Assessor | Overall assessment equity, IAAO compliance, certification accuracy | Taxpayers, media, county commissioners, state DOR, electorate | Year-round (public accountability) |
| 9 | Deputy / Chief | Work quality consistency, distribution fairness, timely area completion | Assessor, staff, BOE (indirectly) | Year-round (operational accountability) |
| 10 | BPP Specialist | Depreciation schedule defensibility, asset discovery completeness, rendition processing timeliness | BOE panel, business owners, state DOR | Jan–Sep (rendition through value finalization) |
| 11 | IT Director | System uptime, FISMA security compliance, data integrity, disaster recovery readiness | Assessor, county IT governance, state auditors | Year-round (continuous compliance) |
| 12 | DevOps / Systems Admin | Deployment integrity, zero data loss, deployment audit trail, FISMA deployment compliance | IT Director, security auditors, county governance | Year-round (every deployment) |

---

*Government. Transcended.*
