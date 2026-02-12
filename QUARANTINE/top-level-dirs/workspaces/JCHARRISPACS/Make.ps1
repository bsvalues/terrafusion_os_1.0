# Benton County PACS - Make.ps1 (Windows PowerShell wrapper for Makefile)
# Usage: .\Make.ps1 <target>
# Examples: .\Make.ps1 help
#           .\Make.ps1 viz
#           .\Make.ps1 pacs-inventory

param(
    [Parameter(Position = 0)]
    [string]$Target = "help"
)

$ErrorActionPreference = "Stop"

# Configuration (override with environment variables)
$env:PACS_SERVER = if ($env:PACS_SERVER) { $env:PACS_SERVER } else { "localhost,1433" }
$env:PACS_DB = if ($env:PACS_DB) { $env:PACS_DB } else { "pacs_oltp" }
$env:PACS_USER = if ($env:PACS_USER) { $env:PACS_USER } else { "sa" }
$env:PACS_PW = if ($env:PACS_PW) { $env:PACS_PW } else { "P@ssw0rd123!" }

$OUT = "./_artifacts"
$DOCS = "./docs/diagrams"

function Show-Help {
    Write-Host "Benton County PACS - Documentation Automation" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available targets:" -ForegroundColor Yellow
    Write-Host "  help                   Show this help message" -ForegroundColor White
    Write-Host "  viz                    Render Mermaid diagrams to SVG" -ForegroundColor White
    Write-Host "  viz-png                Render Mermaid diagrams to PNG (high-res)" -ForegroundColor White
    Write-Host "  pacs-inventory         Generate live object counts from SQL Server" -ForegroundColor White
    Write-Host "  twin-verify-surface    Verify key database objects exist" -ForegroundColor White
    Write-Host "  twin-trigger-profile   Capture trigger inventory from pacs_oltp" -ForegroundColor White
    Write-Host "  sql-tests              Run tSQLt tests if framework is installed" -ForegroundColor White
    Write-Host "  data-dictionary        Export data dictionary (extended properties)" -ForegroundColor White
    Write-Host "  all-checks             Run all verification checks" -ForegroundColor White
    Write-Host "  validate-mermaid       Validate Mermaid syntax (dry-run)" -ForegroundColor White
    Write-Host "  clean                  Remove generated artifacts" -ForegroundColor White
    Write-Host ""
    Write-Host "Environment Variables:" -ForegroundColor Yellow
    Write-Host "  PACS_SERVER = $env:PACS_SERVER" -ForegroundColor Gray
    Write-Host "  PACS_DB     = $env:PACS_DB" -ForegroundColor Gray
    Write-Host "  PACS_USER   = $env:PACS_USER" -ForegroundColor Gray
}

function Invoke-Viz {
    Write-Host "🎨 Rendering Mermaid diagrams..." -ForegroundColor Cyan
    
    if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: Node.js/npx not found. Install from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path $OUT)) {
        New-Item -ItemType Directory -Path $OUT -Force | Out-Null
    }
    
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/erd.mmd" -o "$OUT/erd.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/crossdb.mmd" -o "$OUT/crossdb.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/wcf.mmd" -o "$OUT/wcf.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/recalc_flow.mmd" -o "$OUT/recalc_flow.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/trigger_cascade.mmd" -o "$OUT/trigger_cascade.svg"
    
    Write-Host "✅ Diagrams updated in $OUT/" -ForegroundColor Green
    Write-Host "   - erd.svg (Core Database ERD)" -ForegroundColor Gray
    Write-Host "   - crossdb.svg (Cross-Database Integration)" -ForegroundColor Gray
    Write-Host "   - wcf.svg (WCF Service Architecture)" -ForegroundColor Gray
    Write-Host "   - recalc_flow.svg (Property Recalculation Flow)" -ForegroundColor Gray
    Write-Host "   - trigger_cascade.svg (Trigger Cascade Analysis)" -ForegroundColor Gray
}

function Invoke-VizPng {
    Write-Host "🎨 Rendering Mermaid diagrams to PNG..." -ForegroundColor Cyan
    
    if (-not (Test-Path $OUT)) {
        New-Item -ItemType Directory -Path $OUT -Force | Out-Null
    }
    
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/erd.mmd" -o "$OUT/erd.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/crossdb.mmd" -o "$OUT/crossdb.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/wcf.mmd" -o "$OUT/wcf.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/recalc_flow.mmd" -o "$OUT/recalc_flow.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/trigger_cascade.mmd" -o "$OUT/trigger_cascade.png" -w 2400 -H 1800
    
    Write-Host "✅ PNG diagrams created in $OUT/" -ForegroundColor Green
}

function Invoke-PacsInventory {
    Write-Host "📊 Querying pacs_oltp database inventory..." -ForegroundColor Cyan
    
    if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: sqlcmd not found. Install SQL Server Command Line Tools." -ForegroundColor Red
        exit 1
    }
    
    & ./scripts/sql/pacs_inventory.ps1 -Server $env:PACS_SERVER -Database $env:PACS_DB -Username $env:PACS_USER -Password $env:PACS_PW -OutputPath "$OUT/pacs_inventory.json"
}

function Invoke-VerifySurface {
    Write-Host "🔍 Verifying database surface integrity..." -ForegroundColor Cyan
    
    sqlcmd -S $env:PACS_SERVER -U $env:PACS_USER -P $env:PACS_PW -d $env:PACS_DB -i ./scripts/sql/verify_surface.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Surface verification passed" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Surface verification failed" -ForegroundColor Red
        exit 1
    }
}

function Invoke-TriggerProfile {
    Write-Host "🔍 Profiling triggers on pacs_oltp..." -ForegroundColor Cyan
    
    if (-not (Test-Path $OUT)) {
        New-Item -ItemType Directory -Path $OUT -Force | Out-Null
    }
    
    $query = "SET NOCOUNT ON; SELECT DB_NAME() AS dbname, t.name AS trigger_name, OBJECT_NAME(t.parent_id) AS table_name FROM sys.triggers t WHERE t.parent_id <> 0 ORDER BY table_name, trigger_name;"
    
    sqlcmd -S $env:PACS_SERVER -U $env:PACS_USER -P $env:PACS_PW -d $env:PACS_DB -W -h-1 -s"|" -Q $query | Out-File -FilePath "$OUT/trigger_profile.txt" -Encoding UTF8
    
    Write-Host "✅ Trigger profile saved to $OUT/trigger_profile.txt" -ForegroundColor Green
    Write-Host ""
    Get-Content "$OUT/trigger_profile.txt" | Select-Object -First 20
}

function Invoke-SqlTests {
    Write-Host "🧪 Running tSQLt tests (if available)..." -ForegroundColor Cyan

    if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: sqlcmd not found. Install SQL Server Command Line Tools." -ForegroundColor Red
        exit 1
    }

    $check = "IF EXISTS (SELECT 1 FROM sys.objects WHERE name = 'RunAll' AND SCHEMA_NAME(schema_id) = 'tSQLt') SELECT 1 ELSE SELECT 0;"
    $hasTsqlt = sqlcmd -S $env:PACS_SERVER -U $env:PACS_USER -P $env:PACS_PW -d $env:PACS_DB -W -h-1 -Q $check | Select-Object -First 1

    if ($hasTsqlt -ne '1') {
        Write-Host "ℹ️  tSQLt not installed in '$($env:PACS_DB)'. Skipping tests." -ForegroundColor Yellow
        return
    }

    Write-Host "👟 Executing tSQLt.RunAll..." -ForegroundColor Gray
    sqlcmd -S $env:PACS_SERVER -U $env:PACS_USER -P $env:PACS_PW -d $env:PACS_DB -Q "EXEC tSQLt.RunAll;" 
}

function Invoke-DataDictionary {
    Write-Host "📚 Exporting data dictionary from extended properties..." -ForegroundColor Cyan
    & ./scripts/sql/export_data_dictionary.ps1 -Server $env:PACS_SERVER -Database $env:PACS_DB -Username $env:PACS_USER -Password $env:PACS_PW -OutputDir "$OUT/data_dictionary"
}

function Invoke-AllChecks {
    Invoke-PacsInventory
    Invoke-VerifySurface
    Invoke-TriggerProfile
    Invoke-SqlTests
    Write-Host ""
    Write-Host "✅ All checks complete. Artifacts in $OUT/" -ForegroundColor Green
}

function Invoke-ValidateMermaid {
    Write-Host "🔍 Validating Mermaid diagram syntax..." -ForegroundColor Cyan
    
    $files = @("erd.mmd", "crossdb.mmd", "wcf.mmd", "recalc_flow.mmd", "trigger_cascade.mmd")
    
    foreach ($file in $files) {
        try {
            npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/$file" -o "$env:TEMP/mermaid_test.svg" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $file OK" -ForegroundColor Green
            }
            else {
                Write-Host "❌ $file FAILED" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "❌ $file FAILED" -ForegroundColor Red
        }
    }
}

function Invoke-Clean {
    Write-Host "🧹 Cleaning generated artifacts..." -ForegroundColor Cyan
    
    if (Test-Path $OUT) {
        Remove-Item -Path $OUT -Recurse -Force
    }
    
    Write-Host "✅ Clean complete" -ForegroundColor Green
}

# Main execution
switch ($Target.ToLower()) {
    "help" { Show-Help }
    "viz" { Invoke-Viz }
    "viz-png" { Invoke-VizPng }
    "pacs-inventory" { Invoke-PacsInventory }
    "twin-verify-surface" { Invoke-VerifySurface }
    "twin-trigger-profile" { Invoke-TriggerProfile }
    "sql-tests" { Invoke-SqlTests }
    "data-dictionary" { Invoke-DataDictionary }
    "all-checks" { Invoke-AllChecks }
    "validate-mermaid" { Invoke-ValidateMermaid }
    "clean" { Invoke-Clean }
    default {
        Write-Host "❌ Unknown target: $Target" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}
