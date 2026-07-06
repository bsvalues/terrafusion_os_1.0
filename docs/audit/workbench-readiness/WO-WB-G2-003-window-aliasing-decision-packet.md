# WO-WB-G2-003 — Window Aliasing Decision Packet

**Goal:** GOAL-TF-WB-G2-WINDOW-ALIASING-001
**WO:** WO-WB-G2-003 — Decision Packet
**Category:** Documentation (decision only — no code)
**Depends on:** WO-WB-G2-001 (truth), WO-WB-G2-002 (impact)

---

## 1. Decision to make

Given that the desktop **window** adapter mislabels three tabs (Clerk→Dossier, Treasury→Dais, Audit→Dossier) via **two**
mechanisms — the `TAB_COMPONENTS` map (`PropertyWorkbenchWindow.tsx:73-83`) and the `resolvedInitialTab` launch remap
(`:727-731`) — while the **route** path renders the real components, and the real components exist and are
window-compatible — what is the correct disposition?

## 2. Options

| Option | Description | Assessment |
|--------|-------------|------------|
| **A. Accept as intentional temporary** | Leave the alias; document it as known/temporary. | ❌ Rejected. No technical constraint justifies "temporary" — the real components already exist and work in the window. Keeping it contradicts the honesty posture. |
| **B. Mark misleading, require implementation** | Declare it a defect needing a fix. | ◑ Correct diagnosis, but under-specified — "implementation" here is a 6-line map re-point (see D), not a new build. |
| **C. Remove aliased labels from the window** | Drop Clerk/Treasury/Audit from the window `TABS` until real components exist. | ❌ Rejected. The real components **already exist**; hiding honest, working surfaces is a regression, not a fix. |
| **D. Route window tabs to the real components** | Point the window `TAB_COMPONENTS` map (`:73-83`) at `PropertyClerk`/`PropertyTreasury`/`PropertyAudit` **and** remove the `resolvedInitialTab` launch remap (`:727-731`) so both the tab-switch and launch paths render the real components. | ✅ **Recommended.** Small, safe, honest, closes the gap fully — provided **both** mechanisms are fixed. |
| **E. Defer until Backend OE / tool integration resolves** | Wait for Codex Backend OE. | ◑ Valid only as *scheduling*, not as *dependency* — option D has **no** Backend-OE dependency (pure frontend, components exist). |

## 3. Recommendation: **Option D** (mount the real components), scheduled per posture

**Rationale**
- **Correctness:** the window is the only path that lies about what it renders; option D makes it match the route path
  (the honest reference), giving 9/9 real surfaces in both hosts.
- **Cost/risk:** small — add three lazy imports, change three lines in `TAB_COMPONENTS` (`:73-83`), and drop the two
  `resolvedInitialTab` alias branches (`:727-731`); no route change, no window behavioral change beyond mounting the
  correct component, no registry/backend/API change. The components are already window-compatible via `useWorkbenchTab`'s
  dual-source read. **Both** alias mechanisms must be fixed together — fixing only the map would leave `tabId=clerk`
  launches landing on the Dossier tab.
- **No Backend-OE dependency:** the real components are pure frontend and already merged. Option D does **not** need
  Codex Backend OE, tool integration, or G1. It is independent of the current pause reason.

**Scheduling under the standing posture.** The Workbench lane is currently **paused pending Codex Backend OE**. Option D
is Backend-OE-independent and low-risk, so it can be executed either (a) as a small standalone frontend PR whenever the
owner briefly authorizes it, or (b) folded into the next Workbench UI lane when the pause lifts. This packet does **not**
implement it — implementation is specified in WO-WB-G2-004 and gated on explicit owner authorization.

## 4. Decision record

- **DECISION:** D — re-point the window `TAB_COMPONENTS` (`:73-83`) for `clerk`/`treasury`/`audit` to the real
  components **and** remove the `resolvedInitialTab` launch remap (`:727-731`).
- **IMPLEMENTATION_REQUIRED:** yes (small, frontend-only) — but **not** in this goal (decision-only) and **not** dependent
  on Backend OE.
- **DO NOT** implement route changes, window-behavior changes beyond the map re-point, or any registry/backend work to
  satisfy this decision.

**Docs-only. No implementation. No stop wall.**
