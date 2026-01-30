Write-Host "Killing dotnet..."
Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue

Write-Host "Starting server..."
$p = Start-Process "dotnet" -ArgumentList "run --project backend/src/TerraFusion.API/TerraFusion.API.csproj --urls http://localhost:5005" -RedirectStandardOutput "server.log" -RedirectStandardError "server.err" -PassThru

Write-Host "Waiting for server startup..."
$timeout = 60
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$started = $false

while ($sw.Elapsed.TotalSeconds -lt $timeout) {
    if (Test-NetConnection -ComputerName "127.0.0.1" -Port 5005 -InformationLevel Quiet) {
        $started = $true
        break
    }
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
}
Write-Host ""

if (-not $started) {
    Write-Host "Server failed to start in $timeout seconds."
    if (Test-Path "server.log") { Get-Content "server.log" -Tail 20 }
    if (Test-Path "server.err") { Get-Content "server.err" }
    Stop-Process -Id $p.Id -Force
    exit 1
}

Write-Host "Server started on 5005! Running tests..."
# Run smoke test content inline
$ProgressPreference = 'SilentlyContinue'

Write-Host "--- TEST 1: Invalid Workflow ID (Expect 404) ---"
$body1 = @{ WorkflowId = "invalid-guid"; CountyId = "benton"; Parameters = @{} } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:5005/api/WorkflowAutomation/execute" -Method Post -Body $body1 -ContentType "application/json"
    Write-Host "FAILURE: Expected 404, got 200"
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::NotFound) {
        Write-Host "SUCCESS: Got 404."
    } else {
        Write-Host "FAILURE: Got $($_.Exception.Response.StatusCode)"
    }
}

Write-Host "--- TEST 2: Valid AI Request (Expect 200) ---"
$body2 = @{ CountyId = "benton"; EmployeeRole = "assessor"; Message = "Analyze" } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri "http://localhost:5005/api/AIAssistant/message" -Method Post -Body $body2 -ContentType "application/json"
    Write-Host "SUCCESS: Got 200. Confidence: $($r.confidence)"
} catch {
    Write-Host "FAILURE: $($_.Exception.Message)"
}

Write-Host "Stopping server..."
Stop-Process -Id $p.Id -Force
