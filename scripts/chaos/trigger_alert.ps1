Write-Host "=== TerraFusion Chaos Generator (PowerShell) ==="
$ServerUrl = "http://localhost:5000"

Write-Host "[Chaos] Generating 50 requests to check latency..."
1..50 | ForEach-Object {
    Invoke-WebRequest -Uri "$ServerUrl/api/health" -Method Get -ErrorAction SilentlyContinue | Out-Null
}

Write-Host "[Chaos] Sending 20 malformed requests to trigger errors..."
1..20 | ForEach-Object {
    try {
        Invoke-WebRequest -Uri "$ServerUrl/api/auth/login" -Method Post -Body "{ 'broken_json': true, " -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
    } catch {}
}

Write-Host "[Chaos] To simulate 'IronBodyDown', we won't stop the container automatically to avoid disruption, but user can run: docker stop terrafusion-backend"
Write-Host "=== Chaos Injection Complete ==="
