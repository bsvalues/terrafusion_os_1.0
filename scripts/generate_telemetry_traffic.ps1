Write-Host "🚀 Generating Traffic for Telemetry Verification..."

$ironUrl = "http://localhost:5000"
$cortexUrl = "http://localhost:8006"

# 1. Hit Iron (Backend)
Write-Host "📡 Pinging Iron (Backend)..."
for ($i=1; $i -le 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$ironUrl/api/test" -Method Get
        Write-Host "   ✅ Iron Request $i : Success"
    } catch {
        Write-Host "   ❌ Iron Request $i : Failed - $_"
    }
    Start-Sleep -Milliseconds 200
}

# 2. Hit Brain (Cortex)
Write-Host "🧠 Pinging Brain (Cortex)..."
for ($i=1; $i -le 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$cortexUrl/health" -Method Get
        Write-Host "   ✅ Brain Request $i : Success"
    } catch {
        Write-Host "   ❌ Brain Request $i : Failed - $_"
    }
    Start-Sleep -Milliseconds 200
}

Write-Host "✅ Traffic Generation Complete. Check Grafana/Jaeger."
