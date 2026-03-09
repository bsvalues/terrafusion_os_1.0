# R3 Multi-Agent Execution Plan

Date: March 8, 2026
Baseline: `r2.8.0` tag at `55d6baffa` on `main`
Purpose: Define the end-to-end buildout of TerraFusion OS from a single-vertical
Assessor platform to a multi-office municipal operating system, executed across
three coordinated AI agent lanes.

---

## Executive Summary

R1 proved the governed architecture. R2 extracted real domain depth for the Assessor
vertical. R3 is the OS expansion phase — it takes the proven governance spine and
extends it across four reserved county office verticals while simultaneously hardening
the Assessor foundation with the remaining TerraDais modules.

**The mission: "Government. Transcended." is not one office. It's the entire county.**

---

## What R2 Delivered (Baseline)

| Metric | Value |
|--------|-------|
| Release tags | r1.0.0 → r1.1.0 → r2.1.0 → r2.2.0 → r2.3.0 → r2.4.0 → r2.5.0 → r2.6.0 → r2.7.0 → r2.8.0 |
| Governed tools | 26 real handlers (all stubs eliminated) |
| Workbench tool coverage | 23/23 (100%) — all tools wired to UI surfaces |
| Backend controllers | 7 primary suite controllers, 120+ real endpoints, zero 501 stubs |
| Frontend tabs | 6 canonical (Summary, Forge, Atlas, Dais, Dossier, Pilot) |
| Core test files | 50+ test files, 500+ individual test cases |
| Vitest | 164 passing |
| Acceptance criteria | 84/84 (AC-1 → AC-31 + R2 DoD-1 → DoD-6) |
| CI gates | type-check ✅, phase83 32/32 ✅, phase85 20/20 ✅, phase86 7/7 ✅ |
| Backend build | 0 errors |

### Active Suites (R2 Closure State)

| Suite | ID | Tools | Backend Endpoints | Frontend Tab | Status |
|-------|----|-------|-------------------|-------------|--------|
| TerraForge | `forge` | 8 | 22 (CostForge) | PropertyForge | **Complete** |
| TerraAtlas | `atlas` | 1 | 25 (Atlas) | PropertyAtlas | **Complete** |
| TerraDais | `dais` | 10 | 20 (Dais) | PropertyDais | **Complete** |
| TerraDossier | `dossier` | 4 | 35+ (Dossier) | PropertyDossier | **Complete** |
| TerraGPT | `gpt` | — | — | PropertyPilot | **Integrated via Pilot** |
| **OS** | `os` | 3 | — | — | **Complete** |

### Reserved Suites (R3 Targets)

| Suite | ID | County Office | Status |
|-------|----|---------------|--------|
| TerraClerk | `clerk` | County Clerk | Reserved — no code |
| TerraTreasury | `treasury` | County Treasurer | Reserved — no code |
| TerraAudit | `audit` | County Auditor | Reserved — no code |
| TerraRecorder | `recorder` | County Recorder | Reserved — no code (optional) |

---

## R3 Boundary

R2 proved the full Assessor vertical. R3 has four parallel objectives:

1. **Harden** — Complete the 5 remaining TerraDais modules (terra-exempt, terra-appeal,
   terra-cert, terra-notice, terra-queue)
2. **Extend** — Wire the first non-Assessor vertical (TerraClerk or TerraTreasury)
3. **Scale** — Prove multi-office property workbench with cross-suite tab expansion
4. **Gate** — Enable all 6 constitutional CI gates from spec v3.1

What R3 is NOT:
- Not a rebuild (spine is proven — extend it)
- Not speculative (reserved names and write lanes are defined in the Constitution)
- Not a UI experiment (BentoGrid/BentoCard design system is locked from R2)

---

## Method

Same discipline as R1/R2:

1. Extract domain logic from existing sources (county clerk docs, treasury regs, etc.)
2. Wire governed tools with the proven ToolRunner + handlers.real.ts pattern
3. Expose through workbench surfaces using the same BentoCard component model
4. Gate every release with evidence discipline (correlationId traces, acceptance criteria)
5. Multi-agent coordination: CX builds backend, CP writes contracts + gates, CC wires frontend

### Permanent Gates (Inherited from R2 — Non-Negotiable)

```bash
pnpm run type-check                                           # Zero errors
node --test os-platform/core/tests/phase83-tools.test.mjs    # 32+ pass (grows)
node --test os-platform/core/tests/r1-acceptance-criteria.test.mjs  # 84+ pass (grows)
pnpm -w run r1:verify-evidence                                # SHA verified
dotnet build backend/TerraFusion.sln -c Release               # Zero errors
pnpm vitest run                                                # 164+ pass (grows)
```

---

## Three-Lane Agent Model

### Lane Ownership (Same Protocol as R1/R2)

| Lane | Agent | Owns | Delivers |
|------|-------|------|----------|
| **CX** | Codex | Backend extraction, domain services, endpoint creation | Stable backend contracts with auth + county isolation |
| **CP** | Copilot | Contract freeze, handler wiring, proof harness, acceptance criteria | Governed tools, proof tests, evidence packets |
| **CC** | Claude | Frontend surface exposure, UX for new domains, test coverage | Workbench tabs, BentoCard surfaces, vitest coverage |

### Handoff Protocol

```
CX extracts → publishes stable endpoint → signals "backend-ready"
CP freezes contract → writes proof test → registers handler → signals "handler-ready"
CC wires frontend → writes vitest → signals "surface-ready"
All three: gates pass → tag → evidence → ship
```

No agent ships code that depends on another agent's work without the prerequisite
signal being true and verified by gate passage.

---

## Phase R2.9 — Assessor Hardening (Weeks 1–4)

### Objective

Complete the 5 remaining TerraDais modules that are defined in the Suite Constitution
but not yet implemented. This fills the operational gap in the Assessor vertical before
extending to other offices.

### TerraDais Module Inventory

| Module | Display Name | Status at R2.8 | R2.9 Target |
|--------|-------------|-----------------|-------------|
| `terra-levy` | TerraLevy | ✅ Active (real) | — |
| `terra-pilt` | TerraPILT | ✅ Active (real) | — |
| `terra-permit` | TerraPermit | ✅ Active (real) | — |
| `terra-exempt` | TerraExempt | ❌ Planned | **Build** |
| `terra-appeal` | TerraAppeal | ❌ Planned | **Build** |
| `terra-cert` | TerraCert | ❌ Planned | **Build** |
| `terra-notice` | TerraNotice | ❌ Planned | **Build** |
| `terra-queue` | TerraQueue | ❌ Planned | **Build** |

### R2.9-W1: TerraExempt — Senior/Disabled Exemption Management

**Domain:** RCW 84.36.381 exemptions — senior citizen, disabled person, surviving
spouse property tax relief. Benton County currently processes ~2,400 active exemptions.

**CX — Backend:**
- `POST /api/dais/exemptions/apply` — new exemption application
- `GET /api/dais/exemptions/{parcelId}` — current exemption status
- `PUT /api/dais/exemptions/{exemptionId}/renew` — annual renewal
- `GET /api/dais/exemptions/expiring?daysAhead=90` — upcoming renewals
- `POST /api/dais/exemptions/{exemptionId}/documents` — supporting doc upload
- Income threshold validation per RCW (currently $40,000 disposable income cap)

**CP — Tools:**
- New governed tool: `check_exemption_eligibility` (read_only, dais)
  — params: `{ county, parcelId, applicantAge?, income?, disability? }`
  — returns: `{ eligible, reason, exemptionType, estimatedRelief }`
- New governed tool: `process_exemption_renewal` (write_low, dais)
  — params: `{ county, exemptionId, taxYear, documentation[] }`
  — returns: `{ renewed, newExpiry, payloadRef }`
- Extend `explain_senior_exemption_impact` (already exists) with real RCW math

**CC — Frontend:**
- New BentoCard in PropertyDais.tsx: "Exemption Status" card
- Renewal workflow UI with document upload
- Eligibility checker integrated with `check_exemption_eligibility` tool

**Gate:** Exemption eligibility for known Benton County parcel produces RCW-compliant result.

### R2.9-W2: TerraAppeal — BOE/Appeal Management

**Domain:** Board of Equalization appeal lifecycle. Benton County processes ~150 appeals
per assessment cycle.

**CX — Backend:**
- `POST /api/dais/appeals/file` — file new appeal
- `GET /api/dais/appeals/{appealId}` — appeal detail with timeline
- `PUT /api/dais/appeals/{appealId}/schedule-hearing` — hearing scheduling (write_high)
- `GET /api/dais/appeals/calendar?month={month}` — hearing calendar
- `POST /api/dais/appeals/{appealId}/decision` — record BOE decision (write_high)
- `GET /api/dais/appeals/statistics?taxYear={year}` — appeal stats/trends
- Deadline tracking: 30-day response window, statutory hearing deadlines

**CP — Tools:**
- New governed tool: `file_appeal` (write_low, dais)
  — params: `{ county, parcelId, petitionerName, grounds, requestedValue }`
  — returns: `{ appealId, docketNumber, deadlines, payloadRef }`
- New governed tool: `schedule_boe_hearing` (write_high, dais)
  — params: `{ county, appealId, requestedDate, panelMembers[] }`
  — returns: `{ hearingId, confirmedDate, room, payloadRef }`
- Extend `assemble_boe_packet` + `draft_boe_appeal_response` with real appeal lifecycle

**CC — Frontend:**
- New BentoCard in PropertyDais.tsx: "Appeal Status" card with timeline visualization
- Hearing calendar view
- BOE packet assembly UI (links to existing `assemble_boe_packet` tool)

**Gate:** Appeal filed for Benton County parcel → hearing scheduled → decision recorded with full trace.

### R2.9-W3: TerraCert — Roll Certification

**Domain:** Annual assessment roll certification. Benton County certifies ~89,247 parcels.

**CX — Backend:**
- `GET /api/dais/certification/checklist/{county}/{taxYear}` — certification steps
- `POST /api/dais/certification/sign-off` — step sign-off (write_high)
- `GET /api/dais/certification/progress/{county}/{taxYear}` — progress dashboard
- `POST /api/dais/certification/finalize` — finalize roll (irreversible)
- `GET /api/dais/certification/history` — prior year certifications
- Statutory deadline enforcement per RCW 84.48

**CP — Tools:**
- New governed tool: `get_certification_progress` (read_only, dais)
  — params: `{ county, taxYear }`
  — returns: `{ steps[], completedCount, totalCount, blockers[], deadline }`
- New governed tool: `sign_off_certification_step` (write_high, dais)
  — params: `{ county, taxYear, stepId, signedBy, notes }`
  — returns: `{ stepId, status, remainingSteps, payloadRef }`
- Extend `check_cert_status` (already exists) with real checklist backend

**CC — Frontend:**
- New BentoCard in PropertyDais.tsx: "Certification Progress" card
- Checklist visualization with step-by-step sign-off
- Progress dashboard with county-wide roll statistics

**Gate:** Certification progress for Benton County 2026 returns real checklist with sign-off tracking.

### R2.9-W4: TerraNotice — Notice Generation

**Domain:** Assessment change notices, value change letters, personal property notices.
Benton County sends ~30,000 notices per assessment cycle.

**CX — Backend:**
- `POST /api/dais/notices/generate` — generate notice from template
- `GET /api/dais/notices/templates` — available templates
- `POST /api/dais/notices/batch-generate` — batch generation for bulk mail
- `GET /api/dais/notices/{noticeId}` — single notice retrieval
- `POST /api/dais/notices/queue` — add to mail queue
- `GET /api/dais/notices/queue/status` — mail queue status
- Template engine with variable interpolation (parcel data, values, dates)

**CP — Tools:**
- Extend `draft_notice` (already exists) with real template engine
- Extend `draft_value_change_notice` (already exists) with batch support
- New governed tool: `queue_notice_for_mailing` (write_low, dais)
  — params: `{ county, noticeIds[], deliveryMethod }`
  — returns: `{ queuedCount, estimatedMailDate, batchId }`

**CC — Frontend:**
- New BentoCard in PropertyDais.tsx: "Notice Queue" card
- Template preview and batch generation UI
- Mail queue status dashboard

**Gate:** Value change notice generated for Benton County parcel → queued → batch status tracked.

### R2.9-W5: TerraQueue — Task/SLA Management

**Domain:** Assessor office task routing, SLA tracking, workload distribution across
staff. Benton County Assessor's office has ~15 staff with varied specializations.

**CX — Backend:**
- `GET /api/dais/queue/tasks` — task list with filters (status, assignee, priority)
- `POST /api/dais/queue/tasks` — create task
- `PUT /api/dais/queue/tasks/{taskId}/assign` — assign/reassign
- `PUT /api/dais/queue/tasks/{taskId}/status` — update status
- `GET /api/dais/queue/sla-report` — SLA compliance report
- `GET /api/dais/queue/workload` — workload distribution by assignee
- SLA engine: configurable deadlines per task type, escalation rules

**CP — Tools:**
- Extend `assign_task` (already exists) with real queue backend
- New governed tool: `get_queue_statistics` (read_only, dais)
  — params: `{ county, period?, assignee? }`
  — returns: `{ totalTasks, byStatus, slaBreach[], avgCompletionDays }`
- New governed tool: `escalate_task` (write_low, dais)
  — params: `{ county, taskId, reason, escalateTo }`
  — returns: `{ escalated, newPriority, payloadRef }`

**CC — Frontend:**
- New BentoCard in PropertyDais.tsx: "Task Queue" card
- Workload heat map visualization
- SLA breach alerts

**Gate:** Task created → assigned → SLA tracked → escalated when overdue.

### R2.9 Release Cadence

| Tag | Content | Target |
|-----|---------|--------|
| `r2.9.1` | TerraExempt — exemption management | Week 1 |
| `r2.9.2` | TerraAppeal — BOE/appeal lifecycle | Week 2 |
| `r2.9.3` | TerraCert — roll certification | Week 2.5 |
| `r2.9.4` | TerraNotice — notice generation + queue | Week 3 |
| `r2.9.5` | TerraQueue — task/SLA management | Week 4 |
| `r2.10.0` | Assessor vertical complete — all 8 TerraDais modules active | Week 4 |

### R2.9 New Tool Summary

| Tool | Suite | Risk | Wave |
|------|-------|------|------|
| `check_exemption_eligibility` | dais | read_only | W1 |
| `process_exemption_renewal` | dais | write_low | W1 |
| `file_appeal` | dais | write_low | W2 |
| `schedule_boe_hearing` | dais | write_high | W2 |
| `get_certification_progress` | dais | read_only | W3 |
| `sign_off_certification_step` | dais | write_high | W3 |
| `queue_notice_for_mailing` | dais | write_low | W4 |
| `get_queue_statistics` | dais | read_only | W5 |
| `escalate_task` | dais | write_low | W5 |

Target: 26 → **35 governed tools** by r2.10.0.

---

## Phase R3.0 — Constitutional Gate Enforcement (Week 5)

### Objective

Enable all 6 CI gates specified in the Suite Constitution v3.1 and verified in
`docs/TerraFusion_Spec_Package_v3_1_flat/07_CI_CD_GATES_v1.md`.

### Gate Inventory

| Gate | Current State | R3.0 Target |
|------|---------------|-------------|
| Gate 1: Naming Lint | ⚠️ Informal | **CI-enforced** — reject `Tara*`, spacing variants |
| Gate 2: Workbench Extension Compliance | ⚠️ Manual | **CI-enforced** — WorkbenchContribution interface |
| Gate 3: Write-Lane Assertions | ⚠️ Manual | **CI-enforced** — tools declare `writesTo` |
| Gate 4: TerraTrace Immutability | ✅ Tested | **CI-enforced** — invoke+result events required |
| Gate 5: Risk Policy Enforcement | ✅ Tested | **CI-enforced** — write_high/irreversible validation |
| Gate 6: PII Sanitization | ✅ Tested | **CI-enforced** — no SSN/phone/email in trace |

### Lane Assignments

**CP — Contract + Gate Wiring:**
- Write CI gate scripts in `os-platform/core/gates/`
- Add gate tests to `phase83-tools.test.mjs` or new gate-specific test files
- Wire into SEAL gate workflow (`.github/workflows/seal-gate.yml`)

**CX — Backend Compliance:**
- Ensure all new controllers comply with naming, write-lane, and trace requirements
- Add `writesTo` declarations to all tool definitions in manifest

**CC — Frontend Compliance:**
- Ensure all workbench tab components implement `WorkbenchContribution` interface
- Add naming lint to frontend build pipeline

**Gate:** SEAL workflow rejects PR that introduces a `Tara*` name, missing `writesTo`,
or trace payload containing PII patterns.

### Release

| Tag | Content |
|-----|---------|
| `r3.0.0` | All 6 constitutional gates enforced in CI |

---

## Phase R3.1 — Multi-Office Foundation (Weeks 6–8)

### Objective

Build the OS-level plumbing that enables multiple county offices to share the platform.
This is infrastructure work — not vertical-specific.

### R3.1-INFRA-01: Office Registry

**CX — Backend:**
- `os-platform/core/types/office-registry.ts` — office definitions with IDs, display names, and permissions
- `GET /api/os/offices` — available offices for county
- `GET /api/os/offices/{officeId}/staff` — staff roster for office
- Office-scoped RBAC: users belong to one or more offices, tool allowlists vary by office

```typescript
interface OfficeDefinition {
  id: string;        // 'assessor' | 'clerk' | 'treasurer' | 'auditor' | 'recorder'
  displayName: string;
  suiteId: string;   // Maps to suite registry
  status: 'active' | 'reserved' | 'planned';
  toolAllowlist: string[];  // Governed tools available to this office
}
```

**CP — Contract:**
- Extend tool manifest with `officeScope` field per tool
- Office-scoped tool discovery: `GET /pilot/tools?office={officeId}`
- Acceptance criteria: tools for one office cannot execute in another office's context

**CC — Frontend:**
- Office switcher in Shell navigation (desktop taskbar)
- Suite launcher filtered by active office
- Workbench tab set changes based on office context

### R3.1-INFRA-02: Cross-Office Property Context

**Concept:** A single parcel may have data relevant to multiple offices (Assessor sets
value, Treasurer collects taxes, Clerk records deeds, Auditor audits the roll).

**CX — Backend:**
- `GET /api/properties/{parcelId}/offices` — which offices have data for this parcel
- Cross-office badge contributions: each office can contribute badges to the Context Ribbon
- Write-lane enforcement remains strict: each office owns its data lane

**CP — Contract:**
- Extend `WorkbenchContribution` interface with `officeId` field
- Badge contributions scoped to office ownership
- Trace events include `officeId` in event metadata

**CC — Frontend:**
- Property Workbench tab order dynamically includes tabs for active offices
- Tab order per Constitution: Summary → Forge → Atlas → Dais → **Clerk** → **Treasury** → **Auditor** → Dossier → Pilot
- Inactive office tabs hidden (not grayed)

### R3.1-INFRA-03: Multi-Office Trace

**CX — Backend:**
- TerraTrace gains `officeId` field on all events
- Cross-office correlation: a parcel transaction that touches Assessor + Treasurer
  generates linked events with shared `correlationId`
- Office-scoped trace queries: `GET /pilot/trace?officeId={officeId}`

**CP — Contract:**
- Extend trace event schema with `officeId: string`
- New acceptance criteria: office-scoped trace isolation
- Trace immutability holds across offices

### Release

| Tag | Content |
|-----|---------|
| `r3.1.0` | Office registry, cross-office property context, multi-office trace |

---

## Phase R3.2 — TerraClerk (County Clerk) (Weeks 9–14)

### Objective

First non-Assessor vertical. The County Clerk office manages public records, elections,
and licensing. The parcel-related scope is recording deeds, liens, and title documents.

### Domain Analysis

**Benton County Clerk primary functions:**
- Real property recording (deeds, liens, mortgages, easements)
- Marriage licenses and vital records
- Superior Court clerk services
- Elections administration

**Parcel-relevant scope (R3.2):**
- Deed recording and indexing
- Lien recording and release
- Title search and chain of title
- Document recording fees
- Grantor/grantee indexing

Non-parcel functions (elections, vital records, court) are **out of scope** for R3.2
but reserved for R4+.

### Write Lane (from Constitution)

| Domain Artifact | Write Owner |
|-----------------|-------------|
| Recorded documents (deeds, liens) | TerraClerk |
| Recording fees and receipts | TerraClerk |
| Grantor/grantee index | TerraClerk |
| Title chain of custody | TerraClerk |

### R3.2-CLK-01: Recording Backend

**CX — Backend:**
- New controller: `ClerkController.cs`
- `POST /api/clerk/documents/record` — record a document
- `GET /api/clerk/documents/{documentId}` — retrieve recorded document
- `GET /api/clerk/documents/search` — search by grantor/grantee/parcel
- `GET /api/clerk/parcels/{parcelId}/recordings` — all recordings for parcel
- `POST /api/clerk/documents/{documentId}/index` — index document
- `GET /api/clerk/fees/schedule` — recording fee schedule
- `POST /api/clerk/documents/{documentId}/certify` — clerk certification (write_high)
- All endpoints: county-isolated, authenticated, correlation-tracked

### R3.2-CLK-02: Chain of Title

**CX — Backend:**
- `GET /api/clerk/parcels/{parcelId}/title-chain` — chain of title
- `GET /api/clerk/parcels/{parcelId}/liens` — active liens
- `POST /api/clerk/liens/{lienId}/release` — lien release (write_low)
- SHA-256 integrity chain for recording sequence

### R3.2-CLK-03: Governed Tools

**CP — Tools (new manifest entries):**

| Tool | Suite | Mode | Risk | Description |
|------|-------|------|------|-------------|
| `search_recorded_documents` | clerk | pilot | read_only | Search clerk recordings by parcel, grantor, grantee |
| `get_title_chain` | clerk | muse | read_only | Chain of title for a parcel |
| `explain_recording_fees` | clerk | muse | read_only | Fee schedule explanation |
| `record_document` | clerk | pilot | write_high | Record a new document |
| `release_lien` | clerk | pilot | write_low | Release an existing lien |
| `summarize_parcel_recordings` | clerk | muse | read_only | Summary of all recordings for parcel |

**Handler wiring:** Same pattern as R2 — real handlers in `handlers.real.ts` calling
`ClerkController` endpoints.

### R3.2-CLK-04: Frontend

**CC — Frontend:**
- New workbench tab: `PropertyClerk.tsx` at `/property/:parcelId/clerk`
- Register `clerk` tab in `suiteRegistry.ts` with `workbenchTab: true`
- Tab placement: after Dais, before Treasury (per Constitution tab order)
- BentoCard components:
  - "Recent Recordings" — latest deeds/liens for parcel
  - "Chain of Title" — chronological title history
  - "Active Liens" — current liens with release actions
  - "Record Document" — recording workflow (write_high with confirmation)
  - "Fee Calculator" — recording fee estimation
  - "Recording Search" — grantor/grantee search

### R3.2 Release Cadence

| Tag | Content |
|-----|---------|
| `r3.2.1` | ClerkController + recording backend | 
| `r3.2.2` | Chain of title + lien management |
| `r3.2.3` | 6 governed clerk tools + handlers |
| `r3.2.4` | PropertyClerk workbench tab |
| `r3.2.0` | TerraClerk vertical complete |

### R3.2 Acceptance Criteria

- AC-CLK-01: Governed document recording via `record_document` tool → trace with correlationId
- AC-CLK-02: Chain of title returns chronological ownership for Benton County parcel
- AC-CLK-03: Lien release via `release_lien` tool → original lien marked released → trace
- AC-CLK-04: County isolation: Clerk data for county A invisible to county B
- AC-CLK-05: Recording search returns results filtered by county context
- AC-CLK-06: Write-high confirmation gate enforced on `record_document` and clerk certification

---

## Phase R3.3 — TerraTreasury (County Treasurer) (Weeks 15–20)

### Objective

Second non-Assessor vertical. The County Treasurer collects and distributes property
taxes, manages tax sales, and handles payment processing.

### Domain Analysis

**Benton County Treasurer primary functions:**
- Property tax collection (levy → bill → collect → distribute)
- Tax statement generation
- Delinquency management and tax sales
- Investment of county funds
- Receipt and disbursement of all county funds

**Parcel-relevant scope (R3.3):**
- Tax statement generation and delivery
- Payment recording and receipts
- Delinquency tracking and installment plans
- Tax sale/lien sale management
- Tax distribution to taxing districts

Non-parcel functions (investment management, general fund) are **out of scope** for R3.3.

### Write Lane (from Constitution)

| Domain Artifact | Write Owner |
|-----------------|-------------|
| Tax statements | TerraTreasury |
| Payment records | TerraTreasury |
| Delinquency status | TerraTreasury |
| Tax sale records | TerraTreasury |
| Distribution records | TerraTreasury |

### R3.3-TRS-01: Tax Collection Backend

**CX — Backend:**
- New controller: `TreasuryController.cs`
- `GET /api/treasury/parcels/{parcelId}/statement` — tax statement for parcel
- `GET /api/treasury/parcels/{parcelId}/payments` — payment history
- `POST /api/treasury/parcels/{parcelId}/payment` — record payment (write_low)
- `GET /api/treasury/parcels/{parcelId}/balance` — current balance
- `GET /api/treasury/delinquent?county={county}` — delinquent parcels
- `POST /api/treasury/parcels/{parcelId}/installment-plan` — create installment plan (write_low)
- `GET /api/treasury/distribution/{taxYear}` — tax distribution to districts

### R3.3-TRS-02: Tax Sale Management

**CX — Backend:**
- `GET /api/treasury/tax-sales?county={county}&year={year}` — tax sale inventory
- `POST /api/treasury/tax-sales/{parcelId}/initiate` — initiate tax sale process (write_high)
- `GET /api/treasury/tax-sales/{saleId}` — sale detail
- `POST /api/treasury/tax-sales/{saleId}/redeem` — redemption (write_low)
- Statutory deadline tracking per RCW 84.64

### R3.3-TRS-03: Governed Tools

**CP — Tools:**

| Tool | Suite | Mode | Risk | Description |
|------|-------|------|------|-------------|
| `get_tax_statement` | treasury | pilot | read_only | Current tax statement for parcel |
| `explain_tax_breakdown` | treasury | muse | read_only | Explain levy components on statement |
| `record_payment` | treasury | pilot | write_low | Record tax payment |
| `check_delinquency_status` | treasury | pilot | read_only | Delinquency status and deadlines |
| `create_installment_plan` | treasury | pilot | write_low | Create payment plan |
| `summarize_collection_stats` | treasury | muse | read_only | Collection statistics for county |
| `initiate_tax_sale` | treasury | pilot | write_high | Start tax sale (statutory process) |

### R3.3-TRS-04: Frontend

**CC — Frontend:**
- New workbench tab: `PropertyTreasury.tsx` at `/property/:parcelId/treasury`
- Register `treasury` tab in `suiteRegistry.ts`
- Tab placement: after Clerk, before Auditor (per Constitution)
- BentoCard components:
  - "Tax Statement" — current year statement with levy breakdown
  - "Payment History" — chronological payment record
  - "Balance Due" — real-time balance with payment action
  - "Delinquency Alert" — status with deadline tracking
  - "Tax Distribution" — how payments flow to districts
  - "Tax Sale Status" — if applicable, sale timeline

### R3.3 Release Cadence

| Tag | Content |
|-----|---------|
| `r3.3.1` | TreasuryController + tax collection backend |
| `r3.3.2` | Tax sale management |
| `r3.3.3` | 7 governed treasury tools + handlers |
| `r3.3.4` | PropertyTreasury workbench tab |
| `r3.3.0` | TerraTreasury vertical complete |

### R3.3 Acceptance Criteria

- AC-TRS-01: Tax statement for Benton County parcel returns real levy components
- AC-TRS-02: Payment recorded via `record_payment` tool → balance updates → trace
- AC-TRS-03: Delinquency status reflects real outstanding balances
- AC-TRS-04: Installment plan created with statutory-compliant terms
- AC-TRS-05: Tax distribution calculation matches levy rate components
- AC-TRS-06: Write-high confirmation enforced on `initiate_tax_sale`
- AC-TRS-07: Cross-office trace: Assessor value change → Treasury statement update linked by correlationId

---

## Phase R3.4 — TerraAudit (County Auditor) (Weeks 21–26)

### Objective

Third non-Assessor vertical. The County Auditor verifies financial records, audits
the assessment roll, and ensures statutory compliance.

### Domain Analysis

**Benton County Auditor primary functions:**
- Financial audit of county offices
- Assessment roll audit (interface with Assessor)
- Budget review and compliance
- Claims processing and warrants
- Payroll administration

**Parcel-relevant scope (R3.4):**
- Assessment roll audit (value verification)
- Levy limit compliance auditing
- Cross-office financial reconciliation
- Compliance reporting

### Write Lane (from Constitution)

| Domain Artifact | Write Owner |
|-----------------|-------------|
| Audit findings | TerraAudit |
| Compliance reports | TerraAudit |
| Audit checklists | TerraAudit |
| Financial reconciliation records | TerraAudit |

### R3.4-AUD-01: Audit Backend

**CX — Backend:**
- New controller: `AuditController.cs`
- `GET /api/audit/roll/{county}/{taxYear}` — roll audit status
- `POST /api/audit/roll/{county}/{taxYear}/findings` — submit audit finding (write_low)
- `GET /api/audit/compliance/{county}` — compliance dashboard
- `GET /api/audit/levy-limits/{county}/{taxYear}` — levy limit audit
- `POST /api/audit/reconcile` — cross-office reconciliation (write_high)
- `GET /api/audit/report/{auditId}` — audit report

### R3.4-AUD-02: Governed Tools

**CP — Tools:**

| Tool | Suite | Mode | Risk | Description |
|------|-------|------|------|-------------|
| `audit_roll_summary` | audit | muse | read_only | Summarize assessment roll audit |
| `check_levy_compliance` | audit | pilot | read_only | Levy limit compliance check |
| `submit_audit_finding` | audit | pilot | write_low | Submit a finding |
| `reconcile_cross_office` | audit | pilot | write_high | Cross-office financial reconciliation |
| `generate_compliance_report` | audit | muse | read_only | Generate compliance report |

### R3.4-AUD-03: Frontend

**CC — Frontend:**
- New workbench tab: `PropertyAudit.tsx` at `/property/:parcelId/audit`
- Register `audit` tab in `suiteRegistry.ts`
- Tab placement: after Treasury, before Dossier (per Constitution)
- BentoCard components:
  - "Roll Audit Status" — assessment roll verification
  - "Value Audit" — compare assessed value against audit findings
  - "Levy Compliance" — levy limit compliance for parcel's districts
  - "Audit Trail" — TerraTrace projection (read-only, ALL offices)
  - "Compliance Dashboard" — county-wide compliance metrics

### R3.4 Release Cadence

| Tag | Content |
|-----|---------|
| `r3.4.1` | AuditController + roll audit backend |
| `r3.4.2` | 5 governed audit tools + handlers |
| `r3.4.3` | PropertyAudit workbench tab |
| `r3.4.0` | TerraAudit vertical complete |

### R3.4 Acceptance Criteria

- AC-AUD-01: Roll audit summary for Benton County returns real parcel statistics
- AC-AUD-02: Levy compliance check validates against RCW 84.52/84.55 limits
- AC-AUD-03: Audit finding submitted → linked to parcel → trace evidence
- AC-AUD-04: Cross-office reconciliation links Assessor values to Treasurer collections
- AC-AUD-05: Compliance report generation with correlationId chain

---

## Phase R3.5 — TerraRecorder (Optional) (Weeks 27–30)

### Note

TerraRecorder is marked "optional" in the Suite Constitution. The County Recorder
function in many Washington counties overlaps with the County Clerk (same office in
some counties). This phase executes only if Benton County maintains a separate Recorder
function. If Recorder ⊂ Clerk, merge Recorder scope into the existing TerraClerk surfaces.

### Domain (if separate)

- Real property recording (may already be in Clerk)
- Survey and plat recording
- UCC filings
- Map and boundary recording

### Decision Gate

Before R3.5 begins, verify with county stakeholders:
- Is Recorder a separate office in Benton County? → If yes, build R3.5
- Is Recorder merged with Clerk? → If yes, extend TerraClerk in a patch release

---

## R3 Tool Progression Summary

| Phase | New Tools | Running Total |
|-------|-----------|---------------|
| R2.8.0 (current) | — | 26 |
| R2.9 (Assessor hardening) | 9 | **35** |
| R3.0 (Gates) | 0 | 35 |
| R3.1 (Multi-office infra) | 0 | 35 |
| R3.2 (TerraClerk) | 6 | **41** |
| R3.3 (TerraTreasury) | 7 | **48** |
| R3.4 (TerraAudit) | 5 | **53** |
| R3.5 (TerraRecorder) | TBD | **53+** |

---

## R3 Release Tag Progression

| Tag | Content | Milestone |
|-----|---------|-----------|
| `r2.8.0` | **CURRENT** — 23/23 workbench, 26 tools | R2 Complete |
| `r2.9.1` | TerraExempt | Assessor hardening |
| `r2.9.2` | TerraAppeal | Assessor hardening |
| `r2.9.3` | TerraCert | Assessor hardening |
| `r2.9.4` | TerraNotice | Assessor hardening |
| `r2.9.5` | TerraQueue | Assessor hardening |
| `r2.10.0` | **All 8 TerraDais modules active** | Assessor Complete |
| `r3.0.0` | **6 constitutional CI gates enforced** | OS Governance |
| `r3.1.0` | Office registry + multi-office plumbing | OS Foundation |
| `r3.2.0` | **TerraClerk vertical complete** | First non-Assessor office |
| `r3.3.0` | **TerraTreasury vertical complete** | Second non-Assessor office |
| `r3.4.0` | **TerraAudit vertical complete** | Third non-Assessor office |
| `r3.5.0` | TerraRecorder (if applicable) | Fourth non-Assessor office |

---

## Workbench Tab Progression

| Phase | Tabs |
|-------|------|
| R2.8 (now) | Summary → Forge → Atlas → Dais → Dossier → Pilot |
| R3.2 | Summary → Forge → Atlas → Dais → **Clerk** → Dossier → Pilot |
| R3.3 | Summary → Forge → Atlas → Dais → Clerk → **Treasury** → Dossier → Pilot |
| R3.4 | Summary → Forge → Atlas → Dais → Clerk → Treasury → **Auditor** → Dossier → Pilot |

Dossier and Pilot remain last — they are cross-cutting OS features serving all offices.

---

## Cross-Office Data Flow

```
                    ┌──────────────┐
                    │   OS Core    │
                    │ (Property    │
                    │  Context)    │
                    └──────┬───────┘
                           │ parcelId
           ┌───────┬───────┼───────┬──────────┐
           ▼       ▼       ▼       ▼          ▼
      ┌─────────┐┌──────┐┌──────┐┌─────────┐┌──────────┐
      │ Assessor ││Clerk ││Treas ││ Auditor ││ Recorder │
      │(Forge/  ││(Rec- ││(Tax  ││(Roll    ││(Survey/  │
      │ Atlas/  ││ords) ││Coll) ││ Audit)  ││ Plats)   │
      │ Dais)   ││      ││      ││         ││          │
      └────┬────┘└───┬──┘└───┬──┘└────┬────┘└────┬─────┘
           │         │       │        │          │
           └─────────┴───────┴────────┴──────────┘
                           │
                    ┌──────▼───────┐
                    │  TerraTrace  │
                    │ (Unified     │
                    │  Audit Log)  │
                    └──────────────┘
```

**Data Flow Rules:**
- Each office writes ONLY to its own lane
- All offices READ parcel context from OS Core
- Cross-office queries go through read-only projections
- TerraTrace captures ALL office activity with `officeId` scoping
- correlationId links cross-office transactions

---

## Risk Matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| Domain complexity for non-Assessor offices | High | Start with parcel-adjacent functions only; defer non-parcel features |
| Write-lane collision between offices | Critical | Enforced by CI Gate 3 + manifest `writesTo` declarations |
| County data isolation across offices | Critical | Every endpoint filters by `countyId`; tested per-office |
| Tab overload in Property Workbench | Medium | Hidden tabs for inactive offices; progressive disclosure |
| Agent coordination conflicts | Medium | Strict handoff protocol; no agent ships without prerequisite signal |
| Scope creep into non-parcel domains | Medium | R3 boundary explicitly excludes non-parcel functions |
| Real county data availability | High | Start with Benton County (known good); synthetic data for gaps |

---

## Definition of Done: R3

R3 is complete when:

- [ ] 53+ governed tools with real handlers (no stubs)
- [ ] All 8 TerraDais modules active with real backend endpoints
- [ ] 6 constitutional CI gates enforced in SEAL workflow
- [ ] Office registry enables multi-office switching
- [ ] TerraClerk vertical: 6 tools, PropertyClerk tab, recording/title/lien backend
- [ ] TerraTreasury vertical: 7 tools, PropertyTreasury tab, collection/delinquency backend
- [ ] TerraAudit vertical: 5 tools, PropertyAudit tab, roll audit/compliance backend
- [ ] Property Workbench displays 9 tabs (Summary + 5 Assessor + 3 new offices)
- [ ] Cross-office trace: transactions spanning offices linked by correlationId
- [ ] County isolation verified for every new office endpoint
- [ ] All permanent gates pass
- [ ] Acceptance criteria: AC-CLK-01→06, AC-TRS-01→07, AC-AUD-01→05 (18 new ACs)
- [ ] Evidence packet with correlation IDs and reproducible traces
- [ ] No production surface depends on stub, mock, or simplified logic

---

## Beyond R3

| Phase | Scope |
|-------|-------|
| R4 | Non-parcel office functions (elections, vital records, court, general fund) |
| R5 | County-to-county federation (multi-county OS mesh) |
| R6 | State-level aggregation (39 counties → state-wide views) |
| R7 | Citizen portal (public-facing self-service) |

---

## Timeline Summary

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | R2.9-W1 | TerraExempt |
| 2 | R2.9-W2 | TerraAppeal |
| 2.5 | R2.9-W3 | TerraCert |
| 3 | R2.9-W4 | TerraNotice |
| 4 | R2.9-W5 | TerraQueue |
| 4 | R2.10.0 | Assessor vertical sealed |
| 5 | R3.0.0 | Constitutional gates enforced |
| 6–8 | R3.1.0 | Multi-office plumbing |
| 9–14 | R3.2.0 | TerraClerk complete |
| 15–20 | R3.3.0 | TerraTreasury complete |
| 21–26 | R3.4.0 | TerraAudit complete |
| 27–30 | R3.5.0 | TerraRecorder (if applicable) |

---

## Document Authority

This plan supersedes no prior plan. R1 and R2 plans remain canonical records of
completed work. This plan is additive — it extends the governance spine proven in
R1/R2 into multi-office territory.

**Authoritative sources (in order):**
1. Suite Constitution v1.0 (`docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md`)
2. Spec Package v3.1 (`docs/TerraFusion_Spec_Package_v3_1_flat/`)
3. R1 execution plan (`docs/planning/R1_END_TO_END_EXECUTION_PLAN_2026-03-07.md`)
4. R2 extraction plan (`docs/planning/R2_EXTRACTION_PLAN.md`)
5. This plan (`docs/planning/R3_MULTI_AGENT_EXECUTION_PLAN.md`)

---

*Classification: Internal planning document*
*Baseline: r2.8.0 at 55d6baffa*
*Method: Extract, extend, gate — same discipline as R1/R2*
*Agent lanes: CX (Codex), CP (Copilot), CC (Claude)*
