# WS-1 Parity Threshold — Assessor Decision Sheet (one page)

**Purpose:** approve the WS-1 shadow-parity gating thresholds. The surface is reduced to **4
decisions**. Everything else is settled. `Forge:Engine` stays **Shadow**; nothing goes authoritative
on this sheet. Until the blanks are filled, the run stays **ungated** (cannot claim a G1 pass).

---

## Already settled — no decision needed
- **RP-5 supplement round-trip** = exact `SourceXref` lineage (no tolerance; exact match, no history loss).
- **Quality method** = IAAO ratio statistics (median / COD / PRD) — already built and tested.

## Decision 0 — Adopt IAAO calibration thresholds? (defaults prefilled)
These are the published IAAO ranges your methodology already follows (CASE_002 FR-3). Confirm or edit.
| Metric | Proposed default | Adopt? (Y/N) | County value if different |
|--------|------------------|-------------|---------------------------|
| Level of assessment (median) | **0.90 – 1.10** | ☐ | __________ |
| COD (uniformity) ceiling | **≤ 15** (≤ 10 homogeneous residential) | ☐ | __________ |
| PRD (vertical equity) | **0.98 – 1.03** | ☐ | __________ |

## Decision 1 (D1) — Value-parity tolerance ± % per class (RP-1 cost / RP-2 land / RP-3 reconciled)
*No default — county judgment. "How close must the TF value be to PACS to count as passing?"*
| Property class | RP-1 Cost ± % | RP-2 Land ± % | RP-3 Reconciled ± % |
|----------------|--------------|--------------|---------------------|
| Residential | ______ | ______ | ______ |
| Commercial | ______ | ______ | ______ |
| Ag / current-use | ______ | ______ | ______ |
| Exempt / special | ______ | ______ | ______ |

## Decision 2 (D2) — Minimum sample pass rate for G1
*What % of the sample must be within tolerance to accept the gate?* (IAAO ratio studies commonly target 90 %+ — reference only, not prefilled.)
> **Pass rate = __________ %**

## Decision 3 (D3) — Income approach (RP-6)
- D3a Income value-parity tolerance: **± __________ %**
- D3b RP-6 comparison study (source/name/year): **__________________________**

---

**Sign-off**
| Role | Name | Date |
|------|------|------|
| Assessor / county | | |
| Engineering lead | | |

*Once returned: Decision 0 → `Forge:Calibration`; D1/D2/D3 → `Forge:Parity` (`WS1_PARITY_CONFIG_PROPOSAL.md`).
The run then gates automatically — no code change. Blanks left empty stay ungated for that gate.*
