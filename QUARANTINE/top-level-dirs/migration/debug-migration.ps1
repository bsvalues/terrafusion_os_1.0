# TerraFusion OS 1.0 - Migration Debug and Validation Script
# Comprehensive debugging and validation for migration scripts

param(
    [string]$SourcePath = "e:\TerraFusion_OS",
    [string]$TargetPath = "e:\TerraFusion_OS_1.0",
    [switch]$Verbose = $false
)

Write-Host "=== TerraFusion OS 1.0 Migration Debug ===" -ForegroundColor Cyan
Write-Host "Source: $SourcePath" -ForegroundColor Yellow
Write-Host "Target: $TargetPath" -ForegroundColor Yellow
Write-Host "Verbose: $Verbose" -ForegroundColor Yellow
Write-Host ""

# Function to test path existence and permissions
function Test-PathAndPermissions {
    param([string]$Path, [string]$Description)
    
    Write-Host "Testing $Description..." -ForegroundColor Yellow
    
    if (Test-Path $Path) {
        Write-Host "  ✓ Path exists: $Path" -ForegroundColor Green
        
        # Test write permissions
        try {
            $testFile = Join-Path $Path "test_write_$(Get-Random).tmp"
            New-Item -ItemType File -Path $testFile -Force | Out-Null
            Remove-Item $testFile -Force
            Write-Host "  ✓ Write permissions: OK" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "  ✗ Write permissions: FAILED - $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
    else {
        Write-Host "  ✗ Path does not exist: $Path" -ForegroundColor Red
        return $false
    }
}

# Function to check PowerShell execution policy
function Test-PowerShellPolicy {
    Write-Host "Testing PowerShell execution policy..." -ForegroundColor Yellow
    
    $policy = Get-ExecutionPolicy
    Write-Host "  Current policy: $policy" -ForegroundColor Cyan
    
    if ($policy -eq "Restricted") {
        Write-Host "  ✗ Execution policy is Restricted - scripts cannot run" -ForegroundColor Red
        Write-Host "  Solution: Run 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser'" -ForegroundColor Yellow
        return $false
    }
    else {
        Write-Host "  ✓ Execution policy allows script execution" -ForegroundColor Green
        return $true
    }
}

# Function to validate script syntax
function Test-ScriptSyntax {
    param([string]$ScriptPath)
    
    Write-Host "Testing script syntax: $ScriptPath..." -ForegroundColor Yellow
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Host "  ✗ Script not found: $ScriptPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $ScriptPath -Raw), [ref]$null)
        Write-Host "  ✓ Syntax validation passed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ✗ Syntax error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check disk space
function Test-DiskSpace {
    param([string]$Path, [long]$RequiredSpaceGB = 5)
    
    Write-Host "Testing disk space for: $Path..." -ForegroundColor Yellow
    
    try {
        $drive = (Get-Item $Path).PSDrive
        $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
        
        Write-Host "  Available space: $freeSpaceGB GB" -ForegroundColor Cyan
        
        if ($freeSpaceGB -ge $RequiredSpaceGB) {
            Write-Host "  ✓ Sufficient disk space" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "  ✗ Insufficient disk space (need $RequiredSpaceGB GB)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Cannot determine disk space: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check source data availability
function Test-SourceData {
    Write-Host "Testing source data availability..." -ForegroundColor Yellow
    
    $criticalPaths = @(
        "$SourcePath\INTELLIGENCE",
        "$SourcePath\data\county-intelligence",
        "$SourcePath\platforms\championship\DEPLOYMENT",
        "$SourcePath\modules"
    )
    
    $foundPaths = 0
    foreach ($path in $criticalPaths) {
        if (Test-Path $path) {
            Write-Host "  ✓ Found: $path" -ForegroundColor Green
            $foundPaths++
        }
        else {
            Write-Host "  ✗ Missing: $path" -ForegroundColor Red
        }
    }
    
    if ($foundPaths -eq 0) {
        Write-Host "  ✗ No source data found - check source path" -ForegroundColor Red
        return $false
    }
    elseif ($foundPaths -lt $criticalPaths.Count) {
        Write-Host "  ⚠ Partial source data found ($foundPaths/$($criticalPaths.Count))" -ForegroundColor Yellow
        return $true
    }
    else {
        Write-Host "  ✓ All source data paths found" -ForegroundColor Green
        return $true
    }
}

# Function to run dry-run test
function Test-DryRun {
    param([string]$ScriptPath)
    
    Write-Host "Running dry-run test for: $ScriptPath..." -ForegroundColor Yellow
    
    try {
        $result = & powershell.exe -ExecutionPolicy Bypass -File $ScriptPath -DryRun -ErrorAction Stop
        Write-Host "  ✓ Dry-run completed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ✗ Dry-run failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main debugging sequence
Write-Host "`n=== System Environment Check ===" -ForegroundColor Cyan
$policyOK = Test-PowerShellPolicy
$diskOK = Test-DiskSpace -Path (Split-Path $TargetPath -Parent)

Write-Host "`n=== Path Validation ===" -ForegroundColor Cyan
$sourceOK = Test-PathAndPermissions -Path (Split-Path $SourcePath -Parent) -Description "Source parent directory"
$targetOK = Test-PathAndPermissions -Path (Split-Path $TargetPath -Parent) -Description "Target parent directory"

Write-Host "`n=== Source Data Check ===" -ForegroundColor Cyan
$dataOK = Test-SourceData

Write-Host "`n=== Script Validation ===" -ForegroundColor Cyan
$consolidateOK = Test-ScriptSyntax -ScriptPath "consolidate-data.ps1"
$migrateOK = Test-ScriptSyntax -ScriptPath "migrate-modules.ps1"

Write-Host "`n=== Dry-Run Tests ===" -ForegroundColor Cyan
if ($consolidateOK) {
    $dryRun1OK = Test-DryRun -ScriptPath "consolidate-data.ps1"
}
else {
    $dryRun1OK = $false
}

if ($migrateOK) {
    $dryRun2OK = Test-DryRun -ScriptPath "migrate-modules.ps1"
}
else {
    $dryRun2OK = $false
}

# Summary
Write-Host "`n=== Debug Summary ===" -ForegroundColor Cyan
$allChecks = @{
    "PowerShell Policy" = $policyOK
    "Disk Space" = $diskOK
    "Source Paths" = $sourceOK
    "Target Paths" = $targetOK
    "Source Data" = $dataOK
    "Consolidate Script" = $consolidateOK
    "Migrate Script" = $migrateOK
    "Consolidate Dry-Run" = $dryRun1OK
    "Migrate Dry-Run" = $dryRun2OK
}

$passedChecks = 0
foreach ($check in $allChecks.GetEnumerator()) {
    $status = if ($check.Value) { "✓ PASS" } else { "✗ FAIL" }
    $color = if ($check.Value) { "Green" } else { "Red" }
    Write-Host "  $($check.Key): $status" -ForegroundColor $color
    if ($check.Value) { $passedChecks++ }
}

Write-Host "`nOverall Status: $passedChecks/$($allChecks.Count) checks passed" -ForegroundColor Cyan

if ($passedChecks -eq $allChecks.Count) {
    Write-Host "✓ All checks passed - migration ready to run" -ForegroundColor Green
    exit 0
}
elseif ($passedChecks -ge 7) {
    Write-Host "⚠ Most checks passed - migration may work with warnings" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "✗ Multiple issues found - fix problems before running migration" -ForegroundColor Red
    exit 2
}
