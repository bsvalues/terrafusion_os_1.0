# Gold Scorecard — PR #246

## Tier-1 UI/UX DoD — Convergence Validation

**Version:** 1.0  
**Status:** Active  
**Created:** 2026-02-12  
**Related:** [GOLD_EXEMPLAR_SCORECARD.md](GOLD_EXEMPLAR_SCORECARD.md) (baseline) · [TIER1_EVIDENCE_EXAMPLES.md](TIER1_EVIDENCE_EXAMPLES.md) (calibration) · [GOLD_SCORECARD_PR_247.md](GOLD_SCORECARD_PR_247.md) (sibling)

---

## Purpose

Convergence validation artifact. Third scorecard in the series (after PR #258 exemplar and PR #247 sibling). Together, the three scorecards demonstrate that the A–F rubric converges: same evidence quality → same scores, different write-path status → correctly different D score.

---

## Scored PR

| Field | Value |
|-------|-------|
| **PR** | [#246](https://github.com/bsvalues/terrafusion_os_1.0/pull/246) |
| **Title** | feat(ui): PropertyForge MWUX slice with explain_model_results tool |
| **Merged** | 2026-02-05 |
| **Scope** | TerraForge valuation analysis · explain_model_results tool · correlationId UX |
| **Classification** | MWUX Slice (Tier-1 UI, read-only tool) |
| **Entry path** | Workbench → Property Forge tab |
| **3-click path** | Parcel → Forge → Explain Valuation |
| **Write/commit** | **No** — `explain_model_results` is `read_only` |
| **Changed files** | 3 (component + tests + shared) |
| **Additions** | 792 |
| **Tests cited** | 14 new tests · 34/34 workbench tests pass |

---

## A–F Scores

### A) Correlation ID (CID) — PASS WITH NOTES

**Evidence present:**
- PR body: *"CorrelationId UX with copy button + invocation history (last 10)"*
- Code: `invokeTool()` response `.correlationId` propagated into component state
- Code: CID displayed in results panel (truncated to 16 chars + `...`) with copy button (`aria-label='Copy correlation ID'`)
- Code: Network errors generate client-side CID with `net-` prefix (`net-${crypto.randomUUID().slice(0,8)}`)
- Code: `ErrorDisplay` component receives CID via `correlationId` prop
- Tests: `corr-forge-abc123` (success), `corr-forge-error-789` (tool error), `net-*` (network error) — all verified visible in DOM

**What's missing (v1 baseline gap):**
- No **specific CID value** pasted in PR body
- No screenshot showing CID in the rendered UI
- No backend log snippet showing the same CID

**Ruling:** Identical CID infrastructure to PR #247 and PR #258. Real, propagated, displayed, copyable, tested. Gap is **presentation**.

---

### B) Trace / Causal Chain — PASS WITH NOTES

**Evidence present:**
- PR body: *"Invocation history (last 10)"*
- Code: `InvocationHistory` component renders last 10 records with `toolId`, `status`, `correlationId`, `timestamp`, `errorCode`, `meta` (year, audience)
- Code: Each invocation (success, tool error, network error) pushes structured `InvocationRecord` to history
- Code: Dev mode reveals trace query hint: `pnpm run trace:query --correlation {correlationId}`
- Tests: History tracking test verifies `explain_model_results` appears with CID + copy button

**What's missing (v1 baseline gap):**
- No trace screenshot or exported span in PR body
- History is component-local, not OS-layer causal chain
- No end-to-end CID → backend trace → result demonstration

**Ruling:** Same pattern as PR #247. Local invocation history provides trace surface. Gap is **depth** — local vs. OS-layer.

---

### C) Metrics (Latency + Errors) — PASS WITH NOTES

**Evidence present:**
- Code: Error states surfaced via `ErrorDisplay` with `errorCode` + `message` + `correlationId`
- Code: Three error paths handled: tool error (structured), network error (catch), parse error (fallback)
- Tests: Error scenarios tested (tool error `MODEL_NOT_FOUND`, network error `Failed to fetch`) with correct messages and CID display
- Code: Model confidence score displayed (`Math.round(value * 100)%`) — not latency, but a measurable metric
- PR body: *"workbench tests: 34/34 ✓"*

**What's missing (v1 baseline gap):**
- No `durationMs` field captured (latency not measured)
- No specific latency measurement for "Click Explain Valuation → result displayed"
- No "no console errors" evidence
- Model confidence is a domain metric, not a performance metric

**Ruling:** Error handling is thorough. Confidence display shows the component handles real numeric data. Latency measurement absent. Same gap profile as PR #247.

---

### D) Receipt Artifact — N/A

**Ruling:** `explain_model_results` is a **read-only** tool invocation. No data is written or committed. Receipt artifact is **not required**.

**Convergence note:** Same ruling as PR #247, correctly different from PR #258 (which had a write path). The rubric consistently distinguishes read-only from write paths.

---

### E) "Defend Readiness" Proof — PASS WITH NOTES

**Evidence present:**
- **What changed?** — PR body: tax year selector, audience selector (internal/taxpayer), year-over-year comparison toggle, `explain_model_results` tool invocation, value drivers display, confidence score, correlationId UX, ErrorDisplay, invocation history
- **Why was it allowed?** — Read-only tool, no state mutation, policy enforcement inherited from `invokeTool()` dispatch layer
- **Where is proof?** — 14 new tests enumerated, 34/34 total workbench tests, build GREEN
- **Can we replay/verify later?** — Invocation history (last 10), dev mode trace query hint, CID in every response

**What's missing (v1 baseline gap):**
- No CID → trace → result chain demonstrated end-to-end
- No link to a specific historical invocation

**Ruling:** Clear defend story. Same presentation gap as PR #258 and PR #247.

---

### F) UI Integrity (Not a Shell) — PASS WITH NOTES

**Evidence present:**
- Code: Full state machine (`idle` → `loading` → `success` | `error`)
- Code: Tax year selector (5 years dynamically generated)
- Code: Audience selector with descriptions (Internal Review / Taxpayer-Friendly)
- Code: Year-over-year comparison toggle with conditional compare-year selector
- Code: Value drivers display with positive/negative color coding (`+$12,000` green, `-$5,000` red)
- Code: Confidence score formatting (`87%`)
- Code: Currency formatting (`$325,000`)
- Code: Loading spinner with `role='status'` (accessibility)
- Code: `ParcelContextHeader` with real parcel ID
- Tests: Rendering tests verify real content (parcel ID, controls, labels)
- Tests: Tool invocation tests verify state transitions with parsed financial data ($325,000, market trends, drivers)
- Tests: Comparison mode test verifies `compareToYear` param included in tool call
- Tests: Value display tests verify drivers, confidence rendering

**What's missing (v1 baseline gap):**
- No screenshot or gif in PR body
- No keyboard/focus evidence

**Ruling:** This is real UI with real financial data parsing, conditional rendering, and domain-specific formatting — not a shell. More domain complexity than PR #247 (multiple selectors, comparison mode, value drivers, confidence). Same visual evidence gap.

---

## Score Summary

| Section | Score | Gap Type |
|---------|-------|----------|
| **A** CID | PASS WITH NOTES | PR presentation (no concrete CID pasted) |
| **B** Trace | PASS WITH NOTES | Depth (local history vs. OS-layer trace) |
| **C** Metrics | PASS WITH NOTES | Latency instrumentation absent |
| **D** Receipt | **N/A** | Read-only tool — no write path |
| **E** Defend | PASS WITH NOTES | PR presentation (chain claimed, not shown) |
| **F** UI Integrity | PASS WITH NOTES | PR presentation (no screenshot/gif) |

**Overall: PASS WITH NOTES (5/6) · N/A (1/6)**

---

## Convergence Analysis

### Three-Way Convergence (PR #258 · PR #247 · PR #246)

| Section | PR #258 | PR #247 | PR #246 | Convergent? |
|---------|---------|---------|---------|-------------|
| **A** CID | PASS WITH NOTES | PASS WITH NOTES | PASS WITH NOTES | ✅ 3/3 same |
| **B** Trace | PASS WITH NOTES | PASS WITH NOTES | PASS WITH NOTES | ✅ 3/3 same |
| **C** Metrics | PASS WITH NOTES | PASS WITH NOTES | PASS WITH NOTES | ✅ 3/3 same |
| **D** Receipt | **FAIL** | **N/A** | **N/A** | ✅ Correctly split — write vs. read-only |
| **E** Defend | PASS WITH NOTES | PASS WITH NOTES | PASS WITH NOTES | ✅ 3/3 same |
| **F** UI Integrity | PASS WITH NOTES | PASS WITH NOTES | PASS WITH NOTES | ✅ 3/3 same |

**Convergence result: 6/6 sections converge across all three PRs.**

### What this proves

1. **Stability:** Same evidence quality → same score. No reviewer drift.
2. **Discrimination:** The write-path test (Section D) correctly produces different outcomes based on PR content, not reviewer opinion.
3. **Consistency:** Gap types are identical across same-era PRs — all presentation gaps, all traceable to "shipped before DoD."
4. **Mechanical:** A different reviewer applying the same rubric would reach the same conclusions. Disputes collapse to rule lookup, not judgment calls.

---

## Baseline Rulings Applied

All baseline rulings from [GOLD_EXEMPLAR_SCORECARD.md](GOLD_EXEMPLAR_SCORECARD.md) apply identically:

- **Acceptable for v1 baseline:** PR presentation gaps (A, B, E, F), metrics as infrastructure (C)
- **Not acceptable going forward:** Concrete CID in PR body, trace screenshot, one latency measurement, screenshot/gif of UI

---

**Government. Transcended. Converged. Validated.**
