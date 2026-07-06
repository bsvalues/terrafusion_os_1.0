# WO-WB-PARITY-001 — Route/Window Parity Scope Audit

**Goal:** GOAL-TF-WB-PARITY-PROOF-001 — Workbench Route/Window Parity Proof
**WO:** WO-WB-PARITY-001 — Route/Window Parity Scope Audit
**Category:** Documentation (read-only audit)
**Operator:** Claude Code · selected via GOAL-TF-CLAUDE-OPERATOR-QUEUE-001 (WO-CLAUDE-QUEUE-003)

**Authorization:** Operator-authorized parity-proof lane. Allowed writes:
`frontend/apps/os-shell/src/__tests__/workbench/**`, `docs/audit/workbench-readiness/**`; read-only elsewhere.

---

## 1. Purpose

After the G2 fix (#1223) made the window adapter mount the real Clerk/Treasury/Audit, prove that the **route** host and
the **window** host render the same real component for all 9 Property Workbench tabs, and scope the coverage needed to
lock that parity in.

## 2. The two host mappings (verified on `origin/main`)

**Route host** — `Router.tsx:217-226` child routes under `/property/:parcelId`:

| Tab | Route element |
|-----|---------------|
| summary | `PropertySummary` (index) |
| forge | `PropertyForge` |
| atlas | `PropertyAtlas` |
| dais | `PropertyDais` |
| clerk | `PropertyClerk` |
| treasury | `PropertyTreasury` |
| audit | `PropertyAudit` |
| dossier | `PropertyDossier` |
| pilot | `PropertyPilot` |

**Window host** — `PropertyWorkbenchWindow.tsx:85-93` `TAB_COMPONENTS` (post-G2):

| Tab | Window component |
|-----|------------------|
| summary | `PropertySummary` |
| forge | `PropertyForge` |
| atlas | `PropertyAtlas` |
| dais | `PropertyDais` |
| clerk | `PropertyClerk` |
| treasury | `PropertyTreasury` |
| audit | `PropertyAudit` |
| dossier | `PropertyDossier` |
| pilot | `PropertyPilot` |

**Result: byte-for-byte parity** — both hosts map each of the 9 tabs to the same real component. No alias remains in
either host (the G2 fix also removed the window's `resolvedInitialTab` launch remap at the former `:730-731`).

## 3. Why parity can regress silently

The two mappings are **independent structures** (JSX child routes vs a `Record` map) with **no shared source of truth**.
A future edit to one host (e.g. re-aliasing a window tab, or a role/launch remap) would not be caught by the other host's
tests. That is exactly how the original G2 gap arose. So parity needs an explicit, durable **contract + coverage**, not
just today's matching values.

## 4. Coverage scope needed (→ WO-WB-PARITY-002/003)

- **Route host real-render** per tab (renders the real component, asserts `property-<tab>-tab`, not a placeholder).
- **Window host mapping** per tab (the window mounts the real component per tab / launch).
- **Registry** invariant (exactly 9 valid tab IDs).
- **Contract doc** stating the parity rule so future changes are checked against it.

The coverage matrix (WO-WB-PARITY-002) inventories what already exists and identifies the one real gap.

## 5. Scope guardrails

Read-only inspection of `pages/workbench/**` + `Router.tsx`; the only code write permitted is test additions under
`__tests__/workbench/**` (and a *tiny* window-adapter fix only if a parity test reveals a regression). No route/window
architecture change, no backend/registry/API. No stop wall.

**Docs-only in this WO. No implementation.**
