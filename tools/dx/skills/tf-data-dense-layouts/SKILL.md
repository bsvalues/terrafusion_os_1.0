---
id: tf-data-dense-layouts
name: Data-Dense Government Layouts
version: 1.0.0
ownerLane: dev
riskLevel: read
triggers:
  - manual
  - component-generation
inputs:
  - data-type
  - record-count
  - columns
outputs:
  - layout-code
  - virtualization-config
dependencies:
  - tf-ui-foundation
tags: [layouts, data-dense, tables, dashboards, government, property, tax]
---

# Data-Dense Government Layouts

High-density data layouts for property assessment, tax records, and government dashboards. Optimized for county assessors who work with thousands of property records daily.

## Layout Patterns

### Property Assessment Table (Primary)

The core layout for county assessors viewing property data. Supports 89,247+ Benton County parcels with virtualized scrolling.

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function PropertyAssessmentTable({ properties }: { properties: Property[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: properties.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-200px)] overflow-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        <Table className="border border-terra-cyan/20">
          <TableHeader className="bg-terra-midnight sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-terra-cyan w-[120px]">Parcel ID</TableHead>
              <TableHead className="text-terra-cyan w-[200px]">Owner</TableHead>
              <TableHead className="text-terra-cyan w-[180px]">Address</TableHead>
              <TableHead className="text-terra-cyan w-[100px] text-right">Land Value</TableHead>
              <TableHead className="text-terra-cyan w-[100px] text-right">Improvement</TableHead>
              <TableHead className="text-terra-cyan w-[100px] text-right">Total Value</TableHead>
              <TableHead className="text-terra-cyan w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const property = properties[virtualRow.index];
              return (
                <TableRow
                  key={property.parcelId}
                  className="hover:bg-terra-slate/50 cursor-pointer"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TableCell className="text-terra-white font-mono text-sm">
                    {property.parcelId}
                  </TableCell>
                  <TableCell className="text-terra-white/80 truncate">
                    {property.ownerName}
                  </TableCell>
                  <TableCell className="text-terra-white/80 truncate">
                    {property.address}
                  </TableCell>
                  <TableCell className="text-terra-white text-right font-mono">
                    ${property.landValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-terra-white text-right font-mono">
                    ${property.improvementValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-terra-emerald text-right font-mono font-semibold">
                    ${property.totalValue.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={property.assessmentStatus} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### Dashboard Grid Layout

```tsx
function AssessorDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-terra-midnight min-h-screen">
      {/* KPI Row */}
      <KPICard className="col-span-3" title="Total Parcels" value="89,247" trend="+1.2%" />
      <KPICard className="col-span-3" title="Assessed Value" value="$12.4B" trend="+3.8%" />
      <KPICard className="col-span-3" title="Appeals Pending" value="342" trend="-12%" />
      <KPICard className="col-span-3" title="Compliance" value="88.9%" trend="+2.1%" />

      {/* Main Content */}
      <div className="col-span-8">
        <PropertyAssessmentTable properties={properties} />
      </div>

      {/* Sidebar */}
      <div className="col-span-4 space-y-4">
        <PropertyDetailPanel property={selectedProperty} />
        <RecentActivityFeed activities={recentActivities} />
        <ComplianceWidget score={88.9} target={100} />
      </div>
    </div>
  );
}
```

### KPI Card Pattern

```tsx
function KPICard({ title, value, trend, className }: KPICardProps) {
  const isPositive = trend?.startsWith('+');

  return (
    <Card className={cn("bg-terra-slate border-terra-cyan/20", className)}>
      <CardContent className="p-4">
        <p className="text-sm text-terra-white/60">{title}</p>
        <p className="text-2xl font-bold text-terra-white mt-1">{value}</p>
        {trend && (
          <p className={cn(
            "text-sm mt-1",
            isPositive ? "text-terra-emerald" : "text-terra-red"
          )}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

## Performance Requirements

- **Virtualization**: Required for lists > 100 items (use @tanstack/react-virtual)
- **LCP**: < 2500ms for initial dashboard load
- **Bundle size**: Lazy-load heavy components (charts, maps)
- **Data fetching**: Use TanStack Query with stale-while-revalidate

## County Assessor Workflow Patterns

1. **Search & Filter**: Quick parcel lookup by ID, owner, address
2. **Bulk Operations**: Select multiple parcels for batch assessment
3. **Comparison View**: Side-by-side property comparison
4. **Print/Export**: Government-formatted PDF reports
5. **Audit Trail**: Every data access logged for FISMA compliance
