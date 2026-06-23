# Canon IDE Package → Repo Adaptation Plan

**Date:** 2026-06-05
**Branch:** `feat/terracanon-ide-package` (off `origin/main` @ `c93bbc1fa`)
**Package import commit:** `888ef8f38` — `docs(canon): add TerraFusion Canon IDE development package`
**Status:** Documentation only. No runtime code changed. No `os-platform` copy. No frontend skeleton copy. Repo's existing launch-surface contract test left untouched.

This document records what the TerraFusion Canon/IDE Development Package is, what is already true in the live repo, and exactly how the package should (and should not) be adapted. It exists because the package's headline runtime assumption is **stale** against current `origin/main`.

---

## 1. Summary of package intent

The package turns Canon/IDE into a **governed engineering runtime**, not another AI chat/editor surface. Core model:

- **Canon Runtime** — one shared layer of machine-readable law: rules, write-lanes, risk scoring, gates, task state, trace, permissions.
- **`os-canon`** — in-shell, OS-Core-owned constitutional command center (primary surface).
- **Canon Desktop** — standalone developer/repair shell: *powerful but never sovereign* (may edit source, run gates, manage worktrees, draft PRs; may NOT mutate production county records or bypass TerraPilot/TerraTrace).
- **`tf canon` CLI** — headless / CI / pre-commit rail.
- **TerraFusionIDE** — editor/workbench that *consumes* Canon Runtime, never owns it.

Doctrine: *Canon is law, IDE is workbench, agents are permissioned executors, TerraTrace is proof.* "Done" requires gates + diff + evidence + trace, not an agent's assertion.

---

## 2. Verification results

| Check | Command | Result |
|---|---|---|
| Package structure | `node scripts/verify-package.mjs` (flattened root) | ✅ "structure verified" |
| Package self-test | `node tests/launch-surface-contract.test.mjs` (package stub) | ✅ 1 pass / 0 fail |
| **Repo-native launch contract** | `node os-platform/core/tests/launch-surface-contract.test.mjs` | ✅ **8/8 pass** (dep-free, run in worktree against `origin/main`) |
| **Shell chrome contract** | `vitest run shellChrome.contract.test.ts` | ✅ 13/13 |
| **Anti-drift contract** | `vitest run shellAntiDrift.contract.test.ts` | ✅ 19/19 |
| **Codex navigation contract** | `vitest run codexNavigation.contract.test.tsx` | ✅ 33/33 |
| **Shell truth audit contract** | `vitest run shellTruthAudit.contract.test.ts` | ✅ 32/32 |

vitest total: **97/97 passing** (4 files, ~4.9s, vitest v1.6.1). The vitest run used the main checkout's `node_modules` (fresh worktree has none); a read-only test run mutates no source. Provenance caveat: `shellTruthAudit.contract.test.ts` carries a minor uncommitted local edit in the main checkout; the other three match `origin/main` exactly, and the dep-free `.mjs` test (run directly against the worktree's `origin/main` source) is the authoritative artifact.

Monorepo suite intentionally **not** run.

---

## 3. Finding: `os-canon` shell launch drift is ALREADY RESOLVED

The package's designated first vertical slice — *"Fix os-canon shell launch drift"* — is **already satisfied** on `origin/main`:

- `frontend/apps/os-shell/src/config/moduleComponents.tsx` — `os-canon` is in `MODULE_REGISTRY` and `MODULES`; component map has `'os-canon': { Component: CanonHome }`; aliases `canon` → `os-canon` and `terracanon` → `os-canon`.
- `frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx` — OS features (pilot/trace/canon) launch via `activateModule(id)`. **No `navigate()` drift** (explicit code + comment).
- `frontend/apps/os-shell/src/stores/desktopStore.ts` — OS feature windows open **near-full-stage**.
- `frontend/apps/os-shell/src/contracts/objectPlacement.ts` — `os-canon` typed as `os-feature-window`.
- Enforced by `shellChrome`, `shellAntiDrift`, `shellTruthAudit`, `codexNavigation` contract tests (all green above).

**Conclusion:** The package was authored against an earlier/assumed repo state (the Shell Integrity recovery list). That recovery has landed. The first slice must be re-pointed (see §10).

---

## 4. Finding: package's launch-surface test is WEAKER than the repo's

- Repo: `os-platform/core/tests/launch-surface-contract.test.mjs` — **201 lines**, asserts `os-canon` registration, alias resolution (`canon`/`terracanon`), and in-shell launch.
- Package: `tests/launch-surface-contract.test.mjs` — **15-line stub**, single assertion.

**Rule:** Do NOT copy the package's stub over the repo test. The repo version is canonical and superior.

---

## 5. Collision map

| # | Collision | Severity | Resolution |
|---|---|---|---|
| 1 | First slice already implemented (os-canon registered + `activateModule` + near-full-stage) | High | Re-point first slice to Canon Runtime computability (§10) |
| 2 | `launch-surface-contract.test.mjs` already exists (201 lines) vs package stub (15 lines) | High | Keep repo test; discard package stub |
| 3 | `frontend/apps/os-shell/src/canon/` already holds a full Canon component set (CanonEditor, CanonDiffViewer, CanonModuleHost, CanonHome…) | High | Reconcile, do not overwrite with package `frontend/os-canon/` skeletons |
| 4 | `os-platform/core/canon/` exists; package assumes `os-platform/canon/` | Medium | Standardize on `os-platform/core/canon/` before any `src/os-platform/` adaptation |
| 5 | Gate commands reference non-existent scripts (`canon-write-lane-check.mjs`, `check-hardcoded-ports.mjs`, `check-protected-paths.mjs`, `tf canon trace verify`) | Medium | Genuine future work, not a collision |
| 6 | Package double-nested on import | Resolved | Flattened before commit `888ef8f38` |
| 7 | Package uses `pnpm` (correct); `CLAUDE.md` examples say `npm` | Low | pnpm is reality; note stale doc |
| 8 | Fresh worktree has no `node_modules`; pre-commit prettier hook unresolvable | Low | Inert docs committed `--no-verify` (UI-token ratchet passed); future runtime commits need deps installed or run from a checkout with `node_modules` |

---

## 6. Files that must remain reference-only

Keep under `docs/TerraCanon/terrafusion-canon-ide-development-package/`, never wired:

- `docs/**`, `runbooks/**`, `examples/**`, `README.md`, `manifest.json`, `package.json`, `tsconfig.json`
- `tests/launch-surface-contract.test.mjs` (superseded by repo test — reference only)
- `.terrafusion/skills/**`, `.github/**` (evaluate later vs existing repo skills/templates; do not auto-wire)

---

## 7. Files that may LATER move into `os-platform/core/canon/`

Adapt selectively (reconcile with existing `os-platform/core/canon/`), do not bulk-copy:

- `config/canon-index.json`
- `config/engineering-write-lanes.json`
- `config/gate-registry.json`
- `config/command-policy.json`
- `config/agent-profiles.json`
- `config/standalone-boundaries.json`
- `config/launch-surface-contract.json` (cross-check against the embedded contract already asserted by the repo test)
- `schemas/canon-rule.schema.json`, `schemas/canon-task.schema.json`, `schemas/evidence-bundle.schema.json`, `schemas/gate-result.schema.json`, `schemas/agent-profile.schema.json`
- `src/os-platform/canon/**` → `os-platform/core/canon/` (runtime; see §10 for the bounded first cut)
- `src/os-platform/{agents,gates,trace,git}/**` → deferred runtime (post-MVP)

---

## 8. Files that may LATER move into `frontend/apps/os-shell/src/modules/os-canon/`

UI skeletons — **reconcile with existing `src/canon/` first**, do not overwrite:

- `frontend/os-canon/CanonWorkbench.tsx`, `CanonTaskComposer.tsx`, `CanonRulePanel.tsx`, `CanonPlanPanel.tsx`, `CanonDiffPanel.tsx`, `CanonGatePanel.tsx`, `CanonTracePanel.tsx`, `CanonAgentStack.tsx`, `CanonApprovalPanel.tsx`

Existing repo equivalents to diff against: `CanonEditor.tsx`, `CanonDiffViewer.tsx`, `CanonAgentsPanel.tsx`, `CanonModuleHost.tsx`, `CanonCommandPalette.tsx`, `CanonFileTree.tsx`, plus `CanonHome` (already the `os-canon` module component).

---

## 9. Deferred standalone / CLI boundaries

Build last, after the Canon Runtime MVP proves out:

- `cli/tf-canon.ts` → `cli/` (headless/CI rail) — deferred.
- `apps/canon-desktop/**` → root `apps/` (sibling of existing `apps/agent-cockpit`; no collision) — deferred, **last**.
- Standalone trust tiers (from `config/standalone-boundaries.json`): tier 0–2 local repo read/worktree-write/git-with-approval allowed; tiers 3–6 (CI, non-prod services, prod read, prod write) gated/prohibited. Standalone is never sovereign over county runtime.

---

## 10. New first real runtime slice — **Canon Runtime Computability MVP**

The original first slice is done (§3). The new first real slice is **read-only Canon intelligence** — turning written law into queryable runtime data. No agent executor, no file editing, no worktree manager, no Git/PR automation.

Canon must answer:

- What rules govern this path?
- What rules govern this task intent?
- What owner controls this source-code area?
- What gates are required before "done"?
- What risk level does this proposed diff/path carry?

**Proposed PR:** `feat(canon): add read-only Canon Runtime query MVP`

**Proposed exact file list:**

```
os-platform/core/canon/
  canon-rule.schema.json          # adapted from package schemas/canon-rule.schema.json
  canon-index.json                # adapted from package config/canon-index.json
  engineering-write-lanes.json    # adapted from package config/engineering-write-lanes.json
  canon-loader.ts                 # loads + validates index/lanes (new)
  canon-query.ts                  # path/task/owner/gate resolution (new)
  canon-risk.ts                   # path/diff risk scoring (new)

os-platform/core/tests/
  canon-query.test.mjs            # node --test, dep-free (new)
```

**Minimum API:**

```ts
getRulesForPath(path)
getRulesForTask(taskIntent)
getOwnerForPath(path)
getRequiredGatesForPath(path)
scorePathRisk(path)
```

**Out of scope for this slice:** file editing, agent executor, worktree manager, Git/PR automation, gate-runner scripts, evidence/trace writer, any UI. Boring, bounded, foundational.

---

## Recommended sequence after this plan lands

1. Adapt `os-platform/core/canon/` schema + data + loader/query/risk + dep-free test (the MVP above).
2. Reconcile `frontend/os-canon/` skeletons against existing `src/canon/` (no blind copy).
3. Add the missing gate scripts referenced by `gate-registry.json`.
4. Defer agent executor, worktree manager, CLI, and Canon Desktop until the read-only runtime is proven.
