$ErrorActionPreference = "Stop"

function Test-ModelRequirements {
    Write-Host "Checking model requirements..."
    
    $requiredSpace = 10GB
    $availableSpace = (Get-PSDrive C).Free
    
    if ($availableSpace -lt $requiredSpace) {
        Write-Host "❌ Insufficient disk space. Required: $requiredSpace, Available: $availableSpace"
        return $false
    }
    
    return $true
}

function Initialize-ModelDirectory {
    Write-Host "Initializing model directory..."
    
    $modelDir = "models"
    if (-not (Test-Path $modelDir)) {
        New-Item -ItemType Directory -Path $modelDir -Force | Out-Null
    }
    
    $subdirs = @(
        "gpt4all",
        "mistral",
        "llama"
    )
    
    foreach ($dir in $subdirs) {
        $path = Join-Path $modelDir $dir
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }
    }
}

function Get-Models {
    Write-Host "Downloading models..."
    
    $models = @{
        "gpt4all" = @{
            "url" = "https://gpt4all.io/models/ggml-gpt4all-j-v1.3-groovy.bin"
            "path" = "models/gpt4all/gpt4all.bin"
        }
        "mistral" = @{
            "url" = "https://huggingface.co/mistralai/Mistral-7B-v1.0/resolve/main/consolidated.00.pth"
            "path" = "models/mistral/mistral.bin"
        }
    }
    
    $modelMetrics = @()
    foreach ($model in $models.GetEnumerator()) {
        $url = $model.Value.url
        $path = $model.Value.path
        
        if (-not (Test-Path $path)) {
            Write-Host "Downloading $($model.Key)..."
            try {
                $startTime = Get-Date
                Invoke-WebRequest -Uri $url -OutFile $path
                $downloadTime = ((Get-Date) - $startTime).TotalSeconds
                $fileSize = (Get-Item $path).Length
                
                $modelMetrics += @{
                    Name = $model.Key
                    Status = "Success"
                    Size = $fileSize
                    DownloadTime = $downloadTime
                    VerificationTime = 0
                }
                
                Write-Host "✅ Downloaded $($model.Key) in $downloadTime seconds"
            }
            catch {
                $modelMetrics += @{
                    Name = $model.Key
                    Status = "Error"
                    Size = 0
                    DownloadTime = 0
                    VerificationTime = 0
                }
                Write-Host "❌ Failed to download $($model.Key): $_"
                throw
            }
        }
        else {
            $fileSize = (Get-Item $path).Length
            $modelMetrics += @{
                Name = $model.Key
                Status = "Success"
                Size = $fileSize
                DownloadTime = 0
                VerificationTime = 0
            }
            Write-Host "✅ $($model.Key) already exists"
        }
    }
    
    return $modelMetrics
}

function Test-ModelIntegrity {
    param (
        [array]$ModelMetrics
    )
    
    Write-Host "Verifying models..."
    
    $models = @(
        "models/gpt4all/gpt4all.bin",
        "models/mistral/mistral.bin"
    )
    
    foreach ($model in $models) {
        if (Test-Path $model) {
            $startTime = Get-Date
            
            # Check file integrity
            $fileInfo = Get-Item $model
            if ($fileInfo.Length -eq 0) {
                throw "Model file is empty: $model"
            }
            
            # Verify file permissions
            $acl = Get-Acl $model
            if (-not $acl.Access.FileSystemRights -match "Read") {
                throw "Insufficient permissions for model: $model"
            }
            
            # Calculate hash
            $hash = Get-FileHash -Path $model -Algorithm SHA256
            $verificationTime = ((Get-Date) - $startTime).TotalSeconds
            
            $modelName = Split-Path $model -Leaf
            $modelMetrics | Where-Object { $_.Name -eq $modelName } | ForEach-Object {
                $_.VerificationTime = $verificationTime
                $_.Hash = $hash.Hash
                $_.LastVerified = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            }
            
            Write-Host "✅ Verified $model (SHA256: $($hash.Hash)) in $verificationTime seconds"
        }
        else {
            Write-Host "❌ Model not found: $model"
            throw "Model verification failed"
        }
    }
    
    return $modelMetrics
}

function Update-Dashboard {
    param (
        [array]$ModelMetrics
    )
    
    Write-Host "Updating build dashboard..."
    
    $dashboardDir = "build-dashboard"
    if (-not (Test-Path $dashboardDir)) {
        New-Item -ItemType Directory -Path $dashboardDir -Force | Out-Null
    }
    
    $metrics = @{
        Models = $ModelMetrics
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $metrics | ConvertTo-Json | Set-Content (Join-Path $dashboardDir "model-metrics.json")
}

function Main {
    Write-Host "Starting offline model setup..."
    
    if (-not (Test-ModelRequirements)) {
        Write-Host "❌ Model requirements not met"
        exit 1
    }
    
    try {
        Initialize-ModelDirectory
        $modelMetrics = Get-Models
        $modelMetrics = Test-ModelIntegrity -ModelMetrics $modelMetrics
        Update-Dashboard -ModelMetrics $modelMetrics
        
        Write-Host "✅ Offline model setup completed successfully!"
    }
    catch {
        Write-Host "❌ Setup failed: $_"
        exit 1
    }
}

Main 