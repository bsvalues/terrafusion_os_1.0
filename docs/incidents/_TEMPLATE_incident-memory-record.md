# Incident Memory Record v1

- Incident ID: IMR-YYYYMMDD-###
- Created At (UTC):
- Owner:
- Status: Open | Investigating | Mitigated | Resolved | Archived
- Freshness SLA: Revalidate every 24h while open

---

## 1) Incident Summary

**Title:**
**One-line impact:**
**First observed (UTC):**
**Affected surface(s):** (e.g., suite-forge, workbench, atlas, dossier)

---

## 2) User-Visible Symptoms

- Symptom 1:
- Symptom 2:
- Screenshot(s):
- Correlation ID(s) (if available):

---

## 3) Canonical Source Precedence (must be explicit)

Conflict resolution order used for this incident:

1. Live production evidence / trace
2. Canonical governance docs / lockfiles
3. Approved runbooks
4. Advisory memory

**Any conflict found?** Yes/No
**If yes, which source won and why?**

---

## 4) Evidence Ledger (source-cited only)

| # | Source Type | Path/URL | Key Fact | Timestamp |
|---|-------------|----------|----------|-----------|
| 1 | Code |  |  |  |
| 2 | Test |  |  |  |
| 3 | Runtime log |  |  |  |
| 4 | Screenshot |  |  |  |
| 5 | Command output |  |  |  |

> Rule: No uncited claim in this section.

---

## 5) Reproduction

### Preconditions
- Environment:
- Branch:
- Flags/env vars:
- Data mode:

### Steps
1.
2.
3.

### Expected
-

### Actual
-

---

## 6) Hypotheses (labeled, not facts)

| Hypothesis ID | Statement | Confidence (0-100) | Evidence for | Evidence against |
|---------------|-----------|--------------------|--------------|------------------|
| H1 |  |  |  |  |
| H2 |  |  |  |  |

---

## 7) Triage Commands + Results

```bash
# command
# output summary

# command
# output summary

# command
# output summary
```

---

## 8) Root Cause (when confirmed)

**Root cause statement:**
**Contributing factors:**
**Why this recurred (if repeat):**

---

## 9) Mitigation / Fix Plan

### Immediate Mitigation (today)
- [ ]
- [ ]

### Durable Fix (this sprint)
- [ ]
- [ ]

### Guardrails (must include tests/alerts)
- [ ] Contract test added
- [ ] Regression test added
- [ ] CI gate/check updated
- [ ] Visibility/diagnostics improved

---

## 10) Exit Criteria (definition of done)

- [ ] Repro no longer possible
- [ ] Tests pass
- [ ] Source-cited resolution note published
- [ ] Handoff packet complete
- [ ] Freshness timestamp updated

---

## 11) Handoff Packet (required)

**Incident state:**
**What changed:**
**Why it changed:**
**What to verify next:**
**Open risks:**
**Next owner:**

---

## 12) Memory Classification + Policy

### Allowed classes present?
- [ ] Incident summary
- [ ] Debug hypotheses
- [ ] Repro steps
- [ ] Known-fix pattern
- [ ] Source links
- [ ] Handoff notes

### Forbidden classes check
- [ ] No PII
- [ ] No credentials/secrets
- [ ] No regulated payloads
- [ ] No uncited policy truth
- [ ] No governance artifact writes

---

## 13) 30-Day Metric Hooks

- Root-cause duration (minutes):
- Included in source-cited resolution (% contribution):
- Reopened incident? Yes/No

---

## 14) Final Resolution Note (source-cited)

Short narrative (5–10 lines) with only cited claims:

- **What happened:**
- **Why it happened:**
- **What fixed it:**
- **What prevents recurrence:**

---

> **2-minute mode (use when on fire):** Fill sections 1, 4 (3 entries min), 5, 6, 7 first. Return to complete full record after stabilization.
