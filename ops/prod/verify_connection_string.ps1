param(
    [string]$EnvFile = ".\secrets.prod.env"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    Write-Warning "Secrets file '$EnvFile' not found. Checking template..."
    $EnvFile = ".\secrets.prod.template.env"
    if (-not (Test-Path $EnvFile)) {
        Write-Error "Neither secrets.prod.env nor template found."
        exit 1
    }
}

Write-Host "🔍 Verifying connection string in: $EnvFile" -ForegroundColor Cyan

$content = Get-Content $EnvFile
$connStrLine = $content | Where-Object { $_ -match "^ConnectionStrings__DefaultConnection=" }

if (-not $connStrLine) {
    Write-Error "❌ ConnectionStrings__DefaultConnection not found!"
    exit 1
}

$connStr = $connStrLine -replace "^ConnectionStrings__DefaultConnection=", ""
Write-Host "   Found Connection String: $connStr" -ForegroundColor Gray

# Check 1: Host Networking
if ($connStr -notmatch "host.docker.internal") {
    Write-Error "❌ FAILED: Connection string must use 'Server=host.docker.internal' to allow container->host traffic."
    exit 1
}

# Check 2: Trust Server Certificate
if ($connStr -notmatch "TrustServerCertificate=True") {
    Write-Error "❌ FAILED: Connection string must include 'TrustServerCertificate=True' for internal MSSQL."
    exit 1
}

# Check 3: Placeholder Detection
if ($connStr -match "CHANGE_ME") {
    Write-Warning "⚠️  WARNING: Secrets file still contains 'CHANGE_ME'. Do no deploy until updated."
} else {
    Write-Host "✅ Secrets appear valid and ready for injection." -ForegroundColor Green
}

exit 0
