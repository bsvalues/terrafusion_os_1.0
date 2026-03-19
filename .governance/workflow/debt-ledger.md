# TerraFusion OS — Wave 0 Technical Debt Ledger
# CP-W0-1  |  Phase 3  |  Slice 26
# Produced: 2026-02-19 (Phase 3 inventory pass)

> **Scope**: `frontend/apps/os-shell/src/**/*.ts(x)` only.
> No source edits occurred in this phase. This is a read-only inventory.
> Allowed writes this phase: this file only (Phase 3 charter constraint).

---

## § 1 — Measurement Methodology

All counts collected via PowerShell `Select-String` across the `frontend/apps/os-shell/src` tree.

**Classification buckets used:**
| Bucket label | Path rule |
|---|---|
| `test-inner` | Files under `src/__tests__/` |
| `test-outer` | `*.test.ts(x)` / `*.spec.ts(x)` outside `__tests__/` |
| `production` | All other `.ts` / `.tsx` files |

Test-outer files: **94 files** live outside `__tests__/` but are unambiguously test code.
Minor reconciliation gap (~53 console hits, ~35 any hits) between raw total and split sum — attributed to directory walk boundary differences; does not affect triage decisions.

---

## § 2 — Debt Triage Table

| Bucket | Raw Total | test-inner | test-outer | Production (est.) | Action |
|--------|-----------|------------|------------|-------------------|--------|
| `@ts-ignore` (actual suppressions) | **0** | 0 | 0 | **0** | ✅ Baseline preserved. No regressions allowed. |
| `@ts-ignore` (string literals in enforcement test) | 4 | 4 | 0 | 0 | ✅ False positives; enforcement test functioning correctly. |
| `console.log` | ~461 (prod) | — | — | ~461 | 🟡 Triage: legitimate debug paths vs. noise. Mechanical cleanup candidate (Phase 5+). |
| `console.error` | ~278 (prod) | — | — | ~278 | 🔵 Preserve intentional error catches; suppress remainder. Requires per-file review. |
| `console.warn` | ~95 (prod) | — | — | ~95 | 🟡 Triage same as `.log`. |
| `console.debug` | ~9 (prod) | — | — | ~9 | 🟡 Low volume; mechanical cleanup candidate. |
| `console.info` | ~7 (prod) | — | — | ~7 | 🟡 Low volume; mechanical cleanup candidate. |
| `console.*` totals | 934 | 26 | 142 | ~766 | See console breakdown above. |
| `any` — `: any` param | ~241 (prod) | — | — | ~241 | 🟡 Typed params: tighten incrementally. Owner per lane. |
| `any` — `as any` cast | ~144 (prod) | — | — | ~144 | 🔴 Type casts are highest-priority: hide real type errors. Phase 5 sweep target. |
| `any` — `<any>` generic | ~93 (prod) | — | — | ~93 | 🟡 Often compat generics (React, API response shapes). Review-then-act. |
| `any` — `any[]` array | ~50 (prod) | — | — | ~50 | 🟡 Tighten to explicit typed arrays. Mechanical. |
| `any` totals | 751 | 246 | 0 | ~470 | See any breakdown above. |

---

## § 3 — Action Classification

### 🔒 Frozen (do not touch)
- `@ts-ignore` suppression count: **0** — gate is passing; do not add any suppressions
- `wave5-typeSafety.contract.test.ts` enforcement test — must remain intact

### 🔴 Phase 5 Priority (highest signal, `as any` casts)
- ~144 `as any` casts in production hiding potential real type errors
- Must be reviewed file-by-file; cannot bulk-replace
- Owner: `@tf-writer` under Phase 5 charter, per-file evidence required

### 🟡 Mechanical (bulk cleanup, lower risk)
Ready for scripted sweep AFTER founder approves Phase 5 charter:
- `console.log` / `console.debug` / `console.info` / `console.warn` in non-error paths
- `: any` typed params with obvious concrete replacements
- `any[]` arrays with inferrable element types

**Gate before any mechanical sweep:**
```
pnpm run type-check  (must stay clean after each batch)
node --test os-platform/core/tests/phase83-tools.test.mjs  (56/56 required)
```

### 🔵 Review-Required (not mechanical)
- `console.error` catches — preserve intentional error boundaries
- `<any>` generics — many are correct compat patterns (e.g., `React.ComponentProps<any>`)

---

## § 4 — Phase Constraint Record

```
Phase 3 — Wave 0: Debt Inventory
Charter constraint: NO source edits.
This ledger is the only write authorized in Phase 3.
Source cleanup is DEFERRED to Phase 5 (bucket: "mechanical") or Phase 6+ (bucket: "review-required").
Founder must explicitly open Phase 4 before any further writes.
```

---

## § 5 — Baseline Snapshot (CP-W0-1)

```
Date:        2026-02-19
Branch:      post-r3/w5f-registry-edge-cleanup
HEAD:        de0243388
Scope:       frontend/apps/os-shell/src

@ts-ignore (prod):     0      ← GATE PASSING
console.* (prod):    ~766     ← logged, not blocked
any (prod):          ~470     ← logged, not blocked

Type-check:          CLEAN
phase83:             56/56
```

---

*Ledger sealed at CP-W0-1. Next write requires Phase 5 charter.*
