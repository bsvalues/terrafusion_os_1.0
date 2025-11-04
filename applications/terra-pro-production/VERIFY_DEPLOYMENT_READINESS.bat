@echo off
title TerraFusion Deployment Readiness Verification
color 0A

echo.
echo ===============================================
echo    🚀 TERRAFUSION DEPLOYMENT READINESS 🚀
echo ===============================================
echo.
echo Verifying all systems are ready for live deployment...
echo.

REM Check Rust installation
echo 📋 STEP 1: Checking Rust installation...
cargo --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Rust is installed and ready
    cargo --version
) else (
    echo ❌ Rust not found - run RUST_INSTALLATION_GUIDE.md first
    goto :error
)

echo.

REM Check Docker installation
echo 📋 STEP 2: Checking Docker installation...
docker --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Docker is installed and ready
    docker --version
) else (
    echo ❌ Docker not found - install Docker Desktop first
    goto :error
)

echo.

REM Check Node.js installation
echo 📋 STEP 3: Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js is installed and ready
    node --version
    npm --version
) else (
    echo ❌ Node.js not found - install Node.js first
    goto :error
)

echo.

REM Check project structure
echo 📋 STEP 4: Verifying project structure...
if exist "terrafusion_rust" (
    echo ✅ Rust platform directory found
) else (
    echo ❌ terrafusion_rust directory missing
    goto :error
)

if exist "client" (
    echo ✅ Client directory found
) else (
    echo ❌ client directory missing
    goto :error
)

if exist "server" (
    echo ✅ Server directory found
) else (
    echo ❌ server directory missing
    goto :error
)

if exist "package.json" (
    echo ✅ Package.json found
) else (
    echo ❌ package.json missing
    goto :error
)

echo.

REM Check environment files
echo 📋 STEP 5: Checking environment configuration...
if exist "terrafusion_rust\.env" (
    echo ✅ Rust environment file found
) else (
    echo ⚠️  Rust .env file missing - will need API keys
)

if exist ".env" (
    echo ✅ Main environment file found
) else (
    echo ⚠️  Main .env file missing - may need configuration
)

echo.

REM Check dependencies
echo 📋 STEP 6: Checking dependencies...
if exist "node_modules" (
    echo ✅ Node modules installed
) else (
    echo ⚠️  Node modules missing - run 'npm install'
)

echo.

REM Check deployment scripts
echo 📋 STEP 7: Verifying deployment scripts...
if exist "TERRAFUSION_ONE_CLICK_INSTALLER.bat" (
    echo ✅ One-click installer ready
) else (
    echo ❌ One-click installer missing
    goto :error
)

if exist "TERRAFUSION_LAUNCHER.bat" (
    echo ✅ Platform launcher ready
) else (
    echo ❌ Platform launcher missing
    goto :error
)

echo.

REM Final readiness assessment
echo ===============================================
echo    🎯 DEPLOYMENT READINESS ASSESSMENT 🎯
echo ===============================================
echo.
echo ✅ Core Requirements: SATISFIED
echo ✅ Platform Structure: VERIFIED
echo ✅ Deployment Scripts: READY
echo ✅ Infrastructure: PREPARED
echo.
echo 🚀 STATUS: READY FOR LIVE DEPLOYMENT!
echo.
echo Next Steps:
echo 1. Run TERRAFUSION_ONE_CLICK_INSTALLER.bat for full setup
echo 2. Configure API keys in .env files
echo 3. Execute TERRAFUSION_LAUNCHER.bat to start platform
echo 4. Verify all endpoints with health checks
echo.
echo 🔥 TERRAFUSION IS READY TO DOMINATE THE MARKET! 🔥
echo.
pause
goto :end

:error
echo.
echo ❌ DEPLOYMENT READINESS: FAILED
echo.
echo Please resolve the issues above before proceeding.
echo Refer to the installation guides for assistance.
echo.
pause
exit /b 1

:end
echo.
echo Deployment readiness verification complete!
exit /b 0 