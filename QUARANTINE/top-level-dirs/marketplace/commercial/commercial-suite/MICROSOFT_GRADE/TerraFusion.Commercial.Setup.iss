; TerraFusion Commercial Enterprise Platform
; Professional Inno Setup Installer Script
; Copyright (C) 2025 TerraFusion Technologies, Inc.

#define MyAppName "TerraFusion Commercial"
#define MyAppVersion "3.0.0.379"
#define MyAppPublisher "TerraFusion Technologies, Inc."
#define MyAppURL "https://www.terrafusion.com"
#define MyAppExeName "TerraFusion.Commercial.exe"
#define MyAppCopyright "Copyright (C) 2025 TerraFusion Technologies, Inc."
#define MyAppGUID "{A8B9C0D1-E2F3-4567-8901-23456789ABCD}"

[Setup]
; Signing
SignTool=signtool
SignedUninstaller=yes

; Application Information
AppId={{A8B9C0D1-E2F3-4567-8901-23456789ABCD}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL=https://support.terrafusion.com
AppUpdatesURL=https://updates.terrafusion.com
AppCopyright={#MyAppCopyright}

; Directory Settings
DefaultDirName={commonpf64}\TerraFusion\Commercial
DefaultGroupName=TerraFusion Commercial
DisableProgramGroupPage=no
UsePreviousAppDir=yes
DirExistsWarning=no

; Output Settings
OutputDir=Output
OutputBaseFilename=TerraFusion.Commercial.Setup.{#MyAppVersion}
SetupIconFile=Assets\Icons\TerraFusion.ico
Compression=lzma2/ultra64
SolidCompression=yes
CompressionThreads=auto

; Privileges
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesInstallIn64BitMode=x64
ArchitecturesAllowed=x64

; UI Settings
WizardStyle=modern
WizardImageFile=Assets\Setup\WizardImage.bmp
WizardSmallImageFile=Assets\Setup\WizardSmallImage.bmp
SetupLogging=yes
ShowLanguageDialog=auto
DisableWelcomePage=no
DisableReadyPage=no
DisableFinishedPage=no

; Uninstall
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
CreateUninstallRegKey=yes

; Version Info
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=Enterprise Real Estate Valuation Platform - 379,000,000× Faster
VersionInfoTextVersion={#MyAppVersion}
VersionInfoCopyright={#MyAppCopyright}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "german"; MessagesFile: "compiler:Languages\German.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; OnlyBelowVersion: 6.1
Name: "startupicon"; Description: "Start TerraFusion Commercial when Windows starts"; GroupDescription: "Startup"
Name: "fileassoc"; Description: "Associate .tfp files with TerraFusion"; GroupDescription: "File Associations"
Name: "contextmenu"; Description: "Add 'Open with TerraFusion' to context menu"; GroupDescription: "Shell Integration"
Name: "windowsservice"; Description: "Install as Windows Service (Recommended)"; GroupDescription: "System Integration"

[Files]
; Main Application
Source: "Build\Release\TerraFusion.Commercial.exe"; DestDir: "{app}"; Flags: ignoreversion sign
Source: "Build\Release\TerraFusion.Commercial.exe.config"; DestDir: "{app}"; Flags: ignoreversion

; Core Libraries
Source: "Build\Release\*.dll"; DestDir: "{app}"; Flags: ignoreversion sign
Source: "Build\Release\x64\*.dll"; DestDir: "{app}\x64"; Flags: ignoreversion recursesubdirs

; CostForge AI Engine
Source: "Modules\CostForge\*"; DestDir: "{app}\Modules\CostForge"; Flags: ignoreversion recursesubdirs
Source: "Models\*.onnx"; DestDir: "{app}\Models"; Flags: ignoreversion
Source: "Models\*.pb"; DestDir: "{app}\Models"; Flags: ignoreversion

; Database
Source: "Database\TerraFusion.Commercial.db"; DestDir: "{commonappdata}\TerraFusion\Commercial"; Flags: ignoreversion
Source: "Database\Properties.db"; DestDir: "{commonappdata}\TerraFusion\Commercial"; Flags: ignoreversion

; Web Components
Source: "Web\*"; DestDir: "{app}\Web"; Flags: ignoreversion recursesubdirs

; Configuration
Source: "Config\appsettings.json"; DestDir: "{app}\Config"; Flags: ignoreversion
Source: "Config\appsettings.Production.json"; DestDir: "{app}\Config"; Flags: ignoreversion

; Certificates
Source: "Certificates\TerraFusion.Commercial.cer"; DestDir: "{app}\Certificates"; Flags: ignoreversion

; Documentation
Source: "Documentation\*.pdf"; DestDir: "{app}\Documentation"; Flags: ignoreversion
Source: "Documentation\*.chm"; DestDir: "{app}\Documentation"; Flags: ignoreversion

; Visual C++ Redistributables
Source: "Redist\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

; .NET Runtime
Source: "Redist\windowsdesktop-runtime-6.0.25-win-x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\CostForge AI Engine"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--module=costforge"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\Marketplace"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--module=marketplace"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\Documentation"; Filename: "{app}\Documentation\UserGuide.pdf"
Name: "{group}\Configuration"; Filename: "{app}\Config\appsettings.json"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: startupicon

[Registry]
; Application Registration
Root: HKLM64; Subkey: "Software\TerraFusion\Commercial"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM64; Subkey: "Software\TerraFusion\Commercial"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"
Root: HKLM64; Subkey: "Software\TerraFusion\Commercial"; ValueType: string; ValueName: "Publisher"; ValueData: "{#MyAppPublisher}"

; File Association
Root: HKCR; Subkey: ".tfp"; ValueType: string; ValueName: ""; ValueData: "TerraFusion.Project"; Flags: uninsdeletevalue; Tasks: fileassoc
Root: HKCR; Subkey: "TerraFusion.Project"; ValueType: string; ValueName: ""; ValueData: "TerraFusion Project File"; Flags: uninsdeletekey; Tasks: fileassoc
Root: HKCR; Subkey: "TerraFusion.Project\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},1"; Tasks: fileassoc
Root: HKCR; Subkey: "TerraFusion.Project\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: fileassoc

; Context Menu
Root: HKCR; Subkey: "*\shell\TerraFusion"; ValueType: string; ValueName: ""; ValueData: "Analyze with TerraFusion"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKCR; Subkey: "*\shell\TerraFusion"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\{#MyAppExeName}"; Tasks: contextmenu
Root: HKCR; Subkey: "*\shell\TerraFusion\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: contextmenu

; Windows Firewall
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\FirewallRules"; ValueType: string; ValueName: "TerraFusion-Commercial-TCP-In"; ValueData: "v2.31|Action=Allow|Active=TRUE|Dir=In|Protocol=6|Profile=Domain|Profile=Private|Profile=Public|App={app}\{#MyAppExeName}|Name=TerraFusion Commercial (TCP-In)|"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\FirewallRules"; ValueType: string; ValueName: "TerraFusion-Commercial-UDP-In"; ValueData: "v2.31|Action=Allow|Active=TRUE|Dir=In|Protocol=17|Profile=Domain|Profile=Private|Profile=Public|App={app}\{#MyAppExeName}|Name=TerraFusion Commercial (UDP-In)|"; Flags: uninsdeletevalue

; Environment Variables
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: expandsz; ValueName: "TERRAFUSION_HOME"; ValueData: "{app}"; Flags: preservestringtype

[Run]
; Install Prerequisites
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/quiet /norestart"; StatusMsg: "Installing Visual C++ Runtime..."; Flags: waituntilterminated
Filename: "{tmp}\windowsdesktop-runtime-6.0.25-win-x64.exe"; Parameters: "/quiet /norestart"; StatusMsg: "Installing .NET Desktop Runtime..."; Flags: waituntilterminated; Check: not IsDotNetInstalled

; Install Windows Service
Filename: "{app}\{#MyAppExeName}"; Parameters: "--install-service"; StatusMsg: "Installing TerraFusion Service..."; Flags: runhidden waituntilterminated; Tasks: windowsservice

; Import Certificate
Filename: "certutil"; Parameters: "-addstore TrustedPublisher ""{app}\Certificates\TerraFusion.Commercial.cer"""; StatusMsg: "Installing Security Certificate..."; Flags: runhidden waituntilterminated

; Launch Application
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Remove Windows Service
Filename: "{app}\{#MyAppExeName}"; Parameters: "--uninstall-service"; Flags: runhidden waituntilterminated; RunOnceId: "RemoveService"

; Clean Registry
Filename: "reg"; Parameters: "delete ""HKLM\Software\TerraFusion\Commercial"" /f"; Flags: runhidden waituntilterminated; RunOnceId: "CleanRegistry"

[Code]
var
  LicensePage: TInputQueryWizardPage;
  ActivationPage: TInputQueryWizardPage;
  
function IsDotNetInstalled: Boolean;
var
  Release: Cardinal;
begin
  Result := RegQueryDWordValue(HKLM, 'SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full', 'Release', Release);
  Result := Result and (Release >= 528040); // .NET Framework 4.8
end;

procedure InitializeWizard;
begin
  // License Key Page
  LicensePage := CreateInputQueryPage(wpSelectDir,
    'License Activation',
    'Enter your TerraFusion Commercial license key',
    'Please enter the license key provided in your purchase confirmation email. ' +
    'If you don''t have a license key, you can use the 30-day trial.');
    
  LicensePage.Add('License Key:', False);
  LicensePage.Values[0] := '';
  
  // Activation Options Page
  ActivationPage := CreateInputQueryPage(LicensePage.ID,
    'Activation Options',
    'Configure your TerraFusion Commercial installation',
    'Select the components and features you want to enable.');
    
  ActivationPage.Add('Organization Name:', False);
  ActivationPage.Add('Number of Users:', False);
  ActivationPage.Values[0] := '';
  ActivationPage.Values[1] := '5';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  LicenseKey: String;
begin
  Result := True;
  
  if CurPageID = LicensePage.ID then
  begin
    LicenseKey := LicensePage.Values[0];
    if (LicenseKey = '') then
    begin
      if MsgBox('No license key entered. Would you like to start a 30-day trial?',
        mbConfirmation, MB_YESNO) = IDNO then
      begin
        Result := False;
      end;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    // Save license information
    if LicensePage.Values[0] <> '' then
    begin
      SaveStringToFile(ExpandConstant('{app}\Config\license.key'), 
        LicensePage.Values[0], False);
    end;
    
    // Configure telemetry
    if MsgBox('Would you like to enable anonymous usage statistics to help improve TerraFusion?',
      mbConfirmation, MB_YESNO) = IDYES then
    begin
      RegWriteStringValue(HKLM64, 'Software\TerraFusion\Commercial', 
        'Telemetry', 'Enabled');
    end;
  end;
end;

function InitializeUninstall(): Boolean;
begin
  Result := MsgBox('Are you sure you want to remove TerraFusion Commercial and all its components?',
    mbConfirmation, MB_YESNO) = IDYES;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    if MsgBox('Would you like to remove all user data and settings?',
      mbConfirmation, MB_YESNO) = IDYES then
    begin
      DelTree(ExpandConstant('{commonappdata}\TerraFusion'), True, True, True);
      DelTree(ExpandConstant('{userappdata}\TerraFusion'), True, True, True);
    end;
  end;
end;