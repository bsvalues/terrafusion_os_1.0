# Wave 1 Triage Operator Card

> **Cold-start reference — fits on one screen**

---

## Slot Rules (Invariant)

| Rule | Enforcement |
|------|-------------|
| One nominee = one slot | No duplicates |
| Append-only | Next available index only |
| No reorder after close | Freeze at 02-25 23:59 UTC |
| Cap = 20 | Beyond 20 → waitlist Wave 2 |

---

## Reject Criteria (Fail-Closed)

| Violation | Action |
|-----------|--------|
| PII present | **REJECT** immediately |
| Format mismatch | **REJECT** immediately |
| Late (after 02-25 23:59 UTC) | **REJECT (late)** + sha256 ref |
| Missing required evidence | **REJECT** immediately |

---

## Late Reject Format

```
| # | sha256:__________ | 2026-02-26T00:01:00Z | REJECT (late) | — |
```

---

## Decision ID Map (Canonical)

| Milestone | ID | Date |
|-----------|----|------|
| Opened | `dec_ss_002` | 02-21 |
| Closed | `dec_ss_003` | 02-25 |
| Gate Eval | `dec_ss_004` | 02-26 |
| Cohort Final | `dec_ss_005` | 02-27 |
| Day 0 Auth | `dec_ss_006` | 03-01 |

---

## Triage Log (Single Source)

**Write only to:** `WAVE_1_EVALUATION_LOG.md`

Do NOT create:
- Side notes
- Parallel logs
- Slack/email summaries without sha256 refs

---

## Daily Schedule

| Date | Time | Activity |
|------|------|----------|
| 02-21 → 02-25 | 15 min | Triage |
| 02-26 | 60–90 min | Gate eval |
| 02-27 | 30 min | Cohort decision |
| 03-01 | 60 min | Day 0 Go/No-Go |

---

## Open Day Checklist (02-21)

- [ ] UTC clock confirmed
- [ ] Eval log empty except headers
- [ ] Slot cap = 20 visible
- [ ] "REJECT (late)" line present
- [ ] Triage artifact = eval log only
- [ ] Decision ID map matches

---

**All 6 checks → begin intake.**
