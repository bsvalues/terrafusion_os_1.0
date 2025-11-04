$ErrorActionPreference = "Stop"

function Test-SigningRequirements {
    Write-Host "Checking code signing requirements..."
    
    $requirements = @{
        "OpenSSL" = { openssl version }
        "signtool" = { signtool /? }
    }
    
    foreach ($req in $requirements.GetEnumerator()) {
        try {
            $version = & $req.Value
            Write-Host "✅ $($req.Key) is installed: $version"
        }
        catch {
            Write-Host "❌ $($req.Key) is not installed or not in PATH"
            return $false
        }
    }
    return $true
}

function Initialize-SigningCertificate {
    Write-Host "Initializing signing certificate..."
    
    $certDir = "certs"
    if (-not (Test-Path $certDir)) {
        New-Item -ItemType Directory -Path $certDir -Force | Out-Null
    }
    
    $certPath = Join-Path $certDir "terrafusion.pfx"
    if (-not (Test-Path $certPath)) {
        Write-Host "Generating new certificate..."
        try {
            openssl req -x509 -newkey rsa:4096 -keyout "$certDir/terrafusion.key" -out "$certDir/terrafusion.crt" -days 365 -nodes -subj "/CN=TerraFusion IDE"
            openssl pkcs12 -export -out $certPath -inkey "$certDir/terrafusion.key" -in "$certDir/terrafusion.crt"
            Write-Host "✅ Certificate generated successfully"
        }
        catch {
            Write-Host "❌ Failed to generate certificate: $_"
            throw
        }
    }
    else {
        Write-Host "✅ Certificate already exists"
    }
}

function Sign-Executable {
    param (
        [string]$Path
    )
    
    Write-Host "Signing executable: $Path"
    
    try {
        $certPath = Join-Path "certs" "terrafusion.pfx"
        signtool sign /f $certPath /t http://timestamp.digicert.com $Path
        Write-Host "✅ Executable signed successfully"
    }
    catch {
        Write-Host "❌ Failed to sign executable: $_"
        throw
    }
}

function Main {
    Write-Host "Starting code signing setup..."
    
    if (-not (Test-SigningRequirements)) {
        Write-Host "❌ Signing requirements not met"
        exit 1
    }
    
    try {
        Initialize-SigningCertificate
        
        # Sign main executable
        $exePath = "dist/TerraFusion IDE Setup.exe"
        if (Test-Path $exePath) {
            Sign-Executable -Path $exePath
        }
        
        Write-Host "✅ Code signing setup completed successfully!"
    }
    catch {
        Write-Host "❌ Setup failed: $_"
        exit 1
    }
}

Main 