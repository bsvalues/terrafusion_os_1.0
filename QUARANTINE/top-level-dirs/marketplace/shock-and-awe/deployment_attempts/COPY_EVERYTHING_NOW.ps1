# COPY EVERYTHING FROM D:\TF_File_8_25\DEPLOYED_APPLICATIONS TO CHAMPIONSHIP
# RUN THIS SCRIPT IN POWERSHELL TO ACTUALLY GET THE REAL FILES

$source = "D:\TF_File_8_25\DEPLOYED_APPLICATIONS"
$destination = "E:\TerraFusion_Tauri_Master_Workspace\championship\REAL_DEPLOYED_APPLICATIONS"

Write-Host "========================================" -ForegroundColor Green
Write-Host "COPYING EVERYTHING - NO BULLSHIT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "FROM: $source" -ForegroundColor Yellow
Write-Host "TO: $destination" -ForegroundColor Yellow
Write-Host ""

# Create destination if it doesn't exist
if (!(Test-Path $destination)) {
    New-Item -ItemType Directory -Path $destination -Force
    Write-Host "Created destination directory" -ForegroundColor Cyan
}

# Copy EVERYTHING recursively
Write-Host "Starting copy of ALL applications..." -ForegroundColor Cyan
try {
    # Use robocopy for better performance and reliability
    $robocopyArgs = @(
        $source,
        $destination,
        "/E",      # Copy subdirectories including empty ones
        "/Z",      # Copy files in restartable mode
        "/R:3",    # Retry 3 times
        "/W:1",    # Wait 1 second between retries
        "/NP",     # No progress percentage
        "/LOG+:$destination\migration_log.txt"
    )
    
    Start-Process -FilePath "robocopy" -ArgumentList $robocopyArgs -Wait -NoNewWindow
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "COPY COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    # List what was copied
    Write-Host ""
    Write-Host "Applications copied:" -ForegroundColor Cyan
    Get-ChildItem $destination -Directory | ForEach-Object {
        Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "EVERYTHING is now in:" -ForegroundColor Yellow
    Write-Host "$destination" -ForegroundColor White
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this script as Administrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check $destination to verify all applications are there" -ForegroundColor White
Write-Host "2. Look for TerraFusionBuild_ACTUAL or CostForge directories" -ForegroundColor White
Write-Host "3. Import the REAL applications into the championship build" -ForegroundColor White