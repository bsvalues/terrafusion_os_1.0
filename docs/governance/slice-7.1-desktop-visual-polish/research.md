# Slice 7.1 — Desktop Visual Polish: Research

> **Agent**: 1 of 5 · **Slice**: 7.1 · **Date**: 2026-02-27
> **Scope**: Lane B (`frontend/apps/os-shell/**`) — research only

---

## 1. Window System Analysis

### 1.1 Window Lifecycle

Windows are managed by a Zustand store ([desktopStore.ts](frontend/apps/os-shell/src/stores/desktopStore.ts)):

```ts
// State per window
interface DesktopWindow {
  id: string;
  moduleId: string;
  title: string;
  icon: string;
  desktopId: string;       // Virtual desktop assignment
  position: Position;       // { x, y }
  size: Size;               // { width, height }
  state: WindowState;       // 'normal' | 'minimized' | 'maximized' | 'snapped'
  zIndex: number;
  snapZone?: SnapZone;
  metadata?: Record<string, any>;
}
```

Key constants:
- `DEFAULT_WINDOW_SIZE: { width: 800, height: 600 }` — too small
- `MIN_WINDOW_SIZE: { width: 400, height: 300 }` — appropriate minimum
- `CASCADE_OFFSET: 30` — pixel offset for new window cascade
- `BASE_POSITION: { x: 100, y: 50 }` — initial window position
- `TASKBAR_HEIGHT: 48` — used for snap calculations

### 1.2 Window Chrome (Window.tsx)

**Rendering**: Uses `react-rnd` (Rnd) for drag/resize. Framer Motion for open/close animations.

**Title bar** (h-10 / 40px):
- macOS-style traffic light controls (close/minimize/maximize) on LEFT
- Title + icon centered
- Drag handle covers most of title bar except controls
- Double-click on title bar toggles maximize

**Glass effect** (active window):
```css
background: hsl(var(--tf-bg) / 0.68)
backdrop-filter: saturate(180%) blur(28px)
border: 0.5px solid hsl(var(--tf-text) / 0.12)
box-shadow: 0 24px 80px hsl(var(--tf-bg) / 0.55), 0 8px 24px hsl(var(--tf-bg) / 0.3)
```

**Inactive window**: Lower opacity borders and shadows — good visual hierarchy.

**Content area**:
```tsx
<div className={cn('flex-1 overflow-auto', 'rounded-b-lg')}
     style={{ background: 'linear-gradient(180deg, transparent, hsl(var(--tf-bg) / 0.15))' }}>
```

**Resize handles**: All 8 directions enabled. Custom styles with `zIndex: 9999` on all handles — this is problematic (see z-index analysis).

### 1.3 Window Snapping

Full snap system implemented:
- 7 snap zones: left, right, top, top-left, top-right, bottom-left, bottom-right
- `SNAP_THRESHOLD: 20px` from edge triggers detection
- Visual preview via `SnapPreview.tsx` (z-[999])
- Stores `previousPosition` and `previousSize` for restore from snap

### 1.4 Window Animations (windowAnimations.ts)

- Open: scale 0.8→1.0 + fade in + slight drop (y: 20→0)
- Spring physics: stiffness 300, damping 30, mass 0.8
- Close: scale 1.0→0.8 + fade out
- Respects `prefers-reduced-motion` via global CSS kill-switch in globals.css

### 1.5 Virtual Desktops

4 pre-created virtual desktops. Switching, creation, removal all implemented. Windows are filtered by `desktopId`.

---

## 2. Suite Home Component Analysis

### 2.1 Architecture Pattern

All 5 constitutional suite homes + generic SuiteHome share identical layout:

```tsx
<div className='min-h-screen' style={{ background: 'hsl(var(--tf-bg))' }}>
  <header className='backdrop-blur-xl'>
    <div className='max-w-[1600px] mx-auto px-6 py-4'>
      [Back button] [Suite icon] [Suite title + description]
    </div>
  </header>
  <div className='flex'>
    <nav className='w-64 shrink-0 p-4 space-y-1'>
      [Module sidebar buttons]
    </nav>
    <main className='flex-1 min-w-0'>
      <Suspense fallback={<ModuleLoading />}>
        [Lazy-loaded module content]
      </Suspense>
    </main>
  </div>
</div>
```

### 2.2 Content Quality Assessment

| Suite Home | # Modules | Content Status |
|------------|-----------|----------------|
| ForgeSuiteHome | 6 (all active) | Full implementation — CostForge, CompsForge, Income, Appeal, Reconciliation, Audit |
| AtlasSuiteHome | 7 (all active) | Full implementation — GIS, ParcelLens, LayerWorks, Sketch, Print, Export, Query |
| DaisSuiteHome | 6 (all active) | Rich inline content — Levy calculator (API-wired), PILT, Certification, Appeals, Permits, Calendar |
| DossierSuiteHome | 6 (all active) | Full implementation — Documents, Evidence, Defense, Chain, Photos, Search |
| GptSuiteHome | 6 (all active) | Full implementation with lazy-loaded + error fallback — Studio, Marketplace, Management, Builder, Analytics, RAG |
| SuiteHome (generic) | 0 | WIP stub — placeholder quick actions, recent items, favorites |

**All suites have real, functional content** — they are NOT empty stubs. This makes the windowed rendering issues more impactful because users actually use this content.

### 2.3 Module Loading Path (Desktop Window)

1. Desktop icon double-click → `activateModule('forge')` ([DesktopIconGrid.tsx](frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx#L94))
2. Module activation normalizes: `forge` → `suite-forge` via `MODULE_ALIASES` ([moduleComponents.tsx](frontend/apps/os-shell/src/config/moduleComponents.tsx#L52))
3. `desktopStore.openWindow('suite-forge', 'TerraForge', 'Hammer')`
4. WindowManager renders `<Window>` → `<ModuleLoader moduleId='suite-forge'>` → `<ModuleRenderer>`
5. ModuleRenderer switch case renders `<ForgeSuiteHome />`

### 2.4 Standalone Route Path

Router directly renders the suite home at `/forge`, `/atlas`, etc. — no Window chrome, no ModuleLoader wrapper. Here `min-h-screen` is correct.

---

## 3. Design Token & Theme Analysis

### 3.1 CSS Variable Architecture

**Base HSL channel tokens** (defined in terrafusion-theme.css):
```css
--tf-bg: 220 40% 5%;           /* near-black void */
--tf-fg: 0 0% 100%;            /* white text */
--tf-border: 220 20% 25%;      /* subtle borders */
--tf-muted: 220 20% 50%;       /* secondary text */
--tf-surface-2: 220 20% 15%;   /* title bars, elevated surfaces */
--tf-card-bg: 220 20% 12%;     /* card backgrounds */
```

**Suite brand colors**:
```css
--tf-suite-forge: 25 90% 55%;    /* warm orange */
--tf-suite-atlas: 200 80% 55%;   /* sky blue */
--tf-suite-dais:  280 60% 60%;   /* purple */
--tf-suite-dossier: 160 60% 45%; /* teal */
--tf-suite-gpt: 340 70% 55%;     /* magenta */
```

**Window control tokens** (macOS traffic lights):
```css
--tf-wc-close: ...;
--tf-wc-minimize: ...;
--tf-wc-maximize: ...;
```

### 3.2 Token Compliance Status

From [ui-token-compliance.contract.json](ui-token-compliance.contract.json):
- **199 violations** (ratchet baseline)
- Violation types: `RAW_HEX` (hex colors in content strings — mostly false positives from data), `DISALLOWED_COLOR_FUNCTION` (raw `hsl()` with fallback values)
- The ratchet allows no INCREASE, but reduction is optional for this slice

### 3.3 Glass/Material Design Patterns

The desktop uses a consistent "macOS Tahoe" glass language:
- Translucent backgrounds: `hsl(var(...) / 0.55-0.68)`
- Backdrop blur: `blur(20-28px)` with `saturate(180%)`
- Thin borders: `0.5px solid hsl(var(--tf-border) / 0.15-0.4)`
- Layered box shadows for depth
- All inline styles (not Tailwind classes) for glass effects — pattern used in Window, Taskbar, Top System Bar, Start Menu

### 3.4 Font Stack

```css
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif; /* primary */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; /* secondary */
font-family: 'JetBrains Mono', 'Fira Code', monospace; /* code */
```

`globals.css` imports Inter and JetBrains Mono from Google Fonts. SF Pro Display won't be available on Windows — falls back to system fonts, which is fine.

---

## 4. Desktop Icon Grid Analysis

### 4.1 Icon Derivation

Icons are derived from the canonical suite registry via [desktopManifest.ts](frontend/apps/os-shell/src/config/desktopManifest.ts). This is correct — single source of truth.

Currently renders: Forge, Atlas, Dais, Dossier, GPT, Pilot, Trace, Canon (8 icons).

### 4.2 Grid Layout

```tsx
<div className='grid grid-cols-3 gap-x-1 gap-y-3 p-3'>
```

3-column grid, positioned at `absolute top-10 left-3 z-[1]`. The `gap-x-1` (4px) is very tight between columns compared to `gap-y-3` (12px) between rows.

### 4.3 Icon Component

Each icon: `w-[76px] h-[90px]` with:
- TerraSphereIcon (56px, 3D wireframe orb with embedded Lucide glyph)
- Label: `text-[11px]` with text shadow for readability

**Bug**: Wiring status badge has `opacity-0 group-hover:opacity-100` but the parent doesn't have `group` class. Badge is permanently invisible.

### 4.4 Hover/Selection States

- Hover: `hover:bg-white/8` — very subtle, borderline invisible
- Selected: `bg-white/20 shadow-[inset_0_0_0_1.5px_hsl(var(--tf-text)_/_0.25)]` — subtle ring

---

## 5. Taskbar (Dock) Analysis

### 5.1 Layout

macOS Tahoe-style floating centered dock:
```tsx
className='fixed bottom-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 h-12 rounded-2xl'
```

Composition: `[TerraSphere home] | [Running apps] | [System tray]`

System tray includes: ParcelContextIndicator, SentinelChip, AIStatusIndicator, NotificationBell, Clock.

### 5.2 Running Apps Display

Running windows on current virtual desktop shown as dock buttons:
- 40×40px buttons with TerraSphereIcon
- Active indicator: cyan dot below (4px)
- Running indicator: gray dot (3px)
- Minimized: `opacity-50`

### 5.3 Glass Effect

```css
background: hsl(var(--tf-bg) / 0.55);
backdrop-filter: saturate(180%) blur(24px);
border: 1px solid hsl(var(--tf-border) / 0.4);
max-width: calc(100vw - 2rem);
```

---

## 6. Start Menu Analysis

Position: `fixed bottom-16 left-4 z-[60]`

Uses `@terrafusion/ui` Panel component. Contents:
- Search input (auto-focus)
- Pinned apps grid (4 columns)
- All apps scrollable list
- Recent apps section
- User profile footer

**Potential z-index issue**: z-[60] could be behind windows with dynamic zIndex > 60.

---

## 7. Z-Index Architecture (Full Map)

| Layer | Value | Component | Notes |
|-------|-------|-----------|-------|
| Desktop icons | `1` | DesktopIconGrid | Lowest clickable layer |
| Windows (dynamic) | `1, 2, 3...N` | Window via desktopStore | Increments on focus |
| Taskbar | `50` (class) | Taskbar | Comment says z-1000 but actual is z-50 |
| Toast container | 50 (comment) | ToastContainer | Potential collision with taskbar |
| Start menu | `60` | StartMenu | Just above taskbar |
| Context menus | `100` | DesktopContextMenu | May be behind high-z windows |
| App context menu | `100` | AppContextMenu | Same layer as desktop context |
| Generic context | `1000` | ContextMenu.tsx | Inconsistent with others at 100 |
| Snap preview | `999` | SnapPreview | Above windows but below system UI |
| Top system bar | `980` | DesktopTopSystemBar | Below snap preview |
| Resize handles | `9999` (inline) | Window.tsx | Very high, conflicts with overlays |
| Alt-Tab switcher | `9998` | AltTabSwitcher | May be behind resize handles |
| Window Peek | `9999` | WindowPeek comment | Collides with resize handles |
| Command Palette | `10000` | CommandPalette | Highest layer — correct |

**Issues**:
1. Taskbar z-50 is lower than windows could reach with many focus cycles
2. Resize handle z-9999 can overlay Alt-Tab switcher
3. Context menus at z-100 could be behind windows
4. Two different context menu z-indices (100 vs 1000)

---

## 8. Existing Test Coverage Analysis

### 8.1 Test Infrastructure

- **Framework**: Jest with @testing-library/react
- **Setup**: jsdom environment, manual jest-dom extension
- **Mocks**: react-rnd mocked (doesn't work in jsdom), child components mocked in Desktop.test

### 8.2 Coverage by Area

| Area | Tests | Quality |
|------|-------|---------|
| Window chrome | Window.test.tsx | Good — rendering, controls, focus |
| Window manager | WindowManager.test.tsx + Integration | Good — z-order, filtering |
| Desktop orchestrator | Desktop.test.tsx | Good — rendering, keyboard shortcuts |
| Desktop icons | DesktopIcons.test.tsx + canonical | Good — grid, selection, launch |
| Taskbar | Taskbar.test.tsx | Good — layout, styling, glass effect |
| Start Menu | StartMenu.test.tsx + 4 more | Thorough |
| Window snapping | WindowSnapping.test.tsx | Good — zone detection, preview |
| Window animations | WindowAnimations.test.tsx | Good — variants |
| Alt-Tab | Desktop.altTab.test.tsx | Good — candidate building |
| Error boundaries | 2 test files | Good |
| Notifications | 2 test files | Good |
| Window Peek | WindowPeek.test.tsx + integration | Good |

### 8.3 Test Gaps

| Gap | Impact |
|-----|--------|
| Suite home layout in window context | No tests verify min-h-screen bug |
| ModuleLoader overflow behavior | Not tested |
| Default window size assertions | Not tested |
| Desktop icon wiring badge visibility | Not tested |
| Z-index ordering assertions | Not tested at integration level |
| Token compliance on desktop components | Only contract-level ratchet exists |

---

## 9. Performance Considerations

### 9.1 Animation Budget

- Window open/close: spring animation with ~300ms duration
- Glassmorphism: `backdrop-filter: blur(28px)` is GPU-composited but expensive with many windows
- Desktop background: Pure CSS mesh gradient via CSSAmbientLayer — lightweight
- Global kill-switch: `.reduce-motion-force` class disables all animations

### 9.2 Render Cost

- Each visible window renders: Rnd + motion.div + TitleBar + content
- ModuleLoader uses React.lazy + Suspense — good for initial load
- Suite homes lazy-load their modules too — good nesting

### 9.3 Memory

- desktopStore holds all window state in Zustand (lightweight)
- Minimized windows return `null` from Window component (don't render DOM)
- Virtual desktop filtering prevents off-screen rendering

---

## 10. Accessibility Snapshot

### 10.1 Good Practices Found

- Desktop: `role='main'`, `aria-label='TerraFusion Desktop'`
- WindowManager: `role='region'`, `aria-label='Application windows'`, `aria-live='polite'`
- Taskbar: `role='navigation'`, `aria-label` via i18n
- Desktop icons: `role='button'`, `tabIndex={0}`, `aria-label`, keyboard Enter to launch
- Window controls: `aria-label` on all buttons
- Start Menu: `role='searchbox'`, `aria-label` via i18n

### 10.2 Accessibility Gaps

- Window title bar: No `aria-label` on the title bar region itself
- Desktop icon hover state (`bg-white/8`) may have insufficient contrast
- No skip-to-content mechanism for keyboard users
- Focus order between desktop icons, windows, and taskbar is not explicitly managed
- **Risk**: May not fill viewport in standalone mode if ancestors lack height

### Approach B: Use a CSS utility class that adapts
- Create a `.suite-container` class: `min-height: 100%; height: 100%;`
- Or use Tailwind `h-full min-h-0` which works well in flex contexts

### Approach C (Chosen): Use `h-full` with flex column layout
- Change root to `h-full flex flex-col`
- Change the flex body to `flex-1 flex min-h-0`
- This fills the container height in windows AND fills viewport in standalone routes
- `min-h-0` on the flex row prevents min-height: auto from causing overflow
- The inner `<main>` gets `overflow-auto` for scrolling module content

### Additional Fix: Remove redundant `overflow-auto` from ModuleLoader
- `ModuleLoader.tsx` has `overflow-auto` which conflicts with Window content area's `overflow-auto`
- Change to `overflow-hidden` to let the Window content area handle scrolling

### Additional Fix: Increase default window size for suites
- 800x600 is cramped for suite content with sidebars
- Recommend 1024x700 as default for better usability
