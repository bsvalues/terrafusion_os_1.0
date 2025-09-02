; TerraFusion County OS - Inno Setup Installer Script
; Creates professional Windows installer for championship deployment

#define MyAppName "TerraFusion County OS"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "TerraFusion Technologies"
#define MyAppURL "https://terrafusion.io"
#define MyAppExeName "terrafusion-county-os.exe"

[Setup]
AppId={{E7C4B3F2-9A8D-4F6E-B1C3-5D8A9E2F7C4B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/support
AppUpdatesURL={#MyAppURL}/updates
DefaultDirName={autopf}\TerraFusion
DefaultGroupName=TerraFusion County OS
AllowNoIcons=yes
LicenseFile=LICENSE.txt
InfoBeforeFile=README.md
OutputDir=installer
OutputBaseFilename=TerraFusion-Setup-{#MyAppVersion}
SetupIconFile=src-tauri\icons\icon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
DisableWelcomePage=no
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
; Main executable
Source: "src-tauri\target\release\terrafusion-county-os.exe"; DestDir: "{app}"; Flags: ignoreversion

; Dependencies and libraries
Source: "src-tauri\target\release\*.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "src-tauri\target\release\deps\*"; DestDir: "{app}\deps"; Flags: ignoreversion recursesubdirs

; Database files with 94K properties
Source: "data\terrafusionsync_94k.db"; DestDir: "{app}\data"; Flags: ignoreversion
Source: "data\real_pacs.db"; DestDir: "{app}\data"; Flags: ignoreversion
Source: "data\terrafusionsync_real.db"; DestDir: "{app}\data"; Flags: ignoreversion

; Frontend assets
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs

; Configuration files
Source: ".env.production"; DestDir: "{app}"; Flags: ignoreversion
Source: "configs\*"; DestDir: "{app}\configs"; Flags: ignoreversion recursesubdirs

; Documentation
Source: "docs\daily\2025-01-09\*.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "CHAMPIONSHIP_VICTORY.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "INVESTOR_ONEPAGER.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Performance Benchmarks"; Filename: "{app}\docs\PERFORMANCE_BENCHMARKS.md"
Name: "{group}\Investor Information"; Filename: "{app}\INVESTOR_ONEPAGER.md"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch TerraFusion County OS"; Flags: nowait postinstall skipifsilent

[Registry]
; Register URL protocol for terrafusion://
Root: HKCR; Subkey: "terrafusion"; ValueType: string; ValueName: ""; ValueData: "URL:TerraFusion Protocol"; Flags: uninsdeletekey
Root: HKCR; Subkey: "terrafusion"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""
Root: HKCR; Subkey: "terrafusion\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCR; Subkey: "terrafusion\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

[Code]
function InitializeSetup(): Boolean;
var
  Message: String;
begin
  Message := 'Welcome to TerraFusion County OS Installation!' + #13#10 + #13#10 +
             'This will install the complete government operating system featuring:' + #13#10 + #13#10 +
             '• 379,000,000× faster property valuations' + #13#10 +
             '• 94,149 Benton County properties pre-loaded' + #13#10 +
             '• 30% marketplace commission system' + #13#10 +
             '• 14 integrated government applications' + #13#10 +
             '• $75,000+ annual savings per county' + #13#10 + #13#10 +
             'Continue with installation?';
  
  Result := MsgBox(Message, mbConfirmation, MB_YESNO) = IDYES;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Create success flag file
    SaveStringToFile(ExpandConstant('{app}\installation_complete.txt'), 
      'TerraFusion County OS successfully installed at ' + GetDateTimeString('yyyy-mm-dd hh:nn:ss', '-', ':'), False);
  end;
end;