# TerraFusion OS DTO Generator - User Guide

## Overview

The `Generate-MissingDTOs.ps1` script is a championship-level code generation tool that creates Request, Response, and Result DTOs following TerraFusion OS coding standards and government compliance requirements.

## Quick Start

### Basic Usage

Generate all three DTO types for a domain:

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "County" `
    -GenerateRequest `
    -GenerateResponse `
    -GenerateResult `
    -Properties @(
        @{ Name = "Name"; Type = "string"; Required = $true; Validation = "[StringLength(100)]" },
        @{ Name = "StateCode"; Type = "string"; Required = $true; Validation = "[StringLength(2)]" }
    )
```

### Generate Only Request DTO

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "TaxLevy" `
    -GenerateRequest `
    -Properties @(
        @{ Name = "PropertyId"; Type = "Guid"; Required = $true },
        @{ Name = "TaxYear"; Type = "int"; Required = $true; Validation = "[Range(1990, 2030)]" },
        @{ Name = "TaxAmount"; Type = "decimal"; Required = $true; Validation = "[Range(0, 1000000)]" }
    )
```

### Generate Only Response DTO

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "Valuation" `
    -GenerateResponse `
    -Properties @(
        @{ Name = "Id"; Type = "Guid"; Required = $true },
        @{ Name = "PropertyId"; Type = "Guid"; Required = $true },
        @{ Name = "ValuationType"; Type = "string"; Required = $true },
        @{ Name = "EstimatedValue"; Type = "decimal"; Required = $true },
        @{ Name = "Confidence"; Type = "decimal"; Required = $true }
    )
```

### Generate Only Result DTO

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "Assessment" `
    -GenerateResult
```

## Property Definition Format

Each property is defined as a hashtable with the following keys:

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `Name` | string | Yes | Property name (PascalCase) |
| `Type` | string | Yes | C# type (string, int, decimal, Guid, etc.) |
| `Required` | bool | No | Adds [Required] attribute (Request DTOs only) |
| `Validation` | string | No | Validation attribute (e.g., "[StringLength(100)]") |
| `ValidationMessage` | string | No | Custom error message for Required attribute |
| `Default` | string | No | Default value expression |

### Property Examples

#### String Property with Validation

```powershell
@{
    Name = "Email"
    Type = "string"
    Required = $true
    Validation = "[EmailAddress]"
    ValidationMessage = "Valid email address is required"
}
```

#### Numeric Property with Range

```powershell
@{
    Name = "Population"
    Type = "int"
    Required = $false
    Validation = "[Range(0, 10000000)]"
}
```

#### Decimal Property (Currency)

```powershell
@{
    Name = "AssessedValue"
    Type = "decimal"
    Required = $true
    Validation = "[Range(0.01, 100000000)]"
}
```

#### Date Property

```powershell
@{
    Name = "EffectiveDate"
    Type = "DateTime"
    Required = $true
}
```

#### GUID Property

```powershell
@{
    Name = "CountyId"
    Type = "Guid"
    Required = $true
}
```

#### List Property

```powershell
@{
    Name = "Tags"
    Type = "List<string>"
    Required = $false
}
```

#### Dictionary Property

```powershell
@{
    Name = "Metadata"
    Type = "Dictionary<string, object>"
    Required = $false
}
```

## Common Validation Attributes

### String Validations

- `[Required]` - Field is required
- `[StringLength(100)]` - Maximum length
- `[StringLength(100, MinimumLength = 3)]` - Min and max length
- `[EmailAddress]` - Valid email format
- `[Phone]` - Valid phone number
- `[Url]` - Valid URL
- `[RegularExpression(@"^\d{5}(-\d{4})?$")]` - ZIP code pattern

### Numeric Validations

- `[Range(0, 100)]` - Value range
- `[Range(0.01, 1000000)]` - Decimal range

### Date Validations

- `[Range(typeof(DateTime), "1/1/1990", "12/31/2030")]` - Date range

## Real-World Examples

### County DTO Generation

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "County" `
    -GenerateRequest `
    -GenerateResponse `
    -GenerateResult `
    -Properties @(
        @{ Name = "Name"; Type = "string"; Required = $true; Validation = "[StringLength(100)]"; ValidationMessage = "County name is required" },
        @{ Name = "StateCode"; Type = "string"; Required = $true; Validation = "[StringLength(2)]"; ValidationMessage = "State code is required" },
        @{ Name = "FIPS"; Type = "string"; Required = $true; Validation = "[StringLength(5)]"; ValidationMessage = "FIPS code is required" },
        @{ Name = "Population"; Type = "int"; Required = $false; Validation = "[Range(0, 10000000)]" },
        @{ Name = "Area"; Type = "decimal"; Required = $false; Validation = "[Range(0, 1000000)]" },
        @{ Name = "County_Seat"; Type = "string"; Required = $false; Validation = "[StringLength(100)]" }
    )
```

### Property Valuation DTO Generation

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "PropertyValuation" `
    -GenerateRequest `
    -GenerateResponse `
    -GenerateResult `
    -Properties @(
        @{ Name = "PropertyId"; Type = "Guid"; Required = $true; ValidationMessage = "Property ID is required" },
        @{ Name = "ValuationDate"; Type = "DateTime"; Required = $true; ValidationMessage = "Valuation date is required" },
        @{ Name = "LandValue"; Type = "decimal"; Required = $true; Validation = "[Range(0, 50000000)]"; ValidationMessage = "Land value is required" },
        @{ Name = "ImprovementValue"; Type = "decimal"; Required = $true; Validation = "[Range(0, 50000000)]"; ValidationMessage = "Improvement value is required" },
        @{ Name = "TotalValue"; Type = "decimal"; Required = $true; Validation = "[Range(0.01, 100000000)]"; ValidationMessage = "Total value is required" },
        @{ Name = "ValuationMethod"; Type = "string"; Required = $true; Validation = "[StringLength(50)]"; ValidationMessage = "Valuation method is required" },
        @{ Name = "AssessorNotes"; Type = "string"; Required = $false; Validation = "[StringLength(1000)]" }
    )
```

### AI Agent Configuration DTO Generation

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "AIAgentConfig" `
    -GenerateRequest `
    -GenerateResponse `
    -GenerateResult `
    -Properties @(
        @{ Name = "AgentId"; Type = "Guid"; Required = $true },
        @{ Name = "AgentName"; Type = "string"; Required = $true; Validation = "[StringLength(100)]" },
        @{ Name = "AgentType"; Type = "string"; Required = $true; Validation = "[StringLength(50)]" },
        @{ Name = "Priority"; Type = "int"; Required = $true; Validation = "[Range(1, 10)]" },
        @{ Name = "MaxConcurrency"; Type = "int"; Required = $true; Validation = "[Range(1, 100)]" },
        @{ Name = "TimeoutSeconds"; Type = "int"; Required = $true; Validation = "[Range(1, 300)]" },
        @{ Name = "Configuration"; Type = "Dictionary<string, object>"; Required = $false }
    )
```

## Output Structure

### Request DTO Template

```csharp
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Request DTO for {Domain} operations
/// Includes comprehensive validation attributes for government compliance
/// </summary>
public class {Domain}Request
{
    [Required(ErrorMessage = "...")]
    [StringLength(100)]
    public string PropertyName { get; set; } = string.Empty;
}
```

### Response DTO Template

```csharp
using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Response DTO for {Domain} information
/// </summary>
public class {Domain}Response
{
    public Guid Id { get; set; }
    public string PropertyName { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Government audit trail fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty
    public string UpdatedBy { get; set; } = string.Empty
}
```

### Result DTO Template

```csharp
using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Result wrapper for {Domain} operations
/// Provides consistent error handling and success/failure indication
/// </summary>
public class {Domain}Result
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public {Domain}Response? Data { get; set; }
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static {Domain}Result SuccessResult({Domain}Response? data, string message = "Operation completed successfully")
    {
        return new {Domain}Result
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static {Domain}Result FailureResult(string message, params string[] errors)
    {
        return new {Domain}Result
        {
            Success = false,
            Message = message,
            Errors = new List<string>(errors)
        };
    }
}
```

## Advanced Options

### Custom Namespace

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "CustomEntity" `
    -Namespace "TerraFusion.AI.DTOs" `
    -GenerateRequest `
    -GenerateResponse
```

### Custom Output Directory

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "CustomEntity" `
    -OutputDirectory "TerraFusion.AI/DTOs" `
    -GenerateRequest `
    -GenerateResponse
```

### Overwrite Existing Files

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "County" `
    -GenerateRequest `
    -Overwrite
```

## Integration Workflow

### 1. Generate DTOs

```powershell
.\Generate-MissingDTOs.ps1 -Domain "MyEntity" -GenerateRequest -GenerateResponse -GenerateResult -Properties @(...)
```

### 2. Review Generated Code

Open generated files in `TerraFusion.Core/DTOs/`:
- `MyEntityRequest.cs`
- `MyEntityResponse.cs`
- `MyEntityResult.cs`

### 3. Build Solution

```bash
dotnet build TerraFusion.sln
```

### 4. Add AutoMapper Profile

Create mapping in `TerraFusion.Core/Mappings/AutoMapperProfile.cs`:

```csharp
CreateMap<MyEntity, MyEntityResponse>();
CreateMap<MyEntityRequest, MyEntity>();
```

### 5. Create Controller Endpoint

```csharp
[HttpPost]
[ProducesResponseType(typeof(MyEntityResult), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<ActionResult<MyEntityResult>> CreateMyEntity([FromBody] MyEntityRequest request)
{
    if (!ModelState.IsValid)
    {
        var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray();
        return BadRequest(MyEntityResult.FailureResult("Validation failed", errors));
    }

    var entity = _mapper.Map<MyEntity>(request);
    await _context.MyEntities.AddAsync(entity);
    await _context.SaveChangesAsync();

    var response = _mapper.Map<MyEntityResponse>(entity);
    return Ok(MyEntityResult.SuccessResult(response, "Entity created successfully"));
}
```

## Best Practices

### 1. Use Descriptive Property Names
- ✅ `AssessedValue` (clear, specific)
- ❌ `Value` (ambiguous)

### 2. Add Validation Attributes
- Always add `[Required]` for mandatory fields
- Use `[StringLength]` to prevent database overflow
- Use `[Range]` for numeric constraints
- Use `[EmailAddress]`, `[Phone]`, `[Url]` for format validation

### 3. Include Validation Messages
```powershell
@{
    Name = "Email"
    Type = "string"
    Required = $true
    Validation = "[EmailAddress]"
    ValidationMessage = "A valid email address is required for government communications"
}
```

### 4. Government Compliance
- Response DTOs automatically include audit trail fields (CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
- These fields are auto-populated by `AuditableEntityInterceptor`
- Never manually modify audit fields

### 5. Use Result DTOs for API Responses
```csharp
// ✅ Good - Consistent error handling
return Ok(MyEntityResult.SuccessResult(response));
return BadRequest(MyEntityResult.FailureResult("Validation failed", errors));

// ❌ Bad - Inconsistent response format
return Ok(response);
return BadRequest("Validation failed");
```

## Troubleshooting

### Issue: "Output directory does not exist"

**Solution**: The script will create the directory automatically, or specify an existing directory:

```powershell
.\Generate-MissingDTOs.ps1 -Domain "MyEntity" -OutputDirectory "TerraFusion.Core/DTOs" -GenerateRequest
```

### Issue: "DTO already exists"

**Solution**: Use `-Overwrite` flag to replace existing files:

```powershell
.\Generate-MissingDTOs.ps1 -Domain "MyEntity" -GenerateRequest -Overwrite
```

### Issue: "No properties specified"

**Solution**: The script will generate placeholder DTOs. Add properties after generation or specify during generation:

```powershell
.\Generate-MissingDTOs.ps1 `
    -Domain "MyEntity" `
    -GenerateRequest `
    -Properties @(
        @{ Name = "Id"; Type = "Guid"; Required = $true }
    )
```

## Support

For issues or questions:
1. Review existing DTOs in `TerraFusion.Core/DTOs/` for patterns
2. Check `.github/copilot-instructions.md` for government compliance requirements
3. See `backend/CLAUDE.md` for backend development guidelines

---

**Classification**: Government Operating System Platform
**Compliance**: FISMA-HIGH, NIST 800-53
**Version**: TerraFusion OS 1.0

**THE TERRAFUSION WAY**: Execute with excellence. Quality, compliance, and reliability are non-negotiable.
