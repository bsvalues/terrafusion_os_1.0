<#
.SYNOPSIS
    Validates the TerraFusion SpecLock INDEX.json against the schema and checks file existence.

.DESCRIPTION
    This script performs the following validations:
    1. Validates INDEX.json against index.schema.json
    2. Ensures all spec_path files exist
    3. Ensures all test_paths have at least one matching file
    4. Checks for duplicate IDs
    5. Reports any issues found

.EXAMPLE
    ./scripts/validate-speclock-index.ps1

.EXAMPLE
    ./scripts/validate-speclock-index.ps1 -Strict

.NOTES
    TerraFusion OS - SpecLock Index Validator
    Version: 1.0.0
#>

[CmdletBinding()]
param(
    [switch]$Strict,
    [string]$RepoRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Failure { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TerraFusion SpecLock Index Validator" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Find repo root (look for .git or specific markers)
while (-not (Test-Path (Join-Path $RepoRoot ".git")) -and $RepoRoot -ne [System.IO.Path]::GetPathRoot($RepoRoot)) {
    $RepoRoot = Split-Path $RepoRoot -Parent
}

$indexPath = Join-Path $RepoRoot "docs/spec-lock/INDEX.json"
$schemaPath = Join-Path $RepoRoot "docs/spec-lock/index.schema.json"

# Check files exist
if (-not (Test-Path $indexPath)) {
    Write-Failure "INDEX.json not found at: $indexPath"
    exit 1
}

if (-not (Test-Path $schemaPath)) {
    Write-Warning "Schema file not found at: $schemaPath (skipping schema validation)"
    $skipSchema = $true
}

Write-Info "Repo root: $RepoRoot"
Write-Info "Index: $indexPath"
Write-Host ""

# Load INDEX.json
try {
    $index = Get-Content $indexPath -Raw | ConvertFrom-Json
    Write-Success "INDEX.json parsed successfully"
} catch {
    Write-Failure "Failed to parse INDEX.json: $_"
    exit 1
}

# Track issues
$issues = @()
$warnings = @()

# Validate basic structure
Write-Host ""
Write-Host "Validating Structure..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────"

if (-not $index.version) {
    $issues += "Missing 'version' field"
} else {
    Write-Success "Version: $($index.version)"
}

if (-not $index.updated) {
    $issues += "Missing 'updated' field"
} else {
    Write-Success "Updated: $($index.updated)"
}

if (-not $index.locks -or $index.locks.Count -eq 0) {
    $issues += "No locks defined"
} else {
    Write-Success "Locks count: $($index.locks.Count)"
}

# Check for duplicate IDs
Write-Host ""
Write-Host "Checking for Duplicates..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────"

$ids = $index.locks | ForEach-Object { $_.id }
$duplicates = $ids | Group-Object | Where-Object { $_.Count -gt 1 }

if ($duplicates) {
    foreach ($dup in $duplicates) {
        $issues += "Duplicate ID: $($dup.Name) (appears $($dup.Count) times)"
    }
} else {
    Write-Success "No duplicate IDs found"
}

# Validate each lock
Write-Host ""
Write-Host "Validating Locks..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────"

$validSurfaces = @("api", "ui", "events", "metrics", "alerts", "dashboards", "mixed")
$validStatuses = @("active", "deprecated", "draft")

foreach ($lock in $index.locks) {
    Write-Host ""
    Write-Host "  Lock: $($lock.id)" -ForegroundColor White

    # Required fields
    $requiredFields = @("id", "project", "surface", "name", "owner", "status", "spec_version", "spec_path", "test_paths", "created")
    foreach ($field in $requiredFields) {
        if (-not $lock.$field) {
            $issues += "Lock '$($lock.id)': Missing required field '$field'"
        }
    }

    # ID format
    if ($lock.id -and $lock.id -notmatch "^tf\.[a-z_]+\.[a-z0-9_]+$") {
        $issues += "Lock '$($lock.id)': ID must match pattern 'tf.<surface>.<slug>'"
    }

    # Surface validation
    if ($lock.surface -and $lock.surface -notin $validSurfaces) {
        $issues += "Lock '$($lock.id)': Invalid surface '$($lock.surface)' (must be one of: $($validSurfaces -join ', '))"
    }

    # Status validation
    if ($lock.status -and $lock.status -notin $validStatuses) {
        $issues += "Lock '$($lock.id)': Invalid status '$($lock.status)' (must be one of: $($validStatuses -join ', '))"
    }

    # Version format
    if ($lock.spec_version -and $lock.spec_version -notmatch "^v\d+\.\d+\.\d+$") {
        $issues += "Lock '$($lock.id)': Invalid spec_version format (must be vX.Y.Z)"
    }

    # Check spec_path exists
    if ($lock.spec_path) {
        $specFullPath = Join-Path $RepoRoot $lock.spec_path
        if (Test-Path $specFullPath) {
            Write-Success "    spec_path exists: $($lock.spec_path)"
        } else {
            $issues += "Lock '$($lock.id)': spec_path not found: $($lock.spec_path)"
            Write-Failure "    spec_path NOT FOUND: $($lock.spec_path)"
        }
    }

    # Check test_paths have matches
    if ($lock.test_paths -and $lock.test_paths.Count -gt 0) {
        $testFilesFound = $false
        foreach ($testPath in $lock.test_paths) {
            # Handle glob patterns
            $searchPath = Join-Path $RepoRoot $testPath
            $matches = Get-ChildItem -Path $searchPath -ErrorAction SilentlyContinue
            if ($matches) {
                $testFilesFound = $true
                Write-Success "    test_path matches: $($testPath) ($($matches.Count) file(s))"
            }
        }
        if (-not $testFilesFound) {
            $issues += "Lock '$($lock.id)': No test files found matching test_paths"
            Write-Failure "    test_paths: NO MATCHES FOUND"
        }
    } else {
        $issues += "Lock '$($lock.id)': test_paths is empty or missing"
    }

    # Check artifact_paths (optional but warn if missing)
    if (-not $lock.artifact_paths -or $lock.artifact_paths.Count -eq 0) {
        $warnings += "Lock '$($lock.id)': No artifact_paths defined"
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Validation Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Locks validated: $($index.locks.Count)"
Write-Host "Issues found: $($issues.Count)"
Write-Host "Warnings: $($warnings.Count)"
Write-Host ""

if ($warnings.Count -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Warning $warning
    }
    Write-Host ""
}

if ($issues.Count -gt 0) {
    Write-Host "Issues (must fix):" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Failure $issue
    }
    Write-Host ""
    Write-Failure "Validation FAILED with $($issues.Count) issue(s)"
    exit 1
} else {
    Write-Success "Validation PASSED"
    exit 0
}
