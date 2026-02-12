@echo off
setlocal enabledelayedexpansion

echo === TerraFusion OS 1.0 Migration ===
echo.

echo Starting Data Consolidation...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { try { & 'e:\TerraFusion_OS_1.0\migration\consolidate-data.ps1'; Write-Host 'Data consolidation completed successfully' -ForegroundColor Green } catch { Write-Host 'Error in data consolidation: ' $_.Exception.Message -ForegroundColor Red } }"

echo.
echo Starting Module Migration...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { try { & 'e:\TerraFusion_OS_1.0\migration\migrate-modules.ps1'; Write-Host 'Module migration completed successfully' -ForegroundColor Green } catch { Write-Host 'Error in module migration: ' $_.Exception.Message -ForegroundColor Red } }"

echo.
echo === Migration Process Complete ===
echo Check the output above for any errors.
echo.
