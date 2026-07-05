# WO-WB-006 — First Completion Slice Decision Packet

**Program:** PROPERTY-WORKBENCH-READINESS (step 6) · **Owner:** Claude Code · **Mode:** DECISION / docs-only (this program is read-only; nothing is implemented here)
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `8c02c220` · **Reads from:** WO-WB-005 gap register.

This packet recommends the **first completion slice** — the first concrete implementation Work Order that should follow this read-only readiness program. It does **not** implement anything; it presents candidates, assesses them, and recommends one for operator authorization.

> **Write-surface authorization.** `docs/audit/**` sits outside the repo-root `AGENTS.md` "CORE GOVERNANCE SURFACE (ALLOWED SCOPE)", which explicitly states *"Anything outside this scope requires explicit authorization."* The operator gave that explicit authorization for `docs/audit/workbench-readiness/` when launching this program (repo `terrafusion_os_1.0`, docs-only, dedicated worktree). Every WO-WB doc is compliant on that basis; no core-governance or code path is touched.

---

## 1. Constraints on "the first slice"

The first slice must be:

- **Bounded** — a slice, not a program (deliverable in one focused WO).
- **Low-risk + reversible** — the workbench is production; the first move should not be able to regress it.
- **Non-colliding with Codex** — Codex owns Backend Operational Excellence; the first slice must stay in the **frontend / test lane** and not touch backend integration.
- **High-value** — it should measurably advance readiness or de-risk the biggest gap.

## 2. The strategic picture (why the S1 gap is *not* the first slice)

The gap register's only **S1** is **G1 — 0/117 governed tools are backend-integrated.** That is the true readiness driver, but promoting a tool from `stub-contract` → `backend-integrated` is **backend integration work** (`backingService`, `verificationCommand`, live endpoints). That lane:

- is **Codex's** (Backend Operational Excellence), and
- is **out of this program's read-only frontend scope**.

So **G1 is the strategic priority but not the frontend first slice.** It should be run as its own backend-coordinated program (a "tool promotion" lane), sequencing tools from the most-mature (`summarize_levy_rate_components`, the single L2) outward. This packet flags it for that lane; it is not what Claude should build first here.

## 3. Candidate first slices (frontend lane)

| # | Candidate | Gap | Value | Risk | Blocked on |
|---|-----------|-----|-------|------|-----------|
| **C1** | **Honesty-contract backfill** — add `*.honesty.contract` tests for the 5 uncovered tabs (Clerk, Treasury, Audit, Dossier, Pilot) | G3 (S2) | high | very low (tests only) | nothing |
| C2 | Re-author the skipped Phase-16 launch-surface contract test with shallow mocks | G4 (S2) | medium | low (tests only) | nothing |
| C3 | Implement Clerk/Treasury/Audit in the window adapter (un-alias) | G2 (S2) | medium | medium (real UI) | **D2** (is aliasing deliberate?) |
| C4 | First tool promotion (`summarize_levy_rate_components` → backend-integrated) | G1 (S1) | highest | higher (backend) | Codex lane / backend scope |
| C5 | Quick-fix bundle: stale tab-count header (G6) + document mixed sync routes (G7) | G6/G7 (S3) | low | very low | nothing |

## 4. Assessment

- **C4** is the highest *value* but is **out of lane** (backend, Codex) — not eligible as Claude's frontend first slice. Recommend it as the **strategic next program**, not the first slice.
- **C3** is real UI work but is **blocked on decision D2** (is the window aliasing a deliberate desktop de-scope?) and carries the most regression risk — not a safe *first* move.
- **C2** restores a real coverage hole but is narrower in value than C1.
- **C5** is trivial cleanup — worth doing but too low-value to be "the first completion slice".
- **C1** is the sweet spot: **high value, near-zero risk, unblocked, in-lane.** It closes the most concerning coverage gap — the tool-output surfaces (Clerk/Treasury/Audit/Dossier/Pilot) that currently have **no honesty-contract gate** — *before* the G1 tool-integration wave lands. That ordering matters: once tools begin returning live data, the honesty contracts should already gate **all 9** tabs so no surface can regress into undisclosed/fabricated output. C1 hardens the honesty guarantee ahead of the integration it protects.

## 5. Recommendation

**Authorize C1 — Honesty-Contract Backfill — as the first completion slice** (a future implementation WO, e.g. `WO-WB-IMPL-001`), scoped to:

- Add `PropertyClerk.honesty.contract.test.tsx`, `PropertyTreasury.honesty.contract.test.tsx`, `PropertyAudit.honesty.contract.test.tsx`, `PropertyDossier.honesty.contract.test.tsx`, and `PropertyPilot.honesty.contract.test.tsx`, mirroring the four existing separate files: `PropertyAtlas.honesty.contract.test.tsx`, `PropertyDais.honesty.contract.test.tsx`, `PropertyForge.honesty.contract.test.tsx`, and `PropertySummary.honesty.contract.test.tsx`.
- Each asserts the established honesty contract (WO-WB-001 §5 / WO-WB-003): a `WorkbenchSourceBadge` on data elements, `unavailable`/`fallback` at idle, no tool invocation on mount, no aspirational "AI-powered" language.
- **Test-only change** — no component edits unless a test surfaces a genuine honesty defect (which would then be its own reported finding).

**Sequencing:** C1 first (frontend, now) → then the **G1 tool-promotion program** under backend coordination (Codex), starting from `summarize_levy_rate_components` → then C3 after D2 is decided → C2 and C5 as fill-in.

## 6. Decision outcomes (operator picks)

| Outcome | Meaning |
|---------|---------|
| **A** | Authorize **C1** as the first completion slice (**recommended**) |
| B | Authorize **C2** (re-author the skipped launch test) instead |
| C | Decide **D2** first, then authorize **C3** (window-adapter parity) |
| D | Escalate **G1 tool promotion** to a backend-coordinated program (Codex) as the true priority, deferring the frontend slice |
| E | Defer — finish the readiness program (WO-WB-007/008) before committing to any slice |

> Note: this program (WO-WB-001→008) is read-only discovery; **no implementation happens without a separate, explicitly-authorized implementation WO.** This packet only recommends what that WO should be.

**STOP_TYPE:** `WB_FIRST_SLICE_DECISION_READY`
