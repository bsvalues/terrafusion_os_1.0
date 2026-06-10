# Workbench v0.3 Decision Brief — Surface Consolidation

**Written**: 2026-06-09  
**Branch**: fix/projector-delete-insert-atomicity  
**Status**: DECISION — governs v0.3 implementation scope

---

## The question

v0.2 closed with two workbench surfaces:

```
Surface 1 — Local Sync Workbench cockpit
  Entry  : node tools/sync/workbench/server.mjs
  URL    : http://127.0.0.1:7700
  Panels : Doctor (A) · Domain Coverage (B) · Source Pack Fit (C)
           Lane Seal (D) · Identity Spine (E) · Evidence Browser (F)
           Readback Set (G) · Dry-Run Preview (H)
  Stack  : Node.js + built-in modules + child_process (runs .mjs tools)
           Directly reads PostgreSQL; forwards writes to .NET API

Surface 2 — OS Shell route
  Entry  : workbench/sync/quarantine/review
  Panels : Quarantine Review (Slice I)
  Stack  : React 18 + TypeScript + TanStack Query
           Calls .NET API only (/api/sync/workbench/*)
```

Before adding any approval gate, the surface architecture must be decided.
An approval gate in the wrong surface will harden the split permanently.

---

## The three options

### Option A — Keep local cockpit as primary

All workbench panels stay in `tools/sync/workbench/`.  
Quarantine Review (Slice I) stays in the OS shell as a satellite.  
Future panels (approval gate, mapping editor, evidence export) go into the cockpit.

**What this means:**
- The assessor-facing workflow lives at `http://127.0.0.1:7700`
- The OS shell quarantine panel remains isolated from the rest of the workflow
- The split between step 5 (dry-run, in cockpit) and step 6 (quarantine review, in OS shell)
  is permanent and visible to the operator
- The cockpit stack (no TypeScript, no build, `innerHTML`-forbidden vanilla DOM) is the
  long-term implementation target for all 7 steps

**Advantage:** Nothing to migrate. Cockpit is working today.

**Risk:** The MVP spec (§2) says the operator must be able to complete all 7 steps without
reading documentation. A split surface fails that test. The operator has to know which
browser tab to use for which step — that is a documentation burden the design explicitly
prohibits.

**Verdict: Not recommended.** The split hardens a known design debt.

---

### Option B — Move all panels into OS shell now

Port every cockpit panel (A–H) into React components at OS shell routes.  
Delete or retire `tools/sync/workbench/server.mjs`.

**What this means:**
- Every cockpit panel becomes a React component calling .NET API endpoints
- Each panel needs a new .NET endpoint because the cockpit calls Node tools directly
  (via `child_process.spawn`) — the OS shell cannot do that
- Doctor panel alone requires a .NET endpoint that runs `tf-sync-doctor.mjs` as a subprocess
  and streams or returns its output — non-trivial
- All 8 panels would need to be ported before the surface is coherent again

**Advantage:** Clean result: one surface, full TypeScript, consistent tf-* design tokens.

**Risk:** The migration effort is large and front-loaded. The cockpit is the operator's only
read-only health check today. Retiring it before OS shell equivalents are proven creates a
dead zone. Porting doctor + 7 panels = 8+ new .NET endpoints + 8 React components before
any new workflow capability is added.

**Verdict: Not recommended for v0.3.** The effort is disproportionate to the problem.

---

### Option C — Hybrid: OS shell canonical, local cockpit dev harness ✓ RECOMMENDED

**Architecture decision:**

```
OS Shell = canonical operator surface
  The assessor uses the OS shell for all workflow steps.
  New panels are added here, not to the cockpit.
  Existing OS shell panels (Slice I) stay here.
  The approval gate (when built) goes here.
  The mapping editor (when built) goes here.

Local cockpit = developer/debug harness
  Not deleted. Remains functional.
  Developer uses it to verify doctor output, seal state, evidence, readback.
  Not the primary operator surface.
  Not expanded with new workflow panels.
  Receives only maintenance updates.
```

**Why Option C:**

1. **The MVP spec is clear:** the 7-step workflow is assessor-facing and belongs in the OS.
   The cockpit was explicitly framed as "first clickable MVP" — a stepping stone, not the
   destination. The spec (§9) says the MVP scope was "Screens 0 + 2." It does not say the
   cockpit is the final product.

2. **The approval gate must go in the OS shell.** If v0.4 adds an approval gate (commit
   approved, drain trigger), it cannot live in a Node.js sidecar. It must live adjacent to the
   quarantine review panel (already in the OS shell) and the dry-run preview result. Putting
   the gate in the cockpit would require the operator to approve in the cockpit and then confirm
   in the OS shell — a dangerous two-surface confirmation pattern.

3. **The cockpit has real value as a dev harness.** Doctor output, identity spine, evidence
   browser — these are developer tools, not operator tools. The developer needs a fast local
   check that doesn't require the full OS shell to be running. The cockpit stays for that reason.

4. **Migration can be incremental.** Option C does not require porting all 8 panels at once.
   Each panel is ported when there is a reason to port it — when it needs to participate in a
   workflow step that connects to write-adjacent panels. Until then, the cockpit panel remains
   available as a dev check.

---

## What the split means for each panel

| Panel | Cockpit? | OS Shell? | Notes |
|-------|----------|-----------|-------|
| A — Doctor | dev harness | port in v0.3 Slice J | Doctor is the workflow entry gate; belongs in OS shell |
| B — Domain Coverage | dev harness | port with Slice J | Lives immediately after doctor |
| C — Source Pack Fit | dev harness | future | Not needed for immediate approval gate path |
| D — Lane Seal | dev harness | future | Not needed for immediate approval gate path |
| E — Identity Spine | dev harness | future | Dev diagnostic; cockpit is fine |
| F — Evidence Browser | dev harness | future | Links to files; cockpit works fine |
| G — Readback Set | dev harness | future | Static data; cockpit works fine |
| H — Dry-Run Preview | present | future | Backend endpoint exists; OS shell panel in a future slice |
| I — Quarantine Review | — | ✅ done | Slice I, sealed at a80de31b9 |

---

## Architectural constraint to document

The local cockpit runs Node tools directly:

```
cockpit → child_process.spawn(tf-sync-doctor.mjs) → PostgreSQL + .NET API
```

The OS shell can only call .NET endpoints:

```
OS shell → /api/sync/workbench/* → .NET API → (results)
```

Porting any cockpit panel to the OS shell requires a .NET API endpoint that runs or wraps the
underlying Node tool. This is the "port tax" for each panel migration. The tax is not zero, but
it is predictable: one new controller endpoint per panel ported.

For the Doctor panel specifically, the .NET endpoint needs to spawn `tf-sync-doctor.mjs` as a
child process (or call the underlying PostgreSQL queries directly from C#). The child-process
approach is simpler and preserves the existing tool. The C# port is more idiomatic but requires
re-implementing the four doctor steps.

---

## v0.3 implementation slices

Under Option C, v0.3 scope is one slice only:

### Slice J — Doctor Panel port to OS shell

**Goal:** Port the doctor panel (cockpit Slices A + B) to an OS shell route, establishing the
pattern for future cockpit-to-OS-shell ports.

**Route:** `workbench/sync/doctor`

**What it shows:**
- Four doctor step cards (PASS / WARN / FAIL) with expand-to-detail
- Overall verdict banner
- Domain coverage grid (sealed / landed-only / deferred / empty)
- "Re-run" button
- Blocking gate: FAIL on step #0 shows red gate; does not unblock until resolved

**Backend:** One new .NET endpoint (`GET /api/sync/workbench/doctor/run`) that spawns
`tf-sync-doctor.mjs` as a child process and returns its structured output. OR, the OS shell
calls the cockpit server at `http://127.0.0.1:7700/api/doctor/run` as a proxy during development
only — not production. Decision deferred to implementation.

**Why Slice J and not something else:** The doctor panel is the step 2 gate in the 7-step
workflow. It is the first thing the operator sees before any write-adjacent step. Before the
approval gate can be built, the operator needs the doctor gate in the same surface. Porting
doctor establishes the pattern without touching any write-adjacent functionality.

**Non-goals for Slice J:**
- No drain trigger
- No commit button
- No canonical mutation
- No quarantine release
- No F2 cleanup
- No Treasurer accounting
- No history lanes
- Does not retire the local cockpit

---

## v0.3 non-goals

These are not opened in v0.3 under any option:

```
Approval gate (commit approved)       — no drain trigger without F2 assessment
Drain execution from UI               — dangerous before doctor panel is in OS shell
Quarantine release                    — requires approval gate first
Mapping editor                        — not needed until new county onboarding
Bulk disposition                      — explicitly out of scope (v0.2 closeout)
F2 cleanup (tf_parcel identity)       — separate workstream
History lanes                         — separate workstream
Treasurer / revenue accounting        — separate mission per Doctrine §10
```

---

## Decision summary

| Question | Answer |
|----------|--------|
| Which surface is canonical? | OS shell (`workbench/sync/*`) |
| What happens to the local cockpit? | Retained as dev/debug harness; not expanded with new workflow panels |
| What happens to Slice I (quarantine review)? | Stays where it is — OS shell; no migration needed |
| What happens to Slice H (dry-run preview)? | Cockpit panel remains; OS shell panel is a future slice (not v0.3) |
| What is the single v0.3 deliverable? | Slice J — Doctor Panel in OS shell |
| When does the approval gate get built? | v0.4, after doctor panel is in OS shell |
| Does anything get deleted in v0.3? | No. Cockpit is not deleted or deprecated. |

---

_Before starting Slice J, confirm: the .NET API endpoint strategy for the doctor runner.
Child-process spawn vs. direct C# port. This is the only architectural decision not resolved here._
