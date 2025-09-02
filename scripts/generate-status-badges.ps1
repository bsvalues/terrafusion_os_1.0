# TerraFusion OS - Generate Status Badges from API Health Summary
param(
  [string]$SummaryPath = (Join-Path (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) 'artifacts') 'api-health\api-health-summary.json'),
  [string]$BadgesDir = (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) 'badges')
)

$ErrorActionPreference = 'Stop'

function New-BadgeSvg {
  param(
    [Parameter(Mandatory=$true)][string]$Label,
    [Parameter(Mandatory=$true)][string]$Status,
    [Parameter(Mandatory=$true)][string]$Color,
    [Parameter(Mandatory=$true)][string]$OutPath
  )
  $labelEsc = [System.Security.SecurityElement]::Escape($Label)
  $statusEsc = [System.Security.SecurityElement]::Escape($Status)
  $template = @'
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" role="img" aria-label="__LABEL__: __STATUS__">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-opacity=".1"/>
    <stop offset=".9" stop-opacity=".3"/>
    <stop offset="1" stop-opacity=".5"/>
  </linearGradient>
  <mask id="a">
    <rect width="150" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <rect width="85" height="20" fill="#555"/>
    <rect x="85" width="65" height="20" fill="__COLOR__"/>
    <rect width="150" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">
    <text x="42.5" y="14">__LABEL__</text>
    <text x="116.5" y="14">__STATUS__</text>
  </g>
</svg>
'@
  $svg = $template -replace '__LABEL__', [Regex]::Escape($labelEsc).Replace('\','\\')
  $svg = $svg -replace '__STATUS__', [Regex]::Escape($statusEsc).Replace('\\','\\\\')
  $svg = $svg -replace '__COLOR__', [Regex]::Escape($Color)
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutPath) | Out-Null
  Set-Content -Encoding UTF8 -Path $OutPath -Value $svg
}

function Get-ColorFor {
  param([bool]$Ok)
  if ($Ok) { return '#4c1' } # green
  else { return '#e05d44' }  # red
}

function Get-StatusText {
  param([bool]$Ok)
  if ($Ok) { return 'OK' } else { return 'FAIL' }
}

# Default badges if summary missing
if (-not (Test-Path $SummaryPath)) {
  Write-Host "Summary not found at $SummaryPath. Emitting UNKNOWN badges."
  New-BadgeSvg -Label 'API' -Status 'UNKNOWN' -Color '#9f9f9f' -OutPath (Join-Path $BadgesDir 'api-status.svg')
  New-BadgeSvg -Label 'AI Swarm' -Status 'UNKNOWN' -Color '#9f9f9f' -OutPath (Join-Path $BadgesDir 'ai-swarm-status.svg')
  New-BadgeSvg -Label 'Database' -Status 'UNKNOWN' -Color '#9f9f9f' -OutPath (Join-Path $BadgesDir 'database-status.svg')
  exit 0
}

# Load summary
$summary = Get-Content -Raw -Path $SummaryPath | ConvertFrom-Json
$results = @{}
foreach ($r in $summary.results) {
  $results[$r.check] = $r
}

# Derive component states
function Test-Ok {
  param($item)
  if ($null -ne $item -and $item.ok -eq $true) { return $true } else { return $false }
}

$apiOk = (Test-Ok $results['modules']) -and (Test-Ok $results['modules_active'])
$swarmOk = (Test-Ok $results['swarm_status'])
$dbOk = (Test-Ok $results['database_status'])

# Emit badges
New-BadgeSvg -Label 'API' -Status (Get-StatusText $apiOk) -Color (Get-ColorFor $apiOk) -OutPath (Join-Path $BadgesDir 'api-status.svg')
New-BadgeSvg -Label 'AI Swarm' -Status (Get-StatusText $swarmOk) -Color (Get-ColorFor $swarmOk) -OutPath (Join-Path $BadgesDir 'ai-swarm-status.svg')
New-BadgeSvg -Label 'Database' -Status (Get-StatusText $dbOk) -Color (Get-ColorFor $dbOk) -OutPath (Join-Path $BadgesDir 'database-status.svg')

Write-Host "Badges written to $BadgesDir"
