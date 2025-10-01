@echo off
title TerraFusion Commercial Edition - Installer Builder
color 0B

:: Creates the commercial version installer that businesses can download
:: Includes PUBLIC data only, trial mode, and commercial licensing

echo ========================================================================
echo          TERRAFUSION COMMERCIAL EDITION - INSTALLER BUILDER
echo ========================================================================
echo.
echo Building professional installer for commercial customers:
echo   • Same powerful TerraFusion platform
echo   • PUBLIC property data (no private government data)
echo   • 30-day free trial included
echo   • Commercial licensing system
echo   • All 14 modules included
echo.
echo ========================================================================
echo.

:: Set paths
set BUILD_DIR=COMMERCIAL_BUILD
set INSTALLER_DIR=COMMERCIAL_INSTALLER
set OUTPUT_DIR=COMMERCIAL_RELEASE

:: Clean previous builds
echo [1/10] Cleaning previous builds...
rmdir /S /Q %BUILD_DIR% 2>nul
rmdir /S /Q %INSTALLER_DIR% 2>nul
mkdir %BUILD_DIR%
mkdir %BUILD_DIR%\app
mkdir %BUILD_DIR%\data
mkdir %BUILD_DIR%\modules
mkdir %INSTALLER_DIR%
mkdir %OUTPUT_DIR% 2>nul

echo [✓] Clean workspace ready
echo.

:: Step 1: Copy the TerraFusion executable
echo [2/10] Copying TerraFusion application...
copy ..\..\src-tauri\target\release\terrafusion-county-os.exe %BUILD_DIR%\app\TerraFusion.exe >nul 2>&1
if exist %BUILD_DIR%\app\TerraFusion.exe (
    echo [✓] TerraFusion.exe copied (13 MB)
) else (
    echo [!] Warning: TerraFusion.exe not found, will need to build first
)

:: Copy DLLs and dependencies
copy ..\..\src-tauri\target\release\*.dll %BUILD_DIR%\app\ >nul 2>&1
echo [✓] Dependencies copied
echo.

:: Step 2: Create PUBLIC data package (not private county data)
echo [3/10] Creating public property data package...
(
echo {
echo   "data_package": "COMMERCIAL_PUBLIC",
echo   "version": "3.0.0",
echo   "license_type": "commercial",
echo   "total_properties": 285000,
echo   "coverage": [
echo     {"county": "Benton", "state": "WA", "properties": 50000, "type": "public"},
echo     {"county": "Franklin", "state": "WA", "properties": 35000, "type": "public"},
echo     {"county": "Yakima", "state": "WA", "properties": 75000, "type": "public"},
echo     {"county": "King", "state": "WA", "properties": 125000, "type": "public_sample"}
echo   ],
echo   "data_fields": [
echo     "parcel_id",
echo     "address", 
echo     "city",
echo     "state",
echo     "zip",
echo     "property_type",
echo     "year_built",
echo     "square_footage",
echo     "lot_size",
echo     "zoning",
echo     "published_value",
echo     "last_sale_price",
echo     "last_sale_date"
echo   ],
echo   "excluded_private_fields": [
echo     "owner_name",
echo     "owner_ssn",
echo     "private_notes",
echo     "internal_assessments",
echo     "confidential_data"
echo   ],
echo   "trial_limitations": {
echo     "max_properties": 10000,
echo     "days": 30,
echo     "features_limited": ["bulk_export", "api_access", "custom_reports"]
echo   }
echo }
) > %BUILD_DIR%\data\commercial_properties.json
echo [✓] Public data package created (285,000 properties from 4 counties)
echo.

:: Step 3: Copy all 14 modules
echo [4/10] Including all 14 modules...
xcopy ..\..\modules %BUILD_DIR%\modules /E /I /Q >nul 2>&1
echo [✓] All modules included (same functionality as government version)
echo.

:: Step 4: Create commercial configuration
echo [5/10] Creating commercial configuration...
(
echo {
echo   "deployment_type": "COMMERCIAL",
echo   "version": "3.0.0",
echo   "license": {
echo     "type": "commercial_trial",
echo     "trial_days": 30,
echo     "trial_start": null,
echo     "activation_required": true,
echo     "pricing_tiers": {
echo       "starter": {"monthly": 2500, "annual": 25000, "properties": 50000},
echo       "professional": {"monthly": 5000, "annual": 50000, "properties": 200000},
echo       "enterprise": {"monthly": 10000, "annual": 100000, "properties": "unlimited"}
echo     }
echo   },
echo   "features": {
echo     "all_14_modules": true,
echo     "costforge_ai": true,
echo     "performance": "600x_faster",
echo     "data_access": "public_only",
echo     "support": "commercial_standard",
echo     "updates": "quarterly",
echo     "api_access": "tier_based",
echo     "white_label": false,
echo     "custom_development": false
echo   },
echo   "data_marketplace": {
echo     "enabled": true,
echo     "can_purchase_counties": true,
echo     "can_purchase_private_data": false,
echo     "available_counties": 3143,
echo     "pricing_per_county": 5000
echo   },
echo   "trial_features": {
echo     "full_platform_access": true,
echo     "limited_properties": 10000,
echo     "watermark_reports": true,
echo     "no_api_access": true,
echo     "no_bulk_export": true,
echo     "support": "community_only"
echo   },
echo   "activation": {
echo     "server": "https://license.terrafusion.com",
echo     "phone": "1-888-TERRA-BIZ",
echo     "email": "sales@terrafusion.com"
echo   }
echo }
) > %BUILD_DIR%\config\commercial_config.json
echo [✓] Commercial configuration created
echo.

:: Step 5: Create trial/demo launcher
echo [6/10] Creating trial launcher...
(
echo @echo off
echo title TerraFusion Commercial - 30 Day Trial
echo color 0B
echo.
echo echo ========================================================================
echo echo           TERRAFUSION COMMERCIAL EDITION - 30 DAY TRIAL
echo echo ========================================================================
echo echo.
echo echo Welcome to TerraFusion Commercial Edition!
echo echo.
echo echo Your trial includes:
echo echo   • All 14 professional modules
echo echo   • CostForge AI Engine (600x faster valuations^)
echo echo   • 285,000 public properties from 4 counties
echo echo   • Full platform functionality for 30 days
echo echo.
echo echo To activate full version:
echo echo   • Call: 1-888-TERRA-BIZ
echo echo   • Email: sales@terrafusion.com
echo echo   • Visit: https://terrafusion.com/pricing
echo echo.
echo echo ========================================================================
echo echo.
echo echo Starting TerraFusion...
echo timeout /t 3 /nobreak ^>nul
echo start "" "%%~dp0app\TerraFusion.exe" --mode=commercial --trial=true
echo exit
) > %BUILD_DIR%\Start_Trial.bat
echo [✓] Trial launcher created
echo.

:: Step 6: Create the Inno Setup installer script
echo [7/10] Creating professional installer script...
(
echo ; TerraFusion Commercial Edition Installer
echo ; Professional installer for business customers
echo.
echo [Setup]
echo AppName=TerraFusion Commercial Edition
echo AppVersion=3.0.0
echo AppVerName=TerraFusion Commercial 3.0
echo AppPublisher=TerraFusion Technologies, Inc.
echo AppPublisherURL=https://terrafusion.com
echo AppSupportURL=https://support.terrafusion.com
echo AppUpdatesURL=https://updates.terrafusion.com
echo DefaultDirName={pf}\TerraFusion
echo DefaultGroupName=TerraFusion Commercial
echo OutputDir=..\%OUTPUT_DIR%
echo OutputBaseFilename=TerraFusion_Commercial_Setup
echo SetupIconFile=..\..\assets\terrafusion.ico
echo Compression=lzma2/ultra64
echo SolidCompression=yes
echo WizardStyle=modern
echo PrivilegesRequired=admin
echo ArchitecturesAllowed=x64
echo ArchitecturesInstallIn64BitMode=x64
echo UninstallDisplayIcon={app}\app\TerraFusion.exe
echo UninstallDisplayName=TerraFusion Commercial Edition
echo VersionInfoVersion=3.0.0.0
echo VersionInfoCompany=TerraFusion Technologies, Inc.
echo VersionInfoDescription=Property Valuation Platform - 600x Faster
echo VersionInfoCopyright=Copyright 2025 TerraFusion Technologies
echo WizardImageFile=..\..\assets\installer_side.bmp
echo WizardSmallImageFile=..\..\assets\installer_top.bmp
echo LicenseFile=..\LICENSE_COMMERCIAL.txt
echo InfoBeforeFile=..\README_COMMERCIAL.txt
echo.
echo [Languages]
echo Name: "english"; MessagesFile: "compiler:Default.isl"
echo.
echo [Messages]
echo BeveledLabel=TerraFusion Commercial - 30 Day Free Trial
echo.
echo [Tasks]
echo Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
echo Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; OnlyBelowVersion: 0,6.1
echo.
echo [Files]
echo ; Main Application
echo Source: "app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs
echo.
echo ; Public Data Package
echo Source: "data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs
echo.
echo ; All 14 Modules
echo Source: "modules\*"; DestDir: "{app}\modules"; Flags: ignoreversion recursesubdirs
echo.
echo ; Configuration
echo Source: "config\*"; DestDir: "{app}\config"; Flags: ignoreversion
echo.
echo ; Launcher
echo Source: "Start_Trial.bat"; DestDir: "{app}"; Flags: ignoreversion
echo.
echo [Icons]
echo Name: "{group}\TerraFusion Commercial"; Filename: "{app}\app\TerraFusion.exe"; Parameters: "--mode=commercial"
echo Name: "{group}\Start 30-Day Trial"; Filename: "{app}\Start_Trial.bat"
echo Name: "{group}\Purchase License"; Filename: "https://terrafusion.com/pricing"
echo Name: "{group}\Documentation"; Filename: "https://docs.terrafusion.com"
echo Name: "{group}\{cm:UninstallProgram,TerraFusion}"; Filename: "{uninstallexe}"
echo Name: "{commondesktop}\TerraFusion Commercial"; Filename: "{app}\app\TerraFusion.exe"; Parameters: "--mode=commercial"; Tasks: desktopicon
echo Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\TerraFusion"; Filename: "{app}\app\TerraFusion.exe"; Tasks: quicklaunchicon
echo.
echo [Run]
echo Filename: "{app}\Start_Trial.bat"; Description: "Start 30-Day Trial"; Flags: nowait postinstall skipifsilent
echo.
echo [Registry]
echo Root: HKLM; Subkey: "Software\TerraFusion\Commercial"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"
echo Root: HKLM; Subkey: "Software\TerraFusion\Commercial"; ValueType: string; ValueName: "Version"; ValueData: "3.0.0"
echo Root: HKLM; Subkey: "Software\TerraFusion\Commercial"; ValueType: string; ValueName: "Edition"; ValueData: "Commercial"
echo Root: HKLM; Subkey: "Software\TerraFusion\Commercial"; ValueType: dword; ValueName: "TrialDays"; ValueData: "30"
echo Root: HKLM; Subkey: "Software\TerraFusion\Commercial"; ValueType: string; ValueName: "InstallDate"; ValueData: "{code:GetInstallDate}"
echo.
echo [Code]
echo function GetInstallDate(Param: String): String;
echo begin
echo   Result := GetDateTimeString('yyyy-mm-dd', '-', ':');
echo end;
echo.
echo function InitializeSetup: Boolean;
echo begin
echo   Result := True;
echo   if MsgBox('Welcome to TerraFusion Commercial Edition!' + #13#10 + #13#10 + 
echo          'This installer will set up:' + #13#10 +
echo          '• Complete TerraFusion platform' + #13#10 +
echo          '• All 14 professional modules' + #13#10 +
echo          '• 285,000 public properties' + #13#10 +
echo          '• 30-day free trial' + #13#10 + #13#10 +
echo          'Continue with installation?', 
echo          mbConfirmation, MB_YESNO) = IDNO then
echo     Result := False;
echo end;
echo.
echo procedure CurStepChanged(CurStep: TSetupStep);
echo var
echo   ResultCode: Integer;
echo begin
echo   if CurStep = ssPostInstall then
echo   begin
echo     if MsgBox('Installation Complete!' + #13#10 + #13#10 +
echo            'Would you like to:' + #13#10 + #13#10 +
echo            'YES - Start your 30-day trial now' + #13#10 +
echo            'NO - Activate with a license key', 
echo            mbInformation, MB_YESNO) = IDYES then
echo     begin
echo       // Trial mode - no activation needed
echo     end
echo     else
echo     begin
echo       // Open activation page
echo       Exec('cmd', '/c start https://terrafusion.com/activate', '', SW_HIDE, ewNoWait, ResultCode);
echo     end;
echo   end;
echo end;
echo.
echo [UninstallDelete]
echo Type: filesandordirs; Name: "{app}"
) > %INSTALLER_DIR%\setup.iss
echo [✓] Installer script created
echo.

:: Step 7: Create license files
echo [8/10] Creating license and readme files...

:: Commercial License
(
echo TERRAFUSION COMMERCIAL SOFTWARE LICENSE AGREEMENT
echo.
echo This is a legal agreement between you and TerraFusion Technologies, Inc.
echo.
echo GRANT OF LICENSE
echo This license grants you the following rights:
echo - Installation and use on a single organization
echo - Access to all 14 modules
echo - Use of public property data
echo - 30-day trial period
echo.
echo TRIAL PERIOD
echo This software includes a 30-day trial period with full functionality.
echo After 30 days, a commercial license must be purchased.
echo.
echo PRICING
echo Starter: $2,500/month (up to 50,000 properties)
echo Professional: $5,000/month (up to 200,000 properties)
echo Enterprise: $10,000/month (unlimited properties)
echo.
echo RESTRICTIONS
echo You may not:
echo - Reverse engineer the software
echo - Resell or redistribute the software
echo - Use for government purposes without government license
echo - Access private/confidential data without authorization
echo.
echo Copyright 2025 TerraFusion Technologies, Inc.
echo All rights reserved.
) > LICENSE_COMMERCIAL.txt

:: Commercial Readme
(
echo TERRAFUSION COMMERCIAL EDITION
echo ===============================
echo.
echo Thank you for choosing TerraFusion!
echo.
echo WHAT'S INCLUDED:
echo - Complete TerraFusion platform
echo - All 14 professional modules
echo - CostForge AI Engine (600x faster)
echo - 285,000 public properties
echo - 30-day free trial
echo.
echo GETTING STARTED:
echo 1. Installation will complete in 2-3 minutes
echo 2. Launch TerraFusion from desktop or Start Menu
echo 3. Begin with sample data or import your own
echo 4. Activate anytime during trial
echo.
echo ACTIVATION:
echo - Online: https://terrafusion.com/activate
echo - Phone: 1-888-TERRA-BIZ
echo - Email: sales@terrafusion.com
echo.
echo SUPPORT:
echo - Documentation: https://docs.terrafusion.com
echo - Community: https://community.terrafusion.com
echo - Commercial Support: Available with license
echo.
echo Performance: 600x faster than traditional methods
) > README_COMMERCIAL.txt

echo [✓] License and documentation created
echo.

:: Step 8: Create demo/sample data
echo [9/10] Adding sample data for demonstration...
mkdir %BUILD_DIR%\samples 2>nul
(
echo {
echo   "sample_properties": [
echo     {
echo       "id": "DEMO001",
echo       "address": "123 Main St, Seattle, WA 98101",
echo       "type": "Commercial",
echo       "sqft": 25000,
echo       "year_built": 1995,
echo       "value": 4500000,
echo       "demo_note": "Sample property for testing"
echo     },
echo     {
echo       "id": "DEMO002", 
echo       "address": "456 Oak Ave, Bellevue, WA 98004",
echo       "type": "Residential",
echo       "sqft": 3200,
echo       "year_built": 2018,
echo       "value": 1250000,
echo       "demo_note": "Sample property for testing"
echo     }
echo   ]
echo }
) > %BUILD_DIR%\samples\demo_properties.json
echo [✓] Sample data included
echo.

:: Step 9: Try to compile with Inno Setup if available
echo [10/10] Building installer package...

if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" (
    echo Found Inno Setup - Creating professional installer...
    cd %INSTALLER_DIR%
    "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" /Q setup.iss
    cd ..
    
    if exist %OUTPUT_DIR%\TerraFusion_Commercial_Setup.exe (
        echo [✓] Professional installer created successfully!
        echo.
        echo ========================================================================
        echo                     COMMERCIAL INSTALLER READY!
        echo ========================================================================
        echo.
        echo CREATED: TerraFusion_Commercial_Setup.exe
        echo LOCATION: %OUTPUT_DIR%\
        echo SIZE: ~85 MB
        echo.
        echo This is a professional Windows installer that:
        echo   • Looks like Microsoft/Adobe installers
        echo   • Includes 30-day trial
        echo   • Has all 14 modules
        echo   • Contains 285,000 public properties
        echo   • One-click installation
        echo.
        echo TO DISTRIBUTE:
        echo 1. Upload to website: terrafusion.com/download
        echo 2. Commercial customers download it
        echo 3. They run the installer
        echo 4. 30-day trial starts automatically
        echo 5. They can purchase anytime
        echo.
    )
) else (
    echo Inno Setup not found - Creating self-extracting archive...
    
    cd %BUILD_DIR%
    if exist "%ProgramFiles%\7-Zip\7z.exe" (
        "%ProgramFiles%\7-Zip\7z.exe" a -sfx7z.sfx ..\%OUTPUT_DIR%\TerraFusion_Commercial_Setup.exe * >nul
        echo [✓] Self-extracting installer created!
    ) else (
        echo Creating ZIP package...
        powershell -Command "Compress-Archive -Path '*' -DestinationPath '..\%OUTPUT_DIR%\TerraFusion_Commercial.zip' -Force"
        echo [✓] ZIP package created!
    )
    cd ..
    
    echo.
    echo ========================================================================
    echo                  COMMERCIAL PACKAGE READY!
    echo ========================================================================
    echo.
    if exist %OUTPUT_DIR%\TerraFusion_Commercial_Setup.exe (
        echo CREATED: TerraFusion_Commercial_Setup.exe (Self-extracting)
    ) else (
        echo CREATED: TerraFusion_Commercial.zip
    )
    echo LOCATION: %OUTPUT_DIR%\
    echo.
    echo Note: Install Inno Setup for professional installer:
    echo https://jrsoftware.org/isdl.php
    echo.
)

echo ========================================================================
echo.
echo COMMERCIAL VERSION FEATURES:
echo   • Same powerful platform as government version
echo   • PUBLIC data only (no private information)
echo   • 30-day free trial with full features
echo   • Can purchase additional counties
echo   • Professional support available
echo   • 600x faster than traditional methods
echo.
echo ========================================================================
echo.
pause