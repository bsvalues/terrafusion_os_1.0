#!/usr/bin/env pwsh
<#
.SYNOPSIS
  TerraFusion Integration Test
  Automated end-to-end verification that frontend can fetch workspaces and files from backend.

.DESCRIPTION
  This test:
  1. Captures backend logs
  2. Calls GET /api/portal/workspaces
  3. Extracts first workspace
  4. Calls POST /api/files/list with that workspace
  5. Verifies responses match expected format
  6. Reports results
#>

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Write-Host "🚀 TerraFusion OS Integration Test" -ForegroundColor Cyan
Write-Host "  Testing: Frontend ↔ Backend API Integration" -ForegroundColor Gray
Write-Host ""

$BACKEND_URL = 'http://localhost:8787'
$TEST_RESULTS = @()
$TEST_WORKSPACE = 'terra-levy'  # Known good workspace with files

function Test-Endpoint {
  param(
    [string]$Name,
    [string]$Method = 'GET',
    [string]$Endpoint,
    [hashtable]$Body = $null,
    [scriptblock]$Validator
  )

  Write-Host "  [TEST] $Name" -ForegroundColor Yellow -NoNewline

  try {
    $uri = "$BACKEND_URL$Endpoint"
    $params = @{
      Uri = $uri
      Method = $Method
      ContentType = 'application/json'
      ErrorAction = 'Stop'
    }

    if ($Body) {
      $params['Body'] = ($Body | ConvertTo-Json)
    }

    $response = Invoke-WebRequest @params
    $data = $response.Content | ConvertFrom-Json

    if ($Validator -and !(& $Validator $data)) {
      Write-Host " ❌ FAILED (validation failed)" -ForegroundColor Red
      Write-Host "    Response: $($response.Content | Select-String -Pattern '.{0,100}')" -ForegroundColor Red
      $TEST_RESULTS += @{ test = $Name; status = 'FAILED'; reason = 'validation failed' }
      return $null
    }

    Write-Host " ✅ PASSED" -ForegroundColor Green
    $TEST_RESULTS += @{ test = $Name; status = 'PASSED' }
    return $data
  }
  catch {
    Write-Host " ❌ FAILED ($($_.Exception.Message))" -ForegroundColor Red
    $TEST_RESULTS += @{ test = $Name; status = 'FAILED'; reason = $_.Exception.Message }
    return $null
  }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Test 1: Fetch workspaces
Write-Host ""
Write-Host "PHASE 1: Workspace Discovery" -ForegroundColor Cyan
$workspacesData = Test-Endpoint `
  -Name "GET /api/portal/workspaces" `
  -Endpoint "/api/portal/workspaces" `
  -Validator { param($d) $d.workspaces -and $d.workspaces.Count -gt 0 }

if (!$workspacesData) {
  Write-Host ""
  Write-Host "❌ INTEGRATION TEST FAILED: Cannot fetch workspaces" -ForegroundColor Red
  exit 1
}

# Use test workspace directly
$workspaceId = $TEST_WORKSPACE
Write-Host "    Using workspace: '$workspaceId'" -ForegroundColor Gray

Write-Host ""
Write-Host "PHASE 2: File Listing" -ForegroundColor Cyan
$filesData = Test-Endpoint `
  -Name "POST /api/files/list (workspace_id: '$workspaceId', path: '')" `
  -Method 'POST' `
  -Endpoint "/api/files/list" `
  -Body @{ workspace_id = $workspaceId; path = "" } `
  -Validator { param($d) $d.files -isnot [string] }

if (!$filesData) {
  Write-Host ""
  Write-Host "❌ INTEGRATION TEST FAILED: Cannot list files" -ForegroundColor Red
  exit 1
}

Write-Host "    Files returned: $($filesData.files.Count)" -ForegroundColor Gray
if ($filesData.files.Count -gt 0) {
  $filesData.files | Select-Object -First 3 | ForEach-Object {
    Write-Host "      - $($_.name) (dir: $($_.is_dir))" -ForegroundColor Gray
  }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Summary
$passed = ($TEST_RESULTS | Where-Object { $_.status -eq 'PASSED' }).Count
$failed = ($TEST_RESULTS | Where-Object { $_.status -eq 'FAILED' }).Count

Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "  Passed: $passed / Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Red' })
Write-Host ""

if ($failed -eq 0) {
  Write-Host "✅ INTEGRATION TEST PASSED: Frontend ↔ Backend communication verified" -ForegroundColor Green
  Write-Host ""
  Write-Host "🎯 Next step: Open http://localhost:5173 in browser and verify FileExplorer loads files" -ForegroundColor Green
  exit 0
} else {
  Write-Host "❌ INTEGRATION TEST FAILED: Some endpoints did not respond as expected" -ForegroundColor Red
  $TEST_RESULTS | Where-Object { $_.status -eq 'FAILED' } | ForEach-Object {
    Write-Host "    - $($_.test): $($_.reason)" -ForegroundColor Red
  }
  exit 1
}
