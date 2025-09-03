Write-Host "TERRAFUSION OS - PHD LEVEL RESTORATION" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$CurrentPath = "C:\Users\bsval\terrafusion_os_1.0"
$BackupPath = "E:\TerraFusion_OS_1.0"

Write-Host "`n[1] FIXING IMMEDIATE COMPILATION ERRORS..." -ForegroundColor Yellow

$duplicateFile = "$CurrentPath\backend\TerraFusion.Core\DTOs\SwarmOptimizationDto.cs"
if (Test-Path $duplicateFile) {
    Remove-Item $duplicateFile -Force
    Write-Host "  - Removed duplicate SwarmOptimizationDto.cs" -ForegroundColor Green
}

Push-Location "$CurrentPath\backend"
Write-Host "`n[2] TESTING BUILD..." -ForegroundColor Yellow
dotnet clean | Out-Null
dotnet restore | Out-Null
$buildResult = dotnet build 2>&1
$errorCount = ($buildResult | Select-String "error CS" | Measure-Object).Count
Pop-Location

if ($errorCount -eq 0) {
    Write-Host "  ✓ Build successful!" -ForegroundColor Green
} else {
    Write-Host "  ✗ Build has $errorCount errors" -ForegroundColor Red
    Write-Host "`n[3] RESTORING FROM E: DRIVE BACKUP..." -ForegroundColor Yellow
    
    $components = @("backend", "frontend", "modules", "scripts")
    foreach ($comp in $components) {
        $source = "$BackupPath\$comp"
        $dest = "$CurrentPath\$comp"
        
        if (Test-Path $source) {
            Write-Host "  - Restoring $comp..." -ForegroundColor Cyan
            if (Test-Path $dest) {
                Remove-Item $dest -Recurse -Force
            }
            Copy-Item $source $CurrentPath -Recurse -Force
        }
    }
}

Write-Host "`n[4] FINAL BUILD TEST..." -ForegroundColor Yellow
Push-Location "$CurrentPath\backend"
dotnet build
Pop-Location

Write-Host "`n✅ RESTORATION COMPLETE!" -ForegroundColor Green
Write-Host "Run: .\START_TERRAFUSION.ps1 to launch" -ForegroundColor Cyan
