# Slice 7.3 — CommandPalette Parcel Search: Research

> Agent 3 of 5 · Governance Cycle · 2026-02-27
> Scope: Research-only. No source modifications.

---

## 1  CommandPalette Architecture Deep-Dive

### 1.1  Component Hierarchy

```
Desktop.tsx (z-index 10000)
 └─ CommandPalette.tsx
      ├─ backdrop (div, onClick → close)
      ├─ Panel (@terrafusion/ui)
      │   ├─ search input (ref → inputRef)
      │   ├─ results listbox (ref → listRef)
      │   │   ├─ category headers (role="group")
      │   │   │   └─ CommandItemRow × N (role="option")
      │   │   └─ empty state ("No results found")
      │   └─ footer (keyboard hints + command count)
      └─ (no portal — renders inline in Desktop)
```

### 1.2  State Flow

```
Ctrl+K → useKeyboardShortcuts → toggleCommandPalette()
  → commandPaletteStore.isOpen = true
  → CommandPalette renders (isOpen guard)
  → inputRef.focus() (useEffect)
  → user types → handleQueryChange → setQuery(local) + setSearchQuery(store)
  → useMemo: filterCommands(commands, query) → filteredCommands
  → useMemo: parcelCommand (if digits-only)
  → useMemo: groupedItems → flatList
  → selectedIndex tracks keyboard position (resets to 0 on query change)
  → Enter / Click → item.action() → navigate + close
```

### 1.3  Store Design (`commandPaletteStore.ts`)

```ts
// Zustand with persist (localStorage: 'terrafusion-command-palette')
interface CommandPaletteState {
  isOpen: boolean;
  searchQuery: string;
  recentCommands: string[];  // max 5, persisted

  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearchQuery: (query: string) => void;
  addToRecent: (commandId: string) => void;
  clearRecent: () => void;
}
```

Convenience hooks exported:
- `useCommandPaletteOpen()` — isOpen selector
- `useCommandPaletteSearch()` — searchQuery selector
- `useRecentCommands()` — recentCommands selector
- `useCommandPaletteActions()` — all actions

### 1.4  Command Item Shape

```ts
interface CommandItem {
  id: string;              // e.g. 'module:costforge', 'nav:parcel:12345'
  label: string;           // Display text
  description?: string;    // Secondary line
  iconName: string;        // Lucide icon name
  iconVariant?: TerraSphereIconVariant;  // Brand sphere color
  category: CommandCategory;
  keywords?: string[];     // Extra fuzzy-match targets
  shortcut?: string;       // e.g. 'Ctrl+1'
  action: () => void;      // Side-effect closure
}
```

### 1.5  Result Grouping Order

```ts
const categories = ['navigation', 'recent', 'modules', 'settings', 'actions'];
```

Navigation is always first → new parcel search results will appear at the top.

---

## 2  Backend API Analysis for Parcel Search

### 2.1  Available Endpoints

| Endpoint | Method | Best for |
|----------|--------|----------|
| `GET /api/properties?search={q}&page=1&pageSize=5` | GET | Quick search (parcel#, address, owner substring) |
| `GET /api/properties/parcel/{parcelNumber}` | GET | Exact parcel number lookup |
| `POST /api/atlas/parcels/search` | POST | Full-text search with filters (zoning, value, acreage) |

**Recommendation**: Use `GET /api/properties?search={q}&pageSize=5` for the command
palette. It already supports free-text search across parcel number, address, and owner.
The atlas endpoint is heavier (POST with filter body) and is better suited for the
GIS viewer's advanced search.

### 2.2  Response Shape for Properties Endpoint

```ts
// GET /api/properties?search=clearwater&pageSize=5
{
  items: [
    {
      id: 42,   // int
      parcelNumber: "104841000002000",
      address: "3210 W Clearwater Ave",
      ownerName: "Johnson, Michael R",
      assessedValue: 378000,
      landValue: 120000,
      improvementValue: 258000,
      countyId: 1,
      countyName: "Benton",
      createdAt: "2025-06-15T...",
      updatedAt: "2025-06-15T..."
    }
  ],
  totalCount: 1,
  page: 1,
  pageSize: 5,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
}
```

### 2.3  Atlas Service (Frontend Client, Fallback Support)

`atlasService.ts` provides `searchParcels(request)`, which:
1. Calls `POST /api/atlas/parcels/search`
2. On failure, falls back to client-side filtering of 5 hardcoded parcels

The fallback ensures the palette shows results even when the backend is offline.

### 2.4  Auth Requirements

All property endpoints require `[Authorize]`. The frontend must include
`Authorization: Bearer {token}` via `getToken()` from `@/auth/authStorage`.

---

## 3  Navigation Flow Design

### 3.1  Current Flow (Digits-Only)

```
User types "12345" → regex matches → "Go to Parcel 12345" shown
  → Enter → navigate('/property/12345') → close()
```

### 3.2  Proposed Flow (Full Parcel Search)

```
User types "clearwater" (≥ 3 chars, debounced 300ms)
  → fetch GET /api/properties?search=clearwater&pageSize=5
  → Show results:
      🏠 3210 W Clearwater Ave — 104841000002000 — Johnson, Michael R
  → User selects (Enter/Click)
  → setParcelContext({ parcelId: '104841000002000', source: 'selection' })
  → navigate('/property/104841000002000')
  → addToRecent('nav:parcel:104841000002000')
  → close()
```

### 3.3  Backward Compatibility

Keep the existing digits-only "Go to Parcel" command as a **direct navigation shortcut**
(no API call needed). It enables power users to jump directly by known parcel number.

API-backed search results appear alongside (or below) the direct-nav shortcut when the
query is numeric, giving the user both options.

### 3.4  Edge Cases

| Input | Behavior |
|-------|----------|
| `""` or `"  "` | No API call; show default recent/modules |
| `"ab"` (< 3 chars) | No API call; fuzzy-filter local commands only |
| `"clearwater"` (≥ 3 chars) | Debounced API search → show parcel results in `navigation` group |
| `"12345"` (all digits) | Show "Go to Parcel 12345" (direct nav) + API search results |
| API error | Show "Go to Parcel" (if numeric) or empty navigation section; log error silently |
| API slow (> 2s) | Show loading indicator in navigation section; cancel on new query |

---

## 4  Accessibility Requirements

### 4.1  ARIA Combobox Pattern (WAI-ARIA 1.2)

The CommandPalette functions as a **combobox with listbox popup**:

```html
<input
  role="combobox"
  aria-expanded="true"
  aria-controls="palette-listbox"
  aria-activedescendant="item-{selectedId}"
  aria-autocomplete="list"
/>
<div role="listbox" id="palette-listbox">
  <div role="group" aria-label="Navigate">
    <div role="option" id="item-nav-parcel-12345" aria-selected="true">...</div>
  </div>
</div>
```

### 4.2  Current Gaps vs ARIA Combobox Spec

| Attribute | Required | Current | Gap |
|-----------|----------|---------|-----|
| `role="combobox"` on input | Yes | Missing | Add to `<input>` |
| `aria-expanded` on input | Yes | Missing | Add `aria-expanded={isOpen}` |
| `aria-controls` on input | Yes | Missing | Add pointing to listbox ID |
| `aria-activedescendant` on input | Yes | Missing | Add pointing to selected option ID |
| `aria-autocomplete="list"` on input | Yes | Missing | Add |
| Unique `id` on each option | Yes | Missing | Add `id={item.id}` |

### 4.3  Keyboard Requirements (Already Met)

- `ArrowDown` / `ArrowUp`: Move selection — ✅ implemented
- `Enter`: Execute selected — ✅ implemented
- `Escape`: Close palette — ✅ implemented
- `Home` / `End`: Jump to first/last — ❌ not implemented (nice-to-have)

---

## 5  Performance Considerations

### 5.1  Debouncing

- **Trigger**: Only fire API search when query length ≥ 3 characters and user has paused typing
- **Delay**: 300ms debounce (standard for search-as-you-type)
- **Cancel**: Abort previous in-flight fetch when new query arrives (`AbortController`)
- **Library**: Use `useDeferredValue` (React 18) or manual `setTimeout`/`AbortController`

### 5.2  Caching

- Cache search results by query string for the duration of the palette session (clear on close)
- Use a simple `Map<string, ParcelSearchResponse>` ref
- No cross-session caching (parcel data may change)

### 5.3  Result Limit

- Limit to 5 parcel results in the command palette (to avoid overwhelming the UI)
- Show "N more results — Open Property Search" link if `hasMore` or `totalCount > 5`

### 5.4  Render Performance

- Each search result renders a `CommandItemRow` (already optimized with `useMemo`)
- Flat list recalculation is `O(n)` where n = total commands (18 static + 5 max dynamic)
- No virtualization needed at this scale

---

## 6  Secondary CommandPalette Instances

### 6.1  Canon Command Palette

`frontend/apps/os-shell/src/canon/CanonCommandPalette.tsx` is a **stub** (50 lines) for
TerraCanon IDE. It has its own command model (`CanonCommand` with `onRun`). This is a
completely separate palette and does NOT need parcel search.

### 6.2  Components/CommandPalette.tsx

`frontend/apps/os-shell/src/components/CommandPalette.tsx` is a **35-line placeholder**
imported by `CanonHome.tsx` for Ctrl+K overlay commands (doctor, gatefast, ping). It is
typologically different (`CommandPaletteItem` with `run` vs `CommandItem` with `action`).
No interaction with parcel search.

---

## 7  Parcel Context Integration

### 7.1  How Parcel Context Should Be Updated

When a user selects a parcel search result, the CommandPalette should call:

```ts
import { setParcelContext } from '../../context/parcelContext';

setParcelContext({
  parcelId: result.parcelNumber,
  parcelName: result.address,
  source: 'selection',
});
```

This updates the OS-wide parcel context, which:
- Persists to `sessionStorage` (survives page refresh)
- Records to `recentParcels` (up to 10, persisted to `localStorage`)
- Reflects in the Context Ribbon and Suite Compass throughout the shell

### 7.2  Current Behavior

The digits-only "Go to Parcel" command does **not** call `setParcelContext()`. It only
navigates — the route handler in `PropertyWorkbench` presumably calls
`setParcelContextFromRoute()` when it mounts. This leaves a gap: between navigation and
mount, the parcel context is stale.

---

## 8  Key Architectural Decision Points

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Which API to call? | `GET /api/properties?search=` | Lighter than Atlas POST; already supports free-text |
| Where to put the fetch logic? | New hook `useParcelSearch()` | Keeps CommandPalette component thin |
| How to display results? | Reuse `CommandItemRow` | Consistent styling, keyboard navigation works out of the box |
| When to show "Searching…"? | After debounce fires, before response | Prevents flash of empty state |
| Cache strategy? | In-memory ref, cleared on palette close | Simple, no stale data risk |
| Minimum query length? | 3 characters | Prevents excessive API calls; standard UX pattern |
| Max results in palette? | 5 | Keeps palette compact; link to full search for more |
