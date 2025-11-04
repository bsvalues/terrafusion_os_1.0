$ErrorActionPreference = "Stop"

function Test-CompressionRequirements {
    Write-Host "Checking compression requirements..."
    
    $requirements = @{
        "7-Zip" = "7z"
        "Python" = "python"
    }
    
    $missing = @()
    foreach ($req in $requirements.GetEnumerator()) {
        try {
            $null = Get-Command $req.Value -ErrorAction Stop
        }
        catch {
            $missing += $req.Key
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing requirements: $($missing -join ', ')"
        return $false
    }
    
    return $true
}

function Initialize-CompressionEnvironment {
    Write-Host "Initializing compression environment..."
    
    $dirs = @(
        "models/compressed",
        "models/temp"
    )
    
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
}

function Compress-Model {
    param (
        [string]$ModelPath,
        [string]$OutputPath
    )
    
    Write-Host "Compressing $ModelPath..."
    
    try {
        $startTime = Get-Date
        $originalSize = (Get-Item $ModelPath).Length
        
        # Monitor system resources
        $cpuCounter = New-Object System.Diagnostics.PerformanceCounter("Processor", "% Processor Time", "_Total")
        $memCounter = New-Object System.Diagnostics.PerformanceCounter("Memory", "Available MBytes")
        
        $tempPath = Join-Path "models/temp" (Split-Path $ModelPath -Leaf)
        Copy-Item $ModelPath $tempPath
        
        $compressionArgs = @(
            "a",
            "-t7z",
            "-m0=lzma2",
            "-mx=9",
            $OutputPath,
            $tempPath
        )
        
        $process = Start-Process 7z -ArgumentList $compressionArgs -NoNewWindow -PassThru
        
        $performanceMetrics = @{
            MaxCpuUsage = 0
            MinMemoryAvailable = [int]::MaxValue
            CompressionStartTime = $startTime
            CompressionEndTime = $null
        }
        
        while (-not $process.HasExited) {
            $cpuUsage = $cpuCounter.NextValue()
            $memAvailable = $memCounter.NextValue()
            
            $performanceMetrics.MaxCpuUsage = [Math]::Max($performanceMetrics.MaxCpuUsage, $cpuUsage)
            $performanceMetrics.MinMemoryAvailable = [Math]::Min($performanceMetrics.MinMemoryAvailable, $memAvailable)
            
            Start-Sleep -Milliseconds 100
        }
        
        $performanceMetrics.CompressionEndTime = Get-Date
        
        $compressedSize = (Get-Item $OutputPath).Length
        $compressionRatio = [math]::Round(($originalSize - $compressedSize) / $originalSize * 100, 2)
        $compressionTime = ($performanceMetrics.CompressionEndTime - $startTime).TotalSeconds
        
        Write-Host "✅ Compressed $ModelPath in $compressionTime seconds"
        Write-Host "   Original size: $([math]::Round($originalSize / 1MB, 2)) MB"
        Write-Host "   Compressed size: $([math]::Round($compressedSize / 1MB, 2)) MB"
        Write-Host "   Compression ratio: $compressionRatio%"
        Write-Host "   Max CPU Usage: $([math]::Round($performanceMetrics.MaxCpuUsage, 2))%"
        Write-Host "   Min Memory Available: $([math]::Round($performanceMetrics.MinMemoryAvailable, 2)) MB"
        
        Remove-Item $tempPath -Force
        
        return @{
            Status = "Success"
            OriginalSize = $originalSize
            CompressedSize = $compressedSize
            CompressionRatio = $compressionRatio
            CompressionTime = $compressionTime
            PerformanceMetrics = $performanceMetrics
        }
    }
    catch {
        Write-Host ("❌ Failed to compress {0}: {1}" -f $ModelPath, $_.Exception.Message)
        return @{
            Status = "Error"
            OriginalSize = 0
            CompressedSize = 0
            CompressionRatio = 0
            CompressionTime = 0
            PerformanceMetrics = $null
        }
    }
}

function Optimize-Model {
    param (
        [string]$ModelPath
    )
    
    Write-Host "Optimizing $ModelPath..."
    
    $pythonScript = @"
import torch
import os

def optimize_model(input_path, output_path):
    try:
        model = torch.load(input_path)
        model = model.half()
        torch.save(model, output_path)
        return True
    except Exception as e:
        print(f"Error optimizing model: {e}")
        return False

if __name__ == "__main__":
    input_path = "$ModelPath"
    output_path = input_path.replace(".bin", "_optimized.bin")
    success = optimize_model(input_path, output_path)
    if success:
        print("Model optimization completed successfully")
    else:
        print("Model optimization failed")
"@
    
    $scriptPath = "optimize_model.py"
    $pythonScript | Set-Content $scriptPath
    
    try {
        $startTime = Get-Date
        python $scriptPath
        $optimizationTime = ((Get-Date) - $startTime).TotalSeconds
        
        if (Test-Path $ModelPath.Replace(".bin", "_optimized.bin")) {
            Write-Host "✅ Optimized $ModelPath in $optimizationTime seconds"
            return @{
                Status = "Success"
                OptimizationTime = $optimizationTime
            }
        }
        else {
            Write-Host "❌ Optimization failed for $ModelPath"
            return @{
                Status = "Error"
                OptimizationTime = 0
            }
        }
    }
    catch {
        Write-Host ("❌ Failed to optimize {0}: {1}" -f $ModelPath, $_.Exception.Message)
        return @{
            Status = "Error"
            OptimizationTime = 0
        }
    }
    finally {
        Remove-Item $scriptPath -Force
    }
}

function Test-ModelIntegrity {
    param (
        [string]$ModelPath,
        [string]$CompressedPath
    )
    
    Write-Host "Validating model integrity..."
    
    try {
        $startTime = Get-Date
        
        # Verify compressed file exists and is not empty
        if (-not (Test-Path $CompressedPath)) {
            throw "Compressed model not found: $CompressedPath"
        }
        
        $compressedFile = Get-Item $CompressedPath
        if ($compressedFile.Length -eq 0) {
            throw "Compressed model is empty: $CompressedPath"
        }
        
        # Calculate hash of original and compressed files
        $originalHash = (Get-FileHash -Path $ModelPath -Algorithm SHA256).Hash
        $compressedHash = (Get-FileHash -Path $CompressedPath -Algorithm SHA256).Hash
        
        # Test decompression
        $testPath = Join-Path "models/temp" "test_decompress"
        if (-not (Test-Path $testPath)) {
            New-Item -ItemType Directory -Path $testPath -Force | Out-Null
        }
        
        $decompressArgs = @(
            "x",
            $CompressedPath,
            "-o$testPath",
            "-y"
        )
        
        $process = Start-Process 7z -ArgumentList $decompressArgs -NoNewWindow -PassThru -Wait
        if ($process.ExitCode -ne 0) {
            throw "Decompression test failed with exit code: $($process.ExitCode)"
        }
        
        $decompressedHash = (Get-FileHash -Path (Join-Path $testPath (Split-Path $ModelPath -Leaf)) -Algorithm SHA256).Hash
        if ($decompressedHash -ne $originalHash) {
            throw "Hash mismatch after decompression"
        }
        
        $verificationTime = ((Get-Date) - $startTime).TotalSeconds
        Write-Host "✅ Model integrity verified in $verificationTime seconds"
        
        return @{
            Status = "Success"
            OriginalHash = $originalHash
            CompressedHash = $compressedHash
            VerificationTime = $verificationTime
        }
    }
    catch {
        Write-Host ("❌ Model integrity check failed: {0}" -f $_.Exception.Message)
        return @{
            Status = "Error"
            OriginalHash = $null
            CompressedHash = $null
            VerificationTime = 0
        }
    }
    finally {
        if (Test-Path $testPath) {
            Remove-Item $testPath -Recurse -Force
        }
    }
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
    
    $metrics | ConvertTo-Json | Set-Content (Join-Path $dashboardDir "compression-metrics.json")
}

function Main {
    Write-Host "Starting model compression..."
    
    if (-not (Test-CompressionRequirements)) {
        Write-Host "❌ Compression requirements not met"
        exit 1
    }
    
    try {
        Initialize-CompressionEnvironment
        
        $models = @(
            "models/gpt4all/gpt4all.bin",
            "models/mistral/mistral.bin"
        )
        
        $modelMetrics = @()
        foreach ($model in $models) {
            if (Test-Path $model) {
                $optimizationMetrics = Optimize-Model -ModelPath $model
                $compressedPath = Join-Path "models/compressed" (Split-Path $model -Leaf)
                $compressionMetrics = Compress-Model -ModelPath $model.Replace(".bin", "_optimized.bin") -OutputPath $compressedPath
                $integrityMetrics = Test-ModelIntegrity -ModelPath $model -CompressedPath $compressedPath
                
                $modelMetrics += @{
                    Name = Split-Path $model -Leaf
                    Optimization = $optimizationMetrics
                    Compression = $compressionMetrics
                    Integrity = $integrityMetrics
                }
            }
            else {
                Write-Host "❌ Model not found: $model"
            }
        }
        
        Update-Dashboard -ModelMetrics $modelMetrics
        
        Write-Host "✅ Model compression completed successfully!"
    }
    catch {
        Write-Host "❌ Compression failed: $_"
        exit 1
    }
}

Main 