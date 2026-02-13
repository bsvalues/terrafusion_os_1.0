---
name: tf-sdui-renderer
lane: dev
riskLevel: read
triggers: ["sdui validate", "sdui preview", "schema validation", "component contracts", "type safety"]
description: Validates SDUI JSON schemas against component contracts for type safety
version: 1.0.0
contractVersion: 1.0.0
status: operational
---

# TerraFusion SDUI Renderer (Schema Validation & Type Safety)

**Status:** Operational (Phase 10 delivered 2026-02-13)  
**Owner:** Development Lane  
**Risk Level:** Read-only

## Purpose

Enforces **type-safe SDUI schema validation** to ensure county-specific UI schemas match component contracts. Validates that JSON schemas declare all required props, have no unknown properties, and maintain type safety across 39 Washington State counties. Prevents runtime errors from schema-component contract mismatches.

## Core Principles

**Contract-First Development:**
- Every SDUI component declares a TypeScript contract defining required props
- County schemas must conform to component contracts (JSON Schema Draft-07)
- No unknown props allowed in schemas (strict validation)
- Type mismatches caught at build time, not runtime

**Schema Validation:**
- Validate SDUI schemas against component contracts before deployment
- Detect missing required fields (e.g., `PARCEL_ID` required but not in schema)
- Catch type mismatches (e.g., `number` expected but schema declares `string`)
- Enforce consistent field naming conventions

## Rules

✅ **PASS Criteria:**
1. All required props declared in schema (matches component contract)
2. No unknown props in schema (all props exist in contract)
3. Type safety enforced (schema types match contract types)
4. Schema structure valid JSON Schema Draft-07
5. Validation metadata present (schemaPath, componentName)

❌ **FAIL Criteria:**
- **TF_SDUI_001_UNKNOWN_PROP**: Schema contains prop not in component contract
- **TF_SDUI_002_MISSING_REQUIRED**: Required prop missing from schema
- **TF_SDUI_003_TYPE_MISMATCH**: Schema type doesn't match contract type
- Invalid JSON structure or malformed schema
- Missing schema metadata (countyId, schemaType, version)

## Violation Codes

### TF_SDUI_001: Unknown Property

**Description:** Schema declares a property not present in component contract.

**Example:**
```json
// Component contract (ParcelForm.contract.ts)
interface ParcelFormProps {
  parcelId: string;
  assessedValue: number;
  ownerName: string;
}

// ❌ FAIL - County schema has unknown prop
{
  "countyId": "benton",
  "schemaType": "parcel",
  "fields": [
    { "name": "parcelId", "type": "string" },
    { "name": "assessedValue", "type": "number" },
    { "name": "ownerName", "type": "string" },
    { "name": "unknownField", "type": "string" }  // ❌ Not in contract
  ]
}
```

**Impact:** Runtime errors when component tries to render unknown field.

**Fix:** Remove unknown property from schema or add to component contract.

### TF_SDUI_002: Missing Required Property

**Description:** Schema is missing a required property from component contract.

**Example:**
```typescript
// Component contract (ParcelForm.contract.ts)
interface ParcelFormProps {
  parcelId: string;        // REQUIRED
  assessedValue: number;   // REQUIRED
  ownerName?: string;      // OPTIONAL
}

// ❌ FAIL - Missing required prop 'assessedValue'
{
  "countyId": "benton",
  "schemaType": "parcel",
  "fields": [
    { "name": "parcelId", "type": "string" }
    // Missing: assessedValue
  ]
}
```

**Impact:** Component will crash at runtime when accessing missing required field.

**Fix:** Add missing required property to schema.

### TF_SDUI_003: Type Mismatch

**Description:** Schema declares wrong type for a property.

**Example:**
```typescript
// Component contract
interface ParcelFormProps {
  assessedValue: number;  // Expects number
}

// ❌ FAIL - Type mismatch
{
  "countyId": "benton",
  "fields": [
    { "name": "assessedValue", "type": "string" }  // ❌ Wrong type
  ]
}
```

**Impact:** Type coercion errors, incorrect calculations, data corruption.

**Fix:** Correct schema type to match contract.

## TDC Commands

### Validate SDUI Schema

```bash
# Validate single schema file
tdc sdui validate schemas/benton-parcel.schema.json

# Validate all schemas in directory
tdc sdui validate schemas/

# Validate with specific component contract
tdc sdui validate schemas/benton-parcel.schema.json --contract components/ParcelForm.contract.json

# Verbose output (show all violations)
tdc sdui validate schemas/ --verbose

# JSON output (machine-readable)
tdc sdui validate schemas/ --json > violations.json
```

### Preview Component Schema

```bash
# Show component structure and schema binding
tdc sdui preview schemas/benton-parcel.schema.json

# Show with contract diff
tdc sdui preview schemas/benton-parcel.schema.json --diff

# Show validated fields only
tdc sdui preview schemas/benton-parcel.schema.json --fields-only
```

## Component Contract Pattern

### Define TypeScript Contract

```typescript
// frontend/src/components/ParcelForm.contract.ts
export interface ParcelFormProps {
  /** 10-digit parcel identifier (REQUIRED) */
  parcelId: string;

  /** Property assessed value in USD (REQUIRED) */
  assessedValue: number;

  /** Square footage of property (REQUIRED) */
  squareFootage: number;

  /** Owner name (OPTIONAL) */
  ownerName?: string;

  /** Legal description (OPTIONAL) */
  legalDescription?: string;
}

export const ParcelFormContract: ComponentContract<ParcelFormProps> = {
  componentName: 'ParcelForm',
  version: '1.0.0',
  requiredProps: ['parcelId', 'assessedValue', 'squareFootage'],
  optionalProps: ['ownerName', 'legalDescription'],
  propTypes: {
    parcelId: 'string',
    assessedValue: 'number',
    squareFootage: 'number',
    ownerName: 'string',
    legalDescription: 'string',
  },
};
```

### County Schema (JSON)

```json
{
  "countyId": "benton",
  "schemaType": "parcel",
  "version": "2.1.0",
  "componentContract": "ParcelForm.contract.ts",
  "fields": [
    {
      "name": "parcelId",
      "type": "string",
      "label": "Parcel Number",
      "required": true,
      "validation": {
        "pattern": "^[0-9]{10}$",
        "message": "Benton County parcels are 10 digits"
      }
    },
    {
      "name": "assessedValue",
      "type": "number",
      "label": "Assessed Value",
      "required": true,
      "format": "currency"
    },
    {
      "name": "squareFootage",
      "type": "number",
      "label": "Sq Ft",
      "required": true,
      "min": 0
    },
    {
      "name": "ownerName",
      "type": "string",
      "label": "Owner",
      "required": false
    }
  ]
}
```

### Validation Result

```bash
$ tdc sdui validate schemas/benton-parcel.schema.json

✅ Schema validation PASSED

Component: ParcelForm
County: benton
Schema Version: 2.1.0
Fields: 4/5 (1 optional field not declared)

✅ All required props present
✅ No unknown props
✅ All types match contract

Contract written to: .terrafusion/contracts/ui-sdui-benton-parcel.contract.json
```

## Validation Workflow

### 1. Generate Component Contract (TypeScript)

```typescript
// frontend/src/components/ParcelForm.tsx
import { ParcelFormProps, ParcelFormContract } from './ParcelForm.contract';

export function ParcelForm(props: ParcelFormProps) {
  const { parcelId, assessedValue, squareFootage, ownerName } = props;
  // Component implementation
}

// Export contract for validation
export { ParcelFormContract };
```

### 2. Create County Schema (JSON)

```json
{
  "countyId": "benton",
  "schemaType": "parcel",
  "version": "2.1.0",
  "componentContract": "ParcelForm",
  "fields": [
    { "name": "parcelId", "type": "string", "required": true },
    { "name": "assessedValue", "type": "number", "required": true },
    { "name": "squareFootage", "type": "number", "required": true }
  ]
}
```

### 3. Validate Schema Against Contract

```bash
tdc sdui validate schemas/benton-parcel.schema.json
```

### 4. Deploy Validated Schema

```bash
# Only deploy if validation passes
if tdc sdui validate schemas/benton-parcel.schema.json --json | jq -e '.status == "PASS"'; then
  npm run deploy:schemas
else
  echo "Schema validation failed - deployment blocked"
  exit 1
fi
```

## Contract Output Schema

**File:** `.terrafusion/contracts/ui-sdui-{countyId}-{schemaType}.contract.json`

```json
{
  "contractVersion": "1.0.0",
  "skillName": "tf-sdui-renderer",
  "lane": "dev",
  "status": "PASS",
  "schemaPath": "schemas/benton-parcel.schema.json",
  "componentName": "ParcelForm",
  "countyId": "benton",
  "schemaType": "parcel",
  "schemaVersion": "2.1.0",
  "violationCount": 0,
  "violations": [],
  "validation": {
    "requiredPropsPresent": true,
    "noUnknownProps": true,
    "typesMatch": true,
    "totalFields": 4,
    "requiredFields": 3,
    "optionalFields": 1
  },
  "executedAt": "2026-02-13T10:30:00Z"
}
```

## Best Practices

### 1. Contract-First Development

```typescript
// 1. Define contract FIRST (before component implementation)
export interface MyComponentProps {
  requiredProp: string;
  optionalProp?: number;
}

// 2. Implement component
export function MyComponent(props: MyComponentProps) { ... }

// 3. Validate county schemas against contract
// tdc sdui validate schemas/county-*.schema.json --contract MyComponent
```

### 2. Strict Validation in CI

```yaml
# .github/workflows/sdui-validation.yml
- name: Validate SDUI Schemas
  run: |
    tdc sdui validate schemas/ --json > validation-results.json
    if jq -e '.status != "PASS"' validation-results.json; then
      echo "SDUI schema validation failed"
      exit 1
    fi
```

### 3. Schema Versioning

```json
{
  "schemaVersion": "2.1.0",
  "contractVersion": "1.0.0",
  "breaking": false,
  "changelog": "Added optional 'legalDescription' field"
}
```

### 4. Multi-County Validation

```bash
# Validate schemas for all 39 Washington State counties
for county in schemas/*.schema.json; do
  echo "Validating $county..."
  tdc sdui validate "$county" || exit 1
done
```

## Integration with tf-sdui-components Skill

This skill complements `tf-sdui-components`:

| Skill | Focus | Command |
|-------|-------|---------|
| **tf-sdui-components** | Component-level SDUI compliance (no hardcoded county logic) | `tdc ui audit --sdui` |
| **tf-sdui-renderer** | Schema-level validation (type safety, contract compliance) | `tdc sdui validate` |

**Combined Workflow:**
1. Run `tdc ui audit --sdui` - Ensure components are schema-driven
2. Run `tdc sdui validate schemas/` - Validate schemas match contracts
3. Both must PASS before deployment

## Performance Considerations

- Schema validation cached (5 min TTL per schema)
- Contract extraction done at build time, not runtime
- Validation runs in parallel for multiple schemas
- JSON Schema Draft-07 validation via Ajv (fast)

## Example Violations

### Scenario 1: Unknown Property

**Schema:**
```json
{
  "fields": [
    { "name": "parcelId", "type": "string" },
    { "name": "unknownProp", "type": "string" }  // Not in contract
  ]
}
```

**Validation Output:**
```
❌ Schema validation FAILED

Violation: TF_SDUI_001_UNKNOWN_PROP
File: schemas/benton-parcel.schema.json
Line: 4
Field: unknownProp
Message: Property 'unknownProp' not found in ParcelForm contract
Suggestion: Remove 'unknownProp' or add to ParcelFormProps interface
```

### Scenario 2: Missing Required Property

**Schema:**
```json
{
  "fields": [
    { "name": "parcelId", "type": "string" }
    // Missing: assessedValue (required)
  ]
}
```

**Validation Output:**
```
❌ Schema validation FAILED

Violation: TF_SDUI_002_MISSING_REQUIRED
File: schemas/benton-parcel.schema.json
Line: 3
Field: assessedValue
Message: Required property 'assessedValue' missing from schema
Suggestion: Add { "name": "assessedValue", "type": "number", "required": true }
```

### Scenario 3: Type Mismatch

**Schema:**
```json
{
  "fields": [
    { "name": "assessedValue", "type": "string" }  // Should be number
  ]
}
```

**Validation Output:**
```
❌ Schema validation FAILED

Violation: TF_SDUI_003_TYPE_MISMATCH
File: schemas/benton-parcel.schema.json
Line: 3
Field: assessedValue
Expected: number
Actual: string
Message: Type mismatch for 'assessedValue' - contract expects 'number' but schema declares 'string'
Suggestion: Change type to "number" in schema
```

## Government Compliance

**FISMA-HIGH Requirements:**
- Schema validation logs auditable (who, what, when)
- Contract violations block deployment (CI gate)
- County schemas isolated (no cross-county validation pollution)
- All contracts cryptographically hashed (SHA-256)

**Sovereign County Model:**
- Each county maintains independent schemas
- Validation scoped per county (no cross-county dependencies)
- County-specific validation rules supported
- Schema changes audited per county

---

**Government. Transcended. Type-Safe SDUI.** 🏛️
