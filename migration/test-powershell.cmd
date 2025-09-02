@echo off
echo Testing PowerShell execution environment...

echo.
echo === Testing basic PowerShell command ===
powershell.exe -Command "Write-Host 'PowerShell is working'; Get-Date"

echo.
echo === Testing execution policy ===
powershell.exe -Command "Get-ExecutionPolicy"

echo.
echo === Testing file access ===
powershell.exe -Command "Get-ChildItem -Path '.' -Filter '*.ps1'"

echo.
echo === Testing script execution with bypass ===
powershell.exe -ExecutionPolicy Bypass -Command "Write-Host 'Bypass policy test successful'"

echo.
echo === Environment Information ===
echo PowerShell Version:
powershell.exe -Command "$PSVersionTable.PSVersion"

echo.
echo Current Directory:
powershell.exe -Command "Get-Location"

echo.
echo Available PowerShell Modules:
powershell.exe -Command "Get-Module -ListAvailable | Select-Object Name, Version | Format-Table"

pause
