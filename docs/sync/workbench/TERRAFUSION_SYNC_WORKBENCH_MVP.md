# TerraFusion Sync Workbench — MVP Design

_Version 1.0 · 2026-06-08_  
_Locked against: TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md · TERRAFUSION_SYNC_AUTOMATION_BACKLOG.md_  
_Status: DESIGN — do not build UI until this spec is confirmed_

---

## 1. What This Is

> **The Workbench is the assessor-facing surface that drives the proven Sync engine.**
> The engine exists. The surface does not. This document defines the surface.

From Product Doctrine §3:

```
ENGINE      (Benton mostly PROVED this)
  connect · profile · land · normalize · resolve identity ·
  project truth · project canonical · run gates · repair · readback · evidence packet

WORKBENCH   (the product still to BUILD)
  the assessor-facing 7-step surface that drives the engine:
  Connect Source · Profile DB · Build Mapping · Dry Run ·
  Review Quarantine · Commit Approved · Export Evidence Packet
```

The Workbench is NOT a new backend. It is a guided interactive shell over tools that are already
proven against real Benton County data. Every screen calls existing automation tools; no screen
invents new logic.

---

## 2. Target Operator

```
ONE technical assessor.
Fluent in SQL Server Management Studio and Excel.
NOT a DevOps engineer, NOT a vendor implementation team, NOT a SaaS admin.
```

The test for every design decision:

> _"Can this step be completed by one technical assessor with SQL Server and Excel?"_

If a step requires YAML files, stack traces, C# edits, or CLI flags: the design is wrong. Simplify
until the assessor can execute it without reading documentation.

---

## 3. The Design Contract: Burden-First, Not Menu-First

The operator's burden is:

> "I have a county's legacy CAMA/PACS database. I need to know: Is it safe to produce canonical
> property data from this source? What was converted, what was deferred, and what can I claim?"

The workbench starts with that question — not with a product menu of features. Every screen answers
a specific sub-question on the path to that answer:

| Step | Screen | Question answered |
|------|--------|-------------------|
| 1 | Source Connection | Can we read this database safely? |
| 2 | Doctor + Profile | Is the landing layer healthy? What domains are present? |
| 3 | Source Pack Review | Does the Harris PACS pack apply? What needs county override? |
| 4 | Lane Mapping Grid | What exactly gets mapped where? (AI proposes, human approves) |
| 5 | Dry Run | What will the drain produce before any data moves? |
| 6 | Quarantine Review | What was refused and why? What should we do with it? |
| 7 | Commit + Evidence | What is now sealed? What can we claim? What is the proof? |

---

## 4. The AI Proposal Contract

This is non-negotiable. It applies to every screen, every action, every mapping decision.

```
AI proposes → human approves → machine commits → evidence proves
```

**What AI may propose:**
- Column-level field mappings (source → truth → canonical)
- Type code overrides based on schema analysis
- Evidence packet draft from lane contracts + seal results
- Quarantine reason groupings and suggested dispositions
- Denominator estimates based on Benton reference scaled by county parcel count

**What human must approve before machine commits:**
- Source database credentials
- Lane contract confirmations (or override notations)
- Every mapping row in the mapping grid
- Dry run go/no-go verdict
- Quarantine disposition per reason group (not per row — grouped approval)
- Seal status (the human explicitly marks a lane SEALED)
- Evidence packet handoff statement

**What machine never does silently:**
- Does not commit a drain without explicit human approval of the dry run
- Does not mark a lane SEALED without human confirmation
- Does not suppress a quarantine reason — every quarantined record has a visible reason
- Does not override doctrine without an explicit human-authored override document
- Does not produce an evidence packet claim that a lane is sealed when the human hasn't confirmed it

---

## 5. The Seven-Step Workflow

### Step 1 — Connect Source

**Question:** Can we read this database safely?

**Operator action:** Enter PACS SQL Server credentials (host, database name, user, password).
The workbench verifies:

1. TCP connectivity to the SQL Server host
2. Authentication succeeds with the provided credentials
3. Credential is READ-ONLY (attempt a benign write that must fail)
4. All 16 required Harris PACS tables are present
5. Baseline counts established (parcel, improvement, sales, bill denominators)

**AI role:** Compares baseline counts to Benton reference (scaled by county parcel count) and
flags dramatic deviations as hypotheses, not findings.

**Human approves:** Connection settings. Confirms: "this database name is correct for this county."

**Output:** `connection-profile.json` (connection settings, read-only confirmation, table
presence result, baseline count table). Stored in `docs/sync/seals/{county}/`.

**Tool dependency:** `APPLYING_HARRIS_PACS_PACK.md` Steps 1–2.

---

### Step 2 — Doctor + Profile

**Question:** Is the landing layer healthy? What domains are present?

**Operator action:** Run the full preflight. Interpret the result.

The workbench runs:
- `node tools/sync/tf-sync-doctor.mjs` (all 4 steps: pack validator, identity drift, seal check,
  domain coverage)
- Shows each step result as a card (PASS / WARN / FAIL) with expand-to-detail

**Doctor cards:**

```
┌─────────────────────────────────────────────────────┐
│  #0  Harris PACS Pack Validator          ✓ PASS      │
│      65 checks pass · 1 info                        │
│      [ Expand for per-check detail ]                 │
├─────────────────────────────────────────────────────┤
│  #1  Identity-Drift Detector             ⚠ WARN      │
│      1 known-deferred item                           │
│      [ Expand for drift detail ]                     │
├─────────────────────────────────────────────────────┤
│  #2  Seal-Check Runner                   ✓ PASS      │
│      22/22 gates hold                                │
│      [ Expand for gate list ]                        │
├─────────────────────────────────────────────────────┤
│  #3  Domain-Coverage Audit               ⚠ WARN      │
│      12 SEALED · 3 LANDED_ONLY · 3 DEFERRED         │
│      [ Expand for domain grid ]                      │
└─────────────────────────────────────────────────────┘
         OVERALL: WARN — safe to proceed
```

**Domain coverage grid** (from Automation #3 output):

| Domain | Status | Landing rows | Truth rows | Canonical rows |
|--------|--------|-------------|------------|----------------|
| parcel | SEALED | 1,190,834 | 83,326 | 83,326 |
| owner | SEALED | 8,213,706 | ... | ... |
| ... | ... | ... | ... | ... |
| payment receipt | DISCOVERED_DEFERRED | — | — | — |

**AI role:** None on this screen. The tools emit the facts; the operator reads them.

**Human approves:** Reviews the WARN items. Marks each WARN as "acknowledged" before proceeding.

**Blocked state:** FAIL on doctor step #0 → workbench shows red gate and does not allow proceeding
to Step 3 until FAIL is resolved.

**Tool dependency:** `tools/sync/tf-sync-doctor.mjs`, all 4 automation SQL tools.

---

### Step 3 — Source Pack Review

**Question:** Does the Harris PACS pack apply as-is? What needs county-specific override?

**Operator action:** Walk through the lane contracts from the Harris PACS Source Pack. For each
lane, either:

- **Confirm** — pack applies as-is (Benton reference values are correct for this county)
- **Override** — county-specific deviation; operator enters the override value and evidence source

The workbench shows each lane as a collapsible card:

```
Lane: owner
  Source table:    dbo.owner
  Source grain:    (prop_id, owner_id, owner_tax_yr, sup_num)
  Operational yr:  2025
  Active sup rule: MAX(sup_num) per (prop_id, owner_tax_yr)
  Expected rows:   816,849  [Benton ref — scaled estimate for this county]

  Confirmation queries:  [ Run in SSMS ]
    SELECT COUNT(*) FROM dbo.owner WHERE owner_tax_yr=2025
    -- Does this match the scaled estimate?

  Override points:
  [ ] Operational year     Benton: 2025    This county: ____
  [ ] Owner table name     Benton: owner   This county: ____
  [ ] WSDOR present        Benton: yes     This county: ____

  [ Confirm ] [ Override... ]
```

**AI role:** Proposes "no override needed" when the schema and count matches Benton reference
within a reasonable range. Flags deviations as "requires confirmation."

**Human approves:** Each lane confirmation or override. Override requires a note: what is different
and how was it confirmed (who, when, source).

**Output:** `county-overrides.md` at `docs/sync/source-packs/harris-pacs/{county}-overrides.md`.
Contains every deviation from the pack reference.

**Tool dependency:** `HARRIS_PACS_SOURCE_PACK.md`, `APPLYING_HARRIS_PACS_PACK.md` Steps 5–7,
SQL Server connection from Step 1.

**Skipped by:** Benton County (it IS the reference; no overrides to confirm).

---

### Step 4 — Lane Mapping Grid

**Question:** What exactly gets mapped where? Column by column, what is the source of truth?

**The Excel-in / Excel-out surface.** This is the heart of the assessor-facing workbench.

The mapping grid is a table:

| Lane | Source column | Source type | Target layer | Target column | Transform | AI proposed | Status |
|------|--------------|-------------|-------------|--------------|-----------|-------------|--------|
| owner | prop_id | int | truth_pacs | ParcelIdSource | direct | ✓ | APPROVED |
| owner | owner_nm | nvarchar | truth_pacs | OwnerName | trim | ✓ | APPROVED |
| improvement | imprv_type_cd | char(6) | truth_pacs | ImprovTypeCode | dict lookup | ✓ | NEEDS_REVIEW |

**Export:** "Export to Excel" produces a `.xlsx` workbook. Operator edits in Excel.  
**Import:** "Import from Excel" reads back the operator's changes and validates structure.  
**YAML is a generated artifact** — the workbench generates YAML/JSON from the approved mapping;
YAML is never the source of truth and is never hand-edited.

**AI role:**
- Proposes initial mapping from schema analysis (column names, types, Benton reference)
- Flags type code columns as "requires dictionary review"
- Proposes "NEEDS_REVIEW" status for any column that has no Benton equivalent

**Human approves:**
- Every NEEDS_REVIEW row before proceeding
- Dictionary entries for type code columns (confirmed against PACS dictionary tables)
- Transform rules for non-direct mappings (trim, date normalization, code remapping)

**Output:** `{county}-lane-mapping-approved.xlsx` + generated `{county}-lane-mapping.json`.
Stored in `docs/sync/seals/{county}/`.

**Tool dependency:** `APPLYING_HARRIS_PACS_PACK.md` Step 7, existing promoter field mappings in
backend services.

---

### Step 5 — Dry Run

**Question:** What will the drain produce before any data moves?

**Operator action:** Trigger dry-run mode for each lane. The workbench calls the drain endpoints
in preview mode (no writes to truth or canonical layers).

Dry run output per lane:

```
Lane: owner — Dry Run
  Source rows qualified:  816,849
  Projected truth rows:   816,849
  Projected canonical:    76,204  (outside real-property spine: 740,645 historical owner rows)
  Duplication check:      1.0000×
  Projected quarantine:   0
  Identity resolution:    76,204 / 76,204 resolved

  Denominator verdict:    ✓ matches expected (scaled from Benton)
  Identity verdict:       ✓ clean
  [ Approve for drain ] [ Abort ]
```

**AI role:** Compares projections to Benton reference (scaled). Flags any lane where projected
canonical row count differs from expected by more than 15%.

**Human approves:** Go/no-go verdict for each lane dry run. Human must explicitly click
"Approve for drain" before the drain executes. No implicit approval.

**Blocked state:** If projected quarantine > 20% of source rows, workbench adds a warning gate:
"High quarantine rate — review quarantine preview before approving."

**Tool dependency:** Drain endpoint preview mode (`?dryRun=true` parameter on drain API).
Currently, these endpoints exist in the backend but dry-run mode may need implementation per lane
(scope: Slice D or E of implementation slices).

---

### Step 6 — Review Quarantine

**Question:** What was refused and why? What should we do with it?

**Operator action:** Review quarantined rows grouped by reason. For each reason group, decide:

| Action | Meaning |
|--------|---------|
| **Map code** | Add this source code to the dictionary (expands pack) |
| **Ignore** | This reason is known and acceptable (legacy noise) |
| **Mark legacy-only** | Row exists due to historical migration; not current-operational |
| **Export to Excel** | Pull full row detail for manual review |
| **Defer** | Record as DISCOVERED_DEFERRED; create backlog item |

**Quarantine review grid:**

```
Reason: UNKNOWN_ATTRIBUTE (9,504 rows)
  Top codes: Comp Shingle (1,434) · Crawl/Concrete Perimeter (996) · Count×3 (882) ...
  [ Map codes to dict ] [ Ignore group ] [ Export to Excel ] [ Defer ]

Reason: OUTSIDE_REAL_PROPERTY_SPINE (740,645 rows)
  These are historical owner rows keyed to non-live parcel identities.
  Status: KNOWN_DEFERRED — no action needed
  [ Acknowledged ]
```

**AI role:**
- Groups quarantine reasons by code frequency
- Proposes "KNOWN_DEFERRED" for quarantine types that match Benton's known patterns
- Proposes "Map code" for attribute codes that appear in the PACS dictionary but are missing from
  the TF attribute definition

**Human approves:** Every quarantine disposition. "Map code" decisions become additions to the
county's source pack override file, not to the universal pack.

**Output:** `{county}-quarantine-disposition.md`. Every reason group has an approved action.
Decisions that expand the dictionary are logged as source pack amendments.

**Tool dependency:** `GET /api/sync/doctrine/policy/quarantine/imprv-attr/profile` (SYNC-DOCTRINE-4-V7).
Equivalent endpoint needed for other lanes (owner, sales, land).

---

### Step 7 — Commit Approved + Export Evidence

**Question:** What is now sealed? What can we claim? What is the proof?

**Operator action:** Review final seal state. Produce the evidence packet.

**Seal status table:**

| Lane | Status | Truth rows | Canonical rows | Gates | Evidence |
|------|--------|------------|----------------|-------|---------|
| parcel | ✓ SEALED | 83,326 | 83,326 | 22/22 | [link] |
| owner | ✓ SEALED | 816,849 | 76,204 | 4/4 | [link] |
| ... | ... | ... | ... | ... | ... |
| payment receipt | DEFERRED | — | — | — | n/a |

**AI proposes evidence packet draft:**

The workbench auto-fills the standard evidence packet shape (Product Doctrine §8) from:
- Lane contracts confirmed in Step 3
- Seal gate results from Step 7's runner
- Quarantine dispositions from Step 6
- Baseline counts from Step 1

Packet sections:
```
1. Executive claim        (what this substrate enables)
2. Scope                  (county, operational year, source system version)
3. Sealed lanes           (table of all 12 sealed lanes with row counts)
4. Runtime proof table    (row counts, dup invariants, amounts, gate verdicts)
5. Doctrine record        (ratio policy, supplement rule, property type codes)
6. Boundary register      (every deferred domain with reason and reopen condition)
7. Evidence index         (links to per-lane seal artifacts)
8. Readback set           (6-parcel acceptance set with surface exercises)
9. Out-of-scope list      (what this substrate must NOT claim)
10. Handoff statement     (what the assessor signs off on)
```

**Human approves:**
- Reviews every section of the evidence packet draft
- Edits the handoff statement (first-person, signed by the assessor)
- Clicks "Commit seal + export packet"

**Machine commits:**
- Runs `tools/sync/tf-sync-doctor.mjs` one final time; must return PASS or WARN
- Writes the evidence packet to `docs/sync/seals/{county}-current-year-spine-seal-packet.md`
- Updates `docs/sync/seals/benton-lane-status.md` (or equivalent for this county)
- Tags the git commit with the county name and seal date

**Output:** Sealed lane registry entry + signed evidence packet.

**Tool dependency:** `tf-sync-doctor.mjs`, `seal-check-runner.sql`, evidence packet template.

---

## 6. Screen Inventory

| # | Screen name | Purpose | Key operator actions |
|---|------------|---------|---------------------|
| 0 | Session Open | tf-sync doctor preflight result | Acknowledge WARNs; abort on FAIL |
| 1 | Source Connection | Enter and validate PACS credentials | Enter creds; review baseline counts |
| 2 | Doctor + Domain Coverage | Health check + lane status grid | Expand WARN items; acknowledge deferred |
| 3 | Source Pack Review | Confirm/override lane contracts | Confirm or override each lane; write override notes |
| 4 | Lane Mapping Grid | Column-level mapping approval | Edit in Excel; import back; approve NEEDS_REVIEW rows |
| 5 | Dry Run | Drain preview per lane | Review projections; approve/abort per lane |
| 6 | Quarantine Review | Quarantined rows grouped by reason | Choose action per reason group; export to Excel |
| 7 | Commit + Evidence | Final seal + evidence packet | Edit packet; sign handoff; commit |

---

## 7. Data and Tool Dependencies

| Screen | Tool / endpoint | Status |
|--------|----------------|--------|
| Session Open | `tools/sync/tf-sync-doctor.mjs` (4-step) | ✅ Built |
| Source Connection | SQL Server INFORMATION_SCHEMA queries | ✅ Proven (APPLYING_HARRIS_PACS_PACK Steps 1–2) |
| Doctor + Coverage | `identity-drift-detector.sql`, `seal-check-runner.sql`, `domain-coverage-audit.sql`, `harris-pacs-pack-validator.sql` | ✅ Built |
| Source Pack Review | `HARRIS_PACS_SOURCE_PACK.md` lane contracts, SQL Server queries | ✅ Queries proven (APPLYING_HARRIS_PACS_PACK Steps 5–7) |
| Lane Mapping Grid | Backend field mapping (promoter code), PACS INFORMATION_SCHEMA | Promoters exist; grid UI to build |
| Dry Run | Drain endpoints with `?dryRun=true` | Endpoints exist; dry-run mode needs per-lane wiring |
| Quarantine Review | `GET /api/sync/doctrine/policy/quarantine/imprv-attr/profile` | ✅ Built (imprv-attr); other lanes to build |
| Commit + Evidence | `tf-sync-doctor.mjs`, `seal-check-runner.sql`, evidence template | ✅ Components built; assembly to build |

---

## 8. SQL and Excel Interaction Model

The operator is fluent in SQL and Excel. The workbench uses these as first-class surfaces:

**SQL "view in source":**
Every screen that shows a count, a row sample, or a mapping decision has a "View SQL" button that
shows the exact query behind the number. The operator can copy and run it in SSMS to verify.
No magic numbers; every number has a traceable SQL query.

**Excel "export / reimport":**
The mapping grid (Step 4) and quarantine review (Step 6) both support:
- Export to `.xlsx` — operator opens in Excel, edits, saves
- Import from `.xlsx` — workbench reads back the operator's edits, validates structure, flags errors
No CSV gymnastics; `.xlsx` is the exchange format.

**Evidence artifact:**
The evidence packet exports as a `.md` file. The operator can open it in any text editor, review
it, and sign off on it before commit. No black-box PDF generation.

---

## 9. First Clickable MVP

The first clickable MVP is not the full 7-step flow. It is the smallest thing that is genuinely
useful to the operator — a local web shell that surfaces what the proven automation tools already
know, without the operator needing to read terminal output.

**MVP scope:**

```
Screen 0: Session Open (tf-sync doctor as a web page)
Screen 2: Domain Coverage Grid (lane status at a glance)
```

Nothing else. No new backend. No drain UI. No mapping grid. No quarantine surface.

**What it builds:**

```
tools/sync/workbench/
  server.mjs          Node.js Express server (local, no auth needed)
  index.html          Dashboard shell
  doctor-card.html    Step-result card component
  domain-grid.html    Domain coverage table component
```

**What it does:**

1. `node tools/sync/workbench/server.mjs` starts a local web server on port 7700
2. Browser opens `http://localhost:7700`
3. Shows: DB connection info, four doctor step cards (PASS/WARN/FAIL with expand-to-detail),
   domain coverage grid (12 sealed lanes in green, deferred lanes in yellow/gray)
4. "Re-run doctor" button triggers `tf-sync-doctor.mjs` on demand and refreshes all cards
5. Each domain grid row links to the relevant seal evidence artifact

**Why this specific scope:**

- Proves the workbench shell concept with zero new backend code
- Immediately useful: assessor can open a browser tab instead of reading terminal output
- Domain coverage grid is the "map" the assessor checks at the start of every session
- The doctor preflight runs on every session open — surfacing it as a visual card is directly
  valuable today, before any workbench expansion

**Not in MVP:**
- No write operations
- No Step 1 credential form (developer sets env vars)
- No mapping grid
- No quarantine surface
- No evidence export
- No multi-county support

---

## 10. Non-Goals

These are explicitly out of scope for the Workbench MVP and for the Workbench V1:

| Out of scope | Why |
|-------------|-----|
| Full Treasurer accounting | Receipt ledger, tender detail, void/refund, delinquency certification are a separate mission (Doctrine §10) |
| Historical lane sealing | Prior-year history is a separate workstream; MVP is current operational substrate only |
| Magic autonomous commit | No silent drains, no unattended sealing, no "finish while I sleep" |
| Multi-county dashboard | Single county per workbench session; county selection is a later concern |
| Public-internet deployment | Local only; the operator's machine; no cloud hosting |
| DevOps monitoring dashboard | The doctor is a session-open check, not a continuous health monitor |
| Custom CAMA/PACS adapters | This is the Harris PACS workbench; other CAMA systems are future source packs |
| Automated drain scheduling | Drains are human-initiated; no cron jobs inside the workbench |
| AI autonomy over doctrine | Doctrine tables are human-authored; AI may propose, never auto-seed |

---

## 11. Acceptance Criteria

### For first clickable MVP (Screens 0 + 2)

- [ ] `node tools/sync/workbench/server.mjs` starts without error on a machine with Node 18+
- [ ] Browser at `http://localhost:7700` shows the doctor result as four visual cards
- [ ] PASS = green card, WARN = yellow card with expand detail, FAIL = red card with blocking gate
- [ ] Domain coverage grid shows all 12 SEALED lanes in green; 3 LANDED_ONLY in yellow; 3 DEFERRED in gray
- [ ] "Re-run doctor" button runs `tf-sync-doctor.mjs` and updates all cards within 60 seconds
- [ ] Each sealed lane row links to its evidence artifact file path
- [ ] No call fails silently — any psql error is shown in the card as red with the error text

### For full workbench V1 (all 7 steps)

- [ ] A technical assessor can onboard a new Harris PACS county end-to-end without reading any markdown documentation — the workbench surfaces the runbook as interactive steps
- [ ] Every mapping decision in Step 4 has a traceable SQL query the operator can verify in SSMS
- [ ] The evidence packet produced in Step 7 matches the Doctrine §8 packet shape exactly
- [ ] "Commit seal" button only activates after: all lane contracts confirmed (Step 3), all NEEDS_REVIEW mappings approved (Step 4), dry run approved (Step 5), quarantine disposition recorded (Step 6), evidence packet reviewed (Step 7)
- [ ] Machine never commits a drain without explicit human go-ahead on the dry run screen
- [ ] tf-sync doctor runs at the start of every workbench session and blocks entry if FAIL

---

## 12. Implementation Slices

### Slice A — Doctor Dashboard (First Clickable MVP)

**Scope:** `tools/sync/workbench/` — Express server + HTML dashboard  
**Input:** `tools/sync/tf-sync-doctor.mjs` (already built)  
**Output:** Visual doctor cards at `http://localhost:7700`  
**New backend code:** None  
**New frontend code:** ~250 lines (server.mjs + static HTML)  
**Acceptance:** MVP criteria above  

---

### Slice B — Domain Coverage Grid

**Scope:** Extend Slice A with the domain coverage grid component  
**Input:** `tools/sync/domain-coverage-audit.sql` output (parsed from doctor step #3)  
**Output:** Grid of all 19 domain families with status badges and row counts  
**New backend code:** None (parse existing doctor output)  
**Acceptance:** All 12 sealed lanes visible; deferred lanes labeled with reason  

---

### Slice C — Source Connection + Pack Validator Form

**Scope:** Step 1 credential form + connectivity check UI  
**Input:** Harris PACS SQL Server, `harris-pacs-pack-validator.sql`  
**Output:** Connection profile card, baseline counts table, pack validator result  
**New backend code:** SQL Server connectivity endpoint (Node.js + `mssql` or `tedious` package)  
**Acceptance:** Assessor enters SQL Server creds in browser; workbench confirms 16 tables present  

---

### Slice D — Lane Contract Review

**Scope:** Step 3 lane card grid; confirmation + override workflow  
**Input:** `HARRIS_PACS_SOURCE_PACK.md` parsed into data (or structured JSON),
SQL Server queries from APPLYING_HARRIS_PACS_PACK Steps 5–7  
**Output:** `{county}-overrides.md` if any overrides recorded  
**New backend code:** PACS confirmation query runner  
**Acceptance:** Assessor can confirm or override each lane; override text is saved  

---

### Slice E — Lane Mapping Grid + Excel I/O

**Scope:** Step 4 mapping grid; AI proposes, human approves; Export/Import Excel  
**Input:** Promoter field mappings (backend), PACS INFORMATION_SCHEMA  
**Output:** Approved `{county}-lane-mapping.json`  
**New backend code:** Mapping grid endpoint; Excel export/import via `exceljs`  
**Acceptance:** Operator edits in Excel; imports back; NEEDS_REVIEW rows cleared before proceed  

---

### Slice F — Quarantine Review Surface

**Scope:** Step 6 grouped quarantine disposition workflow  
**Input:** `GET /api/sync/doctrine/policy/quarantine/imprv-attr/profile` (SYNC-DOCTRINE-4-V7),
equivalent endpoints for other lanes  
**Output:** `{county}-quarantine-disposition.md`  
**New backend code:** Quarantine profiler endpoints for owner, land, sales lanes  
**Acceptance:** All quarantine reasons have an approved disposition before Step 7 unlocks  

---

### Slice G — Evidence Packet Export

**Scope:** Step 7 evidence packet generation and commit gate  
**Input:** Lane contracts, seal-check results, quarantine disposition, readback template  
**Output:** `docs/sync/seals/{county}-current-year-spine-seal-packet.md`  
**New backend code:** Packet template renderer  
**Acceptance:** Evidence packet matches Doctrine §8 shape; human must edit handoff statement  

---

## 13. Deferred Workbench Items

| Item | Deferred to | Reason |
|------|------------|--------|
| Active-supplement profiler UI (Backlog #4) | Workbench V2 | Profiler tool not yet built; workbench can drive it once the SQL tool exists |
| Lane contract template machine-readable format (Backlog #5) | Workbench V2 | Slice D (Step 3) can consume Markdown today; structured format enables better automation |
| Readback set generator (Backlog #7) | Workbench V2 | Evidence packet in Slice G uses manual readback set for V1 |
| Evidence packet generator (Backlog #8) | Slice G above | Planned in V1 |
| Multi-county session management | Workbench V2 | Single county per session for V1 |
| Historical lane sealing flow | Separate workstream | Deferred per Doctrine §10 |

---

## 14. Relation to Proven Engine

Every screen calls a proven tool. Nothing in the workbench invents new engine logic.

| Workbench screen | Proven engine artifact |
|-----------------|----------------------|
| Doctor dashboard | `tf-sync-doctor.mjs` · `harris-pacs-pack-validator.sql` · `identity-drift-detector.sql` · `seal-check-runner.sql` · `domain-coverage-audit.sql` |
| Domain coverage | `domain-coverage-audit.sql` |
| Source connection | SQL Server INFORMATION_SCHEMA (APPLYING_HARRIS_PACS_PACK Steps 1–2) |
| Pack review | `HARRIS_PACS_SOURCE_PACK.md` + APPLYING_HARRIS_PACS_PACK Steps 5–7 |
| Lane mapping | Promoter field contracts (backend) |
| Dry run | Drain endpoints (backend) |
| Quarantine review | `GET /api/sync/doctrine/policy/quarantine/imprv-attr/profile` |
| Commit + evidence | `tf-sync-doctor.mjs` · `seal-check-runner.sql` · evidence template |

---

_The Benton engine proof paid for three weeks of discovery.  
The workbench is how that discovery becomes a two-day county onboarding._  
_Do not build UI before confirming this spec. Confirm this spec before opening Slice A._

---

**Last Updated**: 2026-06-08  
**Version**: 1.0  
**Status**: DESIGN — no implementation started
