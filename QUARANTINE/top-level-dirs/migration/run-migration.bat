@echo off
setlocal enabledelayedexpansion
echo Running TerraFusion OS 1.0 Migration Scripts...

REM Check if PowerShell scripts exist
if not exist "consolidate-data.ps1" (
    echo ERROR: consolidate-data.ps1 not found!
    pause
    exit /b 1
)

if not exist "migrate-modules.ps1" (
    echo ERROR: migrate-modules.ps1 not found!
    pause
    exit /b 1
)

echo.
echo === Running Data Consolidation ===
powershell.exe -ExecutionPolicy Bypass -File "consolidate-data.ps1"
if !errorlevel! neq 0 (
    echo ERROR: Data consolidation failed with exit code !errorlevel!
    pause
    exit /b !errorlevel!
)

echo.
echo === Running Module Migration ===
powershell.exe -ExecutionPolicy Bypass -File "migrate-modules.ps1"
if !errorlevel! neq 0 (
    echo ERROR: Module migration failed with exit code !errorlevel!
    pause
    exit /b !errorlevel!
)

echo.
echo === Migration completed successfully! ===
echo All scripts executed without errors.
pause
