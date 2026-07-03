# P5 — TerraPilot Tool Maturity

**Program:** P5  
**Status:** ACTIVE  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-07-03

---

## Goal

Prevent "manifest green" from being mistaken for live product capability. TerraPilot exposes AI tools to assessors. A tool that is manifest-registered but not backend-integrated is NOT a working tool. This program establishes a maturity ladder, enforces honest disclosure, and makes promotion evidence explicit before any live/backend-integrated claim.

---

## Maturity Ladder

Every TerraPilot tool must be classified at one of these levels:

| Level | Label | Meaning |
|-------|-------|---------|
| L0 | Declared | In manifest only; no handler |
| L1 | Runnable | Handler exists; no backend integration |
| L2 | Contract-covered | Handler + schema contract; integration spec written |
| L3 | Live-integrated | Handler calls real backend API; response is real data |
| L4 | Promoted | Tested, evidence-backed, operator-approved for use |

A tool at L1 must be disclosed as "not yet integrated" in any UI and in any operator-facing doc.

---

## Work Orders (Ordered)

| WO | Title | Status | Description |
|----|-------|--------|-------------|
| WO-TERRAPILOT-P1 | Tool maturity matrix | **DONE/PARTIAL** | Enumerate all manifest-registered tools; assign current maturity level |
| WO-TERRAPILOT-P2 | Promotion protocol | **COMPLETE IN PR** | Define the formal promotion gate from L1/stub-contract to L3/backend-integrated and L4/promoted |
| WO-TERRAPILOT-P3 | Maturity metadata enforcement review | **COMPLETE IN PR** | Inspect whether machine-readable maturity metadata exists and where enforcement should live |
| WO-TERRAPILOT-P4 | Stub-to-live promotion candidate queue | **COMPLETE IN PR** | Identify first promotion candidates without promoting them |
| WO-TERRAPILOT-P5 | Handler / manifest / maturity parity evidence | **COMPLETE IN PR** | Prove handler parity and current maturity state from manifest and handlers |
| WO-TERRAPILOT-P6 | Tooling operator packet | **COMPLETE IN PR** | Package operator rules for future TerraPilot maturity work |
| WO-TERRAPILOT-P7 | Evidence rollup | **COMPLETE IN PR** | Roll up P2-P6 evidence and stop before live promotion |
| WO-TERRAPILOT-P8 | Maturity metadata enforcement | **COMPLETE IN PR** | Add machine-readable maturity metadata and focused tests without promoting tools |
| WO-TERRAPILOT-P9 | First promotion candidate decision | **COMPLETE IN PR** | Decide whether a separate runtime WO may attempt the first L2/L3 candidate |
| WO-TERRAPILOT-P10 | Contract-covered candidate evidence packet | **COMPLETE IN PR** | Document contract, owner, backing target, auth boundary, verification method, trace requirement, UI disclosure, and rollback path for the first candidate |
| WO-TERRAPILOT-P11 | Contract-covered metadata decision | **COMPLETE IN PR** | Decide whether P10 evidence is sufficient to justify a follow-up `contract-covered` metadata-change packet, without mutating metadata or claiming live integration |
| WO-TERRAPILOT-P12 | Contract-covered metadata change authorization packet | **COMPLETE IN PR** | Record the owner-decision packet for whether to authorize the actual L1/stub-contract to L2/contract-covered metadata change while keeping `liveIntegration: false` |
| WO-TERRAPILOT-P13 | Contract-covered metadata change | **COMPLETE IN PR** | Update only `summarize_levy_rate_components` maturity metadata and supporting evidence/routing docs |
| WO-TERRAPILOT-P14 | Contract-covered metadata stop-gate rollup | **NEXT — EVIDENCE/GOVERNANCE ONLY** | Close the L2 metadata chain and record the stop wall before live/backend integration |

---

## WO-TERRAPILOT-P2 Definition

**Goal:** Write the formal protocol for promoting a TerraPilot tool from declared to live-integrated. The protocol defines: required evidence at each level, the review step, the operator approval gate at L3→L4, and the disclosure rule for L0/L1 tools.

**Outputs:**
- `docs/brain/workorders/programs/terrapilot-promotion-protocol.md`

---

## Dependency Chain

```
P1 (partial) -> P2 -> P3 -> P4 -> P5 -> P6 -> P7 -> P8 -> P9 decision -> P10 evidence packet -> P11 metadata decision -> P12 metadata authorization -> P13 metadata change -> P14 stop-gate rollup -> stop before live/backend integration
```

P2-P7 are governance/evidence work. Any actual stub-to-live promotion is a separate runtime work
order because it changes tool behavior and may require deployment, auth, secrets, or county data
decisions.

P8 adds enforcement metadata and static tests only. It does not move any tool to `backend-integrated`
or `promoted`.

P10 records candidate evidence only. P11 records that `summarize_levy_rate_components` remains a
candidate for `contract-covered`, but it does not change maturity metadata. P12 records the owner
authorization packet for any actual metadata change. P13 applies only the owner-authorized L2 /
`contract-covered` metadata change. All TerraPilot maturity work must still stop before
`backend-integrated`, `liveIntegration: true`, or `promoted` unless a separate operator-authorized
runtime work order exists. P14 is evidence/governance only and must not implement live/backend
integration.

---

## Stop Conditions

- If maturity metadata cannot be enforced without runtime changes, stop and record the gap.
- If a promotion candidate requires backend, auth, secrets, county data, PACS, live DB, deployment, or runtime behavior changes, stop before implementation.
- Do not claim TerraPilot is "functional" until at least one tool reaches L4.

---

## Disclosure Rule

Until a future operator-authorized implementation WO produces an L3/L4 tool:
- TerraPilot must be disclosed as "tool layer in development" in all demo scripts
- No demo should show TerraPilot as a working AI assistant without a live-integrated tool
