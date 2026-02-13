---
id: tf-sdui-engine
name: Server-Driven UI Engine
version: 1.0.0
ownerLane: dev
riskLevel: read
triggers:
  - manual
  - component-generation
inputs:
  - page-type
  - county-config
  - user-role
outputs:
  - sdui-layout
  - component-tree
dependencies:
  - tf-ui-foundation
  - tf-data-dense-layouts
tags: [sdui, server-driven, ui, dynamic, county-customization, government]
---

# Server-Driven UI Engine

Server-Driven UI (SDUI) allows TerraFusion's backend to define page layouts, component trees, and data bindings declaratively. County administrators can customize interfaces without frontend code changes or redeployment.

## Architecture

```
Backend API (JSON Layout Definition)
  → SDUI Renderer (React Component)
    → Component Registry (shadcn/ui + custom)
      → Rendered Government Interface
```

## Layout Schema

```typescript
interface SDUILayout {
  version: '1.0';
  page: string;
  title: string;
  county?: string;
  role?: string;
  sections: SDUISection[];
  actions?: SDUIAction[];
  metadata?: Record<string, unknown>;
}

interface SDUISection {
  id: string;
  type: 'grid' | 'stack' | 'tabs' | 'accordion' | 'split';
  columns?: number; // for grid type
  gap?: number;
  children: SDUIComponent[];
}

interface SDUIComponent {
  id: string;
  component: string; // Registry key: 'kpi-card', 'data-table', 'property-detail', etc.
  props: Record<string, unknown>;
  dataSource?: {
    endpoint: string;
    method: 'GET' | 'POST';
    params?: Record<string, string>;
    refreshInterval?: number; // ms
  };
  visibility?: {
    roles?: string[];
    counties?: string[];
    condition?: string; // JSONPath expression
  };
}

interface SDUIAction {
  id: string;
  label: string;
  icon?: string;
  action: 'navigate' | 'api-call' | 'modal' | 'export' | 'print';
  target: string;
  confirmation?: string;
  requiredRole?: string;
}
```

## Component Registry

| Key | Component | Props |
|-----|-----------|-------|
| `kpi-card` | KPI metric card | title, value, trend, icon |
| `data-table` | Virtualized data table | columns, dataSource, pageSize |
| `property-detail` | Property detail panel | parcelId |
| `assessment-form` | Assessment input form | fields, validators |
| `map-view` | GIS map with parcels | center, zoom, layers |
| `chart-bar` | Bar chart | data, xAxis, yAxis |
| `chart-line` | Line chart | data, series |
| `chart-pie` | Pie chart | data, labelKey, valueKey |
| `activity-feed` | Recent activity list | limit, filter |
| `compliance-badge` | Compliance status badge | standard, status |
| `alert-banner` | System alert banner | severity, message |
| `search-bar` | Global search | placeholder, scope |

## Example: Assessor Dashboard Layout

```json
{
  "version": "1.0",
  "page": "assessor-dashboard",
  "title": "Property Assessment Dashboard",
  "county": "benton",
  "role": "Assessor",
  "sections": [
    {
      "id": "kpis",
      "type": "grid",
      "columns": 4,
      "gap": 16,
      "children": [
        {
          "id": "total-parcels",
          "component": "kpi-card",
          "props": { "title": "Total Parcels", "icon": "building" },
          "dataSource": { "endpoint": "/api/properties/count", "method": "GET" }
        },
        {
          "id": "total-value",
          "component": "kpi-card",
          "props": { "title": "Assessed Value", "icon": "dollar-sign" },
          "dataSource": { "endpoint": "/api/assessments/total-value", "method": "GET" }
        }
      ]
    },
    {
      "id": "main-content",
      "type": "split",
      "children": [
        {
          "id": "property-table",
          "component": "data-table",
          "props": {
            "columns": ["parcelId", "owner", "address", "landValue", "totalValue", "status"],
            "pageSize": 50
          },
          "dataSource": { "endpoint": "/api/properties", "method": "GET", "refreshInterval": 30000 }
        },
        {
          "id": "property-detail",
          "component": "property-detail",
          "props": {},
          "visibility": { "condition": "$.selectedParcel != null" }
        }
      ]
    }
  ],
  "actions": [
    {
      "id": "new-assessment",
      "label": "New Assessment",
      "icon": "plus",
      "action": "modal",
      "target": "assessment-form",
      "requiredRole": "Assessor"
    },
    {
      "id": "export-csv",
      "label": "Export CSV",
      "icon": "download",
      "action": "export",
      "target": "/api/properties/export?format=csv"
    }
  ]
}
```

## County Customization

Counties override the default layout by providing county-specific JSON:

```
backend/config/sdui/
├── default/           # Base layouts for all counties
│   ├── assessor-dashboard.json
│   ├── citizen-portal.json
│   └── admin-settings.json
├── benton/            # Benton County overrides
│   └── assessor-dashboard.json
└── clark/             # Clark County overrides
    └── assessor-dashboard.json
```

Override rules:
1. Load default layout
2. Deep-merge county override (if exists)
3. Filter by user role visibility
4. Return to SDUI renderer

## React Renderer Pattern

```tsx
import { SDUIRenderer } from '@/components/sdui/renderer';

function AssessorDashboard() {
  const { data: layout } = useQuery({
    queryKey: ['sdui', 'assessor-dashboard'],
    queryFn: () => fetch('/api/sdui/assessor-dashboard').then(r => r.json()),
  });

  if (!layout) return <Skeleton />;

  return <SDUIRenderer layout={layout} />;
}
```
