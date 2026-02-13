# TerraFusion PR Scorecard Generator

Score a PR against the Tier-1 UI/UX Definition of Done.

## Reference Documents:
- docs/governance/GOLD_EXEMPLAR_SCORECARD.md (canonical reference)
- docs/governance/TIER1_UI_UX_DOD_CHECKLIST.md (checklist)
- docs/governance/TIER1_EVIDENCE_EXAMPLES.md (evidence examples)

## A-F Scoring Rubric:

### A) Correlation ID (CID)
- PASS: Concrete CID value pasted in PR + appears in UI and trace
- PASS WITH NOTES: CID infrastructure exists but no concrete value in PR
- FAIL: No CID implementation

### B) Trace / Causal Chain
- PASS: Trace screenshot or exported span in PR body
- PASS WITH NOTES: Tracing exists but no screenshot
- FAIL: No tracing implementation

### C) Metrics (Latency + Errors)
- PASS: Specific latency measurement cited (e.g., "X ms")
- PASS WITH NOTES: Metrics infrastructure exists but no measurement cited
- FAIL: No metrics implementation

### D) Receipt Artifact
- PASS: Receipt screenshot/payload for write paths
- N/A: Read-only operations (no write path)
- FAIL: Write path exists without receipt evidence

### E) "Defend Readiness" Proof
- PASS: CID → trace → receipt chain demonstrated
- PASS WITH NOTES: Chain claimed but not shown
- FAIL: No defend story

### F) UI Integrity (Not a Shell)
- PASS: Screenshot/gif showing real UI state transitions
- PASS WITH NOTES: Real UI exists but no visual evidence
- FAIL: Shell/placeholder UI

## "Not Acceptable Going Forward" Rules:
1. Receipt artifact for write paths — MANDATORY
2. Concrete CID in PR body — MANDATORY
3. Trace evidence per flow — MANDATORY
4. One latency measurement — MANDATORY

## Output Format:
Generate a scorecard in the exact format of GOLD_EXEMPLAR_SCORECARD.md
