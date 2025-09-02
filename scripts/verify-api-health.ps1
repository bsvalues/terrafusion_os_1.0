# TerraFusion OS - API Health Verification (PowerShell)
# Hits key backend endpoints and writes artifacts with results
param(
  [int]$Port = 5050,
  [string]$ApiHost = 'localhost'
)

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$ArtifactsDir = Join-Path $RepoRoot 'artifacts'
$OutDir = Join-Path $ArtifactsDir 'api-health'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function New-Stopwatch() { New-Object System.Diagnostics.Stopwatch }

function Save-Json {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)]$Object
  )
  try {
    $json = $Object | ConvertTo-Json -Depth 8
    Set-Content -Encoding UTF8 -Path $Path -Value $json
  } catch {
    # fall back to raw output
    Set-Content -Encoding UTF8 -Path $Path -Value ($Object | Out-String)
  }
}

$base = "http://${ApiHost}:${Port}/api"
$checks = @(
  @{ name = 'modules'; method = 'GET'; path = 'modules' },
  @{ name = 'modules_active'; method = 'GET'; path = 'modules/active' },
  @{ name = 'swarm_status'; method = 'GET'; path = 'swarm/status' },
  @{ name = 'database_status'; method = 'GET'; path = 'database/status' }
)

$results = @()

Write-Host "🔎 Verifying API health at $base"

foreach ($c in $checks) {
  $url = "$base/" + $c.path
  $sw = New-Stopwatch; $sw.Start()
  $ok = $false
  $status = 0
  $data = $null
  $errorMsg = $null
  try {
    $resp = Invoke-RestMethod -Uri $url -Method $c.method -TimeoutSec 10
    $sw.Stop()
    $ok = $true
    $status = 200
    $data = $resp
  } catch {
    $sw.Stop()
    $ok = $false
    $status = if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { [int]$_.Exception.Response.StatusCode } else { 0 }
    $errorMsg = $_.Exception.Message
  }
  $ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 1)
  $outPath = Join-Path $OutDir ("{0}.json" -f $c.name)
  if ($ok) { Save-Json -Path $outPath -Object $data }
  else { Set-Content -Encoding UTF8 -Path $outPath -Value ("ERROR: {0}" -f $errorMsg) }

  $results += [pscustomobject]@{
    check     = $c.name
    url       = $url
    ok        = $ok
    status    = $status
    ms        = $ms
    timestamp = (Get-Date).ToString('s')
    error     = $errorMsg
  }
}

# Summary artifact
$summary = [pscustomobject]@{
  baseUrl   = $base
  generated = (Get-Date).ToString('s')
  results   = $results
  allOk     = ($results | Where-Object { -not $_.ok }).Count -eq 0
}
Save-Json -Path (Join-Path $OutDir 'api-health-summary.json') -Object $summary

# Console table
$results | Select-Object check,status,ms,ok | Format-Table | Out-String | Write-Host

if (-not $summary.allOk) {
  Write-Host "❌ Some checks failed. See artifacts in $OutDir"
  exit 1
}

Write-Host "✅ All checks passed. See artifacts in $OutDir"
