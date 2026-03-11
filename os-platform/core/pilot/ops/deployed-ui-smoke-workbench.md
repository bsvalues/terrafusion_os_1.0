# Deployed UI Smoke — Property Workbench (9 Tabs)

**Purpose:** Provide direct deployed-environment evidence that the Property Workbench renders and routes across all **9 canonical tabs**.

**Closes / Advances:**
- `production-readiness-accounting.md` → Non-Blocking Debt: "9-tab workbench in deployed env" (health endpoint ≠ UI proof)

**Canonical Tabs (Order is contractual):**
1) Summary  
2) Forge  
3) Atlas  
4) Dais  
5) Clerk  
6) Treasury  
7) Audit  
8) Dossier  
9) Pilot  

---

## Targets

| Environment | Base URL | Build / Release Identifier | Date (UTC) | Operator |
|------------|----------|----------------------------|------------|----------|
| Staging |  |  |  |  |
| Production (optional) |  |  |  |  |

---

## Execution Protocol

**Rules:**
- Evidence must be from the deployed target (no localhost).
- Each tab must be validated by **(A)** click navigation and **(B)** direct deep-link route load (where applicable).
- Record any auth step once; do not re-auth for each tab unless required by session expiry.

**For each tab, capture:**
- Timestamp
- Route (URL path)
- Result: PASS/FAIL
- Evidence: screenshot filename or console log snippet (if any)
- Notes: perf issues, partial loads, API failures, auth redirects, UI errors

---

## Evidence Run Log

### Staging

| # | Tab | Click Nav | Deep Link | Route | Timestamp | Result | Evidence | Notes |
|---|-----|----------:|----------:|-------|----------|--------|----------|------|
| 1 | Summary |  |  |  |  |  |  |  |
| 2 | Forge |  |  |  |  |  |  |  |
| 3 | Atlas |  |  |  |  |  |  |  |
| 4 | Dais |  |  |  |  |  |  |  |
| 5 | Clerk |  |  |  |  |  |  |  |
| 6 | Treasury |  |  |  |  |  |  |  |
| 7 | Audit |  |  |  |  |  |  |  |
| 8 | Dossier |  |  |  |  |  |  |  |
| 9 | Pilot |  |  |  |  |  |  |  |

### Production (optional)

| # | Tab | Click Nav | Deep Link | Route | Timestamp | Result | Evidence | Notes |
|---|-----|----------:|----------:|-------|----------|--------|----------|------|
| 1 | Summary |  |  |  |  |  |  |  |
| 2 | Forge |  |  |  |  |  |  |  |
| 3 | Atlas |  |  |  |  |  |  |  |
| 4 | Dais |  |  |  |  |  |  |  |
| 5 | Clerk |  |  |  |  |  |  |  |
| 6 | Treasury |  |  |  |  |  |  |  |
| 7 | Audit |  |  |  |  |  |  |  |
| 8 | Dossier |  |  |  |  |  |  |  |
| 9 | Pilot |  |  |  |  |  |  |  |

---

## Outcome

- Staging: ☐ PASS ☐ FAIL  
- Production: ☐ PASS ☐ FAIL  

**If FAIL:** list the first failing tab and the minimal repro route(s), with evidence references.

---

## Cross-References

- `production-readiness-accounting.md` — non-blocking debt item 1 (PARTIALLY CLOSED: workbench 9-tab render unexercised)
- PR #694 — truth audit that changed CLOSED → PARTIALLY CLOSED
- PR #695 — truth-lint tripwire test guarding against re-overclaim
- PR #696 — portable regex upgrade for that tripwire
