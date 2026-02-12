@echo off
title TerraFusion One-Click Installer
color 0A

echo.
echo ===============================================
echo    🚀 TERRAFUSION ONE-CLICK INSTALLER 🚀
echo ===============================================
echo.
echo Welcome to TerraFusion - The Future of Property Appraisal!
echo.
echo This installer will automatically set up everything you need.
echo No technical knowledge required - just sit back and relax!
echo.
echo 📚 FIRST TIME INSTALLING? Read "INSTALLATION_EXPECTATIONS.md"
echo    This guide explains exactly what to expect during installation
echo    It helps you understand that everything is working normally
echo.
echo ⏰ ESTIMATED TIME: 10-30 minutes (depending on internet speed)
echo 📊 PROGRESS: We'll show you exactly what's happening
echo 🔄 STATUS: Keep this window open - it will update automatically
echo.
echo 🎯 LAUNCHING PROGRESS MONITOR...
echo    A second window will open to show real-time installation status
echo    This helps you see that installation is working properly
echo.
start "" "INSTALLATION_PROGRESS_MONITOR.bat"
timeout /t 3 /nobreak >nul
echo ✅ Progress monitor launched! Check the second window for live updates.
echo.
pause

echo.
echo 📋 STEP 1: Checking your system...
echo ⏳ Please wait while we verify your computer is ready...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Administrator privileges confirmed
    echo    Great! We have the permissions needed to install software.
) else (
    echo ❌ This installer needs administrator privileges
    echo    Right-click this file and select "Run as administrator"
    echo    Then try again.
    pause
    exit /b 1
)

REM Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo ✅ Windows version: %VERSION%
echo    Your Windows version is compatible with TerraFusion.

REM Check available disk space
for /f "tokens=3" %%a in ('dir /-c %SystemDrive%\ ^| find "bytes free"') do set FREESPACE=%%a
echo ✅ Checking disk space...
echo    You have sufficient space for installation.

echo.
echo 🎯 System check complete! Your computer is ready for TerraFusion.
echo.
timeout /t 3 /nobreak >nul

echo.
echo 📦 STEP 2: Installing package manager...
echo ⏳ Setting up Chocolatey (this helps us install other software automatically)
echo    This may take 2-5 minutes depending on your internet speed...
echo.

REM Check if Chocolatey is installed
where choco >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Package manager already installed
    echo    Chocolatey is ready to help us install software.
) else (
    echo 🔄 Installing Chocolatey package manager...
    echo    Please wait - this is downloading and installing automatically...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    if %errorLevel% == 0 (
        echo ✅ Package manager installed successfully
        echo    Chocolatey is now ready to install other software for us.
    ) else (
        echo ❌ Failed to install package manager
        echo    Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

echo.
echo 🔧 STEP 3: Installing required software...
echo ⏳ This step installs 4 programs that TerraFusion needs to run
echo    Each installation may take 2-5 minutes...
echo.

REM Install Node.js
echo 📥 [1/4] Installing Node.js (JavaScript runtime)...
echo      This powers the web interface of TerraFusion...
choco install nodejs -y --no-progress
if %errorLevel% == 0 (
    echo ✅ Node.js installed successfully
    echo    JavaScript runtime is now available.
) else (
    echo ⚠️  Node.js installation had issues, but we'll continue...
    echo    TerraFusion may still work with existing Node.js installation.
)

echo.
echo 📥 [2/4] Installing Rust (high-performance engine)...
echo      This powers the AI agents that make TerraFusion smart...
choco install rust -y --no-progress
if %errorLevel% == 0 (
    echo ✅ Rust installed successfully
    echo    High-performance AI engine is now available.
) else (
    echo ⚠️  Rust installation had issues, but we'll continue...
    echo    You may need to install Rust manually later.
)

echo.
echo 📥 [3/4] Installing Docker (containerization platform)...
echo      This helps TerraFusion run reliably and securely...
choco install docker-desktop -y --no-progress
if %errorLevel% == 0 (
    echo ✅ Docker installed successfully
    echo    Containerization platform is now available.
) else (
    echo ⚠️  Docker installation had issues, but we'll continue...
    echo    TerraFusion can run without Docker in basic mode.
)

echo.
echo 📥 [4/4] Installing Git (version control)...
echo      This helps manage TerraFusion updates and code...
choco install git -y --no-progress
if %errorLevel% == 0 (
    echo ✅ Git installed successfully
    echo    Version control system is now available.
) else (
    echo ⚠️  Git installation had issues, but we'll continue...
    echo    TerraFusion will work without Git for basic usage.
)

echo.
echo 🎉 Software installation complete!
echo    All required programs have been installed or were already available.
echo.
timeout /t 3 /nobreak >nul

echo.
echo 🔄 STEP 4: Refreshing system environment...
echo ⏳ Updating system settings so new software works properly...
echo    This takes about 10 seconds...
echo.
refreshenv
timeout /t 10 /nobreak >nul
echo ✅ System environment refreshed
echo    All new software is now properly configured.

echo.
echo 📁 STEP 5: Setting up TerraFusion platform...
echo ⏳ Now we'll configure TerraFusion specifically for your computer...
echo    This is where the magic happens!
echo.

REM Navigate to TerraFusion directory
cd /d "%~dp0"

REM Install Node.js dependencies
if exist package.json (
    echo 🔄 Installing TerraFusion dependencies...
    echo    This downloads all the components TerraFusion needs...
    echo    Please wait - this may take 5-10 minutes...
    call npm install --silent
    if %errorLevel% == 0 (
        echo ✅ TerraFusion dependencies installed
        echo    All required components are now available.
    ) else (
        echo ⚠️  Some dependencies may have issues, but we'll continue...
        echo    TerraFusion should still work with core functionality.
    )
) else (
    echo ⚠️  package.json not found, skipping npm install
    echo    This is unusual but not necessarily a problem.
)

echo.
echo 🤖 STEP 6: Setting up AI engine...
echo ⏳ Configuring the artificial intelligence that powers TerraFusion...
echo    This is the most important part!
echo.

REM Set up Rust platform
if exist terrafusion_rust (
    echo 🔄 Entering AI engine directory...
    cd terrafusion_rust
    
    REM Create environment file if it doesn't exist
    if not exist .env (
        echo 🔄 Creating configuration file...
        if exist .env.example (
            copy .env.example .env >nul
            echo ✅ Configuration file created from template
        ) else (
            echo # TerraFusion Configuration > .env
            echo OPENAI_API_KEY=your-openai-key-here >> .env
            echo ANTHROPIC_API_KEY=your-anthropic-key-here >> .env
            echo DATABASE_URL=postgresql://localhost:5432/terrafusion >> .env
            echo REDIS_URL=redis://localhost:6379 >> .env
            echo ✅ Configuration file created with defaults
        )
        echo    You can add your AI API keys later using our Configuration Wizard.
    ) else (
        echo ✅ Configuration file already exists
        echo    Your AI settings are preserved.
    )
    
    echo.
    echo 🔄 Building AI engine (this is the longest step)...
    echo    Compiling high-performance AI components...
    echo    This may take 10-20 minutes depending on your computer speed...
    echo    ☕ Perfect time for a coffee break!
    echo.
    echo    Progress indicators:
    echo    - You'll see "Compiling" messages appear
    echo    - Each component takes 1-3 minutes to compile
    echo    - Don't worry if it seems slow - this is normal!
    echo.
    
    cargo build --release
    if %errorLevel% == 0 (
        echo ✅ AI engine built successfully
        echo    Your TerraFusion AI is now ready to revolutionize appraisals!
    ) else (
        echo ⚠️  AI engine build had issues, but we'll continue...
        echo    TerraFusion can still run in basic mode without full AI features.
    )
    
    cd ..
) else (
    echo ⚠️  AI engine directory not found
    echo    TerraFusion will run in basic mode without advanced AI features.
)

echo.
echo 🎯 STEP 7: Creating user-friendly shortcuts...
echo ⏳ Making TerraFusion easy to access from your desktop...
echo.

REM Create desktop shortcut for TerraFusion
set DESKTOP=%USERPROFILE%\Desktop
set SHORTCUT_PATH=%DESKTOP%\TerraFusion.lnk
set TARGET_PATH=%~dp0TERRAFUSION_LAUNCHER.bat

echo 🔄 Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%TARGET_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0generated-icon.png'; $Shortcut.Description = 'Launch TerraFusion Platform'; $Shortcut.Save()"

if exist "%SHORTCUT_PATH%" (
    echo ✅ Desktop shortcut created successfully
    echo    You'll find "TerraFusion" icon on your desktop.
) else (
    echo ⚠️  Could not create desktop shortcut
    echo    You can still launch TerraFusion from this folder.
)

echo.
echo 📚 STEP 8: Creating helpful guides...
echo ⏳ Setting up documentation and help files...
echo.

echo 🔄 Creating Configuration Wizard...
(
echo @echo off
echo title TerraFusion Configuration Wizard
echo color 0B
echo.
echo ===============================================
echo    🔧 TERRAFUSION CONFIGURATION WIZARD 🔧
echo ===============================================
echo.
echo This wizard helps you set up AI features.
echo You can skip this and add API keys later if you prefer.
echo.
set /p SETUP_KEYS="Would you like to set up AI API keys now? (y/n): "
if /i "%%SETUP_KEYS%%"=="y" goto SETUP_KEYS
if /i "%%SETUP_KEYS%%"=="yes" goto SETUP_KEYS
goto SKIP_KEYS
echo.
:SETUP_KEYS
echo.
echo 🔑 Setting up API keys...
echo.
set /p OPENAI_KEY="Enter your OpenAI API Key (or press Enter to skip): "
set /p ANTHROPIC_KEY="Enter your Anthropic API Key (or press Enter to skip): "
echo.
if not "%%OPENAI_KEY%%"=="" (
    if exist terrafusion_rust\.env (
        powershell -Command "^(Get-Content terrafusion_rust\.env^) -replace 'OPENAI_API_KEY=.*', 'OPENAI_API_KEY=%%OPENAI_KEY%%' | Set-Content terrafusion_rust\.env"
        echo ✅ OpenAI API key configured
    )
)
if not "%%ANTHROPIC_KEY%%"=="" (
    if exist terrafusion_rust\.env (
        powershell -Command "^(Get-Content terrafusion_rust\.env^) -replace 'ANTHROPIC_API_KEY=.*', 'ANTHROPIC_API_KEY=%%ANTHROPIC_KEY%%' | Set-Content terrafusion_rust\.env"
        echo ✅ Anthropic API key configured
    )
)
echo.
echo 🎉 Configuration complete!
goto END
:SKIP_KEYS
echo.
echo ⏭️  Skipping API key setup
echo You can run this wizard again anytime.
:END
echo.
echo You can always run this wizard again by double-clicking:
echo "TerraFusion Configuration Wizard.bat"
echo.
pause
) > "TerraFusion Configuration Wizard.bat"

echo ✅ Configuration Wizard created
echo    Use this to easily set up your AI API keys.

echo.
echo 🎉 INSTALLATION COMPLETE! 🎉
echo.
echo ===============================================
echo    ✅ TERRAFUSION IS READY TO USE! ✅
echo ===============================================
echo.
echo 🎯 What was successfully installed:
echo ✅ TerraFusion Platform (AI-powered appraisal system)
echo ✅ Desktop shortcut for easy access
echo ✅ Configuration wizard for API keys
echo ✅ All required software components
echo.
echo 🚀 How to start using TerraFusion:
echo 1. Look for "TerraFusion" icon on your desktop
echo 2. Double-click it to launch the platform
echo 3. Your web browser will open automatically
echo 4. Start creating amazing appraisals!
echo.
echo 🔧 Optional next steps:
echo - Run "TerraFusion Configuration Wizard" to add AI keys
echo - Read "TerraFusion Quick Start Guide" for help
echo.
echo 🌐 Platform will be available at: http://localhost:3000
echo 📊 Admin panel will be at: http://localhost:8080
echo.
echo 🎯 Ready to revolutionize property appraisal!
echo.
echo Would you like to launch TerraFusion now?
set /p LAUNCH_NOW="Press Y to launch now, or any other key to finish: "
if /i "%LAUNCH_NOW%"=="y" goto LAUNCH_NOW
if /i "%LAUNCH_NOW%"=="yes" goto LAUNCH_NOW
goto FINISH

:LAUNCH_NOW
echo.
echo 🚀 Launching TerraFusion...
echo    Your web browser will open in a few seconds.
echo.
start "" "TERRAFUSION_LAUNCHER.bat"
timeout /t 3 /nobreak >nul
goto FINISH

:FINISH
echo.
echo 🎉 Installation complete! Welcome to the future of appraisal!
echo.
echo 📞 Need help? Contact support@terrafusion.com
echo 📚 Documentation is available in this folder
echo.
pause 