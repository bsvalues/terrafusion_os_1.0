# WO-WB-INSTR-006 — Workbench Honesty-Instrumentation Rollup

**Program:** WORKBENCH-HONESTY-INSTRUMENTATION
**Status:** COMPLETE — source-honesty contract coverage **4/9 → 9/9** Property Workbench tabs
**Category:** Documentation (evidence rollup; no code/test/registry/backend change in this WO)
**Owner:** Claude Code (frontend honesty lane; non-colliding with Codex Backend OE)

**Authorization:** The operator explicitly authorized the WORKBENCH-HONESTY-INSTRUMENTATION program and named its
allowed write set — the four workbench tab components (`PropertyPilot/Clerk/Treasury/Audit.tsx`, plus Dossier under
INSTR-001), `frontend/apps/os-shell/src/__tests__/workbench/**`, and `docs/audit/**`. Root `AGENTS.md` restricts the
default agent write lane to `os-platform/core/**`, `tools/registry/**`, etc.; writing this rollup under `docs/audit/**`
is outside that default lane and proceeds **only under that explicit operator authorization** (AGENTS.md permits
out-of-scope writes with explicit approval). No governance-surface files were touched.

---

## 1. What this program did

Every Property Workbench tab now carries a **state-driven source-disclosure badge** (`WorkbenchSourceBadge`)
inside a baseline disclosure box, plus a **source honesty-contract test** that positively asserts the badge is
driven by real load/provenance state — never hardcoded, never aspirational. This closes gap **G3** from
`WO-WB-005` (honesty-contract coverage), which was re-categorised from a *test* gap to an *instrumentation* gap
(instrument-then-test) during REVISED-C1.

The badge vocabulary is deliberately minimal — only `live` or `unavailable` — so a tab can never imply a
synthetic/partial data source. No tab invokes a tool on mount; tool results are shown only after user action.

## 2. Coverage before → after

| Tab | Before | After | Provenance signal driving the badge |
|-----|--------|-------|-------------------------------------|
| Summary   | ✅ | ✅ | (pre-existing) |
| Forge     | ✅ | ✅ | (pre-existing) |
| Atlas     | ✅ | ✅ | (pre-existing) |
| Dais      | ✅ | ✅ | (pre-existing) idle-`unavailable` tool-data baseline |
| Dossier   | ❌ → ✅ | ✅ | `dossierDetails.data ? 'live' : 'unavailable'` (auto-loaded detail) |
| Pilot     | ❌ → ✅ | ✅ | `!toolsLoading && !toolsError` (tool-registry load success) |
| Clerk     | ❌ → ✅ | ✅ | parcel evidence load success, scoped to this parcel |
| Treasury  | ❌ → ✅ | ✅ | parcel evidence load success, scoped to this parcel |
| Audit     | ❌ → ✅ | ✅ | parcel evidence load success, scoped to this parcel |

**Net: 4/9 → 9/9.**

For the three C-tabs (Clerk / Treasury / Audit) the predicate, as written in code, is
`evidenceLoaded = activeParcel?.parcelId === parcelId && !parcelLoading && !parcelError`, where `parcelLoading` and
`parcelError` are local aliases bound to the `activeParcelLoading` and `activeParcelError` store flags respectively.
The disclosure sentence is state-aware (never claims live loading while the badge reads `unavailable`).

## 3. PRs / merge commits

| WO | Tab | PR | Squash commit |
|----|-----|----|---------------|
| INSTR-001 | Dossier  | #1203 | `7bfa91f2` |
| INSTR-002 | Pilot    | #1204 | `2788f9d0` |
| INSTR-003 | Clerk    | #1205 | `a2159d08` |
| INSTR-004 | Treasury | #1207 | `266cb547` |
| INSTR-005 | Audit    | #1208 | `90817477` |
| INSTR-003 follow-up | Clerk corrections (parcel-scope + state-aware copy) | #1210 | `e5a90456` |
| INSTR-006 | Rollup   | (this PR) | (this doc) |

## 4. Component + test files changed (across the program)

Components (`frontend/apps/os-shell/src/pages/workbench/tabs/`):
`PropertyDossier.tsx`, `PropertyPilot.tsx`, `PropertyClerk.tsx`, `PropertyTreasury.tsx`, `PropertyAudit.tsx`
— each gained a root `data-testid`, a baseline disclosure box, and a state-driven `WorkbenchSourceBadge`.

Tests (`frontend/apps/os-shell/src/__tests__/workbench/`):
`PropertyDossier.honesty.contract.test.tsx`, `PropertyPilot.honesty.contract.test.tsx`,
`PropertyClerk.honesty.contract.test.tsx`, `PropertyTreasury.honesty.contract.test.tsx`,
`PropertyAudit.honesty.contract.test.tsx` — each asserts: badge present; `unavailable` at idle/loading/error;
`live` on successful load (including a successful-but-empty load); `unavailable → live` transition proven
(not memoized at mount, where applicable); only `unavailable|live` values; no "AI-powered" copy; governed
wording; and no tool invoked on mount. The C-tab contracts additionally assert the different-parcel
(stale-nav) case reads `unavailable` and that the disclosure copy is state-aware.

## 5. Key correctness lessons (from adversarial CI review)

1. **Badge source must be state-driven, never hardcoded.** A hardcoded `unavailable` badge is itself dishonest
   once a tab auto-loads data (codex, Dossier).
2. **Reflect load *success*, not data *count*.** A successful load that legitimately returns zero rows is
   `live`, not `unavailable` (codex + copilot, Pilot & Clerk).
3. **Don't overclaim beyond the provenance the store exposes.** For the C-tabs the related slices
   (`recordings` / `taxStatements` / `auditTrail`) are eager-loaded *after* the parcel shell and the store
   carries **no per-slice load flag**; `activeParcelLoading` clears at the shell stage. So the badge is scoped
   to **parcel-context** provenance ("this parcel loaded from the live property evidence feed"), not
   slice-specific evidence load (codex, Treasury).
4. **Scope provenance to the current parcel.** During parcel-to-parcel navigation the store can hold the
   *previous* `activeParcel` for one frame; the predicate requires `activeParcel?.parcelId === parcelId` so the
   badge never reads `live` for the wrong parcel (codex + copilot, Audit; back-ported to Clerk in #1210).
5. **Prose must not contradict the badge.** The disclosure sentence is driven by the same `evidenceLoaded` flag
   so it never claims live loading while the badge shows `unavailable` (CodeRabbit, Treasury; back-ported to
   Clerk in #1210).
6. **Prove the transition, not just the end state.** Honesty tests use `rerender` to prove the badge flips
   `unavailable → live`, guarding against a source memoized at mount (copilot).
7. **No hardcoded ports in tests** — the unused `getEnv` mock (which embedded a hardcoded localhost port
   literal) was dropped rather than parameterised, since no tool runs on mount (copilot).

## 6. Non-goals (explicitly NOT done — still open, out of this program's scope)

- **No backend / tool integration.** The 0/117 governed-tool backend-integration gap (`WO-WB-005` G1) is
  unchanged; that remains a backend/Codex strategic lane.
- **No tool promotion**, registry, routing, data-model, API-service, package/build/CI, deploy, or
  PACS/county-data changes.
- **No window-adapter alias fix** (`WO-WB-005` G2: Clerk→Dossier / Treasury→Dais / Audit→Dossier aliasing).
- **No per-slice store provenance.** A slice-accurate badge for the C-tabs would require adding a
  tax/recording/audit loaded-or-failed flag to `propertyStore.selectParcel` — a store change outside this
  frontend-honesty program's allowed files. **Recommended as a follow-up WO** for a slice-accurate badge.
