# Slice 7.1 — Desktop Visual Polish: Discovery

> **Agent**: 1 of 5 · **Slice**: 7.1 · **Date**: 2026-02-27
> **Scope**: Lane B (`frontend/apps/os-shell/**`) — research only, no code changes

---

## 1. Objectives

Identify and catalog **all visual issues** in the TerraFusion OS Desktop shell that degrade the appearance, usability, or professional polish of the windowed desktop experience. This covers:

- Window chrome, sizing, and layout
- Suite home pages rendered inside windows
- Desktop icon grid presentation
- Taskbar / Dock visual quality
- Start Menu polish
- Top system bar
- Z-index stacking conflicts
- Design token compliance
- Accessibility (contrast, focus rings)

---

## 2. Rendering Pipeline (Verified from Source)

```
Desktop.tsx (w-screen h-screen, relative)
├── AmbientCompositor (z: background layer)
├── DesktopTopSystemBar (z-[980], pointer-events-none bar)
├── DesktopIconGrid (absolute top-10 left-3 z-[1])
├── WindowManager (absolute, w-full, h-[calc(100vh-48px)], pointer-events-none)
│   └── Window (react-rnd, pointer-events-auto, default 800×600)
│       └── motion.div (flex flex-col, w-full h-full, glassmorphism)
│           ├── TitleBar (h-10, macOS traffic-light controls)
│           └── Content (flex-1 overflow-auto)
│               └── ModuleLoader (w-full h-full overflow-auto)  ← nested scroll!
│                   └── ModuleRenderer → SuiteHome (min-h-screen) ← overflow!
├── TaskbarWithNotifications (fixed bottom-2, centered dock, z-50)
├── StartMenu (fixed bottom-16 left-4 z-[60], conditional)
├── Launcher (z: above start menu)
├── ToastContainer (z: 50)
├── DesktopContextMenu (z-[100], conditional)
├── CommandPalette (z-[10000])
├── AltTabSwitcher (z-[9998])
└── WindowPeek (z-[9999])
```

Source: [Desktop.tsx](frontend/apps/os-shell/src/shell/desktop/Desktop.tsx#L330-L380)

---

## 3. Issues Discovered

### Issue 1 (Critical): `min-h-screen` on ALL Suite Home Pages

**Severity**: High — breaks windowed rendering for every suite

Every suite home component uses `min-h-screen` as its root container. When loaded inside a Desktop window (default 800×600), this forces the content to demand at least `100vh` (~900px+), vastly exceeding the available ~560px content area. This creates:

- Excessive scroll region inside windows
- Sidebar extends beyond visible area
- Content layout designed for viewport, not container

**Files and evidence**:

| File | Line (approx) | Root class |
|------|---------------|------------|
| [ForgeSuiteHome.tsx](frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx#L104) | ~104 | `min-h-screen` |
| [AtlasSuiteHome.tsx](frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx#L60) | ~60 | `min-h-screen` |
| [DaisSuiteHome.tsx](frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx) | ~1207 | `min-h-screen` |
| [DossierSuiteHome.tsx](frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx#L57) | ~57 | `min-h-screen` |
| [GptSuiteHome.tsx](frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx#L90) | ~90 | `min-h-screen` |
| [SuiteHome.tsx](frontend/apps/os-shell/src/pages/suites/SuiteHome.tsx#L54) | ~54 | `min-h-screen` |

**Dual-context challenge**: These pages must work both at standalone routes (`/forge`) where `min-h-screen` is correct, AND inside desktop windows where it causes overflow.

### Issue 2 (High): Nested `overflow-auto` Creates Double Scrollbars

Both the Window content area and ModuleLoader independently declare `overflow-auto`:

- [Window.tsx](frontend/apps/os-shell/src/shell/desktop/Window.tsx) content area: `cn('flex-1 overflow-auto', 'rounded-b-lg')`
- [ModuleLoader.tsx](frontend/apps/os-shell/src/shell/desktop/ModuleLoader.tsx#L141): `className='w-full h-full overflow-auto'`

When suite content overflows, **two nested scrollable regions** appear — a confusing UX that wastes space and creates scroll traps.

### Issue 3 (Medium): Default Window Size Too Small

[desktopStore.ts](frontend/apps/os-shell/src/stores/desktopStore.ts#L137):
```ts
const DEFAULT_WINDOW_SIZE: Size = { width: 800, height: 600 };
```

After subtracting the 40px title bar, the usable content area is 800×560. Suite homes have:
- Header: ~64px
- Sidebar: 256px wide, full height

This leaves ~536×496px for module content — cramped for data-heavy government tables, forms, and maps.

### Issue 4 (Medium): Suite Inner Flex Layout Unconstrained Height

All suite home pages share this pattern:
```tsx
<div className='min-h-screen'>
  <header>...</header>           <!-- ~64px -->
  <div className='flex'>         <!-- NO height constraint -->
    <nav className='w-64'>...</nav>
    <main className='flex-1'>...</main>
  </div>
</div>
```

The `<div className='flex'>` after the header has **no explicit height**. It relies on content to determine height. The sidebar cannot scroll independently.

### Issue 5 (Medium): Desktop Icon Wiring Badge Never Visible

[DesktopIcon.tsx](frontend/apps/os-shell/src/shell/desktop/DesktopIcon.tsx#L161-L166):
```tsx
<span className={`absolute -top-1 -right-1 ... opacity-0 group-hover:opacity-100 ...`}>
```

The badge uses `group-hover:opacity-100` but the parent element does NOT have the `group` class. The badge is rendered but **permanently invisible** because the hover class never activates.

### Issue 6 (Medium): Z-Index Layering Inconsistencies

Current z-index values across the desktop (from code review):

| Component | Z-Index | Source |
|-----------|---------|--------|
| Desktop icons | `z-[1]` | Desktop.tsx L347 |
| Windows | Dynamic (`zIndex` from store, starts at 1) | Window.tsx |
| Resize handles | `9999` (inline) | Window.tsx RESIZE_HANDLE_STYLES |
| Top system bar | `z-[980]` | Desktop.tsx L50 |
| Snap preview | `z-[999]` | SnapPreview.tsx |
| Context menus | `z-[100]` / `z-[1000]` | DesktopContextMenu/ContextMenu |
| Start menu | `z-[60]` | StartMenu.tsx L593 |
| Taskbar | `z-50` | Taskbar.tsx |
| Toast | `z: 50` | Desktop.tsx comment |
| Alt-Tab | `z-[9998]` | AltTabSwitcher.tsx |
| Window Peek | `z-[9999]` | Desktop.tsx comment |
| Command Palette | `z-[10000]` | Desktop.tsx comment |

**Conflicts identified**:
- Window resize handles (`9999`) collide with Alt-Tab (`9998`) and Window Peek (`9999`)
- Context menus at `z-[100]` could appear behind windows with high dynamic zIndex
- Start menu at `z-[60]` is above taskbar (`z-50`) but could be behind a window with zIndex > 60
- Architecture comment says Taskbar should be z-1000, but actual class is `z-50`

### Issue 7 (Low): Top System Bar Content Hardcoded

[Desktop.tsx](frontend/apps/os-shell/src/shell/desktop/Desktop.tsx#L73):
```tsx
<span>Benton County · Tax Year 2026</span>
```

This is hardcoded text. Should come from context/config for multi-county deployment.

### Issue 8 (Low): WindowManager Height Assumes 48px Taskbar

[WindowManager.tsx](frontend/apps/os-shell/src/shell/desktop/WindowManager.tsx#L116):
```tsx
className="absolute top-0 left-0 w-full h-[calc(100vh-48px)]"
```

But the Taskbar is a **floating centered dock** positioned with `bottom-2` and `h-12`. The WindowManager uses a hard-coded 48px deduction, but the dock doesn't occupy the full width — windows could extend behind the dock. Also, the top system bar takes ~32px at the top, but windows can overlap it.

### Issue 9 (Low): Generic SuiteHome Uses Raw Tailwind Colors

[SuiteHome.tsx](frontend/apps/os-shell/src/pages/suites/SuiteHome.tsx#L54):
```tsx
<div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
```

Uses raw Tailwind color classes (`slate-950`, `slate-900`) instead of TerraFusion design tokens (`hsl(var(--tf-bg))`). Similar issue in the error state: `bg-slate-950`, `text-red-400`.

### Issue 10 (Info): UI Token Compliance — 199 Active Violations

[ui-token-compliance.contract.json](ui-token-compliance.contract.json) reports:
- `violationCount: 199`
- `ok: false`
- Types: `RAW_HEX`, `DISALLOWED_COLOR_FUNCTION`

The ratchet contract ([ui-token-ratchet.contract.json](ui-token-ratchet.contract.json)) shows `delta: 0` — no regressions, but no progress either. The current baseline is 199 violations.

---

## 4. Design System Summary (Token Architecture)

**Primary CSS variables** (from [terrafusion-tokens.css](frontend/apps/os-shell/src/styles/terrafusion-tokens.css)):

| Token | Purpose |
|-------|---------|
| `--tf-bg` | Background (void/midnight) |
| `--tf-fg` | Foreground text |
| `--tf-border` | Border color |
| `--tf-muted` | Muted text |
| `--tf-card-bg` | Card surfaces |
| `--tf-surface-2` | Secondary surface (title bars) |
| `--tf-transcend-highlight` | Accent (cyan brand) |
| `--tf-suite-forge` / `atlas` / etc. | Suite-specific brand colors |
| `--tf-wc-minimize` / `maximize` / `close` | Window control colors (macOS traffic lights) |

**Typography**: Golden ratio scale (φ = 1.618), Inter font family, JetBrains Mono for code.

**Spacing**: Base-8 system (`--space-1: 4px` through `--space-32: 128px`).

**Window chrome**: macOS Tahoe-inspired glassmorphism — `blur(28px)`, `saturate(180%)`, translucent backgrounds with `hsl(var(--tf-bg) / 0.68)`.

---

## 5. Constraints

| Constraint | Detail |
|-----------|--------|
| Scope | Lane B only: `frontend/apps/os-shell/**` |
| No breaking changes | Window.tsx, WindowManager.tsx architecture must remain |
| Dual-context suites | Suite homes must work both at standalone routes AND inside windows |
| Token compliance | Must not increase violation count (ratchet: 199 baseline) |
| Existing tests | 38 test files in `__tests__/` — must not break |
| Performance | No heavy animations; respect `prefers-reduced-motion` |
| Accessibility | Maintain existing ARIA patterns; improve where deficient |

---

## 6. Existing Test Coverage (38 Files)

Test files in [frontend/apps/os-shell/src/shell/desktop/__tests__/](frontend/apps/os-shell/src/shell/desktop/__tests__/):

| Test File | Covers |
|-----------|--------|
| Window.test.tsx | Window chrome, controls, drag/resize |
| WindowManager.test.tsx | Window rendering, z-order |
| WindowManagerIntegration.test.tsx | Full pipeline integration |
| Desktop.test.tsx | Root orchestrator rendering |
| DesktopIcons.test.tsx | Icon grid, selection, launch |
| DesktopIconGrid.canonical.test.tsx | Constitutional icon derivation |
| Taskbar.test.tsx | Dock layout, glass effect, running apps |
| StartMenu.test.tsx | Search, pinned apps, all apps |
| WindowAnimations.test.tsx | Framer Motion variants |
| WindowSnapping.test.tsx | Snap zones, preview |
| DesktopIntegration.test.tsx | Full desktop integration |
| And 27 more... | Context menus, error boundaries, notifications, etc. |

**Gap**: No tests verify suite home layout behavior when rendered inside windows. No visual regression tests.
