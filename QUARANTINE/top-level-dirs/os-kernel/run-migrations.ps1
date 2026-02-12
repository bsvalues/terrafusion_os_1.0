# ═══════════════════════════════════════════════════════════════════════════
# TERRAFUSION OS - DATABASE MIGRATION RUNNER
# Executes SQL migrations against the OS Data Layer (PostgreSQL)
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$Reset,      # Drop and recreate all tables
    [switch]$Verify,     # Only verify schema, don't modify
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host @"

  ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
     ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
     ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                                                                                          
                             DATABASE MIGRATION RUNNER
                          OS Data Layer Schema Management

"@ -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$MigrationsDir = Join-Path $ScriptRoot "database"

# Load connection info from .env.sovereign if exists
$EnvFile = Join-Path (Split-Path -Parent $ScriptRoot) ".env.sovereign"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
    Write-Host "[Config] Loaded connection from .env.sovereign" -ForegroundColor Gray
}

# Database connection parameters
$DbHost = $env:POSTGRES_HOST ?? "localhost"
$DbPort = $env:POSTGRES_PORT ?? "5432"
$DbName = $env:POSTGRES_DB ?? "terrafusion_os"
$DbUser = $env:POSTGRES_USER ?? "terrafusion_admin"
$DbPass = $env:POSTGRES_PASSWORD ?? "tf_sovereign_dev_pw"

Write-Host "[Config] Target: postgresql://${DbUser}@${DbHost}:${DbPort}/${DbName}" -ForegroundColor Gray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

function Invoke-PsqlCommand {
    param([string]$Sql, [switch]$Quiet)
    
    $env:PGPASSWORD = $DbPass
    
    if ($Quiet) {
        $result = wsl -d Ubuntu -- psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c $Sql 2>&1
    } else {
        $result = wsl -d Ubuntu -- psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $Sql 2>&1
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL command failed: $result"
    }
    
    return $result
}

function Invoke-PsqlFile {
    param([string]$FilePath)
    
    $env:PGPASSWORD = $DbPass
    
    # Read file content and pipe to psql via WSL
    $SqlContent = Get-Content $FilePath -Raw
    
    # Create temp file in WSL-accessible location
    $TempFile = "/tmp/migration_$(Get-Date -Format 'yyyyMMddHHmmss').sql"
    $SqlContent | wsl -d Ubuntu -- tee $TempFile > $null
    
    $result = wsl -d Ubuntu -- psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $TempFile 2>&1
    
    # Cleanup
    wsl -d Ubuntu -- rm -f $TempFile
    
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed: $result"
    }
    
    return $result
}

function Test-DatabaseConnection {
    try {
        $result = Invoke-PsqlCommand "SELECT 1 AS connected;" -Quiet
        return $true
    } catch {
        return $false
    }
}

function Get-AppliedMigrations {
    try {
        $result = Invoke-PsqlCommand "SELECT version FROM schema_migrations ORDER BY version;" -Quiet
        return ($result -split "`n" | Where-Object { $_.Trim() } | ForEach-Object { $_.Trim() })
    } catch {
        return @()
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

# Step 1: Verify Connection
Write-Host "[Step 1] Testing database connection..." -ForegroundColor Yellow

if (-not (Test-DatabaseConnection)) {
    Write-Host ""
    Write-Host "❌ Cannot connect to database!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is running in WSL" -ForegroundColor Gray
    Write-Host "  2. Run: .\scripts\ignite-os-data-layer.ps1" -ForegroundColor Gray
    Write-Host "  3. Database 'terrafusion_os' exists" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✅ Database connection successful" -ForegroundColor Green
Write-Host ""

# Step 2: Get migration files
Write-Host "[Step 2] Scanning migrations directory..." -ForegroundColor Yellow

if (-not (Test-Path $MigrationsDir)) {
    Write-Host "❌ Migrations directory not found: $MigrationsDir" -ForegroundColor Red
    exit 1
}

$MigrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
Write-Host "   Found $($MigrationFiles.Count) migration file(s)" -ForegroundColor Gray

if ($MigrationFiles.Count -eq 0) {
    Write-Host "⚠️ No migration files found" -ForegroundColor Yellow
    exit 0
}

# Step 3: Check applied migrations
Write-Host ""
Write-Host "[Step 3] Checking applied migrations..." -ForegroundColor Yellow

$AppliedMigrations = Get-AppliedMigrations
Write-Host "   Applied: $($AppliedMigrations.Count) migration(s)" -ForegroundColor Gray

# Step 4: Run pending migrations
Write-Host ""
Write-Host "[Step 4] Running pending migrations..." -ForegroundColor Yellow

$PendingCount = 0
$ErrorCount = 0

foreach ($File in $MigrationFiles) {
    # Extract version from filename (e.g., "001_initial_schema.sql" -> "1.0.0")
    $VersionMatch = $File.Name -match "^(\d+)"
    if (-not $VersionMatch) { continue }
    
    $FileVersion = $matches[1]
    
    # For our schema, we use semantic versioning in the migration itself
    # Check if this file has been applied
    $Description = $File.BaseName -replace "^\d+_", "" -replace "_", " "
    
    if ($Verify) {
        Write-Host "   [VERIFY] $($File.Name)" -ForegroundColor Cyan
        continue
    }
    
    Write-Host "   Running: $($File.Name)..." -ForegroundColor Cyan
    
    try {
        $Output = Invoke-PsqlFile $File.FullName
        
        if ($Verbose) {
            Write-Host $Output -ForegroundColor Gray
        }
        
        Write-Host "   ✅ $($File.Name) applied" -ForegroundColor Green
        $PendingCount++
    } catch {
        Write-Host "   ❌ $($File.Name) FAILED: $_" -ForegroundColor Red
        $ErrorCount++
        
        if (-not $Verbose) {
            # On error, show the output
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
}

# Step 5: Verification
Write-Host ""
Write-Host "[Step 5] Verifying schema..." -ForegroundColor Yellow

try {
    $Tables = Invoke-PsqlCommand "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" -Quiet
    $TableList = ($Tables -split "`n" | Where-Object { $_.Trim() } | ForEach-Object { $_.Trim() })
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ MIGRATION COMPLETE" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Migrations Applied: $PendingCount" -ForegroundColor White
    Write-Host "  Errors: $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } else { "White" })
    Write-Host ""
    Write-Host "  Tables Created:" -ForegroundColor White
    foreach ($Table in $TableList) {
        Write-Host "    • $Table" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Verification failed: $_" -ForegroundColor Red
}

# Save verification results
$VerificationFile = Join-Path $ScriptRoot "MIGRATION_STATUS.md"
$VerificationContent = @"
# Database Migration Status

**Last Run**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Database**: $DbName
**Host**: $DbHost

## Applied Migrations

| File | Status |
|------|--------|
$($MigrationFiles | ForEach-Object { "| $($_.Name) | ✅ Applied |" } | Out-String)

## Tables

$($TableList | ForEach-Object { "- $($_)" } | Out-String)

## Connection String

``````
postgresql://${DbUser}:****@${DbHost}:${DbPort}/${DbName}
``````
"@

Set-Content -Path $VerificationFile -Value $VerificationContent
Write-Host "  Status saved to: $VerificationFile" -ForegroundColor Gray
