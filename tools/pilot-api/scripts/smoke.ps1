$ErrorActionPreference = 'Stop'

$BaseUrl = $env:PILOT_API_URL
if (-not $BaseUrl) { $BaseUrl = 'http://localhost:3333' }
$ApiBase = "$BaseUrl/api"

$headersAll = @{
  'x-user-id'     = 'smoke-user'
  'x-county-id'   = 'benton'
  'x-role'        = 'analyst'
  'x-permissions' = 'parcel:read,valuation:commit,parcel:write'
}

function Assert-Status {
  param(
    [int]$Expected,
    [string]$Method,
    [string]$Url,
    $Body,
    [hashtable]$Headers
  )

  $params = @{
    Method = $Method
    Uri = $Url
    Headers = $Headers
    SkipHttpErrorCheck = $true
  }

  if ($Body) {
    $params['Body'] = ($Body | ConvertTo-Json -Depth 6)
    $params['ContentType'] = 'application/json'
  }

  $resp = Invoke-WebRequest @params

  if ($resp.StatusCode -ne $Expected) {
    Write-Host "❌ Expected $Expected, got $($resp.StatusCode) for $Method $Url"
    Write-Host "Response:" $resp.Content
    exit 1
  }
}

Write-Host "▶️  listTools"
Assert-Status -Expected 200 -Method GET -Url "$ApiBase/tools" -Headers $headersAll

Write-Host "▶️  read tool success"
Assert-Status -Expected 200 -Method POST -Url "$ApiBase/tools/execute" -Headers $headersAll -Body @{
  toolName = 'atlas.parcel.read'
  input = @{ parcelId = 'P-001' }
}

Write-Host "▶️  permission denied"
$headersNoPerm = $headersAll.Clone()
$headersNoPerm['x-permissions'] = ''
Assert-Status -Expected 403 -Method POST -Url "$ApiBase/tools/execute" -Headers $headersNoPerm -Body @{
  toolName = 'atlas.parcel.read'
  input = @{ parcelId = 'P-001' }
}

Write-Host "▶️  risk gate (no token)"
$headersRisk = $headersAll.Clone()
$headersRisk['x-permissions'] = 'valuation:commit'
Assert-Status -Expected 409 -Method POST -Url "$ApiBase/tools/execute" -Headers $headersRisk -Body @{
  toolName = 'forge.valuation.commit'
  input = @{ parcelId = 'P-001'; value = 123 }
}

Write-Host "▶️  lane violation"
$headersLane = $headersAll.Clone()
$headersLane['x-permissions'] = 'parcel:write'
Assert-Status -Expected 409 -Method POST -Url "$ApiBase/tools/execute" -Headers $headersLane -Body @{
  toolName = 'atlas.parcel.badwrite'
  input = @{ parcelId = 'P-001'; _confirmationToken = 'OK' }
}

Write-Host "✅ Smoke passed"
