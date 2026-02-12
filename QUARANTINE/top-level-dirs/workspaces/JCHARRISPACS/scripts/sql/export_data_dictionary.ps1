param(
    [Parameter(Mandatory = $true)] [string]$Server,
    [Parameter(Mandatory = $true)] [string]$Database,
    [Parameter(Mandatory = $true)] [string]$Username,
    [Parameter(Mandatory = $true)] [string]$Password,
    [Parameter(Mandatory = $false)] [string]$OutputDir = "./_artifacts/data_dictionary"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: sqlcmd not found. Install SQL Server Command Line Tools." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

$sqlPath = Join-Path $PSScriptRoot 'export_data_dictionary.sql'
$raw = sqlcmd -S $Server -d $Database -U $Username -P $Password -W -h-1 -s"|" -i $sqlPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: sqlcmd failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Write CSV
$csvPath = Join-Path $OutputDir "data_dictionary.csv"
"schema,table,column,data_type,max_length,is_nullable,is_computed,default,extended_property_name,extended_property_value" | Out-File -FilePath $csvPath -Encoding UTF8
foreach ($line in $raw) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line.Split('|')
    if ($parts.Count -lt 10) { continue }
    # Basic CSV escaping
    $escaped = $parts | ForEach-Object { '"' + ($_ -replace '"', '""') + '"' }
    ($escaped -join ",") | Out-File -FilePath $csvPath -Append -Encoding UTF8
}

# Highlights markdown (cryptic columns)
$mdPath = Join-Path $OutputDir "highlights.md"
$rows = @()
foreach ($line in $raw) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $p = $line.Split('|')
    $rows += [pscustomobject]@{
        Schema   = $p[0]
        Table    = $p[1]
        Column   = $p[2]
        DataType = $p[3]
        EPName   = $p[8]
        EPValue  = $p[9]
    }
}

$patterns = @('vit', 'year', 'recalc', 'flag')
$high = $rows | Where-Object {
    $name = ($_.Column + ' ' + $_.EPName + ' ' + $_.EPValue)
    $patterns | ForEach-Object { $name -match $_ } | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count
} | Select-Object Schema, Table, Column, DataType, EPName, EPValue -Unique

@(
    "# Data Dictionary Highlights",
    "",
    "Database: $Database",
    "Generated: $(Get-Date -Format o)",
    "",
    "Patterns: vit, year, recalc, flag",
    "",
    "| Schema | Table | Column | Data Type | EP Name | EP Value |",
    "|---|---|---|---|---|---|"
) | Out-File -FilePath $mdPath -Encoding UTF8

foreach ($r in $high) {
    "| $($r.Schema) | $($r.Table) | $($r.Column) | $($r.DataType) | $($r.EPName) | $($r.EPValue) |" | Out-File -FilePath $mdPath -Append -Encoding UTF8
}

Write-Host "✅ Data dictionary exported" -ForegroundColor Green
Write-Host "   CSV: $csvPath" -ForegroundColor Gray
Write-Host "   Highlights: $mdPath" -ForegroundColor Gray
