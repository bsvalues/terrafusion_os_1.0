# Slice 7.4 — Start Menu Recent Parcels: Research

> Agent: 4 of 5 | Date: 2026-02-27 | Scope: Research-only
> All findings verified from current source code.

## 1. StartMenu Component Architecture

**File**: [StartMenu.tsx](frontend/apps/os-shell/src/shell/desktop/StartMenu.tsx) (648 lines)

The StartMenu is a `fixed` overlay panel positioned `bottom-16 left-4` (above the
taskbar dock). It is 380px wide by 540px tall with macOS Tahoe glassmorphism styling.

### Render Hierarchy (lines 622–644)

```
<Panel> (StartMenu wrapper, role="menu", z-index: 60)
  <SearchInput />              — text search with auto-focus
  <PinnedAppsGrid />           — 4-column grid of pinned apps
  <RecentAppsSection />        — horizontal scroll of recently launched modules
  <RecentParcelsSection />     — ★ recently visited parcels (our target)
  <div />                      — divider (1px white/10)
  <AllAppsList />              — vertical list of all modules (filtered by search)
  <UserProfile />              — avatar, county, settings/shortcuts buttons
</Panel>
```

### How App Items Trigger Navigation

- **Apps**: `handleLaunch(module)` (line 531) calls `activateModule(module.id, ...)`
  which opens a desktop window or navigates to a route. Then calls `addRecentApp(module)`,
  `clearSearch()`, and `close()`.
- **Recent Parcels**: Each parcel button calls `handleParcelClick(parcelId)` (line 467)
  which calls `navigate(`/property/${parcelId}`)` then `close()`.

### RecentParcelsSection Implementation (lines 431–510)

The component is split into a **gate** and an **inner** component:

**Gate (RecentParcelsSection)** — lines 442–460:
```tsx
const RecentParcelsSection: React.FC = () => {
  const recentParcels = useRecentParcels();
  if (recentParcels.length === 0) {
    return (
      <div className='mt-2'>
        <div ...>Recent Parcels</div>
        <p ...>No recent parcels</p>
      </div>
    );
  }
  return <RecentParcelsList parcels={recentParcels} />;
};
```

**Inner (RecentParcelsList)** — lines 462–510:
```tsx
const RecentParcelsList: React.FC<{ parcels: string[] }> = ({ parcels }) => {
  const navigate = useNavigate();
  const { close } = useStartMenuStore();
  const handleParcelClick = useCallback((parcelId: string) => {
    navigate(`/property/${parcelId}`);
    close();
  }, [navigate, close]);
  return (
    <div className='mt-2'>
      <div ...>Recent Parcels</div>
      <div className='space-y-0.5 max-h-[120px] overflow-y-auto'>
        {parcels.slice(0, MAX_DISPLAYED_PARCELS).map((parcelId) => (
          <button key={parcelId} onClick={() => handleParcelClick(parcelId)}
            aria-label={`Parcel ${parcelId}`} ...>
            <TerraSphereIcon size={20} variant='mapping' glyph={<MapPinIcon .../>} />
            <span ...>Parcel {parcelId}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Design pattern rationale**: The split avoids `useNavigate()` being called in tests
without Router context. The gate renders the empty state without needing React Router.

## 2. useRecentParcels Hook and Store

**File**: [parcelContext.ts](frontend/apps/os-shell/src/context/parcelContext.ts)

### Hook (line 369)
```typescript
export function useRecentParcels(): string[] {
  return useParcelContextStore((state) => state.recentParcels);
}
```

Returns the Zustand store's `recentParcels` array (MRU-ordered string IDs).

### Storage Mechanism (lines 174–210)

Recent parcels use **localStorage** (NOT sessionStorage as the prior research claimed):

| Storage | Key | What | Persistence |
|---------|-----|------|-------------|
| localStorage | `tf:recent-parcels` | Recent parcel IDs array | Cross-session ✅ |
| sessionStorage | `tf:parcel-context` | Current active parcel | Session-only (correct) |

The `restoreRecentsFromSession()` function (line 185) has a migration path:
1. Try localStorage first (primary, line 188)
2. Fallback to sessionStorage if present (migration, line 196)
3. If found in sessionStorage, migrate to localStorage (line 201–203)

### How Parcels Get Recorded

Parcels are recorded to recents when:
1. `setContext(context)` is called — records `context.parcelId` (line 103)
2. `setFromRoute(parcelId)` is called — from route navigation (line 117)
3. `recordRecentParcel(parcelId)` is called directly (line 315)

The `recordRecent` action (lines 119–131):
- Skips empty parcelId
- Deduplicates (removes existing occurrence)
- Prepends to front
- Caps at `MAX_RECENT_PARCELS` (10)
- Persists to localStorage

## 3. Prior Slice Work: Slice 5 (Pinned, Recents, Ranking)

**File**: [.governance/workflow/plan.md](../../.governance/workflow/plan.md) (line 685)

Slice 5 "Launcher Polish (Pinned, Recents, Ranking)" defined the original plan for
recents infrastructure. Its Definition of Done included:

- ✅ Activated launcher items recorded as recents (bounded to 10)
- ✅ Recents appear in "Recent" section below Pinned
- ✅ Recents dedupe by item id and update timestamp on re-activation
- ✅ Pins persist across reloads (localStorage)

Slice 5 dealt with **module recents** (the `RecentAppsSection`), not **parcel recents**.
Slice 7.4 extends the same concept to parcels, and the implementation reuses the
same parcelContext store that was built as part of the Parcel Context work (Slice 9+).

## 4. RecentAppsSection Pattern (Reference)

**File**: [RecentAppsSection.tsx](frontend/apps/os-shell/src/shell/desktop/RecentAppsSection.tsx)

The RecentAppsSection is a peer component to RecentParcelsSection. Comparison:

| Aspect | RecentAppsSection | RecentParcelsSection |
|--------|-------------------|----------------------|
| Data source | `startMenuStore.recentApps` | `parcelContextStore.recentParcels` |
| Max shown | 10 | 5 (`MAX_DISPLAYED_PARCELS`) |
| Layout | Horizontal scroll | Vertical list (max-h 120px, overflow-y) |
| Item display | Icon + name | TerraSphereIcon + "Parcel {id}" |
| Launch | `onLaunch` callback (activateModule) | `navigate(/property/{id})` + `close()` |
| Empty state | Returns null (SC-6.5) | Shows "No recent parcels" message |
| Persistence | `persistenceService.addRecentModule` | `localStorage tf:recent-parcels` |

## 5. Test Infrastructure

### Existing Test Coverage

| Test File | Scope | Status |
|-----------|-------|--------|
| `StartMenuRecentParcels.test.tsx` | Component integration (all 6 ACs) | ✅ EXISTS, 8 tests |
| `parcelContext.recents.test.ts` | Store layer (MRU, dedupe, cap, trace) | ✅ EXISTS |
| `startMenuStore.recent.test.ts` | Recent apps store (not parcels) | ✅ EXISTS |
| `StartMenu.test.tsx` | Full StartMenu (search, pinned, launch) | ✅ EXISTS |

### Test Patterns Used

- `@testing-library/react` + `@testing-library/user-event`
- `@testing-library/jest-dom` matchers
- Direct Zustand store manipulation via `useStore.setState()`
- `<MemoryRouter>` wrapper for components using `useNavigate()`
- `afterEach(() => cleanup())` pattern
- `localStorage.removeItem('tf:recent-parcels')` in `beforeEach`

### Test Gap (Minor)

The `parcelContext.recents.test.ts` persistence test (line 182) checks
`sessionStorage.getItem('tf:recent-parcels')` but production code writes to
`localStorage`. This test may still pass due to the migration fallback but is
technically checking the wrong storage. A test correction would improve accuracy
but is not a functional blocker.

## 6. Data Flow: Complete Parcel Lifecycle

```
User navigates to /property/P-12345
  → Route handler calls setFromRoute('P-12345')
    → parcelContext.recordRecent('P-12345')
      → Dedupes, prepends to recentParcels[]
      → localStorage.setItem('tf:recent-parcels', JSON.stringify([...]))

User opens Start Menu
  → RecentParcelsSection renders
    → useRecentParcels() reads store.recentParcels
    → Shows up to 5 items (MAX_DISPLAYED_PARCELS)

User clicks "Parcel P-12345"
  → navigate('/property/P-12345')
  → close() → Start Menu closes
  → Route handler fires setFromRoute again (moves to front of recents)
```

## 7. Security Considerations

- Parcel IDs are stored as plain strings in localStorage
- No PII is stored (only parcel identifiers, not addresses or owner info)
- `selectRecentParcel()` emits TerraTrace events with hashed parcel IDs (line 339–348)
  for audit compliance without leaking raw IDs to the trace stream
- localStorage is scoped to the origin (standard browser security model)
- The `JSON.parse` calls have try/catch guards for malformed data
