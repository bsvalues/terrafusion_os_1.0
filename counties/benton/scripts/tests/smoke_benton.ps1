param(
    [string]$BaseUrl = "http://localhost:5000"
)

Write-Host "🔎 Smoke test against $BaseUrl"

function Test-Endpoint($path) {
    try {
        $url = "$BaseUrl$path"
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            Write-Host "✅ $path -> $($resp.StatusCode)"
            return $true
        }
        else {
            Write-Host "❌ $path -> $($resp.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Host "❌ $path -> $($_.Exception.Message)"
        return $false
    }
}

$ok = $true
$ok = (Test-Endpoint "/health") -and $ok
$ok = (Test-Endpoint "/api/test") -and $ok

if (-not $ok) {
    Write-Error "Smoke test failed"
    exit 1
}

Write-Host "🎉 Smoke test passed"
exit 0
