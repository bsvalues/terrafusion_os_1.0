---
name: tf-sdui-components
lane: dev
riskLevel: read
triggers: ["sdui validation", "schema-driven ui", "county variants", "dynamic forms", "county schemas"]
description: Validates schema-driven UI components for county-specific variants
version: 1.0.0
contractVersion: 1.0.0
---

# TerraFusion SDUI Components (Schema-Driven UI Validation)

**Status:** Operational (Phase 10 delivered 2026-02-13)  
**Owner:** Development Lane  
**Risk Level:** Read-only

## Purpose

Enforces **Server-Driven UI (SDUI)** discipline for county-specific component variants. Validates that UI components dynamically bind to county schemas rather than hardcoding county-specific data, forms, or layouts. Ensures TerraFusion's Sovereign County model scales to 39+ Washington State counties without component proliferation.

## Core Principles

**Schema-Driven Architecture:**
- UI components render based on JSON schemas fetched from backend
- County-specific fields, validations, and layouts defined in database schemas
- Zero hardcoded county logic in frontend code
- Single component implementation supports all 39 counties

**County Sovereignty:**
- Each county maintains its own schema definitions
- No cross-county data leakage through UI components
- County-specific branding/theming via schema metadata
- Form fields, validation rules, and data grids driven by county schemas

## Rules

✅ **PASS Criteria:**
1. All county-specific forms bind to schema endpoints (e.g., `/api/counties/{countyId}/schemas/parcel`)
2. Data grids use column definitions from schema API, not hardcoded arrays
3. Validation rules fetched from schema, not hardcoded in components
4. No county names in component file paths or conditionals (except SchemaRegistry)
5. Schema version tracked per county in component metadata

❌ **FAIL Criteria:**
- Hardcoded county data: `if (county === 'Benton') { fields = [...] }`
- Static form definitions: `const bentonFields = [{ name: 'PARCEL_ID' }]`
- Conditional rendering by county: `county === 'King' ? <KingParcelForm /> : <DefaultForm />`
- Missing schema bindings: Component renders without fetching schema first
- Hardcoded column definitions in tables/grids (must use schema-driven columns)

## TerraFusion SDUI Component Patterns

### ✅ CORRECT: Schema-Driven Parcel Form

```tsx
// frontend/src/components/ParcelForm.tsx
import { useCountySchema } from '@/hooks/useCountySchema';
import { DynamicForm } from '@/components/DynamicForm';

export function ParcelForm({ countyId }: { countyId: string }) {
  const { schema, isLoading } = useCountySchema(countyId, 'parcel');

  if (isLoading) return <Skeleton />;

  return (
    <DynamicForm
      schema={schema}
      onSubmit={handleSubmit}
      validationRules={schema.validations}
    />
  );
}

// Schema fetched from: GET /api/counties/benton/schemas/parcel
// Response:
{
  "countyId": "benton",
  "schemaType": "parcel",
  "version": "2.1.0",
  "fields": [
    { "name": "PARCEL_ID", "type": "string", "required": true, "maxLength": 20 },
    { "name": "ASSESSED_VALUE", "type": "number", "min": 0 },
    { "name": "SQUARE_FOOTAGE", "type": "number", "label": "Sq Ft" }
  ],
  "validations": {
    "PARCEL_ID": { "pattern": "^[0-9]{10}$", "message": "10 digits required" }
  }
}
```

### ✅ CORRECT: Schema-Driven Data Grid

```tsx
// frontend/src/components/PropertyGrid.tsx
import { useCountySchema } from '@/hooks/useCountySchema';
import { DataGrid } from '@/components/ui/data-grid';

export function PropertyGrid({ countyId }: { countyId: string }) {
  const { schema } = useCountySchema(countyId, 'property-grid');
  const { data } = useProperties(countyId);

  const columns = schema.fields.map(field => ({
    id: field.name,
    header: field.label || field.name,
    accessorKey: field.name,
    cell: field.cellRenderer || 'default',
    width: field.columnWidth || 120
  }));

  return (
    <DataGrid
      columns={columns}
      data={data}
      virtualized={data.length > 100}
    />
  );
}
```

### ❌ INCORRECT: Hardcoded County Logic

```tsx
// ❌ Violation: TF_SDUI_003_HARDCODED_COUNTY_DATA
export function ParcelForm({ countyId }: { countyId: string }) {
  const fields = countyId === 'benton'
    ? [
        { name: 'PARCEL_ID', type: 'string' },
        { name: 'ASSESSED_VALUE', type: 'number' }
      ]
    : countyId === 'king'
    ? [
        { name: 'PIN', type: 'string' },
        { name: 'MARKET_VALUE', type: 'number' }
      ]
    : defaultFields;

  return <Form fields={fields} />;
}

// ❌ Violation: TF_SDUI_001_MISSING_SCHEMA
export function PropertyGrid({ countyId }: { countyId: string }) {
  // No schema fetch - hardcoded columns
  const columns = [
    { id: 'parcelId', header: 'Parcel ID' },
    { id: 'owner', header: 'Owner' },
    { id: 'value', header: 'Value' }
  ];

  return <DataGrid columns={columns} data={data} />;
}
```

## County Schema Registry

**Central Schema Management:**

```typescript
// backend/TerraFusion.Core/Schemas/CountySchemaRegistry.cs
public class CountySchemaRegistry
{
  public async Task<CountySchema> GetSchemaAsync(
    string countyId,
    string schemaType,
    string version = "latest"
  )
  {
    // Validate county authorization
    var schema = await _dbContext.CountySchemas
      .Where(s => s.CountyId == countyId && s.SchemaType == schemaType)
      .FirstOrDefaultAsync();

    return schema ?? throw new SchemaNotFoundException();
  }
}
```

## Use Cases

### 1. Benton County Parcel Form

**Schema Definition (Database):**
```json
{
  "countyId": "benton",
  "schemaType": "parcel",
  "version": "2.1.0",
  "fields": [
    { "name": "PARCEL_ID", "type": "string", "label": "Parcel Number", "required": true },
    { "name": "OWNER_NAME", "type": "string", "label": "Owner" },
    { "name": "LEGAL_DESC", "type": "text", "label": "Legal Description", "rows": 4 },
    { "name": "ASSESSED_VALUE", "type": "currency", "label": "Assessed Value" },
    { "name": "SQUARE_FOOTAGE", "type": "number", "label": "Sq Ft", "min": 0 }
  ],
  "validations": {
    "PARCEL_ID": {
      "pattern": "^[0-9]{10}$",
      "message": "Benton County parcels are 10 digits"
    }
  },
  "layout": {
    "sections": [
      { "title": "Identification", "fields": ["PARCEL_ID", "OWNER_NAME"] },
      { "title": "Property Details", "fields": ["LEGAL_DESC", "ASSESSED_VALUE", "SQUARE_FOOTAGE"] }
    ]
  }
}
```

**Component Rendering:**
```tsx
// Same ParcelForm component works for Benton, King, Pierce, etc.
<ParcelForm countyId="benton" /> // Fetches Benton schema
<ParcelForm countyId="king" />   // Fetches King schema
<ParcelForm countyId="pierce" /> // Fetches Pierce schema
```

### 2. King County Parcel Form (Different Schema)

**Schema Definition (Database):**
```json
{
  "countyId": "king",
  "schemaType": "parcel",
  "version": "3.0.0",
  "fields": [
    { "name": "PIN", "type": "string", "label": "Property Identification Number", "required": true },
    { "name": "TAXPAYER", "type": "string", "label": "Taxpayer Name" },
    { "name": "SITE_ADDRESS", "type": "string", "label": "Site Address" },
    { "name": "MARKET_VALUE", "type": "currency", "label": "Market Value" },
    { "name": "LAND_USE_CODE", "type": "select", "label": "Land Use", "options": ["residential", "commercial", "industrial"] }
  ],
  "validations": {
    "PIN": {
      "pattern": "^[0-9]{6}-[0-9]{4}$",
      "message": "King County PINs are NNNNNN-NNNN format"
    }
  }
}
```

**Same Component, Different Rendering:**
- Benton: 5 fields, 10-digit PARCEL_ID, sections layout
- King: 5 fields, PIN format NNNNNN-NNNN, dropdown for land use

### 3. Assessment Dashboard (39 Counties)

```tsx
// Single component, 39 county variants via schema
export function AssessmentDashboard({ countyId }: { countyId: string }) {
  const { schema } = useCountySchema(countyId, 'assessment-dashboard');

  return (
    <Dashboard>
      {schema.widgets.map(widget => (
        <Widget
          key={widget.id}
          type={widget.type}
          dataSource={widget.dataSource}
          config={widget.config}
        />
      ))}
    </Dashboard>
  );
}

// Benton schema: 3 widgets (parcel count, total value, recent assessments)
// King schema: 5 widgets (parcel count, appeals, exemptions, trends, map)
```

## Violation Codes

### TF_SDUI_001: Missing Schema

**Description:** Component renders without fetching county schema.

**Example:**
```tsx
// ❌ FAIL
export function ParcelForm({ countyId }: { countyId: string }) {
  // No schema fetch
  return <Form fields={hardcodedFields} />;
}
```

**Fix:**
```tsx
// ✅ PASS
export function ParcelForm({ countyId }: { countyId: string }) {
  const { schema } = useCountySchema(countyId, 'parcel');
  return <DynamicForm schema={schema} />;
}
```

### TF_SDUI_002: Invalid Schema Binding

**Description:** Schema fetched but not properly bound to component props.

**Example:**
```tsx
// ❌ FAIL
const { schema } = useCountySchema(countyId, 'parcel');
// Schema fetched but ignored
return <Form fields={staticFields} />;
```

**Fix:**
```tsx
// ✅ PASS
const { schema } = useCountySchema(countyId, 'parcel');
return <DynamicForm schema={schema} validations={schema.validations} />;
```

### TF_SDUI_003: Hardcoded County Data

**Description:** Conditional logic or hardcoded data based on county identifier.

**Example:**
```tsx
// ❌ FAIL
if (countyId === 'benton') {
  return <BentonParcelForm />;
} else if (countyId === 'king') {
  return <KingParcelForm />;
}

// ❌ FAIL
const columns = countyId === 'benton'
  ? bentonColumns
  : kingColumns;
```

**Fix:**
```tsx
// ✅ PASS
const { schema } = useCountySchema(countyId, 'parcel');
return <ParcelForm schema={schema} />;
```

## Contract Schema

**File:** `ui-sdui-components.contract.json`

```json
{
  "contractVersion": "1.0.0",
  "skillName": "tf-sdui-components",
  "lane": "dev",
  "status": "PASS",
  "violationsCount": 0,
  "violations": [],
  "countySchemas": [
    {
      "countyId": "benton",
      "schemaType": "parcel",
      "version": "2.1.0",
      "fieldsCount": 5,
      "validated": true
    }
  ],
  "componentsAudited": [
    {
      "componentPath": "frontend/src/components/ParcelForm.tsx",
      "schemaBinding": "valid",
      "countyAgnostic": true
    }
  ],
  "filesScanned": 42,
  "executedAt": "2026-02-13T10:30:00Z"
}
```

## TDC Command

```bash
# Audit all SDUI components
tdc ui audit --sdui

# Audit specific directory
tdc ui audit --sdui frontend/src/components/forms

# Audit single component
tdc ui audit --sdui frontend/src/components/ParcelForm.tsx

# Check county schema coverage
tdc ui audit --sdui --county-coverage

# Validate schema bindings
tdc ui audit --sdui --validate-bindings
```

## Best Practices

### 1. Schema-First Development

```typescript
// 1. Define schema in database FIRST
INSERT INTO county_schemas (county_id, schema_type, version, schema_json)
VALUES ('benton', 'parcel', '2.1.0', '{ ... }');

// 2. Component fetches schema ALWAYS
const { schema } = useCountySchema(countyId, 'parcel');

// 3. Render based on schema ONLY
<DynamicForm schema={schema} />
```

### 2. Schema Versioning

```typescript
// Track schema versions in component metadata
const { schema, version } = useCountySchema(countyId, 'parcel', '2.1.0');

// Handle schema migrations gracefully
if (version !== '2.1.0') {
  return <MigrationWarning targetVersion="2.1.0" />;
}
```

### 3. County-Agnostic Components

```tsx
// ✅ Single component for all counties
export function ParcelForm({ countyId }: Props) {
  const { schema } = useCountySchema(countyId, 'parcel');
  return <DynamicForm schema={schema} />;
}

// ❌ Per-county components (component proliferation)
export function BentonParcelForm() { ... }
export function KingParcelForm() { ... }
export function PierceParcelForm() { ... }
// ... 39 more components? NO!
```

### 4. Schema Validation

```typescript
// Backend validates schemas before storage
public class CountySchemaValidator
{
  public async Task<ValidationResult> ValidateAsync(CountySchema schema)
  {
    // JSON Schema validation
    var result = await _jsonSchemaValidator.ValidateAsync(schema.SchemaJson);

    // County-specific business rules
    if (schema.CountyId == "benton" && !schema.Fields.Contains("PARCEL_ID"))
    {
      result.AddError("Benton County requires PARCEL_ID field");
    }

    return result;
  }
}
```

## Integration with Harris PACS

**County Property Systems:**
- Benton County: Harris PACS 9.0 (89,247 parcels)
- King County: Tyler Technologies iasWorld
- Pierce County: Aumentum Systems

**Schema Mapping:**
```json
{
  "countyId": "benton",
  "schemaType": "parcel",
  "legacySystemMapping": {
    "system": "Harris PACS 9.0",
    "PARCEL_ID": "PACS.PARCELNUM",
    "ASSESSED_VALUE": "PACS.ASSESSEDVAL",
    "OWNER_NAME": "PACS.OWNERNAME"
  }
}
```

## Performance Considerations

- Schema responses cached per county (5 min TTL)
- Schema version headers enable client-side caching
- Lazy-load schemas only when component renders
- Virtualization required for grids with >100 rows
- Progressive disclosure for complex forms (>20 fields)

---

**Government. Transcended. Schema-Governed.** 🏛️
