<#
.SYNOPSIS
    TerraFusion OS DTO Generator - Championship-Level Code Generation

.DESCRIPTION
    Generates missing Request, Response, and Result DTOs based on discovered patterns
    from the TerraFusion.Core.DTOs codebase. Follows government compliance standards
    and TerraFusion OS coding conventions.

.PARAMETER Domain
    The domain/entity name (e.g., "Property", "Assessment", "AIAgent")

.PARAMETER Namespace
    The namespace for the DTO (default: TerraFusion.Core.DTOs)

.PARAMETER OutputDirectory
    The output directory for generated DTOs (default: TerraFusion.Core/DTOs)

.PARAMETER GenerateRequest
    Generate Request DTO with validation attributes

.PARAMETER GenerateResponse
    Generate Response DTO with timestamp

.PARAMETER GenerateResult
    Generate Result DTO with Success/Message/Data/Errors pattern

.PARAMETER Properties
    Hashtable of properties @{ Name = "PropertyName"; Type = "string"; Required = $true; Validation = "[StringLength(100)]" }

.PARAMETER Overwrite
    Overwrite existing files

.EXAMPLE
    .\Generate-MissingDTOs.ps1 -Domain "County" -GenerateRequest -GenerateResponse -GenerateResult -Properties @(
        @{ Name = "Name"; Type = "string"; Required = $true; Validation = "[StringLength(100)]" },
        @{ Name = "StateCode"; Type = "string"; Required = $true; Validation = "[StringLength(2)]" },
        @{ Name = "Population"; Type = "int"; Required = $false; Validation = "[Range(0, 10000000)]" }
    )

.EXAMPLE
    .\Generate-MissingDTOs.ps1 -Domain "TaxLevy" -GenerateRequest -GenerateResponse -Properties @(
        @{ Name = "PropertyId"; Type = "Guid"; Required = $true },
        @{ Name = "TaxYear"; Type = "int"; Required = $true; Validation = "[Range(1990, 2030)]" },
        @{ Name = "TaxAmount"; Type = "decimal"; Required = $true; Validation = "[Range(0, 1000000)]" }
    )

.NOTES
    Author: TerraFusion OS AI Swarm
    Version: 1.0.0
    Classification: Government Operating System Platform
    Compliance: FISMA-HIGH, NIST 800-53

    THE TERRAFUSION WAY: Execute with excellence. This is production government
    infrastructure serving real citizens with real property data.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, HelpMessage = "Domain/Entity name (e.g., County, TaxLevy)")]
    [string]$Domain,

    [Parameter(Mandatory = $false)]
    [string]$Namespace = "TerraFusion.Core.DTOs",

    [Parameter(Mandatory = $false)]
    [string]$OutputDirectory = "TerraFusion.Core/DTOs",

    [Parameter(Mandatory = $false)]
    [switch]$GenerateRequest,

    [Parameter(Mandatory = $false)]
    [switch]$GenerateResponse,

    [Parameter(Mandatory = $false)]
    [switch]$GenerateResult,

    [Parameter(Mandatory = $false)]
    [array]$Properties = @(),

    [Parameter(Mandatory = $false)]
    [switch]$Overwrite
)

# Set strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

#region Helper Functions

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" -Color Green
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ $Message" -Color Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠ $Message" -Color Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" -Color Red
}

function Get-PropertyDeclaration {
    param(
        [hashtable]$Property,
        [bool]$IsRequest = $false
    )

    $lines = @()

    # Add validation attributes for Request DTOs
    if ($IsRequest -and $Property.Validation) {
        $lines += "    $($Property.Validation)"
    }

    # Add Required attribute for Request DTOs
    if ($IsRequest -and $Property.Required) {
        if ($Property.ValidationMessage) {
            $lines += "    [Required(ErrorMessage = `"$($Property.ValidationMessage)`")]"
        } else {
            $lines += "    [Required]"
        }
    }

    # Property declaration
    $propertyType = $Property.Type
    if (-not $Property.Required -and $propertyType -ne "string") {
        $propertyType = "$($Property.Type)?"
    }

    $defaultValue = ""
    if ($Property.Type -eq "string") {
        $defaultValue = " = string.Empty"
    } elseif ($Property.Type -eq "List" -or $Property.Type.StartsWith("List<")) {
        if ($Property.Type -eq "List") {
            $defaultValue = " = new()"
        } else {
            $defaultValue = " = new()"
        }
    } elseif ($Property.Type -eq "Dictionary" -or $Property.Type.StartsWith("Dictionary<")) {
        $defaultValue = " = new()"
    } elseif ($Property.Default) {
        $defaultValue = " = $($Property.Default)"
    }

    $lines += "    public $propertyType $($Property.Name) { get; set; }$defaultValue"

    return $lines -join "`n"
}

function Get-AuditProperties {
    return @"
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty
    public string UpdatedBy { get; set; } = string.Empty
"@
}

function Get-TimestampProperty {
    return "    public DateTime Timestamp { get; set; } = DateTime.UtcNow;"
}

#endregion

#region DTO Template Generators

function New-RequestDTO {
    param(
        [string]$DomainName,
        [array]$Properties,
        [string]$Namespace
    )

    $className = "${DomainName}Request"
    $propertiesCode = ($Properties | ForEach-Object { Get-PropertyDeclaration -Property $_ -IsRequest $true }) -join "`n`n"

    return @"
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace $Namespace;

/// <summary>
/// Request DTO for $DomainName operations
/// Includes comprehensive validation attributes for government compliance
/// </summary>
public class $className
{
$propertiesCode
}
"@
}

function New-ResponseDTO {
    param(
        [string]$DomainName,
        [array]$Properties,
        [string]$Namespace,
        [bool]$IncludeAudit = $true
    )

    $className = "${DomainName}Response"
    $propertiesCode = ($Properties | ForEach-Object { Get-PropertyDeclaration -Property $_ -IsRequest $false }) -join "`n`n"

    $timestampProperty = Get-TimestampProperty

    $auditProperties = ""
    if ($IncludeAudit) {
        $auditProperties = "`n`n    // Government audit trail fields`n" + (Get-AuditProperties)
    }

    return @"
using System;
using System.Collections.Generic;

namespace $Namespace;

/// <summary>
/// Response DTO for $DomainName information
/// </summary>
public class $className
{
$propertiesCode

$timestampProperty$auditProperties
}
"@
}

function New-ResultDTO {
    param(
        [string]$DomainName,
        [string]$DataType,
        [string]$Namespace
    )

    $className = "${DomainName}Result"

    # Determine if DataType should be nullable
    $dataTypeDeclaration = if ($DataType -and $DataType -ne "object") {
        "$DataType?"
    } else {
        "object?"
    }

    return @"
using System;
using System.Collections.Generic;

namespace $Namespace;

/// <summary>
/// Result wrapper for $DomainName operations
/// Provides consistent error handling and success/failure indication
/// </summary>
public class $className
{
    /// <summary>
    /// Indicates whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Human-readable message describing the result
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// The result data (null if operation failed)
    /// </summary>
    public $dataTypeDeclaration Data { get; set; }

    /// <summary>
    /// List of validation or processing errors
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Timestamp when the result was generated
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Creates a successful result with data
    /// </summary>
    public static $className SuccessResult($dataTypeDeclaration data, string message = "Operation completed successfully")
    {
        return new $className
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    /// <summary>
    /// Creates a failed result with error messages
    /// </summary>
    public static $className FailureResult(string message, params string[] errors)
    {
        return new $className
        {
            Success = false,
            Message = message,
            Errors = new List<string>(errors)
        };
    }

    /// <summary>
    /// Creates a failed result with a single error
    /// </summary>
    public static $className FailureResult(string message, string error)
    {
        return new $className
        {
            Success = false,
            Message = message,
            Errors = new List<string> { error }
        };
    }
}
"@
}

#endregion

#region Main Execution

try {
    Write-Info "TerraFusion OS DTO Generator - Championship Edition"
    Write-Info "=================================================="
    Write-Info ""
    Write-Info "Domain: $Domain"
    Write-Info "Namespace: $Namespace"
    Write-Info "Output Directory: $OutputDirectory"
    Write-Info ""

    # Validate output directory exists
    if (-not (Test-Path -Path $OutputDirectory)) {
        Write-Warning "Output directory does not exist. Creating: $OutputDirectory"
        New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
        Write-Success "Created output directory"
    }

    # Validate at least one generation option is selected
    if (-not ($GenerateRequest -or $GenerateResponse -or $GenerateResult)) {
        Write-Error "No generation options selected. Use -GenerateRequest, -GenerateResponse, or -GenerateResult"
        exit 1
    }

    # Generate Request DTO
    if ($GenerateRequest) {
        $requestFileName = "${Domain}Request.cs"
        $requestFilePath = Join-Path -Path $OutputDirectory -ChildPath $requestFileName

        if ((Test-Path -Path $requestFilePath) -and -not $Overwrite) {
            Write-Warning "Request DTO already exists: $requestFilePath (use -Overwrite to replace)"
        } else {
            if ($Properties.Count -eq 0) {
                Write-Warning "No properties specified for Request DTO. Generating with placeholder."
                $Properties = @(
                    @{ Name = "Id"; Type = "Guid"; Required = $true }
                )
            }

            $requestContent = New-RequestDTO -DomainName $Domain -Properties $Properties -Namespace $Namespace
            Set-Content -Path $requestFilePath -Value $requestContent -Encoding UTF8
            Write-Success "Generated Request DTO: $requestFilePath"
        }
    }

    # Generate Response DTO
    if ($GenerateResponse) {
        $responseFileName = "${Domain}Response.cs"
        $responseFilePath = Join-Path -Path $OutputDirectory -ChildPath $responseFileName

        if ((Test-Path -Path $responseFilePath) -and -not $Overwrite) {
            Write-Warning "Response DTO already exists: $responseFilePath (use -Overwrite to replace)"
        } else {
            if ($Properties.Count -eq 0) {
                Write-Warning "No properties specified for Response DTO. Generating with placeholder."
                $Properties = @(
                    @{ Name = "Id"; Type = "Guid"; Required = $true }
                )
            }

            $responseContent = New-ResponseDTO -DomainName $Domain -Properties $Properties -Namespace $Namespace -IncludeAudit $true
            Set-Content -Path $responseFilePath -Value $responseContent -Encoding UTF8
            Write-Success "Generated Response DTO: $responseFilePath"
        }
    }

    # Generate Result DTO
    if ($GenerateResult) {
        $resultFileName = "${Domain}Result.cs"
        $resultFilePath = Join-Path -Path $OutputDirectory -ChildPath $resultFileName

        if ((Test-Path -Path $resultFilePath) -and -not $Overwrite) {
            Write-Warning "Result DTO already exists: $resultFilePath (use -Overwrite to replace)"
        } else {
            # Determine data type for Result DTO
            $dataType = "${Domain}Response"
            if (-not $GenerateResponse) {
                $dataType = "object"
            }

            $resultContent = New-ResultDTO -DomainName $Domain -DataType $dataType -Namespace $Namespace
            Set-Content -Path $resultFilePath -Value $resultContent -Encoding UTF8
            Write-Success "Generated Result DTO: $resultFilePath"
        }
    }

    Write-Info ""
    Write-Success "DTO Generation Complete!"
    Write-Info ""
    Write-Info "Next Steps:"
    Write-Info "1. Review generated DTOs for accuracy"
    Write-Info "2. Add additional properties as needed"
    Write-Info "3. Build solution: dotnet build TerraFusion.sln"
    Write-Info "4. Add AutoMapper profiles if needed"
    Write-Info "5. Create corresponding controller endpoints"
    Write-Info ""
    Write-Success "THE TERRAFUSION WAY: Quality, compliance, and reliability are non-negotiable."

} catch {
    Write-Error "DTO Generation Failed: $($_.Exception.Message)"
    Write-Error $_.ScriptStackTrace
    exit 1
}

#endregion
