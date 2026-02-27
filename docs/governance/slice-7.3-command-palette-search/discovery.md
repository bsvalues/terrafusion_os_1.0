# Slice 7.3 — CommandPalette Parcel Search: Discovery

> Agent 3 of 5 · Governance Cycle · 2026-02-27
> Scope: Research-only. No source modifications.

## Objective

Upgrade the CommandPalette (Ctrl+K) from a digits-only "Go to Parcel" shortcut into a
full parcel search experience: type an address, owner name, or parcel number and see
real property results from the atlas/property API — then navigate to the Property Workbench.

---

## 1  CommandPalette — Current State

### 1.1  File Inventory

| Asset | Path |
|-------|------|
| Component | `frontend/apps/os-shell/src/shell/command-palette/CommandPalette.tsx` (657 lines) |
| Store | `frontend/apps/os-shell/src/stores/commandPaletteStore.ts` (124 lines) |
| Keyboard wiring | `frontend/apps/os-shell/src/hooks/useKeyboardShortcuts.ts` (lines 80–90: Ctrl+K) |
| Unit tests | `frontend/apps/os-shell/src/shell/command-palette/__tests__/CommandPalette.test.tsx` |
| Integration tests | `frontend/apps/os-shell/src/__tests__/integration/command-palette-workflows.integration.test.tsx` |
| Store tests | `frontend/apps/os-shell/src/stores/__tests__/commandPaletteStore.test.ts` |
| Desktop mount | `frontend/apps/os-shell/src/shell/desktop/Desktop.tsx` (line 369: `<CommandPalette />`) |
| ShellHome trigger | `frontend/apps/os-shell/src/shell/home/ShellHome.tsx` (line 370) |
| Stub (Canon) | `frontend/apps/os-shell/src/components/CommandPalette.tsx` (35-line placeholder) |
| Canon palette | `frontend/apps/os-shell/src/canon/CanonCommandPalette.tsx` (stub, ~50 lines) |

### 1.2  Command Categories (from `commandPaletteStore.ts:20`)

```ts
export type CommandCategory = 'modules' | 'settings' | 'shortcuts' | 'actions' | 'navigation';
```

The `'navigation'` category already exists and renders **first** in the category order
(`CommandPalette.tsx` line ~607: `['navigation', 'recent', 'modules', 'settings', 'actions']`).

### 1.3  Command Registry Contents (`useCommandRegistry()`, lines 57–268)

| Category | Count | Items |
|----------|-------|-------|
| modules | 10 | CostForge, TerraGaia, ATLAS AI, Analytics, Marketplace, Counties Hub, Gov Architecture, Levy Calculator, GIS Viewer, Documents |
| settings | 6 | General, Appearance, Accessibility, Notifications, Shortcuts, About |
| actions | 2 | Toggle Start Menu, Refresh Desktop |
| **Total static** | **18** | |

### 1.4  Existing Parcel "Search" (Digits-Only)

**Evidence** — `CommandPalette.tsx` lines 404–421:

```tsx
const parcelCommand = useMemo((): CommandItem | null => {
  const trimmed = query.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  return {
    id: `nav:parcel:${trimmed}`,
    label: `Go to Parcel ${trimmed}`,
    description: 'Open property workbench for this parcel',
    iconName: 'MapPin',
    iconVariant: 'mapping',
    category: 'navigation',
    keywords: ['parcel', 'property'],
    action: () => {
      navigate(`/property/${trimmed}`);
      close();
    },
  };
}, [query, navigate, close]);
```

**Limitations of this approach:**
- Only matches all-digit strings (`/^\d+$/`) — typing "Clearwater Ave" or "Johnson" does nothing
- No API call — blindly navigates to `/property/<digits>` without confirming parcel exists
- No debouncing — not needed since no API call
- No multi-result display — always 0 or 1 result
- Not recorded to `recentCommands` — the parcel action closes the palette but does not call `addToRecent()`

### 1.5  Keyboard Shortcut Wiring

**Evidence** — `useKeyboardShortcuts.ts` lines 80–85:

```tsx
if (key === 'k' && ctrlKey && !altKey && !shiftKey && !metaKey) {
  event.preventDefault();
  toggleCommandPalette();
  return;
}
```

- `Ctrl+K` / `Cmd+K` toggles the palette globally (even inside inputs)
- `Escape` closes palette (if open)
- Works in both Desktop and ShellHome surfaces

### 1.6  Fuzzy Search Implementation

**Evidence** — `CommandPalette.tsx` lines 280–302:

```tsx
function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  if (textLower.includes(queryLower)) return true;
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) { queryIndex++; }
  }
  return queryIndex === queryLower.length;
}
```

Supports both substring and scattered-character fuzzy matching.

### 1.7  ARIA / Accessibility Current State

| Element | ARIA |
|---------|------|
| Palette container | `role="dialog"` `aria-label="Command Palette"` `aria-modal="true"` |
| Search input | `aria-label="Search commands"` `autoComplete="off"` |
| Results list | `role="listbox"` `aria-label="Search results"` |
| Each result | `role="option"` `aria-selected={isSelected}` |
| Category headers | `role="group"` `aria-label={categoryLabel}` |

Missing: `aria-activedescendant` on input (tracking which option is focused), `aria-expanded` attribute, and the combobox pattern (`role="combobox"`) on the input.

### 1.8  Test Coverage (Existing)

Test file `CommandPalette.test.tsx` covers:
- SC-12.1: Open/close rendering
- SC-12.2: Search filtering by name and keywords
- SC-12.3: Fuzzy search with highlighting
- SC-12.4: Recent commands
- SC-12.5: Keyboard navigation (ArrowDown/Up/Enter/Escape)
- SC-12.6: Module activation via click
- SC-12.7: Settings activation
- SC-12.9: Category rendering
- SC-12.10: Basic ARIA attributes

**NOT tested:** Parcel search (even though `useNavigate` mock is set up at line 46 with the comment "CommandPalette uses useNavigate() for parcel search navigation"). Zero test exercises `mockNavigate`.

---

## 2  Backend Parcel/Property API

### 2.1  PropertiesController (`backend/src/TerraFusion.API/Controllers/PropertiesController.cs`)

| Endpoint | Params | Returns | Notes |
|----------|--------|---------|-------|
| `GET /api/properties` | `page`, `pageSize`, `search?`, `countyId?` | `PagedResult<PropertyDto>` | General search with pagination |
| `GET /api/properties/{id}` | `id` (Guid) | `PropertyDto` | Requires `read:properties` permission |
| `GET /api/properties/parcel/{parcelNumber}` | `parcelNumber` (string) | `PropertyDto` | Lookup by parcel number |
| `GET /api/properties/stats` | — | `PropertyStatsDto` | Aggregate stats |
| `GET /api/properties/{id}/valuations` | `id` (Guid) | `IEnumerable<ValuationDto>` | Property valuations |

All endpoints are `[Authorize]` (require auth token).

### 2.2  PropertyDto (`backend/src/TerraFusion.Core/DTOs/PropertyDto.cs:5–41`)

```csharp
public class PropertyDto {
    public int Id { get; set; }
    public string ParcelNumber { get; set; }     // searchable
    public string Address { get; set; }           // searchable
    public string? OwnerName { get; set; }        // searchable
    public decimal AssessedValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public int CountyId { get; set; }
    public string CountyName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 2.3  PropertySearchRequest (advanced DTO, `PropertyDTOs.cs:78–117`)

```csharp
public class PropertySearchRequest {
    public Guid? CountyId { get; set; }
    public string? Address { get; set; }          // min 3 chars
    public string? ParcelId { get; set; }         // min 3 chars
    public string? PropertyType { get; set; }
    public decimal? MinAssessedValue { get; set; }
    public decimal? MaxAssessedValue { get; set; }
    public string? OwnerName { get; set; }
    public string? City { get; set; }
    public string? ZipCode { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
}
```

### 2.4  IPropertyService Interface (`backend/src/TerraFusion.Core/Services/IPropertyService.cs`)

```csharp
public interface IPropertyService {
    Task<PagedResult<PropertyDto>> GetPropertiesAsync(
        int page, int pageSize, string? search = null, Guid? countyId = null);
    Task<PropertyDto?> GetPropertyByIdAsync(Guid id);
    Task<PropertyDto?> GetPropertyByParcelAsync(string parcelNumber);
    Task<IEnumerable<ValuationDto>> GetPropertyValuationsAsync(Guid propertyId);
    Task<ValuationDto> CreateValuationAsync(CreateValuationDto createDto);
    Task<PropertyStatsDto> GetPropertyStatsAsync();
    Task<IEnumerable<PropertyDto>> ImportPropertiesAsync(IEnumerable<ImportPropertyDto> properties);
}
```

### 2.5  PagedResult<T> (`PropertyDto.cs:134–145`)

```csharp
public class PagedResult<T> {
    public IEnumerable<T> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
```

---

## 3  Frontend Atlas Parcel Search API

### 3.1  Service Location

`frontend/apps/os-shell/src/services/atlasService.ts`

### 3.2  Type Definitions

```ts
// atlasService.ts:32-42
export interface ParcelResult {
  parcelId: string;
  address: string;
  owner: string;
  acreage: number;
  zoning: string;
  landUse: string;
  assessedValue: number;
  latitude?: number;
  longitude?: number;
  geometry?: GeoJSON.Geometry;
}

// atlasService.ts:45-57
export interface ParcelSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    zoning?: string;
    landUse?: string;
    minValue?: number;
    maxValue?: number;
    minAcreage?: number;
    maxAcreage?: number;
  };
}

// atlasService.ts:59-63
export interface ParcelSearchResponse {
  results: ParcelResult[];
  total: number;
  hasMore: boolean;
}
```

### 3.3  Search Method

```ts
// atlasService.ts:161-175
searchParcels: async (request: ParcelSearchRequest): Promise<ParcelSearchResponse> => {
  try {
    return await atlasPost<ParcelSearchResponse>('/parcels/search', request);
  } catch {
    // Fallback: client-side filter of 5 hardcoded parcels
    const query = request.query.toLowerCase();
    const filtered = DEFAULT_PARCELS.filter(
      (p) =>
        p.parcelId.includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.owner.toLowerCase().includes(query)
    );
    return { results: filtered, total: filtered.length, hasMore: false };
  }
},
```

Key: the API call goes to `POST /api/atlas/parcels/search`. If offline, it falls back to client-side filtering of 5 default Benton County parcels.

### 3.4  Default Parcel Data (fallback, atlasService.ts:134–139)

```ts
const DEFAULT_PARCELS: ParcelResult[] = [
  { parcelId: '104841000002000', address: '3210 W Clearwater Ave', owner: 'Johnson, Michael R', ... },
  { parcelId: '104841000015200', address: '3405 W 19th Ave',       owner: 'Garcia, Maria L', ... },
  { parcelId: '104841000016300', address: '1208 S Union St',       owner: 'Williams, David K', ... },
  { parcelId: '104841000017400', address: '5501 W Canal Dr',       owner: 'Thompson, Sarah J', ... },
  { parcelId: '104841000018500', address: '810 N Morain St',       owner: 'Anderson, Robert P', ... },
];
```

---

## 4  Parcel Context System

### 4.1  Location

`frontend/apps/os-shell/src/context/parcelContext.ts`

### 4.2  Data Shape

```ts
export interface ParcelContext {
  parcelId: string;
  parcelName?: string;
  source?: 'route' | 'selection' | 'session' | 'demo' | 'indicator_recent';
}
```

### 4.3  Key APIs

```ts
setParcelContext(context)     // Non-React setter
clearParcelContext()          // Non-React clear
setParcelContextFromRoute()  // Route-driven
useParcelContextStore        // Zustand store with recentParcels MRU (max 10)
```

Session persistence via `sessionStorage` (`tf:parcel-context`).
Recent parcels persisted to `localStorage` (`tf:recent-parcels`).

---

## 5  Routing & Navigation

### 5.1  Route Definitions (`Router.tsx` lines 140–148)

```tsx
<Route path='/property/:parcelId' element={<PropertyWorkbench />}>
  <Route index element={<PropertySummary />} />
  <Route path='forge' element={<PropertyForge />} />
  <Route path='atlas' element={<PropertyAtlas />} />
  <Route path='dais' element={<PropertyDais />} />
  <Route path='dossier' element={<PropertyDossier />} />
  <Route path='pilot' element={<PropertyPilot />} />
</Route>
```

### 5.2  Navigation Contract (from `parcelContext.navigation.contract.test.ts`)

- **With parcel context**: `/property/<parcelId>/<tab>`
- **Without parcel context**: `/property/search?openTab=<tabId>`
- Parcel IDs can be numeric (`1234567890`), prefixed (`P-12345`), or hyphenated (`benton-001`)

---

## 6  Summary of Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| No real search | HIGH | Current implementation only matches all-digit strings — no address/owner search |
| No API integration | HIGH | No call to `atlasService.searchParcels()` or `GET /api/properties?search=` |
| No debounce | MEDIUM | Once API integration is added, search must be debounced (300ms minimum) |
| No loading state | MEDIUM | No spinner or "Searching…" indicator during async search |
| No error handling | MEDIUM | No fallback UI if API call fails |
| No multi-result display | MEDIUM | Current code shows 0 or 1 result; needs to show list of matching parcels |
| Missing test coverage | HIGH | Zero tests for parcel search behavior despite `useNavigate` mock |
| Missing `addToRecent` | LOW | Parcel navigation doesn't record to recent commands |
| ARIA incomplete | LOW | Missing `aria-activedescendant`, `role="combobox"`, `aria-expanded` |
| No parcel context update | MEDIUM | After navigating, should call `setParcelContext()` (currently relies on route) |

---

## 7  Conclusion

The CommandPalette has a **minimal digits-only shortcut** to parcel navigation, but lacks
a proper search experience. The backend (`PropertiesController`, `atlasService`) provides
all the APIs needed. The plan must address: API integration, debounced async search,
multi-result rendering, proper tests, and accessibility upgrades.
