# .schemas - Schema Definitions and Validation

## Quick Start

The `.schemas` directory contains schema definitions, validation rules, and API
contracts for TerraFusion OS, ensuring data integrity across our 1,008 AI
agents, 33 active modules, and government-grade infrastructure.

## Directory Structure

```
.schemas/
├── api/                    # API schema definitions
│   ├── v1/                # Version 1 schemas
│   └── openapi.yaml       # OpenAPI specification
├── database/              # Database schema definitions
│   ├── entities/          # Entity schemas
│   └── migrations/        # Migration schemas
├── ai/                    # AI agent protocol schemas
│   ├── swarm/            # Swarm communication
│   └── command-brain/    # Command brain protocols
├── government/           # Government compliance schemas
│   ├── fisma/           # FISMA compliance schemas
│   └── audit/           # Audit trail schemas
└── validation/          # Validation rules and scripts
```

## Essential Commands

### Schema Validation

```bash
# Validate specific schema
npm run schema:validate .schemas/api/v1/property.schema.json

# Validate all schemas
npm run schema:validate-all

# Check government compliance
npm run schema:compliance-check

# Generate validation report
npm run schema:report
```

### Type Generation

```bash
# Generate TypeScript types
npm run schema:generate-types

# Generate C# models
npm run schema:generate-csharp

# Generate documentation
npm run schema:generate-docs
```

## Quick Schema Creation

### Basic Property Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Property Assessment Schema",
  "type": "object",
  "properties": {
    "propertyId": {
      "type": "string",
      "format": "uuid"
    },
    "assessedValue": {
      "type": "number",
      "minimum": 0
    },
    "confidentialityLevel": {
      "type": "string",
      "enum": ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]
    }
  },
  "required": ["propertyId", "assessedValue", "confidentialityLevel"]
}
```

### AI Agent Status Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AI Agent Status Schema",
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "enum": ["HEALTHY", "DEGRADED", "CRITICAL", "OFFLINE"]
    },
    "quantumCoherence": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    }
  },
  "required": ["agentId", "status"]
}
```

### Government User Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Government User Schema",
  "type": "object",
  "properties": {
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "governmentId": {
      "type": "string",
      "pattern": "^GOV[0-9]{10}$"
    },
    "securityClearance": {
      "type": "string",
      "enum": ["PUBLIC", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]
    },
    "county": {
      "type": "string",
      "enum": ["benton", "clark", "cowlitz", "yakima"]
    }
  },
  "required": ["userId", "governmentId", "securityClearance", "county"]
}
```

## Common Workflows

### API Development Workflow

1. **Define Schema**: Create JSON schema for API endpoint
2. **Validate**: `npm run schema:validate api/endpoint.schema.json`
3. **Generate Types**: `npm run schema:generate-types`
4. **Update API**: Implement endpoint with type safety
5. **Test**: `npm run test:api-schema-compliance`

### Database Schema Workflow

1. **Create Entity Schema**: Define database entity structure
2. **Validate Migration**: `npm run schema:validate-migration`
3. **Generate Models**: `npm run schema:generate-csharp`
4. **Apply Migration**: `dotnet ef migrations add NewMigration`
5. **Verify**: `npm run schema:verify-database`

### Government Compliance Workflow

1. **Check FISMA Compliance**: `npm run schema:fisma-check`
2. **Validate Security Requirements**: `npm run schema:security-validate`
3. **Generate Audit Report**: `npm run schema:audit-report`
4. **Review Compliance**: Review generated compliance documentation

## Configuration Files

### Schema Validation Configuration

```json
{
  "validation": {
    "strict": true,
    "government_compliance": true,
    "audit_logging": true,
    "performance_checks": true
  },
  "formats": {
    "government_id": "^GOV[0-9]{10}$",
    "parcel_id": "^[A-Z0-9]{6}[A-Z]{2}[0-9]{6}$",
    "security_clearance": ["PUBLIC", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]
  }
}
```

### Type Generation Configuration

```json
{
  "typescript": {
    "output_dir": "../frontend/src/types/generated",
    "namespace": "TerraFusion.Types",
    "export_format": "esm"
  },
  "csharp": {
    "output_dir": "../backend/TerraFusion.Core/Models/Generated",
    "namespace": "TerraFusion.Core.Models",
    "nullable_reference_types": true
  }
}
```

## Integration Examples

### React Component with Schema Validation

```typescript
import { useSchemaValidation } from '../hooks/useSchemaValidation';
import { PropertyAssessment } from '../types/generated';

export function PropertyForm() {
  const { validateData } = useSchemaValidation();

  const handleSubmit = async (data: PropertyAssessment) => {
    const result = await validateData(data, 'property-assessment');

    if (!result.valid) {
      console.error('Validation failed:', result.errors);
      return;
    }

    if (!result.governmentCompliant) {
      console.warn('Government compliance issues:', result.complianceErrors);
    }

    // Submit valid data
    await submitProperty(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### .NET API Controller with Schema Validation

```csharp
[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly ISchemaValidationService _validator;

    [HttpPost]
    public async Task<IActionResult> CreateProperty(
        [FromBody] CreatePropertyRequest request)
    {
        // Validate request against schema
        var validationResult = await _validator.ValidateAsync(
            request, "create-property-request");

        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

        if (!validationResult.GovernmentCompliant)
        {
            return StatusCode(403, "Government compliance requirements not met");
        }

        // Process valid request
        var property = await _propertyService.CreateAsync(request);
        return Ok(property);
    }
}
```

### AI Agent Schema Validation

```python
# AI agent message validation
import json
from jsonschema import validate, ValidationError

class SwarmMessageValidator:
    def __init__(self):
        with open('.schemas/ai/swarm-message.schema.json') as f:
            self.schema = json.load(f)

    def validate_message(self, message):
        try:
            validate(instance=message, schema=self.schema)

            # Additional government compliance checks
            if not self.validate_quantum_signature(message.get('quantumSignature')):
                raise ValidationError("Invalid quantum signature")

            return True
        except ValidationError as e:
            print(f"Message validation failed: {e.message}")
            return False

    def validate_quantum_signature(self, signature):
        # Validate quantum cryptographic signature
        return len(signature) == 64 and signature.isalnum()
```

## Government Compliance Features

### FISMA Compliance Validation

```bash
# Check FISMA compliance for all schemas
npm run schema:fisma-validate

# Generate FISMA compliance report
npm run schema:fisma-report

# Check security controls
npm run schema:security-controls-check
```

### Audit Trail Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Government Audit Trail Schema",
  "type": "object",
  "properties": {
    "eventId": {
      "type": "string",
      "format": "uuid"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "governmentId": {
      "type": "string",
      "pattern": "^GOV[0-9]{10}$"
    },
    "action": {
      "type": "string",
      "enum": ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "REJECT"]
    },
    "resourceType": {
      "type": "string"
    },
    "resourceId": {
      "type": "string"
    },
    "previousValue": {
      "type": "object"
    },
    "newValue": {
      "type": "object"
    },
    "justification": {
      "type": "string",
      "maxLength": 1000
    }
  },
  "required": [
    "eventId",
    "timestamp",
    "userId",
    "governmentId",
    "action",
    "resourceType"
  ]
}
```

## Performance Optimization

### Schema Caching

```javascript
// Schema caching for performance
class SchemaCache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 300000; // 5 minutes
  }

  async getSchema(schemaName) {
    const cached = this.cache.get(schemaName);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.schema;
    }

    const schema = await this.loadSchema(schemaName);
    this.cache.set(schemaName, {
      schema,
      timestamp: Date.now(),
    });

    return schema;
  }
}
```

### Validation Performance

```bash
# Benchmark schema validation performance
npm run schema:benchmark

# Profile memory usage
npm run schema:profile-memory

# Optimize validation rules
npm run schema:optimize-validation
```

## Troubleshooting

### Common Issues

#### Schema Validation Failures

```bash
# Debug validation issues
npm run schema:debug property.schema.json

# Check schema syntax
npm run schema:lint

# Validate against meta-schema
npm run schema:meta-validate
```

#### Government Compliance Issues

```bash
# Debug FISMA compliance
npm run schema:debug-fisma

# Check security requirements
npm run schema:security-debug

# Validate audit requirements
npm run schema:audit-debug
```

#### Performance Issues

```bash
# Profile validation performance
npm run schema:profile-validation

# Check memory usage
npm run schema:memory-check

# Optimize schema structure
npm run schema:optimize
```

### Emergency Procedures

```bash
# Bypass validation (emergency only)
export SCHEMA_VALIDATION_BYPASS=true

# Emergency schema rollback
npm run schema:emergency-rollback

# Restore from backup
npm run schema:restore-backup
```

## Support and Resources

### Documentation

- `index.md`: Comprehensive technical documentation
- `claude.md`: Development patterns and integration guide
- Individual schema files include inline documentation

### Getting Help

```bash
# Check schema status
npm run schema:status

# Generate debug report
npm run schema:debug-report

# View schema dependencies
npm run schema:dependencies
```

This README provides quick access to essential schema functionality while
maintaining TerraFusion's government-grade data integrity and compliance
standards.
