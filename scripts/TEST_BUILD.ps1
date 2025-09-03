Write-Host "TESTING BACKEND BUILD..." -ForegroundColor Cyan
Push-Location backend

Write-Host "`nCleaning solution..." -ForegroundColor Yellow
dotnet clean --nologo -v q

Write-Host "Restoring packages..." -ForegroundColor Yellow  
dotnet restore --nologo -v q

Write-Host "Building solution..." -ForegroundColor Yellow
$output = dotnet build --nologo 2>&1

$errors = $output | Where-Object { $_ -match "error CS" }
$warnings = $output | Where-Object { $_ -match "warning CS" }

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host "Errors: $($errors.Count)" -ForegroundColor Red
    Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
    
    if ($errors.Count -gt 0) {
        Write-Host "`nFirst 5 errors:" -ForegroundColor Red
        $errors | Select-Object -First 5 | ForEach-Object { Write-Host $_ }
    }
}

Pop-Location
Write-Host "`nDone!" -ForegroundColor Cyan
