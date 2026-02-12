Write-Host "Igniting TerraFusion Generation 2..."

Write-Host "Checking PostgreSQL..."
# Placeholder for DB start

Write-Host "Starting OS Kernel API (Port 5000)..."
if (Test-Path "os-kernel/api/deno.json") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd os-kernel/api; deno task dev"
}
else {
    Write-Host "Warning: os-kernel/api/deno.json not found. Skipping API start."
}

Write-Host "Starting Frontend (TerraDossier)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd applications\terra-dossier; .\clean-restart.ps1"

Write-Host "Opening Browser..."
Start-Sleep -Seconds 5
Start-Process "http://localhost:3007"
