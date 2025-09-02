# TerraFusion OS - .schemas Development Guide

## Overview

This guide provides comprehensive instructions for developing, implementing, and maintaining schema definitions in TerraFusion OS. The `.schemas` directory manages data structure definitions, API contracts, and validation rules that ensure consistency across our 1,008 AI agents, 33 active modules, and government-grade infrastructure.

## Development Patterns

### Schema Development Workflow

#### 1. Schema Design and Creation
```bash
# Create new schema
mkdir -p .schemas/api/v1
touch .schemas/api/v1/property-assessment.schema.json

# Validate schema syntax
npm run schema:validate .schemas/api/v1/property-assessment.schema.json

# Generate TypeScript interfaces
npm run schema:generate-types .schemas/api/v1/
```

#### 2. Government-Compliant Schema Template
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://api.terrafusion.gov/schemas/v1/property-assessment",
  "title": "Government Property Assessment Schema",
  "description": "FISMA-compliant property assessment data structure",
  "type": "object",
  "properties": {
    "metadata": {
      "$ref": "#/definitions/GovernmentMetadata"
    },
    "propertyData": {
      "$ref": "#/definitions/PropertyData"
    },
    "auditTrail": {
      "$ref": "#/definitions/AuditTrail"
    }
  },
  "definitions": {
    "GovernmentMetadata": {
      "type": "object",
      "properties": {
        "classificationLevel": {
          "type": "string",
          "enum": ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]
        },
        "governmentAuthority": {
          "type": "string",
          "pattern": "^[A-Z]{2}-[A-Z0-9]{6}$"
        },
        "complianceFramework": {
          "type": "string",
          "enum": ["FISMA", "NIST", "FedRAMP"]
        }
      },
      "required": ["classificationLevel", "governmentAuthority", "complianceFramework"]
    }
  },
  "required": ["metadata", "propertyData", "auditTrail"],
  "additionalProperties": false
}
```

### AI Agent Protocol Schema Development

#### Swarm Communication Schema Pattern
```typescript
// .schemas/ai/swarm-communication.schema.ts
export interface SwarmCommunicationSchema {
  $schema: string;
  title: 'AI Swarm Communication Protocol';
  type: 'object';
  definitions: {
    SwarmMessage: {
      type: 'object';
      properties: {
        messageId: { type: 'string'; format: 'uuid' };
        fromAgent: { type: 'string'; format: 'uuid' };
        toAgent: { type: 'string'; format: 'uuid' };
        messageType: {
          type: 'string';
          enum: ['COORDINATION', 'DATA_SYNC', 'STATUS_UPDATE', 'EMERGENCY'];
        };
        quantumSignature: {
          type: 'string';
          pattern: '^[A-Fa-f0-9]{64}$';
        };
        payload: { $ref: '#/definitions/MessagePayload' };
      };
      required: ['messageId', 'fromAgent', 'toAgent', 'messageType', 'payload'];
    };
  };
}

// Generated TypeScript interface
export interface SwarmMessage {
  messageId: string;
  fromAgent: string;
  toAgent: string;
  messageType: 'COORDINATION' | 'DATA_SYNC' | 'STATUS_UPDATE' | 'EMERGENCY';
  quantumSignature: string;
  payload: MessagePayload;
  timestamp: string;
}
```

#### Command Brain Schema Implementation
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Command Brain Instruction Schema",
  "type": "object",
  "properties": {
    "instructionId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique instruction identifier"
    },
    "commandType": {
      "type": "string",
      "enum": [
        "DEPLOY_AGENTS",
        "COORDINATE_SWARM", 
        "OPTIMIZE_PERFORMANCE",
        "EMERGENCY_PROTOCOL",
        "QUANTUM_RECALIBRATION"
      ]
    },
    "targetAgents": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "minItems": 1,
      "maxItems": 1008,
      "description": "Target agents for instruction execution"
    },
    "quantumParameters": {
      "type": "object",
      "properties": {
        "coherenceLevel": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 1.0
        },
        "entanglementStrength": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 1.0
        }
      }
    }
  },
  "required": ["instructionId", "commandType", "targetAgents"]
}
```

## Integration Instructions

### Database Schema Integration

#### Entity Framework Core Integration
```csharp
// backend/TerraFusion.Data/SchemaValidation/PropertySchemaValidator.cs
using System.Text.Json;
using NJsonSchema;

public class PropertySchemaValidator
{
    private readonly JsonSchema _propertySchema;
    
    public PropertySchemaValidator()
    {
        var schemaPath = Path.Combine("../.schemas/database/property.schema.json");
        var schemaJson = File.ReadAllText(schemaPath);
        _propertySchema = JsonSchema.FromJsonAsync(schemaJson).Result;
    }
    
    public async Task<ValidationResult> ValidatePropertyAsync(Property property)
    {
        var propertyJson = JsonSerializer.Serialize(property);
        var errors = _propertySchema.Validate(propertyJson);
        
        return new ValidationResult
        {
            IsValid = !errors.Any(),
            Errors = errors.Select(e => e.ToString()).ToList(),
            GovernmentCompliant = await ValidateGovernmentComplianceAsync(property)
        };
    }
    
    private async Task<bool> ValidateGovernmentComplianceAsync(Property property)
    {
        // FISMA compliance checks
        // PII validation
        // Security clearance requirements
        return true;
    }
}
```

#### Database Migration Schema Validation
```csharp
// backend/TerraFusion.Data/Migrations/SchemaValidatedMigration.cs
public abstract class SchemaValidatedMigration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Load migration schema
        var migrationSchema = LoadMigrationSchema();
        
        // Validate migration against schema
        ValidateMigrationSchema(migrationSchema);
        
        // Execute migration
        ExecuteMigration(migrationBuilder);
        
        // Post-migration validation
        ValidateResultingSchema();
    }
    
    private void ValidateMigrationSchema(MigrationSchema schema)
    {
        if (!schema.GovernmentApproved)
        {
            throw new InvalidOperationException(
                "Migration requires government approval before execution");
        }
        
        if (!schema.BackwardCompatible)
        {
            throw new InvalidOperationException(
                "Breaking schema changes require version increment");
        }
    }
}
```

### API Schema Integration

#### OpenAPI Schema Generation
```typescript
// backend/TerraFusion.API/SchemaGeneration/OpenApiSchemaGenerator.ts
import { OpenAPIV3 } from 'openapi-types';
import * as fs from 'fs';
import * as path from 'path';

export class OpenApiSchemaGenerator {
  private schemaDirectory = '../../.schemas/api';
  
  async generateOpenApiSpec(): Promise<OpenAPIV3.Document> {
    const baseSpec: OpenAPIV3.Document = {
      openapi: '3.0.3',
      info: {
        title: 'TerraFusion Government API',
        version: '1.0.0',
        description: 'Government AI Platform API'
      },
      servers: [
        {
          url: 'https://api.terrafusion.gov/v1',
          description: 'Production Government Server'
        }
      ],
      paths: {},
      components: {
        schemas: await this.loadSchemas(),
        securitySchemes: this.generateSecuritySchemes()
      }
    };
    
    // Generate paths from controllers
    baseSpec.paths = await this.generatePaths();
    
    return baseSpec;
  }
  
  private async loadSchemas(): Promise<Record<string, OpenAPIV3.SchemaObject>> {
    const schemas: Record<string, OpenAPIV3.SchemaObject> = {};
    const schemaFiles = fs.readdirSync(this.schemaDirectory);
    
    for (const file of schemaFiles) {
      if (file.endsWith('.schema.json')) {
        const schemaPath = path.join(this.schemaDirectory, file);
        const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        const schemaName = file.replace('.schema.json', '');
        schemas[schemaName] = schemaContent;
      }
    }
    
    return schemas;
  }
  
  private generateSecuritySchemes(): Record<string, OpenAPIV3.SecuritySchemeObject> {
    return {
      GovernmentAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Government authentication token'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Government API key authentication'
      }
    };
  }
}
```

#### Controller Schema Validation
```csharp
// backend/TerraFusion.API/Controllers/SchemaValidatedController.cs
[ApiController]
[Route("api/[controller]")]
public abstract class SchemaValidatedController : ControllerBase
{
    private readonly ISchemaValidationService _schemaValidator;
    
    protected SchemaValidatedController(ISchemaValidationService schemaValidator)
    {
        _schemaValidator = schemaValidator;
    }
    
    protected async Task<IActionResult> ValidatedResponse<T>(T data, string schemaName)
    {
        var validationResult = await _schemaValidator.ValidateAsync(data, schemaName);
        
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                message = "Response data failed schema validation",
                errors = validationResult.Errors,
                governmentCompliant = validationResult.GovernmentCompliant
            });
        }
        
        // Log for government audit trail
        await LogGovernmentAuditEvent(schemaName, data, validationResult);
        
        return Ok(data);
    }
    
    private async Task LogGovernmentAuditEvent<T>(string schemaName, T data, ValidationResult result)
    {
        var auditEvent = new GovernmentAuditEvent
        {
            Timestamp = DateTime.UtcNow,
            SchemaName = schemaName,
            ValidationResult = result,
            UserId = GetCurrentUserId(),
            GovernmentId = GetCurrentGovernmentId()
        };
        
        await _auditService.LogEventAsync(auditEvent);
    }
}
```

### Frontend Schema Integration

#### TypeScript Type Generation
```typescript
// frontend/src/types/generated/schema-types.ts
// Auto-generated from .schemas directory

export interface PropertyAssessment {
  propertyId: string;
  assessedValue: number;
  taxYear: number;
  confidentialityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  auditTrail: AuditTrail;
}

export interface SwarmMessage {
  messageId: string;
  fromAgent: string;
  toAgent: string;
  messageType: 'COORDINATION' | 'DATA_SYNC' | 'STATUS_UPDATE' | 'EMERGENCY';
  priority: 1 | 2 | 3 | 4 | 5;
  payload: MessagePayload;
  timestamp: string;
  quantumSignature: string;
}

export interface GovernmentUser {
  userId: string;
  governmentId: string;
  securityClearance: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  accessLevel: 1 | 2 | 3 | 4 | 5;
  county: 'benton' | 'clark' | 'cowlitz' | 'yakima';
  role: GovernmentRole;
}
```

#### React Hook for Schema Validation
```typescript
// frontend/src/hooks/useSchemaValidation.ts
import { useState, useCallback } from 'react';
import { ValidationResult } from '../types/validation';
import { schemaValidationService } from '../services/schemaValidationService';

export function useSchemaValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  
  const validateData = useCallback(async (data: any, schemaName: string) => {
    setIsValidating(true);
    
    try {
      const result = await schemaValidationService.validate(data, schemaName);
      
      setValidationResults(prev => [...prev, result]);
      
      if (!result.governmentCompliant) {
        console.warn('Government compliance validation failed:', result.errors);
      }
      
      return result;
    } catch (error) {
      console.error('Schema validation error:', error);
      return {
        valid: false,
        errors: ['Schema validation service error'],
        governmentCompliant: false
      };
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const validateFormData = useCallback(async (formData: any, schemaName: string) => {
    const result = await validateData(formData, schemaName);
    
    if (!result.valid) {
      throw new ValidationError('Form data validation failed', result.errors);
    }
    
    return result;
  }, [validateData]);
  
  return {
    validateData,
    validateFormData,
    isValidating,
    validationResults
  };
}
```

## Security Framework Implementation

### Government Data Classification Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Government Data Classification Schema",
  "definitions": {
    "ClassifiedData": {
      "type": "object",
      "properties": {
        "classificationLevel": {
          "type": "string",
          "enum": ["UNCLASSIFIED", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]
        },
        "handlingCaveats": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["NOFORN", "FOUO", "LES", "SBU"]
          }
        },
        "accessRequirements": {
          "type": "object",
          "properties": {
            "minimumClearanceLevel": {
              "type": "string",
              "enum": ["PUBLIC", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]
            },
            "needToKnow": {
              "type": "boolean"
            },
            "compartmentAccess": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      },
      "required": ["classificationLevel"]
    }
  }
}
```

### FISMA Compliance Validation
```python
# .schemas/validation/fisma_compliance.py
import json
import logging
from typing import Dict, List, Any

class FISMAComplianceValidator:
    def __init__(self):
        self.security_controls = self.load_security_controls()
        self.logger = logging.getLogger('FISMAValidator')
    
    def validate_schema_compliance(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Validate schema against FISMA security controls"""
        violations = []
        
        # AC-2: Account Management
        if not self.validate_access_control(schema):
            violations.append('AC-2: Insufficient access control definitions')
        
        # AU-2: Event Logging
        if not self.validate_audit_requirements(schema):
            violations.append('AU-2: Missing audit trail requirements')
        
        # IA-2: Identification and Authentication
        if not self.validate_authentication_requirements(schema):
            violations.append('IA-2: Insufficient authentication requirements')
        
        # SC-7: Boundary Protection
        if not self.validate_boundary_protection(schema):
            violations.append('SC-7: Insufficient boundary protection')
        
        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'security_level': self.determine_security_level(schema),
            'recommendation': self.generate_recommendations(violations)
        }
    
    def validate_access_control(self, schema: Dict[str, Any]) -> bool:
        """Validate access control requirements"""
        required_fields = ['userId', 'securityClearance', 'accessLevel']
        
        if 'properties' not in schema:
            return False
        
        properties = schema['properties']
        return all(field in properties for field in required_fields)
    
    def validate_audit_requirements(self, schema: Dict[str, Any]) -> bool:
        """Validate audit trail requirements"""
        if 'properties' not in schema:
            return False
        
        properties = schema['properties']
        return 'auditTrail' in properties or 'timestamp' in properties
    
    def generate_recommendations(self, violations: List[str]) -> List[str]:
        """Generate recommendations for FISMA compliance"""
        recommendations = []
        
        for violation in violations:
            if 'access control' in violation.lower():
                recommendations.append('Add user identification and access level properties')
            elif 'audit trail' in violation.lower():
                recommendations.append('Add audit trail and timestamp properties')
            elif 'authentication' in violation.lower():
                recommendations.append('Add authentication requirements to schema')
        
        return recommendations
```

## Troubleshooting Guide

### Common Schema Issues

#### 1. Schema Validation Failures
```typescript
// Debug schema validation
export class SchemaDebugger {
  async debugValidationFailure(data: any, schemaName: string) {
    console.log('🔍 Schema Validation Debug');
    console.log('Schema:', schemaName);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    try {
      const schema = await this.loadSchema(schemaName);
      const validator = new SchemaValidator(schema);
      const result = validator.validate(data);
      
      if (!result.valid) {
        console.error('Validation Errors:');
        result.errors.forEach((error, index) => {
          console.error(`  ${index + 1}. ${error.path}: ${error.message}`);
        });
        
        // Suggest fixes
        const suggestions = this.generateSuggestions(result.errors);
        console.log('Suggested Fixes:');
        suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      }
      
      return result;
    } catch (error) {
      console.error('Schema loading error:', error);
      throw error;
    }
  }
  
  private generateSuggestions(errors: ValidationError[]): string[] {
    const suggestions: string[] = [];
    
    errors.forEach(error => {
      if (error.type === 'required') {
        suggestions.push(`Add required field: ${error.field}`);
      } else if (error.type === 'type') {
        suggestions.push(`Fix type for ${error.field}: expected ${error.expected}, got ${error.actual}`);
      } else if (error.type === 'format') {
        suggestions.push(`Fix format for ${error.field}: expected ${error.format}`);
      }
    });
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
}
```

#### 2. Performance Issues
```bash
#!/bin/bash
# Schema performance optimization script

echo "🚀 Schema Performance Optimization"

# Analyze schema complexity
echo "Analyzing schema complexity..."
npm run schema:analyze-complexity

# Check validation performance
echo "Benchmarking validation performance..."
npm run schema:benchmark-validation

# Optimize schema structure
echo "Optimizing schema structure..."
npm run schema:optimize

# Generate performance report
echo "Generating performance report..."
npm run schema:performance-report
```

#### 3. Government Compliance Issues
```python
# Government compliance troubleshooting
def troubleshoot_compliance_issues(schema_name: str):
    """Troubleshoot government compliance issues"""
    
    print(f"🏛️ Government Compliance Troubleshooting: {schema_name}")
    
    # Load schema
    schema = load_schema(schema_name)
    
    # Check FISMA compliance
    fisma_result = validate_fisma_compliance(schema)
    if not fisma_result['compliant']:
        print("❌ FISMA Compliance Issues:")
        for violation in fisma_result['violations']:
            print(f"  - {violation}")
    
    # Check PII handling
    pii_result = validate_pii_handling(schema)
    if not pii_result['compliant']:
        print("❌ PII Handling Issues:")
        for issue in pii_result['issues']:
            print(f"  - {issue}")
    
    # Check security clearance requirements
    security_result = validate_security_requirements(schema)
    if not security_result['compliant']:
        print("❌ Security Requirements Issues:")
        for requirement in security_result['missing']:
            print(f"  - {requirement}")
    
    # Generate compliance report
    generate_compliance_report(schema_name, {
        'fisma': fisma_result,
        'pii': pii_result,
        'security': security_result
    })
```

## Best Practices

### Schema Development Standards

#### 1. Government-First Design
```json
{
  "schema_design_principles": {
    "government_compliance": "All schemas must be FISMA-compliant by default",
    "audit_trail": "Every schema must include audit trail capabilities",
    "security_clearance": "Access control must be embedded in schema design",
    "data_classification": "All data must have classification levels"
  }
}
```

#### 2. Version Management
```bash
#!/bin/bash
# Schema version management best practices

# Create new version
create_schema_version() {
  local schema_name=$1
  local version=$2
  
  # Validate version format
  if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must follow semantic versioning (x.y.z)"
    exit 1
  fi
  
  # Create version directory
  mkdir -p ".schemas/versions/$schema_name/$version"
  
  # Copy current schema
  cp ".schemas/$schema_name.schema.json" ".schemas/versions/$schema_name/$version/"
  
  # Update version metadata
  update_version_metadata "$schema_name" "$version"
  
  echo "✅ Schema version $version created for $schema_name"
}

# Validate backward compatibility
validate_backward_compatibility() {
  local schema_name=$1
  local old_version=$2
  local new_version=$3
  
  npm run schema:compare-versions "$schema_name" "$old_version" "$new_version"
}
```

#### 3. Testing and Validation
```typescript
// Comprehensive schema testing
describe('Schema Validation Tests', () => {
  describe('Property Assessment Schema', () => {
    it('should validate valid property data', async () => {
      const validData = {
        propertyId: '12345678-1234-123456789012',
        assessedValue: 250000.00,
        taxYear: 2024,
        confidentialityLevel: 'PUBLIC',
        auditTrail: {
          createdBy: 'gov123456',
          createdAt: '2024-01-01T00:00:00Z'
        }
      };
      
      const result = await validator.validate(validData, 'property-assessment');
      expect(result.valid).toBe(true);
      expect(result.governmentCompliant).toBe(true);
    });
    
    it('should reject invalid classification level', async () => {
      const invalidData = {
        propertyId: '12345678-1234-123456789012',
        assessedValue: 250000.00,
        taxYear: 2024,
        confidentialityLevel: 'INVALID_LEVEL'
      };
      
      const result = await validator.validate(invalidData, 'property-assessment');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid confidentiality level');
    });
    
    it('should validate government compliance', async () => {
      const testData = createTestPropertyData();
      const result = await validator.validate(testData, 'property-assessment');
      
      expect(result.governmentCompliant).toBe(true);
      expect(result.auditTrail).toBeDefined();
    });
  });
});
```

This comprehensive development guide ensures that schema management in TerraFusion OS maintains the highest standards of government compliance, data integrity, and system interoperability while supporting the sophisticated AI agent architecture and multi-county deployment requirements.