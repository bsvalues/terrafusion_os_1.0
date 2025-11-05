# TerraFusion Canonical Type Migration Script
# Addresses root cause of 39+ recurring type ambiguity compilation errors
# Implements Single Source of Truth architecture with canonical DTOs

param(
    [switch]$DryRun = $false,
    [switch]$Phase1Only = $false,
    [switch]$Phase2Only = $false,
    [switch]$Validate = $false
)

$ErrorActionPreference = "Stop"
$backendPath = Split-Path -Parent $PSScriptRoot

Write-Host "🏛️ TerraFusion Canonical Type Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE EXECUTION' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

# ============================================================================
# Phase 1: Create Canonical DTO Structure
# ============================================================================
function Execute-Phase1 {
    Write-Host "📁 Phase 1: Creating canonical DTO structure..." -ForegroundColor Yellow
    
    $dtoDirs = @(
        "$backendPath\TerraFusion.Abstractions\DTOs\Requests",
        "$backendPath\TerraFusion.Abstractions\DTOs\Responses",
        "$backendPath\TerraFusion.Abstractions\DTOs\Shared",
        "$backendPath\TerraFusion.Abstractions\DTOs\AI",
        "$backendPath\TerraFusion.Abstractions\Enums"
    )
    
    foreach ($dir in $dtoDirs) {
        if (-not (Test-Path $dir)) {
            if (-not $DryRun) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
            }
            Write-Host "  ✅ Created: $($dir.Replace($backendPath, '.'))" -ForegroundColor Green
        }
        else {
            Write-Host "  ⏭️  Exists: $($dir.Replace($backendPath, '.'))" -ForegroundColor Gray
        }
    }
    
    # Create canonical DTO files (placeholders for now)
    $dtoFiles = @{
        "$backendPath\TerraFusion.Abstractions\DTOs\Responses\CommonResponses.cs" = @"
// TerraFusion.Abstractions/DTOs/Responses/CommonResponses.cs
// Canonical definitions for cross-project response DTOs
// Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

namespace TerraFusion.Abstractions.DTOs.Responses;

/// <summary>
/// Canonical optimization recommendation DTO
/// Replaces: API.Interfaces.OptimizationRecommendation, Abstractions.Interfaces.OptimizationRecommendation
/// </summary>
public class OptimizationRecommendation
{
    public string RecommendationId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ImpactScore { get; set; }
    public string Priority { get; set; } = string.Empty;
    public List<string> ActionItems { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Canonical elite performance metrics DTO
/// Replaces: API.Services.ElitePerformanceMetrics, Abstractions.Interfaces.ElitePerformanceMetrics, Operations.Models.ElitePerformanceMetrics
/// </summary>
public class ElitePerformanceMetrics
{
    public double CPUUtilization { get; set; }
    public double MemoryUtilization { get; set; }
    public double DiskUtilization { get; set; }
    public double NetworkUtilization { get; set; }
    public TimeSpan ResponseTime { get; set; }
    public double ThroughputPerSecond { get; set; }
    public double ErrorRate { get; set; }
    public double PerformanceScore { get; set; }
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Canonical synchronization result DTO
/// Replaces: Core.Interfaces.SyncResult, Core.Services.SyncResult
/// </summary>
public class SyncResult
{
    public bool Success { get; set; }
    public int RecordsProcessed { get; set; }
    public int RecordsInserted { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsSkipped { get; set; }
    public int RecordsFailed { get; set; }
    public List<string> Errors { get; set; } = new();
    public TimeSpan Duration { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Canonical compliance violation DTO
/// Replaces: Abstractions.DTOs.ComplianceViolation, Core.Services.ComplianceViolation
/// </summary>
public class ComplianceViolation
{
    public string ViolationId { get; set; } = string.Empty;
    public string ViolationType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; }
    public string RemediationSteps { get; set; } = string.Empty;
}
"@
    }
    
    foreach ($file in $dtoFiles.Keys) {
        if (-not (Test-Path $file)) {
            if (-not $DryRun) {
                Set-Content -Path $file -Value $dtoFiles[$file]
            }
            Write-Host "  ✅ Created: $($file.Replace($backendPath, '.'))" -ForegroundColor Green
        }
        else {
            Write-Host "  ⏭️  Exists: $($file.Replace($backendPath, '.'))" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
}

# ============================================================================
# Phase 2: Update References
# ============================================================================
function Execute-Phase2 {
    Write-Host "🔄 Phase 2: Updating type references..." -ForegroundColor Yellow
    
    $typeMap = @{
        # OptimizationRecommendation: 14 references
        "TerraFusion.API.Interfaces.OptimizationRecommendation"          = "TerraFusion.Abstractions.DTOs.Responses.OptimizationRecommendation"
        "TerraFusion.Abstractions.Interfaces.OptimizationRecommendation" = "TerraFusion.Abstractions.DTOs.Responses.OptimizationRecommendation"
        
        # SyncResult: 9 references
        "TerraFusion.Core.Interfaces.SyncResult"                         = "TerraFusion.Abstractions.DTOs.Responses.SyncResult"
        "TerraFusion.Core.Services.SyncResult"                           = "TerraFusion.Abstractions.DTOs.Responses.SyncResult"
        
        # ComplianceViolation: 1 reference
        "TerraFusion.Core.Services.ComplianceViolation"                  = "TerraFusion.Abstractions.DTOs.Responses.ComplianceViolation"
        
        # WorkflowExecution: 2 references (keep AI.Services version for now, rename later)
        # "TerraFusion.AI.Services.WorkflowExecution" = "TerraFusion.Abstractions.DTOs.AI.WorkflowExecutionDto"
    }
    
    $targetFiles = Get-ChildItem -Path "$backendPath\TerraFusion.API" -Filter "*.cs" -Recurse
    $updateCount = 0
    
    foreach ($file in $targetFiles) {
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        
        foreach ($oldType in $typeMap.Keys) {
            $newType = $typeMap[$oldType]
            
            # Update fully qualified type references
            $content = $content -replace [regex]::Escape($oldType), $newType
        }
        
        if ($content -ne $originalContent) {
            if (-not $DryRun) {
                Set-Content -Path $file.FullName -Value $content -NoNewline
            }
            $updateCount++
            Write-Host "  ✅ Updated: $($file.Name)" -ForegroundColor Green
        }
    }
    
    Write-Host "  📊 Total files updated: $updateCount" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# Validation
# ============================================================================
function Execute-Validation {
    Write-Host "🔨 Validation: Building solution..." -ForegroundColor Yellow
    
    Push-Location $backendPath
    try {
        $buildOutput = dotnet build TerraFusion.sln -c Release --no-restore 2>&1 | Out-String
        $errors = $buildOutput | Select-String "error CS"
        $errorCount = ($errors | Measure-Object).Count
        
        if ($errorCount -eq 0) {
            Write-Host "  ✅ Build succeeded with 0 errors!" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ Build failed with $errorCount errors:" -ForegroundColor Red
            $errors | Select-Object -First 10 | ForEach-Object {
                Write-Host "    $_" -ForegroundColor Red
            }
            if ($errorCount -gt 10) {
                Write-Host "    ... and $($errorCount - 10) more errors" -ForegroundColor Red
            }
        }
        
        # Extract warning count
        if ($buildOutput -match "(\d+) Warning\(s\)") {
            $warningCount = $matches[1]
            Write-Host "  ⚠️  $warningCount warnings (tracked separately)" -ForegroundColor Yellow
        }
        
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
}

# ============================================================================
# Main Execution
# ============================================================================

try {
    if ($Validate) {
        Execute-Validation
        exit 0
    }
    
    if (-not $Phase2Only) {
        Execute-Phase1
    }
    
    if (-not $Phase1Only) {
        Execute-Phase2
    }
    
    if (-not $DryRun) {
        Write-Host "🎯 Executing build validation..." -ForegroundColor Cyan
        Execute-Validation
    }
    
    Write-Host "✅ Migration complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review changes: git diff" -ForegroundColor White
    Write-Host "  2. Manual fixes: Address any remaining ambiguities" -ForegroundColor White
    Write-Host "  3. Run tests: dotnet test TerraFusion.sln" -ForegroundColor White
    Write-Host "  4. Commit: git commit -am 'refactor: implement canonical type architecture'" -ForegroundColor White
    
}
catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
