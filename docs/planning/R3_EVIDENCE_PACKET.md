# R3 Multi-Office Expansion — Evidence Packet

Date: March 10, 2026  
Branch: `r3/full-execution`  
Tags: `r3.0.0` → `r3.1.0` → `r3.2.0` → `r3.3.0` (CX lane)

---

## Promotion Status

> **All R3 work is LOCAL MAIN ONLY as of 2026-03-10.**
>
> - Tags `r3.0.0`–`r3.3.0` exist on local refs only (not pushed to origin)
> - `origin/main` HEAD is `6c74b80d6`, local `main` HEAD is `a15da8fdb`
> - PR #656 (CX rebase) is pending merge onto the protected baseline
> - Constitutional test updated to 9-tab surface (CC remediation, this branch)
> - SEAL gate has NOT been proven green on the R3 candidate branch

---

## Executive Summary

R3 implemented the Core Platform (CP), Component/UI (CC), and Backend API (CX) lanes
for the multi-office expansion of TerraFusion OS. Three new county office verticals —
**TerraClerk**, **TerraTreasury**, and **TerraAudit** — are implemented with
18 real tool handlers, 3 frontend workbench tabs, 3 backend controllers (18 endpoints,
10 entities), and 30 + 34 = **64 acceptance criteria** passing locally.

> **Note:** These results were obtained on local main. CI proof on the protected
> baseline (`origin/main`) is pending PR merge and SEAL gate execution.

---

## R3 Release Progression

| Tag | Commit | Content |
|-----|--------|---------|
| `r3.0.0` | `a581ae2d0` | 53 governed tools, v2.0.0 manifest, 9 workbench tabs, 3 new verticals |
| `r3.1.0` | `00eed894b` | Office registry, RBAC vocabulary expansion, officeScope on all tools, 27 ACs |
| `r3.2.0` | *current* | Cross-office trace tests, county isolation verification, 3-office chain, evidence |
| `r3.3.0` | `012f7fe3a` | CX lane: 3 backend controllers, 10 entities, 18 endpoints, 34 CX tests |

---

## Tool Inventory (53 Governed Tools)

### Assessor Vertical (35 tools)
- **TerraForge** (7): explain_model_results, explain_value_change, compare_assessed_value_history,
  run_income_valuation, explain_model_inputs, summarize_sales_comps_rationale, run_valuation_model
- **TerraAtlas** (3): query_parcel_layers, explain_parcel_boundaries, generate_parcel_map_snapshot
- **TerraDais** (16): check_cert_status, check_exemption_eligibility, get_certification_progress,
  get_queue_statistics, draft_value_change_notice, draft_appeal_response, assemble_boe_packet,
  schedule_boe_hearing, sign_off_certification_step, draft_notice, assign_task, queue_notice_for_mailing,
  escalate_task, process_exemption_renewal, file_appeal, run_pilt_forecast
- **TerraDossier** (3): search_evidence, get_packet_status, attach_evidence_to_parcel
- **TerraGPT** (3): route_to_parcel, search_trace_by_correlation, request_trace_redaction

### TerraClerk Vertical (6 tools) — R3.2
| Tool | Mode | Risk | officeScope |
|------|------|------|-------------|
| search_recorded_documents | pilot | read_only | clerk |
| get_title_chain | muse | read_only | clerk |
| explain_recording_fees | muse | read_only | clerk |
| record_document | pilot | write_high | clerk |
| release_lien | pilot | write_low | clerk |
| summarize_parcel_recordings | muse | read_only | clerk |

### TerraTreasury Vertical (7 tools) — R3.3
| Tool | Mode | Risk | officeScope |
|------|------|------|-------------|
| get_tax_statement | pilot | read_only | treasurer |
| explain_tax_breakdown | muse | read_only | treasurer |
| record_payment | pilot | write_low | treasurer |
| check_delinquency_status | pilot | read_only | treasurer |
| create_installment_plan | pilot | write_low | treasurer |
| summarize_collection_stats | muse | read_only | treasurer |
| initiate_tax_sale | pilot | write_high | treasurer |

### TerraAudit Vertical (5 tools) — R3.4
| Tool | Mode | Risk | officeScope |
|------|------|------|-------------|
| audit_roll_summary | muse | read_only | auditor |
| check_levy_compliance | pilot | read_only | auditor |
| submit_audit_finding | pilot | write_low | auditor |
| reconcile_cross_office | pilot | write_high | auditor |
| generate_compliance_report | muse | read_only | auditor |

---

## Acceptance Criteria (30/30 PASS)

### Handler Execution (18 tests)
| AC | Tool | Result |
|----|------|--------|
| AC-CLK-01 | record_document | ✅ Governed recording with correlationId |
| AC-CLK-02 | get_title_chain | ✅ Chronological chain for Benton County |
| AC-CLK-03 | release_lien | ✅ Lien release with confirmation + trace |
| AC-CLK-04 | search_recorded_documents | ✅ County isolation enforced |
| AC-CLK-05 | search_recorded_documents | ✅ Filtered search results |
| AC-CLK-06 | record_document | ✅ Write-high gate: reject sans confirmation, reject sans reason, manifest risk |
| AC-TRS-01 | get_tax_statement | ✅ Real levy components for Benton |
| AC-TRS-02 | record_payment | ✅ Payment + balance update + trace |
| AC-TRS-03 | check_delinquency_status | ✅ Real outstanding balances |
| AC-TRS-04 | create_installment_plan | ✅ Statutory-compliant plan |
| AC-TRS-05 | summarize_collection_stats | ✅ Collection rate + stats |
| AC-TRS-06 | initiate_tax_sale | ✅ Write-high gate enforced |
| AC-TRS-07 | (assessor + treasury) | ✅ Cross-office trace linking |
| AC-AUD-01 | audit_roll_summary | ✅ 89,247 parcels, 8,925 audited |
| AC-AUD-02 | check_levy_compliance | ✅ RCW 84.52/84.55 validation |
| AC-AUD-03 | submit_audit_finding | ✅ Finding + correlationId chain |
| AC-AUD-04 | reconcile_cross_office | ✅ Cross-office reconciliation + confirmation gate |
| AC-AUD-05 | generate_compliance_report | ✅ Report with compliance score |

### Cross-Cutting (3 tests)
| AC | Scope | Result |
|----|-------|--------|
| R3-ISO-TRS | Treasury county isolation | ✅ County context enforced |
| R3-ISO-AUD | Audit county isolation | ✅ County context enforced |
| R3-3CHAIN | Clerk→Treasury→Auditor chain | ✅ 3 distinct correlationIds, all with trace events |

### Confirmation Gates (6 tests)
| AC | Tool | Risk | Result |
|----|------|------|--------|
| AC-CLK-06a | record_document | write_high | ✅ CONFIRMATION_REQUIRED |
| AC-CLK-06b | record_document | write_high | ✅ REASON_CODE_REQUIRED |
| AC-TRS-06a | initiate_tax_sale | write_high | ✅ CONFIRMATION_REQUIRED |
| AC-TRS-06b | initiate_tax_sale | write_high | ✅ Succeeds with confirmation + reason |
| AC-AUD-04a | reconcile_cross_office | write_high | ✅ Succeeds with confirmation + reason |
| AC-AUD-04b | reconcile_cross_office | write_high | ✅ CONFIRMATION_REQUIRED |

### Manifest Contract (4 tests)
| AC | Scope | Result |
|----|-------|--------|
| officeScope-clerk | 6/6 clerk tools = clerk | ✅ |
| officeScope-treasurer | 7/7 treasury tools = treasurer | ✅ |
| officeScope-auditor | 5/5 audit tools = auditor | ✅ |
| officeScope-os | 3/3 OS tools = undefined | ✅ |

---

## Gate Results (local main — not CI-proven on origin/main)

| Gate | Local Result | CI Status |
|------|-------------|-----------|
| `pnpm run type-check` | ✅ Clean (0 errors) | ⏳ pending SEAL gate |
| `node --test phase83-tools.test.mjs` | ✅ 32/32 pass | ⏳ pending SEAL gate |
| `node --test r1-acceptance-criteria.test.mjs` | ✅ 84/84 pass | ⏳ pending SEAL gate |
| `node --test r3-acceptance-criteria.test.mjs` | ✅ 30/30 pass | ⏳ pending SEAL gate |
| `node --test r3-cx-acceptance-criteria.test.mjs` | ✅ 34/34 pass | ⏳ pending SEAL gate |
| `npx vitest run` | ✅ 920 pass (416 files) | ⏳ pending SEAL gate |
| `dotnet build TerraFusion.sln -c Release` | ✅ 0 errors, 0 warnings | ⏳ pending SEAL gate |

---

## Frontend Workbench Tabs (9 total)

| # | Tab | Component | Lines | Status |
|---|-----|-----------|-------|--------|
| 1 | Summary | PropertySummary.tsx | — | Live |
| 2 | Forge | PropertyForge.tsx | — | Live |
| 3 | Atlas | PropertyAtlas.tsx | — | Live |
| 4 | Dais | PropertyDais.tsx | — | Live |
| 5 | **Clerk** | PropertyClerk.tsx | 371 | **R3.2** |
| 6 | **Treasury** | PropertyTreasury.tsx | 454 | **R3.3** |
| 7 | **Audit** | PropertyAudit.tsx | 362 | **R3.4** |
| 8 | Dossier | PropertyDossier.tsx | — | Live |
| 9 | Pilot | PropertyPilot.tsx | — | Live |

All 9 tabs: visible in tab bar, routed via React Router, lazy-loaded via Suspense.
Constitutional test updated to assert 9 tabs (CC remediation).

---

## Architecture Artifacts

### Office Registry (os-platform/core/pilot/office-registry.ts)
- 5 office definitions: assessor, clerk, treasurer, auditor, recorder (reserved)
- Singleton `officeRegistry` export
- `getOffice()`, `getAllOffices()`, `isActiveOffice()` API

### RBAC Vocabulary (os-platform/core/pilot/ToolRunner.ts)
| Role | Claims |
|------|--------|
| clerk | read:parcel, read:dossier, write:clerk |
| treasurer | read:parcel, read:dossier, write:treasury |
| auditor | read:parcel, read:dossier, read:trace, write:audit, audit:all |
| administrator | (all claims including write:clerk, write:treasury, write:audit) |

### Manifest (tools/registry/terrapilot.tools.json)
- Version: 2.0.0
- Tools: 53
- All 50 office-scoped tools have `officeScope` field
- 3 OS tools (route_to_parcel, search_trace_by_correlation, request_trace_redaction) have no officeScope

### Suite Registry (frontend/apps/os-shell/src/config/suiteRegistry.ts)
- `WorkbenchTabId` includes: summary, forge, atlas, dais, clerk, treasury, audit, dossier, pilot
- Tab order locked per Constitution v1.0

---

## R3 Definition of Done — Status

> Legend: ✅ = implemented + tested locally | ⏳ = pending CI proof on origin/main

| Criterion | Local | CI |
|-----------|-------|----|
| 53+ governed tools with real handlers | ✅ 53 tools | ⏳ |
| All 8 TerraDais modules active | ✅ All active | ⏳ |
| 6 constitutional CI gates enforced | ✅ type-check, phase83, R1, R3, vitest | ⏳ |
| Office registry enables multi-office switching | ✅ 5 offices | ⏳ |
| TerraClerk: 6 tools + PropertyClerk tab | ✅ Complete | ⏳ |
| TerraTreasury: 7 tools + PropertyTreasury tab | ✅ Complete | ⏳ |
| TerraAudit: 5 tools + PropertyAudit tab | ✅ Complete | ⏳ |
| Property Workbench displays 9 tabs | ✅ Visible + routed | ⏳ |
| Constitutional test matches 9-tab surface | ✅ CC remediation applied | ⏳ |
| Cross-office trace linked by correlationId | ✅ AC-TRS-07 + 3-office chain | ⏳ |
| County isolation per office | ✅ CLK-04 + R3-ISO-TRS + R3-ISO-AUD | ⏳ |
| All permanent gates pass | ✅ Local green | ⏳ SEAL gate not run |
| 18+ new acceptance criteria | ✅ 30 tests passing | ⏳ |
| No stubs/mocks in production surface | ✅ All real handlers | ⏳ |
| Backend controllers (CX lane) | ✅ 3 controllers, 18 endpoints, 10 entities | ⏳ |

---

## CX Lane Delivery — Backend API Controllers

### Controllers Created

| Controller | Route | Endpoints | Entities |
|-----------|-------|-----------|----------|
| `ClerkController.cs` | `api/clerk` | 6 | ClerkDocument, TitleChainEntry, ClerkLien |
| `TreasuryController.cs` | `api/treasury` | 7 | TaxStatement, TaxPayment, DelinquencyRecord, InstallmentPlan, TaxSale |
| `AuditController.cs` | `api/audit` | 5 | AuditFinding, AuditReconciliation |

### Endpoint Map (18 total)

**Clerk (6):**
- `GET /api/clerk/documents` — search recorded documents
- `GET /api/clerk/parcels/{id}/title-chain` — title chain query
- `GET /api/clerk/fees` — Benton County recording fee schedule (AllowAnonymous)
- `POST /api/clerk/documents` — record document
- `POST /api/clerk/liens/{id}/release` — release lien
- `GET /api/clerk/parcels/{id}/recordings/summary` — parcel recording summary

**Treasury (7):**
- `GET /api/treasury/parcels/{id}/statement` — tax statement
- `GET /api/treasury/parcels/{id}/breakdown` — levy breakdown
- `POST /api/treasury/parcels/{id}/payments` — record payment
- `GET /api/treasury/parcels/{id}/delinquency` — delinquency status
- `POST /api/treasury/parcels/{id}/installment-plans` — create installment plan
- `GET /api/treasury/collection-stats` — collection statistics
- `POST /api/treasury/parcels/{id}/tax-sale` — initiate tax sale

**Audit (5):**
- `GET /api/audit/roll-summary` — roll audit summary
- `GET /api/audit/levy-compliance` — RCW 84.52/84.55 compliance check
- `POST /api/audit/findings` — submit audit finding
- `POST /api/audit/reconciliation` — cross-office reconciliation
- `GET /api/audit/compliance-report` — compliance report

### Security Pattern (All Controllers)
- `[Authorize]` attribute on all controller classes
- `ResolveCountyIdAsync()` county isolation on every endpoint
- `AsNoTracking()` for all read queries
- County-scoped indices on all entities (unique constraints include CountyId)

### Static Data
- **Clerk**: `BentonRecordingFees` — 11 document types per RCW 36.18.010
- **Treasury**: `BentonLevyData` — 9 levy components (Benton County avg mill rate ~$10.80/$1000)
- **Audit**: 3 statutory compliance rules per RCW 84.52/84.55

### CX Acceptance Tests (34/34 PASS)

| Suite | Tests | Content |
|-------|-------|---------|
| Clerk Endpoint Wiring | 6 | Handler→URL contract for all 6 clerk endpoints |
| Treasury Endpoint Wiring | 4 | Handler→URL contract for treasury endpoints |
| Audit Endpoint Wiring | 5 | Handler→URL contract for all 5 audit endpoints |
| Controller Manifest | 7 | File existence + DbSet registration |
| Security: County Isolation | 12 | [Authorize], ResolveCountyIdAsync, route, AsNoTracking per controller |

---

## Evidence Chain (local refs only — not on origin/main)

```
r2.8.0 (55d6baffa) — R2 complete: 26 tools, 23/23 workbench
  └── r3.0.0 (a581ae2d0) — R3 multi-office: 53 tools, v2.0.0, 9 tabs       [local]
       └── r3.1.0 (00eed894b) — office registry, RBAC, officeScope, 27 ACs  [local]
            └── r3.2.0 (bfa315b9e) — cross-office trace, isolation, 30 ACs  [local]
                 └── r3.3.0 (012f7fe3a) — CX lane: 3 controllers, 34 CX ACs [local]
```

---

**Government. Transcended.**
