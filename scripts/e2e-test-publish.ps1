# TerraFusion OS - End-to-End Plugin Publishing Test

$ErrorActionPreference = 'Stop'

# --- Configuration ---
$ApiBaseUrl = "http://localhost:5000" # Adjust if your API runs on a different port
$PluginSourceDir = "..\test-plugin"
$PluginDistDir = "..\dist"
$KeysDir = "..\keys"

# --- Step 1: Submit the plugin to create a pending record ---
Write-Host "🔬 Step 1: Submitting plugin to create pending record..." -ForegroundColor Yellow

$manifestPath = Join-Path $PSScriptRoot $PluginSourceDir "plugin.json"
if (-not (Test-Path $manifestPath)) {
    throw "Manifest file not found at $manifestPath"
}
$manifestContent = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json

$submissionBody = @{
    Name = $manifestContent.name
    Version = $manifestContent.version
    Description = $manifestContent.description
    Category = "Testing"
    AuthorId = "e2e-test-suite"
    ManifestJson = $manifestContent | ConvertTo-Json -Depth 5
    PackageData = "" # Not needed for submission, only for publish
} | ConvertTo-Json

$submitUrl = "$ApiBaseUrl/api/marketplace/submit"

try {
    $submitResponse = Invoke-RestMethod -Uri $submitUrl -Method Post -Body $submissionBody -ContentType "application/json"
    Write-Host "✅ Plugin submitted successfully. Message: $($submitResponse.message)" -ForegroundColor Green
    # A real implementation would parse a proper JSON response to get the ID.
    # For this test, we'll need to fetch the ID from the database manually or assume it.
    # To make this script runnable, we'll query the service for the plugin we just added.
} catch {
    Write-Host "❌ FAILED to submit plugin. Response:" -ForegroundColor Red
    Write-Host $_.Exception.Response.GetResponseStream() | StreamReader | ForEach-Object { Write-Host $_ }
    throw
}

# --- Step 2: Fetch the Plugin ID (Simulating what a real client would do) ---
Write-Host "🔬 Step 2: Fetching the new Plugin ID..." -ForegroundColor Yellow
$getPluginsUrl = "$ApiBaseUrl/api/marketplace/plugins?status=Pending"
$pendingPlugins = Invoke-RestMethod -Uri $getPluginsUrl -Method Get
$plugin = $pendingPlugins | Where-Object { $_.name -eq $manifestContent.name -and $_.version -eq $manifestContent.version } | Select-Object -First 1

if (-not $plugin) {
    throw "Could not find the submitted plugin in Pending status."
}
$pluginId = $plugin.id
Write-Host "✅ Found Plugin ID: $pluginId" -ForegroundColor Green

# --- Step 3: Publish the signed plugin package ---
Write-Host "🔬 Step 3: Publishing the signed package to test signature verification..." -ForegroundColor Yellow

$packageFileName = "$($manifestContent.id)-$($manifestContent.version).tfplugin"
$packagePath = Join-Path $PSScriptRoot $PluginDistDir $packageFileName
$signaturePath = "$packagePath.sig"
$publicKeyPath = Join-Path $PSScriptRoot $KeysDir "public_key.pem"

# Read files
$packageBytes = [System.IO.File]::ReadAllBytes($packagePath)
$packageB64 = [System.Convert]::ToBase64String($packageBytes)
$signatureHex = Get-Content -Raw -Path $signaturePath
$publicKeyPem = Get-Content -Raw -Path $publicKeyPath

$publishBody = @{
    PluginId = $pluginId
    Version = $manifestContent.version
    PackageB64 = $packageB64
    Signature = $signatureHex
    PublicKeyPem = $publicKeyPem
} | ConvertTo-Json -Depth 5

$publishUrl = "$ApiBaseUrl/api/marketplace/publish"

try {
    $publishResponse = Invoke-RestMethod -Uri $publishUrl -Method Post -Body $publishBody -ContentType "application/json"
    Write-Host "✅✅✅ SUCCESS! Plugin published successfully! Message: $($publishResponse.message)" -ForegroundColor Green
    Write-Host "The end-to-end PEM signature verification flow is working correctly." -ForegroundColor Cyan
} catch {
    Write-Host "❌❌❌ FAILED to publish plugin. Signature verification likely failed. Response:" -ForegroundColor Red
    Write-Host $_.Exception.Response.GetResponseStream() | StreamReader | ForEach-Object { Write-Host $_ }
    throw
}
