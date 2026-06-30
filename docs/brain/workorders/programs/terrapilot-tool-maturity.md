# P5 — TerraPilot Tool Maturity

**Program:** P5  
**Status:** ACTIVE  
**Owner:** Operator (bsvalues@gmail.com)  
**Last Updated:** 2026-06-30

---

## Goal

Prevent "manifest green" from being mistaken for live product capability. TerraPilot exposes AI tools to assessors. A tool that is manifest-registered but not backend-integrated is NOT a working tool. This program establishes a maturity ladder, enforces honest disclosure, and promotes exactly one real integrated tool before claiming TerraPilot is "working."

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
| WO-TERRAPILOT-P2 | Promotion protocol | **NEXT** | Define the formal promotion gate from L1→L4; write the protocol doc |
| WO-TERRAPILOT-P3 | Handler parity audit | QUEUED | Verify every manifest tool has a handler (no missing handlers → L0 items) |
| WO-TERRAPILOT-P4 | Stub disclosure UI / internal diagnostics | QUEUED | Add maturity badge to tool manifest; surface L0/L1 tools as "not yet available" in UI |
| WO-TERRAPILOT-P5 | First real backend-integrated tool | QUEUED | Promote one tool from L1 to L3 with real API integration and evidence |
| WO-TERRAPILOT-P6 | Tool promotion evidence rollup | QUEUED | Produce final maturity state doc for all tools; sign off on L4 promotions |

---

## WO-TERRAPILOT-P2 Definition

**Goal:** Write the formal protocol for promoting a TerraPilot tool from declared to live-integrated. The protocol defines: required evidence at each level, the review step, the operator approval gate at L3→L4, and the disclosure rule for L0/L1 tools.

**Outputs:**
- `docs/brain/workorders/programs/terrapilot-promotion-protocol.md`

---

## Dependency Chain

```
P1 (partial) → P2 → P3 → P4 → P5 → P6
```

P3 can begin while P2 is in progress (handler audit doesn't require the protocol doc). P5 requires P2+P3+P4.

---

## Stop Conditions

- If P1 audit finds 0 tools at L2+, treat TerraPilot as alpha/stub — update all docs accordingly before P5
- Do not claim TerraPilot is "functional" until at least one tool reaches L4

---

## Disclosure Rule

Until WO-TERRAPILOT-P5 produces an L3 tool:
- TerraPilot must be disclosed as "tool layer in development" in all demo scripts
- No demo should show TerraPilot as a working AI assistant without a live-integrated tool
