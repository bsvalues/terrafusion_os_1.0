# Benton County IT / Security — Questions to Answer Before Implementation

> **Status:** PLANNING. These questions must be answered (with Benton County IT/security) before
> WO-LOCALOPS-001+ begin. Unanswered questions are **stop conditions**, not assumptions to guess.
> Capture answers in a dated note (or a follow-up doc) and reference the approval records they produce.

## Why this exists

LocalOps is county-boundary-safe by design, but "safe" depends on facts only Benton County IT can
confirm: what hardware exists, what the network permits, how data is classified, and who approves what.
Guessing any of these would violate the doctrine (no silent cloud fallback, no unapproved indexing).

## 1. Network & egress

1. Does the Benton server have **any** outbound internet access? If so, to which destinations?
2. Is calling **any** external AI endpoint permitted by policy? Under what conditions / approvals?
3. If egress is prohibited, is that a hard firewall rule, a policy, or both?
4. Are there approved internal endpoints (e.g. an on-prem model gateway) LocalOps may use?

## 2. Local AI hardware / runtime

5. Is there on-prem compute (GPU/CPU) available to run a local model? Specs?
6. Is a local model runtime (e.g. Ollama or equivalent) already installed or installable?
7. Which local model(s) are acceptable for county use? Any licensing constraints?
8. What is the fallback expectation when no local model is available — degrade gracefully and say so?
   (Doctrine answer: yes — never silently reach the cloud.)

## 3. Data classification & boundary

9. What data classifications exist (public / internal / confidential / restricted) and what handling
   does each require?
10. Which documents, if any, may a local knowledge base index? Which are categorically off-limits?
11. What PII detection/handling is required beyond the TerraPilot defaults (SSN/phone/email)?
12. Does anything county-scoped need stricter isolation than `CountyId` filtering?

## 4. Security posture & compliance

13. What is the **current** accreditation state vs the FISMA-HIGH posture target? What can LocalOps
    truthfully claim, and what must it not?
14. Are there logging/retention requirements for AI-operator actions (how long, where stored)?
15. Who may view restricted trace content, and how is that access itself logged?
16. Are there constraints on running any agent/daemon on the production server?

## 5. Operational ownership & approval

17. Who is the human approver for LocalOps-proposed actions (the "human-approved before mutation" gate)?
18. Who owns incident escalation when LocalOps surfaces a problem it must not fix?
19. What is the change-control process for adding a runbook step or a (future) mutation tool?
20. Who authorizes any future move above `read_only` (write_high / irreversible)?

## 6. Integration realities

21. Which services run on the Benton server (API :5000, Gateway :3002, Consciousness :3004, DB :5432,
    Redis, Consul) and how are they started/stopped today?
22. How is Harris PACS connectivity configured, and what is the read-only health signal LocalOps may
    observe? (PACS is a source, never written.)
23. What existing monitoring (Prometheus/Grafana/Jaeger) can LocalOps **read** instead of duplicating?

## Stop conditions

- If Q1–Q4 (egress) are unanswered, **do not** implement any provider work (WO-LOCALOPS-002).
- If Q9–Q11 (data) are unanswered, **do not** implement KB/RAG indexing (WO-LOCALOPS-004).
- If Q17/Q20 (approval authority) are unanswered, **do not** implement anything above `read_only`.
