function Invoke-WithRetry {
    param (
        [scriptblock]$ScriptBlock,
        [int]$MaxAttempts = 3,
        [int]$DelaySeconds = 5,
        [string]$OperationName = "Operation"
    )
    
    $attempt = 1
    $success = $false
    $lastError = $null
    
    while (-not $success -and $attempt -le $MaxAttempts) {
        try {
            Write-Host "Attempt $attempt of $MaxAttempts for $OperationName..."
            & $ScriptBlock
            $success = $true
            Write-Host "✓ $OperationName completed successfully on attempt $attempt"
        }
        catch {
            $lastError = $_
            Write-Warning "✗ $OperationName failed on attempt $attempt: $_"
            
            if ($attempt -lt $MaxAttempts) {
                $delay = $DelaySeconds * [Math]::Pow(2, $attempt - 1)
                Write-Host "Waiting $delay seconds before retry..."
                Start-Sleep -Seconds $delay
            }
            
            $attempt++
        }
    }
    
    if (-not $success) {
        throw "Failed to complete $OperationName after $MaxAttempts attempts. Last error: $lastError"
    }
}

function Test-NetworkConnectivity {
    param (
        [string]$TargetHost = "github.com",
        [int]$Timeout = 5000
    )
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect($TargetHost, 443, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne($Timeout)
        
        if ($success) {
            $tcpClient.EndConnect($result)
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
    finally {
        if ($tcpClient) {
            $tcpClient.Close()
        }
    }
}

function Wait-ForNetwork {
    param (
        [int]$MaxAttempts = 5,
        [int]$DelaySeconds = 30
    )
    
    $attempt = 1
    while ($attempt -le $MaxAttempts) {
        if (Test-NetworkConnectivity) {
            Write-Host "Network connectivity restored"
            return $true
        }
        
        Write-Warning "No network connectivity. Attempt $attempt of $MaxAttempts"
        Start-Sleep -Seconds $DelaySeconds
        $attempt++
    }
    
    throw "Network connectivity not restored after $MaxAttempts attempts"
}

function Invoke-BuildWithRetry {
    param (
        [string]$BuildCommand = "npm run build",
        [int]$MaxAttempts = 3
    )
    
    $buildScript = {
        param($command)
        Invoke-Expression $command
    }
    
    Invoke-WithRetry -ScriptBlock { & $buildScript -command $BuildCommand } -MaxAttempts $MaxAttempts -OperationName "Build"
}

function Invoke-DownloadWithRetry {
    param (
        [string]$Url,
        [string]$OutputPath,
        [int]$MaxAttempts = 3
    )
    
    $downloadScript = {
        param($url, $path)
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($url, $path)
    }
    
    Invoke-WithRetry -ScriptBlock { & $downloadScript -url $Url -path $OutputPath } -MaxAttempts $MaxAttempts -OperationName "Download"
}

function Main {
    try {
        Write-Host "Testing network connectivity..."
        if (-not (Test-NetworkConnectivity)) {
            Write-Warning "No network connectivity. Waiting for connection..."
            Wait-ForNetwork
        }
        
        Write-Host "Starting build with retry mechanism..."
        Invoke-BuildWithRetry
        
        Write-Host "All operations completed successfully"
    }
    catch {
        Write-Error "Operation failed: $_"
        exit 1
    }
}

Main 