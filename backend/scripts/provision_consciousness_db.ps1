<#
.SYNOPSIS
  Provisions the TerraFusion Consciousness PostgreSQL database and user.

.DESCRIPTION
  Creates the database 'terrafusion_consciousness' and login role 'terrafusion' with the
  password expected by appsettings, grants ownership/privileges, and verifies connectivity.

.PARAMETER PostgresBin
  Path to PostgreSQL bin directory containing psql.exe. If omitted, common locations are tried.

.PARAMETER SuperUser
  PostgreSQL superuser to connect as (default: postgres).

.PARAMETER Host
  PostgreSQL host (default: localhost).

.PARAMETER Port
  PostgreSQL port (default: 5432).

.PARAMETER Db
  Database name to create/ensure (default: terrafusion_consciousness).

.PARAMETER AppUser
  Application login/role to create/ensure (default: terrafusion).

.PARAMETER AppPassword
  Password to set for AppUser (default matches appsettings: terrafusion_consciousness_secure_2025).

.EXAMPLE
  # Interactive superuser password prompt; auto-detects psql location
  ./provision_consciousness_db.ps1

.EXAMPLE
  # Explicit psql path
  ./provision_consciousness_db.ps1 -PostgresBin "C:\Program Files\PostgreSQL\17\bin"

#>
[CmdletBinding()] param(
    [string]$PostgresBin,
    [string]$SuperUser = "postgres",
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [string]$Db = "terrafusion_consciousness",
    [string]$AppUser = "terrafusion",
    [string]$AppPassword = "terrafusion_consciousness_secure_2025"
)

function Find-Psql {
    param([string]$Hint)
    if ($Hint -and (Test-Path (Join-Path $Hint 'psql.exe'))) { return (Join-Path $Hint 'psql.exe') }

    $candidates = @(
        "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
        "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
        "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }

    $fromPath = (Get-Command psql.exe -ErrorAction SilentlyContinue)?.Source
    if ($fromPath) { return $fromPath }
    return $null
}

$psql = Find-Psql -Hint $PostgresBin
if (-not $psql) {
    Write-Error "psql.exe not found. Specify -PostgresBin or add psql to PATH."
    exit 1
}

Write-Host "Using psql: $psql" -ForegroundColor Cyan

# Prompt for superuser password securely and emit PGPASSWORD for psql
if (-not $env:PGPASSWORD) {
    $sec = Read-Host -AsSecureString -Prompt "Enter password for superuser '$SuperUser'"
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $env:PGPASSWORD = $plain
}

function Invoke-Psql {
    param([string]$Database = "postgres", [string]$Command)
    & $psql -h $Host -p $Port -U $SuperUser -d $Database -v "ON_ERROR_STOP=1" -c $Command
    if ($LASTEXITCODE -ne 0) { throw "psql command failed: $Command" }
}

try {
    Write-Host "Ensuring role '$AppUser' exists..." -ForegroundColor Yellow
    $roleSql = @"
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$AppUser') THEN
    CREATE ROLE $AppUser LOGIN PASSWORD '$AppPassword';
  ELSE
    ALTER ROLE $AppUser LOGIN PASSWORD '$AppPassword';
  END IF;
END
$$;
"@
    Invoke-Psql -Database "postgres" -Command $roleSql

    Write-Host "Ensuring database '$Db' exists (owner: $AppUser)..." -ForegroundColor Yellow
    $exists = & $psql -h $Host -p $Port -U $SuperUser -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname='$Db'" | Select-String -Pattern '^1$' -Quiet
    if (-not $exists) {
        Invoke-Psql -Database "postgres" -Command "CREATE DATABASE \"$Db\" OWNER \"$AppUser\";"
    }
    else {
        Invoke-Psql -Database "postgres" -Command "ALTER DATABASE \"$Db\" OWNER TO \"$AppUser\";"
    }

    Write-Host "Granting privileges on '$Db'..." -ForegroundColor Yellow
    Invoke-Psql -Database $Db -Command "GRANT ALL PRIVILEGES ON DATABASE \"$Db\" TO \"$AppUser\";"
    Invoke-Psql -Database $Db -Command "GRANT ALL ON SCHEMA public TO \"$AppUser\";"

    Write-Host "Verifying connectivity with app credentials..." -ForegroundColor Yellow
    # Try a basic connection using the app user (without exposing app password)
    & $psql -h $Host -p $Port -U $AppUser -d $Db -c "SELECT current_user, current_database();"
    if ($LASTEXITCODE -ne 0) { throw "Verification failed for app user '$AppUser'" }

    Write-Host "✅ Provisioning complete. Update not needed in appsettings.json (defaults already match)." -ForegroundColor Green
}
catch {
    Write-Error $_
    exit 1
}
finally {
    # Clear superuser password from env
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue | Out-Null
}
