# TerraFusion OS - Generate Missing Lock Files
# This script finds all package.json files missing lock files and generates them

Write-Host "🔍 TerraFusion OS - Generating Missing Lock Files..." -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Gray

$rootPath = Split-Path $PSScriptRoot -Parent
$totalFixed = 0
$errors = @()

# Find all package.json files
$packageJsonFiles = Get-ChildItem -Path $rootPath -Name "package.json" -Recurse -File

Write-Host "📊 Found $($packageJsonFiles.Count) package.json files" -ForegroundColor Green

foreach ($packageFile in $packageJsonFiles) {
    $packageDir = Split-Path (Join-Path $rootPath $packageFile) -Parent
    $lockFile = Join-Path $packageDir "package-lock.json"

    # Check if lock file is missing
    if (-not (Test-Path $lockFile)) {
        try {
            Write-Host "📦 Generating lock file for: $packageFile" -ForegroundColor Yellow

            # Change to the package directory
            Push-Location $packageDir

            # Generate lock file using npm install (which creates package-lock.json)
            $output = npm install --package-lock-only 2>&1

            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Successfully generated lock file" -ForegroundColor Green
                $totalFixed++
            }
            else {
                Write-Host "   ❌ Failed to generate lock file: $output" -ForegroundColor Red
                $errors += "Failed for $packageFile`: $output"
            }

            Pop-Location
        }
        catch {
            Write-Host "   ❌ Error processing $packageFile`: $($_.Exception.Message)" -ForegroundColor Red
            $errors += "Error for $packageFile`: $($_.Exception.Message)"
            Pop-Location
        }
    }
    else {
        Write-Host "✓ Lock file exists for: $packageFile" -ForegroundColor Gray
    }
}

Write-Host "" -ForegroundColor Gray
Write-Host "🎉 Summary:" -ForegroundColor Cyan
Write-Host "  📦 Total package.json files: $($packageJsonFiles.Count)" -ForegroundColor White
Write-Host "  ✅ Lock files generated: $totalFixed" -ForegroundColor Green
Write-Host "  ❌ Errors: $($errors.Count)" -ForegroundColor Red

if ($errors.Count -gt 0) {
    Write-Host "" -ForegroundColor Gray
    Write-Host "⚠️  Error Details:" -ForegroundColor Yellow
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor Red
    }
}

Write-Host "" -ForegroundColor Gray
Write-Host "🚀 TerraFusion OS lock file generation complete!" -ForegroundColor Cyan
