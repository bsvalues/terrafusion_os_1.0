# TerraPilot Tool Promotion Protocol

**WO:** WO-TERRAPILOT-P2
**Program:** P5 — TerraPilot Tool Maturity
**Date:** 2026-07-01
**Authority:** Operator Doctrine — the formal L0→L4 promotion gate
**Classification:** Protocol (docs). No runtime change, no tool promoted by this document.

---

## 0. Purpose

Prevent "manifest green" from being mistaken for live capability. A tool that is manifest-registered
but not backend-integrated is **not** a working tool. This protocol defines the required evidence,
review, and approval to move a TerraPilot tool up the maturity ladder — and the disclosure rule that
holds until a tool is genuinely live.

---

## 1. The Maturity Ladder (canonical)

| Level | Label | Definition | Disclosure required in UI/docs |
|-------|-------|------------|-------------------------------|
| **L0** | Declared | In manifest/registry only; **no handler** | "not available" |
| **L1** | Runnable | Handler exists but returns stub/canned/empty; **no backend integration** | "not yet integrated (stub)" |
| **L2** | Contract-covered | Handler + schema/contract + integration spec written; still stub data | "contract-covered, not live" |
| **L3** | Live-integrated | Handler calls a **real backend/API** returning **real data**; trace emitted | "live" (source badge) |
| **L4** | Promoted | L3 + tests + evidence doc + **operator approval** | "live, approved" |

**Rule:** a tool below L3 must be disclosed as not-live in every UI surface and operator-facing doc.
Green contract coverage (L2) is **not** live capability.

---

## 2. Promotion Gates (evidence required to advance)

### L0 → L1 (Declared → Runnable)
- A handler is registered in the tool dispatcher (toolId → handler) and returns a **well-formed,
  honestly-labeled stub** (`source:"stub"`, no fabricated domain data).
- Evidence: handler file:line; a probe showing the stub response with `source:"stub"`.

### L1 → L2 (Runnable → Contract-covered)
- Request/response **schema** defined and validated; an **integration spec** documents the real
  backend endpoint/service the handler will call and the data mapping.
- A **contract test** asserts the schema and the stub-disclosure (badge/`source` field).
- Evidence: schema location; spec doc; passing contract test.

### L2 → L3 (Contract-covered → Live-integrated) — **the real bar**
- Handler calls a **real** service/DbContext/API (not a stub) and returns **real data**.
- The response carries a **live** source marker (not `stub`), and a **trace event** is emitted
  (immutable, correlation-id).
- Verified by a **live probe** (or authenticated live test) showing real data, and by the
  handler no longer returning the stub branch.
- **This step changes runtime behavior → crosses SW-09** and, if it wires a new backend/LLM,
  **SW-08/SW-10**. It requires explicit operator authorization (it is not a docs WO).
- Evidence: live probe output with real data; trace event; handler diff removing the stub path.

### L3 → L4 (Live-integrated → Promoted)
- L3 evidence **plus**: unit/contract/e2e tests green; an **evidence rollup doc**; and **operator
  approval** recorded (named approver, date, WO id).
- Only at L4 may a demo/doc present the tool as a working assistant.

---

## 3. Review Step

Each promotion PR must:
1. Cite the current level and the target level.
2. Attach the evidence listed in §2 for the target gate.
3. For L2→L3 and above: name the stop wall(s) crossed (SW-08/09/10) and the authorization reference.
4. Pass the honesty contract (no fabricated data; stub disclosed until L3; source badge correct).

A tool may not skip levels. L2→L3 may not be self-approved by the executing agent — it is an
operator authority wall.

---

## 4. Disclosure Rule (in force now)

Until WO-TERRAPILOT-P5 produces a genuine **L3** tool:
- TerraPilot is disclosed as **"tool layer in development"** in all demo scripts and docs.
- No demo presents TerraPilot as a working AI assistant.
- The deployed pilot surface already models this correctly: `/api/pilot/health` returns
  `{"status":"degraded","runtimeOnline":false,"message":"Pilot runtime offline — using .NET fallback
  stubs"}`; `/api/pilot/tools` and `/api/pilot/traces` return `source:"stub"`, `runtimeOnline:false`.
  **This honest degraded disclosure is the target behavior for all L0/L1 tools — preserve it.**

---

## 5. Stop Walls In This Program

| Wall | Where |
|------|-------|
| SW-09 runtime behavior | any L2→L3 promotion (handler starts returning real data) |
| SW-08 external integration | wiring a new backend/LLM/service for a tool |
| SW-10 auth/security | if a tool requires new auth scope or exposes protected data |
| SW-03 secrets | if integration needs credentials (LLM keys, DB) |

WO-TERRAPILOT-P3/P4/P6 (handler parity, stub disclosure, evidence rollup) are **read-only/docs (R0/R1)**
and cross no wall. **P5 is a candidate *review*** (read-only) — the actual L2→L3 promotion it
recommends is a separate, operator-authorized WO.

---

## 6. Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-07-01 | Protocol authored | WO-TERRAPILOT-P2 |

---

**WO-TERRAPILOT-P2: COMPLETE.** Enables P3 (handler parity), P4 (stub disclosure), P5 (candidate
review), P6 (rollup).
