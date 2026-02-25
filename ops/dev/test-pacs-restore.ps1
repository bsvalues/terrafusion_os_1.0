<#
.SYNOPSIS
  PACS restore pipeline smoke tests.
.DESCRIPTION
  Asserts:
  1) Docker engine is reachable
  2) SQL Server container is running
  3) pacs_oltp database exists
  4) Trivial query returns data

  Usage:
    pwsh -NoProfile -File ops/dev/test-pacs-restore.ps1 -SaPassword 'YOUR_PASSWORD'
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$SaPassword,
  [string]$ContainerName = "tf-mssql"
)

$ErrorActionPreference = "Stop"
$failed = 0

function Fail([string]$msg) { Write-Error $msg; $script:failed++; return }
function Ok([string]$msg) { Write-Host "  PASS: $msg" }

Write-Host "Running PACS restore smoke tests..."
Write-Host ""

# 1) Docker reachable
try {
  $ver = docker version --format "{{.Server.Version}}" 2>&1
  if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
  Ok "Docker engine reachable ($ver)"
} catch { Fail "Docker engine not reachable. ($_)" }

# 2) Container exists and running
try {
  $state = docker inspect -f "{{.State.Status}}" $ContainerName 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Container '$ContainerName' not found." }
  if ($state.Trim() -ne "running") { throw "Container '$ContainerName' is not running (state=$($state.Trim()))." }
  Ok "SQL Server container '$ContainerName' is running"
} catch { Fail "$_" }

# 3) pacs_oltp exists
$sqlcmd = "/opt/mssql-tools18/bin/sqlcmd"
try {
  $checkDb = (docker exec $ContainerName $sqlcmd -S localhost -U sa -P $SaPassword -C -Q "SET NOCOUNT ON; SELECT name FROM sys.databases WHERE name = 'pacs_oltp';" 2>&1) | Out-String
  if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed: $checkDb" }
  if ($checkDb -notmatch "pacs_oltp") { throw "Database 'pacs_oltp' not found. Output: $checkDb" }
  Ok "pacs_oltp exists"
} catch { Fail "$_" }

# 4) trivial query
try {
  $ping = (docker exec $ContainerName $sqlcmd -S localhost -U sa -P $SaPassword -C -Q "SET NOCOUNT ON; SELECT 1 AS ok;" 2>&1) | Out-String
  if ($LASTEXITCODE -ne 0) { throw "SQL ping failed: $ping" }
  if ($ping -notmatch "1") { throw "SQL ping returned unexpected output: $ping" }
  Ok "SQL ping returned 1"
} catch { Fail "$_" }

Write-Host ""
if ($failed -eq 0) {
  Write-Host "ALL CHECKS PASSED"
  exit 0
} else {
  Write-Host "FAILED: $failed check(s)"
  exit 1
}
