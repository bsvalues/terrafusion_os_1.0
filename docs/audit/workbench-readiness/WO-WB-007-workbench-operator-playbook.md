# WO-WB-007 — Property Workbench Operator Playbook

**Program:** PROPERTY-WORKBENCH-READINESS (step 7) · **Owner:** Claude Code · **Mode:** operator documentation, docs-only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `e2e2f4d8` · **Reads from:** WO-WB-001→005 (all findings are cited there; this playbook is practical, not a re-audit).

> **Write-surface authorization.** `docs/audit/**` sits outside the repo-root `AGENTS.md` "CORE GOVERNANCE SURFACE (ALLOWED SCOPE)", which states *"Anything outside this scope requires explicit authorization."* The operator explicitly authorized `docs/audit/workbench-readiness/` for this read-only program; no core-governance or code path is touched.

This is a practical guide to operating the Property Workbench **in its current state**. It tells an assessor what to expect today, how to read the honesty signals, and which surfaces are fully live vs tool-gated — so `unavailable` states read as *honest*, not *broken*.

---

## 1. What the workbench is, and how you reach it

- The workbench is the **parcel-context hub**: one parcel, all suites. Route: **`/property/:parcelId`**.
- You reach it by searching a parcel, or via a suite module that launches with `workbenchTab` (it navigates to `/property/:id/:tab`).
- Layout: **ContextRibbon** (parcel identity, badges, quick actions) on top → **suite tabs** in the center → a collapsible **Activity Feed** at the bottom.
- **Nine tabs, locked order:** Summary · Forge · Atlas · Dais · Clerk · Treasury · Audit · Dossier · Pilot.

## 2. The honesty signals — read these first

The workbench is built to **never fabricate**. Learn its three honest signals:

1. **Source badge** (`WorkbenchSourceBadge`) — every data element discloses where it came from: `live`, `fallback`, or `unavailable`. If you don't see live data, the badge tells you why.
2. **`unavailable` at idle** — before you invoke a tool, tool-driven panels show `unavailable`, not fake sample data. That is correct behavior.
3. **"Property Evidence Unavailable" blocker** — if a parcel's authenticated evidence can't load, the whole workbench blocks with an explicit message and a Retry, rather than showing a half-populated parcel. Blocked ≠ broken; it means the live feed didn't return evidence.

**Rule of thumb:** an empty/`unavailable` panel is the system being honest that it has no live data for that item yet — not a failure to render.

## 3. What is live today vs tool-gated

There are three data channels (WO-WB-004):

- **Domain data** (parcel/CAMA, GIS, preloaded store slices) — **live by default**; renders real data where the backend endpoint responds.
- **Direct API** (some tabs call `/api/*` directly, e.g. Atlas GIS) — live where the endpoint responds.
- **Governed tools** (`invokeTool`) — **currently pre-integration**: 0 of 117 tools are backend-integrated; every tool response carries a **"tool layer in development"** disclosure.

**Practical translation for today:**

| You want to… | Today |
|--------------|-------|
| View parcel identity / assessed values (Summary) | **works** (live domain data) |
| View GIS / boundary / layers (Atlas) | **works** where GIS endpoints respond |
| See preloaded recordings / tax statements / audit trail (Clerk/Treasury/Audit) | **works** when the parcel carries that store slice |
| Run a governed tool action (valuation model, draft notice, generate audit bundle, etc.) | **disclosed "in development"** — the action is wired but the tool is not yet backend-integrated |

## 4. Per-tab quick reference

| Tab | Use it for | State today |
|-----|-----------|-------------|
| Summary | parcel identity, valuation, physical, sale history, exemptions | live domain data |
| Forge | valuation approaches (Cost/Sales/Income/Reconciliation/Sketch) | live forge hooks; tools disclosed in-dev; Income DCF panel is a stub |
| Atlas | GIS/mapping | live GIS (falls back to an SVG preview when unavailable) |
| Dais | workflow, appeals, levy, BOE, notices | live + store; `summarize_levy_rate_components` is the most-mature tool (L2) |
| Clerk | recording, title chain, documents | live `recordings` store slice; tools in-dev |
| Treasury | tax statements, payments, delinquency | live `taxStatements` store slice; tools in-dev |
| Audit | audit roll, levy compliance, findings | live `auditTrail` store slice; tools in-dev |
| Dossier | documents, evidence packet, narrative synthesis | live document data via hook; AI synthesis disclosed |
| Pilot | the governed tool console (Muse read-only) | lists real tools; read-only |

## 5. Desktop window caveat (important)

There are two ways the workbench is hosted: the **route path** (in-browser) and the **desktop window adapter**. They are **not** at parity:

- **Route path** renders all 9 real tab surfaces.
- **Desktop window adapter** currently renders only 6 real surfaces and **aliases Clerk → Dossier, Treasury → Dais, Audit → Dossier** (WO-WB-001 §2.1). In the desktop window, opening Clerk/Treasury/Audit shows Dossier/Dais content, not their own console.

**If you need Clerk, Treasury, or Audit, use the route (in-browser) path**, not the desktop window, until the window adapter reaches parity (tracked as gap **G2**).

## 6. Deep-linking

- Tabs: `/property/:parcelId/<tab>` (e.g. `/property/123/atlas`).
- Forge sub-tabs have no path of their own but **are** query-param deep-linkable: `/property/:id/forge?tab=cost` (also `?subTab=` / `?initialSubTab=`).

## 7. What remains manual / not yet available

- **Governed-tool results** are disclosed as in-development until the tool-integration program lands (gap **G1**). Treat tool output as preview/disclosed, not authoritative, until a tool shows `backend-integrated`.
- **Income DCF** panel is a placeholder pending its backend (gap **G5**).
- **Clerk/Treasury/Audit in the desktop window** — use the route path meanwhile (gap **G2**).

## 8. When to escalate

Report to the owner if you observe any of:

- a panel showing **plausible-but-fabricated** data with a `live` badge (would be a genuine honesty defect — the contracts forbid it);
- the "Property Evidence Unavailable" blocker on a parcel that *should* have live evidence (a live-feed/auth issue, not a UI issue);
- a governed-tool action that **writes** without an explicit disclosure (write-lane concern);
- anything that contradicts this playbook or the audits (WO-WB-001→005).

> This playbook reflects the workbench as audited at `origin/main` @ `e2e2f4d8`. As the tool-integration program (G1) promotes tools to `backend-integrated`, the "tool-gated" rows above become live; re-check `tools/registry/tool-maturity.json` for the current state.

**STOP_TYPE:** `WB_OPERATOR_PLAYBOOK_COMPLETE`
