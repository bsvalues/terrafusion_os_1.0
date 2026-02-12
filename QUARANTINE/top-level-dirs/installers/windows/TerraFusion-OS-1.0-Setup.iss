# TerraFusion OS 1.0 - Windows Installer Script
# Creates professional Windows .exe installer

[Setup]
AppName=TerraFusion OS 1.0
AppVersion=1.0.0
AppPublisher=TerraFusion Government AI
AppPublisherURL=https://terrafusion.com
AppSupportURL=https://terrafusion.com/support
AppUpdatesURL=https://terrafusion.com/updates
DefaultDirName={autopf}\TerraFusion OS 1.0
DefaultGroupName=TerraFusion OS 1.0
AllowNoIcons=yes
LicenseFile=LICENSE.txt
InfoBeforeFile=README.txt
InfoAfterFile=POST_INSTALL.txt
OutputDir=installers
OutputBaseFilename=TerraFusion-OS-1.0-Benton-County-Setup
SetupIconFile=assets\terrafusion.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
WizardImageFile=assets\wizard-image.bmp
WizardSmallImageFile=assets\wizard-small.bmp
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode
Name: "startup"; Description: "Start TerraFusion OS 1.0 on system startup"; GroupDescription: "Startup Options"; Flags: unchecked

[Files]
Source: "dist\TerraFusionDashboard.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\TerraFusionAdmin.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\TerraFusionMonitor.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\TerraFusionBackup.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\TerraFusionSettings.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\postgresql\*"; DestDir: "{app}\database"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "dist\redis\*"; DestDir: "{app}\cache"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "dist\ai-swarm\*"; DestDir: "{app}\ai-swarm"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "dist\config\*"; DestDir: "{app}\config"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "dist\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\TerraFusion Dashboard"; Filename: "{app}\TerraFusionDashboard.exe"
Name: "{group}\TerraFusion Admin Panel"; Filename: "{app}\TerraFusionAdmin.exe"
Name: "{group}\TerraFusion Monitor"; Filename: "{app}\TerraFusionMonitor.exe"
Name: "{group}\TerraFusion Backup"; Filename: "{app}\TerraFusionBackup.exe"
Name: "{group}\TerraFusion Settings"; Filename: "{app}\TerraFusionSettings.exe"
Name: "{group}\Uninstall TerraFusion"; Filename: "{uninstallexe}"
Name: "{autodesktop}\TerraFusion Dashboard"; Filename: "{app}\TerraFusionDashboard.exe"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\TerraFusion Dashboard"; Filename: "{app}\TerraFusionDashboard.exe"; Tasks: quicklaunchicon

[Registry]
Root: HKLM; Subkey: "SOFTWARE\TerraFusion OS 1.0"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"
Root: HKLM; Subkey: "SOFTWARE\TerraFusion OS 1.0"; ValueType: string; ValueName: "Version"; ValueData: "1.0.0"
Root: HKLM; Subkey: "SOFTWARE\TerraFusion OS 1.0"; ValueType: string; ValueName: "County"; ValueData: "Benton County"
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "TerraFusion System Tray"; ValueData: "{app}\TerraFusionMonitor.exe /tray"; Flags: uninsdeletevalue; Tasks: startup

[Run]
Filename: "{app}\TerraFusionDashboard.exe"; Description: "{cm:LaunchProgram,TerraFusion Dashboard}"; Flags: nowait postinstall skipifsilent
Filename: "{app}\TerraFusionSettings.exe"; Description: "Configure TerraFusion Settings"; Flags: nowait postinstall skipifsilent

[Code]
var
  SetupWizardPage: TOutputMsgWizardPage;
  CountySelectionPage: TInputOptionWizardPage;
  DatabasePage: TInputQueryWizardPage;
  PACSPage: TInputQueryWizardPage;
  SecurityPage: TInputQueryWizardPage;

procedure InitializeWizard();
begin
  SetupWizardPage := CreateOutputMsgPage(wpWelcome,
    'Welcome to TerraFusion OS 1.0', 
    'Government AI Operating System',
    'This wizard will guide you through the installation and configuration of TerraFusion OS 1.0 for Benton County, Washington.' + #13#10 + #13#10 +
    'TerraFusion OS 1.0 is a comprehensive government AI operating system that provides:' + #13#10 +
    '• Real-time data integration with Harris PACS' + #13#10 +
    '• AI-powered property assessment and analytics' + #13#10 +
    '• Government-grade security and compliance' + #13#10 +
    '• 1,008 AI agents for intelligent automation' + #13#10 +
    '• Enterprise monitoring and management tools');

  CountySelectionPage := CreateInputOptionPage(SetupWizardPage.ID,
    'County Configuration',
    'Select your county',
    'Please select the county for this TerraFusion OS 1.0 installation:',
    True, False);
  CountySelectionPage.Add('Benton County, Washington');
  CountySelectionPage.Add('Clark County, Washington');
  CountySelectionPage.Add('Yakima County, Washington');
  CountySelectionPage.Add('Cowlitz County, Washington');
  CountySelectionPage.Values[0] := True;

  DatabasePage := CreateInputQueryPage(CountySelectionPage.ID,
    'Database Configuration',
    'Configure PostgreSQL Database',
    'Please provide the database connection details:');
  DatabasePage.Add('Database Host:', False);
  DatabasePage.Add('Database Port:', False);
  DatabasePage.Add('Database Name:', False);
  DatabasePage.Add('Database Username:', False);
  DatabasePage.Add('Database Password:', True);
  DatabasePage.Values[0] := 'localhost';
  DatabasePage.Values[1] := '5432';
  DatabasePage.Values[2] := 'terrafusion_benton_production';
  DatabasePage.Values[3] := 'terrafusion_db';

  PACSPage := CreateInputQueryPage(DatabasePage.ID,
    'Harris PACS Integration',
    'Configure Harris PACS Connection',
    'Please provide the Harris PACS connection details:');
  PACSPage.Add('PACS Connection String:', False);
  PACSPage.Add('PACS API Endpoint:', False);
  PACSPage.Add('PACS API Key:', True);

  SecurityPage := CreateInputQueryPage(PACSPage.ID,
    'Security Configuration',
    'Configure SSO and Security',
    'Please provide the security configuration details:');
  SecurityPage.Add('Azure AD Tenant ID:', False);
  SecurityPage.Add('Azure AD Client ID:', False);
  SecurityPage.Add('Azure AD Client Secret:', True);
  SecurityPage.Add('JWT Secret Key:', True);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  
  if CurPageID = SetupWizardPage.ID then
  begin
    // Validate setup wizard
    Result := True;
  end
  else if CurPageID = CountySelectionPage.ID then
  begin
    // Validate county selection
    Result := True;
  end
  else if CurPageID = DatabasePage.ID then
  begin
    // Validate database configuration
    if (DatabasePage.Values[0] = '') or (DatabasePage.Values[2] = '') or (DatabasePage.Values[3] = '') or (DatabasePage.Values[4] = '') then
    begin
      MsgBox('Please fill in all database configuration fields.', mbError, MB_OK);
      Result := False;
    end;
  end
  else if CurPageID = PACSPage.ID then
  begin
    // Validate PACS configuration
    if (PACSPage.Values[0] = '') or (PACSPage.Values[1] = '') or (PACSPage.Values[2] = '') then
    begin
      MsgBox('Please fill in all Harris PACS configuration fields.', mbError, MB_OK);
      Result := False;
    end;
  end
  else if CurPageID = SecurityPage.ID then
  begin
    // Validate security configuration
    if (SecurityPage.Values[0] = '') or (SecurityPage.Values[1] = '') or (SecurityPage.Values[2] = '') or (SecurityPage.Values[3] = '') then
    begin
      MsgBox('Please fill in all security configuration fields.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Create configuration file with user inputs
    SaveStringToFile(ExpandConstant('{app}\config\terrafusion.ini'),
      '[County]' + #13#10 +
      'Name=' + CountySelectionPage.Values[0] + #13#10 +
      'State=Washington' + #13#10 +
      #13#10 +
      '[Database]' + #13#10 +
      'Host=' + DatabasePage.Values[0] + #13#10 +
      'Port=' + DatabasePage.Values[1] + #13#10 +
      'Name=' + DatabasePage.Values[2] + #13#10 +
      'Username=' + DatabasePage.Values[3] + #13#10 +
      'Password=' + DatabasePage.Values[4] + #13#10 +
      #13#10 +
      '[HarrisPACS]' + #13#10 +
      'ConnectionString=' + PACSPage.Values[0] + #13#10 +
      'ApiEndpoint=' + PACSPage.Values[1] + #13#10 +
      'ApiKey=' + PACSPage.Values[2] + #13#10 +
      #13#10 +
      '[Security]' + #13#10 +
      'AzureTenantId=' + SecurityPage.Values[0] + #13#10 +
      'AzureClientId=' + SecurityPage.Values[1] + #13#10 +
      'AzureClientSecret=' + SecurityPage.Values[2] + #13#10 +
      'JwtSecret=' + SecurityPage.Values[3] + #13#10,
      False);
  end;
end;
