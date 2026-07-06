# WO-WB-ACCEPT-001 — Operator Acceptance Scope

**Goal:** GOAL-TF-WB-OPERATOR-ACCEPTANCE-001 — Property Workbench Operator Acceptance Proof
**WO:** WO-WB-ACCEPT-001 — Operator Acceptance Scope Audit
**Category:** Documentation (read-only)
**Operator:** Claude Code · **Authority:** William / TerraFusion OS Engineering (Brain/operator-ratified lane)

**Authorization:** These paths are outside the default `AGENTS.md` write lane; the write is permitted only by the explicit
operator authorization of GOAL-TF-WB-OPERATOR-ACCEPTANCE-001 (`AGENTS.md` allows out-of-lane writes with such
authorization). No governance-surface files touched. Per `AGENTS.md`/`brain/packs/README.md`, the Brain/Cortex remains the
sole sequencing authority; this lane was operator-ratified.

---

## 1. What "operator acceptance" means here

Prove — from existing source + tests, without touching backend/tool integration — that the Property Workbench is
**operable and honest** today: an operator can open it, reach every tab's real surface in both hosts, and see honest
unavailable/live disclosures instead of faked live data. Acceptance is a **frontend truth** claim, explicitly **not** a
claim that governed tools are backend-integrated.

## 2. Accept-today candidates (provable now)

| # | Acceptance claim | Basis (existing, on `origin/main`) |
|---|------------------|------------------------------------|
| A1 | Route host renders 9/9 real tab surfaces (no placeholder) | `workbenchRealHosting.gate.test.tsx` — PRIMARY (Forge/Atlas/Dais) + SECONDARY (Dossier/Pilot) + PROMOTED (Clerk/Treasury/Audit, added #1228) → all 9 render `property-<tab>-tab` |
| A2 | Window host maps 9/9 tabs to real components; no alias | `PropertyWorkbenchWindow.tabMapping.test.tsx` (G2 #1223) — tab-switch + launch, clerk≠dossier etc. |
| A3 | Deep-launch into a role-hidden tab does not blank the Workbench | `tabMapping.test.tsx` role-hidden-deep-launch case (G2 fix) |
| A4 | Honest unavailable/live source disclosure per tab | 9 × `Property<Tab>.honesty.contract.test.tsx` — idle=unavailable, live only on load success, no "AI-powered", governed wording |
| A5 | Hard property-evidence blocker on auth failure (no fake data) | `PropertyWorkbench.productionSmoke.test.tsx` — 401 → `workbench-property-evidence-blocker` + retry |
| A6 | Slice-aware provenance (badge live only when the rendered slice loaded) | Per-tab honesty tests drive `relatedDataStatus` (Provenance program) |

## 3. Do-NOT-accept (out of scope / not true today)

- Backend-integrated governed tools — **0/117 integrated (G1)**; the tool layer is contract/stub, disclosed as "tool
  layer in development." Acceptance must NOT claim live tool execution.
- Promoted TerraPilot live behavior; PACS-backed workflows; county production behavior.
- Any live-service dependency — acceptance tests use mocks/fixtures only.

## 4. Method + guardrails

- Prefer **documenting** each acceptance journey against its **existing** proving test (see WO-WB-ACCEPT-002 matrix);
  add a test only for a **genuine** uncovered journey (no redundant/manufactured tests — mirrors the PROV-006 no-change
  finding).
- Allowed: `__tests__/workbench/**`, `docs/audit/workbench-readiness/**`; read-only `pages/workbench/**` + `Router.tsx`.
- **STOP** if acceptance would require any component behavior change beyond a tiny testid-only support edit, any
  route/window architecture change, backend/registry/API, or would overclaim backend/tool integration.

## 5. Result

Acceptance scope = A1–A6 (frontend operability + honesty), explicitly excluding backend/tool integration. The journey
matrix (WO-WB-ACCEPT-002) maps each journey to its proving test and flags real gaps.

**Docs-only. No implementation. No stop wall.**
