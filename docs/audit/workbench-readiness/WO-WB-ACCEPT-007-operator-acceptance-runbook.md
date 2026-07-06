# WO-WB-ACCEPT-007 — Property Workbench Operator Acceptance Runbook

**Goal:** GOAL-TF-WB-OPERATOR-ACCEPTANCE-001
**WO:** WO-WB-ACCEPT-007 — Operator Acceptance Runbook
**Category:** Documentation (operator-facing)
**Audience:** Assessor/operator + demo/onboarding

---

## 1. What an operator can open today

The Property Workbench (`/property/:parcelId`) exposes **9 real tab surfaces** in **both** host paths:

| Tab | Surface | Opens in route host | Opens in window host |
|-----|---------|:-------------------:|:--------------------:|
| Summary | parcel summary | ✅ | ✅ |
| Forge | valuation / comps / income / reconcile | ✅ | ✅ |
| Atlas | parcel map / context overlay | ✅ | ✅ |
| Dais | equalization / appeal workflow | ✅ | ✅ |
| Clerk | recording & title tools | ✅ | ✅ |
| Treasury | tax & collection tools | ✅ | ✅ |
| Audit | financial-compliance / audit trail | ✅ | ✅ |
| Dossier | document & evidence dossier | ✅ | ✅ |
| Pilot | governed read-only reasoning tools | ✅ | ✅ |

## 2. What each host supports

- **Route host** (`/property/:parcelId/<tab>`) — browser navigation; renders each tab via React Router. All 9 are real
  surfaces (no placeholders).
- **Window host** (desktop app-window) — state-based tab switching; after the G2 fix (#1223) it mounts the **same real**
  components (Clerk/Treasury/Audit are no longer aliased to Dossier/Dais). Deep-launching into a role-hidden tab still
  opens that real tab (no blank workbench).

## 3. What the honesty badges mean

Each tab shows a **source-disclosure badge** (`WorkbenchSourceBadge`) with exactly two honest states:

- **`live`** — the parcel's evidence context (or the tab's data slice) has actually loaded from the live property
  evidence feed for **this** parcel. For the C-tabs (Clerk/Treasury/Audit) this is *slice-aware* — live only once the
  related-data bundle has loaded, not merely when the parcel shell loaded.
- **`unavailable`** — nothing loaded yet, loading, load error, or a different parcel is in context.

There is **no** "partial", "synthetic", or aspirational state. The disclosure copy never claims live loading while the
badge reads `unavailable`.

## 4. What unavailable / tool-stub states mean

- **Property evidence unavailable** → a hard **blocker** ("Authenticated property evidence is required…") with a retry —
  the Workbench does **not** show fabricated data.
- **Tool layer** → the governed tools are surfaced as **read-only, on-demand** actions; the tool layer is disclosed as
  **"in development"** and results appear **only after** the operator runs a tool, **never inferred on mount**.

## 5. What is NOT backend-integrated (do not promise)

- **0 of 117 governed tools are backend-integrated (G1).** The tool surfaces are contract/stub; **do not** promise live
  tool execution, automated results, or write-back.
- **No** TerraPilot live behavior, **no** PACS-backed workflow, **no** county-production behavior is accepted here.
- The badge going `live` reflects **parcel/slice evidence load**, not tool integration.

## 6. What to tell a user / demo audience

- "Every Workbench tab is a real, honest surface in both the browser and the desktop window."
- "Badges tell you truthfully whether live parcel evidence is loaded."
- "The reasoning/recording/tax/audit **tools are previews** — the governed tool layer is not yet backend-integrated;
  results appear only when you run a tool, and nothing is faked."

## 7. What future backend / TerraPilot integration must resolve (not Claude's lane)

- G1: integrate the 117 governed tools to real backends (Codex/backend/TerraPilot lane).
- Promote tool maturity from contract/stub → live, with real correlation IDs + results.
- Wire live PACS/county evidence where applicable per county.

## 8. Acceptance evidence

See the operator journey matrix (`WO-WB-ACCEPT-002`) for the exact test proving each row, and the rollup
(`WO-WB-ACCEPT-008`) for PRs/commits. All claims here are backed by merged tests; none claim backend/tool integration.
