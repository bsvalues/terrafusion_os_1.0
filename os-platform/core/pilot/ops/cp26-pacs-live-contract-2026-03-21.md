# CP26 — pacscontract.v1 Live Integration Seal
**Date**: 2026-03-21
**Phase**: 33 — PACS Live Integration
**Status**: SEALED ✅

---

## Contract Proof: 20/20 Checks GREEN

### Database Connectivity (pacs_oltp)
| Check | Result |
|---|---|
| tf-mssql container running | UP (4+ hours) |
| Connected to pacs_oltp | ✅ |
| SA auth (TF_Pacs2026!) | ✅ |

### Core Views — pacs_oltp
| View | Status |
|---|---|
| vw_TerraFusion_Property_Core | ✅ present |
| vw_TerraFusion_Property_Ownership | ✅ present |
| vw_TerraFusion_Assessment_History | ✅ present |

### Stored Procedure — pacs_oltp
| Check | Result |
|---|---|
| sp_TerraFusion_HealthCheck exists | ✅ |
| sp_TerraFusion_HealthCheck output | `pacscontract.v1 HEALTHY` |

### Data Assertions — Benton County Parcels
| Assertion | Result |
|---|---|
| PropertyCore row count | 112,057 (≥ 100K ✅) |
| Ownership row count | 246,157 (≥ 200K ✅) |
| Assessment History row count | 1,507,033 (≥ 1M ✅) |
| prop_id 10007 → geo_id | 101040000000000 ✅ |
| geo_id 101040000000000 → prop_id | 10007 ✅ |
| prop_id 10007 owner | MILLER GORDON A & GLENDA J ✅ |
| prop_id 10007 history rows | 25 (≥ 5 ✅) |
| Delta query (since 2014-01-01) | > 0 ✅ |

### Indexes — pacs_oltp (warning-only per contract)
| Index | Status |
|---|---|
| IX_TerraFusion_Property_GeoID | ✅ present |
| IX_TerraFusion_PropertyVal_PropYear | ✅ present |
| IX_TerraFusion_Situs_Property | ✅ present |

### Enrichment Views — pacs_golive (sales connection)
| View | Row Count |
|---|---|
| vw_TerraFusion_Comparable_Sales | ✅ present |
| vw_TerraFusion_Cama_Characteristics | 79,479 rows |
| vw_TerraFusion_Improvement_Cost_Matrices | 1,285 rows |

---

## Adapter Routing Architecture

```
PacsConnection (pacs_oltp):
  → vw_TerraFusion_Property_Core
  → vw_TerraFusion_Property_Ownership
  → vw_TerraFusion_Assessment_History
  → sp_TerraFusion_HealthCheck

PacsSalesConnection (pacs_golive):
  → vw_TerraFusion_Comparable_Sales
  → vw_TerraFusion_Cama_Characteristics
  → vw_TerraFusion_Improvement_Cost_Matrices
```

**Rationale**: pacs_oltp uses PACS 9.0 OLTP schema (imprv_detail, land_detail) which differs from pacs_golive (imprv_det, land). CAMA and ICM views are analytics-tier views correctly deployed to pacs_golive. The adapter already implements this split per PacsSqlAdapter.cs lines 219-251.

---

## Discovery Protocol Applied

Per user feedback (2026-03-21): agent read repo first, asked second.

**What the repo proved without human input:**
- SA password default: `TF_Pacs2026!` (from ops/dev/test-pacs-contract.ps1)
- Container: tf-mssql UP on localhost:1433 (docker ps)
- Connection strings: PacsConnection → pacs_oltp, PacsSalesConnection → pacs_golive (appsettings.Development.json)
- Adapter split: pacs_oltp for core views, pacs_golive for enrichment (PacsSqlAdapter.cs)
- All 6 views deployed: pacs_oltp (4 views), pacs_golive (6 views including all enrichment)
- All indexes deployed to pacs_oltp

**Nothing asked of user.** All 20 checks validated autonomously.

---

## Open Items (post-CP26)

- [ ] Wire `pacsService.ts` live path — backend must be running on port 5000 for frontend to route to `/api/pacs/properties`
- [ ] End-to-end smoke: frontend PropertySearch → backend PacsController → PacsSqlAdapter → pacs_oltp query
- [ ] Set TF_DEV_PACS_PASSWORD in shell profile so .NET picks it up from env (currently defaults work via hardcoded dev config)

---

**Sealed**: CP26 / Phase 33 PACS contract proof
**Proof method**: Direct Docker sqlcmd queries against live container
**20/20 assertions GREEN**
