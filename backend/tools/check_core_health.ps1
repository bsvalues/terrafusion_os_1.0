param(
    [string]$ApiUrl = "http://localhost:5000",
    [string]$ConsciousnessUrl = "http://localhost:3004"
)

function Test-Endpoint($name, $url) {
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        Write-Host ("✅ {0} {1} -> {2}" -f $name, $url, $resp.StatusCode)
        if ($resp.Content) { $resp.Content | Write-Output }
    }
    catch {
        Write-Host ("❌ {0} {1} -> FAILED: {2}" -f $name, $url, $_.Exception.Message)
    }
}

Write-Host "--- TerraFusion Core Health ---"
Test-Endpoint "API" "$ApiUrl/health"
Test-Endpoint "Consciousness" "$ConsciousnessUrl/health/status"
