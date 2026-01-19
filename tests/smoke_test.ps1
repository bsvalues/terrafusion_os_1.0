$ProgressPreference = 'SilentlyContinue'

# Skip wait, assume strict hygiene made everything perfect
Write-Host "--- TEST 1: Invalid Workflow ID (Expect 404) ---"
$body1 = @{
    WorkflowId = "invalid-guid-123"
    CountyId = "benton"
    Parameters = @{}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/WorkflowAutomation/execute" -Method Post -Body $body1 -ContentType "application/json" -ErrorAction Stop
    Write-Host "UNEXPECTED SUCCESS (200 OK)"
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::NotFound) {
        Write-Host "SUCCESS: Got 404 NotFound as expected."
    } else {
        Write-Host "FAILURE: Got $($_.Exception.Response.StatusCode)"
        Write-Host $_.Exception.Message
    }
}

Write-Host "`n--- TEST 2: Valid AI Request (Expect 200) ---"
$body2 = @{
    CountyId = "benton"
    EmployeeRole = "assessor"
    Message = "Analyze property 123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/AIAssistant/message" -Method Post -Body $body2 -ContentType "application/json" -ErrorAction Stop
    Write-Host "SUCCESS: Got 200 OK."
    Write-Host "Confidence: $($response.confidence)"
    Write-Host "Status: $($response.status)"
} catch {
    Write-Host "FAILURE: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}