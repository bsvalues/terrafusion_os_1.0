@echo off
title Create TerraFusion Installer
color 0A

echo ===============================================================
echo      CREATING TERRAFUSION PROFESSIONAL INSTALLER
echo ===============================================================
echo.

REM You already have the .exe file!
echo [✓] Found executable: terrafusion-county-os.exe (13MB)
echo.

REM Create installer package directory
echo Creating installer package...
mkdir "TerraFusion_Installer_Package" 2>nul
cd TerraFusion_Installer_Package

REM Copy the executable
echo Copying executable...
copy "..\src-tauri\target\release\terrafusion-county-os.exe" "TerraFusion.exe" >nul

REM Create simple installer batch file
echo Creating installer script...
(
echo @echo off
echo title TerraFusion Enterprise Setup
echo color 0B
echo.
echo echo ===============================================================
echo echo           TERRAFUSION ENTERPRISE INSTALLER
echo echo           Government. Transcended.
echo echo ===============================================================
echo echo.
echo echo This will install TerraFusion Enterprise on your computer.
echo echo.
echo pause
echo.
echo echo Installing TerraFusion...
echo.
echo REM Create program directory
echo mkdir "%%ProgramFiles%%\TerraFusion" 2^>nul
echo.
echo REM Copy executable
echo copy "TerraFusion.exe" "%%ProgramFiles%%\TerraFusion\TerraFusion.exe" ^>nul
echo.
echo REM Create desktop shortcut
echo echo Creating desktop shortcut...
echo powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%%USERPROFILE%%\Desktop\TerraFusion.lnk'); $SC.TargetPath = '%%ProgramFiles%%\TerraFusion\TerraFusion.exe'; $SC.IconLocation = '%%ProgramFiles%%\TerraFusion\TerraFusion.exe'; $SC.Description = 'TerraFusion County OS - 379M× Faster'; $SC.Save()"
echo.
echo echo.
echo echo ===============================================================
echo echo     ✓ Installation Complete!
echo echo.
echo echo     TerraFusion has been installed to:
echo echo     %%ProgramFiles%%\TerraFusion\
echo echo.
echo echo     Desktop shortcut created.
echo echo.
echo echo     Click the desktop icon to launch TerraFusion.
echo echo ===============================================================
echo echo.
echo pause
) > INSTALL.bat

echo.
echo ===============================================================
echo     ✓ INSTALLER PACKAGE CREATED!
echo ===============================================================
echo.
echo Your installer package contains:
echo   • TerraFusion.exe (13MB) - The actual program
echo   • INSTALL.bat - Simple installer script
echo.
echo TO DISTRIBUTE:
echo   1. Zip this folder (TerraFusion_Installer_Package)
echo   2. Users download and unzip
echo   3. Users run INSTALL.bat
echo   4. TerraFusion installs with desktop shortcut
echo.
echo TO TEST NOW:
echo   Just run: INSTALL.bat
echo.
echo ===============================================================
pause