# Gold Scorecard — PR #247

## Tier-1 UI/UX DoD — Convergence Validation

**Version:** 1.0  
**Status:** Active  
**Created:** 2026-02-12  
**Related:** [GOLD_EXEMPLAR_SCORECARD.md](GOLD_EXEMPLAR_SCORECARD.md) (baseline) · [TIER1_EVIDENCE_EXAMPLES.md](TIER1_EVIDENCE_EXAMPLES.md) (calibration) · [GOLD_SCORECARD_PR_246.md](GOLD_SCORECARD_PR_246.md) (sibling)

---

## Purpose

Convergence validation artifact. This scorecard proves the A–F rubric produces **stable, reproducible results** across different PRs with comparable evidence depth. Scored identically to the [Gold Exemplar (PR #258)](GOLD_EXEMPLAR_SCORECARD.md) — same method, same reviewer, same rules.

---

## Scored PR

| Field | Value |
|-------|-------|
| **PR** | [#247](https://github.com/bsvalues/terrafusion_os_1.0/pull/247) |
| **Title** | feat(ui): PropertyDais MWUX slice with check_cert_status tool |
| **Merged** | 2026-02-05 |
| **Scope** | TerraDais workflow orchestration · check_cert_status tool · correlationId UX |
| **Classification** | MWUX Slice (Tier-1 UI, read-only tool) |
| **Entry path** | Workbench → Property Dais tab |
| **3-click path** | Parcel → Dais → Check Status |
| **Write/commit** | **No** — `check_cert_status` is `read_only` |
| **Changed files** | 2 (component + tests) |
| **Additions** | 713 |
| **Tests cited** | 11 new tests · 45/45 workbench tests pass |

---

## A–F Scores

### A) Correlation ID (CID) — PASS WITH NOTES

**Evidence present:**
- PR body: *"Full correlationId UX with ErrorDisplay"*
- Code: `invokeTool()` response `.correlationId` propagated into component state
- Code: CID displayed in results panel (truncated to 16 chars + `...`) with copy button (`aria-label='Copy correlation ID'`)
- Code: Network errors generate client-side CID with `net-` prefix (`net-${crypto.randomUUID().slice(0,8)}`)
- Code: `ErrorDisplay` component receives CID via `correlationId` prop
- Tests: `corr-dais-abc123` (success), `corr-dais-error-789` (tool error), `net-*` (network error) — all verified visible in DOM

**What's missing (v1 baseline gap):**
- No **specific CID value** pasted in PR body (only "correlationId UX" claimed)
- No screenshot showing CID in the rendered UI
- No backend log snippet showing the same CID

**Ruling:** Same infrastructure pattern as PR #258. CID is real, propagated, displayed, copyable, and tested. Gap is **presentation** — no concrete CID example in PR body.

---

### B) Trace / Causal Chain — PASS WITH NOTES

**Evidence present:**
- PR body: *"Status check history tracking (last 10)"*
- Code: `InvocationHistory` component renders last 10 invocation records with `toolId`, `status`, `correlationId`, `timestamp`, `errorCode`, `meta`
- Code: Each invocation (success, tool error, network error) pushes a structured `InvocationRecord` to history
- Code: Dev mode reveals trace query hint: `pnpm run trace:query --correlation {correlationId}`
- Tests: History tracking test verifies `check_cert_status` appears in history with CID + copy button

**What's missing (v1 baseline gap):**
- No trace screenshot or exported span in PR body
- History is local component state, not a backend causal chain
- No end-to-end CID → backend trace → result demonstration

**Ruling:** Component-level invocation history provides a trace surface. The trace infrastructure from PR #258 (`ActionStreamModule`, `telemetrySink`) is available at the OS layer but not explicitly wired in the per-tab MWUX pattern. Gap is **depth** — local history vs. OS-layer causal chain.

---

### C) Metrics (Latency + Errors) — PASS WITH NOTES

**Evidence present:**
- Code: Error states surfaced via `ErrorDisplay` with `errorCode` + `message` + `correlationId`
- Code: Three error paths handled: tool error (structured), network error (catch), parse error (fallback)
- Tests: Error scenarios tested (tool error, network error) with correct error messages and CID display
- PR body: *"Tests: 45/45 workbench tests pass"*

**What's missing (v1 baseline gap):**
- No `durationMs` field captured in component (latency not measured)
- No specific latency measurement for "Click Check Status → result displayed"
- No "no console errors" evidence
- No error counter or rate

**Ruling:** Error handling is thorough (3 error paths, all tested). Latency measurement is absent at the component level. Less depth than PR #258 (which had `durationMs` in trace payloads). Gap is **latency instrumentation** — errors are well-covered, timing is not.

---

### D) Receipt Artifact — N/A

**Ruling:** `check_cert_status` is a **read-only** tool invocation. No data is written or committed. Receipt artifact is **not required** per the DoD checklist ("Non-Negotiable for Write/Commit" — Section D applies only to write paths).

**Note:** This is the correct outcome — the rubric correctly distinguishes read-only vs. write paths. PR #258 was FAIL because it shipped Policy Export/Import (a write path) without receipt evidence. PR #247 has no write path, so N/A is the stable ruling.

---

### E) "Defend Readiness" Proof — PASS WITH NOTES

**Evidence present:**
- **What changed?** — PR body: workflow type selector, `check_cert_status` tool invocation, status result display, workflow steps, assignment info, correlationId UX, ErrorDisplay, invocation history
- **Why was it allowed?** — Read-only tool, no state mutation, policy enforcement inherited from `invokeTool()` dispatch layer
- **Where is proof?** — 11 new tests enumerated, 45/45 total workbench tests, build GREEN
- **Can we replay/verify later?** — Invocation history (last 10), dev mode trace query hint, CID in every response

**What's missing (v1 baseline gap):**
- No CID → trace → result chain demonstrated end-to-end in PR body
- No link to a specific historical invocation a third party could pull

**Ruling:** The defend story is clear and well-structured. Same presentation gap as PR #258 — the infrastructure supports replay, but the PR doesn't demonstrate it.

---

### F) UI Integrity (Not a Shell) — PASS WITH NOTES

**Evidence present:**
- Code: Full state machine (`idle` → `loading` → `success` | `error`)
- Code: Workflow type selector with 4 options (certification, appeal, exemption, review)
- Code: Dynamic workflow step visualization (completed ✅, current 🔄, pending ⏳)
- Code: Assignment info (assignedTo, dueDate) with conditional rendering
- Code: Loading spinner with `role='status'` (accessibility)
- Code: `ParcelContextHeader` shows real parcel ID
- Tests: Rendering tests verify real content (parcel ID, controls, labels)
- Tests: Tool invocation tests verify real state transitions (idle → loading → success with parsed data)
- Tests: Status display tests verify workflow steps, assignee, due date rendering

**What's missing (v1 baseline gap):**
- No screenshot or gif in PR body showing the UI
- No keyboard/focus evidence

**Ruling:** This is real UI with real state, real data parsing, and real conditional rendering — not a shell. The state machine drives 4 distinct views (idle, loading, success, error). Same visual evidence gap as PR #258.

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

### vs. PR #258 (Gold Exemplar)

| Section | PR #258 | PR #247 | Convergent? |
|---------|---------|---------|-------------|
| **A** CID | PASS WITH NOTES | PASS WITH NOTES | ✅ Same — CID in code+tests, not in PR body |
| **B** Trace | PASS WITH NOTES | PASS WITH NOTES | ✅ Same — infra present, no screenshot |
| **C** Metrics | PASS WITH NOTES | PASS WITH NOTES | ✅ Same — error handling present, no latency number |
| **D** Receipt | FAIL | N/A | ✅ **Correctly different** — PR #258 has write path, PR #247 does not |
| **E** Defend | PASS WITH NOTES | PASS WITH NOTES | ✅ Same — story clear, chain not demonstrated |
| **F** UI Integrity | PASS WITH NOTES | PASS WITH NOTES | ✅ Same — real UI proved by code+tests, no visual evidence |

**Convergence result: 6/6 sections produce expected outcomes.** The scoring system is stable — comparable evidence yields comparable scores, and the write-path distinction correctly differentiates Section D.

---

## Baseline Rulings Applied

All baseline rulings from [GOLD_EXEMPLAR_SCORECARD.md](GOLD_EXEMPLAR_SCORECARD.md) apply identically:

- **Acceptable for v1 baseline:** PR presentation gaps (A, B, E, F), metrics as infrastructure (C)
- **Not acceptable going forward:** Concrete CID in PR body, trace screenshot, one latency measurement, screenshot/gif of UI

The one ruling that **does not apply** is D (receipt for write paths) because PR #247 has no write path.

---

**Government. Transcended. Converged.**
