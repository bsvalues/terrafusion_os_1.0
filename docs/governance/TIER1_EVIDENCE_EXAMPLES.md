# What Good Evidence Looks Like

## Tier-1 UI/UX DoD Companion v1.0 (Reviewer Calibration Sheet)

**Version:** 1.0  
**Status:** Active  
**Created:** 2026-02-12  
**Related:** [TIER1_UI_UX_DOD_CHECKLIST.md](TIER1_UI_UX_DOD_CHECKLIST.md) (parent checklist)

---

## Purpose

Normalize reviewer expectations for **CID / trace / metrics / receipt** so "PASS WITH NOTES" drift collapses. Use this sheet alongside the [DoD Checklist](TIER1_UI_UX_DOD_CHECKLIST.md) to make rulings consistent and fast.

---

## Evidence Quality Levels (use this language in reviews)

| Level | Meaning |
|-------|---------|
| **PASS** | Evidence is present, specific, and reproducible |
| **PASS WITH NOTES** | Evidence exists but is fuzzy (missing link, missing CID, unclear screenshot, etc.) |
| **FAIL** | A required evidence object is missing (especially **Receipt** on write/commit flows) |

---

## A) Correlation ID (CID)

### PASS looks like

- PR includes **CID(s)** used during validation and where it appears in UI/logs.
- Screenshot or log snippet shows CID present in:
  - UI toast / receipt panel / activity feed entry **and**
  - backend log line or trace span

**Example (PR body snippet):**

> - CID: `CID-2026-02-12-143210-9f3a`
> - Where seen: Activity Feed → "Action Completed" row + API log `traceId=CID-...`

### PASS WITH NOTES

- "CID exists" but no CID value shown.
- CID shown but no proof it propagates across boundary.

### FAIL

- No CID mentioned for a Tier-1 journey validation.

---

## B) Trace / Causal Chain

### PASS looks like

- A trace link or screenshot showing **Validate → Execute** ordering (even if basic).
- At least one span/event shows:
  - action name
  - CID/traceId
  - result (allowed/blocked)
  - latency duration (can be span timing)

### PASS WITH NOTES

- Only console logs shown; no causal chain.
- Trace exists but not tied to the tested user action.

### FAIL

- For any "commit/write" change: no trace or causal proof included.

---

## C) Metrics (Latency + Errors)

### PASS looks like

- A simple measurement **tied to a real flow**, not vibes:
  - "Click X → result Y" latency observed (screenshot/timestamp, devtools timing, or dashboard)
- Error state shown to be clean:
  - "No console errors" screenshot
  - or error counter stays at 0 for the flow

### PASS WITH NOTES

- "Feels fast" with no measurement.
- Only one measure without context ("200ms" but what action?).

### FAIL

- Regressions introduced with no acknowledgement (new errors, stalled UI, broken states).

---

## D) Receipt Artifact (Non-Negotiable for Write/Commit)

### PASS looks like

A **visible** receipt in the UI that includes (minimum):

- who/actor (user or system identity)
- what action
- inputs (or input hash/ref)
- policy decision (allowed/blocked + why)
- timestamp
- CID/traceId
- output summary (what changed)

**Evidence forms (any one is sufficient if complete):**

- Screenshot of receipt panel/drawer
- Exported JSON snippet
- "Receipt preview" modal capture

### PASS WITH NOTES

- Receipt exists but missing CID/traceId or "why".
- Receipt shown but doesn't clearly correspond to the action under review.

### FAIL

- Any write/commit flow merged **without** a receipt artifact shown in evidence.

---

## E) "Defend Readiness" Proof

### PASS looks like

- Reviewer can answer from PR evidence:
  1. What changed?
  2. Why was it allowed?
  3. Where is proof?
  4. Can we replay/verify later?

### PASS WITH NOTES

- The story is there but requires asking the author for context.

### FAIL

- "Trust me" merge. No proof object.

---

## F) UI Integrity (Not a Shell)

### PASS looks like

- Real navigation + real state transitions demonstrated:
  - screen(s) shown
  - action performed
  - result shown
- Keyboard/focus evidence for Tier-1 surfaces (even basic):
  - "Tab order works / focus visible" note + quick gif/screenshot

### PASS WITH NOTES

- Screen exists but action is mocked or placeholder.
- Interaction exists but no proof it's wired to real state.

### FAIL

- Cosmetic-only surface presented as functional flow.

---

## Reviewer "Fast Ruling" Checklist (10 seconds)

1. Is this a **write/commit** change?
   → If yes, **Receipt evidence is required** or FAIL.
2. Can I see a CID and a trace/causal proof tied to the tested flow?
3. Is there any latency/error evidence (even lightweight)?
4. Does the UI prove real state movement (not shell)?

---

## Suggested PR Body Evidence Snippet (copy/paste)

```markdown
### Tier-1 DoD Evidence

- **Ruling:** PASS / PASS WITH NOTES / FAIL
- **Flow tested:** `<scene> → <action> → <result>`
- **CID(s):** `<cid>`
- **Trace evidence:** `<link or screenshot>`
- **Metrics evidence:** `<timing/error proof>`
- **Receipt evidence (if write/commit):** `<screenshot/link>`
- **Screens/UX proof:** `<gif/screenshots>`
- **Notes:** `<anything deferred intentionally>`
```

---

## Calibration Process

Pick **one merged Tier-1 PR** and retro-score it with this sheet. The outcome becomes the "gold exemplar" everyone can reference. Repeat for each evidence type until reviewers reach consistent rulings without discussion.

### Gold Exemplar

**[GOLD_EXEMPLAR_SCORECARD.md](GOLD_EXEMPLAR_SCORECARD.md)** — PR #258 (Control Plane v1.0.0) retro-scored against sections A–F. Use this as the canonical "what a scored PR looks like" reference. Future Tier-1 PRs must meet or exceed this baseline.

### Convergence Validation

Two additional PRs scored against the same rubric to prove stability:

- **[GOLD_SCORECARD_PR_247.md](GOLD_SCORECARD_PR_247.md)** — PR #247 (PropertyDais, read-only tool) · 5× PASS WITH NOTES · 1× N/A
- **[GOLD_SCORECARD_PR_246.md](GOLD_SCORECARD_PR_246.md)** — PR #246 (PropertyForge, read-only tool) · 5× PASS WITH NOTES · 1× N/A

All three scorecards converge: 6/6 sections produce expected outcomes. Disputes collapse to mechanical rule lookup.

---

**Government. Transcended. Calibrated.**
