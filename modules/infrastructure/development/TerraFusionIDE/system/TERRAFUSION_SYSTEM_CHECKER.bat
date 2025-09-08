@echo off
setlocal enabledelayedexpansion

:: TerraFusion IDE ULTIMATE POWER - Enterprise System Checker
:: Comprehensive system diagnostics and health monitoring

:: Set console title
title TerraFusion IDE ULTIMATE POWER - Enterprise System Checker

:: Clear screen and show checker
cls
echo.
echo ========================================
echo 🔍 TERRAFUSION SYSTEM CHECKER 🔍
echo ========================================
echo 🌟 Enterprise-Level System Diagnostics
echo 🌟 Comprehensive Health Monitoring
echo 🌟 Government Compliance Validation
echo.

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Administrator privileges confirmed
    echo 🌟 Full system access available
) else (
    echo ⚠️  Running with standard privileges
    echo 🌟 Some checks may be limited
)
echo.

:: System Information
echo [1/8] 💻 System Information...
echo.

:: Windows Version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo 🌟 Windows Version: %VERSION%

:: System Architecture
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    echo 🌟 System Architecture: 64-bit (x64)
) else (
    echo 🌟 System Architecture: 32-bit (x86)
)

:: Computer Name
echo 🌟 Computer Name: %COMPUTERNAME%

:: User Name
echo 🌟 Current User: %USERNAME%

:: Domain/Workgroup
echo 🌟 Domain/Workgroup: %USERDOMAIN%

echo ✅ System information collected
echo.

:: Hardware Specifications
echo [2/8] 🔧 Hardware Specifications...
echo.

:: CPU Information
for /f "tokens=2 delims==" %%a in ('wmic cpu get Name /value') do set CPU_NAME=%%a
for /f "tokens=2 delims==" %%a in ('wmic cpu get NumberOfCores /value') do set CPU_CORES=%%a
for /f "tokens=2 delims==" %%a in ('wmic cpu get NumberOfLogicalProcessors /value') do set CPU_THREADS=%%a
for /f "tokens=2 delims==" %%a in ('wmic cpu get MaxClockSpeed /value') do set CPU_SPEED=%%a

echo 🌟 CPU: %CPU_NAME%
echo 🌟 Cores: %CPU_CORES% Physical, %CPU_THREADS% Logical
echo 🌟 Max Speed: %CPU_SPEED% MHz

:: RAM Information
for /f "tokens=2 delims==" %%a in ('wmic computersystem get TotalPhysicalMemory /value') do set RAM=%%a
set /a RAMGB=%RAM:~0,-1%/1073741824
echo 🌟 Total RAM: %RAMGB% GB

:: Disk Information
for /f "tokens=3 delims= " %%a in ('dir C:\ /-c ^| find "bytes free"') do set FREESPACE=%%a
set /a FREESPACE=%FREESPACE:,=%
set /a FREESPACEGB=%FREESPACE%/1073741824
echo 🌟 Available Disk Space: %FREESPACEGB% GB

echo ✅ Hardware specifications collected
echo.

:: TerraFusion IDE Installation Status
echo [3/8] 🚀 TerraFusion IDE Installation Status...
echo.

if exist "C:\TerraFusion\IDE\src\components\TerraFusionIDE_ULTIMATE_POWER.tsx" (
    echo ✅ TerraFusion IDE Core: INSTALLED
    echo 🌟 Location: C:\TerraFusion\IDE\
    
    :: Check IDE files
    if exist "C:\TerraFusion\IDE\src\main-ultimate.tsx" (
        echo ✅ Main Entry Point: PRESENT
    ) else (
        echo ❌ Main Entry Point: MISSING
    )
    
    if exist "C:\TerraFusion\IDE\src\index-ultimate.css" (
        echo ✅ Ultimate Styling: PRESENT
    ) else (
        echo ❌ Ultimate Styling: MISSING
    )
    
    if exist "C:\TerraFusion\IDE\docs" (
        echo ✅ Documentation: PRESENT
    ) else (
        echo ❌ Documentation: MISSING
    )
) else (
    echo ❌ TerraFusion IDE Core: NOT INSTALLED
    echo 🌟 Please run the installer first
)

echo.

:: Dependencies Status
echo [4/8] 📦 Dependencies Status...
echo.

:: Node.js
if exist "C:\Program Files\nodejs\node.exe" (
    for /f "tokens=*" %%i in ('"C:\Program Files\nodejs\node.exe" --version') do set NODE_VERSION=%%i
    echo ✅ Node.js: %NODE_VERSION% - INSTALLED
    
    :: Check npm
    if exist "C:\Program Files\nodejs\npm.cmd" (
        for /f "tokens=*" %%i in ('"C:\Program Files\nodejs\npm.cmd" --version') do set NPM_VERSION=%%i
        echo ✅ npm: %NPM_VERSION% - INSTALLED
    ) else (
        echo ❌ npm: NOT FOUND
    )
) else (
    echo ❌ Node.js: NOT INSTALLED
)

:: Git
if exist "C:\Program Files\Git\bin\git.exe" (
    for /f "tokens=*" %%i in ('"C:\Program Files\Git\bin\git.exe" --version') do set GIT_VERSION=%%i
    echo ✅ Git: %GIT_VERSION% - INSTALLED
) else (
    echo ❌ Git: NOT INSTALLED
)

:: PostgreSQL
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo ✅ PostgreSQL 15: INSTALLED
    
    :: Check PostGIS
    "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -c "SELECT PostGIS_Version();" >nul 2>&1
    if %errorLevel% == 0 (
        echo ✅ PostGIS Extension: ACTIVE
    ) else (
        echo ❌ PostGIS Extension: NOT ACTIVE
    )
) else (
    echo ❌ PostgreSQL: NOT INSTALLED
)

:: Docker
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo ✅ Docker Desktop: INSTALLED
    
    :: Check Docker service
    sc query "com.docker.service" >nul 2>&1
    if %errorLevel% == 0 (
        echo ✅ Docker Service: RUNNING
    ) else (
        echo ❌ Docker Service: NOT RUNNING
    )
) else (
    echo ❌ Docker Desktop: NOT INSTALLED
)

echo.

:: System Services Status
echo [5/8] 🔧 System Services Status...
echo.

:: Check TerraFusion IDE Service
sc query "TerraFusionIDEService" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ TerraFusion IDE Service: REGISTERED
) else (
    echo ❌ TerraFusion IDE Service: NOT REGISTERED
)

:: Check PostgreSQL Service
sc query "postgresql-x64-15" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ PostgreSQL Service: REGISTERED
) else (
    echo ❌ PostgreSQL Service: NOT REGISTERED
)

:: Check Docker Service
sc query "com.docker.service" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Docker Service: REGISTERED
) else (
    echo ❌ Docker Service: NOT REGISTERED
)

echo.

:: Desktop Integration Status
echo [6/8] 🖥️  Desktop Integration Status...
echo.

:: Check Desktop Shortcut
if exist "%USERPROFILE%\Desktop\TerraFusion IDE ULTIMATE POWER.lnk" (
    echo ✅ Desktop Shortcut: PRESENT
) else (
    echo ❌ Desktop Shortcut: MISSING
)

:: Check Start Menu Entry
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\TerraFusion" (
    echo ✅ Start Menu Entry: PRESENT
) else (
    echo ❌ Start Menu Entry: MISSING
)

:: Check File Associations
assoc .tf >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ File Association (.tf): ACTIVE
) else (
    echo ❌ File Association (.tf): NOT ACTIVE
)

echo.

:: Environment Variables Status
echo [7/8] 🌍 Environment Variables Status...
echo.

:: Check TerraFusion environment variables
echo %TERRAFUSION_IDE_PATH% | find "C:\TerraFusion\IDE" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ TERRAFUSION_IDE_PATH: SET
) else (
    echo ❌ TERRAFUSION_IDE_PATH: NOT SET
)

echo %TERRAFUSION_AI_SWARM% | find "1008" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ TERRAFUSION_AI_SWARM: SET
) else (
    echo ❌ TERRAFUSION_AI_SWARM: NOT SET
)

echo %TERRAFUSION_COMPLIANCE% | find "FISMA_NIST_508" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ TERRAFUSION_COMPLIANCE: SET
) else (
    echo ❌ TERRAFUSION_COMPLIANCE: NOT SET
)

echo.

:: Registry Integration Status
echo [8/8] 🗄️  Registry Integration Status...
echo.

:: Check TerraFusion registry entries
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\TerraFusion\IDE" >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ TerraFusion Registry: PRESENT
    
    :: Check specific registry values
    reg query "HKEY_LOCAL_MACHINE\SOFTWARE\TerraFusion\IDE" /v "Version" >nul 2>&1
    if %errorLevel% == 0 (
        echo ✅ Version Registry: PRESENT
    ) else (
        echo ❌ Version Registry: MISSING
    )
    
    reg query "HKEY_LOCAL_MACHINE\SOFTWARE\TerraFusion\IDE" /v "AI_Swarm_Agents" >nul 2>&1
    if %errorLevel% == 0 (
        echo ✅ AI Swarm Registry: PRESENT
    ) else (
        echo ❌ AI Swarm Registry: MISSING
    )
) else (
    echo ❌ TerraFusion Registry: NOT PRESENT
)

echo.

:: System Health Summary
echo ========================================
echo 🎯 SYSTEM HEALTH SUMMARY 🎯
echo ========================================
echo.

:: Count issues
set ISSUES=0
set WARNINGS=0

:: Check for critical issues
if not exist "C:\TerraFusion\IDE\src\components\TerraFusionIDE_ULTIMATE_POWER.tsx" set /a ISSUES+=1
if not exist "C:\Program Files\nodejs\node.exe" set /a ISSUES+=1
if not exist "C:\Program Files\Git\bin\git.exe" set /a ISSUES+=1
if not exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" set /a ISSUES+=1

:: Check for warnings
if %RAMGB% LSS 16 set /a WARNINGS+=1
if %FREESPACEGB% LSS 50 set /a WARNINGS+=1

:: Display summary
if %ISSUES% == 0 (
    if %WARNINGS% == 0 (
        echo 🟢 SYSTEM STATUS: EXCELLENT
        echo 🌟 All components operational
        echo 🌟 Ready for enterprise development
    ) else (
        echo 🟡 SYSTEM STATUS: GOOD
        echo 🌟 All critical components operational
        echo ⚠️  %WARNINGS% warning(s) detected
    )
) else (
    echo 🔴 SYSTEM STATUS: ISSUES DETECTED
    echo ❌ %ISSUES% critical issue(s) found
    echo ⚠️  %WARNINGS% warning(s) detected
    echo 🌟 Please resolve issues before proceeding
)

echo.

:: Recommendations
echo 🌟 RECOMMENDATIONS:
echo.

if not exist "C:\TerraFusion\IDE\src\components\TerraFusionIDE_ULTIMATE_POWER.tsx" (
    echo 🔧 Run TerraFusion IDE ULTIMATE POWER installer
)

if not exist "C:\Program Files\nodejs\node.exe" (
    echo 📦 Install Node.js Enterprise (LTS)
)

if not exist "C:\Program Files\Git\bin\git.exe" (
    echo 🔧 Install Git Enterprise
)

if not exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo 🗄️ Install PostgreSQL Enterprise + PostGIS
)

if %RAMGB% LSS 16 (
    echo ⚠️  Consider upgrading to 16GB+ RAM for optimal performance
)

if %FREESPACEGB% LSS 50 (
    echo ⚠️  Consider freeing up disk space (recommended: 50GB+)
)

echo.

:: Export Report
echo 🌟 Exporting system health report...
set REPORT_FILE="%USERPROFILE%\Desktop\TerraFusion_System_Report_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt"
set REPORT_FILE=%REPORT_FILE: =0%

echo TerraFusion IDE ULTIMATE POWER - System Health Report > %REPORT_FILE%
echo Generated: %date% %time% >> %REPORT_FILE%
echo ======================================== >> %REPORT_FILE%
echo. >> %REPORT_FILE%

:: Add all collected information to report
echo System Information: >> %REPORT_FILE%
echo Windows Version: %VERSION% >> %REPORT_FILE%
echo Computer Name: %COMPUTERNAME% >> %REPORT_FILE%
echo Current User: %USERNAME% >> %REPORT_FILE%
echo. >> %REPORT_FILE%

echo Hardware Specifications: >> %REPORT_FILE%
echo CPU: %CPU_NAME% >> %REPORT_FILE%
echo Cores: %CPU_CORES% Physical, %CPU_THREADS% Logical >> %REPORT_FILE%
echo RAM: %RAMGB% GB >> %REPORT_FILE%
echo Available Disk: %FREESPACEGB% GB >> %REPORT_FILE%
echo. >> %REPORT_FILE%

echo ✅ System health report exported to: %REPORT_FILE%
echo.

:: Final Status
echo ========================================
echo 🎯 SYSTEM CHECK COMPLETE 🎯
echo ========================================
echo.
echo 🌟 TerraFusion IDE ULTIMATE POWER system diagnostics finished
echo 🌟 Report exported to your desktop for reference
echo.
echo 🚀 Ready to launch your enterprise development environment?
echo 🌟 Run the launcher when you're ready to begin
echo.
pause
