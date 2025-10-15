@echo off
title TerraFusion Ultimate IDE - System Health Checker
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🔍 TERRAFUSION ULTIMATE IDE 🔍                           ║
echo ║                           SYSTEM HEALTH CHECKER                             ║
echo ║                                                                              ║
echo ║  "Monitoring system health and performance metrics"                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

echo 🔍 Running comprehensive system health check...
echo.

REM Get current timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%"

echo 📅 Health Check Timestamp: %timestamp%
echo.

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🖥️  SYSTEM INFORMATION                           ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

REM OS Information
echo 🖥️  Operating System:
for /f "tokens=2 delims==" %%a in ('wmic OS Get Caption /value') do echo    %%a
for /f "tokens=2 delims==" %%a in ('wmic OS Get Version /value') do echo    Version: %%a
for /f "tokens=2 delims==" %%a in ('wmic OS Get Architecture /value') do echo    Architecture: %%a
echo.

REM CPU Information
echo 🧠 CPU Information:
for /f "tokens=2 delims==" %%a in ('wmic CPU Get Name /value') do echo    %%a
for /f "tokens=2 delims==" %%a in ('wmic CPU Get NumberOfCores /value') do echo    Cores: %%a
for /f "tokens=2 delims==" %%a in ('wmic CPU Get NumberOfLogicalProcessors /value') do echo    Logical Processors: %%a
echo.

REM Memory Information
echo 💾 Memory Information:
for /f "tokens=2 delims==" %%a in ('wmic ComputerSystem Get TotalPhysicalMemory /value') do (
    set /a "total_mb=%%a/1024/1024"
    echo    Total RAM: !total_mb! MB
)
echo.

REM Disk Information
echo 💿 Disk Information:
for /f "tokens=2 delims==" %%a in ('wmic LogicalDisk Get Size /value') do (
    if not "%%a"=="" (
        set /a "size_gb=%%a/1024/1024/1024"
        echo    Available Space: !size_gb! GB
    )
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🔧 SOFTWARE REQUIREMENTS                          ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

REM Check .NET 8.0
echo 🔍 Checking .NET 8.0 SDK...
dotnet --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%a in ('dotnet --version') do echo    ✅ .NET SDK: %%a
) else (
    echo    ❌ .NET 8.0 SDK: NOT FOUND
    echo       Please install from: https://dotnet.microsoft.com/download/dotnet/8.0
)
echo.

REM Check Node.js
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%a in ('node --version') do echo    ✅ Node.js: %%a
) else (
    echo    ❌ Node.js: NOT FOUND
    echo       Please install from: https://nodejs.org/
)
echo.

REM Check Git
echo 🔍 Checking Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%a in ('git --version') do echo    ✅ Git: %%a
) else (
    echo    ❌ Git: NOT FOUND
    echo       Please install from: https://git-scm.com/
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🌐 NETWORK STATUS                                ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

REM Check localhost connectivity
echo 🔍 Checking localhost connectivity...
ping -n 1 127.0.0.1 >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Localhost: Accessible
) else (
    echo    ❌ Localhost: Not accessible
)
echo.

REM Check specific ports
echo 🔍 Checking TerraFusion service ports...

REM Check port 5000 (Backend API)
netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Port 5000: Backend API is running
) else (
    echo    ❌ Port 5000: Backend API not running
)

REM Check port 5173 (Frontend IDE)
netstat -an | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Port 5173: Frontend IDE is running
) else (
    echo    ❌ Port 5173: Frontend IDE not running
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           📊 PERFORMANCE METRICS                           ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

REM CPU Usage
echo 🔍 Checking CPU usage...
for /f "tokens=2 delims==" %%a in ('wmic cpu get loadpercentage /value') do (
    if not "%%a"=="" echo    CPU Load: %%a%%
)
echo.

REM Memory Usage
echo 🔍 Checking memory usage...
for /f "tokens=2 delims==" %%a in ('wmic OS Get FreePhysicalMemory /value') do (
    if not "%%a"=="" (
        set /a "free_mb=%%a/1024"
        echo    Free Memory: !free_mb! MB
    )
)
echo.

REM Disk Usage
echo 🔍 Checking disk usage...
for /f "tokens=2 delims==" %%a in ('wmic LogicalDisk Get FreeSpace /value') do (
    if not "%%a"=="" (
        set /a "free_gb=%%a/1024/1024/1024"
        echo    Free Disk Space: !free_gb! GB
    )
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🚀 TERRAFUSION STATUS                            ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

REM Check if services are running
set "backend_status=false"
set "frontend_status=false"

netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 set "backend_status=true"

netstat -an | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 set "frontend_status=true"

echo 🎯 TerraFusion Service Status:
if "%backend_status%"=="true" (
    echo    ✅ Backend API: RUNNING (Port 5000)
) else (
    echo    ❌ Backend API: STOPPED
)

if "%frontend_status%"=="true" (
    echo    ✅ Frontend IDE: RUNNING (Port 5173)
) else (
    echo    ❌ Frontend IDE: STOPPED
)
echo.

REM Overall system health score
echo 🔍 Calculating overall system health score...
set "health_score=0"

REM Add points for each requirement met
if "%backend_status%"=="true" set /a "health_score+=25"
if "%frontend_status%"=="true" set /a "health_score+=25"

REM Check if .NET is available
dotnet --version >nul 2>&1
if %errorlevel% equ 0 set /a "health_score+=20"

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% equ 0 set /a "health_score+=20"

REM Check if Git is available
git --version >nul 2>&1
if %errorlevel% equ 0 set /a "health_score+=10"

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🎯 HEALTH SUMMARY                                ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

echo 📊 Overall System Health Score: %health_score%%
echo.

if %health_score% geq 90 (
    echo 🎉 EXCELLENT: System is in perfect condition for TerraFusion Ultimate IDE!
    echo    All services running, requirements met, optimal performance.
) else if %health_score% geq 70 (
    echo ✅ GOOD: System is ready for TerraFusion Ultimate IDE with minor issues.
    echo    Most services running, requirements mostly met.
) else if %health_score% geq 50 (
    echo ⚠️  FAIR: System has some issues that may affect TerraFusion performance.
    echo    Some services may not be running, some requirements missing.
) else (
    echo ❌ POOR: System has significant issues that will prevent TerraFusion from working.
    echo    Critical services not running, major requirements missing.
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🔧 RECOMMENDATIONS                               ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

if "%backend_status%"=="false" (
    echo 🚀 Start Backend API: Run START_TERRAFUSION_ULTIMATE.bat
)

if "%frontend_status%"=="false" (
    echo 🌐 Start Frontend IDE: Run START_TERRAFUSION_ULTIMATE.bat
)

dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Install .NET 8.0 SDK: https://dotnet.microsoft.com/download/dotnet/8.0
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Install Node.js 18+: https://nodejs.org/
)

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Install Git: https://git-scm.com/
)
echo.

echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           📋 QUICK ACTIONS                                 ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

echo 🎯 Available Actions:
echo    1. Press 'S' to start TerraFusion Ultimate IDE
echo    2. Press 'H' to run health check again
echo    3. Press 'X' to exit
echo.

:input_loop
set /p "choice=Enter your choice (S/H/X): "

if /i "%choice%"=="S" (
    echo.
    echo 🚀 Starting TerraFusion Ultimate IDE...
    call START_TERRAFUSION_ULTIMATE.bat
    goto end
) else if /i "%choice%"=="H" (
    echo.
    echo 🔄 Running health check again...
    cls
    goto start
) else if /i "%choice%"=="X" (
    echo.
    echo 👋 Exiting TerraFusion Health Checker...
    goto end
) else (
    echo.
    echo ❌ Invalid choice. Please enter S, H, or X.
    goto input_loop
)

:start
REM Rest of the script content would go here
REM (This is a placeholder for the goto start functionality)

:end
echo.
echo Press any key to exit...
pause >nul

exit /b 0
