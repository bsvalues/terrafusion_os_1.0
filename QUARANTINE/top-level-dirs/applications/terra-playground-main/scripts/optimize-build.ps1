$ErrorActionPreference = "Stop"

function Test-BuildRequirements {
    Write-Host "Checking build requirements..."
    
    $requirements = @{
        "Node.js" = { node --version }
        "npm" = { npm --version }
        "Python" = { python --version }
        "7-Zip" = { 7z --help }
    }
    
    $missing = @()
    foreach ($req in $requirements.GetEnumerator()) {
        try {
            & $req.Value | Out-Null
            Write-Host "✓ $($req.Key) is installed"
        } catch {
            $missing += $req.Key
            Write-Host "✗ $($req.Key) is not installed"
        }
    }
    
    if ($missing.Count -gt 0) {
        throw "Missing requirements: $($missing -join ', ')"
    }
}

function Optimize-BuildCache {
    Write-Host "Optimizing build cache..."
    
    $cachePaths = @(
        "$env:APPDATA\npm-cache",
        "$env:APPDATA\Local\pip\Cache",
        "node_modules\.cache"
    )
    
    foreach ($path in $cachePaths) {
        if (Test-Path $path) {
            Remove-Item -Path $path -Recurse -Force
            Write-Host "Cleared cache: $path"
        }
    }
}

function Parallelize-ModelDownloads {
    Write-Host "Setting up parallel model downloads..."
    
    $modelUrls = @{
        "gpt4all" = "https://gpt4all.io/models/ggml-gpt4all-j-v1.3-groovy.bin"
        "mistral" = "https://huggingface.co/mistralai/Mistral-7B-v0.1/resolve/main/mistral-7b-v0.1.Q4_K_M.gguf"
    }
    
    $jobs = @()
    foreach ($model in $modelUrls.GetEnumerator()) {
        $jobs += Start-Job -ScriptBlock {
            param($url, $output)
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($url, $output)
        } -ArgumentList $model.Value, "models/$($model.Key)/$($model.Key).bin"
    }
    
    $jobs | Wait-Job | Receive-Job
}

function Verify-CertificateRevocation {
    Write-Host "Verifying certificate revocation status..."
    
    $certPath = "certs/signing.pfx"
    if (Test-Path $certPath) {
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
        $chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
        $chain.ChainPolicy.RevocationMode = "Online"
        
        if (-not $chain.Build($cert)) {
            throw "Certificate validation failed"
        }
    }
}

function Optimize-BuildProcess {
    Write-Host "Optimizing build process..."
    
    $env:NODE_OPTIONS = "--max-old-space-size=8192"
    $env:ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES = "true"
    
    npm run build -- --optimize
}

function Main {
    try {
        Test-BuildRequirements
        Optimize-BuildCache
        Parallelize-ModelDownloads
        Verify-CertificateRevocation
        Optimize-BuildProcess
        
        Write-Host "Build optimization completed successfully"
    } catch {
        Write-Error "Build optimization failed: $_"
        exit 1
    }
}

Main 