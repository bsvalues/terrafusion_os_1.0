# WO-WB-PARITY-002 — Existing Test Coverage Matrix

**Goal:** GOAL-TF-WB-PARITY-PROOF-001
**WO:** WO-WB-PARITY-002 — Existing Test Coverage Matrix
**Category:** Documentation (read-only inventory)
**Depends on:** WO-WB-PARITY-001

---

## 1. Relevant existing tests (first-hand inventory)

| Test file | What it proves |
|-----------|----------------|
| `workbenchRealHosting.gate.test.tsx` | Route-context render gate: each covered tab renders its real `property-<tab>-tab` surface (not a placeholder) with ≥1 interactive element. **Covered before this WO: Forge, Atlas, Dais (PRIMARY); Dossier, Pilot (SECONDARY). Clerk/Treasury/Audit were INVENTORY-ONLY** (registry existence, not rendered). |
| `PropertyWorkbenchWindow.tabMapping.test.tsx` (G2 #1223) | Window host: all 9 tabs map to their real component (via module stubs); launch-path + tab-switch + role-hidden-deep-launch + 6-tab regression. |
| `Property<Tab>.honesty.contract.test.tsx` (Clerk/Treasury/Audit/Dais/Dossier/Pilot/Summary/Atlas/Forge) | Each real tab component renders its root `property-<tab>-tab` test-id in Outlet context + honesty-badge contract. |
| `workbenchEntrypoints.parity.test.ts` | Launcher↔registry **route** parity (href === registry route; `/property/:parcelId/:tab` structure; URL-safe segments). *Entrypoint routing parity — a different axis than host-component parity.* |
| `workbenchEntrypoints.registryCompleteness.test.ts` | Registry completeness (`getWorkbenchSuites`, `workbenchTarget.tabId` valid). |
| `PropertyWorkbench.productionSmoke.test.tsx` | Route Workbench parcel-evidence load smoke. |

## 2. Parity coverage matrix (per tab × host)

| Tab | Route host real-render | Window host mapping | Notes |
|-----|:----------------------:|:-------------------:|-------|
| Summary | via honesty test | ✅ tabMapping | |
| Forge | ✅ gate PRIMARY | ✅ tabMapping | |
| Atlas | ✅ gate PRIMARY | ✅ tabMapping | |
| Dais | ✅ gate PRIMARY | ✅ tabMapping | |
| **Clerk** | ❌ **gap → filled by PARITY-003** | ✅ tabMapping | was inventory-only in the gate |
| **Treasury** | ❌ **gap → filled by PARITY-003** | ✅ tabMapping | was inventory-only in the gate |
| **Audit** | ❌ **gap → filled by PARITY-003** | ✅ tabMapping | was inventory-only in the gate |
| Dossier | ✅ gate SECONDARY | ✅ tabMapping | |
| Pilot | ✅ gate SECONDARY | ✅ tabMapping | |

**Column semantics (honest scope):** "Route host real-render" means the tab **component** renders as a real
`property-<tab>-tab` surface in a route-shaped context — it proves component realness, **not** `Router.tsx`'s literal
path→element binding (no test renders through the real app router; see WO-WB-PARITY-004 §3 "known limitation"). "Window
host mapping" is the one host whose tab→component map is directly rendered-through (`tabMapping.test.tsx`).

## 3. Identified gap (single, real — not manufactured)

The canonical **real-hosting gate** rendered only 5 of the 9 tabs as real surfaces (Forge/Atlas/Dais/Dossier/Pilot);
**Clerk/Treasury/Audit were inventory-only** — asserted to exist in `VALID_WORKBENCH_TAB_IDS` but never rendered. They
*are* individually render-tested by their `*.honesty.contract.test.tsx`, but they were absent from the consolidated
real-hosting gate that certifies "every tab hosts a real surface." Since the G2 fix just made these mount in **both**
hosts, promoting them to full render-gates closes the gate to a real **9/9 rendered**.

No other gap: window-host mapping is fully covered by `tabMapping.test.tsx`; entrypoint route parity by
`workbenchEntrypoints.parity.test.ts`; registry invariant by the inventory + completeness tests.

## 4. Decision → WO-WB-PARITY-003

Backfill exactly one thing: **promote Clerk/Treasury/Audit from inventory-only to render-gates** in
`workbenchRealHosting.gate.test.tsx` (mirroring the existing Dais tool-tab gate). No new test file, no duplication of the
window `tabMapping` coverage — that would be manufactured churn.

**Docs-only in this WO.**
