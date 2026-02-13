# Gold Exemplar Scorecard

## Tier-1 UI/UX DoD — Canonical Reference Implementation

**Version:** 1.0  
**Status:** Active  
**Created:** 2026-02-12  
**Related:** [TIER1_EVIDENCE_EXAMPLES.md](TIER1_EVIDENCE_EXAMPLES.md) (calibration sheet) · [TIER1_UI_UX_DOD_CHECKLIST.md](TIER1_UI_UX_DOD_CHECKLIST.md) (checklist)

---

## Purpose

This is the **normative artifact** that ends "is this enough?" debates. Every future Tier-1 PR is scored against this exemplar. Where the exemplar has gaps, those gaps are explicitly labeled as **v1 baseline** (acceptable now, not acceptable in perpetuity).

---

## Exemplar PR

| Field | Value |
|-------|-------|
| **PR** | [#258](https://github.com/bsvalues/terrafusion_os_1.0/pull/258) |
| **Title** | feat(control-plane): ship Control Plane v1.0.0 (64 commits) |
| **Merged** | 2026-02-09 |
| **Scope** | Policy UI · Distributed Tracing · Telemetry · Golden Journeys · Policy Export/Import |
| **Classification** | Infrastructure Foundation Release (Tier-1 UI + write path) |
| **Entry paths** | PilotConsole → Control Plane tabs · Trace Home → Action Stream |
| **3-click path** | Dock → Pilot Console → Policy Panel → Add/Edit Rule |
| **Write/commit** | Yes — Policy Export/Import (JSON schema, merge strategy) |
| **Changed files** | 85 |
| **Tests cited** | 29/29 policy + 32/32 governed gates + frontend build GREEN |

---

## A–F Scores

### A) Correlation ID (CID) — PASS WITH NOTES

**Evidence present:**
- PR body: *"Correlation IDs for causal chain visibility (16 tests)"*
- Code: `osActions.ts` emits structured `OsActionTracePayload` with `actionId` on every action
- Code: CID propagates across UI → trace bus → telemetry sink → persisted store
- Tests: 16 CID-specific tests pass

**What's missing (v1 baseline gap):**
- PR body does not include a **specific CID value** (e.g., `CID-2026-02-09-...`)
- No screenshot showing CID in the UI (Activity Feed, Toast, or Action Details panel)
- No log snippet showing the same CID on the backend side

**Ruling:** Infrastructure is real and tested. Evidence gap is **presentation** — the CID exists in code and tests, but the PR body doesn't paste a concrete example a reviewer can verify visually.

**Going forward:** Future PRs must paste at least one CID value + where it appears.

---

### B) Trace / Causal Chain — PASS WITH NOTES

**Evidence present:**
- PR body: *"Event emission: tool_invoked, tool_completed, tool_failed"*
- PR body: *"Structured diagnostics for operator dashboards (10 tests)"*
- Code: `ActionStreamModule.tsx` — real-time trace viewer with Live + History modes
- Code: `telemetrySink.ts` — buffers and persists trace events to store
- Code: `traceToOsAction.ts` — jump-to-surface replay from trace entries
- Code: `emitActionTrace()` / `emitBlockedTrace()` — full causal chain with actionId, surface, intent, actionType, blockReason
- Tests: 16 trace tests + integration tests for action stream

**What's missing (v1 baseline gap):**
- No trace screenshot or exported trace snippet in PR body
- No link to a trace view showing a specific CID end-to-end

**Ruling:** Trace infrastructure is production-grade — invoked/blocked events, causal ordering, persistence, and replay. Gap is **PR evidence presentation** — the trace exists but the reviewer must read code to confirm.

**Going forward:** Future PRs must include a trace screenshot or exported span showing CID + action + result.

---

### C) Metrics (Latency + Errors) — PASS WITH NOTES

**Evidence present:**
- PR body: *"Performance metrics (duration, error rates)"*
- Code: `OsActionTracePayload` includes `durationMs` and `errorCode` fields
- Code: `StoredTraceEvent` persists per-event metrics
- Code: Telemetry store supports `query()` with time-range filtering
- Tests: 29/29 policy tests + build GREEN cited

**What's missing (v1 baseline gap):**
- No specific latency measurement for a user flow (e.g., "Click Policy Panel → rules load in 45ms")
- No "no console errors" screenshot or error counter proof
- Test pass counts are present but no specific latency assertion

**Ruling:** Metrics infrastructure ships and is wired. Gap is **concrete measurement** — no "this action takes X ms" evidence in the PR body.

**Going forward:** Future PRs must cite at least one operation + measured latency + error state for the changed flow.

---

### D) Receipt Artifact — FAIL

**Evidence present:**
- PR body: *"Policy Export/Import — Disaster recovery via JSON v1.0 schema (15 tests)"*
- Code: `policyStore.ts` handles export/import with validation, duplicate detection, merge strategy
- This is a **write path** (policy import writes rules to store)

**What's missing (hard gap):**
- No receipt UI screenshot in PR
- No receipt payload example (who, what, when, why, CID)
- No evidence that the import action produces a visible receipt to the user
- The export/import validation *is* tested (15 tests), but no receipt artifact is surfaced

**Ruling:** This is the one **hard fail** — a write/commit path shipped without receipt evidence in the PR. The policy engine is real, the import is validated, but the DoD requires a visible receipt for any write path.

**Baseline acknowledgement:** This PR shipped *before* the DoD checklist existed (PR #258 merged 2026-02-09; checklist created 2026-02-12). The failure is **retroactive**, not a process violation. It correctly identifies what must change going forward.

---

### E) "Defend Readiness" Proof — PASS WITH NOTES

**Evidence present:**
- **What changed?** — 7 clearly enumerated subsections in PR body (Policy UI, Distributed Tracing, Telemetry, Golden Journeys, Export/Import, Ship Discipline, Build Fix)
- **Why was it allowed?** — "FISMA-compliant," "county-isolated," "zero-trust," "audit trail" section; 29/29 + 32/32 tests pass
- **Where is proof?** — Test counts, build GREEN, rollback instructions
- **Can we replay/verify later?** — Telemetry store persists events; export/import enables disaster recovery

**What's missing (v1 baseline gap):**
- No direct link to a specific trace/receipt that a third party could pull to verify
- "Audit trail" is claimed but not shown (no CID → trace → receipt chain demonstrated in PR body)

**Ruling:** The story is clear and the infrastructure supports defend readiness. Gap is **showing** the chain, not just claiming it.

**Going forward:** Future PRs must demonstrate at least one CID → trace → receipt link chain.

---

### F) UI Integrity (Not a Shell) — PASS WITH NOTES

**Evidence present:**
- PR body: *"New Control Plane tabs in TerraFusion Console"*
- PR body: *"Policy management UI (add/edit/delete authorization rules)"*
- PR body: *"Real-time policy enforcement + violation detection"*
- PR body: *"Session persistence (survives page reload)"*
- Code: `ActionStreamModule.tsx` — full real-time trace viewer with filtering, mode toggle, jump-to-surface
- Code: `PolicyPanel.tsx` — live policy rule management
- Code: `Launcher.tsx` — pins, recents, ranking, search
- Code: `ParcelContextIndicator.tsx` — real parcel context
- Tests: Accessibility tests (`suiteTiles.accessibility.test.tsx`, `standaloneHomes.accessibility.test.tsx`)
- CodeRabbit summary confirms: real state transitions, launcher personalization, action stream, policy panel

**What's missing (v1 baseline gap):**
- No screenshot/gif in PR body showing the UI
- No keyboard/focus evidence (accessibility tests exist in code but evidence isn't in PR body)

**Ruling:** This is real UI with real state, not a shell. Action Stream, Policy Panel, Launcher personalization, and parcel context are all wired to live state with tests. Gap is **visual evidence** in the PR body.

**Going forward:** Future PRs must include at least one screenshot or gif showing the UI state transition.

---

## Score Summary

| Section | Score | Gap Type |
|---------|-------|----------|
| **A** CID | PASS WITH NOTES | PR presentation (no concrete CID pasted) |
| **B** Trace | PASS WITH NOTES | PR presentation (no trace screenshot) |
| **C** Metrics | PASS WITH NOTES | PR presentation (no specific measurement) |
| **D** Receipt | FAIL | Hard gap (write path, no receipt evidence) |
| **E** Defend | PASS WITH NOTES | PR presentation (chain claimed, not shown) |
| **F** UI Integrity | PASS WITH NOTES | PR presentation (no screenshot/gif) |

**Overall: PASS WITH NOTES (5/6) · FAIL (1/6)**

---

## Baseline Rulings

### Acceptable for v1 baseline (will not block retroactive approval)

1. **PR body evidence style** — PR #258 shipped before the DoD checklist existed. The evidence gaps in A, B, C, E, and F are all **presentation gaps** — the infrastructure is real, tested, and production-grade. Future PRs will have the checklist + this exemplar to follow.

2. **No screenshots/gifs** — Visual evidence was not a norm before the DoD. The code and test coverage prove the UI is real. Going forward, at least one visual artifact per Tier-1 PR.

3. **Metrics as infrastructure** — `durationMs` and `errorCode` fields exist in trace payloads. Specific measurements per flow are a Wave 1 maturity item.

### Not acceptable going forward (must fix in all future Tier-1 PRs)

1. **Receipt artifact for write paths** — Any PR that ships a write/commit action **must** include receipt evidence (screenshot, payload, or UI capture). No exceptions after this exemplar.

2. **Concrete CID in PR body** — At least one CID value must be pasted with proof it appears in both UI and trace/log. "CIDs exist" without a specific value is PASS WITH NOTES at best.

3. **Trace evidence per flow** — At least one trace screenshot or exported span must be included showing the tested flow's CID + action + result.

4. **One latency measurement** — At least one "action X took Y ms" measurement from a real flow, not "feels fast."

---

## How to Use This Exemplar

### As a PR Author

1. Open this scorecard alongside [TIER1_UI_UX_DOD_CHECKLIST.md](TIER1_UI_UX_DOD_CHECKLIST.md).
2. For each section A–F, ensure your PR body has **at least as much evidence** as PR #258, **plus** the "not acceptable going forward" items.
3. Use the [PR body evidence snippet](TIER1_EVIDENCE_EXAMPLES.md#suggested-pr-body-evidence-snippet-copypaste) as your template.

### As a Reviewer

1. Compare the PR under review against this scorecard.
2. If the PR has **more evidence** than PR #258 in every section → likely PASS.
3. If the PR has **less evidence** than PR #258 in any section → that section is FAIL (not PASS WITH NOTES — the baseline has been set).
4. The "not acceptable going forward" list is **hard**: receipt, CID value, trace screenshot, one latency number.

---

## Exemplar Selection Rationale

PR #258 was chosen because it:

- ✅ Touches user-facing workflows (Policy UI, Action Stream, Launcher, Parcel Context)
- ✅ Has clear actions that emit CID + trace + metrics (osActions dispatcher, telemetry sink)
- ✅ Includes a write/commit path (Policy Export/Import)
- ✅ Has clean PR description hygiene (7 sections, test counts, rollback, security)
- ✅ Has extensive test coverage (29 + 32 + 164 tests, accessibility tests)
- ✅ Represents the **highest-quality PR at the time of shipping** — making it a fair baseline

The one FAIL (receipt) is **instructive, not punitive** — it shows exactly what the DoD adds.

---

## Convergence Scorecards

The following PRs were retro-scored against the same A–F rubric to validate scoring stability:

| PR | Scorecard | Result | Write Path? |
|----|-----------|--------|-------------|
| [#258](https://github.com/bsvalues/terrafusion_os_1.0/pull/258) | **This document** (exemplar) | 5× PASS WITH NOTES · 1× FAIL | Yes (Policy Import) |
| [#247](https://github.com/bsvalues/terrafusion_os_1.0/pull/247) | [GOLD_SCORECARD_PR_247.md](GOLD_SCORECARD_PR_247.md) | 5× PASS WITH NOTES · 1× N/A | No (read-only) |
| [#246](https://github.com/bsvalues/terrafusion_os_1.0/pull/246) | [GOLD_SCORECARD_PR_246.md](GOLD_SCORECARD_PR_246.md) | 5× PASS WITH NOTES · 1× N/A | No (read-only) |

**Convergence:** 6/6 sections converge across all three PRs. Same evidence → same score. Write-path distinction correctly differentiates Section D.

**Next step:** With convergence proven, the [Forward Standard (DoD v1.1)](TIER1_UI_UX_DOD_CHECKLIST.md#forward-standard-v11) raises the bar — new Tier-1 PRs must target PASS (not PASS WITH NOTES) on all applicable sections.

---

**Government. Transcended. Exemplified.**
