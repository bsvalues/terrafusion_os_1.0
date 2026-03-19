# Benton Demo Golden Journeys — 2026-03-19

**Charter**: Benton County Onsite Production Demo Charter
**Day**: Day 3 — Benton Golden Journeys (Primary)
**Branch**: main / HEAD: 87836f51f (Day 2 seal)
**Lane Owner**: L3 Demo Flow Reliability (@tf-writer / read-verify run)

---

## Verdict: 5/5 PRIMARY JOURNEYS PASS ✅

No blocker-grade defect open. All assessor journeys execute under Benton county context with correct trace correlation and clean fallback behavior.

---

## Journey Pass Matrix

| # | Journey | Tools Exercised | Mode | Result | Evidence |
|---|---------|----------------|------|--------|----------|
| J1 | Parcel Case Summary | `summarize_parcel_casefile`, `explain_senior_exemption_impact` | Muse read_only | ✅ PASS | phase85 |
| J2 | Value Trend + Model Inputs | `compare_assessed_value_history`, `explain_model_inputs` | Muse read_only | ✅ PASS | phase85 |
| J3 | Sales Comparison / IAAO Ratio | `summarize_sales_comps_rationale`, `summarize_levy_rate_components` | Muse read_only | ✅ PASS | phase85 |
| J4 | BOE Appeal Assembly | `assemble_boe_packet`, `draft_boe_appeal_response` | Pilot write_high | ✅ PASS | c3 golden + phase85 |
| J5 | Assessment Notice Drafting | `draft_value_change_notice`, `add_dossier_note` | Muse write_low | ✅ PASS | phase85 |

---

## Journey Detail

### J1 — Parcel Case Summary (Muse Read-Only)

**Purpose**: Assessor opens a Benton parcel and gets an AI-generated case summary and exemption impact analysis.

**Tools**:
- `summarize_parcel_casefile` — returns structured summary with `payloadRef`; PII scrubbed
- `explain_senior_exemption_impact` — returns exemption summary with trace event

**Evidence**:
```
✔ summarize_parcel_casefile returns payloadRef and no PII           (phase85)
✔ summarize_parcel_casefile rejects county mismatch                 (phase85)
✔ explain_senior_exemption_impact returns summary and trace         (phase85)
✔ explain_senior_exemption_impact rejects county mismatch           (phase85)
```

**Trace correlation**: `summarize_parcel_casefile` emits `payloadRef` in trace event ✅ (phase86: `emits payloadRef in trace for payload_ref tools`)

---

### J2 — Value Trend + Model Inputs (Muse Read-Only)

**Purpose**: Assessor reviews the valuation history trend and the model's input factors for a parcel — explains "why this value."

**Tools**:
- `compare_assessed_value_history` — returns year-over-year trend sorted by assessment year
- `explain_model_inputs` — returns model inputs sorted by weight; no raw PII values in output

**Evidence**:
```
✔ compare_assessed_value_history returns sorted trend               (phase85)
✔ compare_assessed_value_history rejects county mismatch            (phase85)
✔ explain_model_inputs returns sorted inputs without raw values     (phase85)
✔ explain_model_inputs rejects county mismatch                      (phase85)
```

**Gate fallback behavior**: `run_valuation_model` (write_high) requires supervisor confirmation + reason code. Without them, gate blocks cleanly — `CONFIRMATION_REQUIRED` errorCode returned (not 500):
```
✔ run_valuation_model negative fixture is blocked with expectedErrorCode  (c3 golden)
```

**Forge execution backing** (valuation model runtime):
```
forge-batchcost-contract:        54/54 ✅
forge-modelapplication-contract: 70/70 ✅
forge-reconciliation-contract:   30/30 ✅
```

---

### J3 — Sales Comparison / IAAO Ratio (Muse Read-Only)

**Purpose**: Assessor pulls comparable sales and levy rate breakdown for an IAAO ratio study or equalization review.

**Tools**:
- `summarize_sales_comps_rationale` — returns comps sorted by similarity score
- `summarize_levy_rate_components` — returns levy components sorted by rate, with total

**Evidence**:
```
✔ summarize_sales_comps_rationale returns comps sorted by similarity    (phase85)
✔ summarize_sales_comps_rationale rejects county mismatch               (phase85)
✔ summarize_levy_rate_components returns sorted components and total    (phase85)
✔ summarize_levy_rate_components rejects county mismatch                (phase85)
```

---

### J4 — BOE Appeal Assembly (Pilot Write-High)

**Purpose**: Assessor or supervisor assembles a Board of Equalization appeal packet for a contested parcel — the highest-stakes demo operation.

**Tools**:
- `assemble_boe_packet` — write_high gate; requires supervisor confirmation + reason code
- `draft_boe_appeal_response` — write_low; drafts the county's position statement

**Evidence (golden fixture contract)**:
```
✔ assemble_boe_packet produces the exact golden response             (c3 golden — exact shape match)
✔ assemble_boe_packet negative fixture is blocked with expectedErrorCode  (c3 golden)
✔ draft_boe_appeal_response respects position and payloadRef        (phase85)
✔ draft_boe_appeal_response rejects county mismatch                 (phase85)
```

**Trace evidence** (D1 audit chain):
```
✔ assemble_boe_packet blocked → trace has correlationId, toolId, errorCode, userId, countyId  (d1)
✔ blocked write emits audit-complete trace event                    (d1)
✔ governance-blocked → decision: "blocked"                          (d1)
✔ successful execution → decision: "allowed"                        (d1)
✔ two blocked writes produce separate correlationIds               (d1)
✔ exportNDJSON with auditFormat=true yields parseable audit records (d1)
```

---

### J5 — Assessment Notice Drafting (Muse Write-Low + Pilot)

**Purpose**: Assessor drafts an assessment change notice and adds a dossier note to the case file.

**Tools**:
- `draft_value_change_notice` — write_low; returns required sections (`summary`, `legal_basis`, `appeal_rights`) + `payloadRef`
- `add_dossier_note` — pilot mode; appends note to dossier, sanitizes content, rejects overwrite attempts

**Evidence**:
```
✔ draft_value_change_notice returns required sections and payloadRef    (phase85)
✔ draft_value_change_notice rejects county mismatch                    (phase85)
✔ add_dossier_note appends and sanitizes                               (phase85)
✔ add_dossier_note rejects overwrite attempts                          (phase85)
```

---

## Trace Correlation Verification

All demo journeys produce traceable, correlated audit chains:

| Trace Behavior | Status |
|---------------|--------|
| Blocked write emits `correlationId`, `toolId`, `errorCode`, `userId`, `countyId` in trace | ✅ |
| Successful execution → decision `"allowed"` in trace | ✅ |
| Blocked execution → decision `"blocked"` in trace | ✅ |
| Handler error → decision `"failed"` in trace | ✅ |
| Each operation produces independent trace chain with unique `correlationId` | ✅ |
| NDJSON export with `auditFormat=true` yields parseable audit records | ✅ |
| `search_trace_by_correlation` returns metadata-only (no raw payloads) | ✅ |
| `request_trace_redaction` golden response exact match | ✅ |
| Payload-sensitive tools emit `payloadRef` (not raw payload) in trace | ✅ |

---

## Fallback Behavior Verification

| Scenario | Expected Fallback | Status |
|----------|------------------|--------|
| Write gate without confirmation/reasonCode | Blocked — `CONFIRMATION_REQUIRED` (not 500) | ✅ |
| Cross-county tool invocation | `COUNTY_MISMATCH` error (not 500) | ✅ |
| Muse tool called under pilot context | `MODE_DENIED` error | ✅ |
| Unknown toolId | `TOOL_NOT_FOUND` (not 500) | ✅ |
| Tool outside caller's office scope | `OFFICE_SCOPE_DENIED` | ✅ |
| `add_dossier_note` overwrite attempt | Rejected with error | ✅ |
| Positional args to `ToolRunner.execute` | Fails safely, no handler reached | ✅ |

---

## Command Wall — Post-Day 3

| Command | Result |
|---------|--------|
| `npx tsc -p tsconfig.core.json --noEmit` | ✅ 0 errors |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | ✅ 56/56 |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | ✅ 22/22 |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | ✅ 9/9 |
| `node --test os-platform/core/tests/c3-golden-fixture-contracts.test.mjs` | ✅ 11/11 |
| `node --test os-platform/core/tests/d1-trace-evidence-export.test.mjs` | ✅ 10/10 |
| `node --test os-platform/core/tests/forge-batchcost-contract.test.mjs` | ✅ 54/54 |
| `node --test os-platform/core/tests/forge-modelapplication-contract.test.mjs` | ✅ 70/70 |
| `node --test os-platform/core/tests/forge-reconciliation-contract.test.mjs` | ✅ 30/30 |

**Total new test evidence this day**: 232 tests across 9 suites — all pass.

No code changes required. This is a **verify and document** lane.

---

## Day 3 Exit Criteria Checklist

- [x] 5/5 primary journeys pass
- [x] No blocker-grade defect open
- [x] Trace correlation verified end-to-end (correlationId, decision, NDJSON export)
- [x] User-facing fallback behavior verified for all failure modes
- [x] BENTON_DEMO_GOLDEN_JOURNEYS artifact published

**Day 3 verdict: COMPLETE — GO for Day 4 (Secondary Journeys + Recovery)**
