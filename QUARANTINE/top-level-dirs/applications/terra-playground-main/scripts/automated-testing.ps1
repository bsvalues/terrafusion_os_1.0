function Test-BuildEnvironment {
    Write-Host "Testing build environment..."
    
    $requirements = @{
        "Node.js" = { node --version }
        "npm" = { npm --version }
        "Python" = { python --version }
        "Git" = { git --version }
    }
    
    $issues = @()
    foreach ($req in $requirements.GetEnumerator()) {
        try {
            $version = & $req.Value
            Write-Host "✓ $($req.Key) is installed: $version"
        }
        catch {
            $issues += "$($req.Key) is not installed or not in PATH"
        }
    }
    
    if ($issues.Count -gt 0) {
        throw "Build environment issues:`n$($issues -join "`n")"
    }
}

function Test-BuildDependencies {
    Write-Host "Testing build dependencies..."
    
    $packageJson = "package.json"
    if (-not (Test-Path $packageJson)) {
        throw "package.json not found"
    }
    
    $package = Get-Content $packageJson | ConvertFrom-Json
    $issues = @()
    
    if (-not $package.dependencies) {
        $issues += "No dependencies defined in package.json"
    }
    
    if (-not $package.devDependencies) {
        $issues += "No devDependencies defined in package.json"
    }
    
    if ($issues.Count -gt 0) {
        throw "Dependency issues:`n$($issues -join "`n")"
    }
}

function Test-BuildProcess {
    Write-Host "Testing build process..."
    
    $steps = @(
        @{ Name = "Install Dependencies"; Command = "npm ci" }
        @{ Name = "Lint Code"; Command = "npm run lint" }
        @{ Name = "Run Tests"; Command = "npm test" }
        @{ Name = "Build Application"; Command = "npm run build" }
    )
    
    $issues = @()
    foreach ($step in $steps) {
        try {
            Write-Host "Running $($step.Name)..."
            Invoke-Expression $step.Command
            Write-Host "✓ $($step.Name) completed successfully"
        }
        catch {
            $issues += "$($step.Name) failed: $_"
        }
    }
    
    if ($issues.Count -gt 0) {
        throw "Build process issues:`n$($issues -join "`n")"
    }
}

function Test-BuildOutput {
    Write-Host "Testing build output..."
    
    $requiredFiles = @(
        "dist/main.js",
        "dist/renderer.js",
        "dist/preload.js",
        "dist/index.html"
    )
    
    $issues = @()
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $issues += "Required file not found: $file"
        }
    }
    
    if ($issues.Count -gt 0) {
        throw "Build output issues:`n$($issues -join "`n")"
    }
}

function Test-BuildPerformance {
    Write-Host "Testing build performance..."
    
    $metrics = @{
        MaxBuildTime = 900
        MaxMemoryUsage = 8GB
        MaxCpuUsage = 90
    }
    
    $startTime = Get-Date
    $processes = Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*" }
    
    $issues = @()
    foreach ($process in $processes) {
        if ($process.WorkingSet64 -gt $metrics.MaxMemoryUsage) {
            $issues += "High memory usage: $([math]::Round($process.WorkingSet64/1GB, 2))GB"
        }
        
        if ($process.CPU -gt $metrics.MaxCpuUsage) {
            $issues += "High CPU usage: $($process.CPU)%"
        }
    }
    
    $buildTime = ((Get-Date) - $startTime).TotalSeconds
    if ($buildTime -gt $metrics.MaxBuildTime) {
        $issues += "Build time exceeded limit: $buildTime seconds"
    }
    
    if ($issues.Count -gt 0) {
        throw "Performance issues:`n$($issues -join "`n")"
    }
}

function Main {
    try {
        Test-BuildEnvironment
        Test-BuildDependencies
        Test-BuildProcess
        Test-BuildOutput
        Test-BuildPerformance
        
        Write-Host "All tests passed successfully"
    }
    catch {
        Write-Error "Testing failed: $_"
        exit 1
    }
}

Main 