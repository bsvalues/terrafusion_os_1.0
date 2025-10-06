# PowerShell Script to Create Professional Windows Installer
# This creates a REAL .exe installer like Microsoft/Adobe products

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 CREATING TERRAFUSION WINDOWS INSTALLER (.EXE)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# You're right - you should have a single .exe installer!
# Here's what we need to create:

$InstallerName = "TerraFusion_Enterprise_Setup.exe"
$Version = "1.0.0"
$Publisher = "TerraFusion Technologies"
$InstallPath = "C:\Program Files\TerraFusion Enterprise"

Write-Host "📦 What you SHOULD receive:" -ForegroundColor Yellow
Write-Host "   • One file: $InstallerName (about 500MB)" -ForegroundColor White
Write-Host "   • Download it from website" -ForegroundColor White
Write-Host "   • Double-click to install" -ForegroundColor White
Write-Host "   • Professional installation wizard" -ForegroundColor White
Write-Host "   • Creates desktop shortcuts" -ForegroundColor White
Write-Host "   • Each app launches as .exe" -ForegroundColor White
Write-Host ""

# Check what we actually have
Write-Host "🔍 Checking current build status..." -ForegroundColor Yellow

$TauriExePath = ".\src-tauri\target\release\*.exe"
$TauriExeFiles = Get-ChildItem -Path $TauriExePath -ErrorAction SilentlyContinue

if ($TauriExeFiles) {
    Write-Host "✅ Found Tauri executables:" -ForegroundColor Green
    $TauriExeFiles | ForEach-Object { Write-Host "   • $($_.Name)" -ForegroundColor White }
} else {
    Write-Host "❌ No .exe files found!" -ForegroundColor Red
    Write-Host "   The apps need to be built with Tauri first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🛠️ Creating installer package..." -ForegroundColor Cyan

# Create installer directory structure
$InstallerDir = ".\WINDOWS_INSTALLER"
New-Item -ItemType Directory -Force -Path $InstallerDir | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallerDir\Resources" | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallerDir\Executables" | Out-Null

# Create NSIS installer script (professional installer creator)
$NSISScript = @"
; TerraFusion Enterprise Installer Script
; Creates professional Windows installer

!define PRODUCT_NAME "TerraFusion Enterprise"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "TerraFusion Technologies"
!define PRODUCT_WEB_SITE "https://terrafusionmarket.io"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\TerraFusion.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; Modern UI
!include "MUI2.nsh"
!define MUI_ABORTWARNING
!define MUI_ICON "terrafusion.ico"
!define MUI_UNICON "terrafusion.ico"

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; License page
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Install files page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!define MUI_FINISHPAGE_RUN "`$INSTDIR\TerraFusion.exe"
!insertmacro MUI_PAGE_FINISH

; Language
!insertmacro MUI_LANGUAGE "English"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "TerraFusion_Enterprise_Setup.exe"
InstallDir "`$PROGRAMFILES64\TerraFusion Enterprise"
ShowInstDetails show
ShowUnInstDetails show

Section "MainSection" SEC01
    SetOutPath "`$INSTDIR"
    SetOverwrite try
    
    ; Install main executable
    File "TerraFusion.exe"
    
    ; Install all 14 module executables
    File "CostForgeAI.exe"
    File "TerraAgent.exe"
    File "TerraFlow.exe"
    File "WebAuditTracker.exe"
    File "TerraLevy.exe"
    File "TerraMiner.exe"
    File "TerraSync.exe"
    File "GISPro.exe"
    File "PropertyWorkbench.exe"
    File "TerraInsight.exe"
    File "Dashboard.exe"
    File "Assessor.exe"
    File "Marketplace.exe"
    File "Collections.exe"
    
    ; Create shortcuts
    CreateDirectory "`$SMPROGRAMS\TerraFusion Enterprise"
    CreateShortcut "`$SMPROGRAMS\TerraFusion Enterprise\TerraFusion.lnk" "`$INSTDIR\TerraFusion.exe"
    CreateShortcut "`$DESKTOP\TerraFusion Enterprise.lnk" "`$INSTDIR\TerraFusion.exe"
    
    ; Write registry keys
    WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "`$INSTDIR\TerraFusion.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "`$INSTDIR\uninst.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "`$INSTDIR\TerraFusion.exe"
    WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" 524288
SectionEnd

Section -Post
    WriteUninstaller "`$INSTDIR\uninst.exe"
SectionEnd
"@

# Save NSIS script
$NSISScript | Out-File -FilePath "$InstallerDir\installer.nsi" -Encoding UTF8

Write-Host "✅ Created NSIS installer script" -ForegroundColor Green

# Create Inno Setup script (alternative professional installer)
$InnoScript = @"
[Setup]
AppName=TerraFusion Enterprise
AppVersion=1.0.0
AppPublisher=TerraFusion Technologies
AppPublisherURL=https://terrafusionmarket.io
DefaultDirName={commonpf64}\TerraFusion Enterprise
DefaultGroupName=TerraFusion Enterprise
OutputBaseFilename=TerraFusion_Enterprise_Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
WindowVisible=no
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayIcon={app}\TerraFusion.exe
SetupIconFile=terrafusion.ico
UninstallDisplayName=TerraFusion Enterprise

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "TerraFusion.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "CostForgeAI.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "TerraAgent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "TerraFlow.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "WebAuditTracker.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "TerraLevy.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "TerraMiner.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "TerraSync.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "GISPro.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "PropertyWorkbench.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "TerraInsight.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Dashboard.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Assessor.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Marketplace.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Collections.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\TerraFusion Enterprise"; Filename: "{app}\TerraFusion.exe"
Name: "{group}\CostForge AI"; Filename: "{app}\CostForgeAI.exe"
Name: "{group}\Uninstall"; Filename: "{uninstallexe}"
Name: "{commondesktop}\TerraFusion Enterprise"; Filename: "{app}\TerraFusion.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\TerraFusion.exe"; Description: "{cm:LaunchProgram,TerraFusion Enterprise}"; Flags: nowait postinstall skipifsilent

[Registry]
Root: HKLM; Subkey: "Software\TerraFusion"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"
Root: HKLM; Subkey: "Software\TerraFusion"; ValueType: string; ValueName: "Version"; ValueData: "1.0.0"
"@

# Save Inno Setup script
$InnoScript | Out-File -FilePath "$InstallerDir\setup.iss" -Encoding UTF8

Write-Host "✅ Created Inno Setup installer script" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 NEXT STEPS TO GET YOUR .EXE INSTALLER:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: BUILD WITH TAURI (Recommended)" -ForegroundColor Green
Write-Host "   1. Run: npm run tauri build" -ForegroundColor White
Write-Host "   2. This creates .exe files in src-tauri\target\release\" -ForegroundColor White
Write-Host "   3. Use the installer scripts above with those .exe files" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: USE INSTALLER CREATOR" -ForegroundColor Green
Write-Host "   1. Download Inno Setup: https://jrsoftware.org/isdl.php" -ForegroundColor White
Write-Host "   2. Open setup.iss in Inno Setup" -ForegroundColor White
Write-Host "   3. Click Compile - creates TerraFusion_Enterprise_Setup.exe" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: USE NSIS INSTALLER" -ForegroundColor Green
Write-Host "   1. Download NSIS: https://nsis.sourceforge.io/Download" -ForegroundColor White
Write-Host "   2. Right-click installer.nsi → Compile NSIS Script" -ForegroundColor White
Write-Host "   3. Creates TerraFusion_Enterprise_Setup.exe" -ForegroundColor White
Write-Host ""
Write-Host "💡 You'll end up with ONE file: TerraFusion_Enterprise_Setup.exe" -ForegroundColor Cyan
Write-Host "   Users download it, double-click, and get a professional installer!" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan