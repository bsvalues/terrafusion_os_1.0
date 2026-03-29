# CP-55 — Shell Hot-Surface Seal

**Date**: 2026-03-29  
**Phase**: CP-55 — Shell hot-surface seal  
**Track**: Unlock  
**Status**: `COMPLETED`  
**Authored by**: Codex

---

## Purpose

Seal the exact file scope for `50E` (Desktop Shell Proof Seal) and confirm the narrow
hot-file window authorized by the co-founder. Confirm that `50E` is fully contained in
`StageZeroState.tsx` with no coupling to the launcher-dialect hot files owned by `45D`.
Confirm that `45D` remains architectural-risk HOLD — it is NOT promoted by this phase.

---

## Authorization Record

**Co-founder ruling (2026-03-29):**

> Authorized hot-file window for CP-55: `desktopManifest.ts` + `DesktopIconGrid.tsx`
> NOT authorized: `suiteRegistry.ts`

These three files were read (not written) to determine whether `50E`'s proof scope is
self-contained or whether adjacent launcher files must also be named in the card.

---

## File-Archaeology Findings

### File 1 — `StageZeroState.tsx` (candidate `50E` write surface)

**Path**: `frontend/apps/os-shell/src/shell/desktop/StageZeroState.tsx`  
**Nature**: OS-level idle-scene surface; no import from desktopManifest.ts or DesktopIconGrid.tsx

**50E changes confirmed** (lines 342–346):

```tsx
<span>Last sync: –</span>
<span>Appeals: –</span>
<span className='flex items-center gap-1'>
  <span className='inline-block w-1.5 h-1.5 rounded-full bg-green-400' />
  Status: –
</span>
```

**Data posture of other panels**:

| Panel | Source | Live? |
|-------|--------|-------|
| Parcel count | `useParcelCount()` → API-backed, fallback 89,247 | ✅ API |
| Recent Work | `useRecentParcels()` → OS session state | ✅ Real |
| Today's Work | `useTodaysWork()` → `isSampleData` flag → `DemoDataBanner` | ✅ Banner conditioned correctly |
| County status strip | `Last sync: –`, `Appeals: –`, `Status: –` | ✅ Sealed (50E done) |

**Coupling check**: `StageZeroState.tsx` does **NOT** import or reference:
- `desktopManifest.ts` — confirmed absent (grep verified)
- `DesktopIconGrid.tsx` — confirmed absent (separate component tree)
- `suiteRegistry.ts` — confirmed absent

**Conclusion**: `50E` scope is **fully local to `StageZeroState.tsx`**. No adjacent file needs
to be in scope. Card may be issued with a single-file allowed-files list.

---

### File 2 — `desktopManifest.ts` (read-only reference)

**Path**: `frontend/apps/os-shell/src/config/desktopManifest.ts`  
**Nature**: DERIVED — pure mapping layer over `suiteRegistry.ts`; no honesty claims of its own

**`getDesktopIcons()` chain**:
```
CONSTITUTIONAL_SUITES     → suiteToDesktopIcon()    → objectClass: 'suite'
OS_SURFACES (status=live) → surfaceToDesktopIcon()  → objectClass: 'suite'
OS_FEATURES (route + status=live) → featureToDesktopIcon() → objectClass: 'system'
```

`wiringStatus` in every entry comes directly from `suiteRegistry.ts` — no overrides, no
fabricated claims in this file. No fix needed here.

**Conclusion**: `desktopManifest.ts` requires **no write action** under `50E` or `45D` at
this time. Any future dialect change to `wiringStatus` values must originate in
`suiteRegistry.ts` (which belongs exclusively to `45D`'s write surface).

---

### File 3 — `DesktopIconGrid.tsx` (read-only reference)

**Path**: `frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx`  
**Nature**: Pure rendering consumer of `getDesktopIcons()` — no hardcoded icon list

**Key design facts confirmed**:
- `DESKTOP_ICONS = getDesktopIcons()` is module-level; no hardcoded launcher list (Phase 22 clean)
- `wiringStatus` badges passed through from the manifest; this component does not fabricate readiness claims
- `handleLaunch` distinguishes `surface-workbench` (→ `openWorkbenchWindow`) from all other icons (→ `activateModule`)
- No import from `StageZeroState.tsx`; entirely separate component tree

**Conclusion**: `DesktopIconGrid.tsx` requires **no write action** under `50E`. Its honesty
posture is already correct — readiness is baked in via `wiringStatus` from `suiteRegistry.ts`.
Any future dialect reconciliation is owned by `45D`.

---

## Structural Isolation Map

```
StageZeroState.tsx          desktopManifest.ts         DesktopIconGrid.tsx
       │                           │                           │
       │ (NO coupling)             │ derives from              │ consumes
       │                           ▼                           │
       │                     suiteRegistry.ts ◄── (45D only) ─┘
       │
       ▼
  Uses OS hooks only:
  useParcelCount, useRecentParcels, useTodaysWork, useCommandPaletteStore
```

**These two surfaces are fully orthogonal.** Editing `StageZeroState.tsx` cannot cause
a collision with `desktopManifest.ts` or `DesktopIconGrid.tsx`.

---

## Card Outcomes

### Card `50E` — Desktop Shell Proof Seal

**Status after this phase**: `READY` (HOLD lifted)

**Sealed allowed file**:

```
frontend/apps/os-shell/src/shell/desktop/StageZeroState.tsx
```

**Explicitly OUT of scope** (confirmed by this phase):
- `DesktopShell.tsx` — not a target; launcher infra
- `ModuleLauncher.tsx` — not a target; launcher infra
- `moduleComponents.tsx` — not a target; launcher infra
- `desktopManifest.ts` — no write needed; derived read-only layer
- `DesktopIconGrid.tsx` — no write needed; honesty already correct via wiringStatus
- `suiteRegistry.ts` — NOT authorized; belongs to `45D` exclusively

**50E Implementation Note**: The liveness-string fix is already complete as of commit
`51c59c0c0` (Wave 3 Pool B). The `Last sync: –`, `Appeals: –`, `Status: –` replacements
are in place. No further code work is required. This card may be considered
**implementation-DONE, proof-SEALED by CP-55**.

---

### Card `45D` — Shell Launcher Truth-Dialect Reconciliation

**Status after this phase**: **`HOLD` — unchanged**

**Reason**: `45D` carries an `ARCHITECTURAL-RISK-HOLD` classification. This hold is not
a file-scope gap — it is a separate governance decision. The suiteRegistry dialect
(`live | wip | planned`) needs reconciliation with the March 28 truth dialect, but that
change has full-shell impact. It requires explicit architectural-risk authorization in a
separate governance decision, not merely a hot-file window.

**What CP-55 does NOT grant**: CP-55 does not authorize writing to `suiteRegistry.ts`.
The hot-file window opened by the co-founder covers read-only inspection of
`desktopManifest.ts` + `DesktopIconGrid.tsx` only.

**`45D` remains HOLD until**: explicit architectural-risk authorization from the co-founder
in a dedicated governance ruling. This is a deferred decision, not a Codex-docs matter.

---

## Hot-File Collision Matrix (Shell Zone)

| File | Owner | Status | Can touch in `50E`? | Can touch in `45D`? |
|------|-------|--------|---------------------|---------------------|
| `StageZeroState.tsx` | `50E` (OS surface) | READY | ✅ Yes — sole write file | ❌ No — not in scope |
| `desktopManifest.ts` | `45D` (derived) | NO-WRITE-NEEDED | ❌ No writes needed | ✅ When 45D opens |
| `DesktopIconGrid.tsx` | `45D` (renderer) | NO-WRITE-NEEDED | ❌ No writes needed | ✅ When 45D opens |
| `suiteRegistry.ts` | `45D` (dialect source) | HOLD | ❌ Explicitly excluded | ✅ When 45D opens |
| `DesktopShell.tsx` | `45D` (launcher infra) | HOLD | ❌ Out of 50E scope | Requires archi-risk auth |
| `ModuleLauncher.tsx` | `45D` (launcher infra) | HOLD | ❌ Out of 50E scope | Requires archi-risk auth |

---

## Proof of No Spill

The co-founder required confirmation that `50E` will not spill into launcher files. The
following confirms the wall holds:

1. `StageZeroState.tsx` has zero imports from launcher infrastructure
2. `StageZeroState.tsx` calls `activateModule(...)` only from Quick Actions (reads,
   does not register or redefine module routes)
3. `StageZeroState.tsx` calls `openWorkbenchWindow()` via dynamic import from
   `parcelContext` (not from launcher config)
4. The county status strip, Recent Work panel, and Today's Work panel have no connection
   to `suiteRegistry.ts`, `desktopManifest.ts`, or `DesktopIconGrid.tsx`

**Wall holds. No spill path exists.**

---

## Copilot Issue Guidance

### Issuing `50E`

```
Card: 50E — Desktop Shell Proof Seal
Class: SERIAL-CLEAR (single file, OS surface)

Allowed Files:
  - frontend/apps/os-shell/src/shell/desktop/StageZeroState.tsx

Forbidden (confirmed by CP-55):
  - Do NOT touch desktopManifest.ts
  - Do NOT touch DesktopIconGrid.tsx
  - Do NOT touch suiteRegistry.ts
  - Do NOT touch DesktopShell.tsx, ModuleLauncher.tsx, moduleComponents.tsx
  - Do NOT widen into any hook, store, or activation service file

Task:
  The liveness string fixes are already done (commit 51c59c0c0). Verify and
  proof-seal: county status strip shows only "–" dashes (not sample strings),
  parcel count is from useParcelCount(), DemoDataBanner is conditioned on
  isSampleData, Recent Work comes from useRecentParcels().

  Write a proof comment in the file header if not already present. Do not
  change any data logic — only verify posture and document the proof.
```

### Do NOT issue `45D` until

The architectural-risk authorization decision is made explicitly by the co-founder in
a separate governance ruling. Do not treat CP-55 completion as that authorization.

---

## Board Update

`CP-55` → `COMPLETED`

`50E` hold lifted → `READY` (implementation already done; proof sealed here)

`45D` hold status → **unchanged** (`ARCHITECTURAL-RISK-HOLD` — separate governance decision required)
