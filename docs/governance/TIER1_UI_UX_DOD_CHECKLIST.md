# Tier-1 UI/UX Definition-of-Done Checklist

**Version:** 1.1  
**Status:** Active  
**Created:** 2026-02-12  
**Updated:** 2026-02-12 (v1.1 — forward standard)  
**Scope:** Every PR that changes Tier-1 UI/UX behavior  
**Related:** [CLAIMS_LEDGER.md](CLAIMS_LEDGER.md) (Wave 0 addendum) · [GOLD_EXEMPLAR_SCORECARD.md](GOLD_EXEMPLAR_SCORECARD.md) (convergence proof)

---

## Purpose

Mechanical PR review checklist ensuring every Tier-1 UI feature ships with the telemetry and auditability required to evidence claims **without backfilling**.

Five non-negotiables: **Correlation ID · Trace · Latency Metrics · Error Metrics · Receipt Artifact**.

---

## Scope

Applies to any PR that changes **Tier-1 UI/UX** behavior, including:

- OS primitives (Top Bar, Dock, Stage, Control Center, Command Palette)
- Canonical scenes (Ingestion, Review, Ratio Study, Calibration, Commit, Defense Pack)
- Any feature that enables or changes a **write/commit** action

If a PR is purely visual styling with **no behavior change**, still complete Section H (UX Integrity).

---

## A. PR Declaration (author fills)

- [ ] **Feature/Scene:** What user-facing workflow changed?
- [ ] **User goal:** What does the user accomplish now that they couldn't before?
- [ ] **Write/commit involved?** (Y/N). If yes, Receipts (Section F) are mandatory.
- [ ] **Primary entrypoint:** Dock / Stage Tab / ⌘K (list the exact path).
- [ ] **3-click path:** Confirm next high-value action is reachable in ≤3 interactions (describe the 3).

**Hard fail if:** reviewer can't tell what user journey changed.

---

## B. Correlation ID (Non-negotiable)

- [ ] Every meaningful user action in scope emits a **Correlation ID** (CID).
- [ ] The CID is visible/accessible to the user **somewhere appropriate**:
  - UI "Receipt" view, Activity Feed entry, or an "Action Details" panel.
- [ ] CID format is consistent (no ad-hoc IDs per feature).
- [ ] CID propagates across client → API → downstream jobs/events (if applicable).

**Evidence in PR:**

- [ ] Screenshot or short clip showing where CID appears in the UI **or** a log snippet showing CID is present.

**Hard fail if:** actions can't be traced end-to-end by a single ID.

---

## C. Trace Emission (Non-negotiable)

- [ ] Each Tier-1 action produces trace spans that include:
  - CID
  - actor/user identity (or stable anon ID if required)
  - operation name (stable, searchable)
- [ ] Traces cover the **full causal chain** (UI → API → worker/job/tool call where applicable).
- [ ] Trace sampling behavior is stated if not 100% (and why).

**Evidence in PR:**

- [ ] Link/reference to a trace view (or exported trace snippet) showing CID present.

**Hard fail if:** CID exists but traces can't be found by it.

---

## D. Latency Metrics (Non-negotiable)

- [ ] The PR defines the **latency-critical operations** for the changed workflow (1–3 max).
- [ ] Those operations emit latency metrics (client and/or server) with:
  - operation name label
  - success/failure label
  - environment label (dev/stage/prod)
- [ ] If there is async work, the PR clarifies what "latency" means:
  - time-to-ack vs time-to-complete (both if needed)

**Evidence in PR:**

- [ ] Screenshot or note of where the metric appears (dashboard panel, logs, metrics endpoint output).

**Hard fail if:** reviewers cannot verify latency is being captured for the changed path.

---

## E. Error Metrics (Non-negotiable)

- [ ] Errors for the workflow are counted as metrics with:
  - error type/category
  - operation name
  - environment
- [ ] UI error states are not "silent":
  - user sees a clear failure message
  - and the error is captured with CID for debugging/audit

**Evidence in PR:**

- [ ] Demonstrate one failure mode (real or simulated) and show:
  - user-facing error state
  - metric/log/trace entry tied to CID

**Hard fail if:** failures are only visible in UI without telemetry, or only in telemetry without user clarity.

---

## F. Receipt Artifact (Non-negotiable for ANY write/commit)

If the workflow performs a write/commit/publish/certify/export/lock:

- [ ] A **Receipt** is created at commit time containing at least:
  - who (actor)
  - what (action + object)
  - when (timestamp)
  - why (policy basis / intent / justification)
  - inputs (key parameters)
  - outputs (result identifiers)
  - system version (build/model/config version as applicable)
  - CID + trace reference
- [ ] Receipt is visible in UI (Action Details / Activity Feed / Defense Pack trail).
- [ ] Receipt is exportable or at least copyable (export can be later; visibility is now).

**Evidence in PR:**

- [ ] Screenshot/clip of receipt UI
- [ ] Example receipt payload (redacted if needed)

**Hard fail if:** commit happens without a receipt surfaced to the user.

---

## G. "Defend" Readiness (for Tier-1 scenes)

- [ ] The user can retrieve the receipt later via:
  - Activity Feed, Defense Pack view, or a "Receipts" panel
- [ ] The receipt chain supports reconstruction without external tools (no "check the logs" as the primary UX).

**Hard fail if:** defense requires engineers to dig through logs to explain what happened.

---

## H. UX Integrity (applies to all Tier-1 PRs)

- [ ] State clarity: user always knows **where they are**, **what changed**, **what's next**.
- [ ] Signal discipline: "hero/tactile/neon" effects only appear for earned power moments (no decorative noise).
- [ ] Accessibility basics:
  - keyboard navigation works
  - focus states visible
  - no motion traps (`prefers-reduced-motion` respected)
- [ ] No sidebar regression: Dock/Stage/Control Center/⌘K remain the navigation truth.

**Hard fail if:** the change introduces "dashboard sprawl" or hides the next action.

---

## I. Reviewer Decision

- [ ] **PASS:** all non-negotiables satisfied for scope
- [ ] **PASS WITH NOTES:** minor gaps, no risk of telemetry debt (must list follow-ups)
- [ ] **FAIL:** missing any non-negotiable (CID / trace / latency / error / receipt)

---

## PR Body Template Snippet

Copy/paste into PR description for Tier-1 UI features:

```markdown
### Tier-1 DoD Evidence

- **CID location:**
- **Trace evidence:**
- **Latency metric:**
- **Error metric:**
- **Receipt UI + sample receipt** (if commit/write):
- **3-click path:**
```

---

## Usage

| Audience | How to use |
|----------|------------|
| **PR Author** | Fill Section A + evidence lines before requesting review |
| **Reviewer** | Walk sections B–H; record decision in Section I; see [TIER1_EVIDENCE_EXAMPLES.md](TIER1_EVIDENCE_EXAMPLES.md) for calibration; compare against [gold exemplar PR #258](GOLD_EXEMPLAR_SCORECARD.md) |
| **QA** | Verify "hard fail" conditions are not present |
| **Claims Ledger (Wave 1)** | Each PASS PR becomes evidence for one or more CR-IDs |

---

## Forward Standard (v1.1)

> **Effective:** All Tier-1 PRs created after 2026-02-12 (DoD v1.0 publication date).  
> **Rationale:** Convergence scoring (PRs #258, #247, #246) proved the rubric is stable. All gaps in the baseline era were **presentation gaps** — the infrastructure exists but PRs didn't show concrete evidence. The forward standard closes these gaps by requiring specific artifacts.

### Evidence Baseline: PASS (not PASS WITH NOTES)

Pre-DoD PRs were scored PASS WITH NOTES because the checklist didn't exist yet. That grace period is over. New Tier-1 PRs must target **PASS** on every applicable section:

| Section | Pre-DoD (baseline) | Post-DoD (forward standard) |
|---------|-------------------|----------------------------|
| **A** CID | "CIDs exist" in code ✓ | **One concrete CID value** pasted in PR body + where it appears in UI |
| **B** Trace | Trace infra present ✓ | **Trace screenshot or link** searchable by that CID |
| **C** Metrics | Metrics fields wired ✓ | **One latency number** for the critical operation (e.g., "Click X → result in 45ms") |
| **D** Receipt | N/A for read-only ✓ | **Mandatory PASS** if any write/commit exists — receipt UI + sample payload |
| **E** Defend | Story clear ✓ | At least one **CID → trace → receipt chain** demonstrated (not just claimed) |
| **F** UI Integrity | Real state in code ✓ | At least one **screenshot or gif** showing a state transition |

### Hard Rules (no exceptions after this date)

1. **Receipt for write paths** — Any PR shipping a write/commit/publish/certify/export/lock action must include receipt evidence (screenshot + payload). FAIL if missing.
2. **Concrete CID** — At least one CID value from a real invocation, with proof it appears in both UI and trace/log. "We emit CIDs" without a value is FAIL.
3. **Trace per flow** — At least one trace screenshot or exported span showing CID + action + result. FAIL if missing for the tested flow.
4. **One latency measurement** — At least one "action X took Y ms" from a real flow. "Feels fast" is FAIL.

### Reviewer Decision Matrix (updated)

| Evidence quality | Pre-DoD PR | Post-DoD PR |
|-----------------|------------|-------------|
| Infrastructure present, no concrete evidence in PR body | PASS WITH NOTES | **FAIL** |
| Concrete evidence present but incomplete (e.g., CID shown but no trace link) | PASS WITH NOTES | **PASS WITH NOTES** |
| Concrete evidence present and complete | PASS | **PASS** |

### Scene-First Enforcement (next phase)

Once the first canonical scene ships with Find → Decide → Act → Defend completeness, that scene becomes the **enforcement exemplar** — all future scene PRs must match its evidence depth. Scene selection criteria:

- Must include a write/commit moment (forces receipt evidence)
- Must have a 3-click path (forces CID + trace + metrics)
- Must be a real county workflow (not synthetic)

---

**Government. Transcended. Receipted.**
