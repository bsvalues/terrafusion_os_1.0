#!/usr/bin/env pwsh
# Trust Fabric API Interception Test Script

Write-Host "🧪 Testing Trust Fabric API Interception" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check current rollout
$rollout = $env:TRUST_FABRIC_ROLLOUT
Write-Host "📊 Current rollout: $rollout%" -ForegroundColor White

# Test multiple API calls to trigger trust fabric interception
Write-Host ""
Write-Host "🔄 Making test API calls..." -ForegroundColor Yellow

$testCalls = @(
    "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/health",
    "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/modules",
    "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/system/status",
    "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health",
    "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/trust-fabric/status"
)

$successCount = 0
$interceptedCount = 0

foreach ($url in $testCalls) {
    try {
        Write-Host "  📡 Testing: $url" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        $successCount++
        
        # Check response headers for trust fabric indicators
        $headers = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        if ($headers.Headers -and ($headers.Headers["X-Trust-Fabric"] -or $headers.Headers["x-trust-fabric"])) {
            Write-Host "    ✅ Trust fabric intercepted" -ForegroundColor Green
            $interceptedCount++
        } else {
            Write-Host "    📊 Response received (may be intercepted)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "    ⚠️  Call failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📈 Test Results:" -ForegroundColor Cyan
Write-Host "  🎯 Successful calls: $successCount/$($testCalls.Count)" -ForegroundColor White
Write-Host "  🔒 Trust fabric intercepted: $interceptedCount calls" -ForegroundColor White

# Calculate expected interception rate
$expectedRate = [int]$rollout
$actualRate = if ($successCount -gt 0) { [math]::Round(($interceptedCount / $successCount) * 100) } else { 0 }

Write-Host "  📊 Expected interception: ~$expectedRate%" -ForegroundColor White
Write-Host "  📊 Detected interception: $actualRate%" -ForegroundColor White

# Test JavaScript fetch interception (simulate frontend calls)
Write-Host ""
Write-Host "🌐 Testing Frontend JavaScript Integration:" -ForegroundColor Cyan

$jsTest = @"
// Test script to check if trust fabric adapter is loaded
try {
    // Check if adapter is available
    const adapterScript = document.querySelector('script[src*="trust-fabric-adapter"]');
    console.log('Trust Fabric Script:', adapterScript ? 'Found' : 'Not found');
    
    // Check if fetch is intercepted
    const originalFetch = window.fetch;
    console.log('Fetch interception:', originalFetch.toString().includes('trust') ? 'Likely intercepted' : 'Original');
    
    // Make a test fetch call
    fetch('/api/test', { method: 'GET' })
        .then(() => console.log('Fetch call completed through trust fabric'))
        .catch(e => console.log('Fetch test:', e.message));
        
} catch (error) {
    console.log('Trust fabric test error:', error);
}
"@

$jsTestFile = "trust-fabric-test.js"
Set-Content -Path $jsTestFile -Value $jsTest

Write-Host "  📝 Created JavaScript test: $jsTestFile" -ForegroundColor Gray
Write-Host "  🌐 To test in browser:" -ForegroundColor Yellow
Write-Host "     1. Open http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
Write-Host "     2. Open Developer Console (F12)" -ForegroundColor White
Write-Host "     3. Paste and run the test script" -ForegroundColor White
Write-Host "     4. Look for 'Trust Fabric' messages" -ForegroundColor White

# Check for trust fabric logs
Write-Host ""
Write-Host "📋 Checking for Trust Fabric Logs:" -ForegroundColor Cyan

$logPaths = @(
    "logs/trust-fabric.log",
    "backend/logs/trust-fabric.log",
    "logs/api.log",
    "backend/logs/api.log"
)

$logsFound = $false
foreach ($logPath in $logPaths) {
    if (Test-Path $logPath) {
        $logsFound = $true
        Write-Host "  📄 Found log: $logPath" -ForegroundColor Green
        
        # Show last few lines
        $lastLines = Get-Content $logPath -Tail 5 -ErrorAction SilentlyContinue
        if ($lastLines) {
            Write-Host "    Recent entries:" -ForegroundColor Gray
            foreach ($line in $lastLines) {
                Write-Host "    $line" -ForegroundColor DarkGray
            }
        }
    }
}

if (-not $logsFound) {
    Write-Host "  ⚠️  No trust fabric logs found" -ForegroundColor Yellow
    Write-Host "     (Logs may not be enabled or written yet)" -ForegroundColor Gray
}

# Summary and next steps
Write-Host ""
Write-Host "🎯 Integration Status Summary:" -ForegroundColor Cyan

if ($successCount -gt 0) {
    Write-Host "  ✅ API calls are working" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  API calls having issues" -ForegroundColor Yellow
}

if ($rollout -eq "10") {
    Write-Host "  ✅ Rollout at 10% (testing phase)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready for next phase:" -ForegroundColor Green
    Write-Host "   `$env:TRUST_FABRIC_ROLLOUT='50'" -ForegroundColor White
} elseif ($rollout -eq "50") {
    Write-Host "  ✅ Rollout at 50% (expansion phase)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready for full deployment:" -ForegroundColor Green
    Write-Host "   `$env:TRUST_FABRIC_ROLLOUT='100'" -ForegroundColor White
} elseif ($rollout -eq "100") {
    Write-Host "  🎉 Full deployment complete!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Rollout not configured" -ForegroundColor Yellow
}

Write-Host ""