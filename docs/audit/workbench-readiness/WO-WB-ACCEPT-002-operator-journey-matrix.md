# WO-WB-ACCEPT-002 — Operator Journey Matrix

**Goal:** GOAL-TF-WB-OPERATOR-ACCEPTANCE-001
**WO:** WO-WB-ACCEPT-002 — Operator Journey Matrix
**Category:** Documentation (read-only)
**Depends on:** WO-WB-ACCEPT-001

---

## 1. Route-host journeys (open each tab, real surface, no placeholder)

| Journey | Proving test (on `origin/main`) | Status |
|---------|--------------------------------|--------|
| Open Summary | `PropertySummary.test.tsx` + `PropertySummary.honesty.contract.test.tsx` (`property-summary-tab`) | ✅ covered |
| Open Forge | `workbenchRealHosting.gate.test.tsx` PRIMARY (`property-forge-tab`) | ✅ covered |
| Open Atlas | gate PRIMARY (`property-atlas-tab`) | ✅ covered |
| Open Dais | gate PRIMARY (`property-dais-tab`) | ✅ covered |
| Open Dossier | gate SECONDARY (`property-dossier-tab`) | ✅ covered |
| Open Pilot | gate SECONDARY (`property-pilot-tab`) | ✅ covered |
| Open Clerk | gate PROMOTED (`property-clerk-tab`, added #1228) | ✅ covered |
| Open Treasury | gate PROMOTED (`property-treasury-tab`) | ✅ covered |
| Open Audit | gate PROMOTED (`property-audit-tab`) | ✅ covered |

Route host = **9/9 real surfaces proven** (gate renders 8; Summary via its own tests). No "coming soon"/placeholder path.

## 2. Window-host journeys

| Journey | Proving test | Status |
|---------|-------------|--------|
| Window maps 9/9 tabs → real component (no alias; clerk≠dossier etc.) | `PropertyWorkbenchWindow.tabMapping.test.tsx` (stubs → asserts the map) | ✅ covered (mapping) |
| Window tab-switch renders mapped component | `tabMapping.test.tsx` tab-switch | ✅ covered (mapping) |
| Window initial/deep launch opens mapped tab | `tabMapping.test.tsx` launch | ✅ covered (mapping) |
| **Window renders the REAL Clerk/Treasury/Audit surface end-to-end** (not via stubs) | — | **GAP → WO-WB-ACCEPT-004** |

**Note:** window real surfaces are *transitively* proven (window maps to real modules **+** those modules render real
surfaces in the gate; components are host-agnostic via `useWorkbenchTab`'s dual-source read). The one **direct** journey
not covered is rendering the real Clerk/Treasury/Audit **inside the actual `PropertyWorkbenchWindow`** — a genuine
end-to-end window-host acceptance worth one focused test (ACCEPT-004).

## 3. Role / deep-link journeys

| Journey | Proving test | Status |
|---------|-------------|--------|
| Deep-link to a role-visible tab renders it | `tabMapping.test.tsx` launch cases | ✅ covered |
| Deep-link to a role-hidden tab does NOT blank the Workbench | `tabMapping.test.tsx` role-hidden-deep-launch (G2 fix) | ✅ covered |

## 4. Honest blocked-state journeys

| Journey | Proving test | Status |
|---------|-------------|--------|
| Parcel evidence unavailable → hard blocker (no fake data) | `PropertyWorkbench.productionSmoke.test.tsx` (401 → `workbench-property-evidence-blocker` + retry) | ✅ covered |
| Idle/unavailable source badge (not faked live) | 9 × `Property<Tab>.honesty.contract.test.tsx` (idle=unavailable) | ✅ covered |
| Live badge only when the rendered slice loaded | per-tab honesty tests drive `relatedDataStatus` | ✅ covered |
| No "AI-powered" / governed-tool disclosure wording | honesty contract tests | ✅ covered |

## 5. Out-of-scope journeys (must NOT be accepted)

Backend-integrated tool execution (0/117, G1); promoted TerraPilot live behavior; PACS-backed workflows; county
production. These are **not** tested as live and **not** claimed.

## 6. Gap summary → subsequent WOs

- **ACCEPT-003 (route host):** already 9/9 proven — **no new test needed**; documented above.
- **ACCEPT-004 (window host):** **one genuine gap** — end-to-end real-surface render of Clerk/Treasury/Audit inside the
  actual window. Add a focused test.
- **ACCEPT-005 (role/deep-link):** covered — **no new test needed**.
- **ACCEPT-006 (blocked-state):** covered — **no new test needed**.

Consistent with the anti-manufacturing rule: only the single real gap (ACCEPT-004) gets a new test; everything else is an
honest "covered by existing tests" record.

**Docs-only. No implementation in this WO.**
