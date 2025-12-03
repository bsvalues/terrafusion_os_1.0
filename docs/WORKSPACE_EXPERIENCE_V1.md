# TerraFusion OS — Workspace Experience Specification (v1)

**Status:** ACTIVE  
**Audience:** UI/UX designers, frontend engineers, AI agents  
**Scope:** Defines the *visual language*, *behavior*, and *interaction patterns* for **all workspaces** in TerraFusion OS.

> 🗺️ **Navigation Hub:** [`docs/OS_SPINE_INDEX.md`](./OS_SPINE_INDEX.md) – Links to all spine-related docs and code paths.

This spec governs:

* HomeWorkspace
* SystemActivityWorkspace
* ANY future workspace
* ANY right-rail panel
* ANY OS object embedded in a workspace

This is **not** domain-specific UI (like Parcel, Levy, GIS).  
This is the OS-level experience.

---

## 1. Core UX Philosophy

### 🍃 "Elegant Transparency"

TerraFusion OS adopts the **macOS Tahoe** design spirit blended with **TerraSphere** identity.

### 1.1 Principles

1. **Glass but grounded**
   * Subtle translucency.
   * Soft gradients.
   * No neon, no harsh primitives.

2. **Weightless motion**
   * Light easing (`cubic-bezier(0.25, 0.1, 0.25, 1)`)
   * Framer Motion used sparingly & meaningfully.
   * No "bouncy UI" unless celebrating a key action (not common).

3. **Readable at a glance**
   * Hierarchy must always be obvious.
   * Top bar → Workspace Title → Controls → Panels.

4. **Always contextual**
   * Right rail shows contextual details.
   * Nothing should ever "teleport" the user somewhere without context.

5. **TerraSphere Identity**
   * Circular motifs for indicators, status, and loading.
   * Everything reflects "objects orbiting a core."

---

## 2. Workspace Layout Template

Every workspace MUST follow this baseline:

```
┌─────────────────────────────────────────────────────────────┐
│  OSHealthSummaryBar (always visible)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  <WorkspaceRoot>                                            │
│                                                             │
│    <WorkspaceTitleRow>                                      │
│       Title      |   Search   |   Controls   |   StatusChip │
│    </WorkspaceTitleRow>                                     │
│                                                             │
│    <WorkspaceBody>                                          │
│       Primaries (left 70%)  |  Right-rail panel (30%)       │
│    </WorkspaceBody>                                         │
│                                                             │
│  </WorkspaceRoot>                                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Left-side: Primary Space

* Your tables, lists, dashboards, maps — whatever makes sense.
* Always **light hierarchy**, clear vertical rhythm, 8–16px spacing.

### 2.2 Right-rail Panel

* Always opens via **intent**.
* Width: `320–400px`.
* Never overlays content; it's always adjacent.
* Scrollable separately.

### 2.3 Workspace Title Row

Contains:

* `h1` title (18–20px, medium weight)
* Optional search field
* Optional action buttons (icon or minimal text)
* StatusChip if applicable
* Zero clutter. Center of gravity is clarity.

### 2.4 Universal Glass Container (OSGlassPanel)

**OSGlassPanel** is the foundation for every card-level container in the OS.

It provides:

* Translucent Tahoe-glass background (`rgba(20, 20, 20, 0.35)`)
* Blur (`backdrop-filter: blur(12px) saturate(140%)`)
* Rounded corners (`12px`)
* Soft depth (box-shadow with subtle inner highlight)
* Motion-in appearance via Framer Motion

Workspaces and OS objects **MUST** use `OSGlassPanel` when creating any block-level container.

```tsx
import { OSGlassPanel } from '../os/ui';

<OSGlassPanel testId="my-card" padding={16}>
  <h3>Card Title</h3>
  <p>Card content...</p>
</OSGlassPanel>
```

**Location:** `src/terrafusion-os/os/ui/OSGlassPanel.tsx`

---

## 3. OS Health Summary Bar (Universal)

### 3.1 Appearance

* Always pinned at top.
* Soft translucent background.
* Slight blur (`backdrop-filter: blur(10px)`).
* Left-aligned summary:
  * "All systems nominal" / "X warnings in last 24h" / "System degradation detected".
* Right-aligned time or quick actions.

### 3.2 Function

* Clicking opens `/workspaces/system-activity`.
* Mirrors TerraSphere status.

---

## 4. Motion & Timing (Framer Motion Standards)

### 4.1 Default timing

| Property | Value |
|----------|-------|
| Duration | `0.18s – 0.28s` |
| Easing | `cubic-bezier(0.25, 0.1, 0.25, 1)` (Apple-like ease) |

### 4.2 Right-rail panel enter/exit

```ts
// Framer Motion config
const rightRailVariants = {
  hidden: { x: 40, opacity: 0, scale: 0.99 },
  visible: { x: 0, opacity: 1, scale: 1 },
};

const transition = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1],
};
```

### 4.3 StatusChip pulse (critical)

* Use tiny pulsing halo, 8% opacity.
* Color: TerraFusion "warning amber" or "critical rose".

```css
@keyframes status-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(242, 107, 107, 0.08); }
  50% { box-shadow: 0 0 0 6px rgba(242, 107, 107, 0.08); }
}
```

### 4.4 Command Palette

* Drops from command bar location (if applicable)
* Motion: `y: -4 → 0`, `opacity: 0 → 1`

---

## 5. Typography & Color

### 5.1 Font Weight

| Element | Weight | Size |
|---------|--------|------|
| Title | Medium (500) | 18–20px |
| Section headers | Medium (500) | 14–16px |
| Body text | Regular (400) | 14px |
| Small text | Regular (400) | 12–13px, light opacity |

### 5.2 Color System (OS Level)

| Token | Value | Usage |
|-------|-------|-------|
| `--os-foreground` | `rgba(255,255,255,0.92)` | Primary text |
| `--os-foreground-muted` | `rgba(255,255,255,0.65)` | Secondary text |
| `--os-border` | `rgba(255,255,255,0.07)` | Borders, dividers |
| `--os-panel-bg` | `rgba(20,20,20,0.35)` | Panel backgrounds (+ blur) |

### 5.3 Status Colors

| Status | Color | Hex |
|--------|-------|-----|
| Nominal | Soft mint | `#93E5AB` |
| Warning | Gentle amber | `#F7D07A` |
| Critical | Rose red | `#F26B6B` |
| System | TerraFusion gradient | — |

---

## 6. OS Objects – Styling & Interaction Rules

### 6.1 ObjectQuickList

**Appearance:**
* Minimal card list
* 8px gaps
* Subtle hover lift (`transform: translateY(-1px)`)

**Interaction:**
* Click → `object_selected` intent

**States:**
* Active item highlighted with soft mint or subtle blue tint

### 6.2 WorkspaceStatusChip

**Appearance:**
* Always rounded, compact, pill-shaped
* Left: colored status dot (mint/amber/rose)
* Right: last incident short text

**Interaction:**
* Click → `workspace_status_selected` intent

### 6.3 WorkspaceActivityFeed

**Appearance:**
* Vertical list of entries
* Timestamp on the right
* Severity color-coded dot or thin stripe

**Interaction:**
* Click → `workspace_activity_selected` intent
* On hover: background soft glow

### 6.4 WorkspaceCommandPalette

**Appearance:**
* Must follow Tahoe-glass aesthetic:
  * Blur (`backdrop-filter: blur(12px)`)
  * Depth (subtle shadow)
  * Rounded corners (12px)
  * Subtle drop shadow

**Behavior:**
* Show **core commands** first; **suggested** second
* Filter as user types

---

## 7. SystemActivityWorkspace UX

This workspace must reflect the OS-wide perspective.

### 7.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  OSHealthSummaryBar                                         │
├─────────────────────────────────────────────────────────────┤
│  System Activity                    [Filter] [All▾] [Info▾] │
├───────────────────────────────────────┬─────────────────────┤
│                                       │                     │
│   Activity Table (70%)                │  Detail Panel (30%) │
│                                       │                     │
│   ┌─────┬───────────┬────┬─────────┐  │  ┌─────────────────┐│
│   │Time │ Workspace │Type│ Summary │  │  │ Entry Details   ││
│   ├─────┼───────────┼────┼─────────┤  │  │                 ││
│   │ ... │ ...       │ ...│ ...     │  │  │ Timeline        ││
│   └─────┴───────────┴────┴─────────┘  │  │                 ││
│                                       │  └─────────────────┘│
└───────────────────────────────────────┴─────────────────────┘
```

### 7.2 Controls

* Workspace filter (input)
* Severity buttons: All / Info / Warning / Incident

### 7.3 Table Rows

Each row:

| Column | Content |
|--------|---------|
| Timestamp | Left-aligned, muted |
| Workspace | Workspace name |
| Type | `info`, `warning`, `incident` |
| Summary | Entry summary text |
| Source | Component source |

Severity colors apply to a side-stripe or dot.

---

## 8. HomeWorkspace UX

Home must feel like a **mini command center**.

### 8.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  OSHealthSummaryBar                                         │
├─────────────────────────────────────────────────────────────┤
│  Home                                          [StatusChip] │
├───────────────────────────────────────┬─────────────────────┤
│                                       │                     │
│   ObjectQuickList (50%)               │  Right Panel (50%)  │
│                                       │                     │
│   ┌─────────────────────────────────┐ │  ┌─────────────────┐│
│   │ OS Object 1                     │ │  │ Health Summary  ││
│   │ OS Object 2                     │ │  │                 ││
│   │ OS Object 3                     │ │  │ Activity Feed   ││
│   │ ...                             │ │  │                 ││
│   └─────────────────────────────────┘ │  │ Timeline Panel  ││
│                                       │  │ (if opened)     ││
│                                       │  └─────────────────┘│
└───────────────────────────────────────┴─────────────────────┘
```

### 8.2 Left Column

* ObjectQuickList (OS object)
* Possibly: Quick Actions, small charts, or status cards (but always OS primitives)

### 8.3 Right Column

* StatusChip
* Health summary
* Activity feed
* Timeline panel (if opened via intent)

### 8.4 Zero Clutter Rule

HomeWorkspace is simple.
* Nothing heavy.
* No domain-specific modules.
* No complex dashboards.
* Just lightweight OS-level visibility.

---

## 9. Right-Rail Panels UX

Every panel must follow:

| Rule | Description |
|------|-------------|
| Title | At top, medium weight |
| Content | Small-scale, scannable |
| Scrolling | Scrollable independently |
| Close | Button in top-right if needed |
| Background | Translucent (`--os-panel-bg` + blur) |
| Separators | Subtle vertical lines or headings |

### 9.1 Workspace Health Panel

* Big status indicator (circle)
* "Last 24h" incident summary
* Short list of health events

### 9.2 Activity Detail Panel

* Timestamp
* Severity (with color indicator)
* Summary
* Source

### 9.3 Right-Rail Glass Panel (OSGlassPanelRightRail)

Right-rail panels **MUST** use `OSGlassPanelRightRail`.

This component provides:

* Slide-in animation from right (`x: 40 → 0`)
* Slide-out animation on exit (use with `AnimatePresence`)
* Tahoe glass styling
* Left border separator
* Full height with flex column layout

Improves consistency, maintains motion standards, and matches OS-level visual identity.

```tsx
import { AnimatePresence } from 'framer-motion';
import { OSGlassPanelRightRail } from '../os/ui';

<AnimatePresence>
  {showPanel && (
    <OSGlassPanelRightRail testId="activity-detail" width={360}>
      <h2>Activity Detail</h2>
      <p>Details here...</p>
    </OSGlassPanelRightRail>
  )}
</AnimatePresence>
```

**Location:** `src/terrafusion-os/os/ui/OSGlassPanelRightRail.tsx`

---

## 10. Interaction Rules (Global)

### 10.1 Never break user flow

* No modals that block.
* No popups that interrupt.
* Panels should slide in/out smoothly.

### 10.2 Always show context

If something changed because of an intent:
* Highlight the affected component for 500–800ms
* Use a soft glow or warm tint

### 10.3 Keyboard support

| Key | Action |
|-----|--------|
| `/` or `Cmd+K` | Open Command Palette |
| `Escape` | Close palette or right-rail |

### 10.4 Performance

* Avoid expensive animation loops
* Use CSS/GPU transforms
* Avoid re-render storms (memoize lists)

---

## 11. Component API Rules

### OS Objects must:

* Accept `workspaceId` if relevant
* Take serializable props only
* Emit intents using `emitIntent`
* **Never** fetch data or use domain APIs

### Workspaces must only use:

* Catalog OS objects
* OS hooks (`useWorkspaceActivity`, `useSystemActivity`, `useWorkspaceCommands`)

...and nothing else.

---

## 12. Visual Identity Anchors

To preserve the TerraFusion brand:

| Anchor | Value |
|--------|-------|
| Rhythm | 8px / 16px |
| Corners | 10–14px radius |
| Status colors | Mint / Amber / Rose |
| Panels | Glass + blur |
| Gradients | Soft, subtle |
| Depth | Subtle shadow |
| Motifs | Circular (TerraSphere language) |

---

## 13. CSS Custom Properties Reference

```css
:root {
  /* Colors */
  --os-foreground: rgba(255, 255, 255, 0.92);
  --os-foreground-muted: rgba(255, 255, 255, 0.65);
  --os-border: rgba(255, 255, 255, 0.07);
  --os-panel-bg: rgba(20, 20, 20, 0.35);
  
  /* Status */
  --os-status-nominal: #93E5AB;
  --os-status-warning: #F7D07A;
  --os-status-critical: #F26B6B;
  
  /* Spacing */
  --os-space-xs: 4px;
  --os-space-sm: 8px;
  --os-space-md: 16px;
  --os-space-lg: 24px;
  --os-space-xl: 32px;
  
  /* Radius */
  --os-radius-sm: 6px;
  --os-radius-md: 10px;
  --os-radius-lg: 14px;
  
  /* Motion */
  --os-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --os-duration-fast: 0.18s;
  --os-duration-normal: 0.22s;
  --os-duration-slow: 0.28s;
  
  /* Effects */
  --os-blur: blur(10px);
  --os-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

---

## 14. Future Directions (v2 & v3)

The following will come in later revisions:

| Version | Feature |
|---------|---------|
| v2 | Adaptive transparency based on system metrics |
| v2 | Dynamic TerraSphere animations |
| v2 | Workspace-level AI summaries |
| v3 | Ambient motion linked to activity spikes |
| v3 | Global OS command bar |
| v3 | Multi-workspace split view |

---

## 15. Checklist: Does My Workspace Comply?

Before shipping any workspace or OS object, verify:

- [ ] Uses `OSHealthSummaryBar` at top (if full workspace)
- [ ] Follows `WorkspaceRoot > TitleRow > Body` structure
- [ ] Right-rail opens via intent, not direct state
- [ ] All colors use `--os-*` tokens
- [ ] Motion uses `--os-ease` and `--os-duration-*`
- [ ] No domain-specific logic at OS level
- [ ] Keyboard shortcuts work (Escape, Cmd+K)
- [ ] Hover states are subtle, not jarring
- [ ] Status indicators use mint/amber/rose palette
- [ ] Components emit intents, don't fetch data

---

*Last updated: December 2025*  
*Version: 1.0*
