# TerraFusion Suite Constitution v1.0

**Document ID:** TF-052  
**Status:** Constitutional (Immutable)  
**Version:** 1.0  
**Era:** Genesis Era (1.0)  
**Effective:** 2026-01-28

---

## Preamble

This Constitution establishes the canonical naming system, suite boundaries, and governance rules for TerraFusion OS. All agents, developers, and systems must adhere to these rules. Violations will be flagged by governance checks and blocked from merge.

---

## Article I: Canonical Suite Names

### Section 1.1: Active Suites

| Suite ID | Display Name | Domain | Status |
|----------|--------------|--------|--------|
| `terraforge` | TerraForge | Valuation | Active |
| `terraatlas` | TerraAtlas | GIS | Active |
| `terradais` | TerraDais | Assessor Admin | Active |
| `terradossier` | TerraDossier | Records/Evidence | Active |
| `terragpt` | TerraGPT | AI/GPT Suite | Active |

### Section 1.2: OS-Level Features (Not Suites)

| Feature ID | Display Name | Type | Status |
|------------|--------------|------|--------|
| `terrapilot` | TerraPilot | Personal Copilot | Active |
| `terratrace` | TerraTrace | Audit Spine | Active |
| `property-workbench` | Property Workbench | OS Surface | Active |

### Section 1.3: Reserved Suite Names (Future Offices)

| Suite ID | Display Name | Reserved For | Status |
|----------|--------------|--------------|--------|
| `terraclerk` | TerraClerk | County Clerk | Reserved |
| `terratreasury` | TerraTreasury | County Treasurer | Reserved |
| `terraaudit` | TerraAudit | County Auditor | Reserved |
| `terrarecorder` | TerraRecorder | County Recorder | Reserved |

---

## Article II: Module Naming Rules

### Section 2.1: Module ID Format

```
{suite-prefix}-{module-name}
```

**Examples:**
- `terra-levy` (TerraDais module)
- `terra-pilt` (TerraDais module)
- `terra-permit` (TerraDais module)
- `terra-exempt` (TerraDais module)
- `terra-appeal` (TerraDais module)
- `terra-cost` (TerraForge module)
- `terra-comp` (TerraForge module)
- `terra-parcel` (TerraAtlas module)
- `terra-layers` (TerraAtlas module)

### Section 2.2: Reserved Module Prefixes

The following prefixes are FORBIDDEN for Assessor-related modules:

| Prefix | Reserved For | Reason |
|--------|--------------|--------|
| `terra-clerk-*` | TerraClerk | Future Clerk suite |
| `terra-treasury-*` | TerraTreasury | Future Treasurer suite |
| `terra-audit-*` | TerraAudit | Future Auditor suite |
| `terra-recorder-*` | TerraRecorder | Future Recorder suite |

### Section 2.3: Audit vs Trace Disambiguation

To avoid confusion with the future TerraAudit suite:

| Term | Use For | Forbidden For |
|------|---------|---------------|
| `audit` | Financial/compliance auditing (Auditor office) | Assessor activity tracking |
| `trace` | Activity logging, evidence trails | — |
| `compliance` | Regulatory compliance | — |
| `activity` | Action history | — |

**Rule:** Assessor office modules must use `trace`, `compliance`, or `activity` instead of `audit`.

---

## Article III: Suite Boundaries

### Section 3.1: TerraForge (Valuation Suite)

**Mission:** Build value — models, calibration, comps, analysis

**Writes:**
- Valuation models
- Cost approach data
- Income approach data
- Sales comparison data
- Comparable selections
- Model calibration
- CAMA characteristics
- Valuation notes

**Cannot Write:**
- Workflow states (TerraDais)
- Documents (TerraDossier)
- GIS artifacts (TerraAtlas)

### Section 3.2: TerraAtlas (GIS Suite)

**Mission:** See the county — maps, layers, spatial tools

**Writes:**
- GIS layers
- Layer symbology
- Parcel boundaries (geometry)
- Spatial annotations
- Map bookmarks
- Neighborhood definitions

**Cannot Write:**
- Valuation data (TerraForge)
- Workflow states (TerraDais)
- Documents (TerraDossier)

### Section 3.3: TerraDais (Assessor Admin Suite)

**Mission:** Operate value — permits, exemptions, appeals, certification, notices

**Writes:**
- Permit records and status
- Exemption records and decisions
- Appeal records and status
- Notice generation and queue
- Certification checklists
- Task assignments
- Workflow states

**Cannot Write:**
- Valuation calculations (TerraForge)
- GIS geometry (TerraAtlas)
- Documents (TerraDossier) — must use service API

### Section 3.4: TerraDossier (Records Suite)

**Mission:** Prove the decision — evidence, narratives, packets

**Writes:**
- Documents (uploads, generated)
- Narratives
- Evidence items
- Packets (assembled collections)
- Case files

**Cannot Write:**
- Valuation data (TerraForge)
- Workflow states (TerraDais)
- GIS artifacts (TerraAtlas)

### Section 3.5: TerraGPT (AI Suite)

**Mission:** Augment every role — summaries, drafting, Q&A, retrieval

**Writes:**
- GPT configurations
- RAG datasets (metadata)
- RAG embeddings
- Usage/cost metrics
- Conversation history

**Cannot Write:**
- Any other suite's data directly
- Must use TerraPilot tools for actions

---

## Article IV: Property Workbench Tab Order

### Section 4.1: Canonical Order

```
1. Summary (OS Core)
2. Forge (TerraForge)
3. Atlas (TerraAtlas)
4. Dais (TerraDais)
5. Dossier (TerraDossier)
6. Pilot (TerraPilot)
```

### Section 4.2: Future Tab Positions

When reserved suites are implemented:

```
1. Summary (OS Core)
2. Forge (TerraForge)
3. Atlas (TerraAtlas)
4. Dais (TerraDais)
5. Clerk (TerraClerk) — future
6. Treasury (TerraTreasury) — future
7. Auditor (TerraAudit) — future
8. Dossier (TerraDossier)
9. Pilot (TerraPilot)
```

**Rule:** Dossier and Pilot always remain last (cross-cutting concerns).

---

## Article V: TerraDais Modules (Assessor Admin)

### Section 5.1: Active Modules

| Module ID | Display Name | Domain | Status |
|-----------|--------------|--------|--------|
| `terra-levy` | TerraLevy | Levy modeling | Active |
| `terra-pilt` | TerraPILT | PILT tracking | Active |
| `terra-permit` | TerraPermit | Permit workflows | Active |
| `terra-exempt` | TerraExempt | Exemptions | Planned |
| `terra-appeal` | TerraAppeal | Appeals/BOE | Planned |
| `terra-cert` | TerraCert | Roll certification | Planned |
| `terra-notice` | TerraNotice | Notices/mail | Planned |
| `terra-queue` | TerraQueue | Work queues | Planned |
| `terra-trace` | TerraTrace | Activity trail | Active (OS) |

### Section 5.2: Module Responsibilities

| Module | Responsibilities |
|--------|------------------|
| TerraLevy | Levy rate modeling, limit calculations, scenario comparison, certified exports |
| TerraPILT | PILT forecasting, reconciliation, reporting, payment tracking |
| TerraPermit | Permit intake, inspection tracking, valuation impact workflow |
| TerraExempt | Eligibility determination, renewals, document tracking |
| TerraAppeal | Intake, deadlines, BOE packet assembly, hearing tracking |
| TerraCert | Roll checklist, sign-offs, statutory exports |
| TerraNotice | Template management, batch generation, mail/print queue |
| TerraQueue | Task assignment, SLA tracking, escalation |

---

## Article VI: TerraAtlas Modules (GIS Suite)

### Section 6.1: Module Inventory

| Module ID | Display Name | Domain | Status |
|-----------|--------------|--------|--------|
| `terra-parcel` | ParcelLens | Parcel search/identify | Active |
| `terra-layers` | LayerWorks | Layer management | Active |
| `terra-sketch` | SketchPad | Draw/edit/markup | Planned |
| `terra-print` | PrintRoom | Map outputs | Planned |
| `terra-export` | Exporter | Geo exports | Planned |
| `terra-query` | QueryBuilder | Spatial queries | Planned |

---

## Article VII: TerraPilot Modes

### Section 7.1: Mode Definitions

| Mode | ID | Purpose | Keyboard |
|------|----|---------| ---------|
| Pilot Mode | `pilot` | Operator: do/route/act | Ctrl+Shift+P |
| Muse Mode | `muse` | Creator: draft/explain | Ctrl+Shift+M |

### Section 7.2: Tool Assignment Rules

| Tool Category | Mode |
|---------------|------|
| navigation | pilot |
| workflow | pilot |
| data | pilot |
| execution | pilot |
| monitoring | pilot |
| draft | muse |
| explain | muse |
| summarize | muse |
| synthesize | muse |
| template | muse |

---

## Article VIII: Blocked Words

### Section 8.1: Words Reserved for Future Offices

| Word | Cannot Use In | Reserved For |
|------|---------------|--------------|
| `clerk` | Any Assessor module | TerraClerk |
| `treasury` | Any Assessor module | TerraTreasury |
| `auditor` | Any Assessor module | TerraAudit |
| `recorder` | Any Assessor module | TerraRecorder |

### Section 8.2: Words with Specific Meanings

| Word | Reserved Meaning | Cannot Use For |
|------|------------------|----------------|
| `audit` | Financial/compliance audit (Auditor) | Activity logging |
| `forge` | Valuation modeling | Anything else |
| `atlas` | GIS/spatial | Anything else |
| `dais` | Assessor admin | Anything else |
| `dossier` | Records/evidence | Anything else |
| `pilot` | Personal copilot | Anything else |

---

## Article IX: Trace Event Categories

### Section 9.1: Category Definitions

| Category | Use For |
|----------|---------|
| `valuation` | TerraForge value changes |
| `workflow` | TerraDais status changes |
| `compliance` | Regulatory/certification events |
| `system` | Technical operations |
| `navigation` | User movement (low-priority) |

### Section 9.2: Classification Levels

| Level | Description | Retention |
|-------|-------------|-----------|
| `PUBLIC` | Non-sensitive | Varies |
| `INTERNAL` | Staff-only | 1 year |
| `CONFIDENTIAL` | Role-restricted | 7 years |
| `RESTRICTED` | Audit/legal only | Permanent |

---

## Article X: Governance Enforcement

### Section 10.1: Automated Checks

The following checks run on every PR:

| Check | Rule | Failure Action |
|-------|------|----------------|
| Name Collision | No reserved suite names used | Block merge |
| Prefix Collision | No reserved module prefixes | Block merge |
| Blocked Words | No audit/clerk/treasury in Assessor modules | Block merge |
| Write Lane Violation | No cross-suite direct writes | Block merge |
| Trace Emission | Write actions emit trace events | Warning |

### Section 10.2: Manual Review Requirements

| Change Type | Required Reviewer |
|-------------|-------------------|
| New suite | Architecture team |
| New module | Suite owner |
| Tab order change | Architecture team |
| Reserved name use | Architecture team (exception required) |
| Safety level change | Security team |

---

## Article XI: Amendment Process

### Section 11.1: Constitutional Changes

Changes to this Constitution require:
1. Architecture team approval
2. Written rationale in ADR format
3. 72-hour review period
4. No blocking objections from suite owners

### Section 11.2: Module Addition

Adding a new module requires:
1. Suite owner approval
2. Module ID follows naming rules
3. Documented responsibilities
4. No collision with reserved names

---

## Appendix A: Quick Reference

### Suite Family

```
TerraFusion (OS/Platform)
├── TerraForge (Valuation)
├── TerraAtlas (GIS)
├── TerraDais (Assessor Admin)
├── TerraDossier (Records)
├── TerraGPT (AI Suite)
├── TerraPilot (Personal Copilot) — OS feature
├── TerraTrace (Audit Spine) — OS feature
└── Property Workbench — OS surface
```

### Reserved (Future)

```
├── TerraClerk (County Clerk)
├── TerraTreasury (County Treasurer)
├── TerraAudit (County Auditor)
└── TerraRecorder (County Recorder)
```

### TerraDais Modules

```
TerraDais
├── TerraLevy
├── TerraPILT
├── TerraPermit
├── TerraExempt
├── TerraAppeal
├── TerraCert
├── TerraNotice
└── TerraQueue
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | Architecture | Initial constitution |

---

**TerraFusion OS — Genesis Era**  
*The Constitution: Laws That Govern the OS*
