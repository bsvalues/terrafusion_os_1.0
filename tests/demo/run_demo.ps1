Write-Host "=== PHASE 10: THE SHOW (AI Superiority Demo) ==="
$CortexUrl = "http://localhost:8006/api/chat"

function Ask-Cortex {
    param($Prompt)
    Write-Host "`n[USER]: $Prompt"
    try {
        $start = Get-Date
        $response = Invoke-RestMethod -Uri $CortexUrl -Method Post -Body (@{ prompt = $Prompt } | ConvertTo-Json) -ContentType "application/json"
        $duration = (Get-Date) - $start
        
        Write-Host "[AI] ($($duration.TotalMilliseconds)ms): $($response.response)" -ForegroundColor Cyan
        Write-Host "[TRACE]: $($response.trace_id)" -ForegroundColor DarkGray
    } catch {
        Write-Host "[ERROR]: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            Write-Host $reader.ReadToEnd()
        }
    }
}

# Prompt A (The Fact)
Ask-Cortex "Who owns Parcel 1-1897-200-0020-000 and what is its current Assessed Value?"

# Prompt B (The Reasoning)
Ask-Cortex "Analyze the improvement value ratio for this parcel. Is the land under-utilized?"

# Prompt C (The Law)
Ask-Cortex "Based on the Zoning Code, what is the maximum building height for this parcel?"

Write-Host "`n=== DEMO COMPLETE ==="
Write-Host "Verify traces at http://localhost:16686"
