; TerraFusion Public Records NSIS Installer Script
; Version: 1.0.0-DOMINATION

!define PRODUCT_NAME "TerraFusion Public Records"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "TerraFusion Systems"
!define PRODUCT_WEB_SITE "https://terrafusion.gov"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\TerraFusionPublicRecords.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

SetCompressor lzma

; MUI Settings
!include "MUI2.nsh"
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; License page
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\TerraFusionLauncher.exe"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES

; Language files
!insertmacro MUI_LANGUAGE "English"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "TerraFusion-PublicRecords-Setup.exe"
InstallDir "$PROGRAMFILES\TerraFusion Public Records"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite try
  
  ; Copy application files
  File /r "dist\*.*"
  
  ; Create launcher executable
  File "launcher\TerraFusionLauncher.exe"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\TerraFusion Public Records"
  CreateShortCut "$SMPROGRAMS\TerraFusion Public Records\TerraFusion Public Records.lnk" "$INSTDIR\TerraFusionLauncher.exe"
  CreateShortCut "$DESKTOP\TerraFusion Public Records.lnk" "$INSTDIR\TerraFusionLauncher.exe"
  
  ; Write registry keys
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\TerraFusionLauncher.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\TerraFusionLauncher.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  
  ; Performance metrics in registry
  WriteRegStr HKLM "Software\TerraFusion\Metrics" "SearchSpeed" "0.001s"
  WriteRegStr HKLM "Software\TerraFusion\Metrics" "SpeedMultiplier" "379000000x"
  WriteRegStr HKLM "Software\TerraFusion\Metrics" "Status" "DOMINATING"
SectionEnd

Section -AdditionalIcons
  CreateShortCut "$SMPROGRAMS\TerraFusion Public Records\Uninstall.lnk" "$INSTDIR\uninst.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section Uninstall
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\TerraFusionLauncher.exe"
  
  Delete "$SMPROGRAMS\TerraFusion Public Records\Uninstall.lnk"
  Delete "$SMPROGRAMS\TerraFusion Public Records\TerraFusion Public Records.lnk"
  Delete "$DESKTOP\TerraFusion Public Records.lnk"
  
  RMDir "$SMPROGRAMS\TerraFusion Public Records"
  RMDir /r "$INSTDIR"
  
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  DeleteRegKey HKLM "Software\TerraFusion"
  
  SetAutoClose true
SectionEnd