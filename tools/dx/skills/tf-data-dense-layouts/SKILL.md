---
name: tf-data-dense-layouts
lane: ui
riskLevel: read
triggers: ["data density", "virtualization", "table performance", "50000 properties", "dense layout", "progressive disclosure"]
description: Enforces virtualization for >100 rows with sticky headers and density toggles
version: 1.0.0
contractVersion: 1.0.0
---

# TerraFusion Data-Dense Layouts

**Status:** Operational (Phase 7 delivered 2026-02-13)  
**Owner:** UI Lane  
**Risk Level:** Read-only  
**Performance Target:** <200ms render for 50,000+ row datasets

## Purpose

Ensures TerraFusion OS handles **property assessment datasets** (50,000+ parcels per county) with optimal performance through virtualization, progressive disclosure, and density controls.

## Core Requirements

### 1. **Virtualization for >100 Rows**

✅ **PASS:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function PropertyTable({ properties }: { properties: Property[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: properties.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Row height
    overscan: 10,
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <PropertyRow
            key={properties[virtualRow.index].id}
            property={properties[virtualRow.index]}
          />
        ))}
      </div>
    </div>
  );
}
```

❌ **FAIL:**
```tsx
// Rendering all 50,000 rows at once (browser crash)
function PropertyTable({ properties }: { properties: Property[] }) {
  return (
    <div>
      {properties.map(p => <PropertyRow key={p.id} property={p} />)}
    </div>
  );
}
```

**Violation:** `TF_DENSITY_001_NO_VIRTUALIZATION` if `properties.length > 100` and no virtualization detected.

### 2. **Sticky Table Headers**

✅ **PASS:**
```tsx
<Table>
  <TableHeader className="sticky top-0 bg-terra-midnight z-10">
    <TableRow>
      <TableHead>Parcel ID</TableHead>
      <TableHead>Owner</TableHead>
      <TableHead>Assessed Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* Virtualized rows */}
  </TableBody>
</Table>
```

❌ **FAIL:**
```tsx
<TableHeader>  {/* Not sticky - scrolls away */}
  <TableRow>...</TableRow>
</TableHeader>
```

**Violation:** `TF_DENSITY_002_NO_STICKY_HEADER` if table has >50 rows and header not sticky.

### 3. **Progressive Disclosure for Complex Records**

✅ **PASS:**
```tsx
<PropertyRow>
  <PropertySummary />  {/* Always visible */}
  <Collapsible>
    <CollapsibleTrigger>Show Details</CollapsibleTrigger>
    <CollapsibleContent>
      <PropertyDetails />  {/* Loaded on expand */}
    </CollapsibleContent>
  </Collapsible>
</PropertyRow>
```

❌ **FAIL:**
```tsx
<PropertyRow>
  <PropertySummary />
  <PropertyDetails />  {/* Always rendered - performance hit */}
</PropertyRow>
```

**Violation:** `TF_DENSITY_003_NO_PROGRESSIVE_DISCLOSURE` if complex details always rendered.

### 4. **Density Toggles (Compact/Comfortable/Spacious)**

✅ **PASS:**
```tsx
const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');

<div className={cn(
  'property-table',
  density === 'compact' && 'row-h-8',
  density === 'comfortable' && 'row-h-12',
  density === 'spacious' && 'row-h-16'
)}>
  <DensityToggle value={density} onChange={setDensity} />
  <PropertyTable density={density} />
</div>
```

❌ **FAIL:**
```tsx
// Fixed row height - no user control
<div className="row-h-12">{/* ... */}</div>
```

**Violation:** `TF_DENSITY_004_NO_DENSITY_TOGGLE` if table lacks density controls.

### 5. **Pagination or Infinite Scroll**

✅ **PASS:**
```tsx
// Option A: Virtual scroll (preferred)
<VirtualizedTable />

// Option B: Pagination
<Table />
<Pagination
  page={currentPage}
  totalPages={Math.ceil(properties.length / 100)}
  onPageChange={setCurrentPage}
/>

// Option C: Infinite scroll
<InfiniteScroll
  dataLength={properties.length}
  next={fetchMoreProperties}
  hasMore={hasMore}
>
  <PropertyTable />
</InfiniteScroll>
```

❌ **FAIL:**
```tsx
// All 50,000 rows in DOM - no pagination/virtualization
<Table>
  {properties.map(p => <PropertyRow key={p.id} property={p} />)}
</Table>
```

**Violation:** `TF_DENSITY_005_NO_PAGINATION` if >500 rows without pagination/virtualization.

## Performance Budgets

| Metric | Threshold | Penalty |
|--------|-----------|---------|
| **Initial render** | <200ms for 100 rows | WARN if >200ms, FAIL if >500ms |
| **Scroll lag** | <16ms per frame (60 FPS) | FAIL if scroll janks |
| **Memory usage** | <50MB for 50,000 rows | WARN if >50MB, FAIL if >100MB |

## Violation Codes

| Code | Description | Severity |
|------|-------------|----------|
| `TF_DENSITY_001_NO_VIRTUALIZATION` | Table with >100 rows missing virtualization | error |
| `TF_DENSITY_002_NO_STICKY_HEADER` | Table with >50 rows missing sticky header | warning |
| `TF_DENSITY_003_NO_PROGRESSIVE_DISCLOSURE` | Complex rows always expanded | warning |
| `TF_DENSITY_004_NO_DENSITY_TOGGLE` | Table lacks density controls | warning |
| `TF_DENSITY_005_NO_PAGINATION` | >500 rows without pagination/virtualization | error |
| `TF_DENSITY_006_SLOW_RENDER` | Initial render >500ms | error |

## Contract Schema

**File:** `ui-dense-layout.contract.json`

```json
{
  "skillName": "tf-data-dense-layouts",
  "lane": "ui",
  "status": "FAIL",
  "violationsCount": 2,
  "violations": [
    {
      "code": "TF_DENSITY_001_NO_VIRTUALIZATION",
      "severity": "error",
      "file": "frontend/src/components/PropertyTable.tsx",
      "line": 25,
      "rowCount": 50247,
      "message": "Table rendering 50,247 rows without virtualization",
      "suggestion": "Use @tanstack/react-virtual or react-window"
    }
  ],
  "performanceMetrics": {
    "initialRenderMs": 320,
    "memoryUsageMB": 45,
    "maxRowsDetected": 50247
  }
}
```

## TDC Command

```bash
tdc ui audit --density [path]
```

## Recommended Libraries

| Library | Purpose | Phase 7 Binding |
|---------|---------|-----------------|
| `@tanstack/react-virtual` | Virtualization | ✅ Required for >100 rows |
| `@radix-ui/react-collapsible` | Progressive disclosure | ✅ Required for complex rows |
| `react-window` | Alternative virtualizer | ⚠️  Allowed but TanStack preferred |

---

**Government. Transcended. Performant.** 🏛️
