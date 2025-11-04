function Test-ArtifactIntegrity {
    param (
        [string]$ArtifactPath,
        [string]$ExpectedHash
    )
    
    Write-Host "Validating artifact: $ArtifactPath"
    
    if (-not (Test-Path $ArtifactPath)) {
        throw "Artifact not found: $ArtifactPath"
    }
    
    $actualHash = (Get-FileHash -Path $ArtifactPath -Algorithm SHA256).Hash
    
    if ($actualHash -ne $ExpectedHash) {
        throw "Hash mismatch for $ArtifactPath. Expected: $ExpectedHash, Got: $actualHash"
    }
    
    Write-Host "✓ Artifact integrity verified"
}

function Test-ArtifactStructure {
    param (
        [string]$ArtifactPath
    )
    
    Write-Host "Validating artifact structure: $ArtifactPath"
    
    $requiredFiles = @(
        "package.json",
        "README.md",
        "LICENSE",
        "dist/main.js",
        "dist/renderer.js",
        "dist/preload.js"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $ArtifactPath $file
        if (-not (Test-Path $filePath)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        throw "Missing required files: $($missingFiles -join ', ')"
    }
    
    Write-Host "✓ Artifact structure verified"
}

function Test-ArtifactDependencies {
    param (
        [string]$ArtifactPath
    )
    
    Write-Host "Validating artifact dependencies: $ArtifactPath"
    
    $packageJson = Join-Path $ArtifactPath "package.json"
    if (-not (Test-Path $packageJson)) {
        throw "package.json not found"
    }
    
    $package = Get-Content $packageJson | ConvertFrom-Json
    
    $requiredDeps = @(
        "electron",
        "react",
        "react-dom",
        "typescript"
    )
    
    $missingDeps = @()
    foreach ($dep in $requiredDeps) {
        if (-not $package.dependencies.$dep -and -not $package.devDependencies.$dep) {
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -gt 0) {
        throw "Missing required dependencies: $($missingDeps -join ', ')"
    }
    
    Write-Host "✓ Artifact dependencies verified"
}

function Test-ArtifactPermissions {
    param (
        [string]$ArtifactPath
    )
    
    Write-Host "Validating artifact permissions: $ArtifactPath"
    
    $executableFiles = @(
        "dist/main.js",
        "dist/renderer.js",
        "dist/preload.js"
    )
    
    foreach ($file in $executableFiles) {
        $filePath = Join-Path $ArtifactPath $file
        if (Test-Path $filePath) {
            $acl = Get-Acl $filePath
            if (-not $acl.Access.FileSystemRights -match "ReadAndExecute") {
                throw "Incorrect permissions for $file"
            }
        }
    }
    
    Write-Host "✓ Artifact permissions verified"
}

function Main {
    try {
        $artifactPath = "dist"
        $expectedHash = "YOUR_EXPECTED_HASH_HERE"
        
        Test-ArtifactIntegrity -ArtifactPath $artifactPath -ExpectedHash $expectedHash
        Test-ArtifactStructure -ArtifactPath $artifactPath
        Test-ArtifactDependencies -ArtifactPath $artifactPath
        Test-ArtifactPermissions -ArtifactPath $artifactPath
        
        Write-Host "All artifact validations passed successfully"
    }
    catch {
        Write-Error "Artifact validation failed: $_"
        exit 1
    }
}

Main 